import mongoose from "mongoose";

const walletSchema = new mongoose.Schema(
  {
    walletId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    currency: {
      type: String,
      default: "INR",
      uppercase: true,
    },
    availableBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    reservedBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    promotionalBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    refundBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "FROZEN", "CLOSED"],
      default: "ACTIVE",
      index: true,
    },
    version: {
      type: Number,
      default: 1,
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        reason: { type: String, default: "" },
      },
    ],
  },
  {
    timestamps: true,
  }
);

walletSchema.index({ user: 1, status: 1 });

export const Wallet = mongoose.model("Wallet", walletSchema);
export default Wallet;
