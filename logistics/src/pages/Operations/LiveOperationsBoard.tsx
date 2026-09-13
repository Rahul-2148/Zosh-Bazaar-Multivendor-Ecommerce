import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Refresh,
  LocalShippingOutlined,
  ArrowForward,
  CheckCircleOutline,
  HourglassEmpty,
  Inventory2Outlined,
  AltRouteOutlined,
  PersonPinCircleOutlined,
} from "@mui/icons-material";
import { logisticsApi } from "../../services/api";
import { StatusBadge } from "../../components/common/StatusBadge";
import { SlaIndicator } from "../../components/common/SlaIndicator";

export const LiveOperationsBoard: React.FC = () => {
  const [lanes, setLanes] = useState<any>({
    READY_TO_PICK: [],
    PICKING: [],
    PACKING: [],
    READY_FOR_DISPATCH: [],
    IN_TRANSIT: [],
    AT_HUB: [],
    OUT_FOR_DELIVERY: [],
    DELIVERED: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedSla, setSelectedSla] = useState("ALL");
  const navigate = useNavigate();

  const fetchBoard = async () => {
    try {
      setRefreshing(true);
      const res = await logisticsApi.getOperationsBoard({
        city: selectedCity,
        slaStatus: selectedSla !== "ALL" ? selectedSla : undefined,
      });
      if (res.data?.lanes) {
        setLanes(res.data.lanes);
      }
    } catch (err) {
      console.error("Failed to load operations board:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBoard();
  }, [selectedCity, selectedSla]);

  const laneConfigs = [
    { key: "READY_TO_PICK", title: "Ready to Pick", color: "border-primary/20", icon: <Inventory2Outlined fontSize="small" className="text-primary" /> },
    { key: "PICKING", title: "Picking in Progress", color: "border-primary/30", icon: <HourglassEmpty fontSize="small" className="text-primary" /> },
    { key: "PACKING", title: "Packing & Sorting", color: "border-info/20", icon: <Inventory2Outlined fontSize="small" className="text-info" /> },
    { key: "READY_FOR_DISPATCH", title: "Ready for Dispatch", color: "border-info/30", icon: <CheckCircleOutline fontSize="small" className="text-info" /> },
    { key: "IN_TRANSIT", title: "In Linehaul / Transit", color: "border-info/40", icon: <LocalShippingOutlined fontSize="small" className="text-info" /> },
    { key: "AT_HUB", title: "At Destination Hub", color: "border-warning/30", icon: <PersonPinCircleOutlined fontSize="small" className="text-warning" /> },
    { key: "OUT_FOR_DELIVERY", title: "Out for Delivery", color: "border-warning/40", icon: <AltRouteOutlined fontSize="small" className="text-warning" /> },
    { key: "DELIVERED", title: "Delivered (POD)", color: "border-success/30", icon: <CheckCircleOutline fontSize="small" className="text-success" /> },
  ];

  if (loading && !refreshing) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header and Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Live Operations & Fulfillment Board
          </h1>
          <p className="text-xs text-muted-foreground">
            Real-time pipeline progression across physical picking, packing, linehaul hubs, and last-mile couriers.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* SLA Filter */}
          <select
            value={selectedSla}
            onChange={(e) => setSelectedSla(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-border bg-card text-foreground text-xs font-medium outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">All SLAs</option>
            <option value="ON_TRACK">On Track</option>
            <option value="AT_RISK">At Risk</option>
            <option value="BREACHED">Breached</option>
          </select>

          {/* City Input */}
          <input
            type="text"
            placeholder="Filter by city..."
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground text-xs font-medium outline-none focus:ring-1 focus:ring-primary w-36"
          />

          <button
            onClick={fetchBoard}
            disabled={refreshing}
            className="p-2 rounded-xl border border-border bg-card hover:bg-surface text-foreground transition-colors shadow-2xs"
            title="Refresh Board"
          >
            <Refresh fontSize="small" className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Horizontal Kanban Lanes */}
      <div className="flex gap-4 overflow-x-auto pb-4 pt-1 min-h-[70vh]">
        {laneConfigs.map((cfg) => {
          const items = lanes[cfg.key] || [];

          return (
            <div
              key={cfg.key}
              className="w-80 shrink-0 flex flex-col rounded-2xl bg-surface/50 border border-border shadow-2xs overflow-hidden"
            >
              {/* Lane Header */}
              <div className={`px-3.5 py-3 border-b ${cfg.color} bg-card flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  {cfg.icon}
                  <span className="text-xs font-bold text-foreground">{cfg.title}</span>
                </div>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-surface border border-border text-foreground">
                  {items.length}
                </span>
              </div>

              {/* Lane Items Scroll */}
              <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-230px)]">
                {items.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground text-xs">
                    No parcels in this lane
                  </div>
                ) : (
                  items.map((item: any) => (
                    <div
                      key={item._id}
                      onClick={() => navigate(`/shipments/${item._id}`)}
                      className="p-3.5 rounded-xl bg-card border border-border hover:border-primary/40 transition-all cursor-pointer shadow-2xs hover:shadow-xs space-y-2.5 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                          {item.shipmentId}
                        </span>
                        <StatusBadge status={item.status} size="sm" />
                      </div>

                      <div className="text-[11px] text-muted-foreground space-y-0.5">
                        <div className="truncate font-medium text-foreground">
                          {item.deliveryAddress?.name} · {item.deliveryAddress?.city}
                        </div>
                        <div className="font-mono text-[10px]">
                          {item.trackingNumber} · {item.packageDetails?.weightKg || 0.8}kg
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[11px]">
                        <SlaIndicator
                          slaStatus={item.sla?.slaStatus || "ON_TRACK"}
                          promisedTo={item.sla?.promisedTo}
                          size="sm"
                        />
                        <span className="text-primary text-xs flex items-center gap-0.5 font-medium group-hover:underline">
                          View <ArrowForward fontSize="inherit" />
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
