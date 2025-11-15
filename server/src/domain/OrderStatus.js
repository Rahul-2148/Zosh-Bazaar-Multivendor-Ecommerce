// freeze: makes the object immutable (no add/update/delete allowed)
const OrderStatus = Object.freeze({
  PENDING: "PENDING",
  PLACED: "PLACED",
  CONFIRMED: "CONFIRMED",
  SHIPPED: "SHIPPED",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
  RETURNED: "RETURNED",
  REJECTED: "REJECTED",
});

export default OrderStatus;
