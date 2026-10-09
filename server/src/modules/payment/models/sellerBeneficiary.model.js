import mongoose from "mongoose";

/**
 * Beneficiary Verification Status Taxonomy
 */
export const BeneficiaryStatus = Object.freeze({
  CREATED: "CREATED",
  PENDING_VERIFICATION: "PENDING_VERIFICATION",
  VERIFIED: "VERIFIED",
  SUSPENDED: "SUSPENDED",
  BLOCKED: "BLOCKED",
  DELETED: "DELETED",
});

const sellerBeneficiarySchema = new mongoose.Schema(
  {
    beneficiaryId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
      index: true,
    },
    accountHolderName: {
      type: String,
      required: true,
      trim: true,
    },
    bankName: {
      type: String,
      required: true,
      trim: true,
    },
    accountNumberMasked: {
      type: String,
      required: true,
      trim: true,
    },
    accountNumberToken: {
      type: String,
      required: true,
      select: false, // Protected against default queries
    },
    ifscCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    accountType: {
      type: String,
      enum: ["CURRENT", "SAVINGS"],
      default: "CURRENT",
    },
    status: {
      type: String,
      enum: Object.values(BeneficiaryStatus),
      default: BeneficiaryStatus.CREATED,
      index: true,
    },
    verificationRef: {
      type: String,
      default: null,
    },
    payoutEligible: {
      type: Boolean,
      default: false,
      index: true,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

sellerBeneficiarySchema.index({ seller: 1, isPrimary: 1 });
sellerBeneficiarySchema.index({ seller: 1, status: 1 });
sellerBeneficiarySchema.index({ seller: 1, accountNumberToken: 1 }, { unique: true });

export const SellerBeneficiary = mongoose.model(
  "SellerBeneficiary",
  sellerBeneficiarySchema
);
export default SellerBeneficiary;
