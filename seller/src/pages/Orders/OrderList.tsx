import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ShoppingBagOutlined,
  Search,
  Refresh,
  LocalShippingOutlined,
  FilterList,
  ArrowForward,
} from "@mui/icons-material";
import { CircularProgress } from "@mui/material";
import { orderApi } from "../../services/api";
import { OrderDetailModal } from "./OrderDetailModal";

export const OrderList: React.FC = () => {
  const [searchParams] = useSearchParams();
  const highlightedId = searchParams.get("id");

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusTab, setStatusTab] = useState<string>("ALL");

  // Selected order for modal
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await orderApi.getOrders();
      const list = Array.isArray(res.data?.orders) ? res.data.orders : [];
      setOrders(list);

      // If URL has highlighted id, open modal
      if (highlightedId) {
        const found = list.find((o: any) => o._id === highlightedId);
        if (found) setSelectedOrder(found);
      }
    } catch (err) {
      console.error("Failed to load seller orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [highlightedId]);

  // Status categories
  const statusTabs = [
    { label: "All Orders", value: "ALL" },
    { label: "Pending", value: "PENDING" },
    { label: "Confirmed", value: "CONFIRMED" },
    { label: "Processing", value: "PROCESSING" },
    { label: "Packed", value: "PACKED" },
    { label: "Shipped", value: "SHIPPED" },
    { label: "Delivered", value: "DELIVERED" },
    { label: "Cancelled", value: "CANCELLED" },
  ];

  const filteredOrders = orders.filter((o: any) => {
    const matchesQuery =
      !searchQuery ||
      o._id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.user?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.shippingAddress?.city?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusTab === "ALL" || o.orderStatus === statusTab;

    return matchesQuery && matchesStatus;
  });

  const statusColor: Record<string, string> = {
    PENDING: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    CONFIRMED: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    PROCESSING: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    PACKED: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
    SHIPPED: "bg-teal-500/10 text-teal-600 border-teal-500/20",
    OUT_FOR_DELIVERY: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
    DELIVERED: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    CANCELLED: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
            Orders & Fulfillment
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage incoming customer orders, package items, advance lifecycle milestones, and handle dispatch
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border text-xs font-semibold text-foreground hover:border-primary transition-colors shadow-xs w-fit"
        >
          <Refresh fontSize="small" />
          <span>Refresh Orders</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border">
        {statusTabs.map((t) => {
          const count =
            t.value === "ALL"
              ? orders.length
              : orders.filter((o: any) => o.orderStatus === t.value).length;
          const isActive = statusTab === t.value;

          return (
            <button
              key={t.value}
              onClick={() => setStatusTab(t.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface"
              }`}
            >
              <span>{t.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isActive ? "bg-white/20 text-white" : "bg-surface text-muted-foreground"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search and Table */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-xs">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface/30">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" fontSize="small" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by order ID or customer name..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-card border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-primary"
            />
          </div>

          <span className="text-xs text-muted-foreground">
            Showing {filteredOrders.length} of {orders.length} total orders
          </span>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <CircularProgress size={32} />
            <span className="text-xs text-muted-foreground">Syncing seller orders...</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 text-center">
            <ShoppingBagOutlined className="text-muted-foreground/40 mb-2" sx={{ fontSize: 44 }} />
            <h3 className="text-xs font-bold text-foreground">No orders in this state</h3>
            <p className="text-[11px] text-muted-foreground mt-1 max-w-xs mx-auto">
              {orders.length === 0
                ? "You haven't received any customer orders yet. They will automatically arrive here as customers purchase your items."
                : "No orders match the selected filter status."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-surface/60 border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4 font-semibold">Order ID & Date</th>
                  <th className="py-3 px-3 font-semibold">Customer & Destination</th>
                  <th className="py-3 px-3 font-semibold">Purchased Items</th>
                  <th className="py-3 px-3 font-semibold">Settlement Amount</th>
                  <th className="py-3 px-3 font-semibold">Fulfillment Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredOrders.map((ord) => {
                  const dateStr = ord.orderDate
                    ? new Date(ord.orderDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "Recent";

                  return (
                    <tr key={ord._id} className="hover:bg-surface/50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono font-black text-foreground block">
                          #{ord._id.slice(-6).toUpperCase()}
                        </span>
                        <span className="text-[10px] text-muted-foreground block">
                          {dateStr}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-bold text-foreground block">
                          {ord.user?.fullName || "Direct Buyer"}
                        </span>
                        <span className="text-[10px] text-muted-foreground block truncate max-w-[150px]">
                          {ord.shippingAddress?.city || "Direct Shipping"}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-muted-foreground">
                        <span className="font-semibold text-foreground block">
                          {ord.orderItems?.length || 1} Item(s)
                        </span>
                        <span className="text-[10px] text-muted-foreground block truncate max-w-[180px]">
                          {ord.orderItems?.[0]?.product?.title || "Item"}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-black text-foreground text-xs block">
                          ₹{ord.totalSellingPrice?.toLocaleString("en-IN") || 0}
                        </span>
                        <span className="text-[10px] text-emerald-500 font-semibold block">
                          {ord.paymentStatus || "PAID"}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            statusColor[ord.orderStatus] || "bg-surface text-muted-foreground border-border"
                          }`}
                        >
                          {ord.orderStatus}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedOrder(ord)}
                          className="px-3 py-1 rounded-lg bg-surface border border-border hover:border-primary text-foreground text-[11px] font-bold transition-colors"
                        >
                          Process & Fulfill
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail & Fulfillment Drawer/Modal */}
      <OrderDetailModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onOrderUpdated={fetchOrders}
      />
    </div>
  );
};
