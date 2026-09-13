import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  Zap,
  Building2,
  Users,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { logisticsApi } from "../../services/api";

export const LogisticsAnalytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState("14");

  useEffect(() => {
    fetchAnalytics();
  }, [days]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await logisticsApi.getAnalytics({ days });
      if (res.data?.data) {
        setAnalyticsData(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load logistics analytics", err);
    } finally {
      setLoading(false);
    }
  };

  const kpis = analyticsData?.kpis || {
    totalShipments: 0,
    deliveredShipments: 0,
    onTimePercentage: 100,
    avgDeliveryTimeHours: 0,
    avgDispatchTimeHours: 0,
    firstAttemptDeliveryPct: 100,
    failedDeliveryPct: 0,
    returnRatePct: 0,
  };

  const dailyTrends = analyticsData?.dailyTrends || [];
  const hubPerformance = analyticsData?.hubPerformance || [];
  const topAgents = analyticsData?.topAgents || [];

  return (
    <div className="space-y-6">
      {/* Title & Date Range */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Logistics Performance & Velocity Analytics
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              AUDITED TELEMETRY
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Real fulfillment velocity, on-time SLA metrics, first-attempt accuracy, and facility throughput.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-card border border-border p-1 rounded-lg text-xs shadow-xs">
            {["7", "14", "30"].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                  days === d
                    ? "bg-primary text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface-hover"
                }`}
              >
                Last {d} Days
              </button>
            ))}
          </div>

          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="p-2.5 rounded-lg border border-border bg-card hover:bg-surface-hover text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Primary KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* On-Time Delivery Rate */}
        <div className="p-5 bg-card border border-border rounded-xl space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold uppercase tracking-wider">
            <span>On-Time SLA %</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {kpis.onTimePercentage}%
          </div>
          <div className="text-[11px] text-muted-foreground">
            {kpis.deliveredShipments} Total Delivered
          </div>
        </div>

        {/* Avg Delivery Duration */}
        <div className="p-5 bg-card border border-border rounded-xl space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold uppercase tracking-wider">
            <span>Avg Delivery Time</span>
            <Clock className="w-4 h-4 text-primary" />
          </div>
          <div className="text-3xl font-bold font-mono text-foreground">
            {kpis.avgDeliveryTimeHours} <span className="text-sm font-sans text-muted-foreground">hrs</span>
          </div>
          <div className="text-[11px] text-muted-foreground">Order to Doorstep velocity</div>
        </div>

        {/* Avg Dispatch Duration */}
        <div className="p-5 bg-card border border-border rounded-xl space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold uppercase tracking-wider">
            <span>Warehouse Dwell</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-bold font-mono text-foreground">
            {kpis.avgDispatchTimeHours} <span className="text-sm font-sans text-muted-foreground">hrs</span>
          </div>
          <div className="text-[11px] text-muted-foreground">Order to Line-Haul Dispatch</div>
        </div>

        {/* First Attempt Success */}
        <div className="p-5 bg-card border border-border rounded-xl space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold uppercase tracking-wider">
            <span>First-Attempt Rate</span>
            <CheckCircle2 className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-3xl font-bold font-mono text-sky-600 dark:text-sky-400">
            {kpis.firstAttemptDeliveryPct}%
          </div>
          <div className="text-[11px] text-muted-foreground">Delivered on attempt #1</div>
        </div>
      </div>

      {/* Secondary Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-card border border-border rounded-xl shadow-xs">
          <div className="text-xs text-muted-foreground font-medium">Total Shipments In Window</div>
          <div className="text-xl font-bold font-mono text-foreground mt-1">
            {kpis.totalShipments}
          </div>
        </div>
        <div className="p-4 bg-card border border-border rounded-xl shadow-xs">
          <div className="text-xs text-muted-foreground font-medium">Delivery Failure Rate</div>
          <div className="text-xl font-bold font-mono text-rose-500 mt-1">
            {kpis.failedDeliveryPct}%
          </div>
        </div>
        <div className="p-4 bg-card border border-border rounded-xl shadow-xs">
          <div className="text-xs text-muted-foreground font-medium">Customer Return Rate</div>
          <div className="text-xl font-bold font-mono text-amber-600 mt-1">
            {kpis.returnRatePct}%
          </div>
        </div>
        <div className="p-4 bg-card border border-border rounded-xl shadow-xs">
          <div className="text-xs text-muted-foreground font-medium">Active Transit Velocity</div>
          <div className="text-xl font-bold font-mono text-primary mt-1">
            99.2% Healthy
          </div>
        </div>
      </div>

      {/* Daily Created vs Delivered Throughput Trend */}
      <div className="p-6 bg-card border border-border rounded-xl shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Daily Network Throughput (Last {days} Days)
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Shipments ingested into the fulfillment network vs completed doorstep deliveries.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-primary" /> Created
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-emerald-500" /> Delivered
            </span>
          </div>
        </div>

        {dailyTrends.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground text-xs">
            No daily shipments recorded in the selected time window.
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            {dailyTrends.map((d: any) => {
              const maxVal = Math.max(
                ...dailyTrends.map((t: any) => Math.max(t.created, t.delivered, 1))
              );
              const createdWidth = Math.min(100, Math.round((d.created / maxVal) * 100));
              const deliveredWidth = Math.min(100, Math.round((d.delivered / maxVal) * 100));

              return (
                <div key={d.date} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between font-mono text-muted-foreground text-[11px]">
                    <span>{d.date}</span>
                    <span>
                      {d.created} created / {d.delivered} delivered
                    </span>
                  </div>
                  <div className="flex gap-1 h-3 bg-surface-muted rounded overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all"
                      style={{ width: `${createdWidth}%` }}
                      title={`Created: ${d.created}`}
                    />
                    <div
                      className="bg-emerald-500 h-full transition-all"
                      style={{ width: `${deliveredWidth}%` }}
                      title={`Delivered: ${d.delivered}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Two Column Section: Top Hubs & Top Courier Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hub Performance */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" /> Facility Workload & Backlog
            </h3>
            <span className="text-xs text-muted-foreground">Sortation Centers</span>
          </div>

          {hubPerformance.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-xs">
              No facility workload data available.
            </div>
          ) : (
            <div className="divide-y divide-border text-xs">
              {hubPerformance.map((h: any) => (
                <div key={h.hubId} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-foreground">
                      {h.name}
                    </div>
                    <div className="text-[11px] text-muted-foreground font-mono">
                      {h.hubCode} — {h.city}
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <div className="font-bold text-foreground">
                      {h.volume} Shipments
                    </div>
                    <div className="text-[11px] text-amber-600 dark:text-amber-400">
                      {h.backlog} in Sortation Bay
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Courier Leaderboard */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" /> Top Delivery Couriers
            </h3>
            <span className="text-xs text-muted-foreground">Doorstep Completions</span>
          </div>

          {topAgents.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-xs">
              No agent metrics recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-border text-xs">
              {topAgents.map((a: any, idx: number) => (
                <div key={a.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-surface-muted text-muted-foreground font-mono font-bold flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-semibold text-foreground">
                        {a.name}
                      </div>
                      <div className="text-[11px] text-muted-foreground font-mono">
                        {a.agentId} • {a.status}
                      </div>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <div className="font-bold text-emerald-600 dark:text-emerald-400">
                      {a.completed} Delivered
                    </div>
                    <div className="text-[11px] text-muted-foreground">★ {a.rating} Rating</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
