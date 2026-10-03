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

class OrderService {
  /**
   * P0 — Checkout Transactional Integrity & Inventory Concurrency (Section 7, 8, 9, 10, 34)
   * Executes multi-write checkout atomically within MongoDB sessions (or transactional compensation rollback).
   * Revalidates price, variant attributes, and stock authoritatively against live catalog data.
   */
  async createOrder(user, shippingAddressData, cart) {
    const userId = user._id || user;

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

      // 5. Clean up purchased items from user's cart in the same transaction
      const purchasedCartItemIds = cart.cartItems.map((i) => i._id);
      await CartItem.deleteMany(
        { _id: { $in: purchasedCartItemIds } },
        sessionOption ? { session: sessionOption } : {}
      );

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

    return populatedOrders;
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
}

export default new OrderService();
