import React, { useState } from "react";
import {
  Menu as MenuIcon,
  Search,
  NotificationsNoneOutlined,
  LightModeOutlined,
  DarkModeOutlined,
  SettingsBrightnessOutlined,
  LogoutOutlined,
  StorefrontOutlined,
  CheckCircleOutline,
  DeleteOutline,
} from "@mui/icons-material";
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Badge,
  IconButton,
} from "@mui/material";
import { useTheme } from "../../context/ThemeContext";
import { useSellerAuth } from "../../context/SellerAuthContext";
import { useSocket } from "../../context/SocketContext";
import { useNavigate } from "react-router-dom";

export const SellerHeader: React.FC<{
  onOpenMobileNav: () => void;
  onOpenSearch: () => void;
}> = ({ onOpenMobileNav, onOpenSearch }) => {
  const { mode, setTheme, isDark } = useTheme();
  const { seller, logout } = useSellerAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications, connected } = useSocket();
  const navigate = useNavigate();

  const [themeAnchor, setThemeAnchor] = useState<null | HTMLElement>(null);
  const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null);
  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null);

  const getThemeIcon = () => {
    if (mode === "system") return <SettingsBrightnessOutlined fontSize="small" />;
    return isDark ? <DarkModeOutlined fontSize="small" /> : <LightModeOutlined fontSize="small" />;
  };

  return (
    <header className="h-16 bg-surface/80 backdrop-blur-md border-b border-border sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6">
      {/* Left: Mobile hamburger & Global Search Button */}
      <div className="flex items-center gap-3 w-full max-w-md">
        <button
          onClick={onOpenMobileNav}
          className="lg:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
        >
          <MenuIcon fontSize="small" />
        </button>

        {/* Global Search Bar (Ctrl+K trigger) */}
        <button
          onClick={onOpenSearch}
          className="flex items-center justify-between w-full max-w-sm px-3 py-1.5 rounded-xl bg-card border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors shadow-xs text-xs"
        >
          <div className="flex items-center gap-2 truncate">
            <Search fontSize="small" className="text-muted-foreground" />
            <span className="truncate">Search products, orders, or actions...</span>
          </div>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-surface border border-border rounded-md shadow-2xs">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Right: Realtime status, Theme, Notifications, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Realtime socket status */}
        <div
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface border border-border text-[11px] font-medium text-muted-foreground"
          title={connected ? "Realtime order events live" : "Connecting..."}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              connected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
            }`}
          />
          <span>{connected ? "Realtime Live" : "Connecting"}</span>
        </div>

        {/* Theme switcher */}
        <button
          onClick={(e) => setThemeAnchor(e.currentTarget)}
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-card border border-transparent hover:border-border transition-colors"
          title="Change theme"
        >
          {getThemeIcon()}
        </button>

        <Menu
          anchorEl={themeAnchor}
          open={Boolean(themeAnchor)}
          onClose={() => setThemeAnchor(null)}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        >
          <MenuItem
            selected={mode === "light"}
            onClick={() => {
              setTheme("light");
              setThemeAnchor(null);
            }}
          >
            <ListItemIcon>
              <LightModeOutlined fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Light Mode" />
          </MenuItem>
          <MenuItem
            selected={mode === "dark"}
            onClick={() => {
              setTheme("dark");
              setThemeAnchor(null);
            }}
          >
            <ListItemIcon>
              <DarkModeOutlined fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Dark Mode" />
          </MenuItem>
          <MenuItem
            selected={mode === "system"}
            onClick={() => {
              setTheme("system");
              setThemeAnchor(null);
            }}
          >
            <ListItemIcon>
              <SettingsBrightnessOutlined fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="System Default" />
          </MenuItem>
        </Menu>

        {/* Notifications Dropdown */}
        <button
          onClick={(e) => setNotifAnchor(e.currentTarget)}
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-card border border-transparent hover:border-border transition-colors relative"
          title="Notifications"
        >
          <Badge badgeContent={unreadCount} color="error" max={99}>
            <NotificationsNoneOutlined fontSize="small" />
          </Badge>
        </button>

        <Menu
          anchorEl={notifAnchor}
          open={Boolean(notifAnchor)}
          onClose={() => setNotifAnchor(null)}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          PaperProps={{
            sx: { width: 340, maxHeight: 420 },
          }}
        >
          <div className="p-3 border-b border-border flex items-center justify-between">
            <span className="text-xs font-bold text-foreground">Notifications</span>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[11px] font-semibold text-primary hover:underline px-1.5 py-0.5"
                >
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearNotifications}
                  className="text-[11px] font-semibold text-destructive hover:underline px-1.5 py-0.5"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="overflow-y-auto max-h-72 divide-y divide-border/30">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => {
                    markAsRead(n.id);
                    if (n.type === "ORDER_CREATED" || n.type === "ORDER_STATUS") {
                      navigate("/orders");
                    } else if (n.type === "LOW_STOCK") {
                      navigate("/inventory");
                    }
                    setNotifAnchor(null);
                  }}
                  className={`p-3 text-xs cursor-pointer hover:bg-surface transition-colors ${
                    !n.read ? "bg-primary/5 font-medium" : "opacity-75"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-foreground">{n.title}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(n.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">{n.message}</p>
                </div>
              ))
            )}
          </div>
        </Menu>

        {/* Profile menu */}
        <button
          onClick={(e) => setProfileAnchor(e.currentTarget)}
          className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-card border border-transparent hover:border-border transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center">
            {seller?.sellerName?.charAt(0).toUpperCase() || "M"}
          </div>
          <div className="hidden sm:block text-left text-xs">
            <span className="font-bold text-foreground block truncate max-w-[120px]">
              {seller?.sellerName || "Merchant"}
            </span>
            <span className="text-[10px] text-muted-foreground block truncate max-w-[120px]">
              {seller?.businessDetails?.businessName || seller?.email || "Vendor"}
            </span>
          </div>
        </button>

        <Menu
          anchorEl={profileAnchor}
          open={Boolean(profileAnchor)}
          onClose={() => setProfileAnchor(null)}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        >
          <MenuItem
            onClick={() => {
              navigate("/store");
              setProfileAnchor(null);
            }}
          >
            <ListItemIcon>
              <StorefrontOutlined fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Store Profile & KYC" />
          </MenuItem>
          <MenuItem
            onClick={() => {
              logout();
              setProfileAnchor(null);
            }}
            sx={{ color: "var(--color-destructive)" }}
          >
            <ListItemIcon sx={{ color: "inherit" }}>
              <LogoutOutlined fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Sign Out" />
          </MenuItem>
        </Menu>
      </div>
    </header>
  );
};
