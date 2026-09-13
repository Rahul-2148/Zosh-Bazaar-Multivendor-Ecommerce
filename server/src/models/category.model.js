import mongoose from "mongoose";

const attributeDefinitionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    key: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    type: {
      type: String,
      enum: ["SELECT", "TEXT", "NUMBER", "MEASUREMENT", "BOOLEAN"],
      default: "SELECT",
    },
    isVariant: {
      type: Boolean,
      default: false,
    },
    options: {
      type: [String],
      default: [],
    },
    allowedUnits: {
      type: [String],
      default: [],
    },
    required: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    categoryId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    image: {
      type: String,
      default: "",
    },
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    level: {
      type: Number,
      required: true,
      min: 1,
      max: 3,
    },
    attributes: {
      type: [attributeDefinitionSchema],
      default: [],
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

categorySchema.index({ parentCategory: 1, level: 1 });
categorySchema.index({ isActive: 1 });

export const Category = mongoose.model("Category", categorySchema);
