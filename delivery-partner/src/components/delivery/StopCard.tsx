import React from "react";
import { RouteStop } from "../../api/partnerApi";
import { StatusPill } from "../common/StatusPill";
import { MapPin, IndianRupee, ShieldCheck, ChevronRight, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface StopCardProps {
  stop: RouteStop;
  isCurrent?: boolean;
}

export const StopCard: React.FC<StopCardProps> = ({ stop, isCurrent = false }) => {
  const navigate = useNavigate();

  const isDelivered = stop.status === "DELIVERED";
  const isFailed = stop.status === "FAILED";

  return (
    <div
      onClick={() => navigate(`/stop/${stop._id}`)}
      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
        isCurrent
          ? "bg-primary/5 border-primary shadow-xs ring-1 ring-primary/20"
          : isDelivered
          ? "bg-surface/50 border-border/50 opacity-70"
          : isFailed
          ? "bg-destructive/5 border-destructive/30"
          : "bg-card border-border hover:border-border-strong hover:bg-surface"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2">
          <span
            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
              isCurrent
                ? "bg-primary text-primary-foreground"
                : isDelivered
                ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                : isFailed
                ? "bg-rose-500/20 text-rose-600 dark:text-rose-400"
                : "bg-muted text-muted-foreground"
            }`}
          >
            #{stop.stopIndex}
          </span>
          <div>
            <h4 className="text-xs font-bold leading-snug">{stop.customerName}</h4>
            <span className="text-[10px] text-muted-foreground font-mono">{stop.trackingNumber}</span>
          </div>
        </div>
        <StatusPill status={stop.status} size="sm" />
      </div>

      <p className="text-xs text-muted-foreground line-clamp-2 mb-2 flex items-start gap-1">
        <MapPin size={13} className="shrink-0 mt-0.5 text-primary" />
        <span>{stop.address}</span>
      </p>

      <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-border/50">
        <div className="flex items-center gap-2">
          {stop.paymentType === "COD" ? (
            <span className="inline-flex items-center gap-0.5 text-amber-600 dark:text-amber-400 font-bold">
              <IndianRupee size={12} />
              <span>₹{stop.codAmount} (COD)</span>
            </span>
          ) : (
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">Prepaid</span>
          )}

          {stop.otpRequired && (
            <span className="inline-flex items-center gap-0.5 text-blue-600 dark:text-blue-400">
              <ShieldCheck size={12} />
              <span>OTP</span>
            </span>
          )}

          <span className="text-muted-foreground flex items-center gap-0.5">
            <Package size={12} />
            <span>{stop.packagesCount || 1} pkg</span>
          </span>
        </div>

        <div className="flex items-center gap-1 text-primary font-bold text-xs">
          <span>{isDelivered ? "Details" : "Action"}</span>
          <ChevronRight size={14} />
        </div>
      </div>
    </div>
  );
};
