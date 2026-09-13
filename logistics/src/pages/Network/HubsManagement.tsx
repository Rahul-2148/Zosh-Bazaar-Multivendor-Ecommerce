import React, { useState, useEffect } from "react";
import {
  Building2,
  Plus,
  Search,
  MapPin,
  Users,
  Layers,
  AlertCircle,
  RefreshCw,
  X,
  Compass,
} from "lucide-react";
import { logisticsApi } from "../../services/api";

export const HubsManagement: React.FC = () => {
  const [hubs, setHubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("ALL");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Create Form State
  const [formData, setFormData] = useState({
    hubCode: "",
    name: "",
    type: "LAST_MILE_HUB",
    city: "Bengaluru",
    state: "Karnataka",
    address: "",
    lat: "12.9716",
    lng: "77.5946",
    capacityDaily: "5000",
    activeStaff: "12",
    pincodesCovered: "560001, 560002, 560034",
  });

  useEffect(() => {
    fetchHubs();
  }, []);

  const fetchHubs = async () => {
    setLoading(true);
    try {
      const res = await logisticsApi.getHubs();
      if (res.data?.hubs) {
        setHubs(res.data.hubs);
      }
    } catch (err) {
      console.error("Failed to load hubs", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsSubmitting(true);

    try {
      const pincodes = formData.pincodesCovered
        .split(",")
        .map((p) => parseInt(p.trim()))
        .filter((p) => !isNaN(p));

      await logisticsApi.createHub({
        hubCode: formData.hubCode.trim().toUpperCase(),
        name: formData.name.trim(),
        type: formData.type,
        city: formData.city.trim(),
        state: formData.state.trim(),
        address: formData.address.trim(),
        location: {
          lat: parseFloat(formData.lat) || 12.9716,
          lng: parseFloat(formData.lng) || 77.5946,
        },
        capacityDaily: parseInt(formData.capacityDaily) || 5000,
        activeStaff: parseInt(formData.activeStaff) || 12,
        pincodesCovered: pincodes,
      });

      setShowCreateModal(false);
      setFormData({
        hubCode: "",
        name: "",
        type: "LAST_MILE_HUB",
        city: "Bengaluru",
        state: "Karnataka",
        address: "",
        lat: "12.9716",
        lng: "77.5946",
        capacityDaily: "5000",
        activeStaff: "12",
        pincodesCovered: "560001, 560002, 560034",
      });
      fetchHubs();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to create hub facility");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredHubs = hubs.filter((h) => {
    const matchesSearch =
      h.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.hubCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.city?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === "ALL" || h.type === selectedType;
    return matchesSearch && matchesType;
  });

  const totalCapacity = hubs.reduce((acc, h) => acc + (h.capacityDaily || 0), 0);
  const totalBacklog = hubs.reduce((acc, h) => acc + (h.currentBacklog || 0), 0);
  const activeHubsCount = hubs.filter((h) => h.status === "ACTIVE").length;

  return (
    <div className="space-y-6">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Logistics Network & Hub Facilities
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-primary-soft text-primary border border-primary-border">
              {hubs.length} Nodes Registered
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Sortation hubs, regional distribution centers, and last-mile fulfillment nodes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchHubs}
            disabled={loading}
            className="p-2.5 rounded-lg border border-border bg-surface hover:bg-surface-hover text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Refresh Network"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground rounded-lg text-sm font-semibold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Facility
          </button>
        </div>
      </div>

      {/* Metric Counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-surface border border-border rounded-xl">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Active Facilities
          </div>
          <div className="text-2xl font-bold text-foreground mt-1 font-mono">
            {activeHubsCount} <span className="text-xs text-muted-foreground">/ {hubs.length}</span>
          </div>
        </div>
        <div className="p-4 bg-surface border border-border rounded-xl">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Daily Throughput Cap
          </div>
          <div className="text-2xl font-bold text-foreground mt-1 font-mono">
            {totalCapacity.toLocaleString()} <span className="text-xs text-muted-foreground">pkg/day</span>
          </div>
        </div>
        <div className="p-4 bg-surface border border-border rounded-xl">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Network Backlog
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1 font-mono">
            {totalBacklog.toLocaleString()} <span className="text-xs text-muted-foreground">pkg</span>
          </div>
        </div>
        <div className="p-4 bg-surface border border-border rounded-xl">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Sortation Health
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
            {totalCapacity > 0 ? ((1 - totalBacklog / totalCapacity) * 100).toFixed(1) : 100}%
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface border border-border p-3 rounded-xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search facility name, code, or city..."
            className="w-full pl-9 pr-3 py-1.5 bg-surface-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {["ALL", "LAST_MILE_HUB", "SORT_CENTER", "HUB", "FULFILLMENT_CENTER"].map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedType === t
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-surface-muted text-muted-foreground hover:text-foreground hover:bg-surface-hover border border-border"
              }`}
            >
              {t.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Hub Facilities Cards Grid */}
      {loading ? (
        <div className="py-20 text-center text-muted-foreground">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin mb-3 text-primary" />
          <p className="text-sm font-medium">Querying active logistics hubs...</p>
        </div>
      ) : filteredHubs.length === 0 ? (
        <div className="py-20 text-center bg-surface border border-border rounded-xl space-y-3">
          <Building2 className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
          <h3 className="font-semibold text-foreground">No Hub Facilities Found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {hubs.length === 0
              ? "The logistics facility directory is currently empty. Click 'Add Facility' above to configure your first hub node."
              : "No facilities matched your search criteria."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredHubs.map((hub) => {
            const utilization = hub.capacityDaily
              ? Math.min(100, Math.round(((hub.currentBacklog || 0) / hub.capacityDaily) * 100))
              : 0;

            return (
              <div
                key={hub._id}
                className="bg-surface border border-border rounded-xl p-5 space-y-4 hover:border-border-strong transition-all shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-surface-muted text-foreground border border-border">
                        {hub.hubCode}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          hub.status === "ACTIVE"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-surface-muted text-muted-foreground border border-border"
                        }`}
                      >
                        {hub.status}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-foreground mt-1">
                      {hub.name}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                      <span>
                        {hub.city}, {hub.state}
                      </span>
                    </div>
                  </div>

                  <span className="p-2.5 rounded-lg bg-primary-soft text-primary border border-primary-border">
                    <Building2 className="w-5 h-5" />
                  </span>
                </div>

                {/* Capacity & Backlog Meter */}
                <div className="space-y-1.5 pt-2 border-t border-border">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Facility Load / Backlog</span>
                    <span className="font-mono font-semibold text-foreground">
                      {hub.currentBacklog || 0} / {hub.capacityDaily?.toLocaleString() || 5000} ({utilization}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-surface-muted border border-border/50 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        utilization > 85
                          ? "bg-rose-500"
                          : utilization > 60
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                      style={{ width: `${utilization}%` }}
                    />
                  </div>
                </div>

                {/* Staff and Pincode Badges */}
                <div className="flex items-center justify-between text-xs pt-1 text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    <span><strong className="text-foreground">{hub.activeStaff || 0}</strong> Ground Staff</span>
                  </div>
                  <div className="flex items-center gap-1 font-mono text-[11px]">
                    <Layers className="w-3.5 h-3.5" />
                    <span><strong className="text-foreground">{hub.pincodesCovered?.length || 0}</strong> Pincodes</span>
                  </div>
                </div>

                {hub.location && (
                  <div className="text-[11px] font-mono text-muted-foreground flex items-center gap-1 pt-1">
                    <Compass className="w-3 h-3" />
                    <span>
                      {hub.location.lat?.toFixed(4)}, {hub.location.lng?.toFixed(4)}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create Hub Facility */}
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
                <Building2 className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-foreground">Register Facility / Hub</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg hover:bg-surface-hover text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-destructive-soft border border-destructive/20 text-destructive text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" /> {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Hub Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.hubCode}
                    onChange={(e) => setFormData({ ...formData, hubCode: e.target.value })}
                    placeholder="e.g. BLR-HUB-01"
                    className="w-full px-3 py-2 bg-surface-muted border border-border rounded-lg uppercase font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Facility Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-muted border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="LAST_MILE_HUB">Last-Mile Hub</option>
                    <option value="SORT_CENTER">Sort Center</option>
                    <option value="HUB">Regional Hub</option>
                    <option value="FULFILLMENT_CENTER">Fulfillment Center</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Facility Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Bengaluru South Inbound & Sortation Hub"
                  className="w-full px-3 py-2 bg-surface-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Physical Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Plot 42, Electronic City Phase 1..."
                  className="w-full px-3 py-2 bg-surface-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Latitude
                  </label>
                  <input
                    type="text"
                    value={formData.lat}
                    onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-muted border border-border rounded-lg font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Longitude
                  </label>
                  <input
                    type="text"
                    value={formData.lng}
                    onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-muted border border-border rounded-lg font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Daily Capacity (Packages)
                  </label>
                  <input
                    type="number"
                    value={formData.capacityDaily}
                    onChange={(e) => setFormData({ ...formData, capacityDaily: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-muted border border-border rounded-lg font-mono text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Active Staff Count
                  </label>
                  <input
                    type="number"
                    value={formData.activeStaff}
                    onChange={(e) => setFormData({ ...formData, activeStaff: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-muted border border-border rounded-lg font-mono text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Pincodes Covered (Comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.pincodesCovered}
                  onChange={(e) => setFormData({ ...formData, pincodesCovered: e.target.value })}
                  placeholder="560001, 560002, 560034..."
                  className="w-full px-3 py-2 bg-surface-muted border border-border rounded-lg font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
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
                  {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Save Hub"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
