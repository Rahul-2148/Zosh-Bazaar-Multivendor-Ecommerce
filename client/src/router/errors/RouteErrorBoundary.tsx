import React from "react";
import {
  useRouteError,
  isRouteErrorResponse,
  useNavigate,
  Link,
} from "react-router-dom";
import { AlertTriangle, Home, RefreshCw, ArrowLeft } from "lucide-react";

export const RouteErrorBoundary: React.FC = () => {
  const error = useRouteError();
  const navigate = useNavigate();

  let title = "Unexpected Application Error";
  let message =
    "An unexpected error occurred while processing this route. Please try refreshing or return to the home page.";
  let status = 500;

  if (isRouteErrorResponse(error)) {
    status = error.status;
    if (error.status === 404) {
      title = "Page Not Found";
      message =
        "The page or resource you are looking for does not exist, has been removed, or is temporarily unavailable.";
    } else if (error.status === 401) {
      title = "Authentication Required";
      message = "You need to be signed in to access this page.";
    } else if (error.status === 403) {
      title = "Access Forbidden";
      message = "You do not have permission to view this resource.";
    } else {
      message = error.statusText || error.data?.message || message;
    }
  } else if (error instanceof Error) {
    // In production, avoid leaking raw stack trace to UI
    message = error.message || message;
  }

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4 bg-background text-foreground">
      <div className="max-w-lg w-full text-center bg-card border border-border/80 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div className="inline-block px-2.5 py-0.5 mb-2 rounded-full text-xs font-mono font-semibold bg-muted text-muted-foreground">
          Error {status}
        </div>

        <h1 className="text-xl sm:text-2xl font-bold tracking-tight mb-2">
          {title}
        </h1>

        <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-md mx-auto">
          {message}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border bg-card text-foreground text-xs font-semibold hover:bg-muted transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Go Back</span>
          </button>

          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border bg-card text-foreground text-xs font-semibold hover:bg-muted transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>

          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all cursor-pointer shadow-xs"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Storefront Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RouteErrorBoundary;
