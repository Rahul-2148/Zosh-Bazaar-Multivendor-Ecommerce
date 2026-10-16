import React, { useCallback, useEffect, useState } from "react";
import { adminApi } from "../../api/adminApi";
import type { QuestionItem } from "../../types/adminTypes";
import { PageHeader } from "../../components/common/PageHeader";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { EmptyState } from "../../components/common/EmptyState";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import {
  Pagination,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from "@mui/material";
import {
  CheckCircleOutline,
  HighlightOffOutlined,
  PersonOutline,
  ShoppingBagOutlined,
} from "@mui/icons-material";

export const QuestionModeration: React.FC = () => {
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);

  // Rejection Dialog State
  const [rejectTarget, setRejectTarget] = useState<QuestionItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);

  // Approval Confirmation Dialog State
  const [approveTarget, setApproveTarget] = useState<QuestionItem | null>(null);
  const [approveModalOpen, setApproveModalOpen] = useState(false);

  const fetchQuestions = useCallback((pageNum: number, status: string) => {
    let ignore = false;
    adminApi
      .getQuestionModerationQueue(pageNum, status)
      .then((data) => {
        if (!ignore) {
          setQuestions(data.questions || []);
          setTotalPages(data.totalPages || 1);
          setTotalQuestions(data.totalQuestions || 0);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load question moderation queue", err);
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    return fetchQuestions(page, statusFilter);
  }, [page, statusFilter, fetchQuestions]);

  const reloadData = () => {
    setLoading(true);
    fetchQuestions(page, statusFilter);
  };

  const handleConfirmApprove = async () => {
    if (!approveTarget) return;
    setActionInProgress(true);
    try {
      await adminApi.moderateQuestion(approveTarget._id, "APPROVE");
      setApproveModalOpen(false);
      setApproveTarget(null);
      reloadData();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || "Failed to approve question");
    } finally {
      setActionInProgress(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectTarget) return;
    setActionInProgress(true);
    try {
      await adminApi.moderateQuestion(
        rejectTarget._id,
        "REJECT",
        rejectionReason.trim() || "Question does not meet community guidelines"
      );
      setRejectModalOpen(false);
      setRejectTarget(null);
      setRejectionReason("");
      reloadData();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || "Failed to reject question");
    } finally {
      setActionInProgress(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Q&A Moderation Queue"
        subtitle={`Reviewing customer inquiries across marketplace catalog items. Showing ${totalQuestions} questions.`}
        action={
          <div className="flex items-center gap-2">
            {["PENDING", "APPROVED", "REJECTED", "ALL"].map((st) => (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === st
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-card text-muted-foreground border border-border hover:bg-muted"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        }
      />

      <div className="bg-card rounded-xl border border-border shadow-xs overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Loading customer questions..." />
        ) : questions.length === 0 ? (
          <EmptyState
            title="No questions in this moderation queue"
            description={
              statusFilter === "PENDING"
                ? "All customer questions have been moderated. Check Approved or Rejected tabs to review historical decisions."
                : `No questions match the current filter (${statusFilter}).`
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-muted-foreground">
                <thead className="bg-muted/60 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                  <tr>
                    <th className="px-6 py-3.5">Product</th>
                    <th className="px-6 py-3.5">Question & Context</th>
                    <th className="px-6 py-3.5">Customer</th>
                    <th className="px-6 py-3.5">Date</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {questions.map((q) => {
                    const prodTitle = q.product?.title || "Unknown Product";
                    const prodImage = q.product?.images?.[0] || "";
                    const customerName = q.userName || q.user?.fullName || "Valued Shopper";

                    return (
                      <tr key={q._id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3 max-w-[220px]">
                            {prodImage ? (
                              <img
                                src={prodImage}
                                alt={prodTitle}
                                className="w-10 h-10 rounded-lg object-cover border border-border shrink-0 bg-muted"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0 border border-border">
                                <ShoppingBagOutlined sx={{ fontSize: 18 }} className="text-muted-foreground" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground text-xs truncate" title={prodTitle}>
                                {prodTitle}
                              </p>
                              {q.product?.sellingPrice && (
                                <p className="text-[11px] text-muted-foreground">
                                  ₹{q.product.sellingPrice.toLocaleString("en-IN")}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 max-w-[340px]">
                          <div className="space-y-1">
                            <p className="text-foreground text-xs font-medium leading-relaxed">
                              "{q.question}"
                            </p>
                            {q.answers && q.answers.length > 0 && (
                              <p className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold">
                                ✓ {q.answers.length} verified {q.answers.length === 1 ? "answer" : "answers"}
                              </p>
                            )}
                            {q.rejectionReason && (
                              <p className="text-[11px] text-rose-600 dark:text-rose-400 italic">
                                Reason: {q.rejectionReason}
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                            <PersonOutline sx={{ fontSize: 16 }} className="text-muted-foreground" />
                            <span>{customerName}</span>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(q.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          {q.moderationStatus === "APPROVED" ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
                              APPROVED
                            </span>
                          ) : q.moderationStatus === "REJECTED" ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
                              REJECTED
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-900">
                              PENDING
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            {q.moderationStatus !== "APPROVED" && (
                              <Tooltip title="Approve Question for Public Display">
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setApproveTarget(q);
                                    setApproveModalOpen(true);
                                  }}
                                  className="text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                                >
                                  <CheckCircleOutline fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}

                            {q.moderationStatus !== "REJECTED" && (
                              <Tooltip title="Reject Question">
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setRejectTarget(q);
                                    setRejectionReason("");
                                    setRejectModalOpen(true);
                                  }}
                                  className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                >
                                  <HighlightOffOutlined fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="p-4 border-t border-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Showing page {page} of {totalPages}
                </span>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_, val) => setPage(val)}
                  size="small"
                  color="primary"
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Confirmation Dialog for Approving */}
      <ConfirmDialog
        open={approveModalOpen}
        title="Approve Customer Question"
        message={`Are you sure you want to approve this question? Once approved, it will be visible publicly on the product details page.`}
        confirmLabel={actionInProgress ? "Approving..." : "Approve Question"}
        onConfirm={handleConfirmApprove}
        onCancel={() => {
          setApproveModalOpen(false);
          setApproveTarget(null);
        }}
      />

      {/* Rejection Modal with Reason */}
      <Dialog
        open={rejectModalOpen}
        onClose={() => {
          if (!actionInProgress) {
            setRejectModalOpen(false);
            setRejectTarget(null);
          }
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: "1.1rem" }}>
          Reject Customer Question
        </DialogTitle>
        <DialogContent>
          <p className="text-xs text-muted-foreground mb-3">
            Please provide a reason for rejecting this question. The question will not appear publicly on the storefront.
          </p>
          <TextField
            autoFocus
            fullWidth
            size="small"
            multiline
            rows={3}
            label="Rejection Reason"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="e.g. Offensive language, spam, or off-topic product inquiry"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setRejectModalOpen(false);
              setRejectTarget(null);
            }}
            color="inherit"
            disabled={actionInProgress}
            sx={{ textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmReject}
            variant="contained"
            color="error"
            disabled={actionInProgress}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              borderRadius: "0.75rem",
            }}
          >
            {actionInProgress ? "Rejecting..." : "Reject Question"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default QuestionModeration;
