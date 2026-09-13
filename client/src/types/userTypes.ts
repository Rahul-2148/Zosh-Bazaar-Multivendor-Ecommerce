// client/src/types/userTypes.ts

import type { Address } from "./addressTypes";

export interface IUserPreferences {
  language?: string;
  theme?: string;
  notifications?: {
    orderUpdates?: boolean;
    promotions?: boolean;
    priceDrops?: boolean;
    newsletter?: boolean;
    email?: boolean;
    sms?: boolean;
    push?: boolean;
  };
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  pushNotifications?: boolean;
  orderUpdates?: boolean;
  promotionalOffers?: boolean;
  priceDropAlerts?: boolean;
}

export interface ISavedPaymentMethod {
  _id: string;
  type: "CARD" | "UPI";
  cardHolderName?: string;
  cardLast4?: string;
  cardBrand?: string;
  cardExpiry?: string;
  upiId?: string;
  isDefault: boolean;
  createdAt?: string;
}

export interface IAccountOverviewStats {
  activeOrders: number;
  totalOrders: number;
  activeReturns: number;
  savedItemsCount: number;
  priceDropCount: number;
  availableCoupons: number;
  savedAddresses: number;
  paymentMethodsCount: number;
  unreadNotifications: number;
}

export interface IAccountOverview {
  user: Partial<IUser> & {
    memberSince?: string;
    isEmailVerified?: boolean;
    isMobileVerified?: boolean;
    twoFactorEnabled?: boolean;
  };
  stats: IAccountOverviewStats;
  latestOrder: any | null;
  activeOrders?: any[];
  preferences: IUserPreferences;
}

export interface ITransactionItem {
  _id: string;
  amount: number;
  currency: string;
  paymentStatus: string;
  paymentMethod: string;
  paymentLinkId?: string;
  date: string;
  orders: any[];
}

export interface IBuyAgainProduct {
  product: any;
  lastPurchasedDate: string;
  lastOrderId: string;
  lastPrice: number;
}

export interface IRecentlyViewedItem {
  productId: string;
  title: string;
  image: string;
  sellingPrice: number;
  mrpPrice: number;
  rating?: number;
  ratingsCount?: number;
  category?: string;
  viewedAt: string;
}

export interface IUser {
  _id: string;
  fullName: string;
  email: string;
  mobile: number | string;
  role: string;
  addresses: Address[];
  avatar?: string;
  gender?: string;
  dateOfBirth?: string | Date;
  isEmailVerified?: boolean;
  isMobileVerified?: boolean;
  twoFactorEnabled?: boolean;
  preferences?: IUserPreferences;
  savedPaymentMethods?: ISavedPaymentMethod[];
  createdAt?: string;
  __v?: number;
}

export interface UserState {
  user: IUser | null;
  addresses: Address[];
  overview: IAccountOverview | null;
  paymentMethods: ISavedPaymentMethod[];
  transactions: ITransactionItem[];
  buyAgain: IBuyAgainProduct[];
  returns: any[];
  availableCoupons: any[];
  loading: boolean;
  error: any;
  message: string | null;
}

export interface FetchUserResponse {
  error: boolean;
  success: boolean;
  message?: string;
  user: IUser;
}

