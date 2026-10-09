import crypto from "crypto";
import razorpay from "../../../config/razorpayClient.js";
import OrderStatus from "../../../domain/OrderStatus.js";
import PaymentStatus, { isValidPaymentTransition } from "../../../domain/PaymentStatus.js";
import { Order } from "../../../models/order.model.js";
import PaymentOrder from "../../../models/paymentOrder.model.js";
import PaymentWebhookEvent from "../../../models/paymentWebhookEvent.model.js";
import { Cart } from "../../../models/cart.model.js";
import { CartItem } from "../../../models/cartItem.model.js";
import TransactionService from "./transaction.service.js";
import SellerService from "../../seller/services/seller.service.js";
import SellerReportService from "../../seller/services/sellerReport.service.js";

class PaymentService {
  /**
   * Verify Razorpay Webhook HMAC SHA256 Signature (Section 3.1)
   */
  verifyRazorpayWebhookSignature(rawBody, signature, secret) {
    if (!rawBody || !signature || !secret) {
      return false;
    }
    try {
      const hmac = crypto.createHmac("sha256", secret);
      hmac.update(rawBody);
      const digest = hmac.digest("hex");

      const expectedBuffer = Buffer.from(digest, "utf8");
      const signatureBuffer = Buffer.from(signature, "utf8");

      if (expectedBuffer.length !== signatureBuffer.length) {
        return false;
      }
      return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
    } catch (err) {
      console.error("[PaymentService] Signature verification exception:", err.message);
      return false;
    }
  }

  async createPaymentOrder(user, orders) {
    const amount = orders.reduce(
      (sum, order) => sum + (order.totalSellingPrice || 0),
      0
    );
    const paymentOrder = new PaymentOrder({
      amount,
      user: user._id || user,
      orders: orders.map((order) => order._id),
      currency: orders[0]?.currency || "INR",
      paymentStatus: PaymentStatus.PENDING,
      statusHistory: [
        {
          fromStatus: null,
          toStatus: PaymentStatus.PENDING,
          timestamp: new Date(),
          source: "SYSTEM",
          reason: "PaymentOrder initialized for checkout",
        },
      ],
    });
    return await paymentOrder.save();
  }

  async getPaymentOrderById(orderId) {
    const paymentOrder = await PaymentOrder.findOne({ _id: orderId }).populate(
      "user orders"
    );
    if (!paymentOrder) {
      throw new Error("Payment order not found");
    }
    return paymentOrder;
  }

  async getPaymentOrderByPaymentLinkId(paymentLinkId) {
    const paymentOrder = await PaymentOrder.findOne({ paymentLinkId }).populate(
      "user orders"
    );
    if (!paymentOrder) {
      throw new Error("Payment order not found");
    }
    return paymentOrder;
  }

  /**
   * Authoritative reconciliation: Apply payment capture to PaymentOrder, Orders, and Seller Reports
   * Idempotent: Can be called multiple times without duplicate stock deduction or double earnings.
   */
  async reconcilePaymentCapture(paymentOrder, paymentId, paymentLinkId = null, source = "WEBHOOK") {
    // If already captured or completed, return safely without duplicate mutations
    if (
      paymentOrder.paymentStatus === PaymentStatus.CAPTURED ||
      paymentOrder.paymentStatus === PaymentStatus.SUCCESS ||
      paymentOrder.paymentStatus === PaymentStatus.COMPLETED
    ) {
      return {
        alreadyCaptured: true,
        paymentOrder,
      };
    }

    if (!isValidPaymentTransition(paymentOrder.paymentStatus, PaymentStatus.CAPTURED)) {
      console.warn(
        `[PaymentService] Invalid payment transition: ${paymentOrder.paymentStatus} -> ${PaymentStatus.CAPTURED}`
      );
      return {
        alreadyCaptured: false,
        paymentOrder,
      };
    }

    const previousStatus = paymentOrder.paymentStatus;
    paymentOrder.paymentStatus = PaymentStatus.CAPTURED;
    paymentOrder.paymentId = paymentId || paymentOrder.paymentId;
    if (paymentLinkId) {
      paymentOrder.paymentLinkId = paymentLinkId;
    }
    paymentOrder.processedAt = new Date();
    paymentOrder.statusHistory.push({
      fromStatus: previousStatus,
      toStatus: PaymentStatus.CAPTURED,
      timestamp: new Date(),
      source,
      reason: "Payment verified & captured",
    });
    await paymentOrder.save();

    // Reconcile associated vendor orders
    const orderIds = paymentOrder.orders || [];
    for (const orderId of orderIds) {
      const order = await Order.findById(orderId);
      if (order && order.paymentStatus !== PaymentStatus.CAPTURED) {
        order.paymentStatus = PaymentStatus.CAPTURED;
        order.orderStatus = OrderStatus.CONFIRMED;
        order.statusHistory.push({
          status: OrderStatus.CONFIRMED,
          timestamp: new Date(),
          note: `Payment captured successfully via ${source} (Ref: ${paymentId})`,
          updatedBy: "SYSTEM",
        });
        await order.save();

        // Durable financial transaction record
        try {
          await TransactionService.createTransaction(order);
        } catch (tErr) {
          console.warn("[PaymentService] Transaction log warning:", tErr.message);
        }

        // Update seller performance report
        if (order.seller) {
          try {
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
          } catch (srErr) {
            console.warn("[PaymentService] Seller report update warning:", srErr.message);
          }
        }
      }
    }

    // Clean customer cart after successful transaction
    const userId = paymentOrder.user?._id || paymentOrder.user;
    if (userId) {
      try {
        const userCart = await Cart.findOne({ user: userId });
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
      } catch (cErr) {
        console.warn("[PaymentService] Cart cleanup warning:", cErr.message);
      }
    }

    return {
      alreadyCaptured: false,
      paymentOrder,
    };
  }

