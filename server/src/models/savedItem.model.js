import mongoose from "mongoose";

const savedItemSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    collectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Collection",
      required: true,
      index: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    selectedVariant: {
      sku: { type: String, default: "" },
      title: { type: String, default: "" },
      attributes: [
        {
          name: { type: String },
          key: { type: String },
          value: { type: mongoose.Schema.Types.Mixed },
          unit: { type: String, default: "" },
        },
      ],
      image: { type: String, default: "" },
    },
    savedPrice: {
      type: Number,
      required: true,
    },
    savedMrp: {
      type: Number,
      required: true,
    },
    snapshot: {
      title: { type: String, default: "" },
      image: { type: String, default: "" },
      brand: { type: String, default: "" },
      category: { type: String, default: "" },
    },
    note: {
      type: String,
      default: "",
      trim: true,
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH"],
      default: "MEDIUM",
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate product in the same collection
savedItemSchema.index(
  { user: 1, collectionId: 1, product: 1 },
  { unique: true }
);

// Fast lookups
savedItemSchema.index({ collectionId: 1, createdAt: -1 });
savedItemSchema.index({ user: 1, product: 1 });
savedItemSchema.index({ product: 1 });

export const SavedItem = mongoose.model("SavedItem", savedItemSchema);
export default SavedItem;
