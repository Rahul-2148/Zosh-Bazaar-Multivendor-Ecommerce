import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AccountRoutes from "../../components/AccountRoutes";
import {
  DashboardOutlined,
  ShoppingBagOutlined,
  ReplayOutlined,
  FavoriteBorder,
  RepeatOutlined,
  HistoryOutlined,
  CreditCardOutlined,
  LocalOfferOutlined,
  LocationOnOutlined,
  NotificationsNoneOutlined,
  TuneOutlined,
  PersonOutline,
  LockOutlined,
  DevicesOutlined,
  SecurityOutlined,
  HelpOutline,
  SmartToyOutlined,
  LogoutOutlined,
  ArrowBack,
  MenuOpenOutlined,
  CheckCircle,
} from "@mui/icons-material";
import { Drawer } from "@mui/material";
import { performLogout } from "../../../Redux Toolkit/features/Auth/AuthSlice";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";

interface NavGroup {
  groupName: string;
  items: {
    name: string;
    path: string;
    icon: React.ReactNode;
  }[];
}

const navGroups: NavGroup[] = [
  {
    groupName: "Overview",
    items: [
      {
        name: "Command Center",
        path: "/account",
        icon: <DashboardOutlined sx={{ fontSize: 16 }} />,
      },
    ],
  },
  {
    groupName: "Orders & Tracking",
    items: [
      {
        name: "My Orders",
        path: "/account/orders",
        icon: <ShoppingBagOutlined sx={{ fontSize: 16 }} />,
      },
      {
        name: "Returns & Refunds",
        path: "/account/returns",
        icon: <ReplayOutlined sx={{ fontSize: 16 }} />,
      },
    ],
  },
  {
    groupName: "Shopping & Saved",
    items: [
      {
        name: "Wishlist & Collections",
        path: "/wishlist",
        icon: <FavoriteBorder sx={{ fontSize: 16 }} />,
      },
      {
        name: "Buy Again",
        path: "/account/buy-again",
        icon: <RepeatOutlined sx={{ fontSize: 16 }} />,
      },
      {
        name: "Recently Viewed",
        path: "/account/recently-viewed",
        icon: <HistoryOutlined sx={{ fontSize: 16 }} />,
      },
    ],
  },
  {
    groupName: "Payments & Offers",
    items: [
      {
        name: "Payment Methods",
        path: "/account/payments",
        icon: <CreditCardOutlined sx={{ fontSize: 16 }} />,
      },
      {
        name: "My Coupons",
        path: "/account/coupons",
        icon: <LocalOfferOutlined sx={{ fontSize: 16 }} />,
      },
    ],
  },
  {
    groupName: "Delivery",
    items: [
      {
        name: "Saved Addresses",
        path: "/account/addresses",
        icon: <LocationOnOutlined sx={{ fontSize: 16 }} />,
      },
    ],
  },
  {
    groupName: "Communication",
    items: [
      {
        name: "Notification Inbox",
        path: "/account/notifications",
        icon: <NotificationsNoneOutlined sx={{ fontSize: 16 }} />,
      },
      {
        name: "Notification Settings",
        path: "/account/notification-preferences",
        icon: <TuneOutlined sx={{ fontSize: 16 }} />,
      },
    ],
  },
  {
    groupName: "Account & Security",
    items: [
      {
        name: "Personal Profile",
        path: "/account/profile",
        icon: <PersonOutline sx={{ fontSize: 16 }} />,
      },
      {
        name: "Login & Security",
        path: "/account/security",
        icon: <LockOutlined sx={{ fontSize: 16 }} />,
      },
      {
        name: "Active Devices & Sessions",
        path: "/account/sessions",
        icon: <DevicesOutlined sx={{ fontSize: 16 }} />,
      },
      {
        name: "Privacy & Data",
        path: "/account/privacy",
        icon: <SecurityOutlined sx={{ fontSize: 16 }} />,
      },
    ],
  },
  {
    groupName: "Assistance",
    items: [
      {
        name: "Help Center",
        path: "/account/help",
        icon: <HelpOutline sx={{ fontSize: 16 }} />,
      },
      {
        name: "AI Assistant",
        path: "/account/chat",
        icon: <SmartToyOutlined sx={{ fontSize: 16 }} />,
      },
    ],
  },
];

// Quick shortcut pills on mobile
const mobileQuickPills = [
  { name: "Overview", path: "/account", icon: <DashboardOutlined sx={{ fontSize: 15 }} /> },
  { name: "Orders", path: "/account/orders", icon: <ShoppingBagOutlined sx={{ fontSize: 15 }} /> },
  { name: "Returns", path: "/account/returns", icon: <ReplayOutlined sx={{ fontSize: 15 }} /> },
  { name: "Wishlist", path: "/wishlist", icon: <FavoriteBorder sx={{ fontSize: 15 }} /> },
  { name: "Buy Again", path: "/account/buy-again", icon: <RepeatOutlined sx={{ fontSize: 15 }} /> },
  { name: "Addresses", path: "/account/addresses", icon: <LocationOnOutlined sx={{ fontSize: 15 }} /> },
  { name: "Payments", path: "/account/payments", icon: <CreditCardOutlined sx={{ fontSize: 15 }} /> },
  { name: "Coupons", path: "/account/coupons", icon: <LocalOfferOutlined sx={{ fontSize: 15 }} /> },
  { name: "Security", path: "/account/security", icon: <LockOutlined sx={{ fontSize: 15 }} /> },
  { name: "Assistant", path: "/account/chat", icon: <SmartToyOutlined sx={{ fontSize: 15 }} /> },
  { name: "Help", path: "/account/help", icon: <HelpOutline sx={{ fontSize: 15 }} /> },
];

