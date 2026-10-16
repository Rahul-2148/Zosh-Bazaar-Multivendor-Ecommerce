import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
  {
    cart: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cart",
      required: true,
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
    quantity: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
    mrpPrice: {
      type: Number,
      required: true,
    },
    sellingPrice: {
      type: Number,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    // Guest cart merge idempotency tracking
    appliedGuestItemIds: {
      type: [String],
      default: [],
    },
    appliedGuestItems: [
      {
        signature: { type: String, required: true },
        clientItemId: { type: String, required: true },
        quantityApplied: { type: Number, required: true },
        remainingQuantity: { type: Number, default: 0 },
        appliedAt: { type: Date, default: Date.now },
      },
    ],
    // Legacy support fields
    size: { type: String, default: "" },
    ram: { type: String, default: "" },
    weight: { type: String, default: "" },
    capacity: { type: String, default: "" },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
  }
);

// Unique cart line item per product variant to guarantee no duplicate cart rows
cartItemSchema.index({ cart: 1, product: 1, variantId: 1 }, { unique: true });
cartItemSchema.index({ userId: 1 });
cartItemSchema.index({ cart: 1, appliedGuestItemIds: 1 });
cartItemSchema.index({ cart: 1, "appliedGuestItems.signature": 1, "appliedGuestItems.clientItemId": 1 });

export const CartItem = mongoose.model("CartItem", cartItemSchema);
