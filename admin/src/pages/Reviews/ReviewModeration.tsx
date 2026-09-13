import React, { useCallback, useEffect, useState } from "react";
import { adminApi } from "../../api/adminApi";
import type { ReviewItem } from "../../types/adminTypes";
import { PageHeader } from "../../components/common/PageHeader";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { EmptyState } from "../../components/common/EmptyState";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import {
  Pagination,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  CheckCircleOutline,
  HighlightOffOutlined,
  DeleteOutline,
  Star,
  VerifiedUserOutlined,
} from "@mui/icons-material";

export const ReviewModeration: React.FC = () => {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReviews, setTotalReviews] = useState(0);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<ReviewItem | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const loadReviews = useCallback((pageNum: number, status: string) => {
    let ignore = false;
    adminApi
      .getAllReviews(pageNum, status)
      .then((data) => {
        if (!ignore) {
          setReviews(data.reviews || []);
          setTotalPages(data.totalPages || 1);
          setTotalReviews(data.totalReviews || 0);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load reviews", err);
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    return loadReviews(page, statusFilter);
  }, [page, statusFilter, loadReviews]);

  const handleUpdateStatus = async (id: string, newStatus: "APPROVED" | "REJECTED") => {
    try {
      await adminApi.updateReviewStatus(id, newStatus);
      loadReviews(page, statusFilter);
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || "Failed to update review status");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminApi.deleteReview(deleteTarget._id);
      setDeleteModalOpen(false);
      loadReviews(page, statusFilter);
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || "Failed to delete review");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Review Moderation"
        subtitle={`Managing ${totalReviews} customer feedback submissions and star ratings across catalog items.`}
        action={
          <div className="flex items-center gap-2">
            {["ALL", "APPROVED", "PENDING", "REJECTED"].map((st) => (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === st
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-card text-muted-foreground border border-border hover:bg-muted"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        }
      />

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Loading customer reviews..." />
        ) : reviews.length === 0 ? (
          <EmptyState
            title="No customer reviews found"
            description="No customer ratings match the current filter or database has zero reviews."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-muted-foreground">
                <thead className="bg-muted/60 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                  <tr>
                    <th className="px-6 py-3.5">Product</th>
                    <th className="px-6 py-3.5">Customer</th>
                    <th className="px-6 py-3.5">Rating & Feedback</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-medium">
                  {reviews.map((rev) => (
                    <tr key={rev._id} className="hover:bg-surface-hover transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={rev.product?.images?.[0] || "https://via.placeholder.com/40"}
                            alt={rev.product?.title || "Product"}
                            className="w-9 h-9 rounded-lg object-cover border border-border"
                          />
                          <div>
                            <p className="font-semibold text-foreground text-xs truncate max-w-xs">
                              {rev.product?.title || "Unknown Product"}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {rev.product?.brand || "Generic"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs">
                          <p className="font-semibold text-foreground">{rev.user?.fullName || "Anonymous"}</p>
                          <p className="text-[11px] text-muted-foreground">{rev.user?.email}</p>
                          {rev.verifiedPurchase && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-success font-bold mt-0.5">
                              <VerifiedUserOutlined sx={{ fontSize: 12 }} /> Verified Purchase
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-md">
                        <div className="flex items-center gap-1 text-amber-500 mb-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              sx={{ fontSize: 14 }}
                              className={i < rev.rating ? "text-amber-400" : "text-muted-foreground/30"}
                            />
                          ))}
                          <span className="text-xs font-bold text-foreground ml-1">
                            {rev.rating}.0
                          </span>
                        </div>
                        {rev.title && (
                          <p className="text-xs font-bold text-foreground mb-0.5">{rev.title}</p>
                        )}
                        <p className="text-xs text-muted-foreground line-clamp-2">{rev.comment}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            rev.status === "APPROVED"
                              ? "bg-success-soft text-success border border-success/25"
                              : rev.status === "PENDING"
                              ? "bg-warning-soft text-warning border border-warning/25"
                              : "bg-destructive-soft text-destructive border border-destructive/25"
                          }`}
                        >
                          {rev.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {rev.status !== "APPROVED" && (
                            <Tooltip title="Approve Review">
                              <IconButton
                                size="small"
                                onClick={() => handleUpdateStatus(rev._id, "APPROVED")}
                                className="text-success"
                              >
                                <CheckCircleOutline fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {rev.status !== "REJECTED" && (
                            <Tooltip title="Reject Review">
                              <IconButton
                                size="small"
                                onClick={() => handleUpdateStatus(rev._id, "REJECTED")}
                                className="text-warning"
                              >
                                <HighlightOffOutlined fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Delete Review">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setDeleteTarget(rev);
                                setDeleteModalOpen(true);
                              }}
                              className="text-destructive"
                            >
                              <DeleteOutline fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </div>
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

      <ConfirmDialog
        open={deleteModalOpen}
        title="Delete Customer Review"
        message="Are you sure you want to delete this customer review permanently? Product ratings will be recalculated."
        confirmLabel="Delete Review"
        isDestructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModalOpen(false)}
      />
    </div>
  );
};
