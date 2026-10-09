import mongoose from "mongoose";

const walletReservationSchema = new mongoose.Schema(
  {
    reservationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    wallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    intentId: {
      type: String,
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    currency: {
      type: String,
      default: "INR",
      uppercase: true,
    },
    status: {
      type: String,
      enum: ["RESERVED", "COMMITTED", "RELEASED"],
      default: "RESERVED",
      index: true,
    },
    idempotencyKey: {
      type: String,
      sparse: true,
      index: true,
    },
    committedAt: {
      type: Date,
      default: null,
    },
    releasedAt: {
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
  },
  {
    timestamps: true,
  }
);

walletReservationSchema.index({ wallet: 1, intentId: 1 }, { unique: true });

export const WalletReservation = mongoose.model("WalletReservation", walletReservationSchema);
export default WalletReservation;
