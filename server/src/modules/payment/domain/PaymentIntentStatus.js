// Explicit Payment Intent State Machine
export const PaymentIntentStatus = Object.freeze({
  CREATED: "CREATED",
  REQUIRES_PAYMENT_METHOD: "REQUIRES_PAYMENT_METHOD",
  REQUIRES_ACTION: "REQUIRES_ACTION",
  PROCESSING: "PROCESSING",
  SUCCEEDED: "SUCCEEDED",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
  EXPIRED: "EXPIRED",
});

export const VALID_INTENT_TRANSITIONS = Object.freeze({
  CREATED: [
    PaymentIntentStatus.REQUIRES_PAYMENT_METHOD,
    PaymentIntentStatus.REQUIRES_ACTION,
    PaymentIntentStatus.PROCESSING,
    PaymentIntentStatus.FAILED,
    PaymentIntentStatus.CANCELLED,
    PaymentIntentStatus.EXPIRED,
  ],
  REQUIRES_PAYMENT_METHOD: [
    PaymentIntentStatus.REQUIRES_ACTION,
    PaymentIntentStatus.PROCESSING,
    PaymentIntentStatus.FAILED,
    PaymentIntentStatus.CANCELLED,
    PaymentIntentStatus.EXPIRED,
  ],
  REQUIRES_ACTION: [
    PaymentIntentStatus.PROCESSING,
    PaymentIntentStatus.SUCCEEDED,
    PaymentIntentStatus.FAILED,
    PaymentIntentStatus.CANCELLED,
    PaymentIntentStatus.EXPIRED,
  ],
  PROCESSING: [
    PaymentIntentStatus.SUCCEEDED,
    PaymentIntentStatus.FAILED,
    PaymentIntentStatus.REQUIRES_ACTION,
    PaymentIntentStatus.REQUIRES_PAYMENT_METHOD,
    PaymentIntentStatus.CANCELLED,
    PaymentIntentStatus.EXPIRED,
  ],
  SUCCEEDED: [], // Terminal success
  FAILED: [
    PaymentIntentStatus.REQUIRES_PAYMENT_METHOD, // Allows re-attempt with alternate instrument
    PaymentIntentStatus.CANCELLED,
  ],
  CANCELLED: [], // Terminal
  EXPIRED: [],   // Terminal
});

export const isValidIntentTransition = (currentStatus, nextStatus) => {
  if (!currentStatus || !nextStatus) return false;
  if (currentStatus === nextStatus) return true; // idempotent
  const allowed = VALID_INTENT_TRANSITIONS[currentStatus];
  return Boolean(allowed && allowed.includes(nextStatus));
};

export default PaymentIntentStatus;
