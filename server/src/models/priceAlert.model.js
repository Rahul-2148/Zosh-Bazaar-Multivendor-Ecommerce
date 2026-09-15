import mongoose from "mongoose";

const autoBuyPolicySchema = new mongoose.Schema(
  {
    enabled: {
      type: Boolean,
      default: false,
    },
    maxAuthorizedPrice: {
      type: Number,
      required: true,
    },
    deliveryAddress: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Address",
      default: null,
    },
    quantityLimit: {
      type: Number,
      default: 1,
      min: 1,
      max: 5,
    },
    paymentMethodType: {
      type: String,
      enum: ["SAVED_UPI", "SAVED_CARD", "ONE_CLICK_COD"],
      default: "ONE_CLICK_COD",
    },
    userConsentTimestamp: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["PENDING_AUTHORIZATION", "AUTHORIZED", "EXECUTED", "EXPIRED", "REVOKED"],
      default: "AUTHORIZED",
    },
  },
  { _id: false }
);

const priceAlertSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    variantSku: {
      type: String,
      default: null,
    },
    targetPrice: {
      type: Number,
      required: true,
    },
    priceAtCreation: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "TRIGGERED", "CANCELLED", "EXPIRED"],
      default: "ACTIVE",
      index: true,
    },
    channels: {
      type: [String],
      enum: ["IN_APP", "EMAIL", "PUSH", "WHATSAPP"],
      default: ["IN_APP", "EMAIL"],
    },
    triggeredAt: {
      type: Date,
      default: null,
    },
    triggeredPrice: {
      type: Number,
      default: null,
    },
    autoBuyPolicy: {
      type: autoBuyPolicySchema,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "price_alerts",
  }
);

// Compound index for active alert monitoring
priceAlertSchema.index({ product: 1, status: 1, targetPrice: 1 });

export const PriceAlert = mongoose.model("PriceAlert", priceAlertSchema);
export default PriceAlert;
