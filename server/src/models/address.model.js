import mongoose from "mongoose";

const addressSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
    },
    mobile: {
      type: Number,
      required: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    house: {
      type: String,
      default: "",
      trim: true,
    },
    floor: {
      type: String,
      default: "",
      trim: true,
    },
    street: {
      type: String,
      default: "",
      trim: true,
    },
    locality: {
      type: String,
      required: true,
      trim: true,
    },
    landmark: {
      type: String,
      default: "",
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    district: {
      type: String,
      default: "",
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    pincode: {
      type: Number,
      required: true,
    },
    country: {
      type: String,
      required: true,
      default: "India",
      trim: true,
    },
    addressType: {
      type: String,
      enum: ["HOME", "WORK", "OTHER"],
      default: "HOME",
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    deliveryInstructions: {
      type: String,
      default: "",
      trim: true,
    },
    coordinates: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
    serviceability: {
      type: Boolean,
      default: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

addressSchema.index({ user: 1, isDefault: 1 });
addressSchema.index({ pincode: 1 });

export const Address = mongoose.model("Address", addressSchema);
export default Address;
