import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import {
  fetchUserOrderHistory,
  cancelOrder,
  requestOrderReturn,
} from "../../../Redux Toolkit/features/customer/OrderSlice";
import { addItemToCart } from "../../../Redux Toolkit/features/customer/CartSlice";
import {
  Search,
  LocalShippingOutlined,
  ShoppingBagOutlined,
  CheckCircle,
  CancelOutlined,
  AssignmentReturnOutlined,
  ArrowForward,
  Close,
  StorefrontOutlined,
  RefreshOutlined,
} from "@mui/icons-material";
import {
  Button,
  CircularProgress,
  TextField,
  InputAdornment,
  Modal,
  Box,
  Typography,
  Alert,
  IconButton,
} from "@mui/material";

export const OrdersView: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { orders, loading } = useAppSelector((store) => store.order);
  const jwt = localStorage.getItem("jwt") || "";

  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Cancel & Return Modal States
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [reasonText, setReasonText] = useState("");
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [isReturnMode, setIsReturnMode] = useState(false);

  useEffect(() => {
    if (jwt) {
      dispatch(fetchUserOrderHistory(jwt));
    }
  }, [dispatch, jwt]);

  const ordersList = useMemo(() => orders || [], [orders]);

  const filteredOrders = useMemo(() => {
    return ordersList.filter((item: any) => {
      // Tab filtering
      if (activeTab === "ACTIVE") {
        if (!["CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY"].includes(item.orderStatus)) {
          return false;
        }
      } else if (activeTab === "DELIVERED") {
        if (item.orderStatus !== "DELIVERED") return false;
      } else if (activeTab === "CANCELLED") {
        if (item.orderStatus !== "CANCELLED") return false;
      } else if (activeTab === "RETURNS") {
        if (!["RETURN_REQUESTED", "RETURNED", "REFUNDED"].includes(item.orderStatus)) {
          return false;
        }
      }

      // Search query filtering
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const idMatch = item._id?.toLowerCase().includes(query);
        const itemMatch = item.orderItems?.some((oi: any) =>
          oi.product?.title?.toLowerCase().includes(query)
        );
        return idMatch || itemMatch;
      }

      return true;
    });
  }, [orders, activeTab, searchQuery]);

  const handleOpenCancel = (orderId: string) => {
    setSelectedOrderId(orderId);
    setIsReturnMode(false);
    setReasonText("");
    setActionSuccessMsg(null);
    setCancelModalOpen(true);
  };

  const handleOpenReturn = (orderId: string) => {
    setSelectedOrderId(orderId);
    setIsReturnMode(true);
    setReasonText("");
    setActionSuccessMsg(null);
    setCancelModalOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedOrderId) return;
    if (isReturnMode) {
      await dispatch(
        requestOrderReturn({
          orderId: selectedOrderId,
          reason: reasonText || "Customer return request",
        })
      );
      setActionSuccessMsg("Return requested successfully");
    } else {
      await dispatch(cancelOrder(selectedOrderId));
      setActionSuccessMsg("Order cancelled successfully");
    }

    if (jwt) dispatch(fetchUserOrderHistory(jwt));

    setTimeout(() => {
      setCancelModalOpen(false);
      setActionSuccessMsg(null);
    }, 1200);
  };

  const handleBuyAgain = (orderItem: any) => {
    if (!orderItem?.product?._id) return;
    dispatch(
      addItemToCart({
        jwt,
        productId: orderItem.product._id,
        size: orderItem.selectedVariant?.size || orderItem.size || "",
        quantity: 1,
      })
    );
    navigate("/cart");
  };

  const tabs = [
    { key: "ALL", label: "All Orders", count: ordersList.length },
    {
      key: "ACTIVE",
      label: "In Transit",
      count: ordersList.filter((o: any) =>
        ["CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY"].includes(o.orderStatus)
      ).length,
    },
    {
      key: "DELIVERED",
      label: "Delivered",
      count: ordersList.filter((o: any) => o.orderStatus === "DELIVERED").length,
    },
    {
      key: "CANCELLED",
      label: "Cancelled",
      count: ordersList.filter((o: any) => o.orderStatus === "CANCELLED").length,
    },
    {
      key: "RETURNS",
      label: "Returns",
      count: ordersList.filter((o: any) =>
        ["RETURN_REQUESTED", "RETURNED", "REFUNDED"].includes(o.orderStatus)
      ).length,
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return (
          <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            <CheckCircle sx={{ fontSize: 13 }} /> Delivered
          </span>
        );
      case "CANCELLED":
        return (
          <span className="flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
            <CancelOutlined sx={{ fontSize: 13 }} /> Cancelled
          </span>
        );
      case "RETURN_REQUESTED":
      case "RETURNED":
      case "REFUNDED":
        return (
          <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
            <AssignmentReturnOutlined sx={{ fontSize: 13 }} /> {status.replace(/_/g, " ")}
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
            <LocalShippingOutlined sx={{ fontSize: 13 }} /> {status.replace(/_/g, " ")}
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
        <div>
          <h2 className="text-xl font-bold text-foreground">My Orders</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            View, track, cancel, return, or buy again from your purchase history
          </p>
        </div>

        {/* Search */}
        <div className="w-full sm:w-72">
          <TextField
            fullWidth
            size="small"
            placeholder="Search by order ID or product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ fontSize: 18 }} className="text-muted-foreground" />
                </InputAdornment>
              ),
              sx: { borderRadius: "0.65rem", fontSize: "12px" },
            }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === tab.key ? "bg-white/20 text-white" : "bg-border text-muted-foreground"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <CircularProgress size={30} />
          <p className="text-xs text-muted-foreground font-medium">Loading your orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 flex flex-col items-center justify-center text-center gap-3">
          <div className="p-4 rounded-full bg-muted/60 text-muted-foreground">
            <ShoppingBagOutlined sx={{ fontSize: 32 }} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">No orders found</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              {searchQuery
                ? `No orders matching "${searchQuery}". Try a different keyword.`
                : "You have no orders in this category."}
            </p>
          </div>
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={() => navigate("/products")}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: "0.65rem", fontSize: "12px", mt: 1 }}
          >
            Start Shopping
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredOrders.map((orderItem: any) => {
            const isCancellable = ["CONFIRMED", "PROCESSING", "PACKED"].includes(orderItem.orderStatus);
            const isReturnable = orderItem.orderStatus === "DELIVERED";

            return (
              <div
                key={orderItem._id}
                className="rounded-2xl border border-border/80 bg-card overflow-hidden hover:border-border transition-all shadow-xs"
              >
                {/* Order Top Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-muted/30 border-b border-border/70 text-xs">
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                        Order Placed
                      </div>
                      <div className="font-semibold text-foreground">
                        {new Date(orderItem.orderDate || orderItem.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                        Total Amount
                      </div>
                      <div className="font-bold text-foreground">
                        ₹{orderItem.totalSellingPrice?.toLocaleString("en-IN")}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                        Ship To
                      </div>
                      <div className="font-semibold text-foreground">
                        {orderItem.shippingAddress?.name || "Customer"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                        Order ID
                      </div>
                      <div className="font-mono text-xs font-bold text-foreground">
                        #{orderItem._id?.slice(-8).toUpperCase()}
                      </div>
                    </div>
                    {getStatusBadge(orderItem.orderStatus)}
                  </div>
                </div>

                {/* Items in Order */}
                <div className="p-4 space-y-3">
                  {orderItem.orderItems?.map((item: any) => {
                    const prod = item.product;
                    const img =
                      typeof prod?.images?.[0] === "object"
                        ? prod.images[0].url
                        : prod?.images?.[0] || "";

                    return (
                      <div
                        key={item._id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border/50 last:border-0 last:pb-0"
                      >
                        <div className="flex items-center gap-3.5">
                          <img
                            src={img || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100"}
                            alt={prod?.title || "Product"}
                            className="w-16 h-16 rounded-xl object-cover bg-muted border border-border/60 shrink-0"
                          />
                          <div className="flex flex-col gap-0.5">
                            <h4
                              onClick={() => prod?._id && navigate(`/product-details/${prod.category || 'item'}/${prod.title}/${prod._id}`)}
                              className="text-xs sm:text-sm font-bold text-foreground hover:text-primary transition-colors cursor-pointer line-clamp-1"
                            >
                              {prod?.title || "Product"}
                            </h4>
                            <div className="text-xs text-muted-foreground">
                              Qty: {item.quantity} • ₹{item.sellingPrice?.toLocaleString("en-IN")}
                              {item.selectedVariant?.size && ` • Size: ${item.selectedVariant.size}`}
                            </div>
                            {orderItem.seller?.sellerName && (
                              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                <StorefrontOutlined sx={{ fontSize: 12 }} />
                                <span>Sold by: {orderItem.seller.sellerName}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Item Quick Buy Again */}
                        <div className="shrink-0 flex items-center gap-2">
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleBuyAgain(item)}
                            startIcon={<RefreshOutlined sx={{ fontSize: 14 }} />}
                            sx={{ textTransform: "none", fontSize: "11px", fontWeight: 600, borderRadius: "0.5rem" }}
                          >
                            Buy Again
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Action Strip */}
                <div className="p-3 bg-muted/20 border-t border-border/70 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-[11px] text-muted-foreground">
                    Estimated Delivery:{" "}
                    <span className="font-semibold text-foreground">
                      {new Date(orderItem.deliveryDate || orderItem.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isCancellable && (
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => handleOpenCancel(orderItem._id)}
                        sx={{ textTransform: "none", fontSize: "11px", fontWeight: 600, borderRadius: "0.5rem" }}
                      >
                        Cancel Order
                      </Button>
                    )}

                    {isReturnable && (
                      <Button
                        variant="outlined"
                        color="warning"
                        size="small"
                        onClick={() => handleOpenReturn(orderItem._id)}
                        sx={{ textTransform: "none", fontSize: "11px", fontWeight: 600, borderRadius: "0.5rem" }}
                      >
                        Return / Refund
                      </Button>
                    )}

                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={() => navigate(`/order/${orderItem._id}`)}
                      sx={{ textTransform: "none", fontSize: "11px", fontWeight: 700, borderRadius: "0.5rem" }}
                    >
                      Track / Details
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel / Return Reason Modal */}
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
            width: { xs: "94%", sm: 480 },
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
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  isReturnMode ? "bg-amber-500/10 text-amber-500" : "bg-rose-500/10 text-rose-500"
                }`}
              >
                {isReturnMode ? (
                  <AssignmentReturnOutlined sx={{ fontSize: 20 }} />
                ) : (
                  <CancelOutlined sx={{ fontSize: 20 }} />
                )}
              </div>
              <div>
                <Typography variant="h6" fontWeight="700" className="text-base sm:text-lg text-foreground leading-tight">
                  {isReturnMode ? "Request Return / Refund" : "Cancel Order"}
                </Typography>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {isReturnMode ? "7-day easy reverse pickup & fast refund guarantee" : "Release reserved inventory back to marketplace"}
                </p>
              </div>
            </div>
            <IconButton size="small" onClick={() => setCancelModalOpen(false)} aria-label="Close modal">
              <Close sx={{ fontSize: 18 }} />
            </IconButton>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-4.5">
            {actionSuccessMsg && (
              <Alert severity="success" sx={{ mb: 0.5, fontSize: "12px", borderRadius: "0.5rem" }}>
                {actionSuccessMsg}
              </Alert>
            )}

            <p className="text-xs text-muted-foreground leading-relaxed">
              {isReturnMode
                ? "Please tell us why you want to return this order so our courier partner can verify the pickup."
                : "Are you sure you want to cancel this order? Any payment made will be refunded to your original method."}
            </p>

            {/* Quick Reason Chips */}
            <div>
              <span className="text-xs font-bold text-foreground block mb-2">Select a reason:</span>
              <div className="flex flex-wrap gap-2">
                {(isReturnMode
                  ? ["Size didn't fit", "Item damaged / defective", "Received wrong item", "Quality not as expected", "Changed mind"]
                  : ["Ordered by mistake", "Found cheaper price", "Delayed delivery SLA", "Incorrect address selected", "Changed my mind"]
                ).map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setReasonText(reason)}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                      reasonText === reason
                        ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs"
                        : "bg-muted text-muted-foreground border-border hover:text-foreground hover:bg-muted/80"
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>

            <TextField
              fullWidth
              multiline
              rows={3}
              label={isReturnMode ? "Detailed Return Reason" : "Cancellation Comments (Optional)"}
              placeholder="Provide any additional comments for logistics review..."
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              size="small"
              required
            />
          </div>

          {/* Pinned Footer */}
          <div className="p-4 sm:p-5 border-t border-border bg-card flex items-center justify-end gap-3 shrink-0">
            <Button
              variant="outlined"
              onClick={() => setCancelModalOpen(false)}
              sx={{ textTransform: "none", fontWeight: 600, borderRadius: "0.75rem", px: 3 }}
            >
              Go Back
            </Button>
            <Button
              variant="contained"
              color={isReturnMode ? "warning" : "error"}
              onClick={handleConfirmAction}
              disabled={!reasonText.trim()}
              sx={{ textTransform: "none", fontWeight: 700, borderRadius: "0.75rem", px: 3 }}
            >
              {isReturnMode ? "Submit Return Request" : "Confirm Cancellation"}
            </Button>
          </div>
        </Box>
      </Modal>
    </div>
  );
};

export default OrdersView;
