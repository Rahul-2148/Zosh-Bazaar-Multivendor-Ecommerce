import React, { useState, useMemo } from "react";
import { useActiveRoute } from "../../context/ActiveRouteContext";
import { StopCard } from "../../components/delivery/StopCard";
import { Search, Filter, RefreshCw, MapPin } from "lucide-react";

export const RouteStopsList: React.FC = () => {
  const { route, activeStop, refreshRoute, loading } = useActiveRoute();
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "DELIVERED" | "FAILED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

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
