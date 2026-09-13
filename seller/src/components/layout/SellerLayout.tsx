import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Drawer } from "@mui/material";
import { SellerSidebar } from "./SellerSidebar";
import { SellerHeader } from "./SellerHeader";
import { GlobalSearchModal } from "../common/GlobalSearchModal";

export const SellerLayout: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("seller_sidebar_collapsed") === "true";
    }
    return false;
  });

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("seller_sidebar_collapsed", String(isCollapsed));
  }, [isCollapsed]);

  // Global Ctrl+K shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Desktop Persistent Sidebar */}
      <div className="hidden lg:block">
        <SellerSidebar
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
        />
      </div>

      {/* Mobile Drawer Sidebar */}
      <Drawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        sx={{ display: { xs: "block", lg: "none" } }}
      >
        <div className="w-64 h-full bg-sidebar">
          <SellerSidebar
            isCollapsed={false}
            onToggleCollapse={() => setMobileOpen(false)}
          />
        </div>
      </Drawer>

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col main-content-smooth ${
          isCollapsed ? "lg:pl-18" : "lg:pl-64"
        }`}
      >
        <SellerHeader
          onOpenMobileNav={() => setMobileOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Global Command Palette */}
      <GlobalSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </div>
  );
};
