import mongoose from "mongoose";
import LedgerAccount, { EntryType } from "../domain/LedgerAccount.js";

const ledgerPostingSchema = new mongoose.Schema(
  {
    postingId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    journalId: {
      type: String,
      required: true,
      index: true,
    },
    journal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LedgerJournal",
      required: true,
      index: true,
    },
    account: {
      type: String,
      required: true,
      enum: Object.values(LedgerAccount),
      index: true,
    },
    entryType: {
      type: String,
      required: true,
      enum: Object.values(EntryType),
    },
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
    partyType: {
      type: String,
      enum: ["CUSTOMER", "SELLER", "PLATFORM", "GATEWAY", "BANK", "NONE"],
      default: "NONE",
    },
    partyId: {
      type: String,
      default: null,
      index: true,
    },
    postedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

ledgerPostingSchema.index({ account: 1, postedAt: -1 });
ledgerPostingSchema.index({ partyType: 1, partyId: 1, postedAt: -1 });

export const LedgerPosting = mongoose.model("LedgerPosting", ledgerPostingSchema);
export default LedgerPosting;
