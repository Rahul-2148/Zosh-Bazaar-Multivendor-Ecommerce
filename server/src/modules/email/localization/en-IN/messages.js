/**
 * English (India) — Localization Strings & Formatters
 */

export const enIN = {
  currency: "₹",
  formatCurrency: (amount) => {
    const num = Number(amount) || 0;
    return `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  },
  formatDate: (date) => {
    const d = date ? new Date(date) : new Date();
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Kolkata",
    });
  },
  labels: {
    orderNumber: "Order Number",
    orderDate: "Order Date",
    paymentMethod: "Payment Method",
    deliveryAddress: "Delivery Address",
    trackingId: "Tracking ID",
    courier: "Carrier",
    estimatedDelivery: "Estimated Delivery",
    subtotal: "Subtotal",
    discount: "Discount",
    shipping: "Delivery Fee",
    tax: "Taxes & Duties",
    total: "Total Paid",
    seller: "Sold by",
    quantity: "Qty",
    viewOrder: "View Order Details",
    trackShipment: "Track Delivery",
    contactSupport: "Need Help? Contact Support",
    securityWarning: "If you did not make this request, please change your password immediately or contact our security team.",
    unsubscribeNotice: "You are receiving this email because you opted into marketing updates from Zosh Bazaar.",
    managePreferences: "Manage Preferences",
    unsubscribe: "Unsubscribe",
  },
};
