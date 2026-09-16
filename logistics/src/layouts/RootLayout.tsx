import React, { Suspense, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { CircularProgress } from "@mui/material";

export const RootLayout: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
          <CircularProgress size={32} className="text-primary" />
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
            Loading Station Module...
          </span>
        </div>
      }
    >
      <Outlet />
    </Suspense>
  );
};

export default RootLayout;
