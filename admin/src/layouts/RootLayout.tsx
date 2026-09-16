import React, { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { ThemeProvider } from "../context/ThemeContext";
import { AdminAuthProvider } from "../context/AdminAuthContext";
import { LoadingSpinner } from "../components/common/LoadingSpinner";

export const RootLayout: React.FC = () => {
  return (
    <ThemeProvider>
      <AdminAuthProvider>
        <Suspense
          fallback={
            <div className="min-h-[70vh] flex items-center justify-center">
              <LoadingSpinner message="Loading operations module..." />
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </AdminAuthProvider>
    </ThemeProvider>
  );
};

export default RootLayout;
