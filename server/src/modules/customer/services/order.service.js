import mongoose from "mongoose";
import { Address } from "../../../models/address.model.js";
import { Order } from "../../../models/order.model.js";
import { OrderItem } from "../../../models/orderItem.model.js";
import { Product } from "../../../models/product.model.js";
import { CartItem } from "../../../models/cartItem.model.js";
import { User } from "../../../models/user.model.js";
import OrderStatus, { VALID_ORDER_TRANSITIONS } from "../../../domain/OrderStatus.js";
import PaymentStatus from "../../../domain/PaymentStatus.js";
import { emitOrderCreated, emitOrderStatusUpdated } from "../../../realtime/socket.js";
import { emailEvents } from "../../email/index.js";
import TaxService from "./tax.service.js";

class OrderService {
  /**
   * P0 — Checkout Transactional Integrity & Inventory Concurrency (Section 7, 8, 9, 10, 34)
   * Executes multi-write checkout atomically within MongoDB sessions (or transactional compensation rollback).
   * Revalidates price, variant attributes, and stock authoritatively against live catalog data.
   */
  async createOrder(user, shippingAddressData, cart, options = {}) {
    const userId = user._id || user;
    const clearCart = options.clearCart !== false;
    const emitEvents = options.emitEvents !== false;

    if (!cart.cartItems || cart.cartItems.length === 0) {
      throw new Error("Cart is empty. Cannot place an order.");
    }

    const session = await mongoose.startSession();
    let isTransactionActive = false;

    // Track deductions for compensation rollback if running on standalone MongoDB without replica set
    const appliedStockDeductions = [];
    const createdItemIds = [];
    const createdOrderIds = [];

    const executeCheckoutWrites = async (sessionOption = null) => {
      // 1. Resolve or create shipping address
      let shippingAddress = null;
      if (shippingAddressData._id) {
        shippingAddress = await Address.findById(
          shippingAddressData._id,
          null,
          sessionOption ? { session: sessionOption } : {}
        );
      }
      if (!shippingAddress) {
        const [newAddr] = await Address.create(
          [
            {
              ...shippingAddressData,
              user: userId,
            },
          ],
          sessionOption ? { session: sessionOption } : {}
        );
        shippingAddress = newAddr;
        await User.findByIdAndUpdate(
          userId,
          { $addToSet: { addresses: shippingAddress._id } },
          sessionOption ? { session: sessionOption } : {}
        );
      }

      // 2. Authoritative Price, Stock & Commercial Revalidation (Sections 13, 34, 35)
      // Never trust cart.sellingPrice, cart.mrpPrice or client payload
      const validatedItems = [];
      for (const item of cart.cartItems) {
        const prod = await Product.findById(
          item.product._id || item.product,
          null,
          sessionOption ? { session: sessionOption } : {}
        );
        if (!prod) {
          throw new Error(`Product "${item.product.title || item.product}" is no longer available.`);
        }

        let authoritativeSellingPrice = prod.sellingPrice;
        let authoritativeMrpPrice = prod.mrpPrice;
        let authoritativeSku = prod.sku;
        let authoritativeVariantTitle = "";
        let authoritativeSelectedAttributes = [];
        let authoritativeImage = prod.images?.[0] || "";

        if (item.variantId && prod.hasVariants) {
          const variant = prod.variants.id(item.variantId);
          if (!variant || variant.status !== "ACTIVE") {
            throw new Error(`Selected variant for "${prod.title}" is no longer active.`);
          }
          if (variant.countInStock < item.quantity) {
            throw new Error(
              `Insufficient stock for "${prod.title} (${variant.title})". Only ${variant.countInStock} available.`
            );
          }
          authoritativeSellingPrice = variant.sellingPrice;
          authoritativeMrpPrice = variant.mrpPrice;
          authoritativeSku = variant.sku;
          authoritativeVariantTitle = variant.title;
          authoritativeSelectedAttributes = variant.attributes || [];
          authoritativeImage = variant.images?.[0] || prod.images?.[0] || "";
        } else {
          if (prod.countInStock < item.quantity) {
            throw new Error(
              `Insufficient stock for "${prod.title}". Only ${prod.countInStock} available.`
            );
          }
        }

        const sellerId =
          prod.seller?._id?.toString() ||
          prod.seller?.toString() ||
          item.product.seller?._id?.toString() ||
          item.product.seller?.toString();

        if (!sellerId) {
          throw new Error(`Vendor identifier missing for product "${prod.title}"`);
        }

        validatedItems.push({
          rawCartItem: item,
          product: prod,
          sellerId,
          variantId: item.variantId || null,
          quantity: item.quantity,
          mrpPrice: authoritativeMrpPrice,
          sellingPrice: authoritativeSellingPrice,
          sku: authoritativeSku,
          variantTitle: authoritativeVariantTitle,
          selectedAttributes: authoritativeSelectedAttributes,
          image: authoritativeImage,
          size: item.size || "",
          ram: item.ram || "",
          weight: item.weight || "",
          capacity: item.capacity || "",
        });
      }

      // 3. Multi-Seller Grouping (Section 9)
      const itemsBySeller = validatedItems.reduce((acc, item) => {
        acc[item.sellerId] = acc[item.sellerId] || [];
        acc[item.sellerId].push(item);
        return acc;
      }, {});

      const resultOrders = [];

      // 4. Atomic inventory deduction & order persistence per vendor
      for (const [sellerId, vendorItems] of Object.entries(itemsBySeller)) {
        const totalSellingPrice = vendorItems.reduce(
          (sum, i) => sum + i.sellingPrice * i.quantity,
          0
        );
        const totalMrpPrice = vendorItems.reduce(
          (sum, i) => sum + i.mrpPrice * i.quantity,
          0
        );
        const totalItems = vendorItems.reduce((sum, i) => sum + i.quantity, 0);

        const [order] = await Order.create(
          [
            {
              user: userId,
              seller: sellerId,
              shippingAddress: shippingAddress._id,
              totalMrpPrice,
              totalSellingPrice,
              discount: Math.max(0, totalMrpPrice - totalSellingPrice),
              totalItems,
              orderStatus: OrderStatus.CONFIRMED,
              paymentStatus: PaymentStatus.PENDING,
              statusHistory: [
                {
                  status: OrderStatus.CONFIRMED,
                  timestamp: new Date(),
                  note: "Order created with transactional stock lock",
                  updatedBy: "CUSTOMER",
                },
              ],
            },
          ],
          sessionOption ? { session: sessionOption } : {}
        );

        createdOrderIds.push(order._id);
        const orderItemIds = [];

        for (const item of vendorItems) {
          const prod = item.product;

          // Atomic stock deduction with condition $gte: requestedQuantity (Section 10)
          let updatedProd = null;
          if (item.variantId && prod.hasVariants) {
            updatedProd = await Product.findOneAndUpdate(
              {
                _id: prod._id,
                "variants._id": item.variantId,
                "variants.countInStock": { $gte: item.quantity },
              },
              {
                $inc: {
                  "variants.$.countInStock": -item.quantity,
                  countInStock: -item.quantity,
                },
              },
              {
                new: true,
                ...(sessionOption ? { session: sessionOption } : {}),
              }
            );
          } else {
            updatedProd = await Product.findOneAndUpdate(
              {
                _id: prod._id,
                countInStock: { $gte: item.quantity },
              },
              {
                $inc: { countInStock: -item.quantity },
              },
              {
                new: true,
                ...(sessionOption ? { session: sessionOption } : {}),
              }
            );
          }

          if (!updatedProd) {
            throw new Error(
              `Inventory conflict: stock for "${prod.title}" changed concurrently. Please retry.`
            );
          }

          appliedStockDeductions.push({
            productId: prod._id,
            variantId: item.variantId,
            quantity: item.quantity,
          });

          // Immutable commercial OrderItem snapshot (Sections 25 & 26)
          const [orderItem] = await OrderItem.create(
            [
              {
                product: prod._id,
                variantId: item.variantId,
                productTitle: prod.title,
                productImage: item.image,
                brand: prod.brand || "",
                sku: item.sku || "",
                variantTitle: item.variantTitle || "",
                selectedAttributes: item.selectedAttributes || [],
                quantity: item.quantity,
                mrpPrice: item.mrpPrice,
                sellingPrice: item.sellingPrice,
                seller: sellerId,
                sellerOffer: {
                  sellerName: prod.seller?.sellerName || "",
                  businessName: prod.seller?.businessDetails?.businessName || "",
                },
                mediaSnapshot: {
                  url: item.image,
                  sku: item.sku || "",
                },
                size: item.size,
                ram: item.ram,
                weight: item.weight,
                capacity: item.capacity,
              },
            ],
            sessionOption ? { session: sessionOption } : {}
          );

          createdItemIds.push(orderItem._id);
          orderItemIds.push(orderItem._id);
        }

        order.orderItems = orderItemIds;
        await order.save(sessionOption ? { session: sessionOption } : {});
        resultOrders.push(order);
      }

      // 5. Clean up purchased items from user's cart if clearCart is enabled
      if (clearCart) {
        const purchasedCartItemIds = cart.cartItems.map((i) => i._id);
        await CartItem.deleteMany(
          { _id: { $in: purchasedCartItemIds } },
          sessionOption ? { session: sessionOption } : {}
        );
      }

      return resultOrders;
    };

    let createdOrders = [];

    try {
      // Attempt native MongoDB transaction
      try {
        session.startTransaction();
        isTransactionActive = true;
        createdOrders = await executeCheckoutWrites(session);
        await session.commitTransaction();
        isTransactionActive = false;
      } catch (txErr) {
        // If MongoDB deployment does not support transactions (e.g. single node without replica set)
        if (
          txErr.message &&
          (txErr.message.includes("replica set") ||
            txErr.message.includes("Transaction numbers are only allowed on a replica set member"))
        ) {
          if (isTransactionActive) {
            await session.abortTransaction();
            isTransactionActive = false;
          }
          // Fallback to standalone execution with compensation rollback tracking
          createdOrders = await executeCheckoutWrites(null);
        } else {
          throw txErr;
        }
      }
    } catch (err) {
      if (isTransactionActive) {
        await session.abortTransaction();
      } else {
        // Standalone compensation rollback: reverse applied stock deductions & cleanup partial records
        for (const deduction of appliedStockDeductions) {
          try {
            if (deduction.variantId) {
              await Product.findOneAndUpdate(
                { _id: deduction.productId, "variants._id": deduction.variantId },
                {
                  $inc: {
                    "variants.$.countInStock": deduction.quantity,
                    countInStock: deduction.quantity,
                  },
                }
              );
            } else {
              await Product.findByIdAndUpdate(deduction.productId, {
                $inc: { countInStock: deduction.quantity },
              });
            }
          } catch (rollbackErr) {
            console.error("[OrderService Rollback Error]:", rollbackErr.message);
          }
        }
        if (createdItemIds.length > 0) {
          await OrderItem.deleteMany({ _id: { $in: createdItemIds } }).catch(() => {});
        }
        if (createdOrderIds.length > 0) {
          await Order.deleteMany({ _id: { $in: createdOrderIds } }).catch(() => {});
        }
      }
      throw err;
    } finally {
      await session.endSession();
    }

    // 6. Post-commit notifications & domain events
    const populatedOrders = [];
    for (const ord of createdOrders) {
      const populated = await Order.findById(ord._id).populate([
        { path: "seller", select: "sellerName email businessDetails" },
        { path: "orderItems", populate: { path: "product" } },
        { path: "shippingAddress" },
        { path: "user", select: "fullName email mobile" },
      ]);
      if (populated) {
        populatedOrders.push(populated);

        if (emitEvents) {
          emitOrderCreated(populated);

          try {
            emailEvents.emitDomainEvent("order.created", {
              order: populated,
              orderId: populated.orderId || populated._id.toString(),
              recipient: populated.user?.email,
              customerName: populated.user?.fullName,
              total: populated.totalSellingPrice,
              items: populated.orderItems,
              deliveryAddress: populated.shippingAddress,
              estimatedDelivery: populated.deliveryDate,
            });

            if (populated.seller?.email) {
              emailEvents.emitDomainEvent("seller.order_received", {
                order: populated,
                orderId: populated.orderId || populated._id.toString(),
                recipient: populated.seller.email,
                sellerName: populated.seller.sellerName,
                items: populated.orderItems,
              });
            }
          } catch (emailErr) {
            console.warn("[OrderService] Email event warning:", emailErr.message);
          }
        }
      }
    }

    return populatedOrders;
  }

