import mongoose from "mongoose";
import { Address } from "../models/address.model.js";
import { Order } from "../models/order.model.js";
import { OrderItem } from "../models/orderItem.model.js";
import { User } from "../models/user.model.js";
import OrderStatus from "../domain/OrderStatus.js";
import PaymentStatus from "../domain/PaymentStatus.js";

class OrderService {
  // create order for user
  async createOrder(user, shippingAddress, cart) {
    if (shippingAddress._id && !user.addresses.includes(shippingAddress._id)) {
      user.addresses.push(shippingAddress._id);
      await User.findByIdAndUpdate(user._id, user);
    }

    if (!shippingAddress._id) {
      shippingAddress = await Address.create(shippingAddress);
    }

    const itemsBySeller = cart.cartItems.reduce((acc, item) => {
      const sellerId = item.product.seller._id.toString();
      acc[sellerId] = acc[sellerId] || [];
      acc[sellerId].push(item);
      return acc;
    }, {});

    const orders = new Set();

    for (const [sellerId, cartItems] of Object.entries(itemsBySeller)) {
      const totalOrderPrice = cartItems.reduce(
        (sum, item) => sum + item.sellingPrice,
        0
      );

      const totalItem = cartItems.length;

      const newOrder = await Order.create({
        user: user._id,
        seller: sellerId,
        orderItems: [],
        shippingAddress: shippingAddress._id,
        totalMrpPrice: totalOrderPrice,
        totalSellingPrice: totalOrderPrice,
        totalItems: totalItem,
        orderStatus: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
      });

      const orderItems = await Promise.all(
        cartItems.map(async (cartItem) => {
          const orderItem = new OrderItem({
            product: cartItem.product._id,
            quantity: cartItem.quantity,
            mrpPrice: cartItem.mrpPrice,
            sellingPrice: cartItem.sellingPrice,
            size: cartItem.size,
            ram: cartItem.ram,
            weight: cartItem.weight,
            capacity: cartItem.capacity,
            userId: cartItem.userId,
          });
          const savedOrderItem = await orderItem.save();
          newOrder.orderItems.push(savedOrderItem._id);
          return savedOrderItem;
        })
      );

      const savedOrder = await newOrder.save();
      orders.add(savedOrder);
    }

    return Array.from(orders);
  }

  // find order by id
  async findOrderById(orderId) {
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      throw new Error("Invalid order ID");
    }

    const order = await Order.findById(orderId).populate([
      { path: "seller" },
      { path: "orderItems", populate: { path: "product" } },
      { path: "shippingAddress" },
    ]);

    if (!order) {
      throw new Error("Order not found");
    }

    return order;
  }

  // find all orders by user
  async usersOrderHistory(userId) {
    return await Order.find({ user: userId }).populate([
      { path: "orderItems", populate: { path: "product" } },
      { path: "shippingAddress" },
    ]);
  }

  // find all orders by seller
  async getSellersOrders(sellerId) {
    return await Order.find({ seller: sellerId })
      .sort({ orderDate: -1 })
      .populate([
        { path: "seller" },
        { path: "orderItems", populate: { path: "product" } },
        { path: "shippingAddress" },
      ]);
  }

  async updateOrderStatus(orderId, status) {
    if (!Object.values(OrderStatus).includes(status)) {
      throw new Error("Invalid order status");
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      { orderStatus: status },
      { new: true }
    ).populate([
      { path: "seller" },
      { path: "orderItems", populate: { path: "product" } },
      { path: "shippingAddress" },
    ]);

    if (!order) throw new Error("Order not found");

    return order;
  }

  async cancelOrder(orderId, user) {
    const order = await Order.findById(orderId);
    if (!order) throw new Error("Order not found");

    if (order.user.toString() !== user._id.toString()) {
      throw new Error("You are not authorized to cancel this order");
    }

    order.orderStatus = OrderStatus.CANCELLED;

    return await Order.findByIdAndUpdate(orderId, order, { new: true }).populate([
      { path: "seller" },
      { path: "orderItems", populate: { path: "product" } },
      { path: "shippingAddress" },
    ]);
  }

  async findOrderItemById(orderItemId) {
    if (!mongoose.Types.ObjectId.isValid(orderItemId)) {
      throw new Error("Invalid order item ID");
    }
    const orderItem = await OrderItem.findById(orderItemId).populate("product");

    if (!orderItem) throw new Error("Order item not found");

    return orderItem;
  }

  // find all total orders by admin
  async getAllOrders() {
    return await Order.find()
      .sort({ orderDate: -1 })
      .populate([
        { path: "seller" },
        { path: "orderItems", populate: { path: "product" } },
        { path: "shippingAddress" },
      ]);
  }

  async deleteOrder(orderId) {
    const order = await Order.findByIdAndDelete(orderId);
    if (!order) throw new Error("Order not found");
    return order;
  }
}

export default new OrderService();
