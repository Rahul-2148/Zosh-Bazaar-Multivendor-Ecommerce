import PaymentService from "../services/payment.service.js";
import SellerService from "../../seller/services/seller.service.js";
import OrderService from "../services/order.service.js";
import SellerReportService from "../../seller/services/sellerReport.service.js";
import TransactionService from "../services/transaction.service.js";
import { Cart } from "../../../models/cart.model.js";
import { CartItem } from "../../../models/cartItem.model.js";

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
      const orders = paymentOrder.orders || [];
      for (let orderId of orders) {
        const order = await OrderService.findOrderById(orderId);
        if (order) {
          // Create transaction for the order
          await TransactionService.createTransaction(order);

          // Get seller and update seller report
          const seller = await SellerService.getSellerById(order.seller);
          if (seller) {
            const sellerReport = await SellerReportService.getSellerReport(seller);
            if (sellerReport) {
              sellerReport.totalOrders = (sellerReport.totalOrders || 0) + 1;
              sellerReport.totalEarnings =
                (sellerReport.totalEarnings || 0) + (order.totalSellingPrice || 0);
              sellerReport.totalSales =
                (sellerReport.totalSales || 0) + (order.orderItems?.length || 0);

              await SellerReportService.updateSellerReport(sellerReport);
            }
          }
        }
      }
      // Clear the cart after successful payment
      const userCart = await Cart.findOne({ user: user._id });
      if (userCart) {
        await CartItem.deleteMany({ cart: userCart._id });
        userCart.cartItems = [];
        userCart.totalMrpPrice = 0;
        userCart.totalSellingPrice = 0;
        userCart.totalItem = 0;
        userCart.discount = 0;
        userCart.couponCode = null;
        userCart.couponPrice = 0;
        await userCart.save();
      }

      return res
        .status(200)
        .json({ message: "Payment successful", paymentOrder });
    } else {
      return res.status(400).json({ message: "Payment failed", paymentOrder });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
