import type { Seller } from "./sellerTypes";

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
  category?: any;
  seller: Seller; // Added the seller type here
  size: string;
  ram: string;
  weight: string;
  capacity: string;
  numRatings?: number;
  ratings?: {
    average?: number;
    count?: number;
  };
  hasVariants?: boolean;
  variants?: any[];
  attributeDefinitions?: any[];
  specifications?: any[];
  tags?: string[];
  status?: string;
  id?: string;
  slug?: string;
  inStock?: boolean;
  highlights?: string[];
  warranty?: {
    summary?: string;
    durationMonths?: number;
    type?: string;
  };
  returnPolicy?: {
    returnable?: boolean;
    windowDays?: number;
    policyType?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  __v?: number;
}

export interface CategoryFiltersData {
  brands: { name: string; count: number }[];
  attributes: {
    key: string;
    label: string;
    options: { value: string; count: number }[];
  }[];
  priceRange: {
    minPrice: number;
    maxPrice: number;
  };
  inStockCount: number;
  discountBuckets: {
    label: string;
    minDiscount: number;
    count: number;
  }[];
}

export interface ProductState {
  product: IProduct | null;
  products: IProduct[];
  totalElements: number;
  totalPages: number;
  loading: boolean;
  error: any;
  searchProducts: IProduct[];
  searchSuggestions: {
    products: any[];
    categories: any[];
    brands: string[];
  };
  categoryFilters: CategoryFiltersData | null;
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
