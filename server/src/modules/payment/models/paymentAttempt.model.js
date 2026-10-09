import mongoose from "mongoose";
import PaymentAttemptStatus from "../domain/PaymentAttemptStatus.js";

const paymentAttemptSchema = new mongoose.Schema(
  {
    attemptId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    intentId: {
      type: String,
      required: true,
      index: true,
    },
    intent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaymentIntent",
      required: true,
      index: true,
    },
    attemptNumber: {
      type: Number,
      default: 1,
    },
    method: {
      type: String,
      required: true,
    },
    rail: {
      type: String,
      default: null,
      index: true,
    },
    provider: {
      type: String,
      default: null,
      index: true,
    },
    adapter: {
      type: String,
      required: true,
    },
    environment: {
      type: String,
      enum: ["production", "sandbox"],
      default: "sandbox",
      index: true,
    },
    providerReference: {
      type: String,
      default: null,
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
    status: {
      type: String,
      enum: Object.values(PaymentAttemptStatus),
      default: PaymentAttemptStatus.INITIATED,
      index: true,
    },
    failureCode: {
      type: String,
      default: null,
    },
    failureReason: {
      type: String,
      default: null,
    },
    isSimulation: {
      type: Boolean,
      default: false,
      index: true,
    },
    idempotencyKey: {
      type: String,
      sparse: true,
      index: true,
    },
    actionPayload: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: null,
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

paymentAttemptSchema.index({ intentId: 1, attemptNumber: 1 });
paymentAttemptSchema.index({ status: 1, createdAt: -1 });

export const PaymentAttempt = mongoose.model("PaymentAttempt", paymentAttemptSchema);
export default PaymentAttempt;
