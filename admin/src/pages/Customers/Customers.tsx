import React, { useEffect, useState } from "react";
import { adminApi } from "../../api/adminApi";
import type { CustomerItem } from "../../types/adminTypes";
import { PageHeader } from "../../components/common/PageHeader";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { EmptyState } from "../../components/common/EmptyState";
import { Pagination } from "@mui/material";

export const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);

  useEffect(() => {
    let ignore = false;
    adminApi
      .getAllCustomers(page)
      .then((data) => {
        if (!ignore) {
          setCustomers(Array.isArray(data.customers) ? data.customers : []);
          setTotalPages(data.totalPages || 1);
          setTotalCustomers(data.totalCustomers || 0);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load customers", err);
        if (!ignore) {
          setCustomers([]);
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
        title="Customer Directory"
        subtitle={`Viewing ${totalCustomers} registered customer accounts across the marketplace.`}
      />

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Fetching customer records..." />
        ) : !Array.isArray(customers) || customers.length === 0 ? (
          <EmptyState
            title="No customers found"
            description="There are currently no registered buyers in the system."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-muted-foreground">
                <thead className="bg-muted/60 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                  <tr>
                    <th className="px-6 py-3.5">Customer Name</th>
                    <th className="px-6 py-3.5">Email</th>
                    <th className="px-6 py-3.5">Mobile</th>
                    <th className="px-6 py-3.5">Account Role</th>
                    <th className="px-6 py-3.5">Joined Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-medium">
                  {(Array.isArray(customers) ? customers : []).map((customer) => (
                    <tr key={customer._id} className="hover:bg-surface-hover transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">
                            {customer.fullName?.[0]?.toUpperCase() || "C"}
                          </div>
                          <span className="font-semibold text-foreground text-xs">
                            {customer.fullName || "Buyer"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-foreground">
                        {customer.email}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-muted-foreground">
                        {customer.mobile || "—"}
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {new Date(customer.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-muted text-muted-foreground border border-border">
                          Customer
                        </span>
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
