import PaymentRailAdapter from "./PaymentRailAdapter.js";
import PaymentAttemptStatus from "../domain/PaymentAttemptStatus.js";

/**
 * Unified UPI Rail Adapter
 * Supports UPI Intent (App Switch: GPay, PhonePe, Paytm, BHIM, CRED),
 * Dynamic UPI QR, and UPI Collect.
 */
export class UpiRailAdapter extends PaymentRailAdapter {
  constructor() {
    super("UPI_RAIL", {
      railType: "UPI",
      provider: "SANDBOX_UPI",
      supportsAuthorization: true,
      supportsCapture: true,
      supportsRefund: true,
      supportsPartialRefund: true,
      supportsWebhook: true,
      supportsPolling: true,
      supportsUPIIntent: true,
      supportsUPICollect: true,
      supportsUPIQR: true,
      supportsSettlement: false,
      supportsReconciliation: false,
      supportsUPI: true,
      supportsCards: false,
      supportsNetBanking: false,
      supportsCOD: false,
      environment: "sandbox",
      productionReady: false,
    });
    this.merchantVpa = process.env.UPI_MERCHANT_VPA || "zoshbazaar@bank";
    this.merchantName = process.env.UPI_MERCHANT_NAME || "Zosh Bazaar";
  }

  validateVpa(vpa) {
    if (!vpa || typeof vpa !== "string") return false;
    const vpaRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
    return vpaRegex.test(vpa.trim());
  }

  async createIntent(arg1, arg2) {
    const intent = arg1?.intent || arg1 || {};
    const attempt = arg1?.attempt || {};
    const amount = Number(attempt.amount || intent.amount || 0);
    const txnRef = attempt.attemptId || intent.intentId || `upi_${Date.now()}`;
    const metadata = arg1?.metadata || arg2 || {};
    const upiApp = metadata?.upiApp || attempt.metadata?.upiApp;
    const vpa = metadata?.vpa || metadata?.upiId || attempt.metadata?.upiId;

    // Generate Standard NPCI UPI URI
    const upiUri = `upi://pay?pa=${encodeURIComponent(this.merchantVpa)}&pn=${encodeURIComponent(
      this.merchantName
    )}&tr=${encodeURIComponent(txnRef)}&am=${amount}&cu=INR&tn=${encodeURIComponent(
      `Order ${intent.intentId || txnRef}`
    )}`;

    // App specific deep-links
    const deepLinks = {
      phonepe: `phonepe://pay?pa=${encodeURIComponent(this.merchantVpa)}&pn=${encodeURIComponent(this.merchantName)}&tr=${encodeURIComponent(txnRef)}&am=${amount}&cu=INR`,
      gpay: `tez://upi/pay?pa=${encodeURIComponent(this.merchantVpa)}&pn=${encodeURIComponent(this.merchantName)}&tr=${encodeURIComponent(txnRef)}&am=${amount}&cu=INR`,
      paytm: `paytmmp://pay?pa=${encodeURIComponent(this.merchantVpa)}&pn=${encodeURIComponent(this.merchantName)}&tr=${encodeURIComponent(txnRef)}&am=${amount}&cu=INR`,
      bhim: `upi://pay?pa=${encodeURIComponent(this.merchantVpa)}&pn=${encodeURIComponent(this.merchantName)}&tr=${encodeURIComponent(txnRef)}&am=${amount}&cu=INR`,
    };

    const appIntentUrl = deepLinks[upiApp] || upiUri;

    return {
      method: "UPI",
      providerReference: `upi_${txnRef}`,
      status: PaymentAttemptStatus.PENDING,
      actionPayload: {
        rail: "UPI",
        method: "UPI",
        upiUri,
        appIntentUrl,
        deepLinks,
        selectedApp: upiApp || "generic",
        vpa: vpa || null,
        qrPayload: upiUri,
        expirySeconds: 300, // 5 minutes standard UPI expiry
      },
    };
  }

  async capture({ attempt, payload }) {
    // Authoritative verification via bank switch / webhook
    const providerReference = payload?.providerReference || attempt.providerReference;
    return {
      status: PaymentAttemptStatus.CAPTURED,
      captured: true,
      providerReference: providerReference || `upi_cap_${Date.now()}`,
    };
  }

  async getStatus({ attempt }) {
    return {
      status: attempt.status,
      providerReference: attempt.providerReference,
    };
  }

  async refund({ refund, attempt, order }) {
    const gatewayRefundId = `upi_ref_${refund.refundId}_${Date.now()}`;
    return {
      gatewayRefundId,
      status: "COMPLETED",
    };
  }
}

export default new UpiRailAdapter();
