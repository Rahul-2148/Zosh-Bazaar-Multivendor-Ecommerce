import { sanitizeString, sanitizeUrl } from "./common.schema.js";

export function formatAuthViewModel(data = {}) {
  return {
    user: {
      fullName: sanitizeString(data.user?.fullName || data.fullName || "Valued User"),
      email: sanitizeString(data.user?.email || data.email || ""),
    },
    otp: sanitizeString(data.otp || ""),
    validityMinutes: Number(data.validityMinutes) || 5,
    actionUrl: sanitizeUrl(data.actionUrl || data.resetUrl || data.verificationUrl || "#"),
    ipAddress: sanitizeString(data.ipAddress || "Unknown IP"),
    device: sanitizeString(data.device || data.userAgent || "Unknown Device"),
    location: sanitizeString(data.location || "India"),
    timestamp: data.timestamp ? new Date(data.timestamp).toISOString() : new Date().toISOString(),
    supportUrl: sanitizeUrl(data.supportUrl || "http://localhost:5173/help"),
  };
}
