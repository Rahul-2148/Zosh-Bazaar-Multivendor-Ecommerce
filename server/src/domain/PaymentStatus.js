// Explicit payment status state machine (Section 4)
const PaymentStatus = Object.freeze({
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  AUTHORIZED: "AUTHORIZED",
  CAPTURED: "CAPTURED",
  SUCCESS: "SUCCESS", // compatibility alias for CAPTURED
  COMPLETED: "COMPLETED", // compatibility alias
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
  PARTIALLY_REFUNDED: "PARTIALLY_REFUNDED",
  CANCELLED: "CANCELLED",
});

export const VALID_PAYMENT_TRANSITIONS = Object.freeze({
  PENDING: ["PROCESSING", "AUTHORIZED", "CAPTURED", "SUCCESS", "COMPLETED", "FAILED", "CANCELLED"],
  PROCESSING: ["AUTHORIZED", "CAPTURED", "SUCCESS", "COMPLETED", "FAILED", "CANCELLED"],
  AUTHORIZED: ["CAPTURED", "SUCCESS", "COMPLETED", "FAILED", "CANCELLED"],
  CAPTURED: ["REFUNDED", "PARTIALLY_REFUNDED"],
  SUCCESS: ["REFUNDED", "PARTIALLY_REFUNDED"],
  COMPLETED: ["REFUNDED", "PARTIALLY_REFUNDED"],
  PARTIALLY_REFUNDED: ["REFUNDED", "PARTIALLY_REFUNDED"],
  FAILED: [],
  REFUNDED: [],
  CANCELLED: [],
});

export const isValidPaymentTransition = (currentStatus, nextStatus) => {
  if (!currentStatus || !nextStatus) return false;
  if (currentStatus === nextStatus) return true; // idempotent self-transition
  const allowed = VALID_PAYMENT_TRANSITIONS[currentStatus];
  return Boolean(allowed && allowed.includes(nextStatus));
};

export default PaymentStatus;
