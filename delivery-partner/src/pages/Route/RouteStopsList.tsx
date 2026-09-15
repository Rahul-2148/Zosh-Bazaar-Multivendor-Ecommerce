import React, { useState, useMemo, useEffect } from "react";
import { useActiveRoute } from "../../context/ActiveRouteContext";
import { StopCard } from "../../components/delivery/StopCard";
import { Search, RefreshCw, MapPin, Sparkles, Navigation } from "lucide-react";

export const RouteStopsList: React.FC = () => {
  const { route, activeStop, refreshRoute, loading } = useActiveRoute();
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "DELIVERED" | "FAILED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [aiAssistance, setAiAssistance] = useState<any>(null);

  useEffect(() => {
    fetch("http://localhost:5000/api/v1/ai/delivery/stop-assistance")
      .then((res) => res.json())
      .then((data) => setAiAssistance(data))
      .catch(() => {});
  }, []);

  const filteredStops = useMemo(() => {
    if (!route?.stops) return [];

    return route.stops.filter((stop) => {
      // Status filter
      if (filter === "PENDING" && (stop.status === "DELIVERED" || stop.status === "FAILED")) {
        return false;
      }
      if (filter === "DELIVERED" && stop.status !== "DELIVERED") {
        return false;
      }
      if (filter === "FAILED" && stop.status !== "FAILED") {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = stop.customerName?.toLowerCase().includes(q);
        const matchesAddr = stop.address?.toLowerCase().includes(q);
        const matchesTrk = stop.trackingNumber?.toLowerCase().includes(q);
        return matchesName || matchesAddr || matchesTrk;
      }

      return true;
    });
  }, [route?.stops, filter, searchQuery]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Route Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-black tracking-wider uppercase text-primary">
            Stops Roster
          </span>
          <h2 className="text-base sm:text-xl font-extrabold flex items-center gap-2 text-foreground">
            <MapPin size={18} className="text-primary" />
            <span>{route ? `${route.routeCode} (${route.stops.length} Stops)` : "Assigned Stops"}</span>
          </h2>
        </div>

        <button
          onClick={refreshRoute}
          disabled={loading}
          className="p-2 sm:px-3 sm:py-2 rounded-xl border border-border text-muted-foreground hover:bg-muted font-bold text-xs flex items-center gap-1.5 transition-colors"
          title="Refresh Route Stops"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* AI Driver Stop Assistance Card */}
      {aiAssistance?.nextBestStop && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-900 to-indigo-950 text-white border border-teal-500/30 shadow-md space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-teal-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles size={15} />
              <span>AI Next-Best-Stop Dispatch</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-400/20 text-teal-200 border border-teal-400/30">
              {Math.round(aiAssistance.nextBestStop.deliverySuccessProbability * 100)}% Success Rate
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/5 p-3 rounded-xl border border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-teal-300">
                  Stop #{aiAssistance.nextBestStop.stopSequence}
                </span>
                <span className="text-xs font-bold text-white">
                  {aiAssistance.nextBestStop.customerName}
                </span>
                <span className="text-[11px] text-slate-300 font-medium">
                  • ETA: {aiAssistance.nextBestStop.predictedETA}
                </span>
              </div>
              <p className="text-xs text-slate-200 mt-0.5">
                {aiAssistance.nextBestStop.address} ({aiAssistance.nextBestStop.pincode})
              </p>
              <p className="text-[11px] text-amber-300/90 mt-1">
                📌 {aiAssistance.nextBestStop.addressNotes}
              </p>
            </div>

            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                aiAssistance.nextBestStop.address
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm shrink-0"
            >
              <Navigation size={14} />
              <span>Start Navigation</span>
            </a>
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customer name, address, or tracking..."
            className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-xl text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-primary focus:outline-hidden"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 shrink-0">
          {(["ALL", "PENDING", "DELIVERED", "FAILED"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 sm:px-3.5 py-2 rounded-xl text-xs font-extrabold uppercase transition-colors shrink-0 ${
                filter === tab
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-card border border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Stops Feed (2-Column Grid on md: and above) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 pt-1">
        {filteredStops.length > 0 ? (
          filteredStops.map((stop) => (
            <StopCard
              key={stop._id}
              stop={stop}
              isCurrent={activeStop?._id === stop._id}
            />
          ))
        ) : (
          <div className="col-span-full p-8 text-center bg-card border border-border rounded-3xl space-y-1.5 text-muted-foreground">
            <p className="text-sm font-bold text-foreground">No matching stops found</p>
            <p className="text-xs">Try adjusting your search query or filter tab.</p>
          </div>
        )}
      </div>
    </div>
  );
};
