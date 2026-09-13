import React, { useState, useEffect } from "react";
import {
  MenuOutlined,
  LaunchOutlined,
  Circle,
  DarkModeOutlined,
  LightModeOutlined,
  DesktopWindowsOutlined,
  CheckOutlined,
  SearchOutlined,
} from "@mui/icons-material";
import { Tooltip, IconButton, Menu, MenuItem } from "@mui/material";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { useTheme } from "../../context/ThemeContext";
import { GlobalSearchModal } from "../common/GlobalSearchModal";

interface AdminNavbarProps {
  onToggleSidebar: () => void;
}

export const AdminNavbar: React.FC<AdminNavbarProps> = ({
  onToggleSidebar,
}) => {
  const { admin } = useAdminAuth();
  const { mode, theme, systemTheme, setTheme } = useTheme();

  const [themeAnchorEl, setThemeAnchorEl] = useState<null | HTMLElement>(null);
  const isThemeMenuOpen = Boolean(themeAnchorEl);

  const [searchModalOpen, setSearchModalOpen] = useState(false);

  // Global shortcut Ctrl+K or Cmd+K to open global search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleOpenThemeMenu = (event: React.MouseEvent<HTMLElement>) => {
    setThemeAnchorEl(event.currentTarget);
  };

  const handleCloseThemeMenu = () => {
    setThemeAnchorEl(null);
  };

  const handleSelectTheme = (newMode: "light" | "dark" | "system") => {
    setTheme(newMode);
    handleCloseThemeMenu();
  };

  const getThemeTooltip = () => {
    if (mode === "system") {
      return `Theme: System (Auto: ${theme === "dark" ? "Dark" : "Light"})`;
    }
    return `Theme: ${mode === "dark" ? "Dark" : "Light"}`;
  };

  return (
    <>
      <header
        className="h-14 bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-30 flex items-center justify-between px-3 sm:px-5 transition-colors duration-200"
        style={{ boxShadow: 'var(--shadow-xs)' }}
      >
        {/* Left side */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-2 -ml-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-hover lg:hidden cursor-pointer transition-colors"
            aria-label="Toggle sidebar menu"
          >
            <MenuOutlined sx={{ fontSize: 20 }} />
          </button>

          {/* System Status Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground px-2 py-1 rounded-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
              <Circle sx={{ fontSize: 8, color: "var(--success)" }} />
            </span>
            <span className="font-medium text-success text-[11px]">Online</span>
          </div>
        </div>

        {/* Center: Global Search Bar Trigger */}
        <div className="flex-1 max-w-sm md:max-w-md mx-2 sm:mx-4">
          <button
            type="button"
            onClick={() => setSearchModalOpen(true)}
            className="w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-surface/80 hover:bg-surface border border-border hover:border-border-strong text-muted-foreground hover:text-foreground text-xs sm:text-[13px] transition-all cursor-pointer group shadow-xs"
          >
            <div className="flex items-center gap-2 truncate min-w-0">
              <SearchOutlined sx={{ fontSize: 16 }} className="text-primary/80 group-hover:text-primary transition-colors shrink-0" />
              <span className="truncate font-medium text-muted-foreground group-hover:text-foreground">
                Search console, orders, products...
              </span>
            </div>

            <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-semibold text-muted-foreground bg-card px-1.5 py-0.5 rounded border border-border/80 shrink-0">
              <span>Ctrl</span>
              <span>K</span>
            </kbd>
          </button>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Professional 3-Way Theme Switcher */}
          <Tooltip title={getThemeTooltip()} placement="bottom">
            <IconButton
              onClick={handleOpenThemeMenu}
              size="small"
              aria-label="Select theme mode"
              aria-controls={isThemeMenuOpen ? "theme-mode-menu" : undefined}
              aria-haspopup="true"
              aria-expanded={isThemeMenuOpen ? "true" : undefined}
              sx={{
                p: "6px",
                borderRadius: "8px",
                bgcolor: "var(--surface-hover)",
                color:
                  mode === "system"
                    ? "var(--primary)"
                    : theme === "dark"
                    ? "var(--warning)"
                    : "var(--foreground)",
                "&:hover": {
                  bgcolor: "var(--surface-active)",
                },
                border: "1px solid",
                borderColor: "var(--border)",
              }}
            >
              {mode === "system" ? (
                <DesktopWindowsOutlined sx={{ fontSize: 16 }} />
              ) : theme === "dark" ? (
                <DarkModeOutlined sx={{ fontSize: 16 }} />
              ) : (
                <LightModeOutlined sx={{ fontSize: 16 }} />
              )}
            </IconButton>
          </Tooltip>

          {/* Theme Selection Menu */}
          <Menu
            id="theme-mode-menu"
            anchorEl={themeAnchorEl}
            open={isThemeMenuOpen}
            onClose={handleCloseThemeMenu}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            slotProps={{
              paper: {
                sx: {
                  minWidth: 160,
                  mt: 1,
                  py: 0.5,
                },
              },
            }}
          >
            <MenuItem
              selected={mode === "light"}
              onClick={() => handleSelectTheme("light")}
            >
              <LightModeOutlined sx={{ fontSize: 16 }} />
              <span className="flex-1">Light</span>
              {mode === "light" && <CheckOutlined sx={{ fontSize: 14 }} />}
            </MenuItem>

            <MenuItem
              selected={mode === "dark"}
              onClick={() => handleSelectTheme("dark")}
            >
              <DarkModeOutlined sx={{ fontSize: 16 }} />
              <span className="flex-1">Dark</span>
              {mode === "dark" && <CheckOutlined sx={{ fontSize: 14 }} />}
            </MenuItem>

            <MenuItem
              selected={mode === "system"}
              onClick={() => handleSelectTheme("system")}
            >
              <DesktopWindowsOutlined sx={{ fontSize: 16 }} />
              <div className="flex-1 flex flex-col">
                <span>System</span>
                <span className="text-[10px] text-muted-foreground leading-none">
                  Auto ({systemTheme === "dark" ? "Dark" : "Light"})
                </span>
              </div>
              {mode === "system" && <CheckOutlined sx={{ fontSize: 14 }} />}
            </MenuItem>
          </Menu>

          {/* Live Store link */}
          <a
            href={import.meta.env.VITE_STOREFRONT_URL || "http://localhost:5173"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-primary bg-primary-soft border border-primary-border hover:bg-primary/10 transition-colors"
          >
            <span>Live Store</span>
            <LaunchOutlined sx={{ fontSize: 12 }} />
          </a>

          <div className="h-5 w-px bg-border hidden sm:block" />

          {/* User info */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="text-right">
              <p className="text-xs font-semibold text-foreground leading-tight">
                {admin?.fullName || "Admin"}
              </p>
              <p className="text-[10px] font-semibold text-primary uppercase tracking-wider">
                Operations Lead
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Global In-Depth Command Palette Search Modal */}
      <GlobalSearchModal
        open={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
      />
    </>
  );
};
