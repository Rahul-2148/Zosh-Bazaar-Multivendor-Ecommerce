// client/src/types/cartTypes.ts

import type { IProduct } from "./productTypes";
import type { IUser } from "./userTypes";

// 🔹 Single Cart Item
export interface ICartItem {
  _id: string;
  cart: ICart | string;
  product: IProduct;
  variantId?: string | null;
  selectedVariant?: {
    sku?: string;
    title?: string;
    attributes?: Array<{ name?: string; key?: string; value?: any; unit?: string }>;
    image?: string;
  };
  size?: string;
  quantity: number;
  mrpPrice: number; // Line total MRP
  sellingPrice: number; // Line total Selling
  unitSellingPrice?: number;
  unitMrpPrice?: number;
  stockStatus?: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
  availableStock?: number;
  stockWarning?: string | null;
  userId: string;
  ram?: string;
  weight?: string;
  capacity?: string;

  createdAt?: Date;
  updatedAt?: Date;
  __v?: number;
}

// 🔹 Multi-Vendor Package Grouping
export interface ISellerPackage {
  sellerId: string;
  sellerName: string;
  businessDetails?: {
    businessName?: string;
    businessEmail?: string;
    businessAddress?: string;
  } | null;
  fulfillmentType: string;
  estimatedDeliveryDate: string;
  items: ICartItem[];
  packageMrpPrice: number;
  packageSellingPrice: number;
  packageItemsCount: number;
}

// 🔹 Real-time Validation Warnings
export interface IValidationWarning {
  type: "PRICE_CHANGED" | "ITEM_UNAVAILABLE" | "COUPON_INVALIDATED" | "COUPON_EXPIRED" | "STOCK_CHANGED";
  productId?: string;
  code?: string;
  title?: string;
  oldPrice?: number;
  newPrice?: number;
  diff?: number;
  message: string;
}

// 🔹 Authoritative Pricing Summary
export interface IPricingSummary {
  totalMrpPrice: number;
  itemSellingPrice: number;
  couponDiscount: number;
  deliveryFee: number;
  totalPayable: number;
  totalSavings: number;
  isFreeDelivery: boolean;
  freeDeliveryThreshold: number;
  amountNeededForFreeDelivery: number;
}

// 🔹 User Cart
export interface ICart {
  _id: string;
  user: IUser | string;
  cartItems: ICartItem[];
  sellerPackages?: ISellerPackage[];
  validationWarnings?: IValidationWarning[];
  pricingSummary?: IPricingSummary;
  totalMrpPrice: number;
  totalSellingPrice: number;
  totalItem: number;
  discount: number;
  couponCode?: string | null;
  couponPrice?: number;
  createdAt?: Date;
  updatedAt?: Date;
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
