import mongoose from "mongoose";

/**
 * Seller Risk Hold Status & Reason Enums
 */
export const RiskHoldStatus = Object.freeze({
  ACTIVE: "ACTIVE",
  RELEASED: "RELEASED",
  EXPIRED: "EXPIRED",
  APPLIED_TO_LOSS: "APPLIED_TO_LOSS",
});

export const RiskHoldReason = Object.freeze({
  ROLLING_RESERVE: "ROLLING_RESERVE",
  CHARGEBACK_HOLD: "CHARGEBACK_HOLD",
  FRAUD_SUSPICION: "FRAUD_SUSPICION",
  POLICY_DISPUTE: "POLICY_DISPUTE",
  HIGH_RETURN_RATE: "HIGH_RETURN_RATE",
});

const sellerRiskHoldSchema = new mongoose.Schema(
  {
    holdId: {
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
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "INR",
      uppercase: true,
    },
    reason: {
      type: String,
      enum: Object.values(RiskHoldReason),
      default: RiskHoldReason.ROLLING_RESERVE,
    },
    status: {
      type: String,
      enum: Object.values(RiskHoldStatus),
      default: RiskHoldStatus.ACTIVE,
      index: true,
    },
    sourceReference: {
      type: String,
      default: null,
      index: true,
    },
    notes: {
      type: String,
      default: "",
    },
    placedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    releasedAt: {
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

sellerRiskHoldSchema.index({ seller: 1, status: 1 });

export const SellerRiskHold = mongoose.model(
  "SellerRiskHold",
  sellerRiskHoldSchema
);
export default SellerRiskHold;
