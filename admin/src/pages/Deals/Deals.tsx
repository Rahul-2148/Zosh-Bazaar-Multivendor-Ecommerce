import React, { useEffect, useState } from "react";
import { adminApi } from "../../api/adminApi";
import type { DealItem, HomeCategoryItem } from "../../types/adminTypes";
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { AddOutlined, DeleteOutline, LocalOfferOutlined } from "@mui/icons-material";

export const Deals: React.FC = () => {
  const [deals, setDeals] = useState<DealItem[]>([]);
  const [categories, setCategories] = useState<HomeCategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [discount, setDiscount] = useState(25);
  const [selectedCatId, setSelectedCatId] = useState("");

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<DealItem | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  useEffect(() => {
    let ignore = false;
    Promise.all([adminApi.getAllDeals(), adminApi.getHomeCategories()])
      .then(([dealsData, catsData]) => {
        if (!ignore) {
          setDeals(Array.isArray(dealsData) ? dealsData : []);
          const cats = Array.isArray(catsData) ? catsData : [];
          setCategories(cats);
          if (cats.length > 0) {
            setSelectedCatId(cats[0]._id);
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load deals or categories", err);
        if (!ignore) {
          setDeals([]);
          setCategories([]);
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, []);

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCatId) return;
    setSubmitting(true);
    try {
      const created = await adminApi.createDeal({
        deal: { discount, category: selectedCatId },
      });
      setDeals((prev) => [created, ...prev]);
      setCreateModalOpen(false);
    } catch (err) {
      console.error("Failed to create deal", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDeal = async () => {
    if (!deleteTarget) return;
    try {
      await adminApi.deleteDeal(deleteTarget._id);
      setDeals((prev) => prev.filter((d) => d._id !== deleteTarget._id));
      setDeleteModalOpen(false);
    } catch (err) {
      console.error("Failed to delete deal", err);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Featured Deals & Flash Promotions"
        subtitle="Manage promotional discount callouts highlighted on the storefront homepage."
        action={
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-semibold transition-colors shadow-sm cursor-pointer"
          >
            <AddOutlined sx={{ fontSize: 18 }} />
            <span>Create Deal</span>
          </button>
        }
      />

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Loading promotions..." />
        ) : !Array.isArray(deals) || deals.length === 0 ? (
          <EmptyState
            title="No active deals"
            description="Create promotional deal banners for home page categories."
            action={
              <Button
                variant="contained"
                color="primary"
                onClick={() => setCreateModalOpen(true)}
              >
                Create First Deal
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-muted-foreground">
              <thead className="bg-muted/60 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                <tr>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">Banner Preview</th>
                  <th className="px-6 py-3.5">Discount Callout</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {(Array.isArray(deals) ? deals : []).map((deal) => (
                  <tr key={deal._id} className="hover:bg-surface-hover transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <LocalOfferOutlined className="text-primary text-base" />
                        <span className="font-semibold text-foreground text-xs">
                          {deal.category?.name || "Featured Category"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <img
                        src={deal.category?.image || "https://via.placeholder.com/60"}
                        alt={deal.category?.name}
                        className="w-16 h-10 object-cover rounded-md border border-border"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-3 py-1 rounded-md text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                        {deal.discount}% OFF
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Tooltip title="Delete Deal">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setDeleteTarget(deal);
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

      {/* Create Deal Modal */}
      <Dialog
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: "1rem", p: 1, bgcolor: "background.paper", color: "text.primary" } }}
      >
        <form onSubmit={handleCreateDeal}>
          <DialogTitle sx={{ fontWeight: 700, fontSize: "1.1rem" }}>
            Add Homepage Deal
          </DialogTitle>
          <DialogContent sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2.5 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="deal-cat-label">Target Category</InputLabel>
              <Select
                labelId="deal-cat-label"
                value={selectedCatId}
                label="Target Category"
                onChange={(e) => setSelectedCatId(e.target.value)}
              >
                {categories.map((cat) => (
                  <MenuItem key={cat._id} value={cat._id}>
                    {cat.name} ({cat.section})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Discount Percentage (%)"
              type="number"
              value={discount}
              onChange={(e) => setDiscount(parseInt(e.target.value) || 0)}
              required
              fullWidth
              size="small"
              inputProps={{ min: 1, max: 99 }}
            />
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
              {submitting ? "Adding..." : "Add Deal"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog
        open={deleteModalOpen}
        title="Delete Deal"
        message="Are you sure you want to remove this promotion from the homepage?"
        confirmLabel="Remove Deal"
        isDestructive
        onConfirm={handleDeleteDeal}
        onCancel={() => setDeleteModalOpen(false)}
      />
    </div>
  );
};
