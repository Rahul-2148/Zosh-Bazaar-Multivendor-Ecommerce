import React, { createContext, useContext, useState, useEffect } from "react";
import apiClient from "../api/apiClient";
import type { AdminUser } from "../types/adminTypes";

interface AdminAuthContextType {
  admin: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  loginWithOtp: (email: string, otp: string) => Promise<{ success: boolean; message?: string }>;
  sendLoginOtp: (email: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(
  undefined
);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [admin, setAdmin] = useState<AdminUser | null>(() => {
    const saved = localStorage.getItem("admin_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("admin_jwt")
  );
  const [loading, setLoading] = useState<boolean>(true);

  const logout = () => {
    localStorage.removeItem("admin_jwt");
    localStorage.removeItem("admin_user");
    setToken(null);
    setAdmin(null);
  };

  // Resilient token verification: ensure ROLE_ADMIN privileges without dropping session on reload
  useEffect(() => {
    let ignore = false;

    const verifyToken = async () => {
      const storedToken = localStorage.getItem("admin_jwt");
      if (!storedToken) {
        if (!ignore) setLoading(false);
        return;
      }

      try {
        const res = await apiClient.get<any>("/user/profile");
        const profile: AdminUser = res.data?.user || res.data;

        if (profile && profile.role === "ROLE_ADMIN") {
          if (!ignore) {
            setAdmin(profile);
            localStorage.setItem("admin_user", JSON.stringify(profile));
          }
        } else if (res.status === 401 || res.status === 403 || (profile && profile.role !== "ROLE_ADMIN")) {
          // Explicit unauthorized or wrong role
          if (!ignore) logout();
        }
      } catch (err: any) {
        // Only invalidate session on definitive 401/403 HTTP response
        if (err.response?.status === 401 || err.response?.status === 403) {
          if (!ignore) logout();
        } else {
          // Retain cached session during dev reloads or temporary server restarts
          console.warn(
            "Could not verify session with backend; retaining cached admin credentials."
          );
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    verifyToken();

    return () => {
      ignore = true;
    };
  }, [token]);

  const sendLoginOtp = async (email: string) => {
    try {
      const res = await apiClient.post("/auth/sent/login-signup-otp", {
        email,
        mode: "login",
        role: "ROLE_ADMIN",
      });
      return { success: true, message: res.data.message || "OTP sent to your email" };
    } catch (err: any) {
      return {
        success: false,
        message: err.response?.data?.message || "Failed to send OTP",
      };
    }
  };

  const loginWithOtp = async (email: string, otp: string) => {
    try {
      const res = await apiClient.post("/auth/signin", { email, otp });
      const jwtToken = res.data.jwt;

      if (!jwtToken) {
        return { success: false, message: "Authentication failed. No token received." };
      }

      // Verify if the logged-in user actually has ROLE_ADMIN
      const profileRes = await apiClient.get<any>("/user/profile", {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });

      const userProfile: AdminUser = profileRes.data.user || profileRes.data;

      if (userProfile.role !== "ROLE_ADMIN") {
        return {
          success: false,
          message: "Access Denied: You do not have administrator permissions.",
        };
      }

      localStorage.setItem("admin_jwt", jwtToken);
      localStorage.setItem("admin_user", JSON.stringify(userProfile));
      setToken(jwtToken);
      setAdmin(userProfile);

      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        message: err.response?.data?.message || "Invalid credentials or OTP.",
      };
    }
  };

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        token,
        isAuthenticated: !!token && admin?.role === "ROLE_ADMIN",
        loading,
        sendLoginOtp,
        loginWithOtp,
        logout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
};
