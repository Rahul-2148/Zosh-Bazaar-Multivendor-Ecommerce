import PaymentService from "../services/payment.service.js";

/**
 * Authoritative Webhook Endpoint for Razorpay Payment Notifications (Section 3.1 & 5)
 * POST /api/v1/payment/webhook/razorpay
 */
export const razorpayWebhookHandler = async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];
  const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body || {}));

  try {
    const result = await PaymentService.handleRazorpayWebhook(
      req.body,
      signature,
      rawBody
    );

    return res.status(200).json({
      success: true,
      message: result.message || "Webhook processed successfully",
      duplicate: Boolean(result.duplicate),
      eventId: result.eventId,
    });
  } catch (error) {
    console.error("[PaymentWebhook Error]:", error.message);
    const statusCode = error.statusCode || (error.message.includes("signature") ? 400 : 500);
    return res.status(statusCode).json({
      success: false,
      error: true,
      message: error.message || "Webhook processing failed",
    });
  }
};

/**
 * Authoritative Client-side Payment verification callback
 * GET /api/v1/payment/:paymentId?paymentLinkId=...
 */
export const paymentSuccessHandler = async (req, res) => {
  const { paymentId } = req.params;
  const { paymentLinkId } = req.query;

  try {
    let paymentOrder = null;

    if (paymentLinkId) {
      paymentOrder = await PaymentService.getPaymentOrderByPaymentLinkId(paymentLinkId);
    } else if (paymentId) {
      paymentOrder = await PaymentService.getPaymentOrderById(paymentId);
    }

    if (!paymentOrder) {
      return res.status(404).json({
        success: false,
        error: true,
        message: "Payment order reference not found",
      });
    }

    const verifiedOrder = await PaymentService.proceedPaymentOrder(
      paymentOrder,
      paymentId,
      paymentLinkId
    );

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      paymentOrder: verifiedOrder,
    });
  } catch (error) {
    console.error("[PaymentSuccessHandler Error]:", error.message);
    return res.status(500).json({
      success: false,
      error: true,
      message: error.message || "Payment verification failed",
    });
  }
};
