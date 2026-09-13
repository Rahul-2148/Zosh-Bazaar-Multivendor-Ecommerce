import React, { createContext, useContext, useState } from "react";

export interface OperatorProfile {
  id: string;
  name: string;
  email: string;
  role: "LOGISTICS_ADMIN" | "OPERATIONS_MANAGER" | "DISPATCHER" | "SUPER_ADMIN";
  hubCode?: string;
  city?: string;
}

interface LogisticsAuthContextType {
  operator: OperatorProfile | null;
  isAuthenticated: boolean;
  login: (token: string, profile: OperatorProfile) => void;
  logout: () => void;
}

const LogisticsAuthContext = createContext<LogisticsAuthContextType | undefined>(undefined);

export const LogisticsAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [operator, setOperator] = useState<OperatorProfile | null>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("logistics_operator");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return null;
        }
      }
      // If admin is logged in on platform, auto-grant Logistics Admin
      const adminToken = localStorage.getItem("admin_jwt") || localStorage.getItem("jwt");
      if (adminToken) {
        return {
          id: "ADMIN-OP-01",
          name: "Operations Commander",
          email: "operations@zoshbazaar.com",
          role: "LOGISTICS_ADMIN",
          city: "Bengaluru",
        };
      }
    }
    return {
      id: "OP-CONTROL-01",
      name: "Duty Controller",
      email: "ops.tower@zoshbazaar.com",
      role: "LOGISTICS_ADMIN",
      city: "Bengaluru",
    };
  });

  const login = (token: string, profile: OperatorProfile) => {
    localStorage.setItem("logistics_jwt", token);
    localStorage.setItem("logistics_operator", JSON.stringify(profile));
    setOperator(profile);
  };

  const logout = () => {
    localStorage.removeItem("logistics_jwt");
    localStorage.removeItem("logistics_operator");
    setOperator(null);
  };

  return (
    <LogisticsAuthContext.Provider
      value={{
        operator,
        isAuthenticated: Boolean(operator),
        login,
        logout,
      }}
    >
      {children}
    </LogisticsAuthContext.Provider>
  );
};

export const useLogisticsAuth = () => {
  const context = useContext(LogisticsAuthContext);
  if (!context) {
    throw new Error("useLogisticsAuth must be used within LogisticsAuthProvider");
  }
  return context;
};
