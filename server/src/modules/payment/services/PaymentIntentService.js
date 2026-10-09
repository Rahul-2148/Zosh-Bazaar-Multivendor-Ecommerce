import { PaymentIntent } from "../models/paymentIntent.model.js";
import PaymentIntentStatus, { isValidIntentTransition } from "../domain/PaymentIntentStatus.js";

/**
 * Payment Intent Service
 * Authoritative commercial commitment lifecycle management.
 */
class PaymentIntentService {
  /**
   * Create a new PaymentIntent.
   */
  async createIntent({
    userId,
    orderIds,
    amount,
    currency = "INR",
    pricingSnapshot,
    selectedMethod = {},
    splitConfig = { walletAmount: 0, railAmount: 0 },
    idempotencyKey = null,
    riskState = "APPROVED",
    riskScore = 0,
    riskReason = "",
    metadata = {},
  }) {
    // Check existing by idempotency key
    if (idempotencyKey) {
      const existing = await PaymentIntent.findOne({ idempotencyKey });
      if (existing) {
        return { intent: existing, alreadyCreated: true };
      }
    }

    const intentId = `pi_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes TTL

    const intent = await PaymentIntent.create({
      intentId,
      user: userId,
      orders: orderIds,
      amount,
      currency,
      status: PaymentIntentStatus.CREATED,
      pricingSnapshot,
      selectedMethod,
      splitConfig,
      idempotencyKey: idempotencyKey || null,
      riskScore,
      riskState,
      riskReason,
      expiresAt,
      statusHistory: [
        {
          fromStatus: null,
          toStatus: PaymentIntentStatus.CREATED,
          timestamp: new Date(),
          reason: "Intent created for checkout",
          source: "SYSTEM",
        },
      ],
      metadata,
    });

    return { intent, alreadyCreated: false };
  }

  async getIntentById(intentId) {
    let intent = null;
    if (intentId.startsWith("pi_")) {
      intent = await PaymentIntent.findOne({ intentId }).populate("orders user");
    } else {
      intent = await PaymentIntent.findById(intentId).populate("orders user");
    }
    if (!intent) {
      throw new Error(`PaymentIntent "${intentId}" not found`);
    }
    return intent;
  }

  /**
   * Transition status of an intent with explicit validation guards.
   */
  async transitionStatus(intentOrId, nextStatus, reason = "", source = "SYSTEM") {
    const intent = typeof intentOrId === "string" ? await this.getIntentById(intentOrId) : intentOrId;
    const currentStatus = intent.status;

    if (currentStatus === nextStatus) {
      return intent; // Idempotent self-transition
    }

    if (!isValidIntentTransition(currentStatus, nextStatus)) {
      throw new Error(
        `Invalid PaymentIntent transition: Cannot transition from "${currentStatus}" to "${nextStatus}".`
      );
    }

    intent.status = nextStatus;
    intent.statusHistory.push({
      fromStatus: currentStatus,
      toStatus: nextStatus,
      timestamp: new Date(),
      reason,
      source,
    });

    await intent.save();
    return intent;
  }
}

export const paymentIntentService = new PaymentIntentService();
export default paymentIntentService;
