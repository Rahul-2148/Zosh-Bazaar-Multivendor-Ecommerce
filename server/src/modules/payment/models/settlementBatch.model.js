import mongoose from "mongoose";

/**
 * Settlement Batch Lifecycle States
 */
export const SettlementBatchStatus = Object.freeze({
  DRAFT: "DRAFT",
  CALCULATED: "CALCULATED",
  REVIEW_REQUIRED: "REVIEW_REQUIRED",
  APPROVED: "APPROVED",
  SUBMITTING: "SUBMITTING",
  SUBMITTED: "SUBMITTED",
  PROCESSING: "PROCESSING",
  UNKNOWN: "UNKNOWN",
  STATUS_CHECK_REQUIRED: "STATUS_CHECK_REQUIRED",
  PAID: "PAID",
  FAILED: "FAILED",
  REVERSED: "REVERSED",
  RECONCILING: "RECONCILING",
  RECONCILED: "RECONCILED",
});

const settlementBatchSchema = new mongoose.Schema(
  {
    batchId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
      index: true,
    },
    currency: {
      type: String,
      default: "INR",
      uppercase: true,
    },
    periodStart: {
      type: Date,
      required: true,
    },
    periodEnd: {
      type: Date,
      required: true,
    },
    orders: [
      {
        orderId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Order",
          required: true,
        },
        grossAmount: { type: Number, required: true },
        platformFee: { type: Number, default: 0 },
        gatewayFee: { type: Number, default: 0 },
        taxDeduction: { type: Number, default: 0 },
        refundAdjustment: { type: Number, default: 0 },
        reserveHold: { type: Number, default: 0 },
        netPayable: { type: Number, required: true },
      },
    ],
    grossAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    platformFees: {
      type: Number,
      default: 0,
      min: 0,
    },
    gatewayFees: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxDeductions: {
      type: Number,
      default: 0,
      min: 0,
    },
    refundAdjustments: {
      type: Number,
      default: 0,
      min: 0,
    },
    reserveHeld: {
      type: Number,
      default: 0,
      min: 0,
    },
    netPayable: {
      type: Number,
      required: true,
      min: 0,
    },
    feeSnapshot: {
      commissionRatePercent: { type: Number, default: 5.0 },
      gatewayFeePercent: { type: Number, default: 2.0 },
      tcsRatePercent: { type: Number, default: 1.0 },
      reservePercent: { type: Number, default: 0.0 },
      calculatedAt: { type: Date, default: Date.now },
    },
    eligibilityPolicy: {
      returnWindowDays: { type: Number, default: 7 },
      settlementDelayDays: { type: Number, default: 2 },
      minPayoutThreshold: { type: Number, default: 100 },
      requireDeliveryConfirmation: { type: Boolean, default: true },
    },
    status: {
      type: String,
      enum: Object.values(SettlementBatchStatus),
      default: SettlementBatchStatus.DRAFT,
      index: true,
    },
    beneficiary: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SellerBeneficiary",
      default: null,
    },
    payoutProvider: {
      type: String,
      default: null,
      trim: true,
    },
    payoutReference: {
      type: String,
      default: null,
    },
    utrNumber: {
      type: String,
      default: null,
    },
    idempotencyKey: {
      type: String,
      default: null,
      index: true,
    },
    holdReason: {
      type: String,
      default: null,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    reconciledAt: {
      type: Date,
      default: null,
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

settlementBatchSchema.index({ seller: 1, createdAt: -1 });
settlementBatchSchema.index({ status: 1, createdAt: -1 });
settlementBatchSchema.index({ seller: 1, idempotencyKey: 1 }, { unique: true, sparse: true });
settlementBatchSchema.index({ payoutReference: 1 }, { unique: true, sparse: true });
settlementBatchSchema.index({ utrNumber: 1 }, { unique: true, sparse: true });

export const SettlementBatch = mongoose.model(
  "SettlementBatch",
  settlementBatchSchema
);
export default SettlementBatch;
