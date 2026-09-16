import React from "react";
import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useLogisticsAuth } from "../../context/LogisticsAuthContext";
import { CircularProgress } from "@mui/material";

interface GuestRouteProps {
  children?: React.ReactNode;
}

export const GuestRoute: React.FC<GuestRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useLogisticsAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <CircularProgress size={32} className="text-primary" />
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
          Initializing Logistics Terminal...
        </span>
      </div>
    );
  }

  if (isAuthenticated) {
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/";
    return <Navigate to={from} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default GuestRoute;
