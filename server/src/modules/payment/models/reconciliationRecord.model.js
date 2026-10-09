import mongoose from "mongoose";

const reconciliationRecordSchema = new mongoose.Schema(
  {
    reconciliationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    gateway: {
      type: String,
      required: true,
      default: "RAZORPAY",
    },
    periodStart: {
      type: Date,
      required: true,
    },
    periodEnd: {
      type: Date,
      required: true,
    },
    totalCompared: {
      type: Number,
      default: 0,
    },
    matchedCount: {
      type: Number,
      default: 0,
    },
    mismatchedCount: {
      type: Number,
      default: 0,
    },
    orphanCount: {
      type: Number,
      default: 0,
    },
    discrepancies: [
      {
        referenceId: { type: String, required: true },
        issueType: {
          type: String,
          enum: [
            "AMOUNT_MISMATCH",
            "STATUS_MISMATCH",
            "MISSING_IN_LEDGER",
            "ORPHAN_GATEWAY_TX",
            "REFUND_MISMATCH",
            "MATCHED",
            "MISSING_IN_PROVIDER",
            "MISSING_IN_ZOSH",
            "FEE_MISMATCH",
            "DUPLICATE",
            "SETTLEMENT_MISMATCH",
            "PENDING_BANK",
            "MISSING_BANK",
            "REFERENCE_MISMATCH",
            "REVERSAL",
            "UNKNOWN",
            "CURRENCY_MISMATCH",
            "UNKNOWN_REFERENCE",
            "DATE_MISMATCH",
          ],
          required: true,
        },
        expectedAmount: { type: Number },
        actualAmount: { type: Number },
        notes: { type: String, default: "" },
        severity: {
          type: String,
          enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
          default: "MEDIUM",
        },
        owner: {
          type: String,
          default: "FINANCE_OPS",
        },
        resolutionStatus: {
          type: String,
          enum: ["UNRESOLVED", "UNDER_INVESTIGATION", "RESOLVED_MANUAL_ADJUSTMENT", "DISMISSED"],
          default: "UNRESOLVED",
        },
        auditTrail: [
          {
            action: { type: String },
            performedBy: { type: String },
            timestamp: { type: Date, default: Date.now },
            notes: { type: String },
          },
        ],
        resolved: { type: Boolean, default: false },
        resolvedAt: { type: Date, default: null },
      },
    ],
    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "ANOMALIES_DETECTED", "RESOLVED"],
      default: "PENDING",
      index: true,
    },
    statementFileHash: {
      type: String,
      default: null,
      index: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

reconciliationRecordSchema.index({ createdAt: -1 });

export const ReconciliationRecord = mongoose.model(
  "ReconciliationRecord",
  reconciliationRecordSchema
);
export default ReconciliationRecord;
