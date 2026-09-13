import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  LocalShippingOutlined,
  AltRouteOutlined,
  WarehouseOutlined,
  PeopleAltOutlined,
  ReportProblemOutlined,
  HourglassBottomOutlined,
  CheckCircleOutline,
  QrCodeScannerOutlined,
  Inventory2Outlined,
  SpeedOutlined,
  ArrowForward,
  Refresh,
} from "@mui/icons-material";
import { logisticsApi } from "../../services/api";
import { useLogisticsSocket } from "../../context/LogisticsSocketContext";
import dayjs from "dayjs";

export const ControlTowerOverview: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { alerts, connected } = useLogisticsSocket();

  const fetchMetrics = async () => {
    try {
      setRefreshing(true);
      const res = await logisticsApi.getOverview();
      if (res.data?.data) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching control tower overview:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const overview = data?.liveOverview || {
    shipmentsToday: 0,
    totalShipments: 0,
    inTransit: 0,
    outForDelivery: 0,
    deliveredToday: 0,
    pendingDispatch: 0,
    failedDeliveries: 0,
    delayed: 0,
  };

  const sla = data?.sla || {
    onTrack: 0,
    atRisk: 0,
    breached: 0,
    onTimePercentage: 100,
  };

  const network = data?.networkHealth || {
    activeHubs: 0,
    activeAgents: 0,
    pendingManifests: 0,
    openExceptions: 0,
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header with Telemetry Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Mission Control & Logistics Overview
            </h1>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase border ${
                connected
                  ? "bg-success/10 text-success border-success/25"
                  : "bg-warning/10 text-warning border-warning/25"
              }`}
            >
              {connected ? "LIVE TELEMETRY ACTIVE" : "CONNECTING TO EVENT BUS"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Real-time supply chain telemetry, fulfillment lanes, SLA commitments, and fleet orchestration.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchMetrics}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-surface text-foreground text-xs font-medium transition-colors shadow-2xs"
          >
            <Refresh fontSize="small" className={refreshing ? "animate-spin" : ""} />
            <span>Sync</span>
          </button>

          <Link
            to="/scanner"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity shadow-xs"
          >
            <QrCodeScannerOutlined fontSize="small" />
            <span>Barcode Scanner</span>
          </Link>
        </div>
      </div>

      {/* Critical Interventions / Attention Bar */}
      {(overview.failedDeliveries > 0 || sla.breached > 0 || network.openExceptions > 0) && (
        <div className="p-3.5 rounded-2xl bg-destructive/10 border border-destructive/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-destructive font-semibold">
            <ReportProblemOutlined fontSize="small" />
            <span>
              ACTION REQUIRED: {sla.breached} SLA breach(es), {overview.failedDeliveries} failed delivery attempt(s), and {network.openExceptions} open exception(s).
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/exceptions"
              className="px-3 py-1 rounded-lg bg-destructive text-destructive-foreground font-medium text-[11px] hover:opacity-90"
            >
              Triage Exceptions
            </Link>
            <Link
              to="/sla"
              className="px-3 py-1 rounded-lg bg-surface border border-border text-foreground font-medium text-[11px] hover:bg-surface-hover"
            >
              View SLA Risk
            </Link>
          </div>
        </div>
      )}

      {/* Core Live Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* In Transit */}
        <div className="p-4 rounded-2xl bg-card border border-border shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>In Transit & Linehaul</span>
            <LocalShippingOutlined fontSize="small" className="text-info" />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
            {overview.inTransit}
          </div>
          <div className="text-[11px] text-muted-foreground">Moving through network nodes</div>
        </div>

        {/* Out for Delivery */}
        <div className="p-4 rounded-2xl bg-card border border-border shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Out for Delivery</span>
            <AltRouteOutlined fontSize="small" className="text-warning" />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-warning">
            {overview.outForDelivery}
          </div>
          <div className="text-[11px] text-muted-foreground">Assigned to last-mile couriers</div>
        </div>

        {/* Pending Dispatch */}
        <div className="p-4 rounded-2xl bg-card border border-border shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Pending Dispatch</span>
            <Inventory2Outlined fontSize="small" className="text-primary" />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
            {overview.pendingDispatch}
          </div>
          <div className="text-[11px] text-muted-foreground">In picking & packing queues</div>
        </div>

        {/* Delivered Today */}
        <div className="p-4 rounded-2xl bg-card border border-border shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Delivered Today</span>
            <CheckCircleOutline fontSize="small" className="text-success" />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-success">
            {overview.deliveredToday}
          </div>
          <div className="text-[11px] text-muted-foreground">Verified Proof of Delivery (POD)</div>
        </div>
      </div>

      {/* Network Health & SLA Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* SLA Performance Card */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <HourglassBottomOutlined fontSize="small" className="text-primary" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
                SLA Fulfillment Commitments
              </h2>
            </div>
            <Link to="/sla" className="text-[11px] text-primary hover:underline font-medium">
              Details →
            </Link>
          </div>

          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black font-mono text-foreground">
              {sla.onTimePercentage}%
            </span>
            <span className="text-xs text-muted-foreground">On-Time Delivery Target</span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono">
            <div className="p-2.5 rounded-xl bg-success/10 border border-success/20">
              <div className="text-lg font-bold text-success">{sla.onTrack}</div>
              <div className="text-[10px] uppercase font-sans text-muted-foreground">On Track</div>
            </div>
            <div className="p-2.5 rounded-xl bg-warning/10 border border-warning/20">
              <div className="text-lg font-bold text-warning">{sla.atRisk}</div>
              <div className="text-[10px] uppercase font-sans text-muted-foreground">At Risk</div>
            </div>
            <div className="p-2.5 rounded-xl bg-destructive/10 border border-destructive/20">
              <div className="text-lg font-bold text-destructive">{sla.breached}</div>
              <div className="text-[10px] uppercase font-sans text-muted-foreground">Breached</div>
            </div>
          </div>
        </div>

        {/* Network Infrastructure Health */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <SpeedOutlined fontSize="small" className="text-primary" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Network & Workforce Health
              </h2>
            </div>
            <Link to="/map" className="text-[11px] text-primary hover:underline font-medium">
              Live Map →
            </Link>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2 rounded-xl bg-surface">
              <span className="text-muted-foreground flex items-center gap-2">
                <WarehouseOutlined fontSize="inherit" className="text-info" /> Active Facilities & Hubs
              </span>
              <span className="font-bold font-mono text-foreground">{network.activeHubs}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-surface">
              <span className="text-muted-foreground flex items-center gap-2">
                <PeopleAltOutlined fontSize="inherit" className="text-success" /> Active Delivery Agents
              </span>
              <span className="font-bold font-mono text-foreground">{network.activeAgents}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-surface">
              <span className="text-muted-foreground flex items-center gap-2">
                <Inventory2Outlined fontSize="inherit" className="text-primary" /> Open Manifests / Bags
              </span>
              <span className="font-bold font-mono text-foreground">{network.pendingManifests}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-surface">
              <span className="text-muted-foreground flex items-center gap-2">
                <ReportProblemOutlined fontSize="inherit" className="text-destructive" /> Active Exceptions
              </span>
              <span className="font-bold font-mono text-foreground">{network.openExceptions}</span>
            </div>
          </div>
        </div>

        {/* Live Event Telemetry Stream */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-2xs space-y-3 flex flex-col">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Live Operations Feed
              </h2>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground">REAL-TIME</span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-52 divide-y divide-border/40 text-xs">
            {alerts.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-xs">
                Awaiting operational events. When parcels are scanned or dispatched, live signals will display here.
              </div>
            ) : (
              alerts.slice(0, 6).map((a) => (
                <div key={a.id} className="py-2 space-y-0.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-foreground">{a.title}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {dayjs(a.timestamp).format("HH:mm:ss")}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">{a.message}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-2">
        <Link
          to="/operations"
          className="p-4 rounded-2xl bg-card border border-border hover:border-primary/40 hover:bg-surface-hover transition-all group shadow-2xs flex items-center justify-between"
        >
          <div>
            <div className="text-xs font-bold text-foreground">Operations Lanes</div>
            <div className="text-[11px] text-muted-foreground">Kanban fulfillment tracking</div>
          </div>
          <ArrowForward fontSize="small" className="text-muted-foreground group-hover:text-primary transition-colors" />
        </Link>

        <Link
          to="/shipments"
          className="p-4 rounded-2xl bg-card border border-border hover:border-primary/40 hover:bg-surface-hover transition-all group shadow-2xs flex items-center justify-between"
        >
          <div>
            <div className="text-xs font-bold text-foreground">Shipment Register</div>
            <div className="text-[11px] text-muted-foreground">Search and audit all parcels</div>
          </div>
          <ArrowForward fontSize="small" className="text-muted-foreground group-hover:text-primary transition-colors" />
        </Link>

        <Link
          to="/map"
          className="p-4 rounded-2xl bg-card border border-border hover:border-primary/40 hover:bg-surface-hover transition-all group shadow-2xs flex items-center justify-between"
        >
          <div>
            <div className="text-xs font-bold text-foreground">Interactive Network Map</div>
            <div className="text-[11px] text-muted-foreground">Geospatial hubs and fleet</div>
          </div>
          <ArrowForward fontSize="small" className="text-muted-foreground group-hover:text-primary transition-colors" />
        </Link>

        <Link
          to="/hubs"
          className="p-4 rounded-2xl bg-card border border-border hover:border-primary/40 hover:bg-surface-hover transition-all group shadow-2xs flex items-center justify-between"
        >
          <div>
            <div className="text-xs font-bold text-foreground">Hub Facilities</div>
            <div className="text-[11px] text-muted-foreground">Capacity and backlog control</div>
          </div>
          <ArrowForward fontSize="small" className="text-muted-foreground group-hover:text-primary transition-colors" />
        </Link>
      </div>
    </div>
  );
};
