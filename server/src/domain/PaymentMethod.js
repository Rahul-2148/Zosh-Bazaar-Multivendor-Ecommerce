// freeze: makes the object immutable (no add/update/delete allowed)
const PaymentMethod = Object.freeze({
  RAZORPAY: "RAZORPAY",
  STRIPE: "STRIPE",
  PAYPAL: "PAYPAL",
  CASH_ON_DELIVERY: "CASH_ON_DELIVERY",
});

export default PaymentMethod;