  /**
   * Rollback orders and replenish deducted inventory if downstream payment intent creation fails.
   */
  async rollbackOrders(orders = []) {
    if (!orders || orders.length === 0) return;

    for (const ord of orders) {
      try {
        const orderDoc = await Order.findById(ord._id || ord).populate("orderItems");
        if (!orderDoc) continue;

        // Replenish stock for all items
        for (const item of orderDoc.orderItems || []) {
          const qty = Number(item.quantity || 1);
          const prodId = item.product?._id || item.product;
          if (item.variantId) {
            await Product.findOneAndUpdate(
              { _id: prodId, "variants._id": item.variantId },
              {
                $inc: {
                  "variants.$.countInStock": qty,
                  countInStock: qty,
                },
              }
            );
          } else if (prodId) {
            await Product.findByIdAndUpdate(prodId, {
              $inc: { countInStock: qty },
            });
          }
        }

        // Mark order CANCELLED and paymentStatus FAILED
        orderDoc.orderStatus = OrderStatus.CANCELLED;
        orderDoc.paymentStatus = PaymentStatus.FAILED;
        orderDoc.statusHistory.push({
          status: OrderStatus.CANCELLED,
          timestamp: new Date(),
          comment: "Cancelled automatically due to checkout payment initialization failure",
        });
        await orderDoc.save();
      } catch (err) {
        console.error(`[OrderService] Error rolling back order ${ord._id || ord}:`, err.message);
      }
    }
  }

