import React, { useState, useEffect } from "react";
import {
  AssignmentReturnOutlined,
  Refresh,
} from "@mui/icons-material";
import { CircularProgress, Button, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { orderApi } from "../../services/api";

export const ReturnsCenter: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [returnOrders, setReturnOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [processing, setProcessing] = useState(false);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const res = await orderApi.getOrders();
      const allOrders = Array.isArray(res.data?.orders) ? res.data.orders : [];
      const returns = allOrders.filter(
        (o: any) =>
          o.orderStatus === "RETURN_REQUESTED" ||
          o.orderStatus === "RETURNED" ||
          o.orderStatus === "REFUNDED"
      );
      setReturnOrders(returns);
    } catch (err) {
      console.error("Failed to load return requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  const handleAcceptReturn = async () => {
    if (!selectedOrder) return;
    try {
      setProcessing(true);
      await orderApi.updateOrderStatus(selectedOrder._id, "RETURNED", "Return accepted by seller");
      await fetchReturns();
      setSelectedOrder(null);
    } catch (err) {
      console.error("Failed to accept return:", err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
            Returns & Refunds Center
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Review customer return requests, inspect return conditions, and process item receipts
          </p>
        </div>

        <button
          onClick={fetchReturns}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border text-xs font-semibold text-foreground hover:border-primary transition-colors shadow-xs w-fit"
        >
          <Refresh fontSize="small" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Returns Table */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <CircularProgress size={32} />
            <span className="text-xs text-muted-foreground">Checking return requests...</span>
          </div>
        ) : returnOrders.length === 0 ? (
          <div className="py-16 text-center">
            <AssignmentReturnOutlined className="text-muted-foreground/40 mb-2" sx={{ fontSize: 44 }} />
            <h3 className="text-xs font-bold text-foreground">No return requests</h3>
            <p className="text-[11px] text-muted-foreground mt-1 max-w-xs mx-auto">
              You currently have zero pending customer returns or refund disputes.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-surface/60 border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4 font-semibold">Order ID</th>
                  <th className="py-3 px-3 font-semibold">Customer</th>
                  <th className="py-3 px-3 font-semibold">Return Items</th>
                  <th className="py-3 px-3 font-semibold">Refund Value</th>
                  <th className="py-3 px-3 font-semibold">Return Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {returnOrders.map((ord) => (
                  <tr key={ord._id} className="hover:bg-surface/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-foreground">
                      #{ord._id.slice(-6).toUpperCase()}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-foreground block">
                        {ord.user?.fullName || "Customer"}
                      </span>
                      <span className="text-[10px] text-muted-foreground block">
                        {ord.shippingAddress?.city || "Destination"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-muted-foreground">
                      {ord.orderItems?.length || 1} item(s)
                    </td>
                    <td className="py-3 px-3 font-bold text-foreground">
                      ₹{ord.totalSellingPrice?.toLocaleString("en-IN") || 0}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          ord.orderStatus === "RETURN_REQUESTED"
                            ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                            : "bg-purple-500/10 text-purple-600 border-purple-500/20"
                        }`}
                      >
                        {ord.orderStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {ord.orderStatus === "RETURN_REQUESTED" ? (
                        <button
                          onClick={() => setSelectedOrder(ord)}
                          className="px-3 py-1 rounded-lg bg-primary text-primary-foreground font-bold text-[11px] hover:opacity-90 transition-opacity"
                        >
                          Review & Accept
                        </button>
                      ) : (
                        <span className="text-[11px] text-muted-foreground font-semibold">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Dialog */}
      <Dialog
        open={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        PaperProps={{ sx: { borderRadius: "16px", p: 1, minWidth: 340 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: "16px" }}>
          Process Return Request
        </DialogTitle>
        <DialogContent>
          <div className="space-y-3 pt-2 text-xs">
            <p className="text-muted-foreground">
              Customer <strong className="text-foreground">{selectedOrder?.user?.fullName}</strong> has requested to return Order #{selectedOrder?._id.slice(-6).toUpperCase()}.
            </p>
            <div className="p-3 rounded-xl bg-surface border border-border">
              <span className="font-semibold text-foreground block mb-1">Return Refund Amount:</span>
              <span className="text-base font-black text-primary">
                ₹{selectedOrder?.totalSellingPrice?.toLocaleString("en-IN")}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              By accepting this return, the order will be marked as <strong>RETURNED</strong>, restocking the inventory items back into your active catalog.
            </p>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedOrder(null)} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            onClick={handleAcceptReturn}
            variant="contained"
            disabled={processing}
            sx={{
              backgroundColor: "var(--color-primary)",
              textTransform: "none",
              fontWeight: 700,
              borderRadius: "8px",
            }}
          >
            {processing ? "Accepting..." : "Accept Return"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
