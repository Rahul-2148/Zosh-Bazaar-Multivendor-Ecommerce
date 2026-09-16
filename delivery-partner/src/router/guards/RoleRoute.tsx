import React from "react";
import { Link, Outlet } from "react-router-dom";
import { usePartnerAuth } from "../../context/PartnerAuthContext";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";

interface RoleRouteProps {
  allowedRoles?: string[];
  children?: React.ReactNode;
}

export const RoleRoute: React.FC<RoleRouteProps> = ({
  allowedRoles = ["DELIVERY_PARTNER", "ROLE_DELIVERY_PARTNER", "PARTNER"],
  children,
}) => {
  const { partner } = usePartnerAuth();

  const userRole = (partner as any)?.role || "DELIVERY_PARTNER";
  const hasAccess = allowedRoles.length === 0 || allowedRoles.includes(userRole);

  if (!hasAccess) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-card border border-destructive/30 rounded-3xl p-6 text-center shadow-lg space-y-4">
          <div className="w-14 h-14 bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-black tracking-tight text-foreground">
              Access Restricted
            </h2>
            <p className="text-xs text-muted-foreground">
              Your partner account does not have permission to view this stop or route action.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => window.history.back()}
              className="w-full py-2.5 rounded-xl border border-border text-xs font-bold hover:bg-muted transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
            <Link
              to="/"
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              Return to Shift Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children ? <>{children}</> : <Outlet />;
};

export default RoleRoute;
