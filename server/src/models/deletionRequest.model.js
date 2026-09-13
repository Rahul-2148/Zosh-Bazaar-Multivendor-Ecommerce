import mongoose from "mongoose";

/**
 * DeletionRequest — tracks the full lifecycle of an account deletion request.
 * This is the central state machine for the deletion workflow.
 */

const DeletionStatus = Object.freeze({
  PENDING_ELIGIBILITY: "PENDING_ELIGIBILITY",
  ELIGIBLE: "ELIGIBLE",
  BLOCKED: "BLOCKED",
  PENDING_VERIFICATION: "PENDING_VERIFICATION",
  VERIFIED: "VERIFIED",
  CONFIRMED: "CONFIRMED",
  SCHEDULED: "SCHEDULED",
  CANCELLED: "CANCELLED",
  PROCESSING: "PROCESSING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
});

const VerificationStatus = Object.freeze({
  NOT_STARTED: "NOT_STARTED",
  PENDING: "PENDING",
  VERIFIED: "VERIFIED",
  FAILED: "FAILED",
  EXPIRED: "EXPIRED",
  CANCELLED: "CANCELLED",
});

const blockerSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      // e.g. ACTIVE_ORDER, PENDING_RETURN, PENDING_REFUND, PENDING_PAYMENT, ACTIVE_DISPUTE
    },
    message: {
      type: String,
      required: true,
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
  },
  { _id: false }
);

const processingStepSchema = new mongoose.Schema(
  {
    step: { type: String, required: true },
    status: { type: String, enum: ["PENDING", "SUCCESS", "FAILED", "SKIPPED"], default: "PENDING" },
    timestamp: { type: Date, default: Date.now },
    detail: { type: String, default: "" },
  },
  { _id: false }
);

const auditEntrySchema = new mongoose.Schema(
  {
    event: { type: String, required: true },
    actor: { type: String, enum: ["USER", "SYSTEM", "ADMIN"], default: "USER" },
    timestamp: { type: Date, default: Date.now },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const deletionRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(DeletionStatus),
      default: DeletionStatus.PENDING_ELIGIBILITY,
      index: true,
    },
    reason: {
      type: String,
      default: "",
      trim: true,
    },

    // Eligibility result
    eligibilityResult: {
      eligible: { type: Boolean, default: null },
      checkedAt: { type: Date, default: null },
      blockers: { type: [blockerSchema], default: [] },
    },

    // Verification
    verificationMethod: {
      type: String,
      enum: ["OTP", "CUSTOMER_CARE", "NONE"],
      default: "OTP",
    },
    verificationStatus: {
      type: String,
      enum: Object.values(VerificationStatus),
      default: VerificationStatus.NOT_STARTED,
    },
    verificationAttempts: {
      type: Number,
      default: 0,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },

    // Grace period
    gracePeriodEndsAt: {
      type: Date,
      default: null,
      index: true,
    },

    // Cancellation
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancelledBy: {
      type: String,
      enum: ["USER", "ADMIN", "SYSTEM", null],
      default: null,
    },

    // Completion
    completedAt: {
      type: Date,
      default: null,
    },

    // Processing log (for worker)
    processingLog: {
      type: [processingStepSchema],
      default: [],
    },

    // Immutable audit trail
    auditTrail: {
      type: [auditEntrySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for worker queries
deletionRequestSchema.index({ status: 1, gracePeriodEndsAt: 1 });
deletionRequestSchema.index({ user: 1, status: 1 });

export { DeletionStatus, VerificationStatus };
export const DeletionRequest = mongoose.model("DeletionRequest", deletionRequestSchema);
export default DeletionRequest;
