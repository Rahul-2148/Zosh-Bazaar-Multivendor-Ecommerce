import mongoose from "mongoose";

const paymentWebhookEventSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      required: true,
      enum: ["RAZORPAY", "STRIPE", "MOCK"],
      default: "RAZORPAY",
    },
    eventId: {
      type: String,
      required: true,
      trim: true,
    },
    eventType: {
      type: String,
      required: true,
      trim: true,
    },
    signature: {
      type: String,
      default: "",
    },
    payloadHash: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["RECEIVED", "PROCESSING", "PROCESSED", "FAILED", "IGNORED"],
      default: "RECEIVED",
    },
    error: {
      type: String,
      default: null,
    },
    retryCount: {
      type: Number,
      default: 0,
    },
    paymentId: {
      type: String,
      default: null,
    },
    orderId: {
      type: String,
      default: null,
    },
    receivedAt: {
      type: Date,
      default: Date.now,
    },
    processedAt: {
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

// Compound unique index prevents processing duplicate provider webhook events
paymentWebhookEventSchema.index({ provider: 1, eventId: 1 }, { unique: true });
paymentWebhookEventSchema.index({ status: 1, createdAt: -1 });
paymentWebhookEventSchema.index({ paymentId: 1 });
paymentWebhookEventSchema.index({ orderId: 1 });

export const PaymentWebhookEvent = mongoose.model(
  "PaymentWebhookEvent",
  paymentWebhookEventSchema
);

export default PaymentWebhookEvent;
