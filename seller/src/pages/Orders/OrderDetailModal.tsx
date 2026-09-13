import React, { useState } from "react";
import {
  Close,
  LocalShippingOutlined,
  PersonOutline,
  HomeOutlined,
} from "@mui/icons-material";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Divider,
} from "@mui/material";
import { orderApi } from "../../services/api";

const VALID_ORDER_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "PACKED", "CANCELLED"],
  PROCESSING: ["PACKED", "CANCELLED"],
  PACKED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["OUT_FOR_DELIVERY", "DELIVERED"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  DELIVERED: ["RETURN_REQUESTED"],
  RETURN_REQUESTED: ["RETURNED"],
  RETURNED: [],
  CANCELLED: [],
  FAILED: [],
};

export const OrderDetailModal: React.FC<{
  order: any | null;
  onClose: () => void;
  onOrderUpdated: () => void;
}> = ({ order, onClose, onOrderUpdated }) => {
  const [updating, setUpdating] = useState(false);
  const [note, setNote] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  if (!order) return null;

  const currentStatus = order.orderStatus || "PENDING";
  const allowedTransitions = VALID_ORDER_TRANSITIONS[currentStatus] || [];

  const handleStatusChange = async (nextStatus: string) => {
    try {
      setUpdating(true);
      setErrorMsg("");
      await orderApi.updateOrderStatus(order._id, nextStatus, note);
      onOrderUpdated();
      onClose();
    } catch (err: any) {
      console.error("Status update error:", err);
      setErrorMsg(err.response?.data?.message || err.message || "Failed to update status.");
    } finally {
      setUpdating(false);
    }
  };

  const statusColor: Record<string, string> = {
    PENDING: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    CONFIRMED: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    PROCESSING: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    PACKED: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
    SHIPPED: "bg-teal-500/10 text-teal-600 border-teal-500/20",
    OUT_FOR_DELIVERY: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
    DELIVERED: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    CANCELLED: "bg-rose-500/10 text-rose-600 border-rose-500/20",
    RETURN_REQUESTED: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    RETURNED: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  };

  return (
    <Dialog
      open={Boolean(order)}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: "20px", p: 1, maxHeight: "90vh" },
      }}
    >
      <DialogTitle className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-base font-black text-foreground">
            Order #{order._id.slice(-8).toUpperCase()}
          </span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
              statusColor[currentStatus] || "bg-surface text-muted-foreground border-border"
            }`}
          >
            {currentStatus}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface"
        >
          <Close fontSize="small" />
        </button>
      </DialogTitle>

      <DialogContent className="space-y-6 pt-2">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {/* Customer & Shipping Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-surface border border-border text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground font-semibold">
              <PersonOutline fontSize="inherit" />
              <span>Customer Details</span>
            </div>
            <p className="font-bold text-foreground text-sm">
              {order.user?.fullName || "Customer"}
            </p>
            <p className="text-muted-foreground">{order.user?.email || "No email available"}</p>
            <p className="text-muted-foreground">Ph: {order.user?.mobile || "Not specified"}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground font-semibold">
              <HomeOutlined fontSize="inherit" />
              <span>Shipping Address</span>
            </div>
            <p className="font-bold text-foreground">
              {order.shippingAddress?.name || order.user?.fullName || "Recipient"}
            </p>
            <p className="text-muted-foreground">
              {order.shippingAddress?.address}, {order.shippingAddress?.locality}
            </p>
            <p className="text-muted-foreground">
              {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pinCode}
            </p>
          </div>
        </div>

        {/* Ordered Items Table */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
            Order Items ({order.orderItems?.length || 0})
          </h3>
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-surface border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3 font-semibold">Item & SKU</th>
                  <th className="py-2.5 px-3 font-semibold">Variant Attributes</th>
                  <th className="py-2.5 px-3 font-semibold">Price</th>
                  <th className="py-2.5 px-3 font-semibold">Qty</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {order.orderItems?.map((item: any, idx: number) => {
                  const prod = item.product || {};
                  const thumb = prod.images?.[0] || "https://placehold.co/80x80/png?text=No+Img";
                  return (
                    <tr key={idx} className="hover:bg-surface/30">
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={thumb}
                            alt={prod.title || "Item"}
                            className="w-10 h-10 rounded-lg object-cover border border-border bg-surface shrink-0"
                          />
                          <div className="truncate max-w-[200px]">
                            <span className="font-bold text-foreground block truncate">
                              {prod.title || "Product"}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono block">
                              SKU: {item.sku || prod._id?.slice(-6)}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-muted-foreground">
                        {item.variantAttributes && item.variantAttributes.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {item.variantAttributes.map((va: any, i: number) => (
                              <span key={i} className="px-1.5 py-0.5 rounded-md bg-surface text-[10px] font-semibold text-foreground">
                                {va.name}: {va.value}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">Standard</span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 font-medium text-foreground">
                        ₹{item.sellingPrice?.toLocaleString("en-IN") || 0}
                      </td>

                      <td className="py-2.5 px-3 font-bold text-foreground">
                        × {item.quantity || 1}
                      </td>

                      <td className="py-2.5 px-3 font-bold text-foreground text-right">
                        ₹{((item.sellingPrice || 0) * (item.quantity || 1)).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Breakdown */}
        <div className="flex justify-end pt-2">
          <div className="w-64 space-y-1.5 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Order Subtotal:</span>
              <span>₹{order.totalSellingPrice?.toLocaleString("en-IN") || 0}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Shipping Fee:</span>
              <span className="text-emerald-500 font-semibold">FREE</span>
            </div>
            <Divider />
            <div className="flex justify-between font-bold text-foreground text-sm pt-1">
              <span>Total Settlement:</span>
              <span className="text-primary font-black">
                ₹{order.totalSellingPrice?.toLocaleString("en-IN") || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Status Transition Actions */}
        <div className="p-4 rounded-xl bg-surface border border-border space-y-3">
          <div className="flex items-center gap-1.5">
            <LocalShippingOutlined fontSize="small" className="text-primary" />
            <h3 className="text-xs font-bold text-foreground">
              Fulfillment Workflow Lifecycle
            </h3>
          </div>

          <p className="text-[11px] text-muted-foreground">
            Advance the order status through the merchant fulfillment pipeline. Transitions are verified server-side.
          </p>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add optional dispatch/tracking note..."
              className="w-full px-3 py-1.5 rounded-lg bg-card border border-border text-xs focus:outline-hidden"
            />
          </div>

          {allowedTransitions.length === 0 ? (
            <div className="text-[11px] text-muted-foreground font-semibold">
              No further state transitions available for this order ({currentStatus}).
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {allowedTransitions.map((next) => {
                const isCancel = next === "CANCELLED";
                return (
                  <Button
                    key={next}
                    size="small"
                    variant={isCancel ? "outlined" : "contained"}
                    color={isCancel ? "error" : "primary"}
                    disabled={updating}
                    onClick={() => handleStatusChange(next)}
                    sx={{
                      textTransform: "none",
                      fontWeight: 700,
                      fontSize: "11px",
                      borderRadius: "8px",
                      backgroundColor: !isCancel ? "var(--color-primary)" : undefined,
                    }}
                  >
                    {updating ? "Updating..." : `Mark as ${next}`}
                  </Button>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
