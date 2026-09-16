import React from "react";
import { Link, Outlet } from "react-router-dom";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { useAppSelector } from "../../Redux Toolkit/Store";

interface RoleRouteProps {
  allowedRoles: string[];
  children?: React.ReactNode;
}

export const RoleRoute: React.FC<RoleRouteProps> = ({ allowedRoles, children }) => {
  const { auth, user } = useAppSelector((store) => store);
  const currentRole =
    auth.role ||
    (typeof window !== "undefined" ? localStorage.getItem("role") : null) ||
    user.user?.role ||
    "ROLE_CUSTOMER";

  const isAllowed = allowedRoles.includes(currentRole);

  if (!isAllowed) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4 bg-background text-foreground">
        <div className="max-w-md w-full text-center bg-card border border-border/80 rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold tracking-tight mb-2">Access Restricted</h2>
          <p className="text-sm text-muted-foreground mb-6">
            You do not have the required permissions to view this section. Please sign in with an authorized account or return to the storefront.
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Storefront</span>
          </Link>
        </div>
      </div>
    );
  }

  return children ? <>{children}</> : <Outlet />;
};

export default RoleRoute;
