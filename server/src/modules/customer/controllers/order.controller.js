import PaymentOrder from "../../../models/paymentOrder.model.js";
import CartService from "../services/cart.service.js";
import OrderService from "../services/order.service.js";
import PaymentService from "../services/payment.service.js";

class OrderController {
  async createOrder(req, res, next) {
    const { shippingAddress } = req.body;
    const { paymentMethod } = req.query;

    try {
      const user = req.user;
      const cart = await CartService.findUserCart(user);
      const orders = await OrderService.createOrder(
        user,
        shippingAddress,
        cart
      );

      const paymentOrder = await PaymentService.createPaymentOrder(
        user,
        orders
      );

      const response = {};

      if (paymentMethod === "RAZORPAY") {
        const paymentLink = await PaymentService.createRazorpayPaymentLink(
          user,
          paymentOrder.amount,
          paymentOrder._id
        );
        response.payment_link_url = paymentLink.short_url;
        paymentOrder.paymentLinkId = paymentLink.id;
        await PaymentOrder.findByIdAndUpdate(paymentOrder._id, paymentOrder);
      }

      return res.status(201).json({
        message: "Order placed successfully",
        order: orders,
        paymentOrder,
        ...response,
        error: false,
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }

  async getOrderById(req, res, next) {
    try {
      const { orderId } = req.params;
      const order = await OrderService.findOrderById(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found", error: true, success: false });
      }

      // Enforce strict customer authorization
      const currentUserId = req.user?._id?.toString();
      const orderUserId = (order.user?._id || order.user)?.toString();
      const isOwner = currentUserId && orderUserId === currentUserId;
      const isSeller = req.seller && (order.seller?._id || order.seller)?.toString() === req.seller._id?.toString();
      const isAdmin = req.user?.role === "ROLE_ADMIN" || req.user?.role === "ROLE_SUPER_ADMIN";

      if (!isOwner && !isSeller && !isAdmin) {
        return res.status(403).json({
          message: "Access denied. You can only access your own orders.",
          error: true,
          success: false,
        });
      }

      return res.status(200).json({ order, error: false, success: true });
    } catch (error) {
      next(error);
    }
  }

  async getOrderItemById(req, res, next) {
    try {
      const { orderItemId } = req.params;
      const orderItem = await OrderService.findOrderItemById(orderItemId);
      if (!orderItem) {
        return res.status(404).json({ message: "Order item not found", error: true, success: false });
      }

      // Enforce authorization via parent order
      const { Order } = await import("../../../models/order.model.js");
      const parentOrder = await Order.findOne({ orderItems: orderItem._id });
      if (parentOrder) {
        const currentUserId = req.user?._id?.toString();
        const orderUserId = (parentOrder.user?._id || parentOrder.user)?.toString();
        const isOwner = currentUserId && orderUserId === currentUserId;
        const isSeller = req.seller && (parentOrder.seller?._id || parentOrder.seller)?.toString() === req.seller._id?.toString();
        const isAdmin = req.user?.role === "ROLE_ADMIN" || req.user?.role === "ROLE_SUPER_ADMIN";

        if (!isOwner && !isSeller && !isAdmin) {
          return res.status(403).json({
            message: "Access denied. You can only access your own order items.",
            error: true,
            success: false,
          });
        }
      }

      return res.status(200).json({ orderItem, error: false, success: true });
    } catch (error) {
      next(error);
    }
  }


  async getUserOrderHistory(req, res, next) {
    try {
      const userId = req.user._id;
      const orderHistory = await OrderService.usersOrderHistory(userId);
      return res
        .status(200)
        .json({ orderHistory, error: false, success: true });
    } catch (error) {
      next(error);
    }
  }

  async cancelOrder(req, res, next) {
    try {
      const { orderId } = req.params;
      const user = req.user;
      const cancelledOrder = await OrderService.cancelOrder(orderId, user);
      return res.status(200).json({
        message: "Order cancelled successfully",
        order: cancelledOrder,
        error: false,
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }

  async requestReturn(req, res, next) {
    try {
      const { orderId } = req.params;
      const { reason } = req.body;
      const user = req.user;
      const returnedOrder = await OrderService.requestReturn(orderId, user, reason);
      return res.status(200).json({
        message: "Return request submitted successfully",
        order: returnedOrder,
        error: false,
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }

  // -------------- seller specific controllers --------------

  async getSellersOrders(req, res, next) {
    try {
      const sellerId = req.seller._id;
      const orders = await OrderService.getSellersOrders(sellerId);
      return res.status(200).json({
        message: "Orders fetched successfully",
        orders,
        error: false,
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateOrderStatus(req, res, next) {
    try {
      const { orderId, orderStatus } = req.params;
      const { note } = req.body || {};

      const sellerId = req.seller?._id;
      const isAdmin = req.user?.role === "ROLE_ADMIN" || req.user?.role === "ROLE_SUPER_ADMIN";

      const updatedOrder = await OrderService.updateOrderStatus(
        orderId,
        orderStatus,
        req.seller ? "VENDOR" : isAdmin ? "ADMIN" : "SYSTEM",
        note,
        isAdmin ? null : sellerId
      );

      return res.status(200).json({
        message: "Order status updated successfully",
        order: updatedOrder,
        error: false,
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteOrder(req, res, next) {
    try {
      const { orderId } = req.params;
      const deletedOrder = await OrderService.deleteOrder(orderId);
      return res.status(200).json({
        message: "Order deleted successfully",
        order: deletedOrder,
        error: false,
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new OrderController();
