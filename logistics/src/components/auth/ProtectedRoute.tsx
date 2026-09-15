import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useLogisticsAuth } from "../../context/LogisticsAuthContext";
import { CircularProgress } from "@mui/material";

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useLogisticsAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <CircularProgress size={32} className="text-primary" />
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
          Validating Security Clearance...
        </span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? <>{children}</> : null;
};
