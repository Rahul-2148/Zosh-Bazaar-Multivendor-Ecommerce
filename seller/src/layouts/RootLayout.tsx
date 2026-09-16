import React, { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { ThemeProvider } from "../context/ThemeContext";
import { SellerAuthProvider } from "../context/SellerAuthContext";
import { SocketProvider } from "../context/SocketContext";
import { CircularProgress } from "@mui/material";

export const RootLayout: React.FC = () => {
  return (
    <ThemeProvider>
      <SellerAuthProvider>
        <SocketProvider>
          <Suspense
            fallback={
              <div className="min-h-[70vh] flex items-center justify-center bg-background">
                <CircularProgress size={32} />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </SocketProvider>
      </SellerAuthProvider>
    </ThemeProvider>
  );
};

export default RootLayout;
