import React from "react";
import { useRouteError, isRouteErrorResponse, Link, useNavigate } from "react-router-dom";
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from "lucide-react";

export const RouteErrorBoundary: React.FC = () => {
  const error = useRouteError();
  const navigate = useNavigate();

  let title = "Telemetry Exception";
  let message = "An unexpected error occurred in the logistics operations control unit.";
  let statusCode: number | string = 500;

  const isDynamicChunkError = React.useMemo(() => {
    const raw = String(
      (error as any)?.message ||
      (error as any)?.statusText ||
      (error as any)?.data?.message ||
      error ||
      ""
    ).toLowerCase();

    return (
      raw.includes("failed to fetch dynamically imported module") ||
      raw.includes("importing a module script failed") ||
      raw.includes("error loading dynamically imported module") ||
      raw.includes("dynamically imported module") ||
      (error as any)?.name === "ChunkLoadError"
    );
  }, [error]);

  React.useEffect(() => {
    if (isDynamicChunkError && typeof window !== "undefined") {
      const storageKey = `zosh_logistics_boundary_${window.location.pathname}`;
      const hasReloaded = sessionStorage.getItem(storageKey);
      if (!hasReloaded) {
        sessionStorage.setItem(storageKey, "true");
        window.location.reload();
      }
    }
  }, [isDynamicChunkError]);

  if (isRouteErrorResponse(error)) {
    statusCode = error.status;
    if (error.status === 404) {
      title = "Station / Resource Not Found";
      message = "The requested route, package manifest, or operational station does not exist or has been relocated.";
    } else if (error.status === 401) {
      title = "Clearance Expired";
      message = "Your active terminal session has expired. Please authenticate to resume monitoring.";
    } else if (error.status === 403) {
      title = "Access Restricted";
      message = "You do not hold sufficient clearance for this logistics control station.";
    } else {
      title = error.statusText || "Operational Route Fault";
      message = typeof error.data === "string" ? error.data : error.data?.message || message;
    }
  } else if (isDynamicChunkError) {
    title = "Logistics Terminal Update Available";
    message = "A newer version of the logistics control board has been deployed. Reloading to get the latest telemetry...";
    statusCode = 200;
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6 antialiased">
      <div className="max-w-lg w-full bg-card border border-border rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              ERROR CODE {statusCode}
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-muted/50 border border-border text-xs font-mono text-muted-foreground break-words leading-relaxed">
          {message}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous View
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex-1 px-4 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Reload Unit
          </button>
          <Link
            to="/"
            className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 text-center"
          >
            <Home className="w-4 h-4" />
            Overview
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RouteErrorBoundary;
