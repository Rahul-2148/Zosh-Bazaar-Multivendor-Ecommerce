import React, { useState } from "react";
import { RouteStop } from "../../api/partnerApi";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  Navigation,
  Phone,
  IndianRupee,
  ShieldAlert,
  ArrowRight,
  Package,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { StatusPill } from "../common/StatusPill";

interface NextStopHeroProps {
  stop: RouteStop | null;
  routeStatus?: string;
  totalStops?: number;
  onStartRoute?: () => void;
}

export const NextStopHero: React.FC<NextStopHeroProps> = ({
  stop,
  routeStatus,
  totalStops = 0,
  onStartRoute,
}) => {
  const navigate = useNavigate();
  const [showFullAddress, setShowFullAddress] = useState(false);

  if (!stop) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 text-center space-y-2.5 shadow-xs">
        <div className="w-14 h-14 rounded-full bg-emerald-500/15 text-emerald-500 mx-auto flex items-center justify-center font-black text-xl">
          ✓
        </div>
        <h3 className="font-extrabold text-base text-foreground">All Stops Completed!</h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
          Great job! There are no pending delivery stops remaining on this route. Return to the hub or await the next assignment.
        </p>
      </div>
    );
  }

  const isPlanned = routeStatus === "PLANNED";
  const isArrived = stop.status === "ARRIVED";

  const handleExternalNav = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (stop.location?.lat && stop.location?.lng) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${stop.location.lat},${stop.location.lng}`,
        "_blank"
      );
    }
  };

  const handlePhoneCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (stop.customerPhone) {
      window.location.href = `tel:${stop.customerPhone}`;
    }
  };

  return (
    <div className="bg-card border-2 border-primary/50 dark:border-primary/40 rounded-3xl p-4 sm:p-5 shadow-lg relative overflow-hidden transition-all">
      {/* Top Banner: Stop Number & Status */}
      <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-border/80">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-1 rounded-lg bg-primary text-primary-foreground font-black text-xs sm:text-sm tracking-wide shadow-xs">
            STOP #{stop.stopIndex} {totalStops ? `OF ${totalStops}` : ""}
          </span>
          <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-primary">
            Next Action
          </span>
        </div>
        <div className="flex items-center gap-2">
          {stop.timeWindow && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-muted-foreground font-medium bg-surface px-2 py-0.5 rounded-md border border-border">
              <Clock size={12} className="text-primary" />
              <span>{stop.timeWindow.from}–{stop.timeWindow.to}</span>
            </span>
          )}
          <StatusPill status={stop.status} size="sm" />
        </div>
      </div>

      {/* Customer Info & Direct Call Action */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
            Customer Recipient
          </span>
          <h3 className="text-lg sm:text-xl font-black text-foreground leading-tight truncate">
            {stop.customerName}
          </h3>
          <span className="text-xs text-muted-foreground font-mono">
            {stop.trackingNumber || stop.shipmentId}
          </span>
        </div>

        {stop.customerPhone && (
          <button
            onClick={handlePhoneCall}
            className="h-10 px-3.5 rounded-xl bg-primary/10 text-primary border border-primary/25 hover:bg-primary/20 font-extrabold text-xs flex items-center gap-1.5 transition-colors shrink-0 active:scale-95"
            title="Call Customer"
          >
            <Phone size={15} />
            <span>Call</span>
          </button>
        )}
      </div>

      {/* Structured Address Block */}
      <div className="bg-surface rounded-2xl p-3 sm:p-3.5 mb-3.5 border border-border/80 space-y-2">
        <div className="flex items-start gap-2">
          <MapPin size={16} className="shrink-0 mt-0.5 text-primary" />
          <div className="flex-1 min-w-0">
            <p className={`text-xs sm:text-sm font-semibold text-foreground leading-relaxed ${!showFullAddress ? "line-clamp-2" : ""}`}>
              {stop.address}
            </p>
            {stop.address && stop.address.length > 60 && (
              <button
                onClick={() => setShowFullAddress(!showFullAddress)}
                className="text-[11px] text-primary font-bold mt-1 inline-flex items-center gap-0.5 hover:underline"
              >
                <span>{showFullAddress ? "Show less" : "View full address"}</span>
                {showFullAddress ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            )}
          </div>
        </div>

        {/* Customer Special Note / Instructions */}
        {stop.customerInstructions && (
          <div className="text-xs text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 rounded-xl flex items-start gap-1.5 font-semibold">
            <ShieldAlert size={14} className="shrink-0 mt-0.5" />
            <span>Note: {stop.customerInstructions}</span>
          </div>
        )}
      </div>

      {/* Attributes Badges: Payment & Package Count */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4 text-xs">
        <div className="bg-surface rounded-xl p-2.5 border border-border/70 flex items-center justify-between">
          <span className="text-[11px] font-medium text-muted-foreground">Payment</span>
          {stop.paymentType === "COD" ? (
            <span className="font-extrabold text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
              <IndianRupee size={13} />
              <span>₹{stop.codAmount} COD</span>
            </span>
          ) : (
            <span className="font-bold text-emerald-600 dark:text-emerald-400">Prepaid</span>
          )}
        </div>

        <div className="bg-surface rounded-xl p-2.5 border border-border/70 flex items-center justify-between">
          <span className="text-[11px] font-medium text-muted-foreground">Package</span>
          <span className="font-extrabold text-foreground flex items-center gap-1">
            <Package size={14} className="text-primary" />
            <span>{stop.packagesCount || 1} Item(s)</span>
          </span>
        </div>
      </div>

      {/* Responsive Thumb Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
        <button
          onClick={handleExternalNav}
          className="h-12 sm:h-13 px-4 rounded-2xl border border-border bg-surface hover:bg-muted font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors active:scale-98"
          title="Open destination in Google Maps"
        >
          <Navigation size={16} className="text-primary" />
          <span>Navigate in Maps</span>
        </button>

        {isPlanned ? (
          <button
            onClick={onStartRoute}
            className="flex-1 h-12 sm:h-13 rounded-2xl bg-primary text-primary-foreground font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg hover:bg-primary/90 active:scale-98 transition-all"
          >
            <span>Start Route Now</span>
            <ArrowRight size={18} />
          </button>
        ) : (
          <button
            onClick={() => navigate(`/stop/${stop._id}`)}
            className={`flex-1 h-12 sm:h-13 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-all ${
              isArrived
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-primary hover:bg-primary/90 text-primary-foreground"
            }`}
          >
            <span>{isArrived ? "Complete Delivery" : "Execute Stop"}</span>
            <ArrowRight size={18} />
          </button>
        )}
      </div>
    </div>
  );
};
