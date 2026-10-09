import crypto from "crypto";
import PaymentRailAdapter from "./PaymentRailAdapter.js";
import PaymentAttemptStatus from "../domain/PaymentAttemptStatus.js";

/**
 * PayU Payments Rail Adapter
 * Enterprise Multi-PSP Adapter for PayU Hosted & Webservice APIs (UPI, Cards, NetBanking, EMI).
 * Operates as a tertiary regulated execution rail behind the Zosh Payment Orchestrator.
 */
export class PayUAdapter extends PaymentRailAdapter {
  constructor() {
    const isProduction =
      process.env.PAYU_ENV === "production" ||
      (process.env.NODE_ENV === "production" && Boolean(process.env.PAYU_MERCHANT_KEY));

    super("PAYU", {
      railType: "ALL",
      provider: "PAYU",
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
      productionReady: Boolean(process.env.PAYU_MERCHANT_KEY && process.env.PAYU_MERCHANT_SALT),
    });

    this.merchantKey = process.env.PAYU_MERCHANT_KEY || null;
    this.merchantSalt = process.env.PAYU_MERCHANT_SALT || null;
    this.baseUrl = isProduction
      ? "https://secure.payu.in/_payment"
      : "https://test.payu.in/_payment";
    this.serviceUrl = isProduction
      ? "https://info.payu.in/merchant/postservice?form=2"
      : "https://test.payu.in/merchant/postservice?form=2";
  }

  /**
   * Diagnostic check on credentials.
   */
  getCredentialStatus() {
    if (!this.merchantKey || !this.merchantSalt) {
      return "UNCONFIGURED";
    }
    return "CONFIGURED";
  }

  isProductionReady() {
    return Boolean(
      (this.merchantKey || process.env.PAYU_MERCHANT_KEY) &&
      (this.merchantSalt || process.env.PAYU_MERCHANT_SALT)
    );
  }

  /**
   * Generate PayU Request Hash (SHA-512)
   * Formula: sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT)
   */
  generatePaymentHash({
    txnid,
    amount,
    productinfo,
    firstname,
    email,
    udf1 = "",
    udf2 = "",
    udf3 = "",
    udf4 = "",
    udf5 = "",
  }) {
    const key = this.merchantKey || process.env.PAYU_MERCHANT_KEY || "mock_key";
    const salt = this.merchantSalt || process.env.PAYU_MERCHANT_SALT || "mock_salt";
    const amountStr = Number(amount).toFixed(2);

    const hashString = `${key}|${txnid}|${amountStr}|${productinfo}|${firstname}|${email}|${udf1}|${udf2}|${udf3}|${udf4}|${udf5}||||||${salt}`;
    return crypto.createHash("sha512").update(hashString).digest("hex");
  }

  /**
   * Verify PayU Response Hash (SHA-512)
   * Formula: sha512(additionalCharges|SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
   */
  verifyResponseHash({
    additionalCharges = "",
    status,
    udf1 = "",
    udf2 = "",
    udf3 = "",
    udf4 = "",
    udf5 = "",
    email = "",
    firstname = "",
    productinfo = "",
    amount,
    txnid,
    responseHash,
  }) {
    if (!responseHash) return false;

    const key = this.merchantKey || process.env.PAYU_MERCHANT_KEY || "";
    const salt = this.merchantSalt || process.env.PAYU_MERCHANT_SALT || "";
    const amountStr = Number(amount).toFixed(2);

    let hashSequence = `${salt}|${status}||||||${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amountStr}|${txnid}|${key}`;
    if (additionalCharges) {
      hashSequence = `${additionalCharges}|${hashSequence}`;
    }

    const calculatedHash = crypto.createHash("sha512").update(hashSequence).digest("hex");

    try {
      const expectedBuffer = Buffer.from(calculatedHash, "utf8");
      const actualBuffer = Buffer.from(responseHash, "utf8");
      if (expectedBuffer.length !== actualBuffer.length) return false;
      return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
    } catch {
      return false;
    }
  }

  verifyWebhookSignature(rawBody, signature, secret) {
    // PayU response hashes are verified via verifyResponseHash
    if (typeof rawBody === "object" && rawBody !== null) {
      return this.verifyResponseHash({
        ...rawBody,
        responseHash: signature || rawBody.hash,
      });
    }
    return false;
  }

  async createIntent({ intent, attempt, user, metadata }) {
    this.assertProductionReady("createIntent");

    const txnid = attempt.attemptId;
    const amount = Number(attempt.amount).toFixed(2);
    const productinfo = `Zosh Bazaar Order for Intent ${intent.intentId}`;
    const firstname = user?.fullName?.split(" ")[0] || "Customer";
    const email = user?.email || "customer@zoshbazaar.com";
    const phone = user?.mobile || "9999999999";

    // If credentials are unconfigured in development/sandbox mode
    if (!this.isProductionReady()) {
      if (process.env.NODE_ENV === "production") {
        const err = new Error("PayU credentials missing in production environment");
        err.code = "BLOCKED_BY_CREDENTIALS";
        err.statusCode = 503;
        throw err;
      }

      return {
        providerReference: `payu_mock_${txnid}`,
        status: PaymentAttemptStatus.PENDING,
        isSimulation: true,
        actionPayload: {
          provider: "PAYU",
          paymentUrl: this.baseUrl,
          txnid,
          amount,
          productinfo,
          firstname,
          email,
          phone,
          isSimulation: true,
          diagnostic: "BLOCKED_BY_CREDENTIALS",
        },
      };
    }

    const hash = this.generatePaymentHash({
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      udf1: intent.intentId,
    });

    return {
      providerReference: txnid,
      status: PaymentAttemptStatus.PENDING,
      actionPayload: {
        provider: "PAYU",
        paymentUrl: this.baseUrl,
        key: this.merchantKey,
        txnid,
        amount,
        productinfo,
        firstname,
        email,
        phone,
        hash,
        surl: `${process.env.APP_URL || "http://localhost:5454"}/api/v1/payment/callback/payu/success`,
        furl: `${process.env.APP_URL || "http://localhost:5454"}/api/v1/payment/callback/payu/failure`,
        udf1: intent.intentId,
      },
    };
  }

