import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSellerAuth } from "../../context/SellerAuthContext";
import { CircularProgress } from "@mui/material";

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useSellerAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <CircularProgress size={32} />
          <span className="text-xs text-muted-foreground font-medium">Verifying merchant session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
