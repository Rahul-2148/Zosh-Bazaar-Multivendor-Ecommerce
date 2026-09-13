import mongoose from "mongoose";

/**
 * AuditLog — immutable security audit log for account lifecycle events.
 * Records are append-only and should never be modified or deleted.
 */

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    event: {
      type: String,
      required: true,
      index: true,
      // Events:
      // DEACTIVATION_REQUESTED, DEACTIVATION_COMPLETED, DEACTIVATION_REVERSED,
      // DELETION_REQUESTED, ELIGIBILITY_CHECK, ELIGIBILITY_BLOCKED,
      // VERIFICATION_OTP_SENT, VERIFICATION_OTP_VERIFIED, VERIFICATION_OTP_FAILED,
      // DELETION_CONFIRMED, DELETION_CANCELLED, DELETION_SCHEDULED,
      // DELETION_PROCESSING_STARTED, DELETION_PROCESSING_STEP, DELETION_COMPLETED,
      // CUSTOMER_CARE_ESCALATION, SUPPORT_DELETION_APPROVED, SUPPORT_DELETION_REJECTED,
      // RATE_LIMIT_EXCEEDED, SUSPICIOUS_ACTIVITY
    },
    actor: {
      type: String,
      enum: ["USER", "SYSTEM", "ADMIN"],
      default: "USER",
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    sessionRef: {
      type: String,
      default: "",
    },
    ipAddress: {
      type: String,
      default: "",
    },
    result: {
      type: String,
      enum: ["SUCCESS", "FAILURE", "BLOCKED", "RATE_LIMITED"],
      default: "SUCCESS",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Optimized queries
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ event: 1, createdAt: -1 });

export const AuditLog = mongoose.model("AuditLog", auditLogSchema);
export default AuditLog;
