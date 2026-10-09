import mongoose from "mongoose";

const settlementSchema = new mongoose.Schema(
  {
    settlementId: {
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
    orders: [
      {
        order: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Order",
          required: true,
        },
        grossAmount: { type: Number, required: true },
        platformFee: { type: Number, default: 0 },
        paymentFee: { type: Number, default: 0 },
        taxDeduction: { type: Number, default: 0 },
        refundAdjustment: { type: Number, default: 0 },
        netAmount: { type: Number, required: true },
      },
    ],
    grossAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    totalDeductions: {
      type: Number,
      default: 0,
      min: 0,
    },
    netPayable: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "INR",
      uppercase: true,
    },
    feeSnapshot: {
      commissionRatePercent: { type: Number, default: 5.0 },
      gatewayFeePercent: { type: Number, default: 2.0 },
      tcsRatePercent: { type: Number, default: 1.0 },
      calculatedAt: { type: Date, default: Date.now },
    },
    status: {
      type: String,
      enum: [
        "CALCULATED",
        "READY",
        "PROCESSING",
        "SUBMITTED",
        "PENDING",
        "HELD",
        "INITIATED",
        "SETTLED",
        "FAILED",
      ],
      default: "PENDING",
      index: true,
    },
    payoutReference: {
      type: String,
      default: null,
      index: true,
    },
    providerReference: {
      type: String,
      default: null,
      index: true,
    },
    holdReason: {
      type: String,
      default: null,
    },
    utrNumber: {
      type: String,
      default: null,
      index: true,
    },
    payoutBatchId: {
      type: String,
      default: null,
      index: true,
    },
    settledAt: {
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

settlementSchema.index({ seller: 1, createdAt: -1 });
settlementSchema.index({ status: 1, createdAt: -1 });

export const Settlement = mongoose.model("Settlement", settlementSchema);
export default Settlement;