  async findOrderById(orderId) {
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      throw new Error("Invalid order ID");
    }

    const order = await Order.findById(orderId).populate([
      { path: "seller", select: "sellerName email businessDetails mobile" },
      { path: "orderItems", populate: { path: "product" } },
      { path: "shippingAddress" },
      { path: "user", select: "fullName email mobile" },
    ]);

    if (!order) throw new Error("Order not found");
    return order;
  }

  async findOrderItemById(orderItemId) {
    if (!mongoose.Types.ObjectId.isValid(orderItemId)) {
      throw new Error("Invalid order item ID");
    }
    return await OrderItem.findById(orderItemId).populate("product seller");
  }

  async usersOrderHistory(userId, options = {}) {
    const page = Math.max(1, parseInt(options.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(options.limit, 10) || 50));
    const skip = (page - 1) * limit;

    return await Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate([
        { path: "seller", select: "sellerName email businessDetails" },
        { path: "orderItems", populate: { path: "product" } },
        { path: "shippingAddress" },
      ]);
  }

  async getSellersOrders(sellerId, options = {}) {
    const page = Math.max(1, parseInt(options.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(options.limit, 10) || 50));
    const skip = (page - 1) * limit;

    return await Order.find({ seller: sellerId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate([
        { path: "orderItems", populate: { path: "product" } },
        { path: "shippingAddress" },
        { path: "user", select: "fullName email mobile" },
      ]);
  }

  async updateOrderStatus(orderId, newStatus, updatedBy = "VENDOR", note = "", sellerId = null) {
    if (!Object.values(OrderStatus).includes(newStatus)) {
      throw new Error(`Invalid order status: "${newStatus}"`);
    }

    const order = await Order.findById(orderId).populate("orderItems");
    if (!order) throw new Error("Order not found");

    // Strict multi-tenant isolation: Seller can only update their own orders
    if (sellerId && (order.seller?._id || order.seller)?.toString() !== sellerId.toString()) {
      throw new Error("Unauthorized: You can only update orders assigned to your own vendor account");
    }

    if (updatedBy === "VENDOR") {
      const allowedVendorTransitions = [
        OrderStatus.CONFIRMED,
        OrderStatus.SHIPPED,
        OrderStatus.PENDING,
      ];
      if (!allowedVendorTransitions.includes(newStatus)) {
        throw new Error(
          `Vendors cannot directly set status to "${newStatus}". Delivery confirmation requires logistics OTP verification.`
        );
      }
    }

    const currentStatus = order.orderStatus;

    // Idempotent: If already in requested status, return safely
    if (currentStatus === newStatus) {
      return order;
    }

    // Validate lifecycle progression
    const allowedTransitions = VALID_ORDER_TRANSITIONS[currentStatus] || [];
    if (!allowedTransitions.includes(newStatus)) {
      throw new Error(
        `Cannot transition order status from "${currentStatus}" to "${newStatus}". Valid transitions: [${allowedTransitions.join(", ")}]`
      );
    }

    // Invariant: Prepaid orders cannot be SHIPPED or DELIVERED before authoritative payment confirmation
    const paidStatuses = [PaymentStatus.CAPTURED, PaymentStatus.SUCCESS, PaymentStatus.COMPLETED];
    const isPrepaid = (order.paymentMethod || "").toUpperCase() !== "COD";
    const shippingStatuses = [OrderStatus.SHIPPED, OrderStatus.DELIVERED];

    if (isPrepaid && shippingStatuses.includes(newStatus) && !paidStatuses.includes(order.paymentStatus)) {
      const err = new Error(
        `Cannot transition order ${orderId} to "${newStatus}": Prepaid order has not been paid. Current payment status is "${order.paymentStatus}". Orders cannot be shipped before authoritative payment confirmation.`
      );
      err.code = "ORDER_PAYMENT_UNCONFIRMED";
      err.statusCode = 422;
      throw err;
    }

    // Atomic Restocking on Cancellation / Return (Section 38)
    // Only restock if transition was not previously applied
    if (newStatus === OrderStatus.CANCELLED || newStatus === OrderStatus.RETURNED) {
      for (const item of order.orderItems) {
        if (item.variantId) {
          await Product.findOneAndUpdate(
            { _id: item.product, "variants._id": item.variantId },
            {
              $inc: {
                "variants.$.countInStock": item.quantity,
                countInStock: item.quantity,
              },
            }
          );
        } else {
          await Product.findByIdAndUpdate(item.product, {
            $inc: { countInStock: item.quantity },
          });
        }
      }
    }

    order.orderStatus = newStatus;
    order.statusHistory.push({
      status: newStatus,
      timestamp: new Date(),
      note: note || `Status updated to ${newStatus}`,
      updatedBy,
    });

    await order.save();

    const updatedOrder = await this.findOrderById(orderId);
    emitOrderStatusUpdated(updatedOrder);

    // Emit transactional email domain events based on lifecycle progression
    try {
      const emailPayload = {
        order: updatedOrder,
        orderId: updatedOrder.orderId || updatedOrder._id.toString(),
        recipient: updatedOrder.user?.email,
        customerName: updatedOrder.user?.fullName,
        carrier: "Express Courier",
        trackingNumber: updatedOrder._id.toString(),
        total: updatedOrder.totalSellingPrice,
        items: updatedOrder.orderItems,
        deliveryAddress: updatedOrder.shippingAddress,
      };

      if (newStatus === OrderStatus.SHIPPED) {
        emailEvents.emitDomainEvent("shipment.shipped", emailPayload);
      } else if (newStatus === OrderStatus.OUT_FOR_DELIVERY) {
        emailEvents.emitDomainEvent("shipment.out_for_delivery", emailPayload);
      } else if (newStatus === OrderStatus.DELIVERED) {
        emailEvents.emitDomainEvent("shipment.delivered", emailPayload);
      } else if (newStatus === OrderStatus.CANCELLED) {
        emailEvents.emitDomainEvent("order.cancelled", emailPayload);
      } else if (newStatus === OrderStatus.RETURN_REQUESTED) {
        emailEvents.emitDomainEvent("return.requested", emailPayload);
      }
    } catch (emailErr) {
      console.warn("[OrderService] Error emitting status update email event:", emailErr.message);
    }

    return updatedOrder;
  }

  async cancelOrder(orderId, user) {
    const order = await Order.findById(orderId);
    if (!order) throw new Error("Order not found");

    const isAdmin =
      user.role === "ROLE_ADMIN" ||
      user.role === "ROLE_SUPER_ADMIN" ||
      user.role === "ADMIN" ||
      user.role === "SUPER_ADMIN";

    if (order.user.toString() !== (user._id || user).toString() && !isAdmin) {
      throw new Error("You are not authorized to cancel this order");
    }

    const nonCancellableStates = [
      OrderStatus.SHIPPED,
      OrderStatus.OUT_FOR_DELIVERY,
      OrderStatus.DELIVERED,
      OrderStatus.CANCELLED,
      OrderStatus.RETURNED,
    ];

    if (nonCancellableStates.includes(order.orderStatus)) {
      throw new Error(`Order cannot be cancelled in "${order.orderStatus}" state.`);
    }

    return await this.updateOrderStatus(
      orderId,
      OrderStatus.CANCELLED,
      isAdmin ? "ADMIN" : "CUSTOMER",
      "Customer initiated cancellation"
    );
  }

  async requestReturn(orderId, user, reason = "") {
    const order = await Order.findById(orderId);
    if (!order) throw new Error("Order not found");

    if (order.user.toString() !== (user._id || user).toString()) {
      throw new Error("Unauthorized to request return for this order");
    }

    if (order.orderStatus !== OrderStatus.DELIVERED) {
      throw new Error("Only delivered orders are eligible for return");
    }

    return await this.updateOrderStatus(
      orderId,
      OrderStatus.RETURN_REQUESTED,
      "CUSTOMER",
      `Return requested: ${reason || "Not specified"}`
    );
  }

  async deleteOrder(orderId) {
    return await Order.findByIdAndDelete(orderId);
  }

  async getAllOrdersForAdmin(query = {}) {
    const filter = {};
    if (query.status && query.status !== "ALL") {
      filter.orderStatus = query.status;
    }

    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.max(1, parseInt(query.limit, 10) || 20);
    const skip = (page - 1) * limit;

    const [orders, totalOrders] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("user", "fullName email mobile")
        .populate("seller", "sellerName email businessDetails")
        .populate("shippingAddress")
        .populate("orderItems"),
      Order.countDocuments(filter),
    ]);

    return {
      orders,
      totalOrders,
      totalPages: Math.ceil(totalOrders / limit),
      currentPage: page,
    };
  }

  _formatInvoiceResponseForRequester(snapshot, requester) {
    if (!requester || !snapshot) return snapshot;
    const isSeller = requester.role === "SELLER" || requester.role === "ROLE_SELLER";
    const isAdmin = requester.role === "ROLE_ADMIN" || requester.role === "ROLE_SUPER_ADMIN";

    if (isSeller && !isAdmin) {
      const requesterSellerId = (requester._id || requester.id)?.toString();
      const redacted = JSON.parse(JSON.stringify(snapshot));

      // 1. Redact buyer sensitive personal identity fields from merchant view
      if (redacted.buyer) {
        redacted.buyer.email = "customer[PROTECTED]@zoshbazaar.in";
        if (redacted.buyer.mobile) {
          const m = String(redacted.buyer.mobile);
          redacted.buyer.mobile = m.length >= 4 ? `••••••${m.slice(-4)}` : "PROTECTED";
        }
      }

      // 2. Strict tenant isolation: Filter line items strictly to this seller's package
      if (Array.isArray(redacted.lineItems) && requesterSellerId) {
        redacted.lineItems = redacted.lineItems.filter((item) => {
          const itemSellerId = (item.sellerId?._id || item.sellerId || redacted.seller?.sellerId)?.toString();
          return !itemSellerId || itemSellerId === requesterSellerId;
        });

        // Recompute financial summary to ensure seller only sees their financial totals
        let totalTaxableAmount = 0;
        let totalCgst = 0;
        let totalSgst = 0;
        let totalIgst = 0;
        let grandTotal = 0;

        redacted.lineItems.forEach((item, idx) => {
          item.itemIndex = idx + 1;
          totalTaxableAmount += Number(item.taxableAmount || 0);
          totalCgst += Number(item.cgstAmount || 0);
          totalSgst += Number(item.sgstAmount || 0);
          totalIgst += Number(item.igstAmount || 0);
          grandTotal += Number(item.lineTotal || 0);
        });

        redacted.financials = {
          ...redacted.financials,
          totalTaxableAmount: Math.round(totalTaxableAmount * 100) / 100,
          totalCgst: Math.round(totalCgst * 100) / 100,
          totalSgst: Math.round(totalSgst * 100) / 100,
          totalIgst: Math.round(totalIgst * 100) / 100,
          totalTaxAmount: Math.round((totalCgst + totalSgst + totalIgst) * 100) / 100,
          grandTotal: Math.round(grandTotal * 100) / 100,
        };
      }

      return redacted;
    }

    return snapshot;
  }

  async generateOrderInvoice(orderId, requester = null) {
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      throw new Error("Invalid order ID format");
    }

    const order = await Order.findById(orderId).populate([
      {
        path: "seller",
        select:
          "sellerName email businessDetails mobile GSTIN pickupAddress accountStatus accountType isCompositionScheme",
        populate: { path: "pickupAddress" },
      },
      {
        path: "orderItems",
        populate: { path: "product", populate: { path: "category" } },
      },
      { path: "shippingAddress" },
      { path: "user", select: "fullName email mobile" },
    ]);

    if (!order) {
      throw new Error("Order not found");
    }

    // 1. Strict Multi-Vendor and Customer Tenant Isolation
    if (requester) {
      const requesterUserId = (requester._id || requester.id)?.toString();
      const orderUserId = (order.user?._id || order.user)?.toString();
      const orderSellerId = (order.seller?._id || order.seller)?.toString();

      const isOwner = requesterUserId && orderUserId === requesterUserId;
      const isSeller =
        (requester.role === "SELLER" || requester.role === "ROLE_SELLER");
      const isAdmin =
        requester.role === "ROLE_ADMIN" || requester.role === "ROLE_SUPER_ADMIN";

      const sellerHasAccess =
        isSeller &&
        (orderSellerId === requesterUserId ||
          (order.orderItems || []).some(
            (item) => (item.seller?._id || item.seller)?.toString() === requesterUserId
          ));

      if (!isOwner && !sellerHasAccess && !isAdmin) {
        throw new Error("Access denied: You are not authorized to view this invoice");
      }
    }

    // 2. Return immutable authoritative invoice snapshot if already generated & persisted
    if (order.invoiceSnapshot) {
      return this._formatInvoiceResponseForRequester(order.invoiceSnapshot, requester);
    }

    // 3. Concurrency-safe unique invoice number generation
    const invoiceDate = order.invoiceDate || order.orderDate || order.createdAt || new Date();
    const d = new Date(invoiceDate);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const fy =
      month >= 4
        ? `${year}-${(year + 1).toString().slice(-2)}`
        : `${year - 1}-${year.toString().slice(-2)}`;
    const invoiceNumber =
      order.invoiceNumber || `INV-ZB-${fy}-${order._id.toString().slice(-6).toUpperCase()}`;

    // 4. Seller tax regime determination (Regular vs Composition vs Unregistered)
    const sellerRegime = TaxService.determineSellerTaxRegime(order.seller);

    // 5. Place of Supply & Missing Particulars Validation
    const sellerAddress = order.seller?.pickupAddress || {};
    const shippingAddress = order.shippingAddress || {};

    const cleanStr = (s) => (s ? String(s).trim().toLowerCase().replace(/[^a-z0-9]/g, "") : "");
    const sellerState = cleanStr(sellerAddress.state);
    const buyerState = cleanStr(shippingAddress.state);

    const hasValidStates = Boolean(sellerState && buyerState);
    const isIntraState = hasValidStates && sellerState === buyerState;

    // Determine document type and validation status
    let documentTitle = sellerRegime.documentTitle;
    let invoiceStatus = "ISSUED";

    if (order.orderStatus === OrderStatus.CANCELLED) {
      documentTitle = "VOID / CANCELLED TRANSACTION";
      invoiceStatus = "VOID";
    } else if (!hasValidStates) {
      documentTitle = "PROFORMA INVOICE / ORDER RECEIPT";
      invoiceStatus = "DRAFT_PENDING_TAX_VALIDATION";
    } else if (order.paymentStatus !== PaymentStatus.PAID) {
      documentTitle = `${sellerRegime.documentTitle} (PROFORMA)`;
      invoiceStatus = "PROFORMA";
    }

    const taxType = !hasValidStates
      ? "UNRESOLVED_PLACE_OF_SUPPLY"
      : !sellerRegime.canCollectTax
      ? "NIL_RATED_OR_EXEMPT"
      : isIntraState
      ? "INTRA_STATE"
      : "INTER_STATE";

    const sellerStateCode = TaxService.resolveStateCode(sellerAddress.state);
    const buyerStateCode = TaxService.resolveStateCode(shippingAddress.state);

    // 6. Line Items Calculation with Statutory Schedule & Valuation Thresholds
    let totalTaxableAmount = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;

    const lineItems = (order.orderItems || []).map((item, idx) => {
      const prod = item.product || {};
      const unitSellingPrice = Number(item.sellingPrice || item.price || 0);

      // Statutory tax classification evaluating valuation thresholds
      const taxClassification = TaxService.classifyProductTax(prod, unitSellingPrice);

      const taxCalc = TaxService.computeItemTax({
        unitSellingPrice,
        quantity: item.quantity,
        discount: item.discount,
        taxClassification,
        sellerRegime,
        isIntraState,
      });

      totalTaxableAmount += taxCalc.taxableAmount;
      totalCgst += taxCalc.cgstAmount;
      totalSgst += taxCalc.sgstAmount;
      totalIgst += taxCalc.igstAmount;

      return {
        itemIndex: idx + 1,
        orderItemId: item._id,
        productId: prod._id,
        sellerId: (item.seller?._id || item.seller || order.seller?._id || order.seller)?.toString(),
        productTitle: item.productTitle || prod.title || "Marketplace Product",
        sku: item.sku || prod.sku || "ZB-GEN-SKU",
        variantTitle: item.variantTitle || "",
        hsnCode: taxCalc.hsnCode,
        hsnDescription: taxClassification.description,
        isStatutoryClassified: taxClassification.isStatutoryClassified,
        quantity: taxCalc.quantity,
        unitSellingPrice: taxCalc.unitSellingPrice,
        grossAmount: taxCalc.grossAmount,
        discount: taxCalc.discount,
        netGross: taxCalc.netGross,
        taxableAmount: taxCalc.taxableAmount,
        gstRatePercent: taxCalc.gstRatePercent,
        cgstRate: taxCalc.cgstRate,
        cgstAmount: taxCalc.cgstAmount,
        sgstRate: taxCalc.sgstRate,
        sgstAmount: taxCalc.sgstAmount,
        igstRate: taxCalc.igstRate,
        igstAmount: taxCalc.igstAmount,
        totalTax: taxCalc.totalTax,
        lineTotal: taxCalc.lineTotal,
      };
    });

    totalTaxableAmount = Math.round(totalTaxableAmount * 100) / 100;
    totalCgst = Math.round(totalCgst * 100) / 100;
    totalSgst = Math.round(totalSgst * 100) / 100;
    totalIgst = Math.round(totalIgst * 100) / 100;
    const totalTaxAmount = Math.round((totalCgst + totalSgst + totalIgst) * 100) / 100;
    const grandTotal = Math.round(Number(order.totalSellingPrice || 0) * 100) / 100;

    const fullInvoice = {
      invoiceNumber,
      invoiceDate,
      orderId: order._id,
      orderDate: order.orderDate || order.createdAt,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      documentTitle,
      invoiceStatus,
      taxRegime: sellerRegime.regime,
      regimeNote: sellerRegime.regimeNote,
      placeOfSupply: shippingAddress.state || "Unresolved",
      placeOfSupplyStateCode: buyerStateCode,
      sellerStateCode,
      taxType,
      isIntraState,
      canCollectTax: sellerRegime.canCollectTax,
      platform: {
        companyName: "Zosh Bazaar India Private Limited",
        cin: "U74999MH2023PTC398241",
        platformGstin: "27AABCZ9876Q1Z5",
        platformAddress:
          "Zosh Bazaar Fulfillment Network, Kurla West, Mumbai, Maharashtra - 400070",
      },
      seller: {
        sellerId: order.seller?._id,
        sellerCode: `ZB-SLR-${(order.seller?._id || "000000").toString().slice(-6).toUpperCase()}`,
        businessName:
          order.seller?.businessDetails?.businessName ||
          order.seller?.sellerName ||
          "Zosh Certified Marketplace Merchant",
        sellerName: order.seller?.sellerName,
        gstin: order.seller?.GSTIN || null,
        isGstRegistered: sellerRegime.isGstRegistered,
        taxRegime: sellerRegime.regime,
        address: sellerAddress.address || "Certified Regional Warehouse Hub",
        locality: sellerAddress.locality || "",
        city: sellerAddress.city || "Mumbai",
        state: sellerAddress.state || "Maharashtra",
        pincode: sellerAddress.pincode || 400001,
        phone: order.seller?.mobile,
        email: order.seller?.email,
      },
      buyer: {
        name: shippingAddress.name || order.user?.fullName || "Valued Customer",
        address: shippingAddress.address || "Delivery Address",
        locality: shippingAddress.locality || "",
        city: shippingAddress.city || "",
        state: shippingAddress.state || "",
        pincode: shippingAddress.pincode || "",
        mobile: shippingAddress.mobile || order.user?.mobile || "",
        email: order.user?.email || "",
      },
      lineItems,
      financials: {
        totalMrpPrice: order.totalMrpPrice,
        discount: order.discount || 0,
        totalTaxableAmount,
        totalCgst,
        totalSgst,
        totalIgst,
        totalTaxAmount,
        shippingFee: 0,
        grandTotal,
      },
    };

    // 7. Atomic persistence under concurrency
    const updatedOrder = await Order.findOneAndUpdate(
      { _id: order._id, invoiceSnapshot: null },
      {
        $set: {
          invoiceNumber,
          invoiceDate,
          invoiceSnapshot: fullInvoice,
        },
      },
      { new: true }
    );

    const authoritativeSnapshot =
      updatedOrder?.invoiceSnapshot || order.invoiceSnapshot || fullInvoice;
    return this._formatInvoiceResponseForRequester(authoritativeSnapshot, requester);
  }
}

export default new OrderService();
