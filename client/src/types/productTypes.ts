import type { Seller } from "./sellerTypes";

export interface IVariantAttribute {
  name: string;
  key: string;
  value: string;
  unit?: string;
}

export interface IProductVariant {
  _id: string;
  sku: string;
  title: string;
  attributes: IVariantAttribute[];
  mrpPrice: number;
  sellingPrice: number;
  discountPercent: number;
  countInStock: number;
  reservedStock?: number;
  images?: any[];
  weight?: { value?: number; unit?: string };
  dimensions?: { length?: number; width?: number; height?: number; unit?: string };
  barcode?: string;
  status: "ACTIVE" | "INACTIVE";
}

export interface IMediaGroup {
  groupId?: string;
  optionKey: string;
  optionValue: string;
  name?: string;
  images: any[];
}

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
  images: any[];
  mediaGroups?: IMediaGroup[];
  category1: string;
  category2: string;
  category3: string;
  category?: any;
  seller: Seller;
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
  variants?: IProductVariant[];
  attributeDefinitions?: Array<{
    name: string;
    key: string;
    type?: string;
    isVariant?: boolean;
    options: string[];
    allowedUnits?: string[];
  }>;
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
  searchMetadata?: {
    showingResultsFor?: string;
    originalQuery?: string;
    isCorrected?: boolean;
    searchInsteadUrl?: string;
    curatedRails?: {
      topBrands?: string[];
      popularCategories?: Array<{ label: string; query: string }>;
      dealBanner?: { title: string; subtitle: string; discountTag?: string };
      occasionChips?: string[];
    };
  } | null;
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
