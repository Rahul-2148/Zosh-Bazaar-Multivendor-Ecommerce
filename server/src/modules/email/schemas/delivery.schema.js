import { sanitizeString, sanitizeUrl } from "./common.schema.js";
import { emailConfig } from "../config/email.config.js";

export function formatDeliveryViewModel(data = {}) {
  return {
    partner: {
      name: sanitizeString(data.partner?.name || data.partnerName || "Delivery Partner"),
      phone: sanitizeString(data.partner?.phone || ""),
      agentId: sanitizeString(data.partner?.agentId || data.agentId || ""),
    },
    batchId: sanitizeString(data.batchId || ""),
    routeId: sanitizeString(data.routeId || ""),
    stopsCount: Number(data.stopsCount || 0),
    earningsAmount: Number(data.earningsAmount || 0),
    shipmentId: sanitizeString(data.shipmentId || ""),
    hubName: sanitizeString(data.hubName || "Central Logistics Hub"),
    exceptionReason: sanitizeString(data.exceptionReason || ""),
    actionUrl: sanitizeUrl(data.actionUrl || emailConfig.deliveryPartnerUrl),
    shiftTime: sanitizeString(data.shiftTime || "09:00 AM - 06:00 PM"),
  };
}
