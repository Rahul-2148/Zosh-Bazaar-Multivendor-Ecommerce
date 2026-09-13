import React, { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import {
  fetchAccountOverview,
  fetchAvailableCoupons,
} from "../../../Redux Toolkit/features/customer/UserSlice";
import {
  ShoppingBagOutlined,
  FavoriteBorder,
  LocationOnOutlined,
  CreditCardOutlined,
  LocalShippingOutlined,
  CheckCircle,
  ArrowForward,
  TrendingDown,
  VerifiedUserOutlined,
  LocalOfferOutlined,
  ShieldOutlined,
  HelpOutline,
  ChevronRight,
  RefreshOutlined,
} from "@mui/icons-material";
import { Button, CircularProgress } from "@mui/material";

export const AccountOverview: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { overview, user, loading, availableCoupons } = useAppSelector(
    (store) => store.user
  );
  const jwt = localStorage.getItem("jwt") || "";

  useEffect(() => {
    if (jwt) {
      dispatch(fetchAccountOverview());
      dispatch(fetchAvailableCoupons());
    }
  }, [dispatch, jwt]);

  // Determine time-aware greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const stats = overview?.stats || {
    activeOrders: 0,
    totalOrders: 0,
    activeReturns: 0,
    savedItemsCount: 0,
    priceDropCount: 0,
    availableCoupons: availableCoupons?.length || 0,
    savedAddresses: user?.addresses?.length || 0,
    paymentMethodsCount: user?.savedPaymentMethods?.length || 0,
    unreadNotifications: 0,
  };

  const latestOrder = overview?.latestOrder;

  // Active status check
  const hasActiveOrder = useMemo(() => {
    if (!latestOrder) return false;
    const activeStatuses = [
      "CONFIRMED",
      "PROCESSING",
      "PACKED",
      "SHIPPED",
      "OUT_FOR_DELIVERY",
    ];
    return activeStatuses.includes(latestOrder.orderStatus);
  }, [latestOrder]);

  if (loading && !overview) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <CircularProgress size={32} />
        <p className="text-xs text-muted-foreground font-medium">Loading command center...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Command Center Greeting Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 p-5 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/15 px-2.5 py-0.5 rounded-full">
                Personal Shopping Command Center
              </span>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <CheckCircle sx={{ fontSize: 12 }} /> Verified Customer
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              {greeting}, {user?.fullName?.split(" ")[0] || "Shopper"}!
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Track active deliveries, manage saved collections, check rewards, and review your account security.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outlined"
              size="small"
              onClick={() => navigate("/account/profile")}
              sx={{ textTransform: "none", fontWeight: 600, fontSize: "12px", borderRadius: "0.65rem" }}
            >
              Edit Profile
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={() => navigate("/products")}
              sx={{ textTransform: "none", fontWeight: 700, fontSize: "12px", borderRadius: "0.65rem" }}
            >
              Explore Products
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Quick Stat Actions Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Orders Card */}
        <div
          onClick={() => navigate("/account/orders")}
          className="group relative bg-card border border-border/80 hover:border-primary/50 hover:shadow-md transition-all p-4 rounded-xl cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <ShoppingBagOutlined sx={{ fontSize: 20 }} />
            </div>
            <ArrowForward sx={{ fontSize: 16 }} className="text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <div>
            <div className="text-2xl font-black text-foreground">{stats.totalOrders}</div>
            <div className="text-xs font-semibold text-foreground">Orders Placed</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {stats.activeOrders > 0 ? (
                <span className="text-emerald-600 font-bold">{stats.activeOrders} active delivery</span>
              ) : (
                "View purchase history"
              )}
            </div>
          </div>
        </div>

        {/* Wishlist Card */}
        <div
          onClick={() => navigate("/wishlist")}
          className="group relative bg-card border border-border/80 hover:border-primary/50 hover:shadow-md transition-all p-4 rounded-xl cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <FavoriteBorder sx={{ fontSize: 20 }} />
            </div>
            {stats.priceDropCount > 0 ? (
              <span className="text-[10px] font-bold bg-emerald-500 text-white px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                <TrendingDown sx={{ fontSize: 11 }} /> {stats.priceDropCount} Drop{stats.priceDropCount > 1 ? "s" : ""}
              </span>
            ) : (
              <ArrowForward sx={{ fontSize: 16 }} className="text-muted-foreground group-hover:text-primary transition-colors" />
            )}
          </div>
          <div>
            <div className="text-2xl font-black text-foreground">{stats.savedItemsCount}</div>
            <div className="text-xs font-semibold text-foreground">Saved Items</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {stats.priceDropCount > 0 ? (
                <span className="text-emerald-600 font-bold">{stats.priceDropCount} price drops waiting</span>
              ) : (
                "Favorites & Collections"
              )}
            </div>
          </div>
        </div>

        {/* Saved Addresses Card */}
        <div
          onClick={() => navigate("/account/addresses")}
          className="group relative bg-card border border-border/80 hover:border-primary/50 hover:shadow-md transition-all p-4 rounded-xl cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <LocationOnOutlined sx={{ fontSize: 20 }} />
            </div>
            <ArrowForward sx={{ fontSize: 16 }} className="text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <div>
            <div className="text-2xl font-black text-foreground">{stats.savedAddresses}</div>
            <div className="text-xs font-semibold text-foreground">Saved Addresses</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Delivery locations</div>
          </div>
        </div>

        {/* Payment Methods Card */}
        <div
          onClick={() => navigate("/account/payments")}
          className="group relative bg-card border border-border/80 hover:border-primary/50 hover:shadow-md transition-all p-4 rounded-xl cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <CreditCardOutlined sx={{ fontSize: 20 }} />
            </div>
            <ArrowForward sx={{ fontSize: 16 }} className="text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <div>
            <div className="text-2xl font-black text-foreground">{stats.paymentMethodsCount}</div>
            <div className="text-xs font-semibold text-foreground">Saved Methods</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Cards & UPI Accounts</div>
          </div>
        </div>
      </div>

      {/* 3. Active Delivery Spotlight (or No Active Delivery Card) */}
      {hasActiveOrder && latestOrder ? (
        <div className="rounded-2xl border border-primary/30 bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-border/70 mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600">
                <LocalShippingOutlined sx={{ fontSize: 18 }} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Active Delivery in Progress</h3>
                <p className="text-[11px] text-muted-foreground">Order #{latestOrder._id?.slice(-8).toUpperCase()}</p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 uppercase tracking-wide">
              {latestOrder.orderStatus?.replace(/_/g, " ")}
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Items previews */}
            <div className="flex items-center gap-3">
              <div className="flex -space-x-3 overflow-hidden">
                {latestOrder.orderItems?.slice(0, 3).map((item: any, idx: number) => {
                  const img =
                    typeof item.product?.images?.[0] === "object"
                      ? item.product.images[0].url
                      : item.product?.images?.[0] || "";
                  return (
                    <img
                      key={idx}
                      src={img || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100"}
                      alt={item.product?.title || "Product"}
                      className="inline-block h-14 w-14 rounded-xl border-2 border-background object-cover bg-muted"
                    />
                  );
                })}
              </div>
              <div className="text-xs">
                <div className="font-bold text-foreground line-clamp-1 max-w-sm">
                  {latestOrder.orderItems?.[0]?.product?.title || "Ordered Item"}
                </div>
                <div className="text-muted-foreground">
                  {latestOrder.totalItems} item{latestOrder.totalItems > 1 ? "s" : ""} • ₹
                  {latestOrder.totalSellingPrice?.toLocaleString("en-IN")}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="contained"
                color="primary"
                size="small"
                onClick={() => navigate(`/order/${latestOrder._id}`)}
                sx={{ textTransform: "none", fontWeight: 700, borderRadius: "0.65rem", fontSize: "12px" }}
              >
                Track Order
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate(`/order/${latestOrder._id}`)}
                sx={{ textTransform: "none", fontWeight: 600, borderRadius: "0.65rem", fontSize: "12px" }}
              >
                Order Details
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-border/80 bg-muted/30 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-card border border-border/80 text-muted-foreground">
              <LocalShippingOutlined sx={{ fontSize: 24 }} />
            </div>
            <div>
              <div className="text-sm font-bold text-foreground">No active deliveries right now</div>
              <div className="text-xs text-muted-foreground">
                All your past orders have been completed. Need to buy something again?
              </div>
            </div>
          </div>
          <Button
            variant="outlined"
            size="small"
            onClick={() => navigate("/account/buy-again")}
            sx={{ textTransform: "none", fontWeight: 600, fontSize: "12px", borderRadius: "0.65rem" }}
          >
            Explore Buy Again
          </Button>
        </div>
      )}

      {/* 4. Two-Column Shopping & Security Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Shopping Hub Highlights */}
        <div className="bg-card border border-border/80 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/70">
            <div className="flex items-center gap-2">
              <LocalOfferOutlined sx={{ fontSize: 18, color: "var(--primary)" }} />
              <h3 className="text-sm font-bold text-foreground">Shopping & Savings</h3>
            </div>
            <button
              onClick={() => navigate("/account/coupons")}
              className="text-xs font-semibold text-primary hover:underline"
            >
              View Coupons ({stats.availableCoupons})
            </button>
          </div>

          <div className="space-y-2.5">
            <div
              onClick={() => navigate("/wishlist")}
              className="flex items-center justify-between p-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600">
                  <FavoriteBorder sx={{ fontSize: 18 }} />
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground">Wishlist & Collections</div>
                  <div className="text-[11px] text-muted-foreground">
                    {stats.savedItemsCount} item{stats.savedItemsCount !== 1 ? "s" : ""} saved across your lists
                  </div>
                </div>
              </div>
              <ChevronRight sx={{ fontSize: 18 }} className="text-muted-foreground" />
            </div>

            <div
              onClick={() => navigate("/account/buy-again")}
              className="flex items-center justify-between p-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
                  <RefreshOutlined sx={{ fontSize: 18 }} />
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground">Buy Again</div>
                  <div className="text-[11px] text-muted-foreground">
                    Quickly re-order products from your past deliveries
                  </div>
                </div>
              </div>
              <ChevronRight sx={{ fontSize: 18 }} className="text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* Account Security Checkup */}
        <div className="bg-card border border-border/80 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/70">
            <div className="flex items-center gap-2">
              <ShieldOutlined sx={{ fontSize: 18, color: "var(--primary)" }} />
              <h3 className="text-sm font-bold text-foreground">Account Security Status</h3>
            </div>
            <button
              onClick={() => navigate("/account/security")}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Manage Security
            </button>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30">
              <div className="flex items-center gap-2.5 text-xs text-foreground font-medium">
                <CheckCircle sx={{ fontSize: 16, color: "#10b981" }} />
                <span>Primary Email: {user?.email}</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                Verified
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30">
              <div className="flex items-center gap-2.5 text-xs text-foreground font-medium">
                <CheckCircle sx={{ fontSize: 16, color: "#10b981" }} />
                <span>Mobile Contact: {user?.mobile || "Not specified"}</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                Active
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30">
              <div className="flex items-center gap-2.5 text-xs text-foreground font-medium">
                <VerifiedUserOutlined sx={{ fontSize: 16, color: "var(--primary)" }} />
                <span>Password Protection</span>
              </div>
              <button
                onClick={() => navigate("/account/security")}
                className="text-[11px] font-bold text-primary hover:underline"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Help & Support Banner */}
      <div className="rounded-2xl border border-border/80 bg-card p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-primary/10 text-primary">
            <HelpOutline sx={{ fontSize: 24 }} />
          </div>
          <div>
            <div className="text-sm font-bold text-foreground">Need help with an order or payment?</div>
            <div className="text-xs text-muted-foreground">
              Our 24/7 customer support team and AI Shopping Assistant are ready to assist you.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outlined"
            size="small"
            onClick={() => navigate("/account/help")}
            sx={{ textTransform: "none", fontWeight: 600, fontSize: "12px", borderRadius: "0.65rem" }}
          >
            Open Help Center
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AccountOverview;
