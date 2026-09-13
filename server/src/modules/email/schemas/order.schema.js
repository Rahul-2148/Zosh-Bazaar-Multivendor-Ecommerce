import { sanitizeString, sanitizeUrl } from "./common.schema.js";
import { emailConfig } from "../config/email.config.js";

export function formatOrderViewModel(data = {}) {
  const rawItems = Array.isArray(data.items)
    ? data.items
    : Array.isArray(data.order?.orderItems)
    ? data.order.orderItems
    : [];

  const items = rawItems.map((item) => ({
    title: sanitizeString(item.title || item.productTitle || item.product?.title || "Product Item"),
    image: sanitizeUrl(item.image || item.productImage || item.product?.images?.[0] || ""),
    sku: sanitizeString(item.sku || ""),
    variant: sanitizeString(item.variantTitle || item.variant || ""),
    quantity: Number(item.quantity) || 1,
    unitPrice: Number(item.sellingPrice || item.price || item.unitPrice || 0),
    totalPrice: (Number(item.quantity) || 1) * Number(item.sellingPrice || item.price || item.unitPrice || 0),
    sellerName: sanitizeString(item.sellerName || item.seller?.sellerName || "Zosh Verified Vendor"),
  }));

  const addr = data.shippingAddress || data.order?.shippingAddress || {};
  const shippingAddress = {
    name: sanitizeString(addr.name || addr.fullName || data.user?.fullName || "Recipient"),
    addressLine1: sanitizeString(addr.address || addr.addressLine1 || addr.street || ""),
    addressLine2: sanitizeString(addr.locality || addr.addressLine2 || ""),
    city: sanitizeString(addr.city || ""),
    state: sanitizeString(addr.state || ""),
    pincode: sanitizeString(addr.pinCode || addr.pincode || addr.zip || ""),
    mobile: sanitizeString(addr.mobile || addr.phone || ""),
  };

  const totals = {
    subtotal: Number(data.totals?.subtotal || data.order?.totalMrpPrice || data.subtotal || 0),
    discount: Number(data.totals?.discount || data.order?.discount || data.discount || 0),
    shipping: Number(data.totals?.shipping || data.shippingFee || 0),
    tax: Number(data.totals?.tax || 0),
    total: Number(data.totals?.total || data.order?.totalSellingPrice || data.totalAmount || 0),
  };

  return {
    orderId: sanitizeString(data.orderId || data.order?._id || data.order?.orderId || "ZB-ORD-0000"),
    orderDate: data.orderDate || data.order?.createdAt || new Date().toISOString(),
    status: sanitizeString(data.status || data.order?.orderStatus || "CONFIRMED"),
    paymentMethod: sanitizeString(data.paymentMethod || "Prepaid (Online)"),
    estimatedDelivery: sanitizeString(data.estimatedDelivery || "3 - 5 Business Days"),
    trackingNumber: sanitizeString(data.trackingNumber || data.shipmentId || ""),
    trackingUrl: sanitizeUrl(data.trackingUrl || `${emailConfig.clientUrl}/account/orders`),
    carrier: sanitizeString(data.carrier || "Zosh Express Logistics"),
    orderUrl: sanitizeUrl(data.orderUrl || `${emailConfig.clientUrl}/account/orders`),
    invoiceUrl: sanitizeUrl(data.invoiceUrl || `${emailConfig.clientUrl}/account/orders`),
    items,
    shippingAddress,
    totals,
    user: {
      fullName: sanitizeString(data.user?.fullName || data.order?.user?.fullName || "Valued Customer"),
      email: sanitizeString(data.user?.email || data.order?.user?.email || ""),
    },
    cancellationReason: sanitizeString(data.cancellationReason || ""),
    refundAmount: Number(data.refundAmount || 0),
    delayReason: sanitizeString(data.delayReason || ""),
    revisedEta: sanitizeString(data.revisedEta || ""),
  };
}
