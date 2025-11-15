import type { Seller } from "./sellerTypes";

export interface SellerReport {
  _id: string;
  seller: Seller; // imported
  totalEarnings: number;
  totalSales: number;
  totalRefunds: number;
  totalTax: number;
  netEarnings: number;
  totalOrders: number;
  cancelledOrders: number;
  totalTransactions: number;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}
