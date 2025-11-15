import PaymentOrder from "../models/paymentOrder.model.js";
import CartService from "../service/cart.service.js";
import OrderService from "../service/order.service.js";
import PaymentService from "../service/payment.service.js";

class OrderController {
  // create a new order
  async createOrder(req, res) {
    const { shippingAddress } = req.body;
    const { paymentMethod } = req.query;

    try {
      const user = await req.user;

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

      return res.status(200).json({
        message: "Order placed successfully",
        order: orders,
        paymentOrder,
        ...response,
        error: false,
        success: true,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getOrderById(req, res) {
    try {
      const { orderId } = req.params;
      const order = await OrderService.findOrderById(orderId);
      return res.status(200).json({ order, error: false, success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getOrderItemById(req, res) {
    try {
      const { orderItemId } = req.params;
      const orderItem = await OrderService.findOrderItemById(orderItemId);
      return res.status(200).json({ orderItem, error: false, success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getUserOrderHistory(req, res) {
    try {
      const userId = req.user._id;
      const orderHistory = await OrderService.usersOrderHistory(userId);
      return res
        .status(200)
        .json({ orderHistory, error: false, success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async cancelOrder(req, res) {
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
      res.status(500).json({ error: error.message });
    }
  }

  // -------------- seller specific controllers --------------

  // get seller orders
  async getSellersOrders(req, res) {
    try {
      const sellerId = req.seller._id;
      const orders = await OrderService.getSellersOrders(sellerId);
      return res.status(200).json({
        message: "Orders fetched successfully",
        orders: orders,
        error: false,
        success: true,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // update order status by seller
  async updateOrderStatus(req, res) {
    try {
      const { orderId, orderStatus } = req.params;

      const updatedOrder = await OrderService.updateOrderStatus(
        orderId,
        orderStatus
      );
      return res.status(200).json({
        message: "Order status updated!",
        order: updatedOrder,
        error: false,
        success: true,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // delete order by seller
  async deleteOrder(req, res) {
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
      res.status(500).json({ error: error.message });
    }
  }
}

export default new OrderController();

//   async createOrder(req, res) {
//     const { shippingAddress } = req.body;
//     const { paymentMethod } = req.query;
//     const jwt = req.headers.authorization;

//     try {
//       const user = await req.user;

//       const cart = await CartService.findUserCart(user);
//       const orders = await OrderService.createOrder(
//         user,
//         shippingAddress,
//         cart
//       );

//       const paymentOrder = await PaymentService.createOrder(user, orders);

//       const response = {};

//       console.log("response", response, paymentMethod, "--", paymentMethod);

//       if (paymentMethod === PaymentMethod.RAZORPAY) {
//         const payment = await paymentService.createRazorpayPaymentLink
//         const paymentUrl = payment.short_url;
//         const paymentUrlId = payment.id;

//         response.payment_link_url = paymentUrl;

//         paymentOrder.paymentLinkId = paymentUrlId;
//         await PaymentOrder.findByIdAndUpdate(paymentOrder._id, paymentC)
//         console.log('payment --', payment);
//       } else if (paymentMethod === PaymentMethod.STRIPE) {
//           const paymentUrl = await paymentService.createStripePaymentLink(paymentOrder);
//           response.payment_link_url = paymentUrl;
//       }
//     } catch (error) {
//       res.status(500).json({ error: error.message });
//     }
//   }
