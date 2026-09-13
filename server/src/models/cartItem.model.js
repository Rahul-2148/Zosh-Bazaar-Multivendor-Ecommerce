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
    // Legacy support fields
    size: { type: String, default: "" },
    ram: { type: String, default: "" },
    weight: { type: String, default: "" },
    capacity: { type: String, default: "" },
  },
  {
    timestamps: true,
  }
);

// Fast cart item lookups
cartItemSchema.index({ cart: 1, product: 1, variantId: 1 });
cartItemSchema.index({ userId: 1 });

export const CartItem = mongoose.model("CartItem", cartItemSchema);
