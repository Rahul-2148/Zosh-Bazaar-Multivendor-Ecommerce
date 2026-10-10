import crypto from "crypto";
import NormalizedPaymentEvent from "./NormalizedPaymentEvent.js";

/**
 * Provider Webhook Adapter Base Contract
 */
export class ProviderWebhookAdapter {
  constructor(providerName) {
    this.providerName = providerName.toUpperCase();
  }

  /**
   * Verify signature and normalize provider payload into NormalizedPaymentEvent.
   * @param {Object} params - { rawBody, signature, headers, payload }
   * @returns {Promise<{ isValid: boolean, normalizedEvent: NormalizedPaymentEvent }>}
   */
  async processWebhook(_params) {
    throw new Error(`[${this.providerName}] processWebhook() not implemented`);
  }
}

/**
 * Razorpay Webhook Adapter
 */
export class RazorpayWebhookAdapter extends ProviderWebhookAdapter {
  constructor() {
    super("RAZORPAY");
  }

  verifySignature(rawBody, signature, secret) {
    if (!rawBody || !signature || !secret) return false;
    try {
      const hmac = crypto.createHmac("sha256", secret);
      hmac.update(rawBody);
      const digest = hmac.digest("hex");
      const expectedBuffer = Buffer.from(digest, "utf8");
      const signatureBuffer = Buffer.from(signature, "utf8");
      if (expectedBuffer.length !== signatureBuffer.length) return false;
      return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
    } catch {
      return false;
    }
  }

  async processWebhook({ rawBody, signature, payload }) {
    const webhookSecret =
      process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;

    const isValid = this.verifySignature(rawBody, signature, webhookSecret);
    if (!isValid) {
      return { isValid: false, normalizedEvent: null };
    }

    const eventData = typeof payload === "string" ? JSON.parse(payload) : payload || {};
    const eventId = eventData.id || `evt_rzp_${Date.now()}`;
    const eventType = eventData.event;
    const paymentEntity = eventData.payload?.payment?.entity || {};

    let normalizedStatus = "UNKNOWN";
    let normalizedType = eventType;

    if (eventType === "payment.captured") {
      normalizedStatus = "CAPTURED";
      normalizedType = "PAYMENT_CAPTURED";
    } else if (eventType === "payment.failed") {
      normalizedStatus = "FAILED";
      normalizedType = "PAYMENT_FAILED";
    } else if (eventType === "refund.processed") {
      normalizedStatus = "REFUNDED";
      normalizedType = "REFUND_PROCESSED";
    }

    const normalizedEvent = new NormalizedPaymentEvent({
      provider: "RAZORPAY",
      eventId,
      eventType: normalizedType,
      paymentReference: paymentEntity.id || null,
      orderReference: paymentEntity.order_id || null,
      amount: Number(paymentEntity.amount || 0) / 100, // Paise to INR
      currency: paymentEntity.currency || "INR",
      status: normalizedStatus,
      timestamp: eventData.created_at ? new Date(eventData.created_at * 1000) : new Date(),
      rawPayload: eventData,
    });

    return { isValid: true, normalizedEvent };
  }
}

/**
 * Sandbox Webhook Adapter (for simulated gateway webhooks)
 */
export class SandboxWebhookAdapter extends ProviderWebhookAdapter {
  constructor() {
    super("SANDBOX");
  }

  async processWebhook({ payload }) {
    const data = typeof payload === "string" ? JSON.parse(payload) : payload || {};
    const eventId = data.eventId || data.id || `evt_sbx_${Date.now()}`;
    const status = (data.status || "CAPTURED").toUpperCase();

    const normalizedEvent = new NormalizedPaymentEvent({
      provider: "SANDBOX",
      eventId,
      eventType: status === "CAPTURED" ? "PAYMENT_CAPTURED" : "PAYMENT_FAILED",
      paymentReference: data.paymentReference || data.providerReference || `sbx_ref_${Date.now()}`,
      orderReference: data.orderReference || data.intentId || null,
      amount: Number(data.amount || 0),
      currency: data.currency || "INR",
      status,
      timestamp: new Date(),
      rawPayload: data,
    });

    return { isValid: true, normalizedEvent };
  }
}

