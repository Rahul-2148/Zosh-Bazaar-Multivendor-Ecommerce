import mongoose from "mongoose";
import crypto from "crypto";

export const generateShareToken = () => {
  return crypto.randomBytes(16).toString("hex");
};

export const sanitizeCollectionSlug = (str = "") => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const collectionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    coverImage: {
      type: String,
      default: "",
    },
    visibility: {
      type: String,
      enum: ["PRIVATE", "SHARED", "PUBLIC"],
      default: "PRIVATE",
    },
    shareToken: {
      type: String,
      sparse: true,
      unique: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isSystem: {
      type: Boolean,
      default: false,
    },
    color: {
      type: String,
      default: "#0d9488",
    },
    icon: {
      type: String,
      default: "favorite",
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index ensuring a user cannot have two collections with the exact same name
collectionSchema.index({ user: 1, name: 1 }, { unique: true });
collectionSchema.index({ user: 1, sortOrder: 1, createdAt: 1 });

export const Collection = mongoose.model("Collection", collectionSchema);
export default Collection;
