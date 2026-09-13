import React, { useState, useRef, useEffect } from "react";
import {
  MenuOutlined,
  Search,
  NotificationsNoneOutlined,
  LightModeOutlined,
  DarkModeOutlined,
  DesktopWindowsOutlined,
  Check,
} from "@mui/icons-material";
import { useTheme } from "../../context/ThemeContext";
import { useLogisticsSocket } from "../../context/LogisticsSocketContext";
import { useLogisticsAuth } from "../../context/LogisticsAuthContext";
import dayjs from "dayjs";

interface LogisticsHeaderProps {
  onToggleMobileSidebar: () => void;
  onOpenSearch: () => void;
}

export const LogisticsHeader: React.FC<LogisticsHeaderProps> = ({
  onToggleMobileSidebar,
  onOpenSearch,
}) => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { connected, alerts, unreadCount, markAllAsRead } = useLogisticsSocket();
  const { operator } = useLogisticsAuth();

  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);

  const themeRef = useRef<HTMLDivElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) {
        setIsThemeOpen(false);
      }
      if (alertRef.current && !alertRef.current.contains(e.target as Node)) {
        setIsAlertsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="h-16 border-b border-border bg-card/85 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between transition-colors">
      {/* Left: Mobile Toggle & Global Search */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
        >
          <MenuOutlined fontSize="small" />
        </button>

        {/* Global Search Trigger */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-surface hover:bg-surface-hover border border-border text-muted-foreground hover:text-foreground text-xs font-medium transition-all group w-48 sm:w-64"
        >
          <Search fontSize="small" className="text-muted-foreground group-hover:text-primary transition-colors" />
          <span className="truncate">Search tracking, hubs, routes...</span>
          <span className="ml-auto hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded bg-card border border-border text-muted-foreground">
            ⌘K
          </span>
        </button>
      </div>

      {/* Right: Network Status, Alerts, Theme, Duty Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Socket Hub Connection Pill */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface border border-border text-[11px] font-medium text-muted-foreground">
          <span
            className={`w-2 h-2 rounded-full ${
              connected ? "bg-success animate-pulse" : "bg-warning"
            }`}
          />
          <span>{connected ? "Tower Online" : "Connecting..."}</span>
        </div>

        {/* Alerts Center Dropdown */}
        <div className="relative" ref={alertRef}>
          <button
            onClick={() => setIsAlertsOpen(!isAlertsOpen)}
            className="relative p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
            title="Operational Alerts"
          >
            <NotificationsNoneOutlined fontSize="small" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {isAlertsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-card border border-border shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="p-3 border-b border-border flex items-center justify-between bg-surface/50">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground">Live Telemetry Feed</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {alerts.length > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[11px] text-primary hover:underline font-medium"
                  >
                    Mark read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-border/40">
                {alerts.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground text-xs">
                    No active alerts. All network nodes normal.
                  </div>
                ) : (
                  alerts.map((a) => (
                    <div
                      key={a.id}
                      className={`p-3 text-xs hover:bg-surface-hover transition-colors ${
                        !a.read ? "bg-primary/5" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-foreground">{a.title}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {dayjs(a.timestamp).format("HH:mm:ss")}
                        </span>
                      </div>
                      <div className="text-muted-foreground leading-relaxed">{a.message}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* 3-Way Theme Switcher */}
        <div className="relative" ref={themeRef}>
          <button
            onClick={() => setIsThemeOpen(!isThemeOpen)}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
            title="Switch Theme"
          >
            {resolvedTheme === "dark" ? (
              <DarkModeOutlined fontSize="small" />
            ) : (
              <LightModeOutlined fontSize="small" />
            )}
          </button>

          {isThemeOpen && (
            <div className="absolute right-0 mt-2 w-36 rounded-xl bg-card border border-border shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={() => {
                  setTheme("light");
                  setIsThemeOpen(false);
                }}
                className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-foreground hover:bg-surface transition-colors"
              >
                <span className="flex items-center gap-2">
                  <LightModeOutlined fontSize="inherit" /> Light
                </span>
                {theme === "light" && <Check fontSize="inherit" className="text-primary" />}
              </button>
              <button
                onClick={() => {
                  setTheme("dark");
                  setIsThemeOpen(false);
                }}
                className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-foreground hover:bg-surface transition-colors"
              >
                <span className="flex items-center gap-2">
                  <DarkModeOutlined fontSize="inherit" /> Dark
                </span>
                {theme === "dark" && <Check fontSize="inherit" className="text-primary" />}
              </button>
              <button
                onClick={() => {
                  setTheme("system");
                  setIsThemeOpen(false);
                }}
                className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-foreground hover:bg-surface transition-colors"
              >
                <span className="flex items-center gap-2">
                  <DesktopWindowsOutlined fontSize="inherit" /> System
                </span>
                {theme === "system" && <Check fontSize="inherit" className="text-primary" />}
              </button>
            </div>
          )}
        </div>

        {/* Duty Controller Badge */}
        <div className="flex items-center gap-2 pl-2 border-l border-border">
          <div className="w-8 h-8 rounded-full bg-primary/15 text-primary border border-primary/25 flex items-center justify-center font-bold text-xs">
            {operator?.name ? operator.name.slice(0, 2).toUpperCase() : "OP"}
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-semibold text-foreground leading-tight">
              {operator?.name || "Duty Controller"}
            </div>
            <div className="text-[10px] font-mono text-muted-foreground leading-tight">
              {operator?.role?.replace(/_/g, " ") || "LOGISTICS ADMIN"}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
