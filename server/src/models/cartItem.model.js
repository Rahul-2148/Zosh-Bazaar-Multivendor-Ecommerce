import mongoose from "mongoose";

const cartItemSchema = mongoose.Schema(
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
    size: {
      type: String,
      // required: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 1,
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

export const CartItem = mongoose.model("CartItem", cartItemSchema);
