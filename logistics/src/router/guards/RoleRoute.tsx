import React from "react";
import { Link, Outlet } from "react-router-dom";
import { useLogisticsAuth } from "../../context/LogisticsAuthContext";
import { ShieldAlert, ArrowLeft, Terminal } from "lucide-react";

interface RoleRouteProps {
  allowedRoles?: string[];
  children?: React.ReactNode;
}

export const RoleRoute: React.FC<RoleRouteProps> = ({
  allowedRoles = [
    "ROLE_ADMIN",
    "ROLE_SUPER_ADMIN",
    "ADMIN",
    "SUPER_ADMIN",
    "LOGISTICS_OPERATOR",
    "ROLE_LOGISTICS_OPERATOR",
  ],
  children,
}) => {
  const { operator } = useLogisticsAuth();

  const userRole = operator?.role || "";
  const hasAccess = allowedRoles.includes(userRole);

  if (!hasAccess) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-card border border-destructive/30 rounded-2xl p-8 text-center shadow-xl space-y-6">
          <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center mx-auto ring-8 ring-destructive/5">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-destructive/10 text-destructive">
              <Terminal className="w-3.5 h-3.5" />
              SECURITY PROTOCOL ENFORCED
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Clearance Level 403
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your credentials (<code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded text-foreground">{userRole || "UNKNOWN"}</code>) do not carry authorization for this logistics control station.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Return
            </button>
            <Link
              to="/"
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors inline-flex items-center justify-center"
            >
              Control Tower Overview
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children ? <>{children}</> : <Outlet />;
};

export default RoleRoute;
