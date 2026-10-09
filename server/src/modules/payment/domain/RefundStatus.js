// Explicit Refund & Dispute State Machine
export const RefundStatus = Object.freeze({
  REQUESTED: "REQUESTED",
  PROCESSING: "PROCESSING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  MANUAL_REVIEW: "MANUAL_REVIEW",
  CHARGEBACK_OPEN: "CHARGEBACK_OPEN",
  EVIDENCE_REQUIRED: "EVIDENCE_REQUIRED",
  SUBMITTED: "SUBMITTED",
  CHARGEBACK_WON: "CHARGEBACK_WON",
  CHARGEBACK_LOST: "CHARGEBACK_LOST",
  EXPIRED: "EXPIRED",
  // Standard aliases
  OPEN: "CHARGEBACK_OPEN",
  WON: "CHARGEBACK_WON",
  LOST: "CHARGEBACK_LOST",
});

export const VALID_REFUND_TRANSITIONS = Object.freeze({
  REQUESTED: [
    RefundStatus.PROCESSING,
    RefundStatus.MANUAL_REVIEW,
    RefundStatus.FAILED,
  ],
  MANUAL_REVIEW: [
    RefundStatus.PROCESSING,
    RefundStatus.FAILED,
  ],
  PROCESSING: [
    RefundStatus.COMPLETED,
    RefundStatus.FAILED,
    RefundStatus.MANUAL_REVIEW,
  ],
  FAILED: [
    RefundStatus.PROCESSING, // Retry allowed
    RefundStatus.MANUAL_REVIEW,
  ],
  CHARGEBACK_OPEN: [
    RefundStatus.EVIDENCE_REQUIRED,
    RefundStatus.SUBMITTED,
    RefundStatus.CHARGEBACK_WON,
    RefundStatus.CHARGEBACK_LOST,
    RefundStatus.EXPIRED,
  ],
  EVIDENCE_REQUIRED: [
    RefundStatus.SUBMITTED,
    RefundStatus.CHARGEBACK_LOST,
    RefundStatus.EXPIRED,
  ],
  SUBMITTED: [
    RefundStatus.CHARGEBACK_WON,
    RefundStatus.CHARGEBACK_LOST,
    RefundStatus.EXPIRED,
  ],
  COMPLETED: [
    RefundStatus.CHARGEBACK_OPEN, // A captured/completed transaction may face a chargeback
  ],
  CHARGEBACK_WON: [],  // Terminal
  CHARGEBACK_LOST: [], // Terminal
  EXPIRED: [],         // Terminal
});

export const isValidRefundTransition = (currentStatus, nextStatus) => {
  if (!currentStatus || !nextStatus) return false;
  if (currentStatus === nextStatus) return true; // idempotent
  const allowed = VALID_REFUND_TRANSITIONS[currentStatus];
  return Boolean(allowed && allowed.includes(nextStatus));
};

export default RefundStatus;
