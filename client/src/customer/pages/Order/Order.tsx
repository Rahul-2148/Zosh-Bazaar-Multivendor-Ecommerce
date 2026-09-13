import { useEffect, useState, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import { fetchUserOrderHistory } from "../../../Redux Toolkit/features/customer/OrderSlice";
import OrderItemCard from "./OrderItemCard";
import {
  Button,
  CircularProgress,
  Typography,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
} from "@mui/material";
import {
  Search,
  LocalShippingOutlined,
  StorefrontOutlined,
  ArrowForward,
  ShoppingBagOutlined,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { getCustomerSocket } from "../../../utils/socket";

const Order = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { order } = useAppSelector((store) => store);
  const { user } = useAppSelector((store) => store.user);
  const jwt = localStorage.getItem("jwt");

  const [activeTab, setActiveTab] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (jwt) {
      dispatch(fetchUserOrderHistory(jwt));
    }
  }, [dispatch, jwt]);

  // Real-time updates via Socket.IO
  useEffect(() => {
    if (user?._id) {
      const socket = getCustomerSocket(user._id);
      const handleStatusUpdate = () => {
        if (jwt) dispatch(fetchUserOrderHistory(jwt));
      };
      socket.on("order:status_updated", handleStatusUpdate);
      return () => {
        socket.off("order:status_updated", handleStatusUpdate);
      };
    }
  }, [user?._id, dispatch, jwt]);

  const ordersList = order.orders || [];

  const filteredOrders = useMemo(() => {
    const list = order.orders || [];
    return list.filter((item: any) => {
      // Tab filter
      if (activeTab === "ACTIVE") {
        const activeStates = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY"];
        if (!activeStates.includes(item.orderStatus)) return false;
      } else if (activeTab === "DELIVERED") {
        if (item.orderStatus !== "DELIVERED") return false;
      } else if (activeTab === "CANCELLED") {
        if (item.orderStatus !== "CANCELLED" && item.orderStatus !== "RETURNED") return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesId = item._id?.toLowerCase().includes(q);
        const matchesSeller = item.seller?.sellerName?.toLowerCase().includes(q);
        const matchesItems = item.orderItems?.some((oi: any) =>
          (oi.productTitle || oi.product?.title || "").toLowerCase().includes(q)
        );
        return matchesId || matchesSeller || matchesItems;
      }

      return true;
    });
  }, [order.orders, activeTab, searchQuery]);

  if (order.loading && ordersList.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] space-y-3">
        <CircularProgress size={36} color="primary" />
        <p className="text-xs text-muted-foreground font-medium">Fetching your order history...</p>
      </div>
    );
  }

  if (!ordersList || ordersList.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 sm:py-24 flex flex-col items-center justify-center text-center gap-4">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
          <ShoppingBagOutlined sx={{ fontSize: 56 }} />
        </div>
        <Typography variant="h5" fontWeight="800" className="text-foreground tracking-tight text-xl sm:text-2xl">
          No Orders Placed Yet
        </Typography>
        <Typography variant="body2" color="text.secondary" className="max-w-md leading-relaxed text-sm">
          You have not placed any orders yet. Discover our latest collections and certified sellers.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate("/")}
          sx={{ mt: 2, px: 4, py: 1.3, borderRadius: "0.85rem", textTransform: "none", fontWeight: 700, fontSize: "14px", boxShadow: "0 4px 14px rgba(13, 148, 136, 0.35)" }}
        >
          Start Shopping
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-28 sm:py-10 min-h-[calc(100vh-140px)] w-full flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/80">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
            My Orders ({ordersList.length})
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time fulfillment tracking, package details & invoices
          </p>
        </div>

        {/* Search Input */}
        <TextField
          size="small"
          placeholder="Search by order ID or item..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ minWidth: { xs: "100%", sm: "280px" } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ fontSize: 18 }} className="text-muted-foreground" />
              </InputAdornment>
            ),
          }}
        />
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, val) => setActiveTab(val)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          borderBottom: "1px solid var(--border)",
          minHeight: "42px",
          "& .MuiTab-root": {
            minHeight: "42px",
            textTransform: "none",
            fontWeight: 700,
            fontSize: "13px",
          },
        }}
      >
        <Tab label={`All (${ordersList.length})`} value="ALL" />
        <Tab
          label="Active & In Transit"
          value="ACTIVE"
        />
        <Tab label="Delivered" value="DELIVERED" />
        <Tab label="Cancelled / Returned" value="CANCELLED" />
      </Tabs>

      {/* Orders List */}
      <div className="space-y-5">
        {filteredOrders.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-border bg-card/40 space-y-2">
            <p className="text-sm font-semibold text-foreground">No orders matching your criteria</p>
            <p className="text-xs text-muted-foreground">Try clearing filters or search keywords.</p>
          </div>
        ) : (
          filteredOrders.map((orderItem: any) => {
            const status = orderItem.orderStatus || "PENDING";
            const seller = orderItem.seller;

            return (
              <div
                key={orderItem._id}
                className="border border-border/80 bg-card text-card-foreground rounded-2xl p-5 sm:p-6 shadow-xs hover:border-primary/50 transition-all space-y-4"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-sm text-foreground">
                        Order #{orderItem._id?.slice(-8).toUpperCase()}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold tracking-tight ${
                          status === "DELIVERED"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            : status === "CANCELLED" || status === "RETURNED"
                            ? "bg-destructive/10 text-destructive border border-destructive/20"
                            : status === "SHIPPED" || status === "OUT_FOR_DELIVERY"
                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                        }`}
                      >
                        {status.replace(/_/g, " ")}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground mt-1">
                      Placed on{" "}
                      {new Date(orderItem.orderDate || orderItem.createdAt).toLocaleDateString(
                        "en-IN",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </p>
                  </div>

                  {/* Seller & Total */}
                  <div className="text-left sm:text-right">
                    <div className="flex items-center sm:justify-end gap-1 text-xs text-muted-foreground">
                      <StorefrontOutlined sx={{ fontSize: 14 }} />
                      <span>
                        Sold by:{" "}
                        <strong className="text-foreground">
                          {seller?.businessDetails?.businessName ||
                            seller?.sellerName ||
                            "Zosh Certified Vendor"}
                        </strong>
                      </span>
                    </div>
                    <div className="text-base font-black text-foreground mt-0.5">
                      ₹{orderItem.totalSellingPrice?.toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-2">
                  {orderItem.orderItems?.map((item: any) => (
                    <OrderItemCard key={item._id} item={item} />
                  ))}
                </div>

                {/* Action Bar */}
                <div className="flex items-center justify-between pt-3 border-t border-border/50">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <LocalShippingOutlined sx={{ fontSize: 15 }} className="text-primary" />
                    <span>
                      {status === "DELIVERED"
                        ? "Delivered successfully"
                        : "Express courier tracking active"}
                    </span>
                  </div>

                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    endIcon={<ArrowForward sx={{ fontSize: 15 }} />}
                    onClick={() => navigate(`/order/${orderItem._id}`)}
                    sx={{
                      textTransform: "none",
                      fontWeight: 700,
                      borderRadius: "0.65rem",
                      fontSize: "12px",
                      px: 2,
                    }}
                  >
                    Track Order & Timeline
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Order;
