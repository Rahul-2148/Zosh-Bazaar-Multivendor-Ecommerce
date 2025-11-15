// client/src/types/sellerTypes/sellerTransactionTypes.ts

import type { IOrder } from "../orderTypes";
import type { IUser } from "../userTypes";
import type { Seller } from "./sellerTypes";

export interface ITransaction {
  _id: string;
  customer: IUser;   // imported from userTypes
  order: IOrder;     // imported from orderTypes
  seller: Seller;    // imported from sellerTypes
  date: Date;
  createdAt: Date;
  updatedAt: Date;
  __v?: number;
}

// Seller Transaction State
export interface SellerTransactionsState {
  transactions: ITransaction[];
  loading: boolean;  
  error: string | null;
  message: string | null;
}

// Api Response Types
export interface FetchTransactionsBySellerResponse {
  transactions: ITransaction[];
  message: string;
  error: boolean;
  success: boolean;
}
