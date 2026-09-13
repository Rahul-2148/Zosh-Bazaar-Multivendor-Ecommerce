import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authApi } from "../services/api";

export interface SellerBusinessDetails {
  businessName?: string;
  businessPan?: string;
  businessLogo?: string;
  banner?: string;
}

export interface SellerBankDetails {
  accountNumber?: string;
  accountHolderName?: string;
  bankName?: string;
  ifscCode?: string;
  accountBranch?: string;
  accountHolderEmail?: string;
}

export interface SellerPickupAddress {
  _id?: string;
  name?: string;
  locality?: string;
  address?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  mobile?: string;
}

export interface SellerProfile {
  _id: string;
  sellerName: string;
  email: string;
  mobile: number | string;
  GSTIN: string;
  role: string;
  accountStatus: "PENDING_VERIFICATION" | "ACTIVE" | "SUSPENDED" | "DEACTIVATED" | "BANNED" | "CLOSED";
  isEmailVerified: boolean;
  businessDetails?: SellerBusinessDetails;
  bankDetails?: SellerBankDetails;
  pickupAddress?: SellerPickupAddress;
  createdAt?: string;
  updatedAt?: string;
}

export interface SellerAuthContextType {
  seller: SellerProfile | null;
  jwt: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  sendOtp: (email: string, mode?: "signup" | "login") => Promise<{ message: string; otpSent: boolean }>;
  loginWithOtp: (email: string, otp: string) => Promise<SellerProfile>;
  registerSeller: (data: any) => Promise<any>;
  updateProfile: (data: Partial<SellerProfile>) => Promise<SellerProfile>;
  refreshProfile: () => Promise<void>;
  logout: () => void;
}

const SellerAuthContext = createContext<SellerAuthContextType | undefined>(undefined);

export const SellerAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [jwt, setJwt] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("seller_jwt") || localStorage.getItem("jwt");
    }
    return null;
  });

  const [seller, setSeller] = useState<SellerProfile | null>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("seller_info");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return null;
        }
      }
    }
    return null;
  });

  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfile = useCallback(async (tokenToUse?: string) => {
    const activeToken = tokenToUse || localStorage.getItem("seller_jwt") || localStorage.getItem("jwt");
    if (!activeToken) {
      setSeller(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await authApi.getProfile();
      if (res.data?.seller) {
        setSeller(res.data.seller);
        localStorage.setItem("seller_info", JSON.stringify(res.data.seller));
      }
    } catch (err) {
      console.warn("Could not fetch seller profile:", err);
      // If profile fails and unauthorized, cleanup
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();

    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener("seller:unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("seller:unauthorized", handleUnauthorized);
    };
  }, [fetchProfile]);

  const sendOtp = async (email: string, mode: "signup" | "login" = "login") => {
    const res = await authApi.sendLoginOtp(email, mode);
    return res.data;
  };

  const loginWithOtp = async (email: string, otp: string): Promise<SellerProfile> => {
    const res = await authApi.verifyLoginOtp(email, otp);
    const token = res.data.jwt;
    const sellerData = res.data.seller;

    localStorage.setItem("seller_jwt", token);
    localStorage.setItem("role", "ROLE_SELLER");
    localStorage.setItem("seller_info", JSON.stringify(sellerData));

    setJwt(token);
    setSeller(sellerData);
    return sellerData;
  };

  const registerSeller = async (data: any) => {
    const res = await authApi.createSeller(data);
    return res.data;
  };

  const updateProfile = async (data: Partial<SellerProfile>): Promise<SellerProfile> => {
    const res = await authApi.updateProfile(data);
    const updated = res.data.seller;
    setSeller(updated);
    localStorage.setItem("seller_info", JSON.stringify(updated));
    return updated;
  };

  const refreshProfile = async () => {
    await fetchProfile();
  };

  const logout = () => {
    localStorage.removeItem("seller_jwt");
    localStorage.removeItem("seller_info");
    setJwt(null);
    setSeller(null);
    window.location.href = "/login";
  };

  return (
    <SellerAuthContext.Provider
      value={{
        seller,
        jwt,
        loading,
        isAuthenticated: Boolean(jwt && seller),
        sendOtp,
        loginWithOtp,
        registerSeller,
        updateProfile,
        refreshProfile,
        logout,
      }}
    >
      {children}
    </SellerAuthContext.Provider>
  );
};

export const useSellerAuth = () => {
  const context = useContext(SellerAuthContext);
  if (!context) {
    throw new Error("useSellerAuth must be used within a SellerAuthProvider");
  }
  return context;
};
