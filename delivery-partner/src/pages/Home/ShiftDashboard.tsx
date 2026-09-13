import React from "react";
import { usePartnerAuth } from "../../context/PartnerAuthContext";
import { useActiveRoute } from "../../context/ActiveRouteContext";
import { NextStopHero } from "../../components/delivery/NextStopHero";
import { useNavigate } from "react-router-dom";
import {
  Clock,
  Navigation,
  Scan,
  IndianRupee,
  AlertTriangle,
  RefreshCw,
  Power,
  Bike,
  Building,
  Radio,
  ChevronRight,
} from "lucide-react";

export const ShiftDashboard: React.FC = () => {
  const { partner, updateShift } = usePartnerAuth();
  const {
    route,
    activeStop,
    completedStopsCount,
    remainingStopsCount,
    refreshRoute,
    startRoute,
  } = useActiveRoute();
  const navigate = useNavigate();

  const isShiftActive = partner?.shift?.isShiftActive;

  const handleShiftToggle = async () => {
    try {
      if (isShiftActive) {
        await updateShift("END_SHIFT");
      } else {
        await updateShift("START_SHIFT");
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Shift update failed");
    }
  };

  const progressPercent = Math.round(
    (completedStopsCount / (route?.totalStops || 1)) * 100
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. Shift Status & Quick Action Bar (Full Width) */}
      <div className="bg-card border border-border rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-xs flex items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
            Current Shift
          </span>
          <h2 className="text-sm sm:text-base font-extrabold flex items-center gap-2 mt-0.5 truncate">
            <span
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                isShiftActive ? "bg-emerald-500 animate-ping" : "bg-slate-400"
              }`}
            />
            <span className="truncate">{isShiftActive ? "Shift is Active" : "Shift is Offline"}</span>
          </h2>
        </div>

        <button
          onClick={handleShiftToggle}
          className={`px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-xl sm:rounded-2xl font-black text-xs flex items-center gap-1.5 shadow-xs transition-colors shrink-0 active:scale-95 ${
            isShiftActive
              ? "bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive/20"
              : "bg-emerald-600 text-white hover:bg-emerald-700"
          }`}
        >
          <Power size={14} />
          <span>{isShiftActive ? "End Shift" : "Start Shift"}</span>
        </button>
      </div>

      {/* Main Grid: Responsive 1-Column on Mobile, 2-Column Master-Detail on Desktop/Tablet */}
      {route ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
          {/* LEFT / MAIN COLUMN (7 cols on Desktop): NEXT ACTION HERO & ACTIVE WORKFLOW */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-5">
            {/* NEXT STOP HERO (Top Priority Focal Point) */}
            <NextStopHero
              stop={activeStop}
              routeStatus={route.status}
              totalStops={route.totalStops}
              onStartRoute={startRoute}
            />

            {/* Quick Operational Action Shortcuts */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <button
                onClick={() => navigate("/scanner")}
                className="p-3 sm:p-4 rounded-2xl border border-border bg-card hover:bg-surface flex flex-col items-center justify-center gap-1.5 text-center shadow-xs transition-colors active:scale-98"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Scan size={20} />
                </div>
                <span className="text-[11px] sm:text-xs font-black truncate w-full">Scan Parcel</span>
              </button>

              <button
                onClick={() => navigate("/earnings")}
                className="p-3 sm:p-4 rounded-2xl border border-border bg-card hover:bg-surface flex flex-col items-center justify-center gap-1.5 text-center shadow-xs transition-colors active:scale-98"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <IndianRupee size={20} />
                </div>
                <span className="text-[11px] sm:text-xs font-black truncate w-full">
                  ₹{partner?.earnings?.todayBasePay || 0} Today
                </span>
              </button>

              <button
                onClick={() => navigate("/safety")}
                className="p-3 sm:p-4 rounded-2xl border border-border bg-card hover:bg-surface flex flex-col items-center justify-center gap-1.5 text-center shadow-xs transition-colors active:scale-98"
              >
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <AlertTriangle size={20} />
                </div>
                <span className="text-[11px] sm:text-xs font-black truncate w-full">Report SOS</span>
              </button>
            </div>
          </div>

          {/* RIGHT / CONTEXT COLUMN (5 cols on Desktop): ROUTE METRICS, STOPS ROSTER & TELEMETRY */}
          <div className="lg:col-span-5 space-y-4 sm:space-y-5">
            {/* Daily Assignment & Route Progress Card */}
            <div className="bg-card border border-border rounded-3xl p-4 sm:p-5 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black tracking-wider uppercase text-primary">
                    Daily Assignment
                  </span>
                  <h3 className="text-base font-extrabold text-foreground">{route.routeCode}</h3>
                </div>
                <button
                  onClick={refreshRoute}
                  className="p-2 rounded-xl border border-border text-muted-foreground hover:bg-muted transition-colors"
                  title="Refresh Route Data"
                >
                  <RefreshCw size={15} />
                </button>
              </div>

              {/* 3 Metric Tiles (Responsively Sized) */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-surface rounded-2xl p-2 sm:p-2.5 border border-border/70 min-w-0">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase truncate block">
                    Total
                  </span>
                  <p className="text-base sm:text-xl font-black text-foreground mt-0.5">
                    {route.totalStops}
                  </p>
                </div>
                <div className="bg-surface rounded-2xl p-2 sm:p-2.5 border border-border/70 min-w-0">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase truncate block">
                    Done
                  </span>
                  <p className="text-base sm:text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {completedStopsCount}
                  </p>
                </div>
                <div className="bg-surface rounded-2xl p-2 sm:p-2.5 border border-border/70 min-w-0">
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase truncate block">
                    Left
                  </span>
                  <p className="text-base sm:text-xl font-black text-blue-600 dark:text-blue-400 mt-0.5">
                    {remainingStopsCount}
                  </p>
                </div>
              </div>

              {/* Route Progress Bar */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-xs font-bold text-muted-foreground">
                  <span>Route Completion</span>
                  <span className="text-primary font-black">{progressPercent}%</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-surface border border-border overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Route Metrics (Distance & Estimated Duration) */}
              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground pt-1 border-t border-border/70">
                <span className="flex items-center gap-1.5">
                  <Navigation size={13} className="text-primary" />
                  <span>{route.totalDistanceKm || 14.8} km path</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={13} className="text-primary" />
                  <span>~{route.estimatedDurationMinutes || 110} min</span>
                </span>
              </div>
            </div>

            {/* Upcoming Stops Roster Preview */}
            <div className="bg-card border border-border rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Upcoming Stops Roster
                </h4>
                <button
                  onClick={() => navigate("/route")}
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5"
                >
                  <span>View All</span>
                  <ChevronRight size={13} />
                </button>
              </div>

              <div className="space-y-2">
                {route.stops.slice(0, 3).map((stop) => (
                  <div
                    key={stop._id}
                    onClick={() => navigate(`/stop/${stop._id}`)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                      activeStop?._id === stop._id
                        ? "bg-primary/10 border-primary/30"
                        : "bg-surface border-border/70 hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs shrink-0 ${
                          stop.status === "DELIVERED"
                            ? "bg-emerald-500 text-white"
                            : stop.status === "ARRIVED"
                            ? "bg-amber-500 text-white"
                            : "bg-primary text-primary-foreground"
                        }`}
                      >
                        {stop.stopIndex}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate text-foreground">
                          {stop.customerName}
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate">
                          {stop.address}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md uppercase shrink-0 ${
                        stop.status === "DELIVERED"
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : stop.status === "FAILED"
                          ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                          : "bg-surface text-muted-foreground"
                      }`}
                    >
                      {stop.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Hub Dispatch Telemetry */}
            <div className="bg-card border border-border rounded-3xl p-4 shadow-xs space-y-2 text-xs">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                Dispatch & Telemetry
              </h4>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Building size={12} className="text-primary" />
                    <span>Hub</span>
                  </span>
                  <span className="font-bold text-foreground">
                    {partner?.assignedHub?.name || "Bengaluru South Hub"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Bike size={12} className="text-primary" />
                    <span>Vehicle</span>
                  </span>
                  <span className="font-bold text-foreground font-mono">
                    {partner?.vehicle?.plateNumber ? `${partner.vehicle.plateNumber} (${partner.vehicle.batteryLevel ?? 100}% Bat)` : "No Vehicle"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Radio size={12} className="text-emerald-500" />
                    <span>Socket</span>
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live Room Connected
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State: Ready for Route Dispatch */
        <div className="bg-card border-2 border-dashed border-border rounded-3xl p-6 sm:p-10 text-center space-y-5 shadow-xs max-w-2xl mx-auto">
          <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
            <span
              className={`absolute inset-0 rounded-full ${
                isShiftActive ? "bg-emerald-500/20 animate-ping" : "bg-muted"
              }`}
            />
            <div
              className={`relative w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${
                isShiftActive ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
              }`}
            >
              <Navigation size={28} />
            </div>
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg font-black text-foreground">
              {isShiftActive ? "Ready for Route Dispatch" : "Shift is Offline"}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              {isShiftActive
                ? "You are online and available. Live dispatch from your hub coordinator will assign your delivery manifest here automatically."
                : "Tap 'Start Shift' above when you are ready to receive delivery route assignments from your hub dispatcher."}
            </p>
          </div>

          {/* Hub & Vehicle Card */}
          <div className="bg-surface rounded-2xl p-4 text-left border border-border/70 space-y-2 text-xs max-w-md mx-auto">
            <div className="flex items-center justify-between font-bold">
              <span className="text-muted-foreground uppercase text-[10px]">Assigned Hub</span>
              <span className="text-foreground">{partner?.assignedHub?.name || "Unassigned Hub"}</span>
            </div>
            <div className="flex items-center justify-between font-bold">
              <span className="text-muted-foreground uppercase text-[10px]">Vehicle</span>
              <span className="text-foreground">
                {partner?.vehicle?.plateNumber ? `${partner.vehicle.plateNumber} (${partner.vehicle.vehicleType || "SCOOTER"})` : "No Vehicle Assigned"}
              </span>
            </div>
            <div className="flex items-center justify-between font-bold">
              <span className="text-muted-foreground uppercase text-[10px]">Realtime Socket</span>
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Listening for Dispatch
              </span>
            </div>
          </div>

          <button
            onClick={refreshRoute}
            className="w-full max-w-md mx-auto py-3.5 rounded-2xl bg-surface border border-border hover:bg-muted text-foreground font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors active:scale-98"
          >
            <RefreshCw size={15} className="text-primary" />
            <span>Sync with Dispatch Server</span>
          </button>
        </div>
      )}
    </div>
  );
};
