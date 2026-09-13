import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { LogisticsSidebar } from "./LogisticsSidebar";
import { LogisticsHeader } from "./LogisticsHeader";
import { GlobalSearchModal } from "../common/GlobalSearchModal";

export const LogisticsLayout: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("logistics_sidebar_collapsed") === "true";
    }
    return false;
  });
  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("logistics_sidebar_collapsed", String(next));
      return next;
    });
  };

  // Keyboard shortcut listeners (Ctrl+B, Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleCollapse();
      }
      if (e.key === "Escape") {
        setIsSearchOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col antialiased">
      {/* Sidebar */}
      <LogisticsSidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleCollapse}
        isOpenMobile={isOpenMobile}
        onCloseMobile={() => setIsOpenMobile(false)}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isCollapsed ? "lg:pl-18" : "lg:pl-64"
        }`}
      >
        <LogisticsHeader
          onToggleMobileSidebar={() => setIsOpenMobile((prev) => !prev)}
          onOpenSearch={() => setIsSearchOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 max-w-[1720px] w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Global Search Command Palette */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </div>
  );
};
