import React, { Suspense, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { ThemeProvider } from "../context/ThemeContext";
import { PartnerAuthProvider } from "../context/PartnerAuthContext";
import { ActiveRouteProvider } from "../context/ActiveRouteContext";
import { PartnerSocketProvider } from "../context/PartnerSocketContext";

export const RootLayout: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <ThemeProvider>
      <PartnerAuthProvider>
        <ActiveRouteProvider>
          <PartnerSocketProvider>
            <Suspense
              fallback={
                <div className="min-h-screen flex items-center justify-center bg-card text-foreground">
                  <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                </div>
              }
            >
              <Outlet />
            </Suspense>
          </PartnerSocketProvider>
        </ActiveRouteProvider>
      </PartnerAuthProvider>
    </ThemeProvider>
  );
};

export default RootLayout;
