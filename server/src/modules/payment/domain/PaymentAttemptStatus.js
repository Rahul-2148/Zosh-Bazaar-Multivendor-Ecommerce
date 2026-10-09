// Explicit Payment Attempt State Machine
export const PaymentAttemptStatus = Object.freeze({
  INITIATED: "INITIATED",
  PENDING: "PENDING",
  REQUIRES_ACTION: "REQUIRES_ACTION",
  AUTHORIZED: "AUTHORIZED",
  CAPTURED: "CAPTURED",
  SETTLEMENT_PENDING: "SETTLEMENT_PENDING",
  SETTLED: "SETTLED",
  FAILED: "FAILED",
  TIMED_OUT: "TIMED_OUT",
  CANCELLED: "CANCELLED",
  VOIDED: "VOIDED",
  RECOVERING: "RECOVERING",
  UNKNOWN: "UNKNOWN",
  REFUND_PENDING: "REFUND_PENDING",
  REFUNDED: "REFUNDED",
  PARTIALLY_REFUNDED: "PARTIALLY_REFUNDED",
  CHARGEBACK_OPEN: "CHARGEBACK_OPEN",
  CHARGEBACK_WON: "CHARGEBACK_WON",
  CHARGEBACK_LOST: "CHARGEBACK_LOST",
});

export const VALID_ATTEMPT_TRANSITIONS = Object.freeze({
  INITIATED: [
    PaymentAttemptStatus.PENDING,
    PaymentAttemptStatus.REQUIRES_ACTION,
    PaymentAttemptStatus.AUTHORIZED,
    PaymentAttemptStatus.CAPTURED,
    PaymentAttemptStatus.FAILED,
    PaymentAttemptStatus.TIMED_OUT,
    PaymentAttemptStatus.CANCELLED,
    PaymentAttemptStatus.VOIDED,
    PaymentAttemptStatus.UNKNOWN,
    PaymentAttemptStatus.RECOVERING,
  ],
  PENDING: [
    PaymentAttemptStatus.REQUIRES_ACTION,
    PaymentAttemptStatus.AUTHORIZED,
    PaymentAttemptStatus.CAPTURED,
    PaymentAttemptStatus.FAILED,
    PaymentAttemptStatus.TIMED_OUT,
    PaymentAttemptStatus.CANCELLED,
    PaymentAttemptStatus.VOIDED,
    PaymentAttemptStatus.UNKNOWN,
    PaymentAttemptStatus.RECOVERING,
  ],
  REQUIRES_ACTION: [
    PaymentAttemptStatus.PENDING,
    PaymentAttemptStatus.AUTHORIZED,
    PaymentAttemptStatus.CAPTURED,
    PaymentAttemptStatus.FAILED,
    PaymentAttemptStatus.CANCELLED,
    PaymentAttemptStatus.TIMED_OUT,
    PaymentAttemptStatus.UNKNOWN,
    PaymentAttemptStatus.RECOVERING,
  ],
  AUTHORIZED: [
    PaymentAttemptStatus.CAPTURED,
    PaymentAttemptStatus.VOIDED,
    PaymentAttemptStatus.CANCELLED,
    PaymentAttemptStatus.FAILED,
  ],
  UNKNOWN: [
    PaymentAttemptStatus.RECOVERING,
    PaymentAttemptStatus.CAPTURED,
    PaymentAttemptStatus.FAILED,
    PaymentAttemptStatus.TIMED_OUT,
    PaymentAttemptStatus.CANCELLED,
  ],
  RECOVERING: [
    PaymentAttemptStatus.CAPTURED,
    PaymentAttemptStatus.FAILED,
    PaymentAttemptStatus.TIMED_OUT,
    PaymentAttemptStatus.CANCELLED,
  ],
  CAPTURED: [
    PaymentAttemptStatus.SETTLEMENT_PENDING,
    PaymentAttemptStatus.SETTLED,
    PaymentAttemptStatus.REFUND_PENDING,
    PaymentAttemptStatus.REFUNDED,
    PaymentAttemptStatus.PARTIALLY_REFUNDED,
    PaymentAttemptStatus.CHARGEBACK_OPEN,
  ],
  SETTLEMENT_PENDING: [
    PaymentAttemptStatus.SETTLED,
    PaymentAttemptStatus.REFUND_PENDING,
    PaymentAttemptStatus.REFUNDED,
    PaymentAttemptStatus.PARTIALLY_REFUNDED,
    PaymentAttemptStatus.CHARGEBACK_OPEN,
  ],
  SETTLED: [
    PaymentAttemptStatus.REFUND_PENDING,
    PaymentAttemptStatus.REFUNDED,
    PaymentAttemptStatus.PARTIALLY_REFUNDED,
    PaymentAttemptStatus.CHARGEBACK_OPEN,
  ],
  REFUND_PENDING: [
    PaymentAttemptStatus.REFUNDED,
    PaymentAttemptStatus.PARTIALLY_REFUNDED,
    PaymentAttemptStatus.CAPTURED, // If refund fails at gateway
  ],
  PARTIALLY_REFUNDED: [
    PaymentAttemptStatus.REFUND_PENDING,
    PaymentAttemptStatus.REFUNDED,
  ],
  CHARGEBACK_OPEN: [
    PaymentAttemptStatus.CHARGEBACK_WON,
    PaymentAttemptStatus.CHARGEBACK_LOST,
  ],
  CHARGEBACK_WON: [],  // Terminal
  CHARGEBACK_LOST: [], // Terminal
  FAILED: [],     // Terminal
  TIMED_OUT: [
    PaymentAttemptStatus.RECOVERING, // Ambiguous recovery allowed
    PaymentAttemptStatus.FAILED,
  ],
  CANCELLED: [],  // Terminal
  VOIDED: [],     // Terminal
  REFUNDED: [],   // Terminal
});

export const isValidAttemptTransition = (currentStatus, nextStatus) => {
  if (!currentStatus || !nextStatus) return false;
  if (currentStatus === nextStatus) return true; // idempotent
  const allowed = VALID_ATTEMPT_TRANSITIONS[currentStatus];
  return Boolean(allowed && allowed.includes(nextStatus));
};

export default PaymentAttemptStatus;
