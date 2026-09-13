import type { IProduct } from "./productTypes";

export type CollectionVisibility = "PRIVATE" | "SHARED" | "PUBLIC";

export interface ICollection {
  _id: string;
  user?: string;
  name: string;
  slug: string;
  description: string;
  coverImage: string;
  visibility: CollectionVisibility;
  shareToken?: string;
  isDefault: boolean;
  isSystem: boolean;
  color: string;
  icon: string;
  sortOrder: number;
  itemCount?: number;
  previewImages?: string[];
  ownerName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type StockStatusType = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "UNAVAILABLE";

export interface ISmartState {
  currentPrice: number;
  currentMrp: number;
  savedPrice: number;
  savedMrp: number;
  priceDrop: number;
  isPriceDropped: boolean;
  priceIncrease: number;
  isPriceIncreased: boolean;
  discountPercent: number;
  stockStatus: StockStatusType;
  countInStock: number;
  isAvailable: boolean;
  isArchived?: boolean;
}

export interface ISavedItem {
  _id: string;
  user: string;
  collectionId: string;
  product: IProduct;
  variantId?: string | null;
  selectedVariant?: {
    sku?: string;
    title?: string;
    attributes?: Array<{ name?: string; key?: string; value: any; unit?: string }>;
    image?: string;
  };
  savedPrice: number;
  savedMrp: number;
  snapshot?: {
    title?: string;
    image?: string;
    brand?: string;
    category?: string;
  };
  note?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH";
  smartState: ISmartState;
  createdAt: string;
  updatedAt: string;
}

export type AvailabilityFilter =
  | "all"
  | "in_stock"
  | "out_of_stock"
  | "price_dropped"
  | "on_sale";

export type SortFilter =
  | "recently_added"
  | "price_low_high"
  | "price_high_low"
  | "biggest_discount"
  | "title_asc";

export interface WishlistFilters {
  collectionId?: string;
  slug?: string;
  search?: string;
  availability?: AvailabilityFilter;
  sort?: SortFilter;
  page?: number;
  limit?: number;
}

export interface WishlistPagination {
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

export interface IWishlist {
  _id: string;
  user: string;
  products: IProduct[];
  createdAt?: string;
  updatedAt?: string;
}

export interface WishlistState {
  items: ISavedItem[];
  collections: ICollection[];
  activeCollection: ICollection | null;
  savedProductIds: string[];
  totalSavedCount: number;
  pagination: WishlistPagination;
  filters: WishlistFilters;
  loading: boolean;
  collectionsLoading: boolean;
  error: string | null;
  message: string | null;
  // Legacy support for older components
  wishlist: IWishlist | null;
}
