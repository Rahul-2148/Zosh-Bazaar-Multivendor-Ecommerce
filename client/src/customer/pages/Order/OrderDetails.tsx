import {
  Box,
  Button,
  CircularProgress,
  Divider,
  Typography,
  Modal,
  TextField,
  Alert,
  IconButton,
} from "@mui/material";
import OrderStepper from "./OrderStepper";
import {
  Cancel,
  StorefrontOutlined,
  AssignmentReturnOutlined,
  LocalShippingOutlined,
  LocationOnOutlined,
  Close,
  TimelineOutlined,
} from "@mui/icons-material";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import { useEffect, useState } from "react";
import {
  fetchOrderById,
  cancelOrder,
} from "../../../Redux Toolkit/features/customer/OrderSlice";
import { useParams, useNavigate } from "react-router-dom";
import { getCustomerSocket } from "../../../utils/socket";
import { Api } from "../../../config/Api";

const OrderDetails = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const { currentOrder, loading } = useAppSelector((store) => store.order);
  const { user } = useAppSelector((store) => store.user);
  const jwt = localStorage.getItem("jwt") || "";

  // Cancellation Modal State
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Return Modal State
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [returnSuccess, setReturnSuccess] = useState(false);

  useEffect(() => {
    if (orderId && jwt) {
      dispatch(fetchOrderById({ jwt, orderId }));
    }
  }, [dispatch, orderId, jwt]);

  // Real-time socket updates for this order
  useEffect(() => {
    if (user?._id && orderId) {
      const socket = getCustomerSocket(user._id);
      const handleStatusUpdate = (payload: any) => {
        if (payload?.orderId?.toString() === orderId) {
          if (jwt) dispatch(fetchOrderById({ jwt, orderId }));
        }
      };
      socket.on("order:status_updated", handleStatusUpdate);
      return () => {
        socket.off("order:status_updated", handleStatusUpdate);
      };
    }
  }, [user?._id, orderId, dispatch, jwt]);

  const handleConfirmCancel = async () => {
    if (!orderId) return;
    setActionLoading(true);
    await dispatch(cancelOrder(orderId));
    setActionLoading(false);
    setCancelModalOpen(false);
    if (jwt) dispatch(fetchOrderById({ jwt, orderId }));
  };

  const handleConfirmReturn = async () => {
    if (!orderId || !jwt) return;
    setActionLoading(true);
    try {
      await Api.post(
        `/order/${orderId}/return`,
        { reason: returnReason },
        { headers: { Authorization: `Bearer ${jwt}` } }
      );
      setReturnSuccess(true);
      setTimeout(() => {
        setReturnModalOpen(false);
        setReturnSuccess(false);
        dispatch(fetchOrderById({ jwt, orderId }));
      }, 1200);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to submit return request");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !currentOrder) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] space-y-3">
        <CircularProgress size={36} color="primary" />
        <p className="text-xs text-muted-foreground font-medium">Fetching order status...</p>
      </div>
    );
  }

  if (!currentOrder) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 px-5">
        <Typography variant="h6" color="text.secondary">
          Order not found
        </Typography>
        <Button variant="contained" color="primary" onClick={() => navigate("/orders")}>
          Back to My Orders
        </Button>
      </div>
    );
  }

  const isCancellable = ["PENDING", "CONFIRMED", "PROCESSING"].includes(
    currentOrder.orderStatus
  );
  const isReturnable = currentOrder.orderStatus === "DELIVERED";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-28 sm:py-10 min-h-[calc(100vh-140px)] w-full flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/80">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              Order #{currentOrder._id?.slice(-8).toUpperCase()}
            </h1>
            <span
              className={`px-3 py-0.5 rounded-full text-xs font-bold tracking-tight ${
                currentOrder.orderStatus === "DELIVERED"
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                  : currentOrder.orderStatus === "CANCELLED" ||
                    currentOrder.orderStatus === "RETURNED"
                  ? "bg-destructive/10 text-destructive border border-destructive/20"
                  : "bg-primary/10 text-primary border border-primary/20"
              }`}
            >
              {currentOrder.orderStatus?.replace(/_/g, " ")}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Placed on{" "}
            {new Date(currentOrder.orderDate || currentOrder.createdAt).toLocaleDateString(
              "en-IN",
              {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }
            )}
          </p>
        </div>

        <div className="flex gap-2">
          {isCancellable && (
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<Cancel />}
              onClick={() => setCancelModalOpen(true)}
              sx={{ textTransform: "none", fontWeight: 700, borderRadius: "0.65rem" }}
            >
              Cancel Order
            </Button>
          )}

          {isReturnable && (
            <Button
              variant="outlined"
              color="primary"
              size="small"
              startIcon={<AssignmentReturnOutlined />}
              onClick={() => setReturnModalOpen(true)}
              sx={{ textTransform: "none", fontWeight: 700, borderRadius: "0.65rem" }}
            >
              Request Return
            </Button>
          )}
        </div>
      </div>

      {/* Real-time Order Stepper */}
      {currentOrder.orderStatus !== "CANCELLED" && (
        <section className="border border-border/80 bg-card text-card-foreground rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <LocalShippingOutlined className="text-primary" />
            <Typography variant="subtitle1" fontWeight="700">
              Live Fulfillment Progress
            </Typography>
          </div>
          <OrderStepper orderStatus={currentOrder.orderStatus} />
        </section>
      )}

      {/* Status History Timeline */}
      {currentOrder.statusHistory && currentOrder.statusHistory.length > 0 && (
        <section className="border border-border/80 bg-card text-card-foreground rounded-2xl p-5 sm:p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <TimelineOutlined className="text-primary" />
            <Typography variant="subtitle1" fontWeight="700">
              Order Event Timeline
            </Typography>
          </div>
          <div className="flex flex-col gap-3 pt-2">
            {currentOrder.statusHistory.map((event: any, idx: number) => (
              <div key={idx} className="flex items-start gap-3 text-xs">
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                <div className="flex-1">
                  <div className="flex items-baseline justify-between">
                    <span className="font-bold text-foreground">
                      {event.status?.replace(/_/g, " ")}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(event.timestamp).toLocaleString("en-IN")}
                    </span>
                  </div>
                  {event.note && (
                    <p className="text-muted-foreground mt-0.5">{event.note}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Multi-Vendor Items & Seller Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Order Items */}
          <section className="border border-border/80 bg-card text-card-foreground rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <Typography variant="subtitle1" fontWeight="700">
                Purchased Items ({currentOrder.orderItems?.length || 0})
              </Typography>
              {currentOrder.seller && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <StorefrontOutlined sx={{ fontSize: 16 }} className="text-primary" />
                  <span>
                    Fulfilled by:{" "}
                    <strong className="text-foreground">
                      {currentOrder.seller?.businessDetails?.businessName ||
                        currentOrder.seller?.sellerName ||
                        "Zosh Certified Partner"}
                    </strong>
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4">
              {currentOrder.orderItems?.map((item: any) => (
                <div
                  key={item._id}
                  className="flex gap-4 p-3 rounded-xl border border-border/60 bg-muted/20 items-center"
                >
                  <img
                    className="w-16 h-18 sm:w-20 sm:h-22 object-contain rounded-xl border border-border/60 bg-card p-1"
                    src={
                      item.productImage ||
                      item.product?.images?.[0] ||
                      "https://via.placeholder.com/80"
                    }
                    alt={item.productTitle || item.product?.title || "Product"}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider block truncate">
                      {item.brand || item.product?.brand || "Authentic"}
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-foreground truncate mt-0.5">
                      {item.productTitle || item.product?.title}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      {item.size && <span>Size: {item.size}</span>}
                      {item.sku && <span>SKU: {item.sku}</span>}
                      <span>Qty: {item.quantity || 1}</span>
                    </div>
                    <p className="font-black text-sm text-foreground mt-1.5">
                      ₹{item.sellingPrice?.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Address & Commercial Invoice */}
        <div className="flex flex-col gap-6">
          {/* Delivery Address */}
          <section className="border border-border/80 bg-card text-card-foreground rounded-2xl p-5 shadow-xs flex flex-col gap-3">
            <div className="flex items-center gap-1.5">
              <LocationOnOutlined className="text-primary" sx={{ fontSize: 20 }} />
              <Typography variant="subtitle2" fontWeight="700">
                Delivery Address
              </Typography>
            </div>
            <div className="text-xs flex flex-col gap-1 text-muted-foreground leading-relaxed">
              <p className="font-bold text-foreground text-sm">
                {currentOrder.shippingAddress?.name || "Customer"}
              </p>
              <p>{currentOrder.shippingAddress?.address}</p>
              {currentOrder.shippingAddress?.locality && (
                <p>{currentOrder.shippingAddress.locality}</p>
              )}
              <p>
                {currentOrder.shippingAddress?.city}, {currentOrder.shippingAddress?.state} —{" "}
                <span className="font-bold text-foreground">
                  {currentOrder.shippingAddress?.pincode}
                </span>
              </p>
              {currentOrder.shippingAddress?.mobile && (
                <p className="font-semibold text-foreground pt-1">
                  📞 Phone: {currentOrder.shippingAddress.mobile}
                </p>
              )}
            </div>
          </section>

          {/* Payment & Price Summary */}
          <section className="border border-border/80 bg-card text-card-foreground rounded-2xl p-5 shadow-xs flex flex-col gap-3">
            <Typography variant="subtitle2" fontWeight="700">
              Commercial Invoice Summary
            </Typography>
            <Divider />

            <div className="flex flex-col gap-2 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Items Subtotal</span>
                <span className="font-semibold text-foreground">
                  ₹{currentOrder.totalMrpPrice?.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                <span>Promotional Discount</span>
                <span>
                  -₹
                  {(
                    (currentOrder.totalMrpPrice || 0) -
                    (currentOrder.totalSellingPrice || 0)
                  )?.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping & Handling</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">FREE</span>
              </div>
              <Divider />
              <div className="flex justify-between text-sm font-black pt-1">
                <span>Total Amount Paid</span>
                <span className="text-primary text-base">
                  ₹{currentOrder.totalSellingPrice?.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-muted-foreground">
              Payment Status:{" "}
              <strong className="text-foreground">
                {currentOrder.paymentStatus || "PAID"}
              </strong>
            </div>
          </section>
        </div>
      </div>

      {/* Cancel Order Modal */}
      <Modal
        open={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        slotProps={{
          backdrop: {
            sx: {
              backdropFilter: "blur(6px)",
              backgroundColor: "rgba(0, 0, 0, 0.65)",
            },
          },
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "94%", sm: 460 },
            maxHeight: { xs: "92vh", sm: "88vh" },
            bgcolor: "var(--card)",
            color: "var(--foreground)",
            borderRadius: { xs: "1rem", sm: "1.25rem" },
            border: "1px solid var(--border)",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            outline: "none",
          }}
        >
          {/* Pinned Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border shrink-0 bg-card">
            <div>
              <Typography variant="h6" fontWeight="700" className="text-base sm:text-lg text-rose-500 leading-tight">
                Cancel Order
              </Typography>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Release reserved inventory and process full refund
              </p>
            </div>
            <IconButton size="small" onClick={() => setCancelModalOpen(false)} aria-label="Close modal">
              <Close sx={{ fontSize: 18 }} />
            </IconButton>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-4.5">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to cancel this order? Any payment made will be refunded directly to your original payment source.
            </p>

            <TextField
              fullWidth
              label="Reason for cancellation (optional)"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              size="small"
              multiline
              rows={3}
              placeholder="Tell us why you are cancelling..."
            />
          </div>

          {/* Pinned Footer */}
          <div className="p-4 sm:p-5 border-t border-border bg-card flex items-center justify-end gap-3 shrink-0">
            <Button
              variant="outlined"
              onClick={() => setCancelModalOpen(false)}
              sx={{ textTransform: "none", fontWeight: 600, borderRadius: "0.75rem", px: 3 }}
            >
              Keep Order
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleConfirmCancel}
              disabled={actionLoading}
              sx={{ textTransform: "none", fontWeight: 700, borderRadius: "0.75rem", px: 3 }}
            >
              {actionLoading ? <CircularProgress size={18} color="inherit" /> : "Confirm Cancellation"}
            </Button>
          </div>
        </Box>
      </Modal>

      {/* Return Order Modal */}
      <Modal
        open={returnModalOpen}
        onClose={() => setReturnModalOpen(false)}
        slotProps={{
          backdrop: {
            sx: {
              backdropFilter: "blur(6px)",
              backgroundColor: "rgba(0, 0, 0, 0.65)",
            },
          },
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "94%", sm: 460 },
            maxHeight: { xs: "92vh", sm: "88vh" },
            bgcolor: "var(--card)",
            color: "var(--foreground)",
            borderRadius: { xs: "1rem", sm: "1.25rem" },
            border: "1px solid var(--border)",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            outline: "none",
          }}
        >
          {/* Pinned Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border shrink-0 bg-card">
            <div>
              <Typography variant="h6" fontWeight="700" className="text-base sm:text-lg text-foreground leading-tight">
                Request Return
              </Typography>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                7-day easy reverse pickup & fast refund guarantee
              </p>
            </div>
            <IconButton size="small" onClick={() => setReturnModalOpen(false)} aria-label="Close modal">
              <Close sx={{ fontSize: 18 }} />
            </IconButton>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-4.5">
            {returnSuccess && (
              <Alert severity="success" sx={{ mb: 0.5, fontSize: "12px", borderRadius: "0.5rem" }}>
                Return request submitted successfully! Logistics team will schedule reverse pickup.
              </Alert>
            )}

            <p className="text-xs text-muted-foreground leading-relaxed">
              Items eligible for return within the 7-day guarantee window. Please provide the reason.
            </p>

            <TextField
              fullWidth
              label="Reason for return"
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              size="small"
              required
              multiline
              rows={3}
              placeholder="e.g. Size didn't fit, defective item, wrong item received..."
            />
          </div>

          {/* Pinned Footer */}
          <div className="p-4 sm:p-5 border-t border-border bg-card flex items-center justify-end gap-3 shrink-0">
            <Button
              variant="outlined"
              onClick={() => setReturnModalOpen(false)}
              sx={{ textTransform: "none", fontWeight: 600, borderRadius: "0.75rem", px: 3 }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleConfirmReturn}
              disabled={actionLoading || !returnReason.trim()}
              sx={{ textTransform: "none", fontWeight: 700, borderRadius: "0.75rem", px: 3 }}
            >
              {actionLoading ? <CircularProgress size={18} color="inherit" /> : "Submit Request"}
            </Button>
          </div>
        </Box>
      </Modal>
    </div>
  );
};

export default OrderDetails;
