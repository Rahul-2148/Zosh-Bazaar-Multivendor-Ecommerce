import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    storeName: {
      type: String,
      default: "Zosh Bazaar",
    },
    supportEmail: {
      type: String,
      default: "support@zoshbazaar.com",
    },
    supportPhone: {
      type: String,
      default: "+91 9973162148",
    },
    currencySymbol: {
      type: String,
      default: "₹",
    },
    currencyCode: {
      type: String,
      default: "INR",
    },
    shippingFee: {
      type: Number,
      default: 79,
    },
    freeShippingThreshold: {
      type: Number,
      default: 999,
    },
    taxRatePercent: {
      type: Number,
      default: 18,
    },
    announcementBanner: {
      type: String,
      default: "Welcome to Zosh Bazaar — Superfast Deliveries & Authentic Brands",
    },
  },
  {
    timestamps: true,
  }
);

export const PlatformSettings = mongoose.model(
  "PlatformSettings",
  settingsSchema
);