/**
 * Cashfree Webhook Adapter
 */
export class CashfreeWebhookAdapter extends ProviderWebhookAdapter {
  constructor() {
    super("CASHFREE");
  }

  verifySignature(rawBody, signature, timestamp, secret) {
    if (!rawBody || !signature || !secret) return false;
    try {
      const dataToSign = timestamp ? `${timestamp}${rawBody}` : rawBody;
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(dataToSign)
        .digest("base64");
      const expectedBuffer = Buffer.from(expectedSignature, "utf8");
      const signatureBuffer = Buffer.from(signature, "utf8");
      if (expectedBuffer.length !== signatureBuffer.length) return false;
      return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
    } catch {
      return false;
    }
  }

  async processWebhook({ rawBody, signature, headers = {}, payload }) {
    const webhookSecret = process.env.CASHFREE_SECRET_KEY;
    const timestamp = headers["x-webhook-timestamp"] || headers["X-Webhook-Timestamp"];

    if (webhookSecret && signature) {
      const isValid = this.verifySignature(rawBody, signature, timestamp, webhookSecret);
      if (!isValid) {
        return { isValid: false, normalizedEvent: null };
      }
    }

    const data = typeof payload === "string" ? JSON.parse(payload) : payload || {};
    const eventType = data.type || "PAYMENT_SUCCESS_WEBHOOK";
    const orderData = data.data?.order || {};
    const paymentData = data.data?.payment || {};
    const orderId = orderData.order_id || paymentData.order_id || null;
    const paymentId = paymentData.payment_id || orderId || null;
    const eventId = data.event_time ? `cf_evt_${data.event_time}_${orderId}` : `cf_evt_${Date.now()}`;

    let normalizedStatus = "UNKNOWN";
    let normalizedType = eventType;

    if (eventType === "PAYMENT_SUCCESS_WEBHOOK" || paymentData.payment_status === "SUCCESS") {
      normalizedStatus = "CAPTURED";
      normalizedType = "PAYMENT_CAPTURED";
    } else if (eventType === "PAYMENT_FAILED_WEBHOOK" || paymentData.payment_status === "FAILED") {
      normalizedStatus = "FAILED";
      normalizedType = "PAYMENT_FAILED";
    } else if (eventType === "REFUND_SUCCESS_WEBHOOK") {
      normalizedStatus = "REFUNDED";
      normalizedType = "REFUND_PROCESSED";
    }

    const normalizedEvent = new NormalizedPaymentEvent({
      provider: "CASHFREE",
      eventId,
      eventType: normalizedType,
      paymentReference: paymentId,
      orderReference: orderId,
      amount: Number(paymentData.payment_amount || orderData.order_amount || 0),
      currency: paymentData.payment_currency || orderData.order_currency || "INR",
      status: normalizedStatus,
      timestamp: data.event_time ? new Date(data.event_time) : new Date(),
      rawPayload: data,
    });

    return { isValid: true, normalizedEvent };
  }
}

export const razorpayWebhookAdapter = new RazorpayWebhookAdapter();
export const sandboxWebhookAdapter = new SandboxWebhookAdapter();
export const cashfreeWebhookAdapter = new CashfreeWebhookAdapter();

/**
 * PayU Webhook Adapter
 */
export class PayUWebhookAdapter extends ProviderWebhookAdapter {
  constructor() {
    super("PAYU");
  }

