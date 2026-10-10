import mongoose from "mongoose";

const priceHistorySchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    variantSku: {
      type: String,
      default: null,
    },
    sellingPrice: {
      type: Number,
      required: true,
    },
    mrpPrice: {
      type: Number,
      required: true,
    },
    discountPercent: {
      type: Number,
      default: 0,
    },
    source: {
      type: String,
      enum: ["SELLER_UPDATE", "CATALOG_SYNC", "ADMIN_OVERRIDE", "INITIAL_SNAPSHOT"],
      default: "SELLER_UPDATE",
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "price_histories",
  }
);

// Compound indexes for querying product and variant price trends over time windows
priceHistorySchema.index({ product: 1, timestamp: -1 });
priceHistorySchema.index({ product: 1, variantId: 1, timestamp: -1 });

export const PriceHistory = mongoose.model("PriceHistory", priceHistorySchema);
export default PriceHistory;
