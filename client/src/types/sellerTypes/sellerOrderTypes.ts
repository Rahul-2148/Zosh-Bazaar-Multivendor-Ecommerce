// client/src/types/sellerTypes/sellerOrderTypes.ts

import type { IOrder } from "../orderTypes";

// Redux Slice State
export interface SellerOrderState {
  orders: IOrder[]; // imported from orderTypes
  loading: boolean;
  error: string | null;
  message: string | null;
}

// API Response Types
export interface FetchSellerOrdersResponse {
  error: boolean;
  success: boolean;
  message?: string;
  orders: IOrder[];
}

export interface UpdateOrderStatusResponse {
  error: boolean;
  success: boolean;
  message: string;
  order: IOrder;
}

export interface DeleteOrderResponse {
  error: boolean;
  success: boolean;
  message: string;
  order: IOrder;
}

