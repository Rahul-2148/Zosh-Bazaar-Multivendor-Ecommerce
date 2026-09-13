import mongoose from "mongoose";
import UserRoles from "../domain/UserRole.js";
import AccountStatus from "../domain/AccountStatus.js";

const userSchema = mongoose.Schema({
  fullName: {
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
    // required: true,
    select: false,
  },
  mobile: {
    type: String,
    default: "",
  },
  addresses: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Address",
    },
  ],
  role: {
    type: String,
    enum: [UserRoles.CUSTOMER, UserRoles.ADMIN],
    default: UserRoles.CUSTOMER,
  },
  avatar: {
    type: String,
    default: "",
  },
  gender: {
    type: String,
    enum: ["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"],
    default: "PREFER_NOT_TO_SAY",
  },
  dateOfBirth: {
    type: Date,
    default: null,
  },
  isEmailVerified: {
    type: Boolean,
    default: true,
  },
  isMobileVerified: {
    type: Boolean,
    default: true,
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false,
  },

  // ── Account Lifecycle ──────────────────────────────
  accountStatus: {
    type: String,
    enum: Object.values(AccountStatus),
    default: AccountStatus.ACTIVE,
    index: true,
  },
  deactivatedAt: {
    type: Date,
    default: null,
  },
  deactivationReason: {
    type: String,
    default: "",
  },
  deletionRequestedAt: {
    type: Date,
    default: null,
  },
  deletionScheduledAt: {
    type: Date,
    default: null,
  },
  deletionReason: {
    type: String,
    default: "",
  },

  preferences: {
    language: { type: String, default: "en" },
    theme: { type: String, default: "system" },
    emailNotifications: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true },
    orderUpdates: { type: Boolean, default: true },
    promotionalOffers: { type: Boolean, default: true },
    priceDropAlerts: { type: Boolean, default: true },
  },
  savedPaymentMethods: [
    {
      type: {
        type: String,
        enum: ["CARD", "UPI"],
        required: true,
      },
      cardHolderName: { type: String, default: "" },
      cardLast4: { type: String, default: "" },
      cardBrand: { type: String, default: "" },
      cardExpiry: { type: String, default: "" },
      upiId: { type: String, default: "" },
      isDefault: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now },
    },
  ],
}, {
  timestamps: true,
});

export const User = mongoose.model("User", userSchema);
export default User;

