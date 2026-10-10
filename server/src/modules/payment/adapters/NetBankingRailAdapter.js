import PaymentRailAdapter from "./PaymentRailAdapter.js";
import PaymentAttemptStatus from "../domain/PaymentAttemptStatus.js";
import { POPULAR_BANKS } from "../domain/PaymentRail.js";

/**
 * Net Banking Rail Adapter
 * Manages bank routing, authorization redirection, and bank eligibility.
 */
export class NetBankingRailAdapter extends PaymentRailAdapter {
  constructor() {
    super("NETBANKING_RAIL", {
      railType: "NETBANKING",
      provider: "SANDBOX_NETBANKING",
      supportsAuthorization: true,
      supportsCapture: true,
      supportsRefund: true,
      supportsPartialRefund: true,
      supportsWebhook: true,
      supportsPolling: true,
      supportsSettlement: false,
      supportsReconciliation: false,
      supportsUPI: false,
      supportsCards: false,
      supportsNetBanking: true,
      supportsCOD: false,
      environment: "sandbox",
      productionReady: false,
    });
  }

  getBankDetails(bankCode) {
    return POPULAR_BANKS.find((b) => b.code === bankCode) || {
      code: bankCode,
      name: bankCode,
      popular: false,
    };
  }

  async createIntent({ intent: _intent, attempt, user: _user, metadata }) {
    const bankCode = metadata?.bankCode || "HDFC";
    const bank = this.getBankDetails(bankCode);
    const providerReference = `nb_${bankCode}_${attempt.attemptId}_${Date.now()}`;

    return {
      providerReference,
      status: PaymentAttemptStatus.PENDING,
      actionPayload: {
        rail: "NETBANKING",
        bankCode,
        bankName: bank.name,
        redirectUrl: `http://localhost:5000/api/v1/payment/bank-auth/${providerReference}?bank=${bankCode}`,
      },
    };
  }

  async capture({ attempt, payload: _payload }) {
    return {
      status: PaymentAttemptStatus.CAPTURED,
      captured: true,
      providerReference: attempt.providerReference || `nb_cap_${Date.now()}`,
    };
  }

  async refund({ refund, attempt: _attempt, order: _order }) {
    return {
      gatewayRefundId: `nb_ref_${refund.refundId}_${Date.now()}`,
      status: "COMPLETED",
    };
  }
}

export default new NetBankingRailAdapter();
