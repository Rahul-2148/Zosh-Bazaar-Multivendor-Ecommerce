// payment.controller.js
import PaymentService from "../service/payment.service.js";
import UserService from "../service/user.service.js";
import SellerService from "../service/seller.service.js";
import OrderService from "../service/order.service.js";
import SellerReportService from "../service/sellerReport.service.js";
import TransactionService from "../service/transaction.service.js";
import { Cart } from "../models/cart.model.js";
import PaymentOrder from "../models/paymentOrder.model.js";

// Payment success handler controller
export const paymentSuccessHandler = async (req, res) => {
  const { paymentId } = req.params;
  const { paymentLinkId } = req.query;
  try {
    // Get the user from JWT token
    const user = await req.user;

    const paymentOrder = await PaymentService.getPaymentOrderByPaymentLinkId(
      paymentLinkId
    );

    const paymentSuccess = await PaymentService.proceedPaymentOrder(
      paymentOrder,
      paymentId,
      paymentLinkId
    );

    if (paymentSuccess) {
      for (let orderId of PaymentOrder.orders) {
        const order = await OrderService.findOrderById(orderId);

        // Create transaction for the order
        await TransactionService.createTransaction(order);

        // Get seller and update seller report
        const seller = await SellerService.getSellerById(order.seller);
        const sellerReport = await SellerReportService.getSellerReport(seller);

        // Update the seller's report
        sellerReport.totalOrders += 1;
        sellerReport.totalEarnings += order.totalSellingPrice;
        sellerReport.totalSales += order.orderItems.length;

        const updatedReport = await SellerReportService.updateSellerReport(
          sellerReport
        );
        console.log("Seller report updated: ", updatedReport);
      }
      // Clear the cart after successful payment
      await Cart.findOneAndUpdate(
        { user: user._id },
        { cartItems: [] },
        { new: true }
      );

      return res
        .status(201)
        .json({ message: "Payment successful", paymentOrder });
    } else {
      return res.status(400).json({ message: "Payment failed", paymentOrder });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
