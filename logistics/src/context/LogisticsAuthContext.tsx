import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authApi } from "../services/api";

export interface OperatorProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  hubCode?: string;
  city?: string;
  mobile?: string;
}

interface LogisticsAuthContextType {
  operator: OperatorProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  loginWithOtp: (email: string, otp: string) => Promise<{ success: boolean; message?: string }>;
  sendLoginOtp: (email: string) => Promise<{ success: boolean; message?: string; cooldownSeconds?: number }>;
  loginWithToken: (token: string, profile: OperatorProfile) => void;
  logout: () => void;
}

const LogisticsAuthContext = createContext<LogisticsAuthContextType | undefined>(undefined);

const LOGISTICS_ROLES = [
  "ROLE_ADMIN",
  "ROLE_SUPER_ADMIN",
  "ADMIN",
  "SUPER_ADMIN",
  "LOGISTICS_OPERATOR",
  "ROLE_LOGISTICS_OPERATOR",
];

export const LogisticsAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return (
        localStorage.getItem("logistics_jwt") ||
        localStorage.getItem("admin_jwt") ||
        null
      );
    }
    return null;
  });

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
    }
    return null;
  });

  const [loading, setLoading] = useState<boolean>(true);

  const logout = useCallback(() => {
    localStorage.removeItem("logistics_jwt");
    localStorage.removeItem("logistics_operator");
    setToken(null);
    setOperator(null);
  }, []);

  const loginWithToken = useCallback((newToken: string, profile: OperatorProfile) => {
    localStorage.setItem("logistics_jwt", newToken);
    localStorage.setItem("logistics_operator", JSON.stringify(profile));
    setToken(newToken);
    setOperator(profile);
  }, []);

  // Sync token verification on initial mount
  useEffect(() => {
    let ignore = false;

    const verifySession = async () => {
      const activeToken =
        localStorage.getItem("logistics_jwt") ||
        localStorage.getItem("admin_jwt");

      if (!activeToken) {
        if (!ignore) {
          setLoading(false);
          setOperator(null);
          setToken(null);
        }
        return;
      }

      try {
        const res = await authApi.getProfile();
        const user = res.data?.user || res.data;

        if (user && LOGISTICS_ROLES.includes(user.role)) {
          const profile: OperatorProfile = {
            id: user._id || user.id || "OP-01",
            name: user.fullName || user.name || "Logistics Operator",
            email: user.email,
            role: user.role,
            city: user.city || "Bengaluru Hub",
            mobile: user.mobile,
          };
          if (!ignore) {
            loginWithToken(activeToken, profile);
          }
        } else if (user && !LOGISTICS_ROLES.includes(user.role)) {
          console.warn("[Logistics Auth] Insufficient role permissions for user:", user.role);
          if (!ignore) logout();
        }
      } catch (err: any) {
        const status = err.response?.status;
        if (status === 401 || status === 403) {
          if (!ignore) logout();
        } else {
          // Network issue or backend offline: keep cached operator session in dev
          console.warn("[Logistics Auth] Could not reach backend, retaining cached profile");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    verifySession();

    // Listen for unauthorized events emitted by the axios response interceptor
    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener("logistics:unauthorized", handleUnauthorized);

    return () => {
      ignore = true;
      window.removeEventListener("logistics:unauthorized", handleUnauthorized);
    };
  }, [loginWithToken, logout]);

  const sendLoginOtp = async (email: string) => {
    try {
      const res = await authApi.sendLoginOtp(email);
      return {
        success: true,
        message: res.data?.message || "OTP code sent to email.",
        cooldownSeconds: res.data?.cooldownSeconds || 60,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.response?.data?.message || err.message || "Failed to dispatch login OTP.",
      };
    }
  };

  const loginWithOtp = async (email: string, otp: string) => {
    try {
      const res = await authApi.signin({ email, otp });
      const { jwt, role } = res.data || {};

      if (!jwt) {
        return { success: false, message: "No session token returned by server." };
      }

      if (!LOGISTICS_ROLES.includes(role)) {
        return {
          success: false,
          message: `Access denied. Role "${role}" does not have Logistics Operations clearance.`,
        };
      }

      const profile: OperatorProfile = {
        id: `OP-${Date.now()}`,
        name: email.split("@")[0].toUpperCase(),
        email,
        role,
        city: "Bengaluru Control Tower",
      };

      loginWithToken(jwt, profile);
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        message: err.response?.data?.message || err.message || "Invalid or expired OTP code.",
      };
    }
  };

  return (
    <LogisticsAuthContext.Provider
      value={{
        operator,
        token,
        isAuthenticated: Boolean(token && operator),
        loading,
        loginWithOtp,
        sendLoginOtp,
        loginWithToken,
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
