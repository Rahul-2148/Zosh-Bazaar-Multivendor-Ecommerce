import React, { useState, useEffect } from "react";
import {
  Truck,
  Plus,
  Search,
  CheckCircle2,
  Lock,
  Send,
  RefreshCw,
  X,
  FileCheck,
} from "lucide-react";
import { logisticsApi } from "../../services/api";

export const ManifestsHub: React.FC = () => {
  const [manifests, setManifests] = useState<any[]>([]);
  const [hubs, setHubs] = useState<any[]>([]);
  const [availableShipments, setAvailableShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSealModal, setShowSealModal] = useState<any | null>(null);
  const [showReceiveModal, setShowReceiveModal] = useState<any | null>(null);
  const [sealNumberInput, setSealNumberInput] = useState("");
  const [receivedByInput, setReceivedByInput] = useState("Hub Inbound Supervisor");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Create Form
  const [createForm, setCreateForm] = useState({
    originHub: "",
    destinationHub: "",
    type: "LINE_HAUL",
    vehiclePlate: "",
    driverName: "",
    driverPhone: "",
    selectedShipmentIds: [] as string[],
  });

  useEffect(() => {
    fetchManifests();
    fetchHubsAndShipments();
  }, []);

  const fetchManifests = async () => {
    setLoading(true);
    try {
      const res = await logisticsApi.getManifests();
      if (res.data?.manifests) {
        setManifests(res.data.manifests);
      }
    } catch (err) {
      console.error("Failed to load manifests", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHubsAndShipments = async () => {
    try {
      const [hubsRes, shipmentsRes] = await Promise.all([
        logisticsApi.getHubs({ status: "ACTIVE" }),
        logisticsApi.getShipments({ status: "READY_FOR_DISPATCH", limit: 50 }),
      ]);
      if (hubsRes.data?.hubs) {
        setHubs(hubsRes.data.hubs);
        if (hubsRes.data.hubs.length >= 2) {
          setCreateForm((prev) => ({
            ...prev,
            originHub: hubsRes.data.hubs[0]._id,
            destinationHub: hubsRes.data.hubs[1]._id,
          }));
        }
      }
      if (shipmentsRes.data?.shipments) {
        setAvailableShipments(shipmentsRes.data.shipments);
      }
    } catch (e) {
      console.error("Failed to fetch auxiliary manifest dependencies", e);
    }
  };

  const handleCreateManifest = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsSubmitting(true);

    try {
      await logisticsApi.createManifest({
        originHub: createForm.originHub,
        destinationHub: createForm.destinationHub,
        type: createForm.type,
        vehiclePlate: createForm.vehiclePlate.trim().toUpperCase(),
        driverName: createForm.driverName.trim(),
        driverPhone: createForm.driverPhone.trim(),
        shipmentIds: createForm.selectedShipmentIds,
      });

      setShowCreateModal(false);
      setCreateForm({
        originHub: hubs[0]?._id || "",
        destinationHub: hubs[1]?._id || "",
        type: "LINE_HAUL",
        vehiclePlate: "",
        driverName: "",
        driverPhone: "",
        selectedShipmentIds: [],
      });
      fetchManifests();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to generate manifest");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showSealModal) return;
    setIsSubmitting(true);
    try {
      await logisticsApi.sealManifest(showSealModal._id, sealNumberInput.trim());
      setShowSealModal(null);
      setSealNumberInput("");
      fetchManifests();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to seal manifest");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDispatch = async (manifestId: string) => {
    if (!confirm("Dispatch line-haul vehicle and transmit manifest?")) return;
    try {
      await logisticsApi.dispatchManifest(manifestId);
      fetchManifests();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to dispatch manifest");
    }
  };

  const handleReceive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showReceiveModal) return;
    setIsSubmitting(true);
    try {
      await logisticsApi.receiveManifest(showReceiveModal._id, receivedByInput.trim());
      setShowReceiveModal(null);
      fetchManifests();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to receive manifest");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = manifests.filter((m) => {
    const matchesSearch =
      m.manifestNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.vehiclePlate?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.driverName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Transfer Manifests & Line-Haul
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-primary-soft text-primary border border-primary-border">
              {manifests.length} Batches
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Custody transfer manifests, inter-hub line haul, and tamper-evident container tracking.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchManifests}
            disabled={loading}
            className="p-2.5 rounded-lg border border-border bg-surface hover:bg-surface-hover text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground rounded-lg text-sm font-semibold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create Manifest
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface border border-border p-3 rounded-xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search manifest #, plate, or driver..."
            className="w-full pl-9 pr-3 py-1.5 bg-surface-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {["ALL", "OPEN", "SEALED", "DISPATCHED", "RECEIVED", "CLOSED"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === s
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-surface-muted text-muted-foreground hover:text-foreground hover:bg-surface-hover border border-border"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Manifests Table */}
      {loading ? (
        <div className="py-20 text-center text-muted-foreground">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin mb-3 text-primary" />
          <p className="text-sm font-medium">Retrieving transfer manifests...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center bg-surface border border-border rounded-xl space-y-3">
          <Truck className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
          <h3 className="font-semibold text-foreground">No Manifests Found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {manifests.length === 0
              ? "No line-haul or inter-hub manifests exist. Click 'Create Manifest' to batch shipments for transport."
              : "No manifests matched the selected filter."}
          </p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-muted border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Manifest Number</th>
                  <th className="px-5 py-3.5">Transit Corridor</th>
                  <th className="px-5 py-3.5">Vehicle & Driver</th>
                  <th className="px-5 py-3.5 text-center">Shipments</th>
                  <th className="px-5 py-3.5">Security Seal</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((m) => (
                  <tr key={m._id} className="hover:bg-surface-hover transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-foreground">
                      {m.manifestNumber}
                      <div className="text-[11px] font-normal text-muted-foreground font-sans mt-0.5">
                        {new Date(m.createdAt).toLocaleDateString()}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 font-medium text-foreground text-xs">
                        <span>{m.originHub?.hubCode || "ORIGIN"}</span>
                        <span className="text-muted-foreground">&rarr;</span>
                        <span>{m.destinationHub?.hubCode || "DEST"}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {m.type?.replace(/_/g, " ")}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-xs">
                      <div className="font-mono font-semibold text-foreground">
                        {m.vehiclePlate || "N/A"}
                      </div>
                      <div className="text-muted-foreground text-[11px] mt-0.5">
                        {m.driverName || "Assigned Carrier"} {m.driverPhone && `(${m.driverPhone})`}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <span className="px-2.5 py-1 rounded-full font-mono text-xs font-bold bg-surface-muted text-foreground border border-border">
                        {m.scannedShipments?.length || 0} / {m.totalShipmentsCount || m.shipments?.length || 0}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-xs font-mono">
                      {m.sealNumber ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                          <Lock className="w-3 h-3" /> {m.sealNumber}
                        </span>
                      ) : (
                        <span className="text-muted-foreground italic">Unsealed</span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          m.status === "RECEIVED" || m.status === "CLOSED"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : m.status === "DISPATCHED"
                            ? "bg-sky-500/10 text-sky-600 dark:text-sky-400"
                            : m.status === "SEALED"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            : "bg-surface-muted text-muted-foreground border border-border"
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right space-x-2 whitespace-nowrap">
                      {m.status === "OPEN" && (
                        <button
                          onClick={() => {
                            setShowSealModal(m);
                            setSealNumberInput(`SEAL-${Math.floor(100000 + Math.random() * 900000)}`);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors inline-flex items-center gap-1"
                        >
                          <Lock className="w-3 h-3" /> Seal
                        </button>
                      )}

                      {m.status === "SEALED" && (
                        <button
                          onClick={() => handleDispatch(m._id)}
                          className="px-2.5 py-1 text-xs font-semibold rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 transition-colors inline-flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" /> Dispatch
                        </button>
                      )}

                      {m.status === "DISPATCHED" && (
                        <button
                          onClick={() => setShowReceiveModal(m)}
                          className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors inline-flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3" /> Receive
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Create Manifest */}
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
                <FileCheck className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-foreground">Create Transfer Manifest</h3>
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

            <form onSubmit={handleCreateManifest} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Origin Hub *
                  </label>
                  <select
                    required
                    value={createForm.originHub}
                    onChange={(e) => setCreateForm({ ...createForm, originHub: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-muted border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                  >
                    {hubs.map((h) => (
                      <option key={h._id} value={h._id}>
                        {h.hubCode} — {h.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Destination Hub *
                  </label>
                  <select
                    required
                    value={createForm.destinationHub}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, destinationHub: e.target.value })
                    }
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Vehicle Number Plate
                  </label>
                  <input
                    type="text"
                    value={createForm.vehiclePlate}
                    onChange={(e) => setCreateForm({ ...createForm, vehiclePlate: e.target.value })}
                    placeholder="KA01XX1234"
                    className="w-full px-3 py-2 bg-surface-muted border border-border rounded-lg font-mono uppercase text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Driver Name
                  </label>
                  <input
                    type="text"
                    value={createForm.driverName}
                    onChange={(e) => setCreateForm({ ...createForm, driverName: e.target.value })}
                    placeholder="Ramesh Kumar"
                    className="w-full px-3 py-2 bg-surface-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Ready Packages Selection */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Attach Ready Shipments ({availableShipments.length} Available for dispatch)
                </label>
                {availableShipments.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-2">
                    No shipments are currently marked 'READY_FOR_DISPATCH'. You can create the manifest shell now and scan packages into it at the dock.
                  </p>
                ) : (
                  <div className="max-h-36 overflow-y-auto space-y-1 p-2 bg-surface-muted border border-border rounded-lg">
                    {availableShipments.map((s) => (
                      <label key={s._id} className="flex items-center gap-2 text-xs cursor-pointer text-foreground">
                        <input
                          type="checkbox"
                          checked={createForm.selectedShipmentIds.includes(s._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCreateForm({
                                ...createForm,
                                selectedShipmentIds: [...createForm.selectedShipmentIds, s._id],
                              });
                            } else {
                              setCreateForm({
                                ...createForm,
                                selectedShipmentIds: createForm.selectedShipmentIds.filter(
                                  (id) => id !== s._id
                                ),
                              });
                            }
                          }}
                          className="rounded text-primary focus:ring-primary"
                        />
                        <span className="font-mono font-semibold">{s.trackingNumber}</span>
                        <span className="text-muted-foreground truncate">
                          ({s.deliveryAddress?.city} — ₹{s.package?.weightKg || 1}kg)
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
                  className="px-4 py-2 border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-hover cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-primary hover:bg-primary-hover text-primary-foreground rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Save Manifest"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Seal Manifest */}
      {showSealModal && (
        <div
          onClick={() => setShowSealModal(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-xs cursor-pointer animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-2xl p-5 space-y-4 cursor-default"
          >
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-500" /> Seal Manifest
              </h3>
              <button
                onClick={() => setShowSealModal(null)}
                className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSeal} className="space-y-3 text-sm">
              <p className="text-xs text-muted-foreground">
                Enter the physical tamper-evident security seal tag attached to container/vehicle doors.
              </p>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Seal Barcode / Tag #
                </label>
                <input
                  type="text"
                  required
                  value={sealNumberInput}
                  onChange={(e) => setSealNumberInput(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-muted border border-border rounded-lg font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSealModal(null)}
                  className="px-3 py-1.5 border border-border rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-surface-hover cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !sealNumberInput.trim()}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Confirm Seal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Receive Manifest */}
      {showReceiveModal && (
        <div
          onClick={() => setShowReceiveModal(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-xs cursor-pointer animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-2xl p-5 space-y-4 cursor-default"
          >
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Inbound Gate Receive
              </h3>
              <button
                onClick={() => setShowReceiveModal(null)}
                className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReceive} className="space-y-3 text-sm">
              <p className="text-xs text-muted-foreground">
                Acknowledge vehicle arrival and break seal to ingest shipments into destination hub sortation.
              </p>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Receiving Gate Officer
                </label>
                <input
                  type="text"
                  required
                  value={receivedByInput}
                  onChange={(e) => setReceivedByInput(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReceiveModal(null)}
                  className="px-3 py-1.5 border border-border rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-surface-hover cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !receivedByInput.trim()}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Acknowledge Receipt"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