  verifySignature(payload, signature, salt) {
    if (!payload || !salt) return false;
    const key = payload.key || process.env.PAYU_MERCHANT_KEY || "";
    const amountStr = Number(payload.amount).toFixed(2);
    const status = payload.status || "";
    const udf1 = payload.udf1 || "";
    const udf2 = payload.udf2 || "";
    const udf3 = payload.udf3 || "";
    const udf4 = payload.udf4 || "";
    const udf5 = payload.udf5 || "";
    const email = payload.email || "";
    const firstname = payload.firstname || "";
    const productinfo = payload.productinfo || "";
    const txnid = payload.txnid || "";
    const additionalCharges = payload.additionalCharges || "";
    const responseHash = signature || payload.hash;

    if (!responseHash) return false;

    let hashSequence = `${salt}|${status}||||||${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amountStr}|${txnid}|${key}`;
    if (additionalCharges) {
      hashSequence = `${additionalCharges}|${hashSequence}`;
    }

    try {
      const calculatedHash = crypto.createHash("sha512").update(hashSequence).digest("hex");
      const expectedBuffer = Buffer.from(calculatedHash, "utf8");
      const actualBuffer = Buffer.from(responseHash, "utf8");
      if (expectedBuffer.length !== actualBuffer.length) return false;
      return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
    } catch {
      return false;
    }
  }

  async processWebhook({ rawBody: _rawBody, signature, headers = {}, payload }) {
    const webhookSecret = process.env.PAYU_MERCHANT_SALT;
    const data = typeof payload === "string" ? JSON.parse(payload) : payload || {};
    const sig = signature || data.hash || headers["x-payu-signature"];

    if (webhookSecret && sig) {
      const isValid = this.verifySignature(data, sig, webhookSecret);
      if (!isValid) {
        return { isValid: false, normalizedEvent: null };
      }
    }

    const eventId = data.mihpayid ? `payu_evt_${data.mihpayid}` : `payu_evt_${Date.now()}`;
    const statusStr = (data.status || "").toLowerCase();
    const isSuccess = statusStr === "success";

    const normalizedStatus = isSuccess ? "CAPTURED" : "FAILED";
    const normalizedType = isSuccess ? "PAYMENT_CAPTURED" : "PAYMENT_FAILED";

    const normalizedEvent = new NormalizedPaymentEvent({
      provider: "PAYU",
      eventId,
      eventType: normalizedType,
      paymentReference: data.mihpayid || data.txnid || null,
      orderReference: data.udf1 || data.txnid || null,
      amount: Number(data.amount || 0),
      currency: "INR",
      status: normalizedStatus,
      timestamp: new Date(),
      rawPayload: data,
    });

    return { isValid: true, normalizedEvent };
  }
}

/**
 * PhonePe Webhook Adapter
 */
export class PhonePeWebhookAdapter extends ProviderWebhookAdapter {
  constructor() {
    super("PHONEPE");
  }

  verifySignature(base64Payload, signature, saltKey, _saltIndex = "1") {
    if (!base64Payload || !signature || !saltKey) return false;
    try {
      const [expectedHash, _receivedIndex] = signature.split("###");
      if (!expectedHash) return false;
      const stringToHash = `${base64Payload}${saltKey}`;
      const calculatedHash = crypto.createHash("sha256").update(stringToHash).digest("hex");
      const expectedBuffer = Buffer.from(expectedHash, "utf8");
      const actualBuffer = Buffer.from(calculatedHash, "utf8");
      if (expectedBuffer.length !== actualBuffer.length) return false;
      return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
    } catch {
      return false;
    }
  }

