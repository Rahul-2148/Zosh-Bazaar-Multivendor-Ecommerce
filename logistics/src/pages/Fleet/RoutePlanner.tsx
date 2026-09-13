import React, { useState, useEffect } from "react";
import {
  Route as RouteIcon,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  MapPin,
  RefreshCw,
  X,
  Navigation,
  ChevronRight,
} from "lucide-react";
import { logisticsApi } from "../../services/api";

export const RoutePlanner: React.FC = () => {
  const [routes, setRoutes] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [hubs, setHubs] = useState<any[]>([]);
  const [readyShipments, setReadyShipments] = useState<any[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Create Route Form
  const [routeForm, setRouteForm] = useState({
    routeCode: "",
    agentId: "",
    hubId: "",
    totalDistanceKm: "18.5",
    estimatedDurationMinutes: "140",
    selectedShipmentIds: [] as string[],
  });

  useEffect(() => {
    fetchRoutes();
    fetchDependencies();
  }, []);

  const fetchRoutes = async () => {
    setLoading(true);
    try {
      const res = await logisticsApi.getRoutes();
      if (res.data?.routes) {
        setRoutes(res.data.routes);
        if (res.data.routes.length > 0 && !selectedRoute) {
          setSelectedRoute(res.data.routes[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load routes", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [agentsRes, hubsRes, shipmentsRes] = await Promise.all([
        logisticsApi.getAgents({ status: "AVAILABLE" }),
        logisticsApi.getHubs({ status: "ACTIVE" }),
        logisticsApi.getShipments({ status: "READY_FOR_DISPATCH", limit: 40 }),
      ]);
      if (agentsRes.data?.agents) {
        setAgents(agentsRes.data.agents);
        if (agentsRes.data.agents.length > 0) {
          setRouteForm((prev) => ({ ...prev, agentId: agentsRes.data.agents[0]._id }));
        }
      }
      if (hubsRes.data?.hubs) {
        setHubs(hubsRes.data.hubs);
        if (hubsRes.data.hubs.length > 0) {
          setRouteForm((prev) => ({ ...prev, hubId: hubsRes.data.hubs[0]._id }));
        }
      }
      if (shipmentsRes.data?.shipments) {
        setReadyShipments(shipmentsRes.data.shipments);
      }
    } catch (e) {
      console.error("Failed to load route dependencies", e);
    }
  };

  const handleCreateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsSubmitting(true);

    try {
      // Build stops from selected shipments
      const selected = readyShipments.filter((s) =>
        routeForm.selectedShipmentIds.includes(s._id)
      );

      const stops = selected.map((s, idx) => ({
        stopIndex: idx + 1,
        shipmentId: s._id,
        trackingNumber: s.trackingNumber,
        customerName: s.customer?.name || "Customer",
        address: `${s.deliveryAddress?.street || ""}, ${s.deliveryAddress?.city || ""}`,
        location: {
          lat: s.deliveryAddress?.latitude || 12.9716,
          lng: s.deliveryAddress?.longitude || 77.5946,
        },
        timeWindow: {
          from: "10:00",
          to: "14:00",
        },
        status: "PENDING",
      }));

      await logisticsApi.createRoute({
        routeCode:
          routeForm.routeCode.trim().toUpperCase() ||
          `RT-${Math.floor(1000 + Math.random() * 9000)}`,
        agent: routeForm.agentId,
        hub: routeForm.hubId,
        stops,
        totalDistanceKm: parseFloat(routeForm.totalDistanceKm) || 15,
        estimatedDurationMinutes: parseInt(routeForm.estimatedDurationMinutes) || 120,
      });

      setShowCreateModal(false);
      setRouteForm({
        routeCode: "",
        agentId: agents[0]?._id || "",
        hubId: hubs[0]?._id || "",
        totalDistanceKm: "18.5",
        estimatedDurationMinutes: "140",
        selectedShipmentIds: [],
      });
      fetchRoutes();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to generate route");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStop = async (routeId: string, stopId: string, status: string) => {
    try {
      const res = await logisticsApi.updateRouteStop(routeId, stopId, { status });
      if (res.data?.route) {
        setSelectedRoute(res.data.route);
        setRoutes((prev) =>
          prev.map((r) => (r._id === routeId ? res.data.route : r))
        );
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update stop");
    }
  };

  const filtered = routes.filter((r) => {
    return (
      r.routeCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.agent?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Last-Mile Route Planner & Sequencer
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-primary/10 text-primary border border-primary/20">
              {routes.length} Active Routes
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Multi-stop courier dispatch sequences, distance calculations, and delivery ETA promises.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchRoutes}
            disabled={loading}
            className="p-2.5 rounded-lg border border-border bg-card hover:bg-surface-hover text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-semibold transition-all shadow-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Plan Route
          </button>
        </div>
      </div>

      {/* Main Dual-Pane View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Cols: Routes Directory */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-card border border-border rounded-xl p-3 shadow-xs">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search route code or courier name..."
                className="w-full pl-9 pr-3 py-1.5 bg-surface-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center text-muted-foreground bg-card border border-border rounded-xl">
              <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-2 text-primary" />
              <p className="text-xs">Loading planned routes...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center bg-card border border-border rounded-xl p-6 space-y-2">
              <RouteIcon className="w-10 h-10 mx-auto text-muted-foreground opacity-40" />
              <h3 className="font-semibold text-sm text-foreground">No Routes Found</h3>
              <p className="text-xs text-muted-foreground">
                Click 'Plan Route' above to sequence stops for an assigned courier.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((route) => {
                const isSelected = selectedRoute?._id === route._id;
                const completedCount =
                  route.stops?.filter((s: any) => s.status === "DELIVERED").length || 0;
                const totalStops = route.stops?.length || 0;
                const pct = totalStops > 0 ? Math.round((completedCount / totalStops) * 100) : 0;

                return (
                  <div
                    key={route._id}
                    onClick={() => setSelectedRoute(route)}
                    className={`p-4 bg-card border rounded-xl cursor-pointer transition-all shadow-xs ${
                      isSelected
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-border hover:border-border-strong hover:bg-surface-hover"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">
                          {route.routeCode}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            route.status === "COMPLETED"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : route.status === "ACTIVE"
                              ? "bg-sky-500/10 text-sky-600 dark:text-sky-400"
                              : "bg-surface-muted text-muted-foreground"
                          }`}
                        >
                          {route.status}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>

                    <div className="mt-2.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-foreground">
                          {route.agent?.name || "Unassigned Agent"}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          Hub: {route.hub?.hubCode || "Central Sort Hub"}
                        </div>
                      </div>

                      <div className="text-right font-mono text-[11px]">
                        <div className="text-foreground font-semibold">{route.totalDistanceKm || 12} km</div>
                        <div className="text-muted-foreground">{route.estimatedDurationMinutes || 90} mins</div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">Stops Completed</span>
                        <span className="font-mono font-semibold text-foreground">
                          {completedCount} / {totalStops} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-surface-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 7 Cols: Selected Route Stop Sequencer */}
        <div className="lg:col-span-7">
          {selectedRoute ? (
            <div className="bg-card border border-border rounded-xl p-6 shadow-xs space-y-5">
              <div className="flex items-start justify-between border-b border-border pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-foreground">
                      Route Manifest: {selectedRoute.routeCode}
                    </h2>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface-muted text-foreground border border-border">
                      {selectedRoute.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Courier: <strong className="text-foreground">{selectedRoute.agent?.name || "Assigned Driver"}</strong> ({selectedRoute.agent?.phone || "+91 9876543210"})
                  </p>
                </div>

                <div className="text-right text-xs space-y-0.5">
                  <div className="font-mono font-bold text-primary">
                    {selectedRoute.totalDistanceKm || 0} KM TOTAL
                  </div>
                  <div className="text-muted-foreground">
                    Est. Duration: {selectedRoute.estimatedDurationMinutes || 0} mins
                  </div>
                </div>
              </div>

              {/* Stops Timeline */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Navigation className="w-4 h-4 text-primary" /> Delivery Sequence ({selectedRoute.stops?.length || 0} Stops)
                  </span>
                  <span className="text-[11px] text-muted-foreground">Sequential Last-Mile Priority</span>
                </div>

                {(!selectedRoute.stops || selectedRoute.stops.length === 0) ? (
                  <div className="py-12 text-center text-muted-foreground text-xs">
                    No stops sequenced for this route shell.
                  </div>
                ) : (
                  <div className="space-y-3 relative before:absolute before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-border">
                    {selectedRoute.stops.map((stop: any, idx: number) => {
                      const isDelivered = stop.status === "DELIVERED";
                      const isFailed = stop.status === "FAILED";

                      return (
                        <div
                          key={stop._id || idx}
                          className="relative pl-10 group"
                        >
                          {/* Sequence Node Dot */}
                          <div
                            className={`absolute left-2 top-3 -translate-x-1/2 w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-mono font-bold transition-all ${
                              isDelivered
                                ? "bg-emerald-500 border-emerald-600 text-white"
                                : isFailed
                                ? "bg-rose-500 border-rose-600 text-white"
                                : "bg-card border-primary text-primary"
                            }`}
                          >
                            {stop.stopIndex || idx + 1}
                          </div>

                          <div className="p-3.5 bg-surface-muted border border-border rounded-lg space-y-2 hover:border-border-strong transition-colors">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-xs text-foreground">
                                    {stop.trackingNumber || `STOP-${idx + 1}`}
                                  </span>
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                      isDelivered
                                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                        : isFailed
                                        ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                        : "bg-surface border border-border text-muted-foreground"
                                    }`}
                                  >
                                    {stop.status}
                                  </span>
                                </div>
                                <div className="text-xs font-semibold text-foreground mt-0.5">
                                  {stop.customerName}
                                </div>
                              </div>

                              <div className="text-right text-[11px] text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3 text-muted-foreground" />
                                <span>{stop.timeWindow?.from} - {stop.timeWindow?.to}</span>
                              </div>
                            </div>

                            <div className="text-xs text-muted-foreground flex items-start gap-1">
                              <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                              <span>{stop.address}</span>
                            </div>

                            {/* Operator Override Actions */}
                            {stop.status !== "DELIVERED" && (
                              <div className="pt-2 border-t border-border flex items-center justify-end gap-2 text-xs">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateStop(selectedRoute._id, stop._id, "FAILED")
                                  }
                                  className="px-2.5 py-1 rounded text-[11px] font-semibold text-rose-600 hover:bg-rose-500/10 border border-rose-500/20 transition-colors"
                                >
                                  Mark Failed
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateStop(selectedRoute._id, stop._id, "DELIVERED")
                                  }
                                  className="px-2.5 py-1 rounded text-[11px] font-semibold text-emerald-600 hover:bg-emerald-500/10 border border-emerald-500/20 transition-colors inline-flex items-center gap-1"
                                >
                                  <CheckCircle2 className="w-3 h-3" /> Mark Delivered
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-24 text-center bg-card border border-border rounded-xl space-y-2 text-muted-foreground">
              <RouteIcon className="w-12 h-12 mx-auto opacity-30" />
              <p className="text-sm">Select a delivery route from the left to view stop sequences.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Plan Route */}
      {showCreateModal && (
        <div
          onClick={() => setShowCreateModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-xs animate-in fade-in duration-150 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-card border border-border rounded-xl w-full max-w-lg shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto cursor-default"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <RouteIcon className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-foreground">Plan Delivery Route</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg hover:bg-surface-hover text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateRoute} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Route Code
                  </label>
                  <input
                    type="text"
                    value={routeForm.routeCode}
                    onChange={(e) => setRouteForm({ ...routeForm, routeCode: e.target.value })}
                    placeholder="e.g. RT-BLR-01"
                    className="w-full px-3 py-2 bg-surface-muted border border-border rounded-lg uppercase font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Origin Hub *
                  </label>
                  <select
                    required
                    value={routeForm.hubId}
                    onChange={(e) => setRouteForm({ ...routeForm, hubId: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-muted border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                  >
                    {hubs.map((h) => (
                      <option key={h._id} value={h._id}>
                        {h.hubCode} — {h.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Assign Courier / Agent *
                </label>
                <select
                  required
                  value={routeForm.agentId}
                  onChange={(e) => setRouteForm({ ...routeForm, agentId: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-muted border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                >
                  {agents.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.name} ({a.agentId} — {a.vehicle?.vehicleType || "BIKE"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Estimated Distance (Km)
                  </label>
                  <input
                    type="number"
                    value={routeForm.totalDistanceKm}
                    onChange={(e) =>
                      setRouteForm({ ...routeForm, totalDistanceKm: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-surface-muted border border-border rounded-lg font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Est. Duration (Mins)
                  </label>
                  <input
                    type="number"
                    value={routeForm.estimatedDurationMinutes}
                    onChange={(e) =>
                      setRouteForm({ ...routeForm, estimatedDurationMinutes: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-surface-muted border border-border rounded-lg font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Stop Shipments Selection */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Select Shipments to Sequence ({readyShipments.length} Available)
                </label>
                {readyShipments.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-2">
                    No shipments are marked ready. You can initialize an empty route shell or dispatch items from the Operations Board first.
                  </p>
                ) : (
                  <div className="max-h-36 overflow-y-auto space-y-1 p-2 bg-surface-muted border border-border rounded-lg">
                    {readyShipments.map((s) => (
                      <label key={s._id} className="flex items-center gap-2 text-xs cursor-pointer text-foreground">
                        <input
                          type="checkbox"
                          checked={routeForm.selectedShipmentIds.includes(s._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setRouteForm({
                                ...routeForm,
                                selectedShipmentIds: [...routeForm.selectedShipmentIds, s._id],
                              });
                            } else {
                              setRouteForm({
                                ...routeForm,
                                selectedShipmentIds: routeForm.selectedShipmentIds.filter(
                                  (id) => id !== s._id
                                ),
                              });
                            }
                          }}
                          className="rounded text-primary focus:ring-primary"
                        />
                        <span className="font-mono font-semibold">{s.trackingNumber}</span>
                        <span className="text-muted-foreground truncate">
                          ({s.customer?.name} — {s.deliveryAddress?.city})
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50 transition-colors shadow-xs"
                >
                  {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Sequence Route"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
