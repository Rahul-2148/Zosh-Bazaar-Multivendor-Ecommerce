import React, { createContext, useContext, useEffect, useState } from "react";
import { partnerApi, DeliveryPartnerProfile } from "../api/partnerApi";

interface PartnerAuthContextType {
  token: string | null;
  partner: DeliveryPartnerProfile | null;
  loading: boolean;
  login: (identifier: string, secret?: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  updateShift: (action: "START_SHIFT" | "END_SHIFT" | "TOGGLE_BREAK") => Promise<void>;
}

const PartnerAuthContext = createContext<PartnerAuthContextType | undefined>(undefined);

export const PartnerAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("zb_partner_token"));
  const [partner, setPartner] = useState<DeliveryPartnerProfile | null>(() => {
    const cached = localStorage.getItem("zb_partner_agent");
    return cached ? JSON.parse(cached) : null;
  });
  const [loading, setLoading] = useState<boolean>(true);

  const refreshProfile = async () => {
    try {
      if (!localStorage.getItem("zb_partner_token")) return;
      const data = await partnerApi.getProfile();
      setPartner(data);
      localStorage.setItem("zb_partner_agent", JSON.stringify(data));
    } catch {
      // If token expired, clear
      setPartner(null);
      setToken(null);
      localStorage.removeItem("zb_partner_token");
      localStorage.removeItem("zb_partner_agent");
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem("zb_partner_token");
      if (savedToken) {
        setToken(savedToken);
        await refreshProfile();
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (identifier: string, secret: string = "") => {
    const res = await partnerApi.login(identifier, secret);
    if (res.success && res.data?.token) {
      setToken(res.data.token);
      setPartner(res.data.agent);
      localStorage.setItem("zb_partner_token", res.data.token);
      localStorage.setItem("zb_partner_agent", JSON.stringify(res.data.agent));
    } else {
      throw new Error(res.message || "Authentication failed");
    }
  };

  const logout = () => {
    setToken(null);
    setPartner(null);
    localStorage.removeItem("zb_partner_token");
    localStorage.removeItem("zb_partner_agent");
  };

  const updateShift = async (action: "START_SHIFT" | "END_SHIFT" | "TOGGLE_BREAK") => {
    const updated = await partnerApi.updateShift(action);
    setPartner(updated);
    localStorage.setItem("zb_partner_agent", JSON.stringify(updated));
  };

  return (
    <PartnerAuthContext.Provider
      value={{
        token,
        partner,
        loading,
        login,
        logout,
        refreshProfile,
        updateShift,
      }}
    >
      {children}
    </PartnerAuthContext.Provider>
  );
};

export const usePartnerAuth = () => {
  const context = useContext(PartnerAuthContext);
  if (!context) throw new Error("usePartnerAuth must be used within PartnerAuthProvider");
  return context;
};