  async capture({ attempt, payload }) {
    const paymentId = payload?.mihpayid || payload?.txnid || attempt.providerReference;
    if (!paymentId) {
      throw new Error("Missing transaction reference for PayU capture");
    }

    if (!this.isProductionReady()) {
      if (process.env.NODE_ENV === "production") {
        const err = new Error("PayU capture cannot execute in production without credentials");
        err.code = "BLOCKED_BY_CREDENTIALS";
        err.statusCode = 503;
        throw err;
      }
      return {
        status: PaymentAttemptStatus.CAPTURED,
        captured: true,
        providerReference: paymentId,
        isSimulation: true,
      };
    }

    // Call verify_payment API
    const statusResult = await this.getStatus({ attempt });
    if (statusResult.status === PaymentAttemptStatus.CAPTURED) {
      return {
        status: PaymentAttemptStatus.CAPTURED,
        captured: true,
        providerReference: paymentId,
      };
    }

    return {
      status: PaymentAttemptStatus.FAILED,
      captured: false,
      failureCode: "PAYU_CAPTURE_DECLINED",
      failureReason: "PayU transaction not confirmed as success",
    };
  }

  async getStatus({ attempt }) {
    const txnid = attempt.providerReference;
    if (!txnid) {
      return { status: attempt.status, providerReference: null };
    }

    if (!this.isProductionReady()) {
      return {
        status: attempt.status,
        providerReference: txnid,
        isSimulation: true,
        diagnostic: "BLOCKED_BY_CREDENTIALS",
      };
    }

    try {
      // In live mode with credentials, calls PayU postservice API
      const command = "verify_payment";
      const key = this.merchantKey;
      const salt = this.merchantSalt;
      const hashStr = `${key}|${command}|${txnid}|${salt}`;
      const hash = crypto.createHash("sha512").update(hashStr).digest("hex");

      const formBody = new URLSearchParams({
        key,
        command,
        var1: txnid,
        hash,
      });

      const response = await fetch(this.serviceUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formBody.toString(),
      });

      const data = await response.json();
      const txDetails = data.transaction_details?.[txnid];

      if (txDetails && txDetails.status === "success") {
        return {
          status: PaymentAttemptStatus.CAPTURED,
          providerReference: txDetails.mihpayid || txnid,
        };
      } else if (txDetails && (txDetails.status === "failure" || txDetails.status === "failed")) {
        return {
          status: PaymentAttemptStatus.FAILED,
          providerReference: txnid,
          failureReason: txDetails.error_message || "Transaction failed at PayU gateway",
        };
      }

      return { status: PaymentAttemptStatus.PENDING, providerReference: txnid };
    } catch (err) {
      return { status: attempt.status, providerReference: txnid, error: err.message };
    }
  }

  async refund({ refund, attempt, order }) {
    const txnid = attempt?.providerReference || refund.metadata?.txnid;
    if (!txnid) {
      throw new Error("Missing transaction reference for PayU refund");
    }

    if (!this.isProductionReady()) {
      if (process.env.NODE_ENV === "production") {
        const err = new Error("PayU refund cannot execute in production without credentials");
        err.code = "BLOCKED_BY_CREDENTIALS";
        err.statusCode = 503;
        throw err;
      }
      return {
        gatewayRefundId: `payu_rfnd_mock_${Date.now()}`,
        status: "COMPLETED",
        isSimulation: true,
      };
    }

    try {
      const command = "cancel_refund_transaction";
      const key = this.merchantKey;
      const salt = this.merchantSalt;
      const payuId = attempt.metadata?.mihpayid || txnid;
      const refundAmount = Number(refund.amount).toFixed(2);

      const hashStr = `${key}|${command}|${payuId}|${salt}`;
      const hash = crypto.createHash("sha512").update(hashStr).digest("hex");

      const formBody = new URLSearchParams({
        key,
        command,
        var1: payuId,
        var2: `token_${refund.refundId}`,
        var3: refundAmount,
        hash,
      });

      const response = await fetch(this.serviceUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formBody.toString(),
      });

      const data = await response.json();
      if (data.status === 1 || data.status === "success") {
        return {
          gatewayRefundId: data.request_id || `payu_rfnd_${Date.now()}`,
          status: "COMPLETED",
        };
      }

      throw new Error(data.msg || "PayU refund request declined by gateway");
    } catch (err) {
      console.error("[PayUAdapter.refund Error]:", err.message);
      throw err;
    }
  }
}

export const payuAdapter = new PayUAdapter();
export default payuAdapter;
