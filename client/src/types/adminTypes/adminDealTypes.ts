// client/src/types/adminTypes/adminDealTypes.ts

import type { IHomeCategory } from "../homeCategoryTypes";

// Deal entity type
export interface IDeal {
  _id: string;
  discount: number;
  category: IHomeCategory; // relation with home category
  // startDate: Date;
  // endDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

// Redux state for Admin -> Deals
export interface AdminDealState {
  deals: IDeal[];
  loading: boolean;
  error: string | null;
  message: string | null;
}

// API response types

// Get all deals
export interface FetchDealsResponse {
  deals: IDeal[];
  error: boolean;
  success: boolean;
  message?: string;
}

// Create deal
export interface CreateDealResponse {
  deal: IDeal;
  error: boolean;
  success: boolean;
  message: string;
}

// Update deal
export interface UpdateDealResponse {
  deal: IDeal;
  error: boolean;
  success: boolean;
  message: string;
}

// Delete deal
export interface DeleteDealResponse {
  deletedDeal: IDeal;
  error: boolean;
  success: boolean;
  message: string;
}
