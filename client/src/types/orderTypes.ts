// client/src/types/orderTypes.ts

import type { Address } from "./addressTypes";

// OrderItem type
export interface IOrderItem {
  _id: string;
  product: string;
  quantity: number;
  mrpPrice: number;
  sellingPrice: number;
  size: string;
  ram: string;
  weight: string;
  capacity: string;

  createdAt: Date;
  updatedAt: Date;
  __v?: number;
}

// Order type
export interface IOrder {
  _id: string;
  user: string;
  seller: string;
  orderItems: IOrderItem[];
  shippingAddress: Address;
  totalMrpPrice: number;
  totalSellingPrice: number;
  discount: number;
  orderStatus: string;
  totalItems: number;
  paymentStatus: string;
  orderDate: Date;
  deliveryDate: Date;
  createdAt: Date;
  updatedAt: Date;
  __v?: number;
}

// PaymentOrder type
export interface IPaymentOrder {
  _id: string;
  amount: number;
  paymentStatus: string;
  paymentMethod: string;
  paymentLinkId: string;
  user: string;
  orders: string[];
  currency: string;
  createdAt: Date;
  updatedAt: Date;
  __v?: number;
}

export interface OrderState {
  orders: IOrder[];
  loading: boolean;
  error: any;
  orderItem: IOrderItem | null;
  currentOrder: IOrder | null;
  paymentOrder: IPaymentOrder | null; // Added from paymentOrder type upper
  message: string | null;
}

export interface FetchSingleOrderResponse {
  error: boolean;
  success: boolean;
  message?: string;
  order: IOrder;
}

export interface FetchOrdersResponse {
  error: boolean;
  success: boolean;
  message?: string;
  orders: IOrder[];
}

export interface FetchOrderHistoryResponse {
  error: boolean;
  success: boolean;
  message?: string;
  orderHistory: IOrder[];
}

export interface FetchOrderItemResponse {
  error: boolean;
  success: boolean;
  message?: string;
  orderItem: IOrderItem;
}
