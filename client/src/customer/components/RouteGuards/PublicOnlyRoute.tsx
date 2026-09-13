import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAppSelector } from "../../../Redux Toolkit/Store";

interface PublicOnlyRouteProps {
  children?: React.ReactNode;
}

export const PublicOnlyRoute: React.FC<PublicOnlyRouteProps> = ({ children }) => {
  const location = useLocation();
  const { auth, user } = useAppSelector((store) => store);
  const storedToken =
    typeof window !== "undefined" ? localStorage.getItem("jwt") : null;
  const token = auth.jwt || storedToken;

  // Only redirect away from login/signup if the user is truly verified with active session
  if (token && token !== "undefined" && token !== "null" && user.user) {
    const role =
      auth.role ||
      (typeof window !== "undefined" ? localStorage.getItem("role") : null);

    if (role === "ROLE_SELLER") {
      return <Navigate to="/seller" replace />;
    }

    const from = (location.state as any)?.from?.pathname || "/";
    return <Navigate to={from} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default PublicOnlyRoute;
