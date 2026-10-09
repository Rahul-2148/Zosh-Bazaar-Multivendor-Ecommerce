import { PaymentAttempt } from "../models/paymentAttempt.model.js";
import PaymentAttemptStatus, { isValidAttemptTransition } from "../domain/PaymentAttemptStatus.js";

/**
 * Payment Attempt Service
 * Manages discrete execution attempts against payment rails for an intent.
 */
class PaymentAttemptService {
  async createAttempt({
    intent,
    method,
    rail = null,
    provider = null,
    adapter,
    environment = null,
    amount,
    currency = "INR",
    metadata = {},
  }) {
    const previousAttemptsCount = await PaymentAttempt.countDocuments({ intentId: intent.intentId });
    const attemptNumber = previousAttemptsCount + 1;
    const attemptId = `att_${intent.intentId.replace("pi_", "")}_${attemptNumber}`;

    const effectiveRail = rail || method;
    const effectiveProvider = provider || adapter;
    const effectiveEnvironment =
      environment || (process.env.NODE_ENV === "production" ? "production" : "sandbox");

    const attempt = await PaymentAttempt.create({
      attemptId,
      intentId: intent.intentId,
      intent: intent._id,
      attemptNumber,
      method,
      rail: effectiveRail,
      provider: effectiveProvider,
      adapter,
      environment: effectiveEnvironment,
      amount,
      currency,
      status: PaymentAttemptStatus.INITIATED,
      startedAt: new Date(),
      statusHistory: [
        {
          fromStatus: null,
          toStatus: PaymentAttemptStatus.INITIATED,
          timestamp: new Date(),
          reason: `Attempt #${attemptNumber} initiated via ${effectiveProvider} (${effectiveRail})`,
          source: "SYSTEM",
        },
      ],
      metadata,
    });

    return attempt;
  }

  async getAttemptById(attemptId) {
    const attempt = await PaymentAttempt.findOne({ attemptId }).populate("intent");
    if (!attempt) {
      throw new Error(`PaymentAttempt "${attemptId}" not found`);
    }
    return attempt;
  }

  async transitionStatus(
    attemptOrId,
    nextStatus,
    {
      failureCode = null,
      failureReason = null,
      providerReference = null,
      reason = "",
      source = "SYSTEM",
    } = {}
  ) {
    const attempt =
      typeof attemptOrId === "string" ? await this.getAttemptById(attemptOrId) : attemptOrId;
    const currentStatus = attempt.status;

    if (currentStatus === nextStatus) {
      return attempt; // Idempotent self-transition
    }

    if (!isValidAttemptTransition(currentStatus, nextStatus)) {
      throw new Error(
        `Invalid PaymentAttempt transition: Cannot transition from "${currentStatus}" to "${nextStatus}".`
      );
    }

    attempt.status = nextStatus;
    if (failureCode) attempt.failureCode = failureCode;
    if (failureReason) attempt.failureReason = failureReason;
    if (providerReference) attempt.providerReference = providerReference;

    const terminalStates = [
      PaymentAttemptStatus.CAPTURED,
      PaymentAttemptStatus.FAILED,
      PaymentAttemptStatus.TIMED_OUT,
      PaymentAttemptStatus.VOIDED,
      PaymentAttemptStatus.REFUNDED,
    ];
    if (terminalStates.includes(nextStatus)) {
      attempt.completedAt = new Date();
    }

    attempt.statusHistory.push({
      fromStatus: currentStatus,
      toStatus: nextStatus,
      timestamp: new Date(),
      reason: reason || failureReason || `Transitioned to ${nextStatus}`,
      source,
    });

    await attempt.save();
    return attempt;
  }
}

export const paymentAttemptService = new PaymentAttemptService();
export default paymentAttemptService;