  async processWebhook({ rawBody: _rawBody, signature, headers = {}, payload }) {
    const saltKey = process.env.PHONEPE_SALT_KEY;
    const saltIndex = process.env.PHONEPE_SALT_INDEX || "1";
    const sig =
      signature ||
      headers["x-verify"] ||
      headers["X-VERIFY"] ||
      headers["x-phonepe-signature"];

    let base64Response = "";
    let decodedData = {};

    if (payload && payload.response) {
      base64Response = payload.response;
      try {
        const decodedStr = Buffer.from(base64Response, "base64").toString("utf8");
        decodedData = JSON.parse(decodedStr);
      } catch {
        decodedData = payload;
      }
    } else if (typeof payload === "object" && payload !== null) {
      decodedData = payload;
      base64Response = Buffer.from(JSON.stringify(payload)).toString("base64");
    }

    if (saltKey && sig && base64Response) {
      const isValid = this.verifySignature(base64Response, sig, saltKey, saltIndex);
      if (!isValid) {
        return { isValid: false, normalizedEvent: null };
      }
    }

    const txData = decodedData.data || {};
    const success =
      decodedData.success === true &&
      (decodedData.code === "PAYMENT_SUCCESS" || txData.state === "COMPLETED");
    const eventId = txData.transactionId
      ? `phonepe_evt_${txData.transactionId}`
      : `phonepe_evt_${Date.now()}`;
    const normalizedStatus = success ? "CAPTURED" : "FAILED";
    const normalizedType = success ? "PAYMENT_CAPTURED" : "PAYMENT_FAILED";

    const normalizedEvent = new NormalizedPaymentEvent({
      provider: "PHONEPE",
      eventId,
      eventType: normalizedType,
      paymentReference: txData.transactionId || txData.merchantTransactionId || null,
      orderReference: txData.merchantTransactionId || null,
      amount: txData.amount ? Number(txData.amount) / 100 : 0, // PhonePe amounts are in paise
      currency: "INR",
      status: normalizedStatus,
      timestamp: new Date(),
      rawPayload: decodedData,
    });

    return { isValid: true, normalizedEvent };
  }
}

/**
 * Juspay Webhook Adapter
 */
export class JuspayWebhookAdapter extends ProviderWebhookAdapter {
  constructor() {
    super("JUSPAY");
  }

  verifySignature(rawBody, signature, secret) {
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

  async processWebhook({ rawBody, signature, headers = {}, payload }) {
    const webhookSecret = process.env.JUSPAY_RESPONSE_KEY || process.env.JUSPAY_API_KEY;
    const sig = signature || headers["x-juspay-signature"] || headers["x-signature"];

    if (webhookSecret && sig) {
      const isValid = this.verifySignature(rawBody, sig, webhookSecret);
      if (!isValid) {
        return { isValid: false, normalizedEvent: null };
      }
    }

    const data = typeof payload === "string" ? JSON.parse(payload) : payload || {};
    const content = data.content || data;
    const orderData = content.order || content;
    const orderId = orderData.order_id || content.order_id || null;
    const eventId = data.id || `juspay_evt_${orderId}_${Date.now()}`;
    const status = (orderData.status || content.status || "").toUpperCase();

    let normalizedStatus = "UNKNOWN";
    let normalizedType = "UNKNOWN";

    if (status === "CHARGED") {
      normalizedStatus = "CAPTURED";
      normalizedType = "PAYMENT_CAPTURED";
    } else if (
      status === "AUTHENTICATION_FAILED" ||
      status === "AUTHORIZATION_FAILED" ||
      status === "FAILED"
    ) {
      normalizedStatus = "FAILED";
      normalizedType = "PAYMENT_FAILED";
    } else if (status === "REFUNDED") {
      normalizedStatus = "REFUNDED";
      normalizedType = "REFUND_PROCESSED";
    }

    const normalizedEvent = new NormalizedPaymentEvent({
      provider: "JUSPAY",
      eventId,
      eventType: normalizedType,
      paymentReference: orderData.txn_id || content.txn_id || null,
      orderReference: orderId,
      amount: Number(orderData.amount || content.amount || 0),
      currency: orderData.currency || content.currency || "INR",
      status: normalizedStatus,
      timestamp: new Date(),
      rawPayload: data,
    });

    return { isValid: true, normalizedEvent };
  }
}

export const payuWebhookAdapter = new PayUWebhookAdapter();
export const phonepeWebhookAdapter = new PhonePeWebhookAdapter();
export const juspayWebhookAdapter = new JuspayWebhookAdapter();

export const webhookAdapters = {
  RAZORPAY: razorpayWebhookAdapter,
  SANDBOX: sandboxWebhookAdapter,
  CASHFREE: cashfreeWebhookAdapter,
  PAYU: payuWebhookAdapter,
  PHONEPE: phonepeWebhookAdapter,
  JUSPAY: juspayWebhookAdapter,
};

export default webhookAdapters;

