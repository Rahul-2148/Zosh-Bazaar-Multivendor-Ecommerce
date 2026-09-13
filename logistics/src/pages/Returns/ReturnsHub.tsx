import React, { useState, useEffect } from "react";
import {
  RotateCcw,
  Search,
  CheckCircle2,
  XCircle,
  PackageCheck,
  RefreshCw,
  X,
  ExternalLink,
  ClipboardCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { logisticsApi } from "../../services/api";

export const ReturnsHub: React.FC = () => {
  const [returnShipments, setReturnShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedReturn, setSelectedReturn] = useState<any | null>(null);
  const [inspectionResult, setInspectionResult] = useState<"RESTOCK" | "REJECT">("RESTOCK");
  const [inspectionNotes, setInspectionNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchReturns();
  }, []);

  const fetchReturns = async () => {
    setLoading(true);
    try {
      // Query shipments with RETURNED or delivery failures or exceptions
      const res = await logisticsApi.getShipments({
        status: "RETURNED",
        limit: 100,
      });
      if (res.data?.shipments) {
        setReturnShipments(res.data.shipments);
      }
    } catch (err) {
      console.error("Failed to load return shipments", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInspectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReturn) return;
    setIsSubmitting(true);

    try {
      await logisticsApi.transitionStatus(selectedReturn._id, {
        status: inspectionResult === "RESTOCK" ? "RETURNED" : "DELIVERY_FAILED",
        note: `Quality Inspection Completed: ${inspectionResult}. Notes: ${inspectionNotes.trim()}`,
      });

      setSelectedReturn(null);
      setInspectionNotes("");
      fetchReturns();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to submit inspection report");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = returnShipments.filter((r) => {
    const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;
    const matchesSearch =
      r.trackingNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Reverse Logistics & Returns Processing
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-primary/10 text-primary border border-primary/20">
              {returnShipments.length} Reverse Shipments
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Customer return pickups, transit consolidation, warehouse quality inspection, and restocking gates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchReturns}
            disabled={loading}
            className="p-2.5 rounded-lg border border-border bg-card hover:bg-surface-hover text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-card border border-border rounded-xl shadow-xs">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Total Reverse Volume
          </div>
          <div className="text-2xl font-bold text-foreground mt-1 font-mono">
            {returnShipments.length}
          </div>
        </div>
        <div className="p-4 bg-card border border-border rounded-xl shadow-xs">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Pending Quality Inspection
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1 font-mono">
            {returnShipments.filter((r) => r.status === "RETURNED").length}
          </div>
        </div>
        <div className="p-4 bg-card border border-border rounded-xl shadow-xs">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Restocked Rate
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
            94.2%
          </div>
        </div>
        <div className="p-4 bg-card border border-border rounded-xl shadow-xs">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Scrap / Damage Rate
          </div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1 font-mono">
            5.8%
          </div>
        </div>
      </div>

      {/* Filter / Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card border border-border p-3 rounded-xl shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search return tracking # or customer..."
            className="w-full pl-9 pr-3 py-1.5 bg-surface-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {["ALL", "RETURNED", "DELIVERY_FAILED", "CANCELLED"].map((s) => (
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

      {/* Returns Table */}
      {loading ? (
        <div className="py-20 text-center text-muted-foreground">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin mb-3 text-primary" />
          <p className="text-sm">Querying reverse logistics pipeline...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center bg-card border border-border rounded-xl space-y-3">
          <RotateCcw className="w-12 h-12 mx-auto text-muted-foreground opacity-40" />
          <h3 className="font-semibold text-foreground">
            No Return Shipments Active
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Zero customer returns or reverse logistics transit legs are currently recorded.
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-muted border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Return Tracking #</th>
                  <th className="px-5 py-3.5">Customer & Origin</th>
                  <th className="px-5 py-3.5">Destination Warehouse</th>
                  <th className="px-5 py-3.5">Package Weight</th>
                  <th className="px-5 py-3.5">Reverse State</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((r) => (
                  <tr
                    key={r._id}
                    className="hover:bg-surface-hover transition-colors"
                  >
                    <td className="px-5 py-4 font-mono font-bold text-foreground text-xs">
                      <Link
                        to={`/shipments/${r._id}`}
                        className="text-primary hover:underline inline-flex items-center gap-1"
                      >
                        {r.trackingNumber}
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                      <div className="text-[11px] font-normal text-muted-foreground font-sans mt-0.5">
                        Initiated {new Date(r.createdAt).toLocaleDateString()}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-xs">
                      <div className="font-semibold text-foreground">
                        {r.customer?.name || "Customer"}
                      </div>
                      <div className="text-muted-foreground text-[11px]">
                        {r.deliveryAddress?.city}, {r.deliveryAddress?.state}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-xs">
                      <div className="font-medium text-foreground">
                        {r.originWarehouse?.warehouseCode || "Primary Fulfillment Hub"}
                      </div>
                      <div className="text-[11px] text-muted-foreground">Receiving Staging Bay 3</div>
                    </td>

                    <td className="px-5 py-4 text-xs font-mono text-foreground font-semibold">
                      {r.package?.weightKg || 1} kg
                    </td>

                    <td className="px-5 py-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400">
                        {r.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => setSelectedReturn(r)}
                        className="px-3 py-1 text-xs font-semibold rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors inline-flex items-center gap-1"
                      >
                        <ClipboardCheck className="w-3.5 h-3.5" /> Quality Inspection
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Quality Inspection */}
      {selectedReturn && (
        <div
          onClick={() => setSelectedReturn(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-xs animate-in fade-in duration-150 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-card border border-border rounded-xl w-full max-w-md shadow-2xl p-6 space-y-4 cursor-default"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-foreground">
                  Warehouse Inbound Inspection
                </h3>
              </div>
              <button
                onClick={() => setSelectedReturn(null)}
                className="p-1 rounded-lg hover:bg-surface-hover text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs p-3 rounded-lg bg-surface-muted border border-border space-y-1 text-foreground">
              <div>
                Package: <strong className="font-mono text-foreground">{selectedReturn.trackingNumber}</strong>
              </div>
              <div>
                Customer: <strong className="text-foreground">{selectedReturn.customer?.name}</strong>
              </div>
              <div>
                Declared Weight: <strong className="text-foreground">{selectedReturn.package?.weightKg} kg</strong>
              </div>
            </div>

            <form onSubmit={handleInspectionSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2">
                  Inspection Outcome *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setInspectionResult("RESTOCK")}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      inspectionResult === "RESTOCK"
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold ring-1 ring-emerald-500"
                        : "border-border text-muted-foreground hover:bg-surface-hover"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 mb-1 text-emerald-500" />
                    <div className="text-xs font-semibold">Pass & Restock</div>
                    <div className="text-[10px] font-normal opacity-80">Tags intact, unsealed</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInspectionResult("REJECT")}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      inspectionResult === "REJECT"
                        ? "border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300 font-bold ring-1 ring-rose-500"
                        : "border-border text-muted-foreground hover:bg-surface-hover"
                    }`}
                  >
                    <XCircle className="w-4 h-4 mb-1 text-rose-500" />
                    <div className="text-xs font-semibold">Damaged / Reject</div>
                    <div className="text-[10px] font-normal opacity-80">Scrap or dispute</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Inspector Remarks
                </label>
                <textarea
                  rows={2}
                  value={inspectionNotes}
                  onChange={(e) => setInspectionNotes(e.target.value)}
                  placeholder="Verified packaging integrity, barcode scanned and restocked..."
                  className="w-full px-3 py-2 bg-surface-muted border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setSelectedReturn(null)}
                  className="px-3 py-1.5 border border-border rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Complete Inspection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
