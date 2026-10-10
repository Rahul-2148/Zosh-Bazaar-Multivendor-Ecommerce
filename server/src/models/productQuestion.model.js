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
    upvotedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
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
    upvotedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    category: {
      type: String,
      trim: true,
      default: "General",
    },
    moderationStatus: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
      index: true,
    },
    isApproved: {
      type: Boolean,
      default: false,
      index: true,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    moderatedAt: {
      type: Date,
      default: null,
    },
    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

productQuestionSchema.index({ product: 1, createdAt: -1 });

export const ProductQuestion = mongoose.model("ProductQuestion", productQuestionSchema);
export default ProductQuestion;
