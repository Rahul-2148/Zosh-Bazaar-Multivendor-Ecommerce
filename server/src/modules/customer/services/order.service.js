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

class OrderService {
  async createOrder(user, shippingAddressData, cart) {
    const userId = user._id || user;

    if (!cart.cartItems || cart.cartItems.length === 0) {
      throw new Error("Cart is empty. Cannot place an order.");
    }

    // 1. Resolve shipping address
    let shippingAddress = null;
    if (shippingAddressData._id) {
      shippingAddress = await Address.findById(shippingAddressData._id);
    }
    if (!shippingAddress) {
      shippingAddress = await Address.create({
        ...shippingAddressData,
        user: userId,
      });
      await User.findByIdAndUpdate(userId, {
        $addToSet: { addresses: shippingAddress._id },
      });
    }

    // 2. Pre-validate stock for every item before deducting anything
    for (const item of cart.cartItems) {
      const prod = await Product.findById(item.product._id);
      if (!prod) throw new Error(`Product "${item.product.title}" is no longer available.`);

      if (item.variantId && prod.hasVariants) {
        const variant = prod.variants.id(item.variantId);
        if (!variant || variant.status !== "ACTIVE") {
          throw new Error(`Variant for "${prod.title}" is no longer active.`);
        }
        if (variant.countInStock < item.quantity) {
          throw new Error(
            `Insufficient stock for "${prod.title} (${variant.title})". Only ${variant.countInStock} left.`
          );
        }
      } else {
        if (prod.countInStock < item.quantity) {
          throw new Error(`Insufficient stock for "${prod.title}". Only ${prod.countInStock} left.`);
        }
      }
    }

    // 3. Group cart items by seller
    const itemsBySeller = cart.cartItems.reduce((acc, item) => {
      const sellerId = item.product.seller?._id?.toString() || item.product.seller?.toString();
      if (!sellerId) throw new Error(`Missing vendor for product "${item.product.title}"`);
      acc[sellerId] = acc[sellerId] || [];
      acc[sellerId].push(item);
      return acc;
    }, {});

    const createdOrders = [];

    // 4. Create an order per vendor
    for (const [sellerId, cartItems] of Object.entries(itemsBySeller)) {
      const totalSellingPrice = cartItems.reduce((sum, i) => sum + i.sellingPrice, 0);
      const totalMrpPrice = cartItems.reduce((sum, i) => sum + i.mrpPrice, 0);
      const totalItems = cartItems.reduce((sum, i) => sum + i.quantity, 0);

      const order = new Order({
        user: userId,
        seller: sellerId,
        shippingAddress: shippingAddress._id,
        totalMrpPrice,
        totalSellingPrice,
        discount: totalMrpPrice - totalSellingPrice,
        totalItems,
        orderStatus: OrderStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PENDING,
        statusHistory: [
          {
            status: OrderStatus.CONFIRMED,
            timestamp: new Date(),
            note: "Order placed successfully by customer",
            updatedBy: "CUSTOMER",
          },
        ],
      });

      const orderItemIds = [];

      for (const item of cartItems) {
        const prod = item.product;
        const variantSnapshot = item.selectedVariant || {};

        // Atomically deduct inventory
        if (item.variantId && prod.hasVariants) {
          const updated = await Product.findOneAndUpdate(
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
            }
          );
          if (!updated) {
            throw new Error(`Stock deduction failed for "${prod.title}". Please try again.`);
          }
        } else {
          const updated = await Product.findOneAndUpdate(
            {
              _id: prod._id,
              countInStock: { $gte: item.quantity },
            },
            {
              $inc: { countInStock: -item.quantity },
            }
          );
          if (!updated) {
            throw new Error(`Stock deduction failed for "${prod.title}". Please try again.`);
          }
        }

        // Create immutable commercial snapshot
        const orderItem = new OrderItem({
          product: prod._id,
          variantId: item.variantId || null,
          productTitle: prod.title,
          productImage: variantSnapshot.image || prod.images?.[0] || "",
          brand: prod.brand || "",
          sku: variantSnapshot.sku || "",
          variantTitle: variantSnapshot.title || "",
          selectedAttributes: variantSnapshot.attributes || [],
          quantity: item.quantity,
          mrpPrice: item.mrpPrice,
          sellingPrice: item.sellingPrice,
          seller: sellerId,
          // Legacy fields
          size: item.size || "",
          ram: item.ram || "",
          weight: item.weight || "",
          capacity: item.capacity || "",
        });

        await orderItem.save();
        orderItemIds.push(orderItem._id);
      }

      order.orderItems = orderItemIds;
      await order.save();

      const populatedOrder = await Order.findById(order._id).populate([
        { path: "seller", select: "sellerName email businessDetails" },
        { path: "orderItems", populate: { path: "product" } },
        { path: "shippingAddress" },
        { path: "user", select: "fullName email mobile" },
      ]);

      createdOrders.push(populatedOrder);

      // Real-time notification to vendor & admin
      emitOrderCreated(populatedOrder);
    }

    // 5. Clean up purchased items from user's cart
    const purchasedCartItemIds = cart.cartItems.map((i) => i._id);
    await CartItem.deleteMany({ _id: { $in: purchasedCartItemIds } });

    return createdOrders;
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

  async usersOrderHistory(userId) {
    return await Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate([
        { path: "seller", select: "sellerName email businessDetails" },
        { path: "orderItems", populate: { path: "product" } },
        { path: "shippingAddress" },
      ]);
  }

  async getSellersOrders(sellerId) {
    return await Order.find({ seller: sellerId })
      .sort({ createdAt: -1 })
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

    // Flipkart/Amazon rule: Sellers can confirm/pack/dispatch, but final delivery requires logistics/OTP
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

    // Validate lifecycle progression
    const allowedTransitions = VALID_ORDER_TRANSITIONS[currentStatus] || [];
    if (!allowedTransitions.includes(newStatus)) {
      throw new Error(
        `Cannot transition order status from "${currentStatus}" to "${newStatus}". Valid transitions: [${allowedTransitions.join(", ")}]`
      );
    }

    // Stock management on status change
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

    if (order.user.toString() !== user._id.toString() && !isAdmin) {
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

    if (order.user.toString() !== user._id.toString()) {
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
