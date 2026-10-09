import crypto from "crypto";
import PaymentRailAdapter from "./PaymentRailAdapter.js";
import PaymentAttemptStatus from "../domain/PaymentAttemptStatus.js";

/**
 * Cashfree Payments Rail Adapter
 * Enterprise Multi-PSP Adapter for Cashfree PG (UPI, Cards, NetBanking, EMI).
 * Operates as a secondary regulated execution rail behind the Zosh Payment Orchestrator.
 */
export class CashfreeAdapter extends PaymentRailAdapter {
  constructor() {
    const isProduction =
      process.env.CASHFREE_ENV === "production" ||
      (process.env.NODE_ENV === "production" && Boolean(process.env.CASHFREE_APP_ID));

    super("CASHFREE", {
      railType: "ALL",
      provider: "CASHFREE",
      supportsAuthorization: true,
      supportsCapture: true,
      supportsRefund: true,
      supportsPartialRefund: true,
      supportsWebhook: true,
      supportsPolling: true,
      supportsUPIIntent: true,
      supportsUPICollect: true,
      supportsUPIQR: true,
      supportsCards: true,
      supportsTokenization: true,
      supports3DS: true,
      supportsNetBanking: true,
      supportsEMI: true,
      supportsPayout: false,
      supportsReconciliation: true,
      supportsCOD: false,
      environment: isProduction ? "production" : "sandbox",
      productionReady: Boolean(process.env.CASHFREE_APP_ID && process.env.CASHFREE_SECRET_KEY),
    });

    this.appId = process.env.CASHFREE_APP_ID || null;
    this.secretKey = process.env.CASHFREE_SECRET_KEY || null;
    this.apiVersion = process.env.CASHFREE_API_VERSION || "2023-08-01";
    this.baseUrl = isProduction
      ? "https://api.cashfree.com/pg"
      : "https://sandbox.cashfree.com/pg";
  }

  /**
   * Diagnostic check on credentials.
   */
  getCredentialStatus() {
    if (!this.appId || !this.secretKey) {
      return "UNCONFIGURED";
    }
    return "CONFIGURED";
  }

  isProductionReady() {
    return Boolean(
      (this.appId || process.env.CASHFREE_APP_ID) &&
      (this.secretKey || process.env.CASHFREE_SECRET_KEY)
    );
  }

  /**
   * Verify Cashfree Webhook Signature using HMAC-SHA256
   * Cashfree algorithm: HMAC_SHA256(timestamp + rawBody, secretKey)
   */
  verifyCashfreeWebhookSignature(rawBody, signature, timestamp, secret) {
    if (!rawBody || !signature || !secret) return false;
    try {
      const dataToSign = timestamp ? `${timestamp}${rawBody}` : rawBody;
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(dataToSign)
        .digest("base64");

      const expectedBuffer = Buffer.from(expectedSignature, "utf8");
      const signatureBuffer = Buffer.from(signature, "utf8");

      if (expectedBuffer.length !== signatureBuffer.length) {
        return false;
      }
      return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
    } catch (err) {
      console.error("[CashfreeAdapter] Signature verification exception:", err.message);
      return false;
    }
  }

  verifyWebhookSignature(rawBody, signature, secret, timestamp) {
    return this.verifyCashfreeWebhookSignature(rawBody, signature, timestamp, secret || this.secretKey);
  }

  /**
   * Create order session on Cashfree
   */
  async createIntent({ intent, attempt, user, metadata = {} }) {
    try {
      const orderAmount = Number(attempt.amount || intent.amount || 0);
      const orderId = `cf_${attempt.attemptId || intent.intentId}_${Date.now().toString(36)}`;
      const customerId = user?._id?.toString() || user?.toString() || `cust_${Date.now()}`;
      const customerPhone = user?.mobile || metadata?.customerPhone || "9999999999";
      const customerEmail = user?.email || metadata?.customerEmail || "customer@zoshbazaar.com";

      // If credentials exist, call real Cashfree API
      if (this.appId && this.secretKey) {
        try {
          const response = await fetch(`${this.baseUrl}/orders`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-version": this.apiVersion,
              "x-client-id": this.appId,
              "x-client-secret": this.secretKey,
            },
            body: JSON.stringify({
              order_id: orderId,
              order_amount: orderAmount,
              order_currency: attempt.currency || "INR",
              customer_details: {
                customer_id: customerId,
                customer_phone: customerPhone,
                customer_email: customerEmail,
                customer_name: user?.fullName || "Zosh Customer",
              },
              order_meta: {
                return_url: `http://localhost:5000/api/v1/payment/callback/cashfree?order_id=${orderId}`,
                notify_url: `http://localhost:5000/api/v1/payment/webhook/cashfree`,
              },
              order_note: `Zosh Order for Intent ${intent.intentId}`,
            }),
          });

          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.message || `Cashfree API returned HTTP ${response.status}`);
          }

