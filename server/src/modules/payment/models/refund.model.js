import mongoose from "mongoose";
import RefundStatus from "../domain/RefundStatus.js";

const refundSchema = new mongoose.Schema(
  {
    refundId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    intentId: {
      type: String,
      default: null,
      index: true,
    },
    attemptId: {
      type: String,
      default: null,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    currency: {
      type: String,
      default: "INR",
      uppercase: true,
    },
    reason: {
      type: String,
      default: "Customer Return / Order Cancellation",
    },
    destination: {
      type: String,
      enum: ["ORIGINAL_PAYMENT_METHOD", "WALLET"],
      default: "WALLET",
    },
    status: {
      type: String,
      enum: Object.values(RefundStatus),
      default: RefundStatus.REQUESTED,
      index: true,
    },
    gatewayRefundId: {
      type: String,
      default: null,
      index: true,
    },
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    failureReason: {
      type: String,
      default: null,
    },
    retryCount: {
      type: Number,
      default: 0,
    },
    statusHistory: [
      {
        fromStatus: { type: String, default: null },
        toStatus: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        reason: { type: String, default: "" },
        source: { type: String, default: "SYSTEM" },
      },
    ],
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

refundSchema.index({ order: 1, status: 1 });
refundSchema.index({ user: 1, createdAt: -1 });

export const Refund = mongoose.model("Refund", refundSchema);
export default Refund;
