import React from "react";
import { NavLink } from "react-router-dom";
import {
  DashboardOutlined,
  StorefrontOutlined,
  ShoppingCartOutlined,
  Inventory2Outlined,
  PeopleAltOutlined,
  ConfirmationNumberOutlined,
  LocalOfferOutlined,
  CategoryOutlined,
  ReceiptLongOutlined,
  LogoutOutlined,
  BrandingWatermarkOutlined,
  RateReviewOutlined,
  SettingsOutlined,
  WarehouseOutlined,
  ViewCarouselOutlined,
  ChevronLeftOutlined,
  ChevronRightOutlined,
} from "@mui/icons-material";
import { Tooltip } from "@mui/material";
import { useAdminAuth } from "../../context/AdminAuthContext";

interface AdminSidebarProps {
  isOpen: boolean;
  onClose?: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const navSections = [
  {
    title: "Operations",
    items: [
      { path: "/", label: "Dashboard", icon: <DashboardOutlined /> },
      { path: "/orders", label: "Orders & Fulfillment", icon: <ShoppingCartOutlined /> },
      { path: "/sellers", label: "Vendors & Sellers", icon: <StorefrontOutlined /> },
      { path: "/customers", label: "Customers", icon: <PeopleAltOutlined /> },
    ],
  },
  {
    title: "Catalog",
    items: [
      { path: "/categories", label: "Categories", icon: <CategoryOutlined /> },
      { path: "/brands", label: "Brand Registry", icon: <BrandingWatermarkOutlined /> },
      { path: "/products", label: "Product Catalog", icon: <Inventory2Outlined /> },
      { path: "/inventory", label: "Stock Control", icon: <WarehouseOutlined /> },
      { path: "/reviews", label: "Reviews", icon: <RateReviewOutlined /> },
    ],
  },
  {
    title: "Commercial",
    items: [
      { path: "/deals", label: "Deals & Offers", icon: <LocalOfferOutlined /> },
      { path: "/coupons", label: "Coupons", icon: <ConfirmationNumberOutlined /> },
      { path: "/storefront-banners", label: "Banners", icon: <ViewCarouselOutlined /> },
      { path: "/transactions", label: "Transactions", icon: <ReceiptLongOutlined /> },
      { path: "/settings", label: "Settings", icon: <SettingsOutlined /> },
    ],
  },
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isOpen,
  onClose,
  isCollapsed,
  onToggleCollapse,
}) => {
  const { logout, admin } = useAdminAuth();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-overlay z-40 lg:hidden backdrop-blur-xs transition-opacity duration-200"
        />
      )}

      {/* Sidebar Container — uses sidebar tokens so it responds to theme */}
      <aside
        className={`sidebar-smooth fixed top-0 bottom-0 left-0 z-50 bg-sidebar border-r border-sidebar-border text-sidebar-foreground flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${isCollapsed ? "lg:w-20" : "lg:w-60"} w-60`}
      >
        {/* Brand Header — single collapse button here, removed from navbar */}
        <div className="h-14 flex items-center justify-between px-3.5 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
            <div
              className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center font-bold text-primary-foreground text-base shrink-0"
              style={{ boxShadow: '0 2px 8px rgba(20, 184, 166, 0.3)' }}
            >
              Z
            </div>

            {!isCollapsed && (
              <div className="flex items-center gap-1.5 overflow-hidden truncate">
                <span className="font-bold tracking-tight text-sidebar-foreground text-sm truncate">
                  Zosh Bazaar
                </span>
                <span className="px-1.5 py-px rounded text-[9px] font-bold bg-sidebar-primary/15 text-sidebar-primary border border-sidebar-primary/25 shrink-0">
                  OPS
                </span>
              </div>
            )}
          </div>

          {/* Collapse / Expand toggle — only visible on desktop */}
          <div className="hidden lg:block">
            <Tooltip
              title={isCollapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
              placement="right"
            >
              <button
                type="button"
                onClick={onToggleCollapse}
                className="p-1 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors cursor-pointer"
              >
                {isCollapsed ? (
                  <ChevronRightOutlined sx={{ fontSize: 16 }} />
                ) : (
                  <ChevronLeftOutlined sx={{ fontSize: 16 }} />
                )}
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-2.5 py-3 space-y-4 overflow-y-auto overflow-x-hidden">
          {navSections.map((sec, idx) => (
            <div key={idx} className="space-y-0.5">
              {!isCollapsed ? (
                <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/50 truncate">
                  {sec.title}
                </div>
              ) : (
                idx > 0 && <div className="mx-3 my-2 border-t border-sidebar-border" />
              )}

              {sec.items.map((item) => {
                const navLinkContent = (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === "/"}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `group relative flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                        isCollapsed ? "justify-center" : ""
                      } ${
                        isActive
                          ? "bg-sidebar-primary/10 text-sidebar-primary font-semibold"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {/* Active indicator bar */}
                        {isActive && (
                          <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-sidebar-primary rounded-r-full" />
                        )}

                        <span
                          className={`flex items-center shrink-0 transition-colors ${
                            isActive ? "text-sidebar-primary" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground"
                          }`}
                        >
                          {React.cloneElement(item.icon as React.ReactElement<any>, { sx: { fontSize: 18 } } as any)}
                        </span>

                        {!isCollapsed && (
                          <span className="truncate">{item.label}</span>
                        )}
                      </>
                    )}
                  </NavLink>
                );

                // Tooltip ONLY when collapsed — when expanded the label text is visible, tooltip would be noise
                return isCollapsed ? (
                  <Tooltip
                    key={item.path}
                    title={item.label}
                    placement="right"
                  >
                    <div>{navLinkContent}</div>
                  </Tooltip>
                ) : (
                  navLinkContent
                );
              })}
            </div>
          ))}
        </nav>

        {/* User Account & Logout Footer */}
        <div className="p-2.5 border-t border-sidebar-border">
          {!isCollapsed ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg bg-sidebar-accent/50 border border-sidebar-border/50">
                <div className="w-8 h-8 rounded-lg bg-sidebar-primary/10 border border-sidebar-primary/20 flex items-center justify-center text-xs font-bold text-sidebar-primary shrink-0">
                  {admin?.fullName?.[0] || "A"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-sidebar-foreground truncate">
                    {admin?.fullName || "Administrator"}
                  </p>
                  <p className="text-[10px] text-sidebar-foreground/50 truncate">
                    {admin?.email || "admin@zoshbazaar.com"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={logout}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
              >
                <LogoutOutlined sx={{ fontSize: 14 }} />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              {/* Tooltip useful here — collapsed state hides the admin name */}
              <Tooltip title={admin?.fullName || "Admin"} placement="right">
                <div className="w-9 h-9 rounded-lg bg-sidebar-accent border border-sidebar-border flex items-center justify-center text-xs font-bold text-sidebar-primary cursor-default">
                  {admin?.fullName?.[0] || "A"}
                </div>
              </Tooltip>

              {/* Tooltip useful here — collapsed state hides "Sign Out" text */}
              <Tooltip title="Sign Out" placement="right">
                <button
                  type="button"
                  onClick={logout}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
                >
                  <LogoutOutlined sx={{ fontSize: 16 }} />
                </button>
              </Tooltip>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
