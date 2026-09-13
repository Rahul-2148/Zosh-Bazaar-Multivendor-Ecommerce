import React from "react";
import { usePartnerAuth } from "../../context/PartnerAuthContext";
import { useTheme } from "../../context/ThemeContext";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Sun,
  Moon,
  AlertTriangle,
  Coffee,
  Home,
  MapPin,
  Scan,
  Wallet,
  User,
  Truck,
  Bike,
} from "lucide-react";

export const PartnerHeader: React.FC = () => {
  const { partner, updateShift } = usePartnerAuth();
  const { actualTheme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const isShiftActive = partner?.shift?.isShiftActive;
  const onBreak = partner?.shift?.onBreak;

  const handleToggleBreak = async () => {
    try {
      await updateShift("TOGGLE_BREAK");
    } catch {
      // handled
    }
  };

  const navLinks = [
    { to: "/", label: "Today", icon: Home },
    { to: "/route", label: "Route Manifest", icon: MapPin },
    { to: "/scanner", label: "Scanner", icon: Scan },
    { to: "/earnings", label: "Earnings", icon: Wallet },
    { to: "/safety", label: "Safety & SOS", icon: AlertTriangle },
    { to: "/profile", label: "Profile", icon: User },
  ];

  return (
    <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border shadow-xs w-full">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          {/* Brand & Partner Identity */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <NavLink
              to="/"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-black text-sm sm:text-base shadow-sm shrink-0"
              title="Zosh Bazaar Delivery Partner"
            >
              <Truck size={18} />
            </NavLink>

            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-extrabold leading-tight flex items-center gap-1.5 truncate">
                <span className="truncate max-w-[110px] sm:max-w-[160px] md:max-w-none">
                  {partner?.name || "Delivery Partner"}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                  ({partner?.agentId || "AGT"})
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    !isShiftActive
                      ? "bg-slate-400"
                      : onBreak
                      ? "bg-amber-400 animate-pulse"
                      : "bg-emerald-500 animate-pulse"
                  }`}
                />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">
                  {!isShiftActive ? "OFF DUTY" : onBreak ? "ON BREAK" : "ONLINE"}
                </span>
                {partner?.vehicle?.plateNumber && (
                  <span className="hidden lg:inline-flex items-center gap-1 text-[10px] text-muted-foreground border-l border-border pl-1.5 font-mono">
                    <Bike size={11} className="text-primary" />
                    <span>{partner.vehicle.plateNumber}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Desktop Navigation Links (>= md) */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === "/"}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`
                  }
                >
                  <Icon size={15} />
                  <span>{link.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Action Controls */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Quick Break Button */}
            {isShiftActive && (
              <button
                onClick={handleToggleBreak}
                className={`px-2 py-1.5 sm:px-2.5 rounded-xl border text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  onBreak
                    ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40"
                    : "hover:bg-muted text-muted-foreground border-border"
                }`}
                title={onBreak ? "Resume Duty" : "Take a Break"}
              >
                <Coffee size={15} />
                <span className="hidden sm:inline text-[11px]">{onBreak ? "Resume" : "Break"}</span>
              </button>
            )}

            {/* Emergency SOS Shortcut */}
            <button
              onClick={() => navigate("/safety")}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-destructive/30 text-destructive bg-destructive/10 hover:bg-destructive/20 font-bold text-xs flex items-center gap-1.5 transition-colors"
              title="Emergency SOS & Incident Triage"
              aria-label="Emergency SOS"
            >
              <AlertTriangle size={15} />
              <span className="hidden sm:inline text-[11px]">SOS</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-1.5 sm:p-2 rounded-xl border border-border text-muted-foreground hover:bg-muted transition-colors"
              title="Toggle Light/Dark Theme"
              aria-label="Toggle Theme"
            >
              {actualTheme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
