// client/src/types/sellerTypes/sellerProductTypes.ts

import type { IProduct } from "../productTypes";

// Redux Slice State
export interface SellerProductState {
  products: IProduct[];
  loading: boolean;
  error: string | null;
  message: string | null;
  jwt: string | null;
}

// API Response Types
export interface FetchSellerProductsResponse {
  message: string;
  products: IProduct[];
  error: boolean;
  success: boolean;
}

export interface CreateProductResponse {
  message: string;
  product: IProduct;
  error: boolean;
  success: boolean;
}

export interface UpdateProductResponse {
  message: string;
  product: IProduct;
  error: boolean;
  success: boolean;
}

export interface DeleteProductResponse {
  message: string;
  product: IProduct;
  error: boolean;
  success: boolean;
}

export interface DeleteMultipleProductsResponse {
  message: string;
  deletedProducts: IProduct[];
  error: boolean;
  success: boolean;
}

// Error Type
export interface ErrorResponse {
  message: string;
}