  /**
   * Handle Webhook Event from Razorpay with Idempotency & Signature Verification (Section 3 & 5)
   */
  async handleRazorpayWebhook(eventPayload, signature, rawBody) {
    const webhookSecret =
      process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;

    // Verify cryptographic signature if secret is configured
    if (webhookSecret) {
      const isValid = this.verifyRazorpayWebhookSignature(
        rawBody,
        signature,
        webhookSecret
      );
      if (!isValid) {
        const err = new Error("Invalid Razorpay webhook signature");
        err.statusCode = 400;
        throw err;
      }
    } else {
      console.warn(
        "⚠️ [PaymentService] RAZORPAY_WEBHOOK_SECRET not configured. Bypassing signature verification in development mode."
      );
    }

    const eventId =
      eventPayload.id ||
      `${eventPayload.event}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const eventType = eventPayload.event || "unknown";

    const payloadHash = crypto
      .createHash("sha256")
      .update(rawBody ? rawBody.toString() : JSON.stringify(eventPayload))
      .digest("hex");

    // Idempotency check: Have we processed this provider event before?
    let eventRecord = await PaymentWebhookEvent.findOne({
      provider: "RAZORPAY",
      eventId,
    });

    if (eventRecord) {
      if (eventRecord.status === "PROCESSED") {
        return {
          duplicate: true,
          processed: true,
          message: "Event already processed idempotently",
          eventId,
        };
      }
      eventRecord.retryCount += 1;
    } else {
      eventRecord = new PaymentWebhookEvent({
        provider: "RAZORPAY",
        eventId,
        eventType,
        signature: signature || "",
        payloadHash,
        status: "PROCESSING",
        receivedAt: new Date(),
        metadata: {
          event: eventType,
          containsPayment: Boolean(eventPayload.payload?.payment),
        },
      });
      await eventRecord.save();
    }

    try {
      const paymentEntity =
        eventPayload.payload?.payment?.entity ||
        eventPayload.payload?.payment_link?.entity;

      const paymentId = paymentEntity?.id;
      const paymentLinkId =
        paymentEntity?.payment_link_id ||
        paymentEntity?.notes?.paymentLinkId ||
        eventPayload.payload?.payment_link?.entity?.id;

      if (paymentId) eventRecord.paymentId = paymentId;

      if (eventType === "payment.captured" || eventType === "order.paid") {
        let paymentOrder = null;

        if (paymentLinkId) {
          paymentOrder = await PaymentOrder.findOne({ paymentLinkId });
        }
        if (!paymentOrder && paymentEntity?.notes?.paymentOrderId) {
          paymentOrder = await PaymentOrder.findById(paymentEntity.notes.paymentOrderId);
        }
        if (!paymentOrder && paymentId) {
          paymentOrder = await PaymentOrder.findOne({ paymentId });
        }

        if (paymentOrder) {
          eventRecord.orderId = paymentOrder._id.toString();
          await this.reconcilePaymentCapture(
            paymentOrder,
            paymentId,
            paymentLinkId,
            "WEBHOOK"
          );
        } else {
          console.warn(
            `[PaymentService] Webhook received for unlinked payment: ${paymentId} (linkId: ${paymentLinkId})`
          );
        }
      } else if (eventType === "payment.failed") {
        let paymentOrder = null;
        if (paymentLinkId) {
          paymentOrder = await PaymentOrder.findOne({ paymentLinkId });
        }
        if (paymentOrder && paymentOrder.paymentStatus === PaymentStatus.PENDING) {
          paymentOrder.paymentStatus = PaymentStatus.FAILED;
          paymentOrder.statusHistory.push({
            fromStatus: PaymentStatus.PENDING,
            toStatus: PaymentStatus.FAILED,
            timestamp: new Date(),
            source: "WEBHOOK",
            reason: paymentEntity?.error_description || "Payment failed at gateway",
          });
          await paymentOrder.save();
        }
      }

      eventRecord.status = "PROCESSED";
      eventRecord.processedAt = new Date();
      await eventRecord.save();

      return {
        duplicate: false,
        processed: true,
        eventId,
      };
    } catch (processError) {
      eventRecord.status = "FAILED";
      eventRecord.error = processError.message;
      await eventRecord.save();
      throw processError;
    }
  }

  /**
   * Client-side Payment verification callback
   * Reconciles authoritative state with Razorpay API, then updates DB
   */
  async proceedPaymentOrder(paymentOrder, paymentId, paymentLinkId) {
    if (!paymentOrder) {
      throw new Error("Payment order required for verification");
    }

    // If already reconciled by webhook, return success immediately
    if (
      paymentOrder.paymentStatus === PaymentStatus.CAPTURED ||
      paymentOrder.paymentStatus === PaymentStatus.SUCCESS ||
      paymentOrder.paymentStatus === PaymentStatus.COMPLETED
    ) {
      return paymentOrder;
    }

    // Verify directly with Razorpay gateway
    try {
      const payment = await razorpay.payments.fetch(paymentId);
      if (payment.status === "captured") {
        const { paymentOrder: updatedOrder } = await this.reconcilePaymentCapture(
          paymentOrder,
          paymentId,
          paymentLinkId,
          "CLIENT_CALLBACK"
        );
        return updatedOrder;
      } else {
        paymentOrder.paymentStatus = PaymentStatus.FAILED;
        paymentOrder.statusHistory.push({
          fromStatus: paymentOrder.paymentStatus,
          toStatus: PaymentStatus.FAILED,
          timestamp: new Date(),
          source: "CLIENT_CALLBACK",
          reason: `Razorpay status was "${payment.status}"`,
        });
        await paymentOrder.save();
        throw new Error(`Payment verification failed: Status is ${payment.status}`);
      }
    } catch (err) {
      // In local dev/mock scenarios without active network credentials
      // Strictly disabled in production or without explicit ALLOW_MOCK_PAYMENTS opt-in
      const isProduction =
        process.env.NODE_ENV === "production" ||
        process.env.PAYMENT_ENV === "production";
      if (
        !isProduction &&
        process.env.ALLOW_MOCK_PAYMENTS === "true" &&
        (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === "rzp_test_mock")
      ) {
        const { paymentOrder: updatedOrder } = await this.reconcilePaymentCapture(
          paymentOrder,
          paymentId,
          paymentLinkId,
          "MOCK_DEV"
        );
        return updatedOrder;
      }
      throw err;
    }
  }

  async createRazorpayPaymentLink(user, amount, orderId, currency) {
    try {
      const paymentLinkRequest = {
        amount: Math.round(amount * 100), // amount in paise
        currency: currency || "INR",
        customer: {
          name: user.fullName || "Customer",
          email: user.email,
          mobile: user.mobile || "",
        },
        notify: {
          email: true,
          sms: true,
        },
        notes: {
          paymentOrderId: orderId.toString(),
        },
        callback_url: `${process.env.CLIENT_URL || "http://localhost:5173"}/payment-success/${orderId}`,
        callback_method: "get",
      };
      const paymentLink = await razorpay.paymentLink.create(paymentLinkRequest);
      return paymentLink;
    } catch (error) {
      // Return safe mock link in offline development if keys aren't provisioned
      if (
        process.env.NODE_ENV !== "production" &&
        (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === "rzp_test_mock")
      ) {
        const mockLinkId = `plink_mock_${Date.now()}`;
        return {
          id: mockLinkId,
          short_url: `${process.env.CLIENT_URL || "http://localhost:5173"}/payment-success/${orderId}?paymentLinkId=${mockLinkId}&paymentId=pay_mock_${Date.now()}`,
        };
      }
      throw new Error(
        error.message || "Failed to create Razorpay payment link"
      );
    }
  }
}

export default new PaymentService();
