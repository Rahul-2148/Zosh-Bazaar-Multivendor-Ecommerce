import React from "react";
import { NavLink } from "react-router-dom";
import {
  DashboardOutlined,
  AltRouteOutlined,
  PersonPinCircleOutlined,
  LocalShippingOutlined,
  QrCodeScannerOutlined,
  WarehouseOutlined,
  MapOutlined,
  PeopleAltOutlined,
  RouteOutlined,
  Inventory2Outlined,
  ReportProblemOutlined,
  HourglassBottomOutlined,
  AssignmentReturnOutlined,
  InsightsOutlined,
  ChevronLeftOutlined,
  ChevronRightOutlined,
  OpenInNewOutlined,
} from "@mui/icons-material";
import { Tooltip } from "@mui/material";

interface LogisticsSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

const navSections = [
  {
    title: "Mission Control",
    items: [
      { path: "/", label: "Control Tower", icon: <DashboardOutlined fontSize="small" /> },
      { path: "/operations", label: "Operations Board", icon: <AltRouteOutlined fontSize="small" /> },
      { path: "/map", label: "Live Network Map", icon: <PersonPinCircleOutlined fontSize="small" /> },
    ],
  },
  {
    title: "Fulfillment & Parcels",
    items: [
      { path: "/shipments", label: "All Shipments", icon: <LocalShippingOutlined fontSize="small" /> },
      { path: "/scanner", label: "Package Scanner", icon: <QrCodeScannerOutlined fontSize="small" /> },
      { path: "/manifests", label: "Manifests Hub", icon: <Inventory2Outlined fontSize="small" /> },
    ],
  },
  {
    title: "Network & Fleet",
    items: [
      { path: "/hubs", label: "Hubs & Facilities", icon: <WarehouseOutlined fontSize="small" /> },
      { path: "/zones", label: "Zones & SLAs", icon: <MapOutlined fontSize="small" /> },
      { path: "/agents", label: "Delivery Agents", icon: <PeopleAltOutlined fontSize="small" /> },
      { path: "/routes", label: "Route Planner", icon: <RouteOutlined fontSize="small" /> },
    ],
  },
  {
    title: "Triage & Quality",
    items: [
      { path: "/exceptions", label: "Exceptions Center", icon: <ReportProblemOutlined fontSize="small" /> },
      { path: "/sla", label: "SLA Command Center", icon: <HourglassBottomOutlined fontSize="small" /> },
      { path: "/returns", label: "Reverse Logistics", icon: <AssignmentReturnOutlined fontSize="small" /> },
      { path: "/analytics", label: "Analytics & Dwell", icon: <InsightsOutlined fontSize="small" /> },
    ],
  },
];

export const LogisticsSidebar: React.FC<LogisticsSidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  isOpenMobile,
  onCloseMobile,
}) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-overlay backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-40 bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col ${
          isCollapsed ? "w-18" : "w-64"
        } ${
          isOpenMobile
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Branding Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border bg-sidebar/95">
          {!isCollapsed ? (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-black text-base shadow-sm">
                ZB
              </div>
              <div>
                <span className="font-bold text-sm tracking-tight text-foreground block">
                  Logistics Tower
                </span>
                <span className="text-[10px] font-mono text-primary uppercase tracking-wider block">
                  Mission Control
                </span>
              </div>
            </div>
          ) : (
            <div className="w-full flex justify-center">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-black text-base shadow-sm">
                ZB
              </div>
            </div>
          )}

          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
            title={isCollapsed ? "Expand Sidebar (Ctrl+B)" : "Collapse Sidebar (Ctrl+B)"}
          >
            {isCollapsed ? <ChevronRightOutlined fontSize="small" /> : <ChevronLeftOutlined fontSize="small" />}
          </button>
        </div>

        {/* Scrollable Nav Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {!isCollapsed && (
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-1">
                  {section.title}
                </div>
              )}
              {section.items.map((item) => {
                const linkContent = (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === "/"}
                    onClick={onCloseMobile}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
                      } ${isCollapsed ? "justify-center px-2" : ""}`
                    }
                  >
                    <span className="shrink-0">{item.icon}</span>
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </NavLink>
                );

                return isCollapsed ? (
                  <Tooltip key={item.path} title={item.label} placement="right" arrow>
                    <div>{linkContent}</div>
                  </Tooltip>
                ) : (
                  linkContent
                );
              })}
            </div>
          ))}
        </div>

        {/* Platform Ecosystem Switcher */}
        <div className="p-3 border-t border-sidebar-border bg-surface/50">
          {!isCollapsed ? (
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold uppercase text-muted-foreground px-2">
                Connected Portals
              </div>
              <div className="flex items-center justify-between text-[11px] px-2 py-1 text-muted-foreground hover:text-foreground">
                <a
                  href={import.meta.env.VITE_ADMIN_PORTAL_URL || "http://localhost:5176"}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 hover:underline"
                >
                  <span>Platform Admin</span>
                  <OpenInNewOutlined fontSize="inherit" />
                </a>
              </div>
              <div className="flex items-center justify-between text-[11px] px-2 py-1 text-muted-foreground hover:text-foreground">
                <a
                  href={import.meta.env.VITE_SELLER_PORTAL_URL || "http://localhost:5175"}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 hover:underline"
                >
                  <span>Merchant OS</span>
                  <OpenInNewOutlined fontSize="inherit" />
                </a>
              </div>
              <div className="flex items-center justify-between text-[11px] px-2 py-1 text-muted-foreground hover:text-foreground">
                <a
                  href={import.meta.env.VITE_STOREFRONT_URL || "http://localhost:5173"}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 hover:underline"
                >
                  <span>Storefront</span>
                  <OpenInNewOutlined fontSize="inherit" />
                </a>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" title="Systems Live" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
