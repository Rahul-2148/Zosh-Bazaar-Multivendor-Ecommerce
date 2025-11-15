import mongoose from "mongoose";
import UserRoles from "../domain/UserRole.js";
import AccountStatus from "../domain/AccountStatus.js";

const sellerSchema = mongoose.Schema(
  {
    sellerName: {
      type: String,
      required: true,
    },
    mobile: {
      type: Number,
      required: true,
      unique: true,
    },
    GSTIN: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    businessDetails: {
      businessName: {
        type: String,
      },
      businessPan: {
        type: String,
      },
      businessLogo: {
        type: String,
      },
      banner: {
        type: String,
      },
    },
    bankDetails: {
      accountNumber: {
        type: String,
      },
      accountHolderName: {
        type: String,
      },
      bankName: {
        type: String,
      },
      ifscCode: {
        type: String,
      },
      accountBranch: {
        type: String,
      },
      accountHolderEmail: {
        type: String,
      },
    },
    pickupAddress: {
      type: mongoose.Schema.Types.ObjectId, // provided id as a foreign key
      ref: "Address",
    },
    role: {
      type: String,
      enum: [UserRoles.SELLER],
      default: UserRoles.SELLER,
    },
    accountStatus: {
      type: String,
      enum: [
        AccountStatus.PENDING_VERIFICATION,
        AccountStatus.ACTIVE,
        AccountStatus.SUSPENDED,
        AccountStatus.DEACTIVATED,
        AccountStatus.BANNED,
        AccountStatus.CLOSED,
      ],
      default: AccountStatus.PENDING_VERIFICATION,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Seller = mongoose.model("Seller", sellerSchema);
