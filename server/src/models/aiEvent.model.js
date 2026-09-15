import mongoose from "mongoose";

const aiEventSchema = new mongoose.Schema(
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
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    anonymousId: {
      type: String,
      default: "",
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
      index: true,
    },
    categoryId: {
      type: String,
      default: "",
    },
    sellerId: {
      type: String,
      default: "",
    },
    brand: {
      type: String,
      default: "",
    },
    price: {
      type: Number,
      default: 0,
    },
    quantity: {
      type: Number,
      default: 1,
    },
    searchQuery: {
      type: String,
      default: "",
    },
    recommendationContext: {
      recommendationId: { type: String, default: "" },
      requestId: { type: String, default: "" },
      placement: { type: String, default: "" },
      modelVersion: { type: String, default: "" },
      rankPosition: { type: Number, default: 0 },
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-expire events after 90 days to respect retention limits
aiEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const AiEvent = mongoose.model("AiEvent", aiEventSchema);
export default AiEvent;
