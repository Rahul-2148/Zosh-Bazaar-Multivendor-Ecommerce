import https from "https";
import crypto from "crypto";
import NormalizedPaymentEvent from "../adapters/webhook/NormalizedPaymentEvent.js";

/**
 * Juspay Session Lifecycle States
 */
export const JuspaySessionStatus = Object.freeze({
  SESSION_CREATED: "SESSION_CREATED",
  SESSION_INITIALIZED: "SESSION_INITIALIZED",
  REQUIRES_ACTION: "REQUIRES_ACTION",
  PROCESSING: "PROCESSING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
  EXPIRED: "EXPIRED",
  UNKNOWN: "UNKNOWN",
  RECOVERING: "RECOVERING",
});

/**
 * Juspay Orchestration & Express Checkout / HyperSDK Service
 * Bridges Zosh Checkout with Juspay's client-side HyperSDK and server-to-server APIs.
 *
 * Architecture Invariant:
 * Zosh retains ultimate financial authority over order, amount, ledger, refund, and seller accounting.
 * Juspay acts as checkout middleware/orchestrator; client-side payment success is NEVER trusted
 * without authoritative server-to-server status verification or signed webhook confirmation.
 */
export class JuspayOrchestratorService {
  constructor() {
    this.name = "JUSPAY";
    this.sandboxBaseUrl = "https://sandbox.juspay.in";
    this.productionBaseUrl = "https://api.juspay.in";
  }

  /**
   * Determine active environment and base URL.
   */
  getBaseUrl() {
    const isProd =
      process.env.NODE_ENV === "production" ||
      process.env.PAYMENT_ENV === "production";
    return isProd
      ? process.env.JUSPAY_BASE_URL || this.productionBaseUrl
      : process.env.JUSPAY_BASE_URL || this.sandboxBaseUrl;
  }

  /**
   * Diagnostic credential check.
   */
  getCredentialStatus() {
    const apiKey = process.env.JUSPAY_API_KEY;
    const merchantId = process.env.JUSPAY_MERCHANT_ID;
    const isProd =
      process.env.NODE_ENV === "production" ||
      process.env.PAYMENT_ENV === "production";

    const configured = Boolean(apiKey && merchantId);
    return {
      provider: "JUSPAY",
      role: "ORCHESTRATION_MIDDLEWARE",
      configured,
      environment: isProd ? "production" : "sandbox",
      status: configured ? "CONFIGURED" : "BLOCKED_BY_CREDENTIALS",
      details: {
        apiKeyConfigured: Boolean(apiKey),
        merchantIdConfigured: Boolean(merchantId),
      },
    };
  }

