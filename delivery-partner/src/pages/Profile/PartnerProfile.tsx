import React from "react";
import { usePartnerAuth } from "../../context/PartnerAuthContext";
import { useNavigate } from "react-router-dom";
import {
  User,
  ShieldCheck,
  Bike,
  BatteryCharging,
  Star,
  Building,
  CreditCard,
  LogOut,
  Phone,
  Mail,
} from "lucide-react";

export const PartnerProfile: React.FC = () => {
  const { partner, logout } = usePartnerAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <span className="text-[10px] font-black uppercase tracking-wider text-primary">
          Partner Account
        </span>
        <h2 className="text-base sm:text-xl font-extrabold flex items-center gap-2 text-foreground">
          <User size={20} className="text-primary" />
          <span>Profile & Vehicle Compliance</span>
        </h2>
      </div>

      {/* Partner Identity Card */}
      <div className="bg-card border border-border rounded-3xl p-5 sm:p-6 shadow-xs flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-black text-2xl shrink-0">
          {partner?.name?.charAt(0) || "P"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-black text-foreground truncate">
              {partner?.name || "Delivery Partner"}
            </h2>
            <span className="p-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck size={16} />
            </span>
          </div>
          <div className="text-xs sm:text-sm font-mono text-muted-foreground mt-0.5">
            {partner?.agentId || "AGT-001"}
          </div>

          <div className="flex items-center gap-1.5 text-amber-500 text-xs sm:text-sm font-black mt-1">
            <Star size={14} className="fill-current" />
            <span>{partner?.rating || 4.9} Customer Rating</span>
          </div>
        </div>
      </div>

      {/* 2-Column Responsive Grid on md: and above */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Contact & Hub Details */}
        <div className="bg-card border border-border rounded-3xl p-4 sm:p-5 shadow-xs space-y-3 text-xs sm:text-sm">
          <h4 className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
            Contact & Hub Station
          </h4>

          <div className="flex items-center justify-between py-1.5 border-b border-border/50">
            <span className="text-muted-foreground flex items-center gap-2">
              <Phone size={14} />
              <span>Phone</span>
            </span>
            <span className="font-bold text-foreground font-mono">{partner?.phone || "+91 98765 43210"}</span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-border/50">
            <span className="text-muted-foreground flex items-center gap-2">
              <Mail size={14} />
              <span>Email</span>
            </span>
            <span className="font-bold text-foreground truncate max-w-[180px] sm:max-w-none">
              {partner?.email || "partner@zoshbazaar.com"}
            </span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-muted-foreground flex items-center gap-2">
              <Building size={14} />
              <span>Assigned Hub</span>
            </span>
            <span className="font-bold text-foreground text-right truncate max-w-[180px] sm:max-w-none">
              {partner?.assignedHub?.name || "Bengaluru South Last-Mile Hub"}
            </span>
          </div>
        </div>

        {/* Vehicle Details */}
        <div className="bg-card border border-border rounded-3xl p-4 sm:p-5 shadow-xs space-y-3 text-xs sm:text-sm">
          <h4 className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
            Registered Vehicle
          </h4>

          <div className="flex items-center justify-between py-1.5 border-b border-border/50">
            <span className="text-muted-foreground flex items-center gap-2">
              <Bike size={15} className="text-primary" />
              <span>Vehicle Type</span>
            </span>
            <span className="font-bold text-foreground">
              {partner?.vehicle?.vehicleType?.replace(/_/g, " ") || "Electric Scooter"}
            </span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-border/50">
            <span className="text-muted-foreground">Plate Number</span>
            <span className="font-mono font-bold text-foreground">
              {partner?.vehicle?.plateNumber || "KA 01 EK 4920"}
            </span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-muted-foreground flex items-center gap-2">
              <BatteryCharging size={15} className="text-emerald-500" />
              <span>Battery Level</span>
            </span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {partner?.vehicle?.batteryLevel || 88}% Charged
            </span>
          </div>
        </div>

        {/* Payout Bank Profile */}
        <div className="bg-card border border-border rounded-3xl p-4 sm:p-5 shadow-xs space-y-2.5 text-xs sm:text-sm md:col-span-2">
          <h4 className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
            Direct Payout Account
          </h4>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                <CreditCard size={18} />
              </div>
              <div>
                <div className="font-bold text-sm sm:text-base">HDFC Bank •••• 4921</div>
                <div className="text-[11px] text-muted-foreground">Direct Deposit Account Active</div>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-extrabold text-[11px]">
              VERIFIED
            </span>
          </div>
        </div>
      </div>

      {/* Logout Action */}
      <button
        onClick={handleLogout}
        className="w-full py-3.5 sm:py-4 rounded-2xl border border-destructive/30 bg-destructive/10 hover:bg-destructive/20 text-destructive font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors active:scale-98"
      >
        <LogOut size={16} />
        <span>Sign Out Delivery Partner</span>
      </button>
    </div>
  );
};
