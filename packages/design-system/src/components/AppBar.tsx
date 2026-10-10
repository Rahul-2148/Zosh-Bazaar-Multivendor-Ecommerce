import React from "react";

export interface AppBarProps {
  logo?: React.ReactNode;
  searchElement?: React.ReactNode;
  rightActions?: React.ReactNode;
  themeColor?: string;
  className?: string;
}

export const AppBar: React.FC<AppBarProps> = ({
  logo,
  searchElement,
  rightActions,
  themeColor = "#2874F0",
  className = "",
}) => {
  return (
    <header
      style={{ backgroundColor: themeColor }}
      className={`sticky top-0 z-40 text-white shadow-md px-3 md:px-6 py-2.5 flex items-center justify-between gap-3 md:gap-6 ${className}`}
    >
      {/* Brand / Logo */}
      <div className="flex items-center shrink-0">{logo}</div>

      {/* Middle: Universal Search */}
      {searchElement && <div className="flex-1 max-w-2xl">{searchElement}</div>}

      {/* Right Side: Account, Cart, Notifications */}
      {rightActions && <div className="flex items-center gap-2 md:gap-4 shrink-0">{rightActions}</div>}
    </header>
  );
};

export interface BottomNavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
  badge?: number | string;
  onClick: () => void;
  isActive?: boolean;
}

export interface BottomNavProps {
  items: BottomNavItem[];
  activeId?: string;
}

export const BottomNav: React.FC<BottomNavProps> = ({ items, activeId }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E0E0E0] md:hidden shadow-[0_-1px_4px_rgba(0,0,0,0.06)] pb-safe">
      <div className="flex items-center justify-around h-14">
        {items.map((item) => {
          const isActive = activeId ? activeId === item.id : item.isActive;
          return (
            <button
              key={item.id}
              onClick={item.onClick}
              className={`flex-1 flex flex-col items-center justify-center py-1 relative select-none transition-colors duration-150 ${
                isActive ? "text-[#2874F0] font-bold" : "text-[#878787] hover:text-[#212121]"
              }`}
            >
              <div className="relative">
                {isActive && item.activeIcon ? item.activeIcon : item.icon}
                {item.badge !== undefined && item.badge !== 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-[#FB641B] text-white text-[9px] font-black rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center border-2 border-white">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export interface SideNavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
  onClick: () => void;
  isActive?: boolean;
  group?: string;
}

export interface SideNavProps {
  items: SideNavItem[];
  activeId?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  brandTitle?: string;
  brandSubtitle?: string;
  brandIcon?: React.ReactNode;
  theme?: "seller" | "admin" | "logistics" | "default";
}

export const SideNav: React.FC<SideNavProps> = ({
  items,
  activeId,
  isCollapsed = false,
  onToggleCollapse,
  brandTitle = "Zosh Bazaar",
  brandSubtitle = "Console",
  brandIcon,
  theme = "default",
}) => {
  const themeAccent = {
    seller: "bg-[#0F9D58] text-white",
    admin: "bg-[#1A237E] text-white",
    logistics: "bg-[#6A1B9A] text-white",
    default: "bg-[#2874F0] text-white",
  }[theme];

  const activeItemStyle = {
    seller: "bg-[#0F9D58]/10 text-[#0F9D58] font-bold border-r-4 border-r-[#0F9D58]",
    admin: "bg-[#1A237E]/10 text-[#1A237E] font-bold border-r-4 border-r-[#1A237E]",
    logistics: "bg-[#6A1B9A]/10 text-[#6A1B9A] font-bold border-r-4 border-r-[#6A1B9A]",
    default: "bg-[#2874F0]/10 text-[#2874F0] font-bold border-r-4 border-r-[#2874F0]",
  }[theme];

  return (
    <aside
      className={`bg-white border-r border-[#E0E0E0] h-screen flex flex-col transition-all duration-200 select-none ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-[#E0E0E0] flex items-center justify-between">
        <div className="flex items-center gap-2.5 overflow-hidden">
          {brandIcon && (
            <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${themeAccent}`}>
              {brandIcon}
            </div>
          )}
          {!isCollapsed && (
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-[#212121] leading-tight truncate">
                {brandTitle}
              </h2>
              <span className="text-[11px] text-[#878787] uppercase tracking-wider block">
                {brandSubtitle}
              </span>
            </div>
          )}
        </div>
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? "»" : "«"}
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-3">
        {items.map((item) => {
          const isActive = activeId ? activeId === item.id : item.isActive;
          return (
            <button
              key={item.id}
              onClick={item.onClick}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs text-left transition-colors duration-150 ${
                isActive
                  ? activeItemStyle
                  : "text-[#212121] hover:bg-gray-50 hover:text-black"
              }`}
            >
              <span className="shrink-0 text-base">{item.icon}</span>
              {!isCollapsed && <span className="flex-1 truncate">{item.label}</span>}
              {!isCollapsed && item.badge && (
                <span className="bg-gray-100 text-gray-700 text-[10px] px-1.5 py-0.5 rounded font-semibold">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
};
