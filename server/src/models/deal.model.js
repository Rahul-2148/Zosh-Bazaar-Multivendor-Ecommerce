import mongoose from "mongoose";

const dealSchema = new mongoose.Schema(
  {
    discount: {
      type: Number,
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HomeCategory",
      required: true,
    },
    // startDate: {
    //   type: Date,
    //   required: true,
    // },
    // endDate: {
    //   type: Date,
    //   required: true,
    // },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const Deal = mongoose.model("Deal", dealSchema);
