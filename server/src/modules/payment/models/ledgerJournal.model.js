import mongoose from "mongoose";

const ledgerJournalSchema = new mongoose.Schema(
  {
    journalId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    referenceType: {
      type: String,
      required: true,
      enum: [
        "PAYMENT_INTENT",
        "PAYMENT_ATTEMPT",
        "WALLET_TOPUP",
        "WALLET_PURCHASE",
        "WALLET_RESERVATION",
        "WALLET_RELEASE",
        "REFUND",
        "SELLER_SETTLEMENT",
        "COMMISSION",
        "ADJUSTMENT",
      ],
      index: true,
    },
    referenceId: {
      type: String,
      required: true,
      index: true,
    },
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    description: {
      type: String,
      default: "",
    },
    currency: {
      type: String,
      default: "INR",
      uppercase: true,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    isBalanced: {
      type: Boolean,
      required: true,
      default: true,
    },
    postingsCount: {
      type: Number,
      default: 0,
    },
    postedAt: {
      type: Date,
      default: Date.now,
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

ledgerJournalSchema.index({ referenceType: 1, referenceId: 1 });
ledgerJournalSchema.index({ postedAt: -1 });

export const LedgerJournal = mongoose.model("LedgerJournal", ledgerJournalSchema);
export default LedgerJournal;
