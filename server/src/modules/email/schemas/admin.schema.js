import { sanitizeString, sanitizeUrl } from "./common.schema.js";

export function formatAdminViewModel(data = {}) {
  return {
    severity: sanitizeString(data.severity || "HIGH"),
    moduleName: sanitizeString(data.moduleName || "PLATFORM_CORE"),
    incidentTitle: sanitizeString(data.incidentTitle || data.title || "Platform Operational Alert"),
    summary: sanitizeString(data.summary || data.message || "An operational anomaly requires administrator review."),
    impact: sanitizeString(data.impact || "Customer / Seller fulfillment latency"),
    recommendedAction: sanitizeString(data.recommendedAction || "Investigate via Admin Control Center"),
    dashboardUrl: sanitizeUrl(data.dashboardUrl || "http://localhost:5176/dashboard"),
    affectedIds: Array.isArray(data.affectedIds) ? data.affectedIds.map(String) : [],
    timestamp: data.timestamp ? new Date(data.timestamp).toISOString() : new Date().toISOString(),
  };
}
