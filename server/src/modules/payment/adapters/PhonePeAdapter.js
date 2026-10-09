import crypto from "crypto";
import PaymentRailAdapter from "./PaymentRailAdapter.js";
import PaymentAttemptStatus from "../domain/PaymentAttemptStatus.js";

/**
 * PhonePe Payment Gateway Rail Adapter
 * Enterprise Multi-PSP Adapter for PhonePe V1 Standard Merchant APIs.
 * Supports UPI, Cards, NetBanking via PhonePe Standard Pay Page & Server-to-Server APIs.
 */
export class PhonePeAdapter extends PaymentRailAdapter {
  constructor() {
    const isProduction =
      process.env.PHONEPE_ENV === "production" ||
      (process.env.NODE_ENV === "production" && Boolean(process.env.PHONEPE_MERCHANT_ID));

    super("PHONEPE", {
      railType: "ALL",
      provider: "PHONEPE",
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
      supportsTokenization: false,
      supports3DS: true,
      supportsNetBanking: true,
      supportsEMI: false,
      supportsPayout: false,
      supportsReconciliation: true,
      supportsCOD: false,
      environment: isProduction ? "production" : "sandbox",
      productionReady: Boolean(
        process.env.PHONEPE_MERCHANT_ID &&
        process.env.PHONEPE_SALT_KEY &&
        process.env.PHONEPE_SALT_INDEX
      ),
    });

    this.merchantId = process.env.PHONEPE_MERCHANT_ID || null;
    this.saltKey = process.env.PHONEPE_SALT_KEY || null;
    this.saltIndex = process.env.PHONEPE_SALT_INDEX || "1";
    this.baseUrl = isProduction
      ? "https://api.phonepe.com/apis/hermes"
      : "https://api-preprod.phonepe.com/apis/pg-sandbox";
  }

  /**
   * Diagnostic check on credentials.
   */
  getCredentialStatus() {
    if (!this.merchantId || !this.saltKey) {
      return "UNCONFIGURED";
    }
    return "CONFIGURED";
  }

  isProductionReady() {
    return Boolean(
      (this.merchantId || process.env.PHONEPE_MERCHANT_ID) &&
      (this.saltKey || process.env.PHONEPE_SALT_KEY) &&
      (this.saltIndex || process.env.PHONEPE_SALT_INDEX)
    );
  }

  /**
   * Calculate PhonePe X-VERIFY checksum header
   * Formula: SHA256(payload + endpoint + saltKey) + "###" + saltIndex
   */
  generateChecksum(payload, endpoint) {
    const saltKey = this.saltKey || process.env.PHONEPE_SALT_KEY || "mock_salt";
    const saltIndex = this.saltIndex || process.env.PHONEPE_SALT_INDEX || "1";
    const stringToHash = `${payload}${endpoint}${saltKey}`;
    const hash = crypto.createHash("sha256").update(stringToHash).digest("hex");
    return `${hash}###${saltIndex}`;
  }

  /**
   * Verify PhonePe Callback/Webhook Checksum
   * Formula: SHA256(responseBase64 + saltKey) + "###" + saltIndex
   */
  verifyWebhookSignature(rawBody, signature, secret) {
    if (!signature) return false;
    const saltKey = secret || this.saltKey || process.env.PHONEPE_SALT_KEY;
    if (!saltKey) return false;

    const base64Body = typeof rawBody === "string" ? rawBody : JSON.stringify(rawBody);
    const [expectedHash, index] = signature.split("###");
    if (!expectedHash) return false;

    const stringToHash = `${base64Body}${saltKey}`;
    const calculatedHash = crypto.createHash("sha256").update(stringToHash).digest("hex");

    try {
      const expectedBuffer = Buffer.from(expectedHash, "utf8");
      const actualBuffer = Buffer.from(calculatedHash, "utf8");
      if (expectedBuffer.length !== actualBuffer.length) return false;
      return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
    } catch {
      return false;
    }
  }

