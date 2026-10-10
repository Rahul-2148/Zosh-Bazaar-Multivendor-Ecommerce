import mongoose from "mongoose";

const answerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    authorName: {
      type: String,
      required: true,
      trim: true,
    },
    authorRole: {
      type: String,
      enum: ["SELLER", "VERIFIED_BUYER", "ADMIN", "COMMUNITY"],
      default: "COMMUNITY",
    },
    isSellerAnswer: {
      type: Boolean,
      default: function () {
        return this.authorRole === "SELLER";
      },
    },
    isVerifiedBuyer: {
      type: Boolean,
      default: function () {
        return this.authorRole === "VERIFIED_BUYER";
      },
    },
    answer: {
      type: String,
      required: true,
      trim: true,
    },
    upvotes: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const productQuestionSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userName: {
      type: String,
      default: "Verified Shopper",
    },
    question: {
      type: String,
      required: true,
      trim: true,
    },
    answers: {
      type: [answerSchema],
      default: [],
    },
    upvotes: {
      type: Number,
      default: 0,
    },
    category: {
      type: String,
      trim: true,
      default: "General",
    },
    isApproved: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

productQuestionSchema.index({ product: 1, createdAt: -1 });

export const ProductQuestion = mongoose.model("ProductQuestion", productQuestionSchema);
export default ProductQuestion;
