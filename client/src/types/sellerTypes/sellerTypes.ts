// client/src/types/sellerTypes/sellerTypes.ts
import type { Address } from "../addressTypes";
import type { SellerReport } from "./sellerReportTypes";

export interface Seller {
  _id: string;
  sellerName: string;
  mobile: number | string;
  GSTIN: string;
  email: string;
  password: string;
  role: string;
  accountStatus: string;
  isEmailVerified: boolean;
  pickupAddress: Address;
  businessDetails: {
    businessName: string;
    businessPan: string;
    businessLogo: string;
    banner: string;
  };
  bankDetails: {
    accountNumber: string;
    accountHolderName: string;
    bankName: string;
    ifscCode: string;
    accountBranch: string;
    accountHolderEmail: string;
  };
  createdAt: Date;
  updatedAt: Date;
  __v?: number;
}

// 🔹 Redux Slice State
export interface SellerState {
  sellers: Seller[];
  selectedSeller: Seller | null;
  profile: Seller | null; // logged-in seller ka profile
  loading: boolean;
  error: string | null;
  report: SellerReport | null; // imported from sellerReportTypes
  profileUpdated: boolean;
  message: string | null;
}

// 🔹 API Response Types
export interface FetchSellerProfileResponse {
  seller: Seller;
  message: string;
  error: boolean;
  success: boolean;
}

export interface GetAllSellersResponse {
  sellers: Seller[];
  message: string;
  error: boolean;
  success: boolean;
}

export interface FetchSellerReportResponse {
  report: SellerReport;
  message: string;
  error: boolean;
  success: boolean;
}

export interface FetchSellerByIdResponse {
  seller: Seller;
  message: string;
  error: boolean;
  success: boolean;
}

export interface UpdateSellerResponse {
  seller: Seller;
  message: string;
  error: boolean;
  success: boolean;
}

export interface DeleteSellerResponse {
  seller: Seller;
  message: string;
  error: boolean;
  success: boolean;
}

// 🔹 Error type for rejectValue
export interface ErrorResponse {
  message: string;
}
