import React, { useState, useEffect } from "react";
import {
  Clock,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Search,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { Link } from "react-router-dom";
import { logisticsApi } from "../../services/api";

export const SlaCommandCenter: React.FC = () => {
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLane, setActiveLane] = useState<"BREACHED" | "AT_RISK" | "ON_TRACK">("BREACHED");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchSlaShipments();
  }, []);

  const fetchSlaShipments = async () => {
    setLoading(true);
    try {
      const res = await logisticsApi.getShipments({ limit: 150 });
      if (res.data?.shipments) {
        setShipments(res.data.shipments);
      }
    } catch (err) {
      console.error("Failed to load SLA shipments", err);
    } finally {
      setLoading(false);
    }
  };

  const breachedList = shipments.filter(
    (s) => s.sla?.slaStatus === "BREACHED" && s.status !== "DELIVERED"
  );
  const atRiskList = shipments.filter(
    (s) => s.sla?.slaStatus === "AT_RISK" && s.status !== "DELIVERED"
  );
  const onTrackList = shipments.filter(
    (s) =>
      (s.sla?.slaStatus === "ON_TRACK" || !s.sla?.slaStatus) &&
      s.status !== "DELIVERED"
  );

  const currentList =
    activeLane === "BREACHED"
      ? breachedList
      : activeLane === "AT_RISK"
      ? atRiskList
      : onTrackList;

  const filtered = currentList.filter((s) => {
    return (
      s.trackingNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.deliveryAddress?.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              SLA Command Center & Breach Prevention
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-primary-soft text-primary border border-primary-border">
              Active Promise Monitor
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time delivery promise compliance, early breach alarms, and automated intervention escalation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchSlaShipments}
            disabled={loading}
            className="p-2.5 rounded-lg border border-border bg-surface hover:bg-surface-hover text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* 3 Interactive Urgency Banners / Lanes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Breached Lane Card */}
        <div
          onClick={() => setActiveLane("BREACHED")}
          className={`p-5 rounded-xl border cursor-pointer transition-all shadow-sm ${
            activeLane === "BREACHED"
              ? "bg-rose-500/10 border-rose-500 ring-2 ring-rose-500/30"
              : "bg-surface border-border hover:border-border-strong"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <AlertOctagon className="w-4 h-4" /> SLA Breached
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-rose-500/20 text-rose-600 dark:text-rose-400">
              Immediate Action
            </span>
          </div>
          <div className="text-3xl font-bold text-foreground mt-2 font-mono">
            {breachedList.length}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Packages that have missed the customer delivery promise window.
          </p>
        </div>

        {/* At-Risk Lane Card */}
        <div
          onClick={() => setActiveLane("AT_RISK")}
          className={`p-5 rounded-xl border cursor-pointer transition-all shadow-sm ${
            activeLane === "AT_RISK"
              ? "bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/30"
              : "bg-surface border-border hover:border-border-strong"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" /> Approaching Breach
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400">
              &lt; 2h Remaining
            </span>
          </div>
          <div className="text-3xl font-bold text-foreground mt-2 font-mono">
            {atRiskList.length}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Packages within 2 hours of deadline or experiencing hub dwell delays.
          </p>
        </div>

        {/* On-Track Lane Card */}
        <div
          onClick={() => setActiveLane("ON_TRACK")}
          className={`p-5 rounded-xl border cursor-pointer transition-all shadow-sm ${
            activeLane === "ON_TRACK"
              ? "bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/30"
              : "bg-surface border-border hover:border-border-strong"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> On Schedule
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              Normal Velocity
            </span>
          </div>
          <div className="text-3xl font-bold text-foreground mt-2 font-mono">
            {onTrackList.length}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Shipments progressing smoothly through line-haul and hub sortation.
          </p>
        </div>
      </div>

      {/* Active Lane Workspace & Search */}
      <div className="bg-surface border border-border rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              Viewing:{" "}
              <span
                className={
                  activeLane === "BREACHED"
                    ? "text-rose-600 dark:text-rose-400"
                    : activeLane === "AT_RISK"
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-emerald-600 dark:text-emerald-400"
                }
              >
                {activeLane.replace(/_/g, " ")} ({filtered.length} Shipments)
              </span>
            </h2>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tracking, city, customer..."
              className="w-full pl-9 pr-3 py-1.5 bg-surface-muted border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Shipments List */}
        {loading ? (
          <div className="py-20 text-center text-muted-foreground">
            <RefreshCw className="w-8 h-8 mx-auto animate-spin mb-3 text-primary" />
            <p className="text-xs font-medium">Evaluating delivery promise deadlines...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground space-y-2">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 opacity-60" />
            <h3 className="font-semibold text-sm text-foreground">
              No Shipments in this SLA category
            </h3>
            <p className="text-xs text-muted-foreground">
              {activeLane === "BREACHED"
                ? "Excellent! Zero shipments are currently overdue."
                : "No items match your active search or filter."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((s) => {
              const promisedTo = s.sla?.promisedTo
                ? new Date(s.sla.promisedTo).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    day: "numeric",
                    month: "short",
                  })
                : "Promised Today";

              return (
                <div
                  key={s._id}
                  className="p-4 bg-surface-muted border border-border rounded-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:border-primary/40 transition-colors"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/shipments/${s._id}`}
                        className="font-mono font-bold text-sm text-primary hover:underline"
                      >
                        {s.trackingNumber}
                      </Link>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-surface text-foreground border border-border">
                        {s.status}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-primary-soft text-primary border border-primary-border">
                        {s.serviceLevel || "STANDARD"}
                      </span>
                    </div>

                    <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span>Customer: <strong className="text-foreground">{s.customer?.name}</strong></span>
                      <span>City: <strong className="text-foreground">{s.deliveryAddress?.city}</strong></span>
                      <span>Hub: <strong className="text-foreground">{s.currentHub?.name || s.destinationHub?.name || "Sort Facility"}</strong></span>
                    </div>
                  </div>

                  {/* Urgency Badge & Interventions */}
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right text-xs">
                      <div className="text-muted-foreground text-[10px] uppercase font-semibold">
                        Customer Promise Deadline
                      </div>
                      <div className="font-mono font-bold text-foreground flex items-center justify-end gap-1 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{promisedTo}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        to={`/shipments/${s._id}`}
                        className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary-hover transition-colors inline-flex items-center gap-1 shadow-xs"
                      >
                        Triage <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
