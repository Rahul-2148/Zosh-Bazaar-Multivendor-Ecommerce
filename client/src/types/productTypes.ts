// client/src/types/productTypes.ts

import type { Seller } from "../types/sellerTypes/sellerTypes";

export interface IProduct {
  _id: string;
  title: string;
  description: string;
  brand: string;
  mrpPrice: number;
  sellingPrice: number;
  discountPercent: number;
  countInStock: number;
  color: string;
  images: string[];
  category1: string;
  category2: string;
  category3: string;
  seller: Seller; // Added the seller type here
  size: string;
  ram: string;
  weight: string;
  capacity: string;
  createdAt: Date;
  updatedAt: Date;
  __v?: number;
}

export interface ProductState {
  product: IProduct | null;
  products: IProduct[];
  totalElements: number;
  totalPages: number;
  loading: boolean;
  error: any;
  searchProducts: IProduct[];
  message: string | null;
}

export interface FetchSingleProductResponse {
  error: boolean;
  success: boolean;
  message?: string;
  product: IProduct;
}

export interface FetchProductsResponse {
  products: {
    content: IProduct[];
    totalElements: number;
    totalPages: number;
  };
  message?: string;
}
