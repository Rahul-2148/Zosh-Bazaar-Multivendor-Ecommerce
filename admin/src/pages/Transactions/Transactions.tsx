import React, { useEffect, useState } from "react";
import { adminApi } from "../../api/adminApi";
import type { TransactionItem } from "../../types/adminTypes";
import { PageHeader } from "../../components/common/PageHeader";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { EmptyState } from "../../components/common/EmptyState";
import { Pagination } from "@mui/material";

export const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);

  useEffect(() => {
    let ignore = false;
    adminApi
      .getAllTransactions(page)
      .then((data) => {
        if (!ignore) {
          setTransactions(Array.isArray(data.transactions) ? data.transactions : []);
          setTotalPages(data.totalPages || 1);
          setTotalTransactions(data.totalTransactions || 0);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load transactions", err);
        if (!ignore) {
          setTransactions([]);
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, [page]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financial Ledger & Payouts"
        subtitle={`Tracking ${totalTransactions} processed customer payments and vendor accounting entries.`}
      />

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Fetching transaction ledger..." />
        ) : !Array.isArray(transactions) || transactions.length === 0 ? (
          <EmptyState
            title="No transactions found"
            description="Payment and settlement records will appear once customer orders are placed."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-muted-foreground">
                <thead className="bg-muted/60 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                  <tr>
                    <th className="px-6 py-3.5">Transaction ID</th>
                    <th className="px-6 py-3.5">Settlement Date</th>
                    <th className="px-6 py-3.5">Customer</th>
                    <th className="px-6 py-3.5">Vendor / Payee</th>
                    <th className="px-6 py-3.5">Linked Order</th>
                    <th className="px-6 py-3.5 text-right">Settled Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-medium">
                  {(Array.isArray(transactions) ? transactions : []).map((tx) => (
                    <tr key={tx._id} className="hover:bg-surface-hover transition-colors">
                      <td className="px-6 py-4 font-mono text-xs font-bold text-foreground">
                        {tx._id.slice(-8).toUpperCase()}
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {new Date(tx.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-semibold text-foreground">
                          {tx.customer?.fullName || "Customer"}
                        </p>
                        <p className="text-[11px] text-muted-foreground">{tx.customer?.email}</p>
                      </td>
                      <td className="px-6 py-4 text-xs text-foreground">
                        {tx.seller?.sellerName || "Direct Platform"}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-primary">
                        {tx.order ? tx.order._id?.slice(-8).toUpperCase() : "—"}
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-foreground text-right">
                        ₹{tx.order?.totalSellingPrice?.toLocaleString("en-IN") || "0"}
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
    </div>
  );
};