  /**
   * Initialize a Juspay Checkout Session for web / HyperSDK.
   * POST /session
   *
   * @param {Object} params
   * @param {string} params.orderId - Unique Zosh order/attempt identifier
   * @param {number} params.amount - Amount in INR (major units, e.g. 1000.50)
   * @param {string} params.currency - Default "INR"
   * @param {string} params.customerId - Zosh user ID
   * @param {string} [params.customerEmail]
   * @param {string} [params.customerPhone]
   * @param {string} [params.returnUrl] - URL to redirect customer post-payment
   * @returns {Promise<Object>}
   */
  async createSession({
    orderId,
    amount,
    currency = "INR",
    customerId,
    customerEmail = "customer@zoshbazaar.com",
    customerPhone = "9999999999",
    returnUrl = "http://localhost:5173/payment/callback",
    options = {},
  }) {
    const isProd =
      process.env.NODE_ENV === "production" ||
      process.env.PAYMENT_ENV === "production" ||
      options.isProduction;

    const creds = this.getCredentialStatus();
    if (!creds.configured) {
      if (isProd) {
        const err = new Error(
          "Juspay credentials (JUSPAY_API_KEY, JUSPAY_MERCHANT_ID) are missing. Production fails closed."
        );
        err.code = "RAIL_NOT_PRODUCTION_READY";
        err.statusCode = 503;
        throw err;
      }
      return {
        status: "BLOCKED_BY_CREDENTIALS",
        sessionId: null,
        sdkPayload: null,
        message: "Juspay execution is blocked because real merchant credentials are not configured in environment.",
        provider: "JUSPAY",
      };
    }

    const payload = JSON.stringify({
      order_id: String(orderId),
      amount: Number(amount).toFixed(2),
      currency: currency.toUpperCase(),
      customer_id: String(customerId),
      customer_email: customerEmail,
      customer_phone: customerPhone,
      action: "paymentPage",
      return_url: returnUrl,
      payment_page_client_id: process.env.JUSPAY_CLIENT_ID || process.env.JUSPAY_MERCHANT_ID,
    });

    const apiKey = process.env.JUSPAY_API_KEY;
    const authHeader = `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`;
    const baseUrl = this.getBaseUrl();
    const url = new URL("/session", baseUrl);

    return new Promise((resolve, reject) => {
      const req = https.request(
        url,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(payload),
            Authorization: authHeader,
            "x-merchantid": process.env.JUSPAY_MERCHANT_ID,
          },
          timeout: 10000,
        },
        (res) => {
          let body = "";
          res.on("data", (chunk) => (body += chunk));
          res.on("end", () => {
            try {
              const data = JSON.parse(body);
              if (res.statusCode >= 200 && res.statusCode < 300) {
                resolve({
                  status: JuspaySessionStatus.SESSION_CREATED,
                  sessionId: data.session_id || data.id,
                  sdkPayload: data.sdk_payload || data.payment_links || null,
                  orderId,
                  amount,
                  currency,
                  rawResponse: data,
                });
              } else {
                resolve({
                  status: JuspaySessionStatus.FAILED,
                  sessionId: null,
                  errorCode: data.error_code || `HTTP_${res.statusCode}`,
                  errorMessage: data.error_message || body,
                  rawResponse: data,
                });
              }
            } catch (pErr) {
              reject(new Error(`Failed to parse Juspay response: ${pErr.message}`));
            }
          });
        }
      );

      req.on("error", (err) => reject(err));
      req.on("timeout", () => {
        req.destroy();
        resolve({
          status: JuspaySessionStatus.UNKNOWN,
          sessionId: null,
          message: "Juspay session creation timed out. Ambiguous state.",
        });
      });

      req.write(payload);
      req.end();
    });
  }

  /**
   * Server-authoritative status query for an order in Juspay.
   * GET /orders/:order_id
   *
   * @param {string} orderId
   * @returns {Promise<Object>}
   */
  async getOrderStatus(orderId, options = {}) {
    const isProd =
      process.env.NODE_ENV === "production" ||
      process.env.PAYMENT_ENV === "production" ||
      options.isProduction;

    const creds = this.getCredentialStatus();
    if (!creds.configured) {
      if (isProd) {
        const err = new Error(
          "Juspay credentials missing in production. Cannot query order status."
        );
        err.code = "RAIL_NOT_PRODUCTION_READY";
        err.statusCode = 503;
        throw err;
      }
      return {
        status: "BLOCKED_BY_CREDENTIALS",
        orderId,
        normalizedStatus: JuspaySessionStatus.UNKNOWN,
        message: "Juspay credentials not configured.",
      };
    }

    const apiKey = process.env.JUSPAY_API_KEY;
    const authHeader = `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`;
    const baseUrl = this.getBaseUrl();
    const url = new URL(`/orders/${encodeURIComponent(orderId)}`, baseUrl);

    return new Promise((resolve, reject) => {
      const req = https.request(
        url,
        {
          method: "GET",
          headers: {
            Authorization: authHeader,
            "x-merchantid": process.env.JUSPAY_MERCHANT_ID,
          },
          timeout: 10000,
        },
        (res) => {
          let body = "";
          res.on("data", (chunk) => (body += chunk));
          res.on("end", () => {
            try {
              const data = JSON.parse(body);
              const juspayStatus = (data.status || "").toUpperCase();
              let normalizedStatus = JuspaySessionStatus.UNKNOWN;

              if (juspayStatus === "CHARGED") {
                normalizedStatus = JuspaySessionStatus.SUCCESS;
              } else if (juspayStatus === "PENDING_VBV" || juspayStatus === "AUTHORIZING") {
                normalizedStatus = JuspaySessionStatus.PROCESSING;
              } else if (
                juspayStatus === "AUTHENTICATION_FAILED" ||
                juspayStatus === "AUTHORIZATION_FAILED" ||
                juspayStatus === "FAILED"
              ) {
                normalizedStatus = JuspaySessionStatus.FAILED;
              } else if (juspayStatus === "EXPIRED") {
                normalizedStatus = JuspaySessionStatus.EXPIRED;
              }

              resolve({
                orderId,
                rawStatus: data.status,
                normalizedStatus,
                amount: Number(data.amount || 0),
                currency: data.currency || "INR",
                gatewayReference: data.txn_id || data.gateway_id || null,
                rawResponse: data,
              });
            } catch (pErr) {
              reject(new Error(`Failed to parse Juspay order status response: ${pErr.message}`));
            }
          });
        }
      );

      req.on("error", (err) => reject(err));
      req.on("timeout", () => {
        req.destroy();
        resolve({
          orderId,
          normalizedStatus: JuspaySessionStatus.RECOVERING,
          message: "Juspay status query timed out. Marked RECOVERING.",
        });
      });

      req.end();
    });
  }

  /**
   * Verify signature of Juspay webhooks.
   * Uses HMAC SHA-256 with response key or API secret.
   */
  verifyWebhookSignature(rawBody, signature, secret) {
    if (!rawBody || !signature || !secret) return false;
    try {
      const calculatedSignature = crypto
        .createHmac("sha256", secret)
        .update(rawBody)
        .digest("base64");
      const expectedBuffer = Buffer.from(calculatedSignature, "utf8");
      const actualBuffer = Buffer.from(signature, "utf8");
      if (expectedBuffer.length !== actualBuffer.length) return false;
      return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
    } catch {
      return false;
    }
  }

  /**
   * Parse and normalize Juspay webhook payload into NormalizedPaymentEvent.
   */
  normalizeWebhookPayload(payload) {
    const data = typeof payload === "string" ? JSON.parse(payload) : payload || {};
    const content = data.content || data;
    const orderData = content.order || content;
    const orderId = orderData.order_id || content.order_id || null;
    const eventId = data.id || `juspay_evt_${orderId}_${Date.now()}`;
    const status = (orderData.status || content.status || "").toUpperCase();

    let normalizedStatus = "UNKNOWN";
    let eventType = "UNKNOWN";

    if (status === "CHARGED") {
      normalizedStatus = "CAPTURED";
      eventType = "PAYMENT_CAPTURED";
    } else if (
      status === "AUTHENTICATION_FAILED" ||
      status === "AUTHORIZATION_FAILED" ||
      status === "FAILED"
    ) {
      normalizedStatus = "FAILED";
      eventType = "PAYMENT_FAILED";
    } else if (status === "REFUNDED") {
      normalizedStatus = "REFUNDED";
      eventType = "REFUND_PROCESSED";
    }

    return new NormalizedPaymentEvent({
      provider: "JUSPAY",
      eventId,
      eventType,
      paymentReference: orderData.txn_id || content.txn_id || null,
      orderReference: orderId,
      amount: Number(orderData.amount || content.amount || 0),
      currency: orderData.currency || content.currency || "INR",
      status: normalizedStatus,
      timestamp: new Date(),
      rawPayload: data,
    });
  }
}

export const juspayOrchestratorService = new JuspayOrchestratorService();
export default juspayOrchestratorService;
