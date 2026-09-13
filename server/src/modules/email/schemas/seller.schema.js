import { sanitizeString, sanitizeUrl } from "./common.schema.js";
import { emailConfig } from "../config/email.config.js";

export function formatSellerViewModel(data = {}) {
  return {
    seller: {
      sellerName: sanitizeString(data.seller?.sellerName || data.sellerName || "Merchant Partner"),
      email: sanitizeString(data.seller?.email || data.email || ""),
      storeName: sanitizeString(data.seller?.businessDetails?.businessName || data.storeName || "Your Store"),
    },
    orderId: sanitizeString(data.orderId || ""),
    itemsCount: Number(data.itemsCount || data.items?.length || 1),
    amount: Number(data.amount || data.payoutAmount || 0),
    payoutId: sanitizeString(data.payoutId || data.settlementId || ""),
    bankAccountMasked: sanitizeString(data.bankAccountMasked || "•••• •••• 9876"),
    actionUrl: sanitizeUrl(data.actionUrl || `${emailConfig.sellerUrl}/dashboard`),
    deadline: data.deadline ? new Date(data.deadline).toISOString() : null,
    reason: sanitizeString(data.reason || ""),
    productTitle: sanitizeString(data.productTitle || ""),
    stockRemaining: Number(data.stockRemaining || 0),
    metricName: sanitizeString(data.metricName || ""),
    metricValue: sanitizeString(data.metricValue || ""),
  };
}
