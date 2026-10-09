import mongoose from "mongoose";

const paymentOfferSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    discountType: {
      type: String,
      enum: ["PERCENTAGE", "FLAT"],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    maxDiscount: {
      type: Number,
      default: null,
    },
    minOrderValue: {
      type: Number,
      default: 0,
    },
    applicableRail: {
      type: String,
      enum: ["ALL", "CARD", "UPI", "NETBANKING", "WALLET", "EMI"],
      default: "ALL",
      index: true,
    },
    applicableBanks: [
      {
        type: String,
        uppercase: true,
      },
    ],
    applicableCardNetworks: [
      {
        type: String,
        uppercase: true,
      },
    ],
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    usageLimitPerUser: {
      type: Number,
      default: 5,
    },
    totalUsageLimit: {
      type: Number,
      default: 100000,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const PaymentOffer = mongoose.model("PaymentOffer", paymentOfferSchema);
export default PaymentOffer;