  async createIntent({ intent, attempt, user, metadata }) {
    this.assertProductionReady("createIntent");

    const merchantTransactionId = attempt.attemptId;
    const merchantUserId = user?._id?.toString() || user?.toString() || "cust_guest";
    const amountInPaise = Math.round(Number(attempt.amount) * 100);

    // If unconfigured in sandbox/dev mode
    if (!this.isProductionReady()) {
      if (process.env.NODE_ENV === "production") {
        const err = new Error("PhonePe credentials missing in production environment");
        err.code = "BLOCKED_BY_CREDENTIALS";
        err.statusCode = 503;
        throw err;
      }

      return {
        providerReference: `phonepe_mock_${merchantTransactionId}`,
        status: PaymentAttemptStatus.PENDING,
        isSimulation: true,
        actionPayload: {
          provider: "PHONEPE",
          merchantTransactionId,
          amount: amountInPaise,
          currency: "INR",
          instrumentType: "PAY_PAGE",
          redirectUrl: `${this.baseUrl}/pg/v1/pay`,
          isSimulation: true,
          diagnostic: "BLOCKED_BY_CREDENTIALS",
        },
      };
    }

    const payloadObj = {
      merchantId: this.merchantId,
      merchantTransactionId,
      merchantUserId,
      amount: amountInPaise,
      redirectUrl: `${process.env.APP_URL || "http://localhost:5454"}/api/v1/payment/callback/phonepe`,
      redirectMode: "POST",
      callbackUrl: `${process.env.APP_URL || "http://localhost:5454"}/api/v1/payment/webhook/phonepe`,
      mobileNumber: user?.mobile || "9999999999",
      paymentInstrument: {
        type: "PAY_PAGE",
      },
    };

    const base64Payload = Buffer.from(JSON.stringify(payloadObj)).toString("base64");
    const endpoint = "/pg/v1/pay";
    const xVerify = this.generateChecksum(base64Payload, endpoint);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": xVerify,
        },
        body: JSON.stringify({ request: base64Payload }),
      });

      const data = await response.json();
      if (data.success && data.data?.instrumentResponse?.redirectInfo?.url) {
        return {
          providerReference: merchantTransactionId,
          status: PaymentAttemptStatus.PENDING,
          actionPayload: {
            provider: "PHONEPE",
            merchantTransactionId,
            redirectUrl: data.data.instrumentResponse.redirectInfo.url,
            raw: data,
          },
        };
      }

      return {
        providerReference: merchantTransactionId,
        status: PaymentAttemptStatus.PENDING,
        actionPayload: {
          provider: "PHONEPE",
          merchantTransactionId,
          raw: data,
        },
      };
    } catch (err) {
      console.error("[PhonePeAdapter.createIntent Error]:", err.message);
      return {
        providerReference: null,
        status: PaymentAttemptStatus.FAILED,
        failureCode: "PHONEPE_PAY_ERROR",
        failureReason: err.message,
      };
    }
  }

  async capture({ attempt, payload }) {
    const txId = payload?.transactionId || attempt.providerReference;
    if (!txId) {
      throw new Error("Missing transaction reference for PhonePe capture");
    }

    if (!this.isProductionReady()) {
      if (process.env.NODE_ENV === "production") {
        const err = new Error("PhonePe capture cannot execute in production without credentials");
        err.code = "BLOCKED_BY_CREDENTIALS";
        err.statusCode = 503;
        throw err;
      }
      return {
        status: PaymentAttemptStatus.CAPTURED,
        captured: true,
        providerReference: txId,
        isSimulation: true,
      };
    }

    const statusResult = await this.getStatus({ attempt });
    if (statusResult.status === PaymentAttemptStatus.CAPTURED) {
      return {
        status: PaymentAttemptStatus.CAPTURED,
        captured: true,
        providerReference: txId,
      };
    }

    return {
      status: PaymentAttemptStatus.FAILED,
      captured: false,
      failureCode: "PHONEPE_CAPTURE_DECLINED",
      failureReason: "Transaction not confirmed as COMPLETED on PhonePe",
    };
  }

  async getStatus({ attempt }) {
    const merchantTransactionId = attempt.providerReference;
    if (!merchantTransactionId) {
      return { status: attempt.status, providerReference: null };
    }

    if (!this.isProductionReady()) {
      return {
        status: attempt.status,
        providerReference: merchantTransactionId,
        isSimulation: true,
        diagnostic: "BLOCKED_BY_CREDENTIALS",
      };
    }

    try {
      const endpoint = `/pg/v1/status/${this.merchantId}/${merchantTransactionId}`;
      const xVerify = this.generateChecksum("", endpoint);

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": xVerify,
          "X-MERCHANT-ID": this.merchantId,
        },
      });

      const data = await response.json();
      if (data.success && data.code === "PAYMENT_SUCCESS") {
        return {
          status: PaymentAttemptStatus.CAPTURED,
          providerReference: data.data?.transactionId || merchantTransactionId,
        };
      } else if (data.code === "PAYMENT_ERROR" || data.code === "PAYMENT_DECLINED") {
        return {
          status: PaymentAttemptStatus.FAILED,
          providerReference: merchantTransactionId,
          failureReason: data.message || "Payment declined at PhonePe gateway",
        };
      }

      return { status: PaymentAttemptStatus.PENDING, providerReference: merchantTransactionId };
    } catch (err) {
      return { status: attempt.status, providerReference: merchantTransactionId, error: err.message };
    }
  }

  async refund({ refund, attempt, order }) {
    const merchantTransactionId = attempt?.providerReference || refund.metadata?.merchantTransactionId;
    if (!merchantTransactionId) {
      throw new Error("Missing transaction reference for PhonePe refund");
    }

    if (!this.isProductionReady()) {
      if (process.env.NODE_ENV === "production") {
        const err = new Error("PhonePe refund cannot execute in production without credentials");
        err.code = "BLOCKED_BY_CREDENTIALS";
        err.statusCode = 503;
        throw err;
      }
      return {
        gatewayRefundId: `phonepe_rfnd_mock_${Date.now()}`,
        status: "COMPLETED",
        isSimulation: true,
      };
    }

    try {
      const refundTransactionId = `rfnd_${refund.refundId}`;
      const amountInPaise = Math.round(Number(refund.amount) * 100);

      const payloadObj = {
        merchantId: this.merchantId,
        merchantUserId: order?.user?.toString() || "cust_system",
        originalTransactionId: merchantTransactionId,
        merchantTransactionId: refundTransactionId,
        amount: amountInPaise,
        callbackUrl: `${process.env.APP_URL || "http://localhost:5454"}/api/v1/payment/webhook/phonepe`,
      };

      const base64Payload = Buffer.from(JSON.stringify(payloadObj)).toString("base64");
      const endpoint = "/pg/v1/refund";
      const xVerify = this.generateChecksum(base64Payload, endpoint);

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": xVerify,
        },
        body: JSON.stringify({ request: base64Payload }),
      });

      const data = await response.json();
      if (data.success && (data.code === "PAYMENT_SUCCESS" || data.code === "PAYMENT_PENDING")) {
        return {
          gatewayRefundId: data.data?.transactionId || refundTransactionId,
          status: data.code === "PAYMENT_SUCCESS" ? "COMPLETED" : "PROCESSING",
        };
      }

      throw new Error(data.message || "PhonePe refund declined by gateway");
    } catch (err) {
      console.error("[PhonePeAdapter.refund Error]:", err.message);
      throw err;
    }
  }
}

export const phonepeAdapter = new PhonePeAdapter();
export default phonepeAdapter;
