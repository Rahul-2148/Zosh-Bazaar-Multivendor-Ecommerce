import React, { useState, useEffect } from "react";
import {
  AccountBalanceWalletOutlined,
  TrendingUp,
  ReceiptLongOutlined,
  CancelOutlined,
  Refresh,
  CheckCircleOutline,
  CreditCardOutlined,
  AccountBalance,
} from "@mui/icons-material";
import { CircularProgress, Button } from "@mui/material";
import { reportApi, transactionApi } from "../../services/api";
import { useSellerAuth } from "../../context/SellerAuthContext";

export const FinancesPage: React.FC = () => {
  const { seller } = useSellerAuth();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);

  const fetchFinances = async () => {
    try {
      setLoading(true);
      const [reportRes, transRes] = await Promise.allSettled([
        reportApi.getReport(),
        transactionApi.getTransactions(),
      ]);

      if (reportRes.status === "fulfilled") {
        setReport(reportRes.value.data?.report);
      }

      if (transRes.status === "fulfilled") {
        setTransactions(
          Array.isArray(transRes.value.data?.transactions)
            ? transRes.value.data.transactions
            : []
        );
      }
    } catch (err) {
      console.error("Failed to load financial records:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinances();
  }, []);

  const totalEarnings = report?.totalEarnings || 0;
  const netEarnings = report?.netEarnings || 0;
  const totalRefunds = report?.totalRefunds || 0;
  const estimatedPlatformFee = Math.max(0, totalEarnings - netEarnings);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
            Finances & Settlements
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Track marketplace revenue, platform commission, disbursement schedule, and transactions
          </p>
        </div>

        <button
          onClick={fetchFinances}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border text-xs font-semibold text-foreground hover:border-primary transition-colors shadow-xs w-fit"
        >
          <Refresh fontSize="small" />
          <span>Sync Finances</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Sales */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-xs">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
            Gross Sales
          </span>
          <span className="text-2xl font-black text-foreground mt-2 block">
            ₹{totalEarnings.toLocaleString("en-IN")}
          </span>
          <span className="text-[11px] text-muted-foreground mt-0.5 block">
            Total product sales volume
          </span>
        </div>

        {/* Net Settlement */}
        <div className="p-5 rounded-2xl bg-card border border-emerald-500/30 shadow-xs">
          <span className="text-xs font-semibold text-emerald-500 uppercase tracking-wider block">
            Net Earnings
          </span>
          <span className="text-2xl font-black text-emerald-500 mt-2 block">
            ₹{netEarnings.toLocaleString("en-IN")}
          </span>
          <span className="text-[11px] text-muted-foreground mt-0.5 block">
            Available merchant balance
          </span>
        </div>

        {/* Platform Fees */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-xs">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
            Platform Commission
          </span>
          <span className="text-2xl font-black text-foreground mt-2 block">
            ₹{estimatedPlatformFee.toLocaleString("en-IN")}
          </span>
          <span className="text-[11px] text-muted-foreground mt-0.5 block">
            Marketplace services & fee
          </span>
        </div>

        {/* Refunds */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-xs">
          <span className="text-xs font-semibold text-rose-500 uppercase tracking-wider block">
            Total Refunds
          </span>
          <span className="text-2xl font-black text-rose-500 mt-2 block">
            ₹{totalRefunds.toLocaleString("en-IN")}
          </span>
          <span className="text-[11px] text-muted-foreground mt-0.5 block">
            Processed return credits
          </span>
        </div>
      </div>

      {/* Settlement Account Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-surface via-card to-surface border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <AccountBalance fontSize="medium" />
          </div>
          <div>
            <span className="text-xs font-bold text-foreground block">
              Disbursement Bank Account
            </span>
            <span className="text-[11px] text-muted-foreground block font-mono mt-0.5">
              {seller?.bankDetails?.bankName
                ? `${seller.bankDetails.bankName} • A/C: ****${seller.bankDetails.accountNumber?.slice(-4)} • IFSC: ${seller.bankDetails.ifscCode}`
                : "No bank account registered yet. Configure in Store Profile."}
            </span>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-bold w-fit">
          Settlement Mode: Bi-Weekly Automated NEFT
        </span>
      </div>

      {/* Transaction History Ledger */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-xs">
        <div className="p-4 border-b border-border flex items-center justify-between bg-surface/30">
          <div>
            <h2 className="text-sm font-bold text-foreground">Transaction Ledger</h2>
            <p className="text-[11px] text-muted-foreground">
              Official records of orders, payouts, and marketplace balances
            </p>
          </div>
          <span className="text-xs text-muted-foreground">{transactions.length} record(s)</span>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <CircularProgress size={32} />
            <span className="text-xs text-muted-foreground">Loading ledger...</span>
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-16 text-center">
            <ReceiptLongOutlined className="text-muted-foreground/40 mb-2" sx={{ fontSize: 44 }} />
            <h3 className="text-xs font-bold text-foreground">No transactions recorded</h3>
            <p className="text-[11px] text-muted-foreground mt-1 max-w-xs mx-auto">
              Transactions are generated automatically as orders are paid and fulfilled.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-surface/60 border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4 font-semibold">Transaction Ref</th>
                  <th className="py-3 px-3 font-semibold">Date & Time</th>
                  <th className="py-3 px-3 font-semibold">Order ID</th>
                  <th className="py-3 px-3 font-semibold">Gross Value</th>
                  <th className="py-3 px-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {transactions.map((t) => (
                  <tr key={t._id} className="hover:bg-surface/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-foreground">
                      #{t._id.slice(-8).toUpperCase()}
                    </td>
                    <td className="py-3 px-3 text-muted-foreground">
                      {new Date(t.createdAt).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3 px-3 font-mono text-primary font-semibold">
                      #{t.order?._id ? t.order._id.slice(-6).toUpperCase() : "N/A"}
                    </td>
                    <td className="py-3 px-3 font-bold text-foreground">
                      ₹{t.order?.totalSellingPrice?.toLocaleString("en-IN") || "0"}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        CONFIRMED
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
