import React, { useState, useEffect } from "react";
import {
  MapPin,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Building2,
  RefreshCw,
  X,
  Compass,
} from "lucide-react";
import { logisticsApi } from "../../services/api";

export const DeliveryZones: React.FC = () => {
  const [zones, setZones] = useState<any[]>([]);
  const [hubs, setHubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Live Serviceability Checker Form
  const [checkPincode, setCheckPincode] = useState("");
  const [checkServiceLevel, setCheckServiceLevel] = useState("STANDARD");
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<any | null>(null);

  // Add Zone Form
  const [formData, setFormData] = useState({
    name: "",
    zoneCode: "",
    city: "Bengaluru",
    pincodes: "560100, 560102, 560105",
    hubId: "",
    serviceability: true,
    standardSlaHours: "48",
    expressSlaHours: "24",
    sameDayAvailable: false,
    deliveryFee: "49",
    capacityLimit: "800",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [zonesRes, hubsRes] = await Promise.all([
        logisticsApi.getZones(),
        logisticsApi.getHubs(),
      ]);
      if (zonesRes.data?.zones) setZones(zonesRes.data.zones);
      if (hubsRes.data?.hubs) {
        setHubs(hubsRes.data.hubs);
        if (hubsRes.data.hubs.length > 0) {
          setFormData((prev) => ({ ...prev, hubId: hubsRes.data.hubs[0]._id }));
        }
      }
    } catch (err) {
      console.error("Failed to load zones", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckServiceability = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkPincode.trim() || checking) return;

    setChecking(true);
    setCheckResult(null);

    try {
      const res = await logisticsApi.checkServiceability(
        checkPincode.trim(),
        checkServiceLevel
      );
      setCheckResult(res.data);
    } catch (err: any) {
      setCheckResult({
        serviceable: false,
        message: err.response?.data?.message || "Pincode unserviceable in active network",
      });
    } finally {
      setChecking(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsSubmitting(true);

    try {
      const pincodeList = formData.pincodes
        .split(",")
        .map((p) => parseInt(p.trim()))
        .filter((p) => !isNaN(p));

      await logisticsApi.createZone({
        name: formData.name.trim(),
        zoneCode: formData.zoneCode.trim().toUpperCase(),
        city: formData.city.trim(),
        pincodes: pincodeList,
        hub: formData.hubId || undefined,
        serviceability: formData.serviceability,
        standardSlaHours: parseInt(formData.standardSlaHours) || 48,
        expressSlaHours: parseInt(formData.expressSlaHours) || 24,
        sameDayAvailable: formData.sameDayAvailable,
        deliveryFee: parseFloat(formData.deliveryFee) || 49,
        capacityLimit: parseInt(formData.capacityLimit) || 800,
      });

      setShowCreateModal(false);
      setFormData({
        name: "",
        zoneCode: "",
        city: "Bengaluru",
        pincodes: "560100, 560102, 560105",
        hubId: hubs[0]?._id || "",
        serviceability: true,
        standardSlaHours: "48",
        expressSlaHours: "24",
        sameDayAvailable: false,
        deliveryFee: "49",
        capacityLimit: "800",
      });
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to create delivery zone");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredZones = zones.filter((z) => {
    return (
      z.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      z.zoneCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      z.city?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const totalPincodes = zones.reduce((acc, z) => acc + (z.pincodes?.length || 0), 0);
  const sameDayZonesCount = zones.filter((z) => z.sameDayAvailable).length;

  return (
    <div className="space-y-6">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Delivery Zones & Serviceability
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-primary-soft text-primary border border-primary-border">
              {zones.length} Zones Defined
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Geographic coverage partitions, pincode resolution tables, and SLA fee rules.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 rounded-lg border border-border bg-surface hover:bg-surface-hover text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground rounded-lg text-sm font-semibold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Delivery Zone
          </button>
        </div>
      </div>

      {/* Live Serviceability Inspector Card */}
      <div className="p-5 bg-surface border border-primary-border rounded-xl shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Instant Serviceability & SLA Engine
            </h2>
          </div>
          <span className="text-xs text-muted-foreground">Zero-Mock Real Geocoding Query</span>
        </div>

        <form onSubmit={handleCheckServiceability} className="flex flex-col sm:flex-row gap-3">
          <input
            type="number"
            value={checkPincode}
            onChange={(e) => setCheckPincode(e.target.value)}
            placeholder="Enter destination pincode (e.g. 560001)..."
            className="flex-1 px-4 py-2.5 bg-surface-muted border border-border rounded-lg text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />

          <select
            value={checkServiceLevel}
            onChange={(e) => setCheckServiceLevel(e.target.value)}
            className="px-3 py-2.5 bg-surface-muted border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary"
          >
            <option value="STANDARD">Standard Delivery</option>
            <option value="EXPRESS">Express Priority</option>
            <option value="SAME_DAY">Same-Day Rush</option>
          </select>

          <button
            type="submit"
            disabled={checking || !checkPincode.trim()}
            className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground rounded-lg text-sm font-semibold transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {checking ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Check Serviceability"}
          </button>
        </form>

        {checkResult && (
          <div
            className={`p-4 rounded-lg border text-xs animate-in fade-in ${
              checkResult.serviceable
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200"
                : "bg-rose-500/10 border-rose-500/30 text-rose-950 dark:text-rose-200"
            }`}
          >
            <div className="flex items-start gap-3">
              {checkResult.serviceable ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <div className="font-bold text-sm">
                  {checkResult.serviceable
                    ? `Pincode ${checkPincode} is SERVICEABLE`
                    : `Pincode ${checkPincode} is NOT SERVICEABLE`}
                </div>
                <div className="text-xs opacity-90">
                  {checkResult.message ||
                    (checkResult.serviceable
                      ? `Covered under Zone: ${checkResult.zone?.name || "N/A"} (${checkResult.zone?.city || "Active"})`
                      : "No active delivery hub or fulfillment node covers this destination.")}
                </div>

                {checkResult.serviceable && (
                  <div className="flex flex-wrap gap-4 pt-2 font-mono text-[11px] opacity-85">
                    <span>Nearest Hub: {checkResult.hub?.name || "Regional Sort Facility"}</span>
                    <span>Promised SLA: {checkResult.expectedSlaHours || 48} Hours</span>
                    <span>Standard Shipping Fee: ₹{checkResult.deliveryFee || 49}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Counters Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-surface border border-border rounded-xl">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Total Zones
          </div>
          <div className="text-2xl font-bold text-foreground mt-1 font-mono">
            {zones.length}
          </div>
        </div>
        <div className="p-4 bg-surface border border-border rounded-xl">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Indexed Pincodes
          </div>
          <div className="text-2xl font-bold text-primary mt-1 font-mono">
            {totalPincodes}
          </div>
        </div>
        <div className="p-4 bg-surface border border-border rounded-xl">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Same-Day Enabled
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
            {sameDayZonesCount} <span className="text-xs text-muted-foreground">Zones</span>
          </div>
        </div>
        <div className="p-4 bg-surface border border-border rounded-xl">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Standard Base Fee
          </div>
          <div className="text-2xl font-bold text-foreground mt-1 font-mono">
            ₹49 <span className="text-xs text-muted-foreground">avg</span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-3 bg-surface border border-border p-3 rounded-xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter zones by code or city..."
            className="w-full pl-9 pr-3 py-1.5 bg-surface-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Zones List / Cards */}
      {loading ? (
        <div className="py-20 text-center text-muted-foreground">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin mb-3 text-primary" />
          <p className="text-sm font-medium">Loading delivery zones...</p>
        </div>
      ) : filteredZones.length === 0 ? (
        <div className="py-20 text-center bg-surface border border-border rounded-xl space-y-3">
          <MapPin className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
          <h3 className="font-semibold text-foreground">No Delivery Zones Defined</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {zones.length === 0
              ? "No delivery boundaries are registered yet. Click 'Add Delivery Zone' above to define serviceable sectors."
              : "No zones matched your filter query."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredZones.map((z) => (
            <div
              key={z._id}
              className="bg-surface border border-border rounded-xl p-5 space-y-4 hover:border-border-strong transition-all shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-primary-soft text-primary border border-primary-border">
                      {z.zoneCode}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        z.serviceability
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {z.serviceability ? "SERVICEABLE" : "SUSPENDED"}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-foreground mt-1">
                    {z.name}
                  </h3>
                  <div className="text-xs text-muted-foreground mt-0.5">{z.city}</div>
                </div>

                {z.sameDayAvailable && (
                  <span
                    className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    title="Same-Day Delivery Enabled"
                  >
                    <Zap className="w-4 h-4" />
                  </span>
                )}
              </div>

              {/* SLA & Fee Grid */}
              <div className="grid grid-cols-3 gap-2 py-2 border-y border-border text-center text-xs">
                <div>
                  <div className="text-muted-foreground text-[10px]">Standard SLA</div>
                  <div className="font-mono font-bold text-foreground mt-0.5">
                    {z.standardSlaHours || 48}h
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground text-[10px]">Express SLA</div>
                  <div className="font-mono font-bold text-foreground mt-0.5">
                    {z.expressSlaHours || 24}h
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground text-[10px]">Delivery Fee</div>
                  <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    ₹{z.deliveryFee || 49}
                  </div>
                </div>
              </div>

              {/* Hub & Pincode tags */}
              <div className="space-y-2 text-xs">
                {z.hub && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Serving Hub: <strong className="text-foreground">{z.hub.name || z.hub.hubCode || "Linked Facility"}</strong></span>
                  </div>
                )}

                <div>
                  <div className="text-[11px] text-muted-foreground mb-1">
                    Covered Pincodes ({z.pincodes?.length || 0}):
                  </div>
                  <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                    {z.pincodes?.map((pin: number) => (
                      <span
                        key={pin}
                        className="px-1.5 py-0.5 bg-surface-muted rounded font-mono text-[10px] text-foreground border border-border"
                      >
                        {pin}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Create Zone */}
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
                <MapPin className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-foreground">Create Delivery Zone</h3>
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
                    Zone Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.zoneCode}
                    onChange={(e) => setFormData({ ...formData, zoneCode: e.target.value })}
                    placeholder="e.g. ZN-BLR-01"
                    className="w-full px-3 py-2 bg-surface-muted border border-border rounded-lg uppercase font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  />
                </div>
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
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Zone Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Koramangala - HSR Layout Sector"
                  className="w-full px-3 py-2 bg-surface-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Pincodes Covered (Comma-separated) *
                </label>
                <textarea
                  required
                  rows={2}
                  value={formData.pincodes}
                  onChange={(e) => setFormData({ ...formData, pincodes: e.target.value })}
                  placeholder="560034, 560095, 560102..."
                  className="w-full px-3 py-2 bg-surface-muted border border-border rounded-lg font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Assigned Delivery Hub
                </label>
                <select
                  value={formData.hubId}
                  onChange={(e) => setFormData({ ...formData, hubId: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-muted border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="">-- No Dedicated Hub --</option>
                  {hubs.map((h) => (
                    <option key={h._id} value={h._id}>
                      {h.hubCode} — {h.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Standard SLA (Hrs)
                  </label>
                  <input
                    type="number"
                    value={formData.standardSlaHours}
                    onChange={(e) =>
                      setFormData({ ...formData, standardSlaHours: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-surface-muted border border-border rounded-lg font-mono text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Express SLA (Hrs)
                  </label>
                  <input
                    type="number"
                    value={formData.expressSlaHours}
                    onChange={(e) =>
                      setFormData({ ...formData, expressSlaHours: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-surface-muted border border-border rounded-lg font-mono text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Fee (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.deliveryFee}
                    onChange={(e) => setFormData({ ...formData, deliveryFee: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-muted border border-border rounded-lg font-mono text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground">
                  <input
                    type="checkbox"
                    checked={formData.serviceability}
                    onChange={(e) =>
                      setFormData({ ...formData, serviceability: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-primary focus:ring-primary"
                  />
                  <span>Zone Serviceable</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground">
                  <input
                    type="checkbox"
                    checked={formData.sameDayAvailable}
                    onChange={(e) =>
                      setFormData({ ...formData, sameDayAvailable: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-primary focus:ring-primary"
                  />
                  <span>Enable Same-Day Rush</span>
                </label>
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
                  {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Save Zone"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
