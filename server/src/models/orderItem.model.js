import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    productTitle: {
      type: String,
      default: "",
    },
    productImage: {
      type: String,
      default: "",
    },
    brand: {
      type: String,
      default: "",
    },
    sku: {
      type: String,
      default: "",
    },
    variantTitle: {
      type: String,
      default: "",
    },
    selectedAttributes: [
      {
        name: { type: String },
        key: { type: String },
        value: { type: mongoose.Schema.Types.Mixed },
        unit: { type: String, default: "" },
      },
    ],
    quantity: {
      type: Number,
      required: true,
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
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
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

export const OrderItem = mongoose.model("OrderItem", orderItemSchema);
