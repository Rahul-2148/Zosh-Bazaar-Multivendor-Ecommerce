import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AttachMoney,
  TrendingUp,
  ShoppingBagOutlined,
  Inventory2Outlined,
  WarningAmberOutlined,
  AddCircleOutline,
  TuneOutlined,
  ArrowForward,
  CheckCircleOutline,
  HourglassEmptyOutlined,
  LocalShippingOutlined,
  CancelOutlined,
  Refresh,
} from "@mui/icons-material";
import { CircularProgress, Button, Chip } from "@mui/material";
import { reportApi, orderApi, productApi } from "../services/api";
import { useSellerAuth } from "../context/SellerAuthContext";

export const Dashboard: React.FC = () => {
  const { seller } = useSellerAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [totalProductsCount, setTotalProductsCount] = useState(0);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [reportRes, ordersRes, productsRes] = await Promise.allSettled([
        reportApi.getReport(),
        orderApi.getOrders(),
        productApi.getProducts(),
      ]);

      if (reportRes.status === "fulfilled" && reportRes.value.data?.report) {
        setReport(reportRes.value.data.report);
      }

      if (ordersRes.status === "fulfilled") {
        const orders = Array.isArray(ordersRes.value.data?.orders)
          ? ordersRes.value.data.orders
          : [];
        setRecentOrders(orders.slice(0, 6));
      }

      if (productsRes.status === "fulfilled") {
        const prods = Array.isArray(productsRes.value.data?.products)
          ? productsRes.value.data.products
          : [];
        setTotalProductsCount(prods.length);

        // Find products or variants with low stock (< 5 units)
        const lowStock = prods.filter((p: any) => {
          if (p.hasVariants && p.variants?.length > 0) {
            return p.variants.some((v: any) => (v.countInStock || 0) < 5);
          }
          return (p.countInStock || 0) < 5;
        });
        setLowStockProducts(lowStock.slice(0, 5));
      }
    } catch (err) {
      console.error("Failed to load seller dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <CircularProgress size={36} />
        <span className="text-xs text-muted-foreground font-medium">
          Loading merchant analytics...
        </span>
      </div>
    );
  }

  // Calculated metrics
  const totalEarnings = report?.totalEarnings || 0;
  const netEarnings = report?.netEarnings || 0;
  const totalOrders = report?.totalOrders || 0;
  const cancelledOrders = report?.cancelledOrders || 0;
  const totalSales = report?.totalSales || 0;

  // Pending orders awaiting fulfillment
  const pendingOrders = recentOrders.filter(
    (o) => o.orderStatus === "CONFIRMED" || o.orderStatus === "PROCESSING" || o.orderStatus === "PENDING"
  );

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              Welcome back, {seller?.sellerName || "Merchant"}!
            </h1>
            <Chip
              label={seller?.accountStatus || "ACTIVE"}
              color={seller?.accountStatus === "ACTIVE" ? "success" : "warning"}
              size="small"
              sx={{ fontWeight: 700, fontSize: "10px", height: "20px" }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {seller?.businessDetails?.businessName || "Zosh Bazaar Merchant Console"} • Storefront Operations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outlined"
            size="small"
            onClick={loadDashboardData}
            startIcon={<Refresh fontSize="small" />}
            sx={{ borderColor: "var(--color-border)", color: "var(--color-foreground)", textTransform: "none", fontSize: "12px", borderRadius: "10px" }}
          >
            Sync
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={() => navigate("/products/new")}
            startIcon={<AddCircleOutline fontSize="small" />}
            sx={{ backgroundColor: "var(--color-primary)", color: "var(--color-primary-foreground)", textTransform: "none", fontSize: "12px", borderRadius: "10px", fontWeight: 700 }}
          >
            Add Product
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Sales */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-xs hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Gross Sales
            </span>
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <AttachMoney fontSize="small" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black tracking-tight text-foreground">
              ₹{totalEarnings.toLocaleString("en-IN")}
            </span>
            <span className="text-[11px] text-muted-foreground block mt-0.5">
              Across all placed customer orders
            </span>
          </div>
        </div>

        {/* Net Settlement */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-xs hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Net Earnings
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <TrendingUp fontSize="small" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black tracking-tight text-foreground">
              ₹{netEarnings.toLocaleString("en-IN")}
            </span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium block mt-0.5">
              Available for settlement
            </span>
          </div>
        </div>

        {/* Orders Placed */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-xs hover:border-blue-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Orders
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <ShoppingBagOutlined fontSize="small" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black tracking-tight text-foreground">
              {totalOrders}
            </span>
            {cancelledOrders > 0 && (
              <span className="text-[11px] text-rose-500 font-medium">
                {cancelledOrders} cancelled
              </span>
            )}
          </div>
          <span className="text-[11px] text-muted-foreground block mt-0.5">
            {pendingOrders.length} awaiting fulfillment
          </span>
        </div>

        {/* Active Catalog & Low Stock */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-xs hover:border-amber-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Catalog Items
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Inventory2Outlined fontSize="small" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black tracking-tight text-foreground">
              {totalProductsCount}
            </span>
            {lowStockProducts.length > 0 ? (
              <span className="text-[11px] text-amber-500 font-bold flex items-center gap-0.5">
                <WarningAmberOutlined fontSize="inherit" />
                {lowStockProducts.length} low stock
              </span>
            ) : (
              <span className="text-[11px] text-emerald-500 font-medium">Stock Healthy</span>
            )}
          </div>
          <span className="text-[11px] text-muted-foreground block mt-0.5">
            {totalSales} units fulfilled
          </span>
        </div>
      </div>

      {/* Operational Highlights Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders & Fulfillment Status (2 Cols) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-card border border-border flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-foreground">Recent Orders</h2>
                <p className="text-[11px] text-muted-foreground">Orders placed for your store items</p>
              </div>
              <Link
                to="/orders"
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                View all <ArrowForward fontSize="inherit" />
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <div className="py-12 text-center">
                <ShoppingBagOutlined className="text-muted-foreground/40 mb-2" sx={{ fontSize: 44 }} />
                <p className="text-xs font-semibold text-foreground">No orders received yet</p>
                <p className="text-[11px] text-muted-foreground max-w-xs mx-auto mt-1">
                  Once customers purchase your listed items, orders will appear here for processing and fulfillment.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider">
                      <th className="pb-2.5 font-semibold">Order ID</th>
                      <th className="pb-2.5 font-semibold">Customer</th>
                      <th className="pb-2.5 font-semibold">Items</th>
                      <th className="pb-2.5 font-semibold">Total</th>
                      <th className="pb-2.5 font-semibold">Status</th>
                      <th className="pb-2.5 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {recentOrders.map((ord) => {
                      const statusColor: { [k: string]: string } = {
                        PENDING: "bg-amber-500/10 text-amber-600 border-amber-500/20",
                        CONFIRMED: "bg-blue-500/10 text-blue-600 border-blue-500/20",
                        PROCESSING: "bg-purple-500/10 text-purple-600 border-purple-500/20",
                        PACKED: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
                        SHIPPED: "bg-teal-500/10 text-teal-600 border-teal-500/20",
                        DELIVERED: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                        CANCELLED: "bg-rose-500/10 text-rose-600 border-rose-500/20",
                      };

                      return (
                        <tr key={ord._id} className="hover:bg-surface/50 transition-colors">
                          <td className="py-3 font-mono font-bold text-foreground">
                            #{ord._id.slice(-6).toUpperCase()}
                          </td>
                          <td className="py-3">
                            <span className="font-semibold text-foreground block">
                              {ord.user?.fullName || "Guest Customer"}
                            </span>
                            <span className="text-[10px] text-muted-foreground block">
                              {ord.shippingAddress?.city || "Direct Shipping"}
                            </span>
                          </td>
                          <td className="py-3 text-muted-foreground">
                            {ord.orderItems?.length || 1} item(s)
                          </td>
                          <td className="py-3 font-bold text-foreground">
                            ₹{ord.totalSellingPrice?.toLocaleString("en-IN") || 0}
                          </td>
                          <td className="py-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                statusColor[ord.orderStatus] || "bg-surface text-muted-foreground border-border"
                              }`}
                            >
                              {ord.orderStatus}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => navigate(`/orders?id=${ord._id}`)}
                              className="px-2.5 py-1 rounded-lg bg-surface border border-border text-foreground hover:bg-card text-[11px] font-semibold transition-colors"
                            >
                              Manage
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

          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Real-time database sync</span>
            <span className="font-mono">{recentOrders.length} displayed</span>
          </div>
        </div>

        {/* Quick Operations & Inventory Alerts (1 Col) */}
        <div className="space-y-6">
          {/* Quick Actions Card */}
          <div className="p-5 rounded-2xl bg-card border border-border">
            <h2 className="text-sm font-bold text-foreground mb-3">Merchant Quick Actions</h2>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => navigate("/products/new")}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-surface border border-border hover:border-primary/40 hover:bg-primary/5 transition-colors text-center group"
              >
                <AddCircleOutline className="text-primary mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-foreground">Add Product</span>
                <span className="text-[10px] text-muted-foreground">With variants</span>
              </button>

              <button
                onClick={() => navigate("/inventory")}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-surface border border-border hover:border-amber-500/40 hover:bg-amber-500/5 transition-colors text-center group"
              >
                <TuneOutlined className="text-amber-500 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-foreground">Stock Audit</span>
                <span className="text-[10px] text-muted-foreground">Adjust counts</span>
              </button>

              <button
                onClick={() => navigate("/orders")}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-surface border border-border hover:border-blue-500/40 hover:bg-blue-500/5 transition-colors text-center group"
              >
                <LocalShippingOutlined className="text-blue-500 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-foreground">Fulfill Orders</span>
                <span className="text-[10px] text-muted-foreground">Pack & ship</span>
              </button>

              <button
                onClick={() => navigate("/finances")}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-surface border border-border hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-colors text-center group"
              >
                <AttachMoney className="text-emerald-500 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-foreground">Settlements</span>
                <span className="text-[10px] text-muted-foreground">View payouts</span>
              </button>
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="p-5 rounded-2xl bg-card border border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <WarningAmberOutlined fontSize="small" className="text-amber-500" />
                <h2 className="text-sm font-bold text-foreground">Low Stock Alert</h2>
              </div>
              <Link to="/inventory" className="text-[11px] font-semibold text-primary hover:underline">
                Replenish
              </Link>
            </div>

            {lowStockProducts.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                <CheckCircleOutline className="text-emerald-500 mb-1" fontSize="medium" />
                <p className="font-semibold text-foreground">All items well stocked</p>
                <p className="text-[11px]">No products currently below 5 units</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {lowStockProducts.map((p) => (
                  <div
                    key={p._id}
                    onClick={() => navigate(`/products/${p._id}/edit`)}
                    className="flex items-center justify-between p-2 rounded-xl bg-surface hover:bg-card border border-border cursor-pointer transition-colors"
                  >
                    <div className="truncate mr-2">
                      <span className="text-xs font-semibold text-foreground block truncate">
                        {p.title}
                      </span>
                      <span className="text-[10px] text-muted-foreground block truncate">
                        {p.brand} • {p.hasVariants ? `${p.variants?.length || 0} variants` : "Standalone"}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[10px] font-bold shrink-0">
                      {p.countInStock} left
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
