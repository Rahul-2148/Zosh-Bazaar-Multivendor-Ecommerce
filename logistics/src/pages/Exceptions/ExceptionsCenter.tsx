import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  Plus,
  Search,
  CheckCircle2,
  RefreshCw,
  X,
  ExternalLink,
} from "lucide-react";
import { Link } from "react-router-dom";
import { logisticsApi } from "../../services/api";

const EXCEPTION_TYPES = [
  "ADDRESS_ISSUE",
  "CUSTOMER_UNAVAILABLE",
  "DELIVERY_FAILED",
  "WRONG_ADDRESS",
  "PACKAGE_DAMAGED",
  "PACKAGE_MISSING",
  "HUB_DELAY",
  "VEHICLE_ISSUE",
  "AGENT_UNAVAILABLE",
  "ROUTE_DEVIATION",
  "PAYMENT_ISSUE",
];

export const ExceptionsCenter: React.FC = () => {
  const [exceptions, setExceptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  // Resolve / Triage Modal
  const [selectedException, setSelectedException] = useState<any | null>(null);
  const [triageStatus, setTriageStatus] = useState("INVESTIGATING");
  const [triageNote, setTriageNote] = useState("");
  const [resolutionAction, setResolutionAction] = useState("");

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [createForm, setCreateForm] = useState({
    shipmentTrackingNumber: "",
    type: "ADDRESS_ISSUE",
    priority: "HIGH",
    reason: "",
    assignedTo: "Triage Team",
  });

  useEffect(() => {
    fetchExceptions();
  }, []);

  const fetchExceptions = async () => {
    setLoading(true);
    try {
      const res = await logisticsApi.getExceptions();
      if (res.data?.exceptions) {
        setExceptions(res.data.exceptions);
      }
    } catch (err) {
      console.error("Failed to load exceptions", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedException) return;

    setIsSubmitting(true);
    try {
      await logisticsApi.updateExceptionStatus(selectedException._id, {
        status: triageStatus,
        note: triageNote.trim(),
        resolutionAction: resolutionAction.trim(),
        resolvedBy: "Triage Lead",
      });

      setSelectedException(null);
      setTriageNote("");
      setResolutionAction("");
      fetchExceptions();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update exception state");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateException = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsSubmitting(true);

    try {
      // Find shipment ID by tracking
      const shipRes = await logisticsApi.getShipments({
        trackingNumber: createForm.shipmentTrackingNumber.trim(),
        limit: 1,
      });

      const foundShipment = shipRes.data?.shipments?.[0];
      if (!foundShipment) {
        throw new Error(
          `Shipment with tracking # ${createForm.shipmentTrackingNumber} not found.`
        );
      }

      await logisticsApi.createException({
        shipmentId: foundShipment._id,
        trackingNumber: foundShipment.trackingNumber,
        type: createForm.type,
        priority: createForm.priority,
        reason: createForm.reason.trim(),
        assignedTo: createForm.assignedTo.trim(),
      });

      setShowCreateModal(false);
      setCreateForm({
        shipmentTrackingNumber: "",
        type: "ADDRESS_ISSUE",
        priority: "HIGH",
        reason: "",
        assignedTo: "Triage Team",
      });
      fetchExceptions();
    } catch (err: any) {
      setErrorMsg(err.message || err.response?.data?.message || "Failed to log exception");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = exceptions.filter((ex) => {
    const matchesSearch =
      ex.exceptionCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.trackingNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.reason?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || ex.status === statusFilter;
    const matchesType = typeFilter === "ALL" || ex.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const activeCount = exceptions.filter((e) => e.status !== "RESOLVED").length;
  const criticalCount = exceptions.filter(
    (e) => ["CRITICAL", "HIGH"].includes(e.priority) && e.status !== "RESOLVED"
  ).length;
  const resolvedCount = exceptions.filter((e) => e.status === "RESOLVED").length;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Logistics Exceptions & Incident Desk
            </h1>
            <span
              className={`px-2 py-0.5 text-xs font-semibold rounded border ${
                activeCount > 0
                  ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                  : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
              }`}
            >
              {activeCount} Active Issues
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time delivery exceptions, customer unavailability flags, address anomalies, and hub delay remediation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchExceptions}
            disabled={loading}
            className="p-2.5 rounded-lg border border-border bg-card hover:bg-surface-hover text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-semibold transition-all shadow-xs flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Report Exception
          </button>
        </div>
      </div>

      {/* Counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-card border border-border rounded-xl shadow-xs">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Active Incidents
          </div>
          <div className="text-2xl font-bold text-foreground mt-1 font-mono">
            {activeCount}
          </div>
        </div>
        <div className="p-4 bg-card border border-border rounded-xl shadow-xs">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Critical / High Risk
          </div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1 font-mono">
            {criticalCount}
          </div>
        </div>
        <div className="p-4 bg-card border border-border rounded-xl shadow-xs">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Resolved In Period
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
            {resolvedCount}
          </div>
        </div>
        <div className="p-4 bg-card border border-border rounded-xl shadow-xs">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Resolution Rate
          </div>
          <div className="text-2xl font-bold text-primary mt-1 font-mono">
            {exceptions.length > 0
              ? Math.round((resolvedCount / exceptions.length) * 100)
              : 100}
            %
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-3 bg-card border border-border p-3 rounded-xl shadow-xs">
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search incident #, tracking, reason..."
            className="w-full pl-9 pr-3 py-1.5 bg-surface-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-surface-muted border border-border text-foreground focus:outline-none focus:border-primary"
          >
            <option value="ALL">All Types</option>
            {EXCEPTION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          {["ALL", "DETECTED", "INVESTIGATING", "ACTION_REQUIRED", "RESOLVED"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === s
                  ? "bg-primary text-white shadow-xs"
                  : "bg-surface-muted text-muted-foreground hover:text-foreground hover:bg-surface-hover"
              }`}
            >
              {s.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Exceptions Table */}
      {loading ? (
        <div className="py-20 text-center text-muted-foreground">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin mb-3 text-primary" />
          <p className="text-sm">Scanning active exceptions...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center bg-card border border-border rounded-xl space-y-3">
          <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 opacity-60" />
          <h3 className="font-semibold text-foreground">
            Logistics Pipeline Operating Cleanly
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {exceptions.length === 0
              ? "Zero active incidents or delivery failures currently recorded across the network."
              : "No exceptions matched the specified filter criteria."}
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-muted border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Incident Ref</th>
                  <th className="px-5 py-3.5">Shipment File</th>
                  <th className="px-5 py-3.5">Classification</th>
                  <th className="px-5 py-3.5">Severity</th>
                  <th className="px-5 py-3.5">Root Cause / Summary</th>
                  <th className="px-5 py-3.5">Assigned Owner</th>
                  <th className="px-5 py-3.5">State</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((ex) => (
                  <tr
                    key={ex._id}
                    className="hover:bg-surface-hover transition-colors"
                  >
                    <td className="px-5 py-4 font-mono font-bold text-foreground text-xs">
                      {ex.exceptionCode}
                      <div className="text-[11px] font-normal text-muted-foreground font-sans mt-0.5">
                        {new Date(ex.createdAt).toLocaleString()}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-xs font-mono">
                      <Link
                        to={`/shipments/${ex.shipment?._id || ex.shipment}`}
                        className="text-primary hover:underline font-semibold inline-flex items-center gap-1"
                      >
                        {ex.trackingNumber || "View Shipment"}
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>

                    <td className="px-5 py-4 text-xs font-semibold text-foreground">
                      {ex.type?.replace(/_/g, " ")}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          ex.priority === "CRITICAL"
                            ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                            : ex.priority === "HIGH"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                            : "bg-surface-muted text-muted-foreground"
                        }`}
                      >
                        {ex.priority}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-xs max-w-xs text-muted-foreground truncate">
                      {ex.reason || "No detailed operational description logged."}
                    </td>

                    <td className="px-5 py-4 text-xs text-muted-foreground font-medium">
                      {ex.assignedTo || "Unassigned"}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          ex.status === "RESOLVED"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : ex.status === "ACTION_REQUIRED"
                            ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                            : ex.status === "INVESTIGATING"
                            ? "bg-sky-500/10 text-sky-600 dark:text-sky-400"
                            : "bg-surface-muted text-muted-foreground"
                        }`}
                      >
                        {ex.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      {ex.status !== "RESOLVED" ? (
                        <button
                          onClick={() => {
                            setSelectedException(ex);
                            setTriageStatus(
                              ex.status === "DETECTED" ? "INVESTIGATING" : "ACTION_REQUIRED"
                            );
                          }}
                          className="px-3 py-1 text-xs font-semibold rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                        >
                          Triage & Resolve
                        </button>
                      ) : (
                        <span className="text-xs text-emerald-600 font-medium">Closed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Triage & Resolve Exception */}
      {selectedException && (
        <div
          onClick={() => setSelectedException(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-xs animate-in fade-in duration-150 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-card border border-border rounded-xl w-full max-w-md shadow-2xl p-6 space-y-4 cursor-default"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-bold text-foreground">
                  Triage: {selectedException.exceptionCode}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Shipment: {selectedException.trackingNumber} ({selectedException.type})
                </p>
              </div>
              <button
                onClick={() => setSelectedException(null)}
                className="p-1 rounded-lg hover:bg-surface-hover text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-lg bg-surface-muted border border-border text-xs space-y-1">
              <span className="text-muted-foreground block uppercase text-[10px] font-bold">
                Reported Problem:
              </span>
              <p className="text-foreground font-medium">
                {selectedException.reason}
              </p>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Transition Status *
                </label>
                <select
                  value={triageStatus}
                  onChange={(e) => setTriageStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-muted border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="INVESTIGATING">INVESTIGATING — Inquiring with Driver / Hub</option>
                  <option value="ACTION_REQUIRED">ACTION_REQUIRED — Customer Call / Address Fix</option>
                  <option value="RESOLVED">RESOLVED — Re-routed or Cleared for Delivery</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Operational Triage Notes
                </label>
                <textarea
                  rows={2}
                  value={triageNote}
                  onChange={(e) => setTriageNote(e.target.value)}
                  placeholder="e.g. Spoke to customer, confirmed gate entry code..."
                  className="w-full px-3 py-2 bg-surface-muted border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>

              {triageStatus === "RESOLVED" && (
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Corrective Resolution Action Taken *
                  </label>
                  <input
                    type="text"
                    required
                    value={resolutionAction}
                    onChange={(e) => setResolutionAction(e.target.value)}
                    placeholder="e.g. Address amended, scheduled re-attempt for 14:00"
                    className="w-full px-3 py-2 bg-surface-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setSelectedException(null)}
                  className="px-3 py-1.5 border border-border rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Save Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Report New Exception */}
      {showCreateModal && (
        <div
          onClick={() => setShowCreateModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-xs animate-in fade-in duration-150 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-card border border-border rounded-xl w-full max-w-md shadow-2xl p-6 space-y-4 cursor-default"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                <h3 className="font-bold text-foreground">Report Logistics Incident</h3>
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

            <form onSubmit={handleCreateException} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Shipment Tracking Number *
                </label>
                <input
                  type="text"
                  required
                  value={createForm.shipmentTrackingNumber}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, shipmentTrackingNumber: e.target.value })
                  }
                  placeholder="e.g. ZBSHP10245"
                  className="w-full px-3 py-2 bg-surface-muted border border-border rounded-lg uppercase font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Incident Type *
                  </label>
                  <select
                    value={createForm.type}
                    onChange={(e) => setCreateForm({ ...createForm, type: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-muted border border-border rounded-lg text-foreground focus:outline-none focus:border-primary text-xs"
                  >
                    {EXCEPTION_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Priority Severity *
                  </label>
                  <select
                    value={createForm.priority}
                    onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-muted border border-border rounded-lg text-foreground focus:outline-none focus:border-primary text-xs"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Incident Reason / Driver Remarks *
                </label>
                <textarea
                  required
                  rows={3}
                  value={createForm.reason}
                  onChange={(e) => setCreateForm({ ...createForm, reason: e.target.value })}
                  placeholder="Detail the failure: e.g. Customer unreachable after 3 doorbell attempts..."
                  className="w-full px-3 py-2 bg-surface-muted border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 border border-border rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Log Incident"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
