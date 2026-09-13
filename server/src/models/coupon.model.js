import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    discountPercentage: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
    },
    validityStartDate: {
      type: Date,
      required: true,
    },
    validityEndDate: {
      type: Date,
      required: true,
    },
    minimumOrderValue: {
      type: Number,
      required: true,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

couponSchema.index({ isActive: 1 });

export const Coupon = mongoose.model("Coupon", couponSchema);
