import mongoose from "mongoose";
import HomeCategorySection from "../domain/HomeCategorySection.js";

const homeCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    categoryId: {
        type: String,
        required: true,
    },
    section: {
        type: String,
        enum: Object.values(HomeCategorySection),
        required: true,
    },
  },
  { timestamps: true }
);

export const HomeCategory = mongoose.model("HomeCategory", homeCategorySchema);
