import PayoutRailAdapter from "./PayoutRailAdapter.js";

/**
 * Deterministic Sandbox Payout Adapter
 * Simulates real-world seller bank transfers (NEFT / RTGS / IMPS)
 * with deterministic status transitions and synthetic UTR generation.
 * Marked as productionReady: false.
 */
export class SandboxPayoutAdapter extends PayoutRailAdapter {
  constructor() {
    super("SANDBOX_PAYOUT", {
      supportsInstantPayout: true,
      supportsBatchPayout: true,
      supportsReversal: true,
      supportsWebhook: false,
      productionReady: false,
    });
  }

  async createPayout({ sellerId, amount, currency = "INR", bankAccount, ifsc, referenceId }) {
    if (process.env.NODE_ENV === "production" || process.env.PAYMENT_ENV === "production") {
      const err = new Error("Sandbox Payout Rail cannot execute transfers in production.");
      err.code = "RAIL_NOT_PRODUCTION_READY";
      err.statusCode = 503;
      throw err;
    }

    const payoutReference = `pout_sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const syntheticUtr = `UTR${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`;

    return {
      payoutReference,
      status: "SUBMITTED",
      utr: syntheticUtr,
      estimatedSettlement: new Date(Date.now() + 60 * 1000),
      metadata: {
        sellerId,
        amount,
        currency,
        bankAccountMasked: bankAccount ? `XXXX${String(bankAccount).slice(-4)}` : "XXXX1234",
        ifsc: ifsc || "HDFC0001234",
        referenceId,
      },
    };
  }

  async getPayoutStatus({ payoutReference }) {
    return {
      payoutReference,
      status: "SETTLED",
      utr: `UTR_CONFIRMED_${payoutReference.slice(-8)}`,
      confirmedAt: new Date(),
    };
  }

  async cancelPayout({ payoutReference, reason = "" }) {
    return {
      payoutReference,
      status: "CANCELLED",
      cancelledAt: new Date(),
      reason,
    };
  }

  async retryPayout({ payoutReference }) {
    return {
      payoutReference: `retry_${payoutReference}`,
      status: "SUBMITTED",
      retriedAt: new Date(),
    };
  }
}

export const sandboxPayoutAdapter = new SandboxPayoutAdapter();
export default sandboxPayoutAdapter;
