import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useSellerAuth } from "../../context/SellerAuthContext";
import { CircularProgress } from "@mui/material";

interface GuestRouteProps {
  children?: React.ReactNode;
}

export const GuestRoute: React.FC<GuestRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useSellerAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <CircularProgress size={32} />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default GuestRoute;
