import mongoose from "mongoose";

const sellerReportSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
    },
    totalEarnings: {
      type: Number,
      default: 0,
    },
    totalSales: {
      type: Number,
      default: 0,
    },
    totalRefunds: {
      type: Number,
      default: 0,
    },
    totalTax: {
      type: Number,
      default: 0,
    },
    netEarnings: {
      type: Number,
      default: 0,
    },
    totalOrders: {
      type: Number,
      default: 0, // Default value for total orders
    },
    cancelledOrders: {
      type: Number,
      default: 0, // Default value for cancelled orders
    },
    totalTransactions: {
      type: Number,
      default: 0, // Default value for total transactions
    },
  },
  { timestamps: true }
);

export const SellerReport = mongoose.model("SellerReport", sellerReportSchema);
