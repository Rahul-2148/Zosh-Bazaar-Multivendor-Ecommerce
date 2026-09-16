import React from "react";
import { useRouteError, isRouteErrorResponse, Link, useNavigate } from "react-router-dom";
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from "lucide-react";

export const RouteErrorBoundary: React.FC = () => {
  const error = useRouteError();
  const navigate = useNavigate();

  let title = "Delivery App Error";
  let message = "An unexpected error occurred while loading this stop or view.";
  let statusCode: number | string = 500;

  if (isRouteErrorResponse(error)) {
    statusCode = error.status;
    if (error.status === 404) {
      title = "Stop or Route Not Found";
      message = "The requested delivery stop, manifest, or package scan does not exist or has been completed.";
    } else if (error.status === 401) {
      title = "Shift Session Expired";
      message = "Your driver session has expired. Please sign in to resume deliveries.";
    } else if (error.status === 403) {
      title = "Access Restricted";
      message = "You are not assigned to this delivery route or stop.";
    } else {
      title = error.statusText || "Route Error";
      message = typeof error.data === "string" ? error.data : error.data?.message || message;
    }
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-card border border-border rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              ERROR {statusCode}
            </div>
            <h1 className="text-lg font-bold tracking-tight text-foreground">
              {title}
            </h1>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-muted/60 border border-border text-xs font-mono text-muted-foreground break-words">
          {message}
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <button
            onClick={() => navigate(-1)}
            className="w-full py-2.5 rounded-xl border border-border text-xs font-bold hover:bg-muted transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous Screen
          </button>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-2.5 rounded-xl bg-secondary text-secondary-foreground text-xs font-bold hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Reload Stop
          </button>
          <Link
            to="/"
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Shift Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RouteErrorBoundary;
