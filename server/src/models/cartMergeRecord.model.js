import mongoose from "mongoose";

const cartMergeRecordSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    idempotencyKey: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["IN_PROGRESS", "COMPLETED", "FAILED"],
      default: "IN_PROGRESS",
    },
    mergedItems: {
      type: Array,
      default: [],
    },
    failedItems: {
      type: Array,
      default: [],
    },
    totalProcessed: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 86400, // TTL index: expires after 24 hours
    },
  },
  {
    timestamps: true,
    collection: "cart_merge_records",
  }
);

// Concurrency safety: atomic compound unique index ensures one execution per user & key
cartMergeRecordSchema.index({ userId: 1, idempotencyKey: 1 }, { unique: true });

export const CartMergeRecord = mongoose.model("CartMergeRecord", cartMergeRecordSchema);
export default CartMergeRecord;
