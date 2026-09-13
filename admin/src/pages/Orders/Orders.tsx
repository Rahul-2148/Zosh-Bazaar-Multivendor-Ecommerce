import React, { useCallback, useEffect, useState } from "react";
import { adminApi } from "../../api/adminApi";
import type { OrderItem } from "../../types/adminTypes";
import { PageHeader } from "../../components/common/PageHeader";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { EmptyState } from "../../components/common/EmptyState";
import { StatusBadge } from "../../components/common/StatusBadge";
import {
  FormControl,
  Select,
  MenuItem,
  Pagination,
  Drawer,
  IconButton,
} from "@mui/material";
import { Close, VisibilityOutlined } from "@mui/icons-material";

export const Orders: React.FC = () => {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  // Selected Order for Drawer
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [nextStatus, setNextStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");

  const loadOrders = useCallback((st: string, pageNum: number) => {
    let ignore = false;
    adminApi
      .getAllOrders(st, pageNum)
      .then((data) => {
        if (!ignore) {
          setOrders(Array.isArray(data.orders) ? data.orders : []);
          setTotalPages(data.totalPages || 1);
          setTotalOrders(data.totalOrders || 0);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load platform orders", err);
        if (!ignore) {
          setOrders([]);
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    return loadOrders(status, page);
  }, [status, page, loadOrders]);

  const openOrderDrawer = (ord: OrderItem) => {
    setSelectedOrder(ord);
    setNextStatus(ord.orderStatus);
    setStatusNote("");
    setDrawerOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder || !nextStatus || nextStatus === selectedOrder.orderStatus) return;
    setUpdatingStatus(true);
    try {
      await adminApi.updateOrderStatus(
        selectedOrder._id,
        nextStatus,
        statusNote || undefined
      );
      setUpdatingStatus(false);
      setDrawerOpen(false);
      loadOrders(status, page);
    } catch (err: any) {
      setUpdatingStatus(false);
      alert(err.response?.data?.message || err.message || "Failed to update order status");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Orders & Fulfillment"
        subtitle={`Tracking ${totalOrders} global customer orders across marketplace vendors.`}
        action={
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase">
              Filter Status:
            </span>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <Select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                sx={{
                  bgcolor: "background.paper",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 500,
                }}
              >
                <MenuItem value="ALL">All Statuses</MenuItem>
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="CONFIRMED">Confirmed</MenuItem>
                <MenuItem value="PROCESSING">Processing</MenuItem>
                <MenuItem value="PACKED">Packed</MenuItem>
                <MenuItem value="SHIPPED">Shipped</MenuItem>
                <MenuItem value="OUT_FOR_DELIVERY">Out for Delivery</MenuItem>
                <MenuItem value="DELIVERED">Delivered</MenuItem>
                <MenuItem value="CANCELLED">Cancelled</MenuItem>
                <MenuItem value="RETURN_REQUESTED">Return Requested</MenuItem>
                <MenuItem value="RETURNED">Returned</MenuItem>
              </Select>
            </FormControl>
          </div>
        }
      />

      <div className="bg-card rounded-xl border border-border overflow-hidden" style={{ boxShadow: 'var(--shadow-sm)' }}>
        {loading ? (
          <LoadingSpinner message="Fetching order records..." />
        ) : !Array.isArray(orders) || orders.length === 0 ? (
          <EmptyState
            title="No orders found"
            description="No orders currently match the selected status filter."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-muted-foreground">
                <thead className="bg-muted/60 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                  <tr>
                    <th className="px-6 py-3.5">Order ID & Date</th>
                    <th className="px-6 py-3.5">Customer</th>
                    <th className="px-6 py-3.5">Vendor</th>
                    <th className="px-6 py-3.5">Total Amount</th>
                    <th className="px-6 py-3.5">Payment</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-medium">
                  {orders.map((ord) => (
                    <tr key={ord._id} className="hover:bg-surface-hover transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-mono font-bold text-foreground text-xs">
                          #{ord._id.slice(-8).toUpperCase()}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(ord.createdAt || ord.orderDate).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-semibold text-foreground">
                          {ord.user?.fullName || "Guest Customer"}
                        </p>
                        <p className="text-[11px] text-muted-foreground">{ord.user?.email}</p>
                      </td>
                      <td className="px-6 py-4 text-xs text-foreground">
                        {ord.seller?.sellerName || "Direct Platform"}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-foreground">
                          ₹{ord.totalSellingPrice?.toLocaleString("en-IN")}
                        </span>
                        <p className="text-[10px] text-muted-foreground">{ord.totalItems} item(s)</p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            ord.paymentStatus === "COMPLETED"
                              ? "bg-success-soft text-success border border-success/25"
                              : "bg-warning-soft text-warning border border-warning/25"
                          }`}
                        >
                          {ord.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={ord.orderStatus} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => openOrderDrawer(ord)}
                          className="px-3 py-1 bg-muted/60 hover:bg-muted border border-border text-foreground rounded-lg text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <VisibilityOutlined sx={{ fontSize: 14 }} /> Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="p-4 border-t border-border flex justify-center">
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_, value) => setPage(value)}
                  color="primary"
                  size="small"
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Detailed Order Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: "100%", sm: 520 }, p: 3, bgcolor: "background.paper", color: "text.primary" } }}
      >
        {selectedOrder && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Order #{selectedOrder._id.slice(-8).toUpperCase()}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Placed on {new Date(selectedOrder.createdAt).toLocaleString()}
                </p>
              </div>
              <IconButton size="small" onClick={() => setDrawerOpen(false)}>
                <Close fontSize="small" />
              </IconButton>
            </div>

            {/* Lifecycle Transition Manager */}
            <div className="p-4 bg-surface rounded-xl border border-border space-y-3">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                Manage Order Status
              </h4>
              <div className="flex gap-2">
                <select
                  value={nextStatus}
                  onChange={(e) => setNextStatus(e.target.value)}
                  className="flex-1 px-3 py-1.5 border border-input rounded-lg text-xs bg-card text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="PROCESSING">PROCESSING</option>
                  <option value="PACKED">PACKED</option>
                  <option value="SHIPPED">SHIPPED</option>
                  <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="CANCELLED">CANCELLED</option>
                  <option value="RETURN_REQUESTED">RETURN_REQUESTED</option>
                  <option value="RETURNED">RETURNED</option>
                  <option value="REFUNDED">REFUNDED</option>
                </select>
                <button
                  disabled={updatingStatus || nextStatus === selectedOrder.orderStatus}
                  onClick={handleUpdateStatus}
                  className="px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90 disabled:opacity-40 cursor-pointer"
                >
                  {updatingStatus ? "Saving..." : "Update"}
                </button>
              </div>
              <input
                type="text"
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="Optional internal note (e.g. Courier tracking #AWB123)..."
                className="w-full px-3 py-1.5 border border-input rounded-lg text-xs bg-card text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            {/* Customer & Shipping Details */}
            <div className="p-4 bg-surface rounded-xl border border-border space-y-2 text-xs">
              <p className="font-bold text-foreground uppercase tracking-wider">
                Shipping Destination
              </p>
              {selectedOrder.shippingAddress ? (
                <div>
                  <p className="font-semibold text-foreground">
                    {selectedOrder.shippingAddress.name} ({selectedOrder.shippingAddress.mobile})
                  </p>
                  <p className="text-muted-foreground">
                    {selectedOrder.shippingAddress.address}, {selectedOrder.shippingAddress.locality}
                  </p>
                  <p className="text-muted-foreground">
                    {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} -{" "}
                    <span className="font-bold text-foreground">{selectedOrder.shippingAddress.pincode}</span>
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground italic">No address provided</p>
              )}
            </div>

            {/* Purchased Items Snapshots */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                Purchased Items ({selectedOrder.orderItems?.length || 0})
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {selectedOrder.orderItems?.map((item: any, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-card border border-border rounded-xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          item.productImage ||
                          item.product?.images?.[0] ||
                          "https://via.placeholder.com/40"
                        }
                        alt="Product"
                        className="w-12 h-12 rounded-lg object-contain border border-border"
                      />
                      <div>
                        <p className="font-semibold text-foreground">
                          {item.productTitle || item.product?.title || "Purchased Product"}
                        </p>
                        {item.variantTitle && (
                          <p className="text-[11px] text-purple-400 font-medium">
                            Variant: {item.variantTitle}
                          </p>
                        )}
                        {item.sku && (
                          <p className="text-[10px] text-muted-foreground font-mono">SKU: {item.sku}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right whitespace-nowrap">
                      <p className="font-bold text-foreground">
                        ₹{item.sellingPrice?.toLocaleString("en-IN")}
                      </p>
                      <p className="text-[11px] text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="p-4 bg-surface border border-border rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Total MRP:</span>
                <span>₹{selectedOrder.totalMrpPrice?.toLocaleString("en-IN") || selectedOrder.totalSellingPrice}</span>
              </div>
              <div className="flex justify-between font-bold text-foreground text-sm border-t border-border pt-1.5">
                <span>Final Amount Paid:</span>
                <span>₹{selectedOrder.totalSellingPrice?.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
