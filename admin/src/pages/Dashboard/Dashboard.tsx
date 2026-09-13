import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminApi } from "../../api/adminApi";
import type { DashboardSummary } from "../../types/adminTypes";
import { PageHeader } from "../../components/common/PageHeader";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { StatusBadge } from "../../components/common/StatusBadge";
import {
  CurrencyRupeeOutlined,
  ShoppingCartOutlined,
  StorefrontOutlined,
  PeopleAltOutlined,
  Inventory2Outlined,
  WarningAmberOutlined,
  ArrowForwardOutlined,
  CheckCircleOutline,
} from "@mui/icons-material";

export const Dashboard: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const data = await adminApi.getDashboardSummary();
        setSummary(data);
      } catch (err: any) {
        setError(err.message || "Failed to load dashboard summary");
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  if (loading) return <LoadingSpinner message="Aggregating platform metrics..." />;
  if (error || !summary) {
    return (
      <div className="p-4 bg-destructive-soft border border-destructive/20 rounded-xl text-destructive text-sm font-medium">
        {error || "Could not load operations dashboard."}
      </div>
    );
  }

  const kpis = [
    {
      title: "Gross Sales",
      value: `₹${(summary.totalRevenue || 0).toLocaleString("en-IN")}`,
      subtitle: "Lifetime platform GMV",
      icon: <CurrencyRupeeOutlined sx={{ fontSize: 22 }} />,
      accentColor: "text-emerald-600 dark:text-emerald-400",
      accentBorder: "border-l-emerald-500",
      accentBg: "bg-emerald-500/10",
    },
    {
      title: "Total Orders",
      value: summary.totalOrders.toLocaleString("en-IN"),
      subtitle: "Customer transactions",
      icon: <ShoppingCartOutlined sx={{ fontSize: 22 }} />,
      accentColor: "text-sky-600 dark:text-sky-400",
      accentBorder: "border-l-sky-500",
      accentBg: "bg-sky-500/10",
    },
    {
      title: "Active Sellers",
      value: summary.activeSellers.toString(),
      subtitle: summary.pendingSellers > 0 ? `${summary.pendingSellers} pending` : "All verified",
      icon: <StorefrontOutlined sx={{ fontSize: 22 }} />,
      accentColor: "text-violet-600 dark:text-violet-400",
      accentBorder: "border-l-violet-500",
      accentBg: "bg-violet-500/10",
      alert: summary.pendingSellers > 0,
    },
    {
      title: "Customers",
      value: summary.totalCustomers.toLocaleString("en-IN"),
      subtitle: "Registered buyers",
      icon: <PeopleAltOutlined sx={{ fontSize: 22 }} />,
      accentColor: "text-amber-600 dark:text-amber-400",
      accentBorder: "border-l-amber-500",
      accentBg: "bg-amber-500/10",
    },
    {
      title: "Products",
      value: summary.totalProducts.toLocaleString("en-IN"),
      subtitle: "Active catalog items",
      icon: <Inventory2Outlined sx={{ fontSize: 22 }} />,
      accentColor: "text-teal-600 dark:text-teal-400",
      accentBorder: "border-l-teal-500",
      accentBg: "bg-teal-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Operations Dashboard"
        subtitle="Live platform metrics and order pipeline."
        action={
          <Link
            to="/sellers"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-xs font-semibold transition-all"
            style={{ boxShadow: 'var(--shadow-sm)' }}
          >
            <span>Review Sellers</span>
            <ArrowForwardOutlined sx={{ fontSize: 14 }} />
          </Link>
        }
      />

      {/* Action Alert */}
      {summary.pendingSellers > 0 && (
        <div className="p-3.5 rounded-xl bg-warning-soft border-l-4 border-warning flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <WarningAmberOutlined className="text-warning" sx={{ fontSize: 20 }} />
            <div>
              <p className="text-sm font-semibold text-foreground">
                {summary.pendingSellers} Seller Application{summary.pendingSellers > 1 ? "s" : ""} Pending
              </p>
              <p className="text-xs text-muted-foreground">
                Review GSTIN and KYC details to activate accounts.
              </p>
            </div>
          </div>
          <Link
            to="/sellers?status=PENDING_VERIFICATION"
            className="px-3 py-1.5 bg-warning hover:bg-warning/90 text-warning-foreground font-semibold text-xs rounded-lg transition-all shrink-0"
          >
            Review
          </Link>
        </div>
      )}

      {/* KPI Cards Grid — Differentiated with colored left border accent */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {kpis.map((kpi, index) => (
          <div
            key={index}
            className={`p-4 rounded-xl bg-card border border-border ${kpi.accentBorder} border-l-[3px] hover:border-border-strong transition-all duration-200 group`}
            style={{ boxShadow: 'var(--shadow-sm)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                {kpi.title}
              </span>
              <div className={`p-1.5 rounded-lg ${kpi.accentBg} ${kpi.accentColor}`}>
                {kpi.icon}
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground tracking-tight tabular-nums">
                {kpi.value}
              </p>
              <p className="text-xs text-muted-foreground mt-1 font-medium">
                {kpi.alert ? (
                  <span className="text-warning font-semibold">{kpi.subtitle}</span>
                ) : (
                  kpi.subtitle
                )}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Two Column Layout: Recent Orders + Inventory Watchlist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Orders (2 cols) */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border overflow-hidden"
          style={{ boxShadow: 'var(--shadow-sm)' }}
        >
          <div className="px-4 py-3.5 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Recent Orders</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Incoming customer transactions</p>
            </div>
            <Link
              to="/orders"
              className="text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
            >
              View All <ArrowForwardOutlined sx={{ fontSize: 12 }} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/60 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                <tr>
                  <th className="px-4 py-2.5">Customer</th>
                  <th className="px-4 py-2.5">Vendor</th>
                  <th className="px-4 py-2.5">Items</th>
                  <th className="px-4 py-2.5">Amount</th>
                  <th className="px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {Array.isArray(summary.recentOrders) && summary.recentOrders.length > 0 ? (
                  summary.recentOrders.map((ord) => (
                    <tr key={ord._id} className="hover:bg-surface-hover transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground text-xs truncate max-w-[140px]">
                          {ord.user?.fullName || "Guest"}
                        </p>
                        <p className="text-[11px] text-muted-foreground font-mono">
                          {ord._id.slice(-8).toUpperCase()}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-xs text-foreground">
                        {ord.seller?.sellerName || "Direct"}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {ord.totalItems || 1} item{ord.totalItems > 1 ? "s" : ""}
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-foreground tabular-nums">
                        ₹{ord.totalSellingPrice?.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={ord.orderStatus} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-xs text-muted-foreground">
                      No orders placed yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Inventory Watchlist (1 col) */}
        <div className="bg-card rounded-xl border border-border overflow-hidden flex flex-col"
          style={{ boxShadow: 'var(--shadow-sm)' }}
        >
          <div className="px-4 py-3.5 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Inventory Watchlist</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Low stock alerts</p>
            </div>
            <Link
              to="/products"
              className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Catalog →
            </Link>
          </div>

          <div className="p-3.5 divide-y divide-border flex-1">
            {Array.isArray(summary.lowStockProducts) && summary.lowStockProducts.length > 0 ? (
              summary.lowStockProducts.map((prod) => (
                <div key={prod._id} className="py-2.5 flex items-center gap-3">
                  <img
                    src={prod.images?.[0] || "https://via.placeholder.com/40"}
                    alt={prod.title}
                    className="w-9 h-9 rounded-lg object-cover border border-border"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">
                      {prod.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {prod.seller?.sellerName || "Platform"}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                        prod.countInStock === 0
                          ? "bg-destructive-soft text-destructive"
                          : "bg-warning-soft text-warning"
                      }`}
                    >
                      {prod.countInStock === 0 ? "Out of stock" : `${prod.countInStock} left`}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-10 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                <CheckCircleOutline sx={{ fontSize: 28, color: "var(--success)" }} />
                <span>All products adequately stocked.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
