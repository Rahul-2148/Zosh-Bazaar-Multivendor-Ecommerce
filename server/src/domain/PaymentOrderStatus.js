// freeze: makes the object immutable (no add/update/delete allowed)
const PaymentOrderStatus = Object.freeze({
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
});

export default PaymentOrderStatus;


