import React, { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Search,
  Bike,
  Star,
  RefreshCw,
  X,
  Phone,
  Building2,
  Package,
} from "lucide-react";
import { logisticsApi } from "../../services/api";

export const DeliveryAgentsList: React.FC = () => {
  const [agents, setAgents] = useState<any[]>([]);
  const [hubs, setHubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Create Form
  const [formData, setFormData] = useState({
    agentId: "",
    name: "",
    phone: "",
    email: "",
    vehicleType: "BIKE",
    plateNumber: "",
    capacityKg: "30",
    assignedHubId: "",
    currentZone: "Central Sector",
  });

  useEffect(() => {
    fetchAgents();
    fetchHubs();
  }, []);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const res = await logisticsApi.getAgents();
      if (res.data?.agents) {
        setAgents(res.data.agents);
      }
    } catch (err) {
      console.error("Failed to load delivery agents", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHubs = async () => {
    try {
      const res = await logisticsApi.getHubs({ status: "ACTIVE" });
      if (res.data?.hubs) {
        setHubs(res.data.hubs);
        if (res.data.hubs.length > 0) {
          setFormData((prev) => ({ ...prev, assignedHubId: res.data.hubs[0]._id }));
        }
      }
    } catch (e) {
      console.error("Failed to fetch hubs", e);
    }
  };

  const handleStatusChange = async (agentId: string, newStatus: string) => {
    try {
      await logisticsApi.updateAgentStatus(agentId, newStatus);
      setAgents((prev) =>
        prev.map((a) => (a._id === agentId ? { ...a, status: newStatus } : a))
      );
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update agent status");
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsSubmitting(true);

    try {
      await logisticsApi.createAgent({
        agentId: formData.agentId.trim().toUpperCase(),
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        assignedHub: formData.assignedHubId || undefined,
        currentZone: formData.currentZone.trim(),
        vehicle: {
          vehicleType: formData.vehicleType,
          plateNumber: formData.plateNumber.trim().toUpperCase(),
          capacityKg: parseFloat(formData.capacityKg) || 30,
        },
      });

      setShowCreateModal(false);
      setFormData({
        agentId: "",
        name: "",
        phone: "",
        email: "",
        vehicleType: "BIKE",
        plateNumber: "",
        capacityKg: "30",
        assignedHubId: hubs[0]?._id || "",
        currentZone: "Central Sector",
      });
      fetchAgents();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to register delivery agent");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAgents = agents.filter((a) => {
    const matchesSearch =
      a.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.agentId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.phone?.includes(searchQuery);
    const matchesStatus = statusFilter === "ALL" || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const availableCount = agents.filter((a) => a.status === "AVAILABLE").length;
  const onDutyCount = agents.filter((a) =>
    ["ASSIGNED", "OUT_FOR_DELIVERY"].includes(a.status)
  ).length;
  const totalCompletedToday = agents.reduce(
    (acc, a) => acc + (a.todayStats?.completed || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Delivery Workforce & Fleet Agents
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-primary-soft text-primary border border-primary-border">
              {agents.length} Couriers Enrolled
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Last-mile delivery partners, live duty rosters, and real-time package allocations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAgents}
            disabled={loading}
            className="p-2.5 rounded-lg border border-border bg-surface hover:bg-surface-hover text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground rounded-lg text-sm font-semibold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Register Agent
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-surface border border-border rounded-xl">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Active On-Duty
          </div>
          <div className="text-2xl font-bold text-sky-600 dark:text-sky-400 mt-1 font-mono">
            {onDutyCount}
          </div>
        </div>
        <div className="p-4 bg-surface border border-border rounded-xl">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Available / Ready
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
            {availableCount}
          </div>
        </div>
        <div className="p-4 bg-surface border border-border rounded-xl">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Completed Today
          </div>
          <div className="text-2xl font-bold text-foreground mt-1 font-mono">
            {totalCompletedToday} <span className="text-xs text-muted-foreground">pkgs</span>
          </div>
        </div>
        <div className="p-4 bg-surface border border-border rounded-xl">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Fleet Size
          </div>
          <div className="text-2xl font-bold text-primary mt-1 font-mono">
            {agents.length} <span className="text-xs text-muted-foreground">drivers</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface border border-border p-3 rounded-xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, agent ID, or phone..."
            className="w-full pl-9 pr-3 py-1.5 bg-surface-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {["ALL", "AVAILABLE", "ASSIGNED", "OUT_FOR_DELIVERY", "ON_BREAK", "OFFLINE"].map(
            (s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  statusFilter === s
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-surface-muted text-muted-foreground hover:text-foreground hover:bg-surface-hover border border-border"
                }`}
              >
                {s.replace(/_/g, " ")}
              </button>
            )
          )}
        </div>
      </div>

      {/* Agent Cards Grid */}
      {loading ? (
        <div className="py-20 text-center text-muted-foreground">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin mb-3 text-primary" />
          <p className="text-sm font-medium">Querying active delivery agents...</p>
        </div>
      ) : filteredAgents.length === 0 ? (
        <div className="py-20 text-center bg-surface border border-border rounded-xl space-y-3">
          <Users className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
          <h3 className="font-semibold text-foreground">No Delivery Agents Found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {agents.length === 0
              ? "The courier directory is currently empty. Click 'Register Agent' above to enroll your first delivery partner."
              : "No agents matched your search query."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredAgents.map((agent) => (
            <div
              key={agent._id}
              className="bg-surface border border-border rounded-xl p-5 space-y-4 hover:border-border-strong transition-all shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-surface-muted text-foreground border border-border">
                      {agent.agentId}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        agent.status === "AVAILABLE"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : agent.status === "OUT_FOR_DELIVERY"
                          ? "bg-sky-500/10 text-sky-600 dark:text-sky-400"
                          : agent.status === "ASSIGNED"
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          : "bg-surface-muted text-muted-foreground border border-border"
                      }`}
                    >
                      {agent.status}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-foreground mt-1">
                    {agent.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{agent.phone}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-1 rounded text-xs font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-500" />
                  <span>{agent.rating || 4.8}</span>
                </div>
              </div>

              {/* Vehicle & Hub metadata */}
              <div className="grid grid-cols-2 gap-2 text-xs p-2.5 rounded-lg bg-surface-muted border border-border">
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase">Vehicle</div>
                  <div className="font-medium text-foreground flex items-center gap-1 mt-0.5">
                    <Bike className="w-3.5 h-3.5 text-primary" />
                    <span>{agent.vehicle?.vehicleType || "BIKE"}</span>
                  </div>
                  <div className="font-mono text-[10px] text-muted-foreground">
                    {agent.vehicle?.plateNumber || "No Plate"}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-muted-foreground uppercase">Operating Hub</div>
                  <div className="font-medium text-foreground flex items-center gap-1 mt-0.5 truncate">
                    <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="truncate">{agent.assignedHub?.name || agent.assignedHub?.hubCode || "General Pool"}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground">{agent.currentZone || "Bengaluru"}</div>
                </div>
              </div>

              {/* Today Workload stats */}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-border">
                <div className="flex items-center gap-1 font-semibold text-foreground">
                  <Package className="w-4 h-4 text-primary" />
                  <span>{agent.activeShipmentsCount || 0} Active Packages</span>
                </div>

                <div className="text-right text-[11px] font-mono">
                  <span className="text-emerald-600 font-bold">{agent.todayStats?.completed || 0} Delivered</span>
                  <span className="text-muted-foreground"> / </span>
                  <span className="text-rose-500 font-bold">{agent.todayStats?.failed || 0} Failed</span>
                </div>
              </div>

              {/* Quick Duty Status Switcher */}
              <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                <span className="text-muted-foreground text-[11px]">Set Status:</span>
                <div className="flex items-center gap-1">
                  {["AVAILABLE", "ON_BREAK", "OFFLINE"].map((st) => (
                    <button
                      key={st}
                      disabled={agent.status === st}
                      onClick={() => handleStatusChange(agent._id, st)}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                        agent.status === st
                          ? "bg-primary text-primary-foreground cursor-default"
                          : "bg-surface-muted text-muted-foreground hover:text-foreground hover:bg-surface-hover border border-border"
                      }`}
                    >
                      {st.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Register Agent */}
      {showCreateModal && (
        <div
          onClick={() => setShowCreateModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-xs cursor-pointer animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto cursor-default"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-foreground">Enroll Delivery Agent</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg hover:bg-surface-hover text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-destructive-soft border border-destructive/20 text-destructive text-xs font-medium">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Agent ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.agentId}
                    onChange={(e) => setFormData({ ...formData, agentId: e.target.value })}
                    placeholder="e.g. AGT-1024"
                    className="w-full px-3 py-2 bg-surface-muted border border-border rounded-lg uppercase font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3 py-2 bg-surface-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 9876543210"
                    className="w-full px-3 py-2 bg-surface-muted border border-border rounded-lg font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="courier@zoshbazaar.com"
                    className="w-full px-3 py-2 bg-surface-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Assigned Hub
                  </label>
                  <select
                    value={formData.assignedHubId}
                    onChange={(e) => setFormData({ ...formData, assignedHubId: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-muted border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="">-- General Pool --</option>
                    {hubs.map((h) => (
                      <option key={h._id} value={h._id}>
                        {h.hubCode} — {h.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Delivery Zone
                  </label>
                  <input
                    type="text"
                    value={formData.currentZone}
                    onChange={(e) => setFormData({ ...formData, currentZone: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Vehicle Type
                  </label>
                  <select
                    value={formData.vehicleType}
                    onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-muted border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="BIKE">Motorcycle</option>
                    <option value="ELECTRIC_SCOOTER">EV Scooter</option>
                    <option value="VAN">Delivery Van</option>
                    <option value="MINI_TRUCK">Mini Truck</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Plate Number
                  </label>
                  <input
                    type="text"
                    value={formData.plateNumber}
                    onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
                    placeholder="KA05AA1234"
                    className="w-full px-3 py-2 bg-surface-muted border border-border rounded-lg uppercase font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Capacity (Kg)
                  </label>
                  <input
                    type="number"
                    value={formData.capacityKg}
                    onChange={(e) => setFormData({ ...formData, capacityKg: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-muted border border-border rounded-lg font-mono text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-hover cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-primary hover:bg-primary-hover text-primary-foreground rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Save Agent"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
