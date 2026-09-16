import React from "react";
import { Navigate, useLocation, Outlet } from "react-router-dom";
import { usePartnerAuth } from "../../context/PartnerAuthContext";

interface GuestRouteProps {
  children?: React.ReactNode;
}

export const GuestRoute: React.FC<GuestRouteProps> = ({ children }) => {
  const { token, loading } = usePartnerAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-card text-foreground">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (token) {
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/";
    return <Navigate to={from} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default GuestRoute;
