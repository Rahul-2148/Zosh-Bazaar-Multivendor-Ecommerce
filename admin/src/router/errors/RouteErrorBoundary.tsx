import React from "react";
import {
  useRouteError,
  isRouteErrorResponse,
  useNavigate,
  Link,
} from "react-router-dom";
import {
  WarningAmberOutlined,
  Refresh,
  HomeOutlined,
  ArrowBack,
} from "@mui/icons-material";

export const RouteErrorBoundary: React.FC = () => {
  const error = useRouteError();
  const navigate = useNavigate();

  let title = "Operations Module Error";
  let message =
    "An unexpected error occurred within the administration portal. Please retry or return to the control center.";
  let status = 500;

  if (isRouteErrorResponse(error)) {
    status = error.status;
    if (error.status === 404) {
      title = "Management Route Not Found";
      message =
        "The administration screen or operational view requested could not be located.";
    } else if (error.status === 401 || error.status === 403) {
      title = "Administrator Clearance Required";
      message =
        "You lack administrative privileges to access this operational subsystem.";
    } else {
      message = error.statusText || error.data?.message || message;
    }
  } else if (error instanceof Error) {
    message = error.message || message;
  }

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4 bg-background text-foreground">
      <div className="max-w-md w-full text-center bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
          <WarningAmberOutlined sx={{ fontSize: 30 }} />
        </div>

        <div className="inline-block px-2.5 py-0.5 mb-2 rounded-full text-xs font-mono font-semibold bg-muted text-muted-foreground">
          HTTP {status}
        </div>

        <h1 className="text-xl font-bold tracking-tight mb-2">{title}</h1>
        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          {message}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-card text-foreground text-xs font-semibold hover:bg-muted transition-colors cursor-pointer"
          >
            <ArrowBack sx={{ fontSize: 16 }} />
            <span>Go Back</span>
          </button>

          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-card text-foreground text-xs font-semibold hover:bg-muted transition-colors cursor-pointer"
          >
            <Refresh sx={{ fontSize: 16 }} />
            <span>Reload</span>
          </button>

          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all cursor-pointer shadow-xs"
          >
            <HomeOutlined sx={{ fontSize: 16 }} />
            <span>Admin Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RouteErrorBoundary;
