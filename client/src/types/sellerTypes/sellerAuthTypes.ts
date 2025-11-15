// client/src/types/sellerTypes/sellerAuthTypes.ts
import type { Seller } from "./sellerTypes";

// Redux Slice State
export interface sellerAuthState {
  jwt: string | null;
  role: string | null;
  otpSent: boolean;
  loading: boolean;
  error: string | null;
  message: string | null;
}

// API Response Types
export interface OtpResponse {
  error: boolean;
  success: boolean;
  message: string;
  otpSent: boolean;
}

export interface VerifyOtpResponse {
  error: boolean;
  success: boolean;
  message: string;
  jwt: string;
  role: string;
  seller: Seller;
}

export interface CreateSellerResponse {
  error: boolean;
  success: boolean;
  message?: string;
  seller: Seller;
  jwt: string;
  role: string;
}

// 🔹 Create Seller Request type
export type CreateSellerRequest = Omit<
  Seller,
  | "_id"
  | "createdAt"
  | "updatedAt"
  | "__v"
>;
