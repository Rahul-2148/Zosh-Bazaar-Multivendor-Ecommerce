import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { PartnerHeader } from "./PartnerHeader";
import { BottomNavBar } from "./BottomNavBar";
import { NetworkStatusBar } from "../common/NetworkStatusBar";
import { usePartnerAuth } from "../../context/PartnerAuthContext";

export const MobileAppShell: React.FC = () => {
  const { token } = usePartnerAuth();
  const location = useLocation();

  const isAuthPage = location.pathname === "/login";
  const isActiveStopPage = location.pathname.startsWith("/stop/");

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20">
      <NetworkStatusBar />

      {!isAuthPage && token && <PartnerHeader />}

      <main
        className={`flex-1 w-full flex flex-col ${
          !isActiveStopPage ? "pb-20 md:pb-8" : ""
        }`}
      >
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6 flex-1 flex flex-col">
          <Outlet />
        </div>
      </main>

      {!isAuthPage && token && !isActiveStopPage && <BottomNavBar />}
    </div>
  );
};
