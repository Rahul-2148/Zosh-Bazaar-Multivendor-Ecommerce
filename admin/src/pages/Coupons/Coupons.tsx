import React, { useEffect, useState } from "react";
import { adminApi } from "../../api/adminApi";
import type { CouponItem } from "../../types/adminTypes";
import { PageHeader } from "../../components/common/PageHeader";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { EmptyState } from "../../components/common/EmptyState";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  AddOutlined,
  DeleteOutline,
  ConfirmationNumberOutlined,
} from "@mui/icons-material";

const getDefaultCoupon = () => ({
  code: "",
  discountPercentage: 20,
  minimumOrderValue: 500,
  validityStartDate: new Date().toISOString().split("T")[0],
  validityEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0],
});

export const Coupons: React.FC = () => {
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newCoupon, setNewCoupon] = useState(getDefaultCoupon);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<CouponItem | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  useEffect(() => {
    let ignore = false;
      adminApi
        .getAllCoupons()
        .then((data) => {
          if (!ignore) {
            setCoupons(Array.isArray(data) ? data : []);
            setLoading(false);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch coupons", err);
          if (!ignore) {
            setCoupons([]);
            setLoading(false);
          }
        });
    return () => {
      ignore = true;
    };
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const created = await adminApi.createCoupon(newCoupon);
      setCoupons((prev) => [created, ...prev]);
      setCreateModalOpen(false);
      setNewCoupon({
        code: "",
        discountPercentage: 20,
        minimumOrderValue: 500,
        validityStartDate: new Date().toISOString().split("T")[0],
        validityEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
      });
    } catch (err) {
      console.error("Failed to create coupon", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCoupon = async () => {
    if (!deleteTarget) return;
    try {
      await adminApi.deleteCoupon(deleteTarget._id);
      setCoupons((prev) => prev.filter((c) => c._id !== deleteTarget._id));
      setDeleteModalOpen(false);
    } catch (err) {
      console.error("Failed to delete coupon", err);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Promotions & Coupons"
        subtitle="Manage platform-wide checkout discount codes and minimum cart requirements."
        action={
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-semibold transition-colors shadow-sm cursor-pointer"
          >
            <AddOutlined sx={{ fontSize: 18 }} />
            <span>Create Coupon</span>
          </button>
        }
      />

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Loading promotion codes..." />
        ) : !Array.isArray(coupons) || coupons.length === 0 ? (
          <EmptyState
            title="No active coupons"
            description="Create promo codes to run campaigns and offer checkout discounts."
            action={
              <Button
                variant="contained"
                color="primary"
                onClick={() => setCreateModalOpen(true)}
              >
                Create First Coupon
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-muted-foreground">
              <thead className="bg-muted/60 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                <tr>
                  <th className="px-6 py-3.5">Promo Code</th>
                  <th className="px-6 py-3.5">Discount</th>
                  <th className="px-6 py-3.5">Min Order Value</th>
                  <th className="px-6 py-3.5">Valid From</th>
                  <th className="px-6 py-3.5">Valid Until</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {(Array.isArray(coupons) ? coupons : []).map((coupon) => (
                  <tr key={coupon._id} className="hover:bg-surface-hover transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <ConfirmationNumberOutlined className="text-primary text-base" />
                        <span className="font-mono font-bold text-foreground text-xs px-2 py-1 bg-muted rounded border border-border">
                          {coupon.code}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-primary">
                      {coupon.discountPercentage}% OFF
                    </td>
                    <td className="px-6 py-4 text-xs text-foreground font-mono">
                      ₹{coupon.minimumOrderValue?.toLocaleString("en-IN")}
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {new Date(coupon.validityStartDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {new Date(coupon.validityEndDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          coupon.isActive
                            ? "bg-success-soft text-success border border-success/25"
                            : "bg-muted text-muted-foreground border border-border"
                        }`}
                      >
                        {coupon.isActive ? "Active" : "Expired"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Tooltip title="Delete Coupon">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setDeleteTarget(coupon);
                            setDeleteModalOpen(true);
                          }}
                          sx={{ color: "error.main" }}
                        >
                          <DeleteOutline fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Coupon Modal */}
      <Dialog
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "1rem", p: 1, bgcolor: "background.paper", color: "text.primary" } }}
      >
        <form onSubmit={handleCreateCoupon}>
          <DialogTitle sx={{ fontWeight: 700, fontSize: "1.1rem" }}>
            Generate New Promotion Coupon
          </DialogTitle>
          <DialogContent sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2.5 }}>
            <TextField
              label="Coupon Code"
              value={newCoupon.code}
              onChange={(e) =>
                setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })
              }
              placeholder="e.g. FESTIVE30"
              required
              fullWidth
              size="small"
              helperText="Code will be entered by customers at checkout."
            />
            <div className="grid grid-cols-2 gap-3">
              <TextField
                label="Discount Percentage (%)"
                type="number"
                value={newCoupon.discountPercentage}
                onChange={(e) =>
                  setNewCoupon({
                    ...newCoupon,
                    discountPercentage: parseInt(e.target.value) || 0,
                  })
                }
                required
                size="small"
                inputProps={{ min: 1, max: 100 }}
              />
              <TextField
                label="Min. Order Value (₹)"
                type="number"
                value={newCoupon.minimumOrderValue}
                onChange={(e) =>
                  setNewCoupon({
                    ...newCoupon,
                    minimumOrderValue: parseInt(e.target.value) || 0,
                  })
                }
                required
                size="small"
                inputProps={{ min: 0 }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <TextField
                label="Start Date"
                type="date"
                value={newCoupon.validityStartDate}
                onChange={(e) =>
                  setNewCoupon({
                    ...newCoupon,
                    validityStartDate: e.target.value,
                  })
                }
                required
                size="small"
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="End Date"
                type="date"
                value={newCoupon.validityEndDate}
                onChange={(e) =>
                  setNewCoupon({
                    ...newCoupon,
                    validityEndDate: e.target.value,
                  })
                }
                required
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </div>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button
              onClick={() => setCreateModalOpen(false)}
              color="inherit"
              sx={{ textTransform: "none" }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={submitting}
              sx={{
                textTransform: "none",
              }}
            >
              {submitting ? "Creating..." : "Save Coupon"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        open={deleteModalOpen}
        title="Delete Coupon"
        message={`Are you sure you want to delete coupon code "${deleteTarget?.code}"? Customers will no longer be able to apply it.`}
        confirmLabel="Delete Coupon"
        isDestructive
        onConfirm={handleDeleteCoupon}
        onCancel={() => setDeleteModalOpen(false)}
      />
    </div>
  );
};
