import mongoose from "mongoose";
import PaymentStatus from "../domain/PaymentStatus.js";
import PaymentMethod from "../domain/PaymentMethod.js";

const paymentOrderSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
    },
    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethod),
      default: PaymentMethod.RAZORPAY,
    },
    paymentLinkId: {
      type: String,
      default: null,
      index: true,
    },
    paymentId: {
      type: String,
      default: null,
      index: true,
    },
    razorpayOrderId: {
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
    orders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        required: true,
      },
    ],
    currency: {
      type: String,
      default: "INR",
    },
    statusHistory: [
      {
        fromStatus: { type: String },
        toStatus: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        reason: { type: String, default: "" },
        source: { type: String, default: "SYSTEM" }, // "WEBHOOK", "CLIENT_CALLBACK", "SYSTEM"
      },
    ],
    processedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual alias for legacy 'order' references
paymentOrderSchema.virtual("order").get(function () {
  return this.orders;
});

paymentOrderSchema.index({ paymentStatus: 1, createdAt: -1 });
paymentOrderSchema.index({ orders: 1 });

const PaymentOrder = mongoose.model("PaymentOrder", paymentOrderSchema);

export default PaymentOrder;
