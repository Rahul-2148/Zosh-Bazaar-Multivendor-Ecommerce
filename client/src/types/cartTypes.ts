// client/src/types/cartTypes.ts

import type { IProduct } from "./productTypes";
import type { IUser } from "./userTypes";

// 🔹 Single Cart Item
export interface ICartItem {
  _id: string;
  cart: ICart; // cartId
  product: IProduct; // productId
  size?: string;
  quantity: number;
  mrpPrice: number;
  sellingPrice: number;
  userId: string;
  ram?: string;
  weight?: string;
  capacity?: string;

  createdAt: Date;
  updatedAt: Date;
  __v?: number;
}

// 🔹 User Cart
export interface ICart {
  _id: string;
  user: IUser; // userId
  cartItems: ICartItem[];
  totalMrpPrice: number;
  totalSellingPrice: number;
  totalItem: number;
  discount: number;
  couponCode?: string;
  couponPrice?: number;
  createdAt: Date;
  updatedAt: Date;
  __v?: number;
}

// 🔹 Redux Slice State
export interface CartState {
  cart: ICart | null;
  loading: boolean;
  error: any;
  message: string | null;
}

// 🔹 API Response Types
export interface FetchCartResponse {
  error: boolean;
  success: boolean;
  message?: string;
  cart: ICart;
}

export interface AddCartItemResponse {
  error: boolean;
  success: boolean;
  message?: string;
  cartItem: ICartItem;
}

export interface UpdateCartItemResponse {
  error: boolean;
  success: boolean;
  message: string;
  cartItem: ICartItem;
}

export interface DeleteCartItemResponse {
  error: boolean;
  success: boolean;
  message: string;
  cartItem: ICartItem;
}
