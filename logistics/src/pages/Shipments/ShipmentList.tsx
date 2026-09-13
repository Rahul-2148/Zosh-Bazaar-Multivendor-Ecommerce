import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Refresh,
  FileDownloadOutlined,
  LocalShippingOutlined,
  VisibilityOutlined,
  PrintOutlined,
  AssignmentIndOutlined,
  PlayCircleOutline,
} from "@mui/icons-material";
import { logisticsApi } from "../../services/api";
import { StatusBadge } from "../../components/common/StatusBadge";
import { SlaIndicator } from "../../components/common/SlaIndicator";
import dayjs from "dayjs";

export const ShipmentList: React.FC = () => {
  const [shipments, setShipments] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [slaFilter, setSlaFilter] = useState("ALL");
  const [serviceLevelFilter, setServiceLevelFilter] = useState("ALL");

  const navigate = useNavigate();

  const fetchShipments = async () => {
    try {
      setLoading(true);
      const res = await logisticsApi.getShipments({
        page,
        limit: 20,
        search: search.trim() || undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        slaStatus: slaFilter !== "ALL" ? slaFilter : undefined,
        serviceLevel: serviceLevelFilter !== "ALL" ? serviceLevelFilter : undefined,
      });

      if (res.data?.shipments) {
        setShipments(res.data.shipments);
        setTotal(res.data.pagination?.total || 0);
        setPages(res.data.pagination?.pages || 1);
      }
    } catch (err) {
      console.error("Error fetching shipments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, [page, statusFilter, slaFilter, serviceLevelFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchShipments();
  };

  const exportCSV = () => {
    if (shipments.length === 0) return;
    const headers = [
      "Shipment ID",
      "Tracking Number",
      "Customer",
      "City",
      "Pincode",
      "Status",
      "SLA Status",
      "Service Level",
      "Weight (kg)",
      "Created At",
    ];
    const rows = shipments.map((s) => [
      s.shipmentId,
      s.trackingNumber,
      `"${s.deliveryAddress?.name || ""}"`,
      `"${s.deliveryAddress?.city || ""}"`,
      s.deliveryAddress?.pincode,
      s.status,
      s.sla?.slaStatus,
      s.serviceLevel,
      s.packageDetails?.weightKg || 0.8,
      dayjs(s.createdAt).format("YYYY-MM-DD HH:mm"),
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `zosh_shipments_${dayjs().format("YYYYMMDD_HHmm")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            All Shipments & Consignments
          </h1>
          <p className="text-xs text-muted-foreground">
            Central ledger of all physical parcels, linehaul handovers, driver allocations, and proof-of-delivery states.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            disabled={shipments.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-surface text-foreground text-xs font-medium transition-colors shadow-2xs disabled:opacity-50"
          >
            <FileDownloadOutlined fontSize="small" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={fetchShipments}
            className="p-2 rounded-xl border border-border bg-card hover:bg-surface text-foreground transition-colors shadow-2xs"
            title="Refresh Table"
          >
            <Refresh fontSize="small" />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-3.5 rounded-2xl bg-card border border-border shadow-2xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-2 text-muted-foreground" fontSize="small" />
            <input
              type="text"
              placeholder="Search by Shipment ID, Tracking #, Customer Name, Pincode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-border bg-surface text-foreground text-xs font-medium placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-xl border border-border bg-surface text-foreground text-xs font-medium outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="CREATED">Created</option>
            <option value="PICKING">Picking</option>
            <option value="PACKED">Packed</option>
            <option value="DISPATCHED">Dispatched</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="AT_HUB">At Hub</option>
            <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
            <option value="DELIVERED">Delivered</option>
            <option value="DELIVERY_FAILED">Failed</option>
          </select>

          <select
            value={slaFilter}
            onChange={(e) => {
              setSlaFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-xl border border-border bg-surface text-foreground text-xs font-medium outline-none"
          >
            <option value="ALL">All SLAs</option>
            <option value="ON_TRACK">On Track</option>
            <option value="AT_RISK">At Risk</option>
            <option value="BREACHED">Breached</option>
            <option value="COMPLETED">Completed</option>
          </select>

          <select
            value={serviceLevelFilter}
            onChange={(e) => {
              setServiceLevelFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-xl border border-border bg-surface text-foreground text-xs font-medium outline-none"
          >
            <option value="ALL">All Service Levels</option>
            <option value="STANDARD">Standard</option>
            <option value="EXPRESS">Express</option>
            <option value="SAME_DAY">Same Day</option>
          </select>

          <button
            type="submit"
            className="px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity"
          >
            Apply
          </button>
        </form>
      </div>

      {/* Shipments Data Table */}
      <div className="rounded-2xl border border-border bg-card shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface border-b border-border text-muted-foreground uppercase font-mono text-[10px]">
              <tr>
                <th className="px-4 py-3">Shipment / Tracking</th>
                <th className="px-4 py-3">Customer & Dest.</th>
                <th className="px-4 py-3">Package / Items</th>
                <th className="px-4 py-3">Service & SLA</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Driver / Courier</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    Loading shipment registry...
                  </td>
                </tr>
              ) : shipments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-muted-foreground space-y-2">
                    <LocalShippingOutlined fontSize="large" className="opacity-20" />
                    <div className="font-semibold text-foreground text-sm">No Shipments Found</div>
                    <div className="text-xs">
                      When customer orders are booked for fulfillment, their physical shipments will list here.
                    </div>
                  </td>
                </tr>
              ) : (
                shipments.map((s) => (
                  <tr
                    key={s._id}
                    className="hover:bg-surface-hover transition-colors group cursor-pointer"
                    onClick={() => navigate(`/shipments/${s._id}`)}
                  >
                    <td className="px-4 py-3 font-mono">
                      <div className="font-bold text-foreground group-hover:text-primary transition-colors">
                        {s.shipmentId}
                      </div>
                      <div className="text-[11px] text-muted-foreground">{s.trackingNumber}</div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground">{s.deliveryAddress?.name}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {s.deliveryAddress?.city}, {s.deliveryAddress?.pincode}
                      </div>
                    </td>

                    <td className="px-4 py-3 font-mono text-[11px]">
                      <div>{s.packageDetails?.weightKg || 0.8} kg · {s.packageDetails?.packageType || "BOX"}</div>
                      <div className="text-muted-foreground">{s.items?.length || 1} item(s)</div>
                    </td>

                    <td className="px-4 py-3 space-y-1">
                      <span className="inline-block px-1.5 py-0.5 rounded bg-surface border border-border text-[10px] font-mono">
                        {s.serviceLevel}
                      </span>
                      <div>
                        <SlaIndicator
                          slaStatus={s.sla?.slaStatus || "ON_TRACK"}
                          promisedTo={s.sla?.promisedTo}
                          size="sm"
                        />
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <StatusBadge status={s.status} size="sm" />
                    </td>

                    <td className="px-4 py-3">
                      {s.assignedAgent ? (
                        <div>
                          <div className="font-medium text-foreground">{s.assignedAgent.name}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">
                            {s.assignedAgent.agentId}
                          </div>
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground italic">Unassigned</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => navigate(`/shipments/${s._id}`)}
                        className="p-1.5 rounded-lg border border-border bg-surface hover:bg-card text-foreground transition-colors"
                        title="Inspect Shipment"
                      >
                        <VisibilityOutlined fontSize="small" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {total > 0 && (
          <div className="p-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground bg-surface/40">
            <div>
              Showing <span className="font-mono font-bold text-foreground">{shipments.length}</span> of{" "}
              <span className="font-mono font-bold text-foreground">{total}</span> shipments
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-2.5 py-1 rounded-lg border border-border bg-card text-foreground disabled:opacity-40"
              >
                Prev
              </button>
              <span className="font-mono px-2 font-bold text-foreground">
                {page} / {pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page >= pages}
                className="px-2.5 py-1 rounded-lg border border-border bg-card text-foreground disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
