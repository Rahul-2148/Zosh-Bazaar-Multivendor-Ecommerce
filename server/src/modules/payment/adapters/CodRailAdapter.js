import PaymentRailAdapter from "./PaymentRailAdapter.js";
import PaymentAttemptStatus from "../domain/PaymentAttemptStatus.js";

/**
 * Cash On Delivery (COD) Rail Adapter
 * Represents physical cash or doorstep UPI collection upon fulfillment.
 */
export class CodRailAdapter extends PaymentRailAdapter {
  constructor() {
    super("COD_RAIL", {
      railType: "COD",
      provider: "COD",
      supportsAuthorization: false,
      supportsCapture: true,
      supportsRefund: true, // Offline or store credit refund
      supportsPartialRefund: true,
      supportsWebhook: false,
      supportsPolling: false,
      supportsSettlement: true,
      supportsReconciliation: true,
      supportsUPI: false,
      supportsCards: false,
      supportsNetBanking: false,
      supportsCOD: true,
      environment: "production",
      productionReady: true,
    });
  }

  async checkEligibility(orderOrParams) {
    const amount = Number(orderOrParams?.amount || orderOrParams?.totalSellingPrice || 0);
    if (amount >= 10000) {
      return {
        eligible: false,
        reasonCode: "ORDER_VALUE_LIMIT",
        message: "Cash On Delivery is not available for orders above ₹10,000",
      };
    }
    return {
      eligible: true,
      reasonCode: "ELIGIBLE",
      message: "Cash On Delivery is available",
    };
  }

  async createIntent({ intent, attempt, user, metadata }) {
    const providerReference = `cod_${attempt.attemptId}`;
    return {
      providerReference,
      status: PaymentAttemptStatus.PENDING,
      actionPayload: {
        rail: "COD",
        doorstepPayableAmount: attempt.amount,
        verificationRequired: false,
        message: "Pay by Cash or UPI on delivery at your doorstep",
      },
    };
  }

  async capture({ attempt, payload }) {
    // Marked captured when delivery partner collects payment at doorstep
    return {
      status: PaymentAttemptStatus.CAPTURED,
      captured: true,
      providerReference: attempt.providerReference || `cod_collected_${Date.now()}`,
    };
  }

  async refund({ refund, attempt, order }) {
    // For COD orders, refund is typically routed directly to customer wallet or NEFT
    return {
      gatewayRefundId: `cod_ref_${refund.refundId}_${Date.now()}`,
      status: "COMPLETED",
    };
  }
}

export default new CodRailAdapter();
