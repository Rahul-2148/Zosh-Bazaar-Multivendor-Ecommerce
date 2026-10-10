import mongoose from "mongoose";

const cartSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    cartItems: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CartItem",
      },
    ],
    totalMrpPrice: {
      type: Number,
      default: 0,
    },
    totalSellingPrice: {
      type: Number,
      default: 0,
    },
    totalItem: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    couponCode: {
      type: String,
      default: null,
    },
    couponPrice: {
      type: Number,
      default: 0,
    },
    recentMergeSignatures: [
      {
        signature: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Fast unique user lookup
cartSchema.index({ user: 1 }, { unique: true });

export const Cart = mongoose.model("Cart", cartSchema);
