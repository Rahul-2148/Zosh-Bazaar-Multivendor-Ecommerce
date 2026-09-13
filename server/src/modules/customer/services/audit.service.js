import { AuditLog } from "../../../models/auditLog.model.js";

/**
 * AuditService — immutable append-only security event logger.
 * Never log raw identity documents or sensitive PII values.
 */
class AuditService {
  /**
   * @param {Object} params
   * @param {string} params.userId
   * @param {string} params.event - e.g. DEACTIVATION_REQUESTED, DELETION_CONFIRMED
   * @param {string} [params.actor='USER'] - USER | SYSTEM | ADMIN
   * @param {string} [params.actorId]
   * @param {string} [params.sessionRef]
   * @param {string} [params.ipAddress]
   * @param {string} [params.result='SUCCESS'] - SUCCESS | FAILURE | BLOCKED | RATE_LIMITED
   * @param {Object} [params.metadata={}]
   */
  async log({ userId, event, actor = "USER", actorId = null, sessionRef = "", ipAddress = "", result = "SUCCESS", metadata = {} }) {
    try {
      await AuditLog.create({
        userId,
        event,
        actor,
        actorId: actorId || userId,
        sessionRef,
        ipAddress,
        result,
        metadata,
      });
    } catch (err) {
      // Audit logging must never break the main flow
      console.error("[AuditService] Failed to write audit log:", err.message);
    }
  }

  /**
   * Get audit trail for a user (admin use)
   */
  async getUserAuditTrail(userId, { limit = 50, skip = 0 } = {}) {
    return AuditLog.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }
}

export default new AuditService();