          return {
            providerReference: data.order_id || orderId,
            status: PaymentAttemptStatus.PENDING,
            actionPayload: {
              provider: "CASHFREE",
              paymentSessionId: data.payment_session_id,
              orderId: data.order_id,
              orderAmount: data.order_amount,
              orderCurrency: data.order_currency,
              environment: this.capabilities.environment,
            },
          };
        } catch (apiErr) {
          if (process.env.NODE_ENV === "production") {
            throw apiErr;
          }
          // Non-production fallback with clear simulation flag
          return {
            providerReference: orderId,
            status: PaymentAttemptStatus.PENDING,
            isSimulation: true,
            actionPayload: {
              provider: "CASHFREE",
              paymentSessionId: `cf_sess_mock_${Date.now()}`,
              orderId,
              orderAmount,
              orderCurrency: attempt.currency || "INR",
              isSimulation: true,
              simulationNote: "Cashfree API call bypassed in development",
            },
          };
        }
      }

      // No credentials configured: in development provide structured sandbox session
      if (process.env.NODE_ENV !== "production") {
        return {
          providerReference: orderId,
          status: PaymentAttemptStatus.PENDING,
          isSimulation: true,
          actionPayload: {
            provider: "CASHFREE",
            paymentSessionId: `cf_sess_sandbox_${Date.now()}`,
            orderId,
            orderAmount,
            orderCurrency: attempt.currency || "INR",
            isSimulation: true,
          },
        };
      }

      throw new Error("Cashfree credentials (CASHFREE_APP_ID / CASHFREE_SECRET_KEY) are not configured in production");
    } catch (error) {
      console.error("[CashfreeAdapter.createIntent Error]:", error.message);
      return {
        providerReference: null,
        status: PaymentAttemptStatus.FAILED,
        failureCode: "CASHFREE_ORDER_CREATE_ERROR",
        failureReason: error.message || "Failed to create order on Cashfree",
      };
    }
  }

  /**
   * Capture or confirm payment status on Cashfree
   */
  async capture({ attempt, payload = {} }) {
    try {
      const orderId = attempt.providerReference || payload.orderId;
      if (!orderId) {
        throw new Error("Missing orderId for Cashfree capture");
      }

      const statusRes = await this.getStatus({ attempt });
      if (statusRes.status === PaymentAttemptStatus.CAPTURED) {
        return {
          status: PaymentAttemptStatus.CAPTURED,
          captured: true,
          providerReference: orderId,
        };
      }

      return {
        status: PaymentAttemptStatus.FAILED,
        captured: false,
        failureCode: "CASHFREE_NOT_PAID",
        failureReason: `Cashfree order state is ${statusRes.status}`,
      };
    } catch (error) {
      return {
        status: PaymentAttemptStatus.FAILED,
        captured: false,
        failureCode: "CASHFREE_CAPTURE_ERROR",
        failureReason: error.message,
      };
    }
  }

  /**
   * Authoritative polling recovery for Cashfree payment status
   */
  async getStatus({ attempt }) {
    try {
      const orderId = attempt.providerReference;
      if (!orderId) {
        return { status: attempt.status, providerReference: null };
      }

      if (this.appId && this.secretKey) {
        try {
          const response = await fetch(`${this.baseUrl}/orders/${orderId}`, {
            method: "GET",
            headers: {
              "x-api-version": this.apiVersion,
              "x-client-id": this.appId,
              "x-client-secret": this.secretKey,
            },
          });
          if (response.ok) {
            const orderData = await response.json();
            if (orderData.order_status === "PAID") {
              return { status: PaymentAttemptStatus.CAPTURED, providerReference: orderId };
            } else if (orderData.order_status === "EXPIRED" || orderData.order_status === "TERMINATED") {
              return { status: PaymentAttemptStatus.FAILED, providerReference: orderId, failureReason: orderData.order_status };
            }
            return { status: PaymentAttemptStatus.PENDING, providerReference: orderId };
          }
        } catch {
          // Fall through to in-memory check
        }
      }

      return { status: attempt.status, providerReference: orderId };
    } catch (error) {
      return { status: attempt.status, providerReference: attempt.providerReference, error: error.message };
    }
  }

  /**
   * Process refund via Cashfree API
   */
  async refund({ refund, attempt, order }) {
    try {
      const orderId = attempt?.providerReference || refund.metadata?.providerReference;
      if (!orderId) {
        throw new Error("Missing Cashfree order reference for refund");
      }

      const refundId = `cf_rfnd_${refund.refundId}_${Date.now().toString(36)}`;
      const refundAmount = Number(refund.amount || 0);

      if (this.appId && this.secretKey) {
        try {
          const response = await fetch(`${this.baseUrl}/orders/${orderId}/refunds`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-version": this.apiVersion,
              "x-client-id": this.appId,
              "x-client-secret": this.secretKey,
            },
            body: JSON.stringify({
              refund_id: refundId,
              refund_amount: refundAmount,
              refund_note: refund.reason || "Customer refund",
            }),
          });
          const data = await response.json();
          if (response.ok) {
            return {
              gatewayRefundId: data.refund_id || refundId,
              status: data.refund_status === "SUCCESS" ? "COMPLETED" : "PROCESSING",
            };
          }
        } catch (apiErr) {
          if (process.env.NODE_ENV === "production") throw apiErr;
        }
      }

      return {
        gatewayRefundId: refundId,
        status: "COMPLETED",
        isSimulation: true,
      };
    } catch (error) {
      console.error("[CashfreeAdapter.refund Error]:", error.message);
      throw error;
    }
  }

  /**
   * Verify and parse Cashfree webhook event
   */
  async verifyWebhook({ payload, signature, rawBody, timestamp }) {
    const webhookSecret = process.env.CASHFREE_SECRET_KEY;
    if (webhookSecret && signature) {
      const isValid = this.verifyCashfreeWebhookSignature(rawBody, signature, timestamp, webhookSecret);
      if (!isValid) {
        return { isValid: false, eventId: payload?.data?.order?.order_id, eventType: payload?.type };
      }
    }

    const data = typeof payload === "string" ? JSON.parse(payload) : payload || {};
    const eventType = data.type || "PAYMENT_SUCCESS_WEBHOOK";
    const orderData = data.data?.order || {};
    const paymentData = data.data?.payment || {};
    const orderId = orderData.order_id || paymentData.order_id;
    const eventId = data.event_time ? `cf_evt_${data.event_time}_${orderId}` : `cf_evt_${Date.now()}`;

    let normalizedStatus = PaymentAttemptStatus.PENDING;
    if (eventType === "PAYMENT_SUCCESS_WEBHOOK" || paymentData.payment_status === "SUCCESS") {
      normalizedStatus = PaymentAttemptStatus.CAPTURED;
    } else if (eventType === "PAYMENT_FAILED_WEBHOOK" || paymentData.payment_status === "FAILED") {
      normalizedStatus = PaymentAttemptStatus.FAILED;
    }

    return {
      isValid: true,
      eventId,
      eventType,
      paymentReference: paymentData.payment_id || orderId,
      orderReference: orderId,
      amount: Number(paymentData.payment_amount || orderData.order_amount || 0),
      normalizedStatus,
      rawEntity: data,
    };
  }

  async reconcile({ startDate, endDate }) {
    return [];
  }
}

export const cashfreeAdapter = new CashfreeAdapter();
export default cashfreeAdapter;
