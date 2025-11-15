// client/src/types/adminTypes/adminTypes.ts

import type { Seller } from "../sellerTypes/sellerTypes";

export interface AdminState {
  sellers: Seller[];
  selectedSeller: Seller | null;
  profile: any | null; // agar future me admin profile aayegi
  report: any | null;  // agar report feature add karna hai
  profileUpdated: boolean;
  loading: boolean;
  error: string | null;
  message: string | null;
}

// Response for updating seller account status
export interface UpdateSellerAccountStatusResponse {
  seller: Seller;
  message: string;
  error: boolean;
  success: boolean;
}

export interface ErrorResponse {
  message: string;
}

