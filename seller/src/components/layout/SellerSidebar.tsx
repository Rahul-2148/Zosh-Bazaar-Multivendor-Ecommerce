import React, { useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  DashboardOutlined,
  Inventory2Outlined,
  AddBoxOutlined,
  TuneOutlined,
  ShoppingBagOutlined,
  AssignmentReturnOutlined,
  AccountBalanceWalletOutlined,
  StorefrontOutlined,
  ChevronLeft,
  ChevronRight,
  Store,
  AutoAwesomeOutlined,
} from "@mui/icons-material";
import { Tooltip } from "@mui/material";
import { useSocket } from "../../context/SocketContext";

interface NavItem {
  title: string;
  path: string;
  icon: React.ReactNode;
  badge?: number;
}

export const SellerSidebar: React.FC<{
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}> = ({ isCollapsed, onToggleCollapse }) => {
  const { unreadCount } = useSocket();

  // Keyboard shortcut Ctrl+B to toggle collapse
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        onToggleCollapse();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onToggleCollapse]);

  const navItems: NavItem[] = [
    {
      title: "Dashboard",
      path: "/",
      icon: <DashboardOutlined fontSize="small" />,
    },
    {
      title: "AI Insights",
      path: "/ai-insights",
      icon: <AutoAwesomeOutlined fontSize="small" className="text-teal-500" />,
    },
    {
      title: "Products",
      path: "/products",
      icon: <Inventory2Outlined fontSize="small" />,
    },
    {
      title: "Add Product",
      path: "/products/new",
      icon: <AddBoxOutlined fontSize="small" />,
    },
    {
      title: "Inventory",
      path: "/inventory",
      icon: <TuneOutlined fontSize="small" />,
    },
    {
      title: "Orders",
      path: "/orders",
      icon: <ShoppingBagOutlined fontSize="small" />,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    {
      title: "Returns",
      path: "/returns",
      icon: <AssignmentReturnOutlined fontSize="small" />,
    },
    {
      title: "Finances",
      path: "/finances",
      icon: <AccountBalanceWalletOutlined fontSize="small" />,
    },
    {
      title: "Store Profile",
      path: "/store",
      icon: <StorefrontOutlined fontSize="small" />,
    },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 z-30 h-screen bg-sidebar border-r border-sidebar-border sidebar-smooth flex flex-col justify-between ${
        isCollapsed ? "w-18" : "w-64"
      }`}
    >
      {/* Brand Header */}
      <div>
        <div className="h-16 flex items-center px-4 border-b border-sidebar-border gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <Store fontSize="medium" />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden whitespace-nowrap">
              <span className="font-extrabold tracking-tight text-foreground text-sm block">
                ZOSH BAZAAR
              </span>
              <span className="text-[10px] font-semibold text-primary uppercase tracking-widest block">
                Merchant Console
              </span>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const content = (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors relative ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-surface"
                  } ${isCollapsed ? "justify-center px-0" : ""}`
                }
              >
                <span className="shrink-0">{item.icon}</span>
                {!isCollapsed && <span className="truncate">{item.title}</span>}
                {item.badge !== undefined && (
                  <span
                    className={`ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isCollapsed
                        ? "absolute top-1 right-2 bg-destructive text-destructive-foreground"
                        : "bg-destructive text-destructive-foreground"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );

            if (isCollapsed) {
              return (
                <Tooltip key={item.path} title={item.title} placement="right" arrow>
                  <div>{content}</div>
                </Tooltip>
              );
            }

            return content;
          })}
        </nav>
      </div>

      {/* Collapse Toggle Footer */}
      <div className="p-3 border-t border-sidebar-border">
        {isCollapsed ? (
          <Tooltip title="Expand sidebar (Ctrl+B)" placement="right" arrow>
            <button
              onClick={onToggleCollapse}
              className="w-full flex items-center justify-center p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
            >
              <ChevronRight fontSize="small" />
            </button>
          </Tooltip>
        ) : (
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface text-xs font-medium transition-colors"
          >
            <span>Collapse</span>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-surface border border-border rounded-xs">
                Ctrl+B
              </kbd>
              <ChevronLeft fontSize="small" />
            </div>
          </button>
        )}
      </div>
    </aside>
  );
};
