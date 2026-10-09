import mongoose from "mongoose";

const paymentOutboxSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
      enum: [
        "PaymentCaptured",
        "PaymentFailed",
        "PaymentRefunded",
        "WalletDebited",
        "WalletRefunded",
        "SettlementCreated",
        "SettlementCompleted",
      ],
      index: true,
    },
    aggregateType: {
      type: String,
      required: true,
      enum: ["PaymentIntent", "PaymentAttempt", "Refund", "Settlement", "Wallet"],
      index: true,
    },
    aggregateId: {
      type: String,
      required: true,
      index: true,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "PROCESSING", "PUBLISHED", "FAILED"],
      default: "PENDING",
      index: true,
    },
    retryCount: {
      type: Number,
      default: 0,
    },
    maxRetries: {
      type: Number,
      default: 5,
    },
    lastError: {
      type: String,
      default: null,
    },
    nextRetryAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    idempotencyKey: {
      type: String,
      sparse: true,
      unique: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

paymentOutboxSchema.index({ status: 1, nextRetryAt: 1 });
paymentOutboxSchema.index({ eventType: 1, aggregateId: 1 });

export const PaymentOutbox = mongoose.model("PaymentOutbox", paymentOutboxSchema);
export default PaymentOutbox;
