import razorpay from "../config/razorpayClient.js";
import OrderStatus from "../domain/OrderStatus.js";
import PaymentStatus from "../domain/PaymentStatus.js";
import { Order } from "../models/order.model.js";
import PaymentOrder from "../models/paymentOrder.model.js";

class PaymentService {
  async createPaymentOrder(user, orders) {
    const amount = orders.reduce(
      (sum, order) => sum + order.totalSellingPrice,
      0
    );
    const paymentOrder = new PaymentOrder({
      amount,
      user: user._id,
      order: orders.map((order) => order._id),
      currency: orders[0].currency,
    });
    return await paymentOrder.save();
  }

  async getPaymentOrderById(orderId) {
    const paymentOrder = await PaymentOrder.findOne({ _id: orderId }).populate(
      "user order"
    );
    if (!paymentOrder) {
      throw new Error("Payment order not found");
    }
    return paymentOrder;
  }

  async getPaymentOrderByPaymentLinkId(paymentLinkId) {
    const paymentOrder = await PaymentOrder.findOne({ paymentLinkId }).populate(
      "user order"
    );
    if (!paymentOrder) {
      throw new Error("Payment order not found");
    }
    return paymentOrder;
  }

  async proceedPaymentOrder(paymentOrder, paymentId, paymentLinkId) {
    if (paymentOrder.status === PaymentStatus.PENDING) {
      const payment = await razorpay.payments.fetch(paymentId);

      if (payment.status === "captured") {
        // Update each orders payment status
        await Promise.all(
          paymentOrder.orders.map(async (orderId) => {
            const order = await Order.findById(orderId);
            order.paymentStatus = PaymentStatus.COMPLETED;
            order.orderStatus = OrderStatus.PLACED;
            await order.save();
          })
        );

        paymentOrder.status = PaymentStatus.SUCCESS;
        paymentOrder.paymentId = paymentId;
        paymentOrder.paymentLinkId = paymentLinkId;
        await paymentOrder.save();
        return paymentOrder;
      } else {
        paymentOrder.status = PaymentStatus.FAILED;
        await paymentOrder.save();
        throw new Error("Payment failed");
      }
    }
  }

  async createRazorpayPaymentLink(user, amount, orderId, currency) {
    try {
      const paymentLinkRequest = {
        amount: amount * 100, // amount in paise
        currency: currency || "INR",
        customer: {
          name: user.fullName,
          email: user.email,
          mobile: user.mobile,
        },
        notify: {
          email: true,
          sms: true,
        },
        callback_url: `${process.env.CLIENT_URL}/payment-success/${orderId}`,
        callback_method: "get",
      };
      const paymentLink = await razorpay.paymentLink.create(paymentLinkRequest);
      return paymentLink;
    } catch (error) {
      throw new Error(
        error.message || "Failed to create Razorpay payment link"
      );
    }
  }
}

export default new PaymentService();

// webhook ki jarurat nhi thi so nhi diya gya h
