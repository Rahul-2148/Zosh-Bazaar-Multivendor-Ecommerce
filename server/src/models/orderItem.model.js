import mongoose from "mongoose";

const orderItemSchema = mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product", // Reference to the Product model
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    mrpPrice: {
      type: Number,
      required: true,
    },
    sellingPrice: {
      type: Number,
      required: true,
    },
    size: {
      type: String,
      // required: true,
    },
    ram: {
      type: String,
    },
    weight: {
      type: String,
    },
    capacity: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const OrderItem = mongoose.model("OrderItem", orderItemSchema);