export const Profile: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAppSelector((store) => store.user);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const isBaseOverview =
    location.pathname === "/account" || location.pathname === "/account/";

  const handleNavClick = (path: string) => {
    setMobileDrawerOpen(false);
    navigate(path);
  };

  const handleLogout = () => {
    dispatch(performLogout());
    navigate("/");
  };

  const initials = (user?.fullName || "User")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full overflow-hidden">
      {/* 1. User Mini Profile Header (shrink-0) */}
      <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60 flex items-center gap-2.5 shrink-0 mb-2">
        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center font-black text-primary text-xs shrink-0">
          {initials}
        </div>
        <div className="overflow-hidden leading-tight">
          <p className="text-xs font-bold text-foreground truncate">
            {user?.fullName || "Valued Customer"}
          </p>
          <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
        </div>
      </div>

      {/* 2. Scrollable Nav Groups (flex-1 with high information density) */}
      <div className="flex-1 overflow-y-auto overscroll-contain pr-1 py-0.5 space-y-2.5 custom-scrollbar">
        {navGroups.map((group) => (
          <div key={group.groupName} className="space-y-0.5">
            <h4 className="text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground/80 px-2 py-0.5">
              {group.groupName}
            </h4>
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const isActive =
                  item.path === "/account"
                    ? isBaseOverview
                    : location.pathname.startsWith(item.path);

                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavClick(item.path)}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer text-left w-full ${
                      isActive
                        ? "bg-primary text-primary-foreground font-bold shadow-xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {item.icon}
                      <span className="truncate">{item.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 3. Pinned Bottom Sign Out (shrink-0 mt-auto always visible) */}
      <div className="shrink-0 mt-auto pt-2 border-t border-border/80">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/40 transition-colors cursor-pointer"
        >
          <LogoutOutlined sx={{ fontSize: 16 }} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 min-h-screen pt-4 pb-28 sm:py-6 w-full">
      {/* Top Banner / Breadcrumb Header */}
      <div className="flex flex-col gap-3 pb-3 border-b border-border/80">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {!isBaseOverview && (
              <button
                onClick={() => navigate("/account")}
                className="lg:hidden p-1.5 rounded-lg border border-border bg-card text-foreground hover:bg-muted transition-colors mr-1 cursor-pointer flex items-center gap-1 text-xs font-bold shrink-0"
              >
                <ArrowBack sx={{ fontSize: 16 }} />
                <span>Back</span>
              </button>
            )}
            <div>
              <h1 className="text-lg sm:text-2xl font-black tracking-tight text-foreground">
                My Account
              </h1>
              <p className="text-[11px] sm:text-xs text-muted-foreground">
                Personal shopping command center, orders, deliveries & security
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {user && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                <CheckCircle sx={{ fontSize: 12 }} /> Verified
              </span>
            )}

            {/* Mobile Menu Drawer Toggle */}
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-border bg-card text-foreground hover:bg-muted transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
            >
              <MenuOpenOutlined sx={{ fontSize: 18 }} />
              <span>All Menu</span>
            </button>
          </div>
        </div>

        {/* Mobile Horizontal Quick Navigation Pills (< lg) */}
        <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar">
          {mobileQuickPills.map((pill) => {
            const isActive =
              pill.path === "/account"
                ? isBaseOverview
                : location.pathname.startsWith(pill.path);

            return (
              <button
                key={pill.path}
                onClick={() => handleNavClick(pill.path)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-card text-muted-foreground border-border hover:bg-muted"
                }`}
              >
                {pill.icon}
                <span>{pill.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Desktop Sticky Fixed Sidebar + Main Content Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-4 sm:pt-6 min-h-[75vh]">
        {/* Desktop Sidebar (3 cols) */}
        <aside className="hidden lg:block lg:col-span-3">
          <div className="border border-border/80 bg-card rounded-2xl p-3 sticky top-20 h-[calc(100vh-6.5rem)] max-h-[860px] shadow-xs flex flex-col">
            {renderSidebarContent()}
          </div>
        </aside>

        {/* Main Content Area (9 cols) */}
        <main className="lg:col-span-9 border border-border/80 bg-card rounded-2xl p-3.5 sm:p-6 shadow-xs min-w-0">
          <AccountRoutes />
        </main>
      </div>

      {/* Mobile Drawer Navigation */}
      <Drawer
        anchor="left"
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: 290,
            p: 2.5,
            bgcolor: "background.paper",
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-border shrink-0">
          <h3 className="text-sm font-bold text-foreground">Account Navigation</h3>
          <button
            onClick={() => setMobileDrawerOpen(false)}
            className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
          >
            Close
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          {renderSidebarContent()}
        </div>
      </Drawer>
    </div>
  );
};

export default Profile;
