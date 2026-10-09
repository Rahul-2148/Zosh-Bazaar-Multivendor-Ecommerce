import mongoose from "mongoose";
import PaymentIntentStatus from "../domain/PaymentIntentStatus.js";

const paymentIntentSchema = new mongoose.Schema(
  {
    intentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    orders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        required: true,
      },
    ],
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
      enum: Object.values(PaymentIntentStatus),
      default: PaymentIntentStatus.CREATED,
      index: true,
    },
    selectedMethod: {
      rail: { type: String, default: null },
      subMethod: { type: String, default: null },
      upiApp: { type: String, default: null },
      upiId: { type: String, default: null },
      bankCode: { type: String, default: null },
      cardToken: { type: String, default: null },
      cardLast4: { type: String, default: null },
      cardBrand: { type: String, default: null },
    },
    splitConfig: {
      walletAmount: { type: Number, default: 0 },
      railAmount: { type: Number, default: 0 },
    },
    pricingSnapshot: {
      mrpTotal: { type: Number, default: 0 },
      sellingPriceTotal: { type: Number, default: 0 },
      discountTotal: { type: Number, default: 0 },
      couponCode: { type: String, default: null },
      couponDiscount: { type: Number, default: 0 },
      offerId: { type: String, default: null },
      offerDiscount: { type: Number, default: 0 },
      deliveryFee: { type: Number, default: 0 },
      packagingFee: { type: Number, default: 0 },
      finalPayable: { type: Number, required: true },
    },
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    riskScore: {
      type: Number,
      default: 0,
    },
    riskState: {
      type: String,
      enum: ["APPROVED", "FLAGGED", "REJECTED"],
      default: "APPROVED",
    },
    riskReason: {
      type: String,
      default: "",
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
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

paymentIntentSchema.index({ user: 1, createdAt: -1 });
paymentIntentSchema.index({ status: 1, createdAt: -1 });
paymentIntentSchema.index({ orders: 1 });

export const PaymentIntent = mongoose.model("PaymentIntent", paymentIntentSchema);
export default PaymentIntent;
