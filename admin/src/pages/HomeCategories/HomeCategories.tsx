import React, { useEffect, useState } from "react";
import { adminApi } from "../../api/adminApi";
import type { HomeCategoryItem } from "../../types/adminTypes";
import { PageHeader } from "../../components/common/PageHeader";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { EmptyState } from "../../components/common/EmptyState";
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
import { EditOutlined, GridViewOutlined } from "@mui/icons-material";

export const HomeCategories: React.FC = () => {
  const [categories, setCategories] = useState<HomeCategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [editTarget, setEditTarget] = useState<HomeCategoryItem | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", image: "", categoryId: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let ignore = false;
    adminApi
      .getHomeCategories()
      .then((data) => {
        if (!ignore) {
          setCategories(Array.isArray(data) ? data : []);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load home categories", err);
        if (!ignore) {
          setCategories([]);
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, []);

  const handleOpenEdit = (cat: HomeCategoryItem) => {
    setEditTarget(cat);
    setEditForm({
      name: cat.name,
      image: cat.image,
      categoryId: cat.categoryId,
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setSaving(true);
    try {
      await adminApi.updateHomeCategory(editTarget._id, editForm);
      setCategories((prev) =>
        prev.map((c) => (c._id === editTarget._id ? { ...c, ...editForm } : c))
      );
      setEditModalOpen(false);
    } catch (err) {
      console.error("Failed to update home category", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Storefront Layout & Visual Merchandising"
        subtitle="Configure homepage category grids, banners, and curated shopping sections."
      />

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Fetching storefront sections..." />
        ) : !Array.isArray(categories) || categories.length === 0 ? (
          <EmptyState
            title="No storefront categories"
            description="Run database seeder or add categories to populate the homepage."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-foreground">
              <thead className="bg-muted/60 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                <tr>
                  <th className="px-6 py-3.5">Category Tile</th>
                  <th className="px-6 py-3.5">Display Banner</th>
                  <th className="px-6 py-3.5">Storefront Section</th>
                  <th className="px-6 py-3.5">Linked Target ID</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {(Array.isArray(categories) ? categories : []).map((cat) => (
                  <tr key={cat._id} className="hover:bg-surface-hover transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <GridViewOutlined className="text-primary text-base" />
                        <span className="font-semibold text-foreground text-xs">
                          {cat.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <img
                        src={cat.image}
                        alt={cat.name}
                        className="w-16 h-12 object-cover rounded-md border border-border"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-muted text-muted-foreground border border-border">
                        {cat.section}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-muted-foreground">
                      {cat.categoryId}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Tooltip title="Edit Tile">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenEdit(cat)}
                          sx={{ color: "primary.main" }}
                        >
                          <EditOutlined fontSize="small" />
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

      {/* Edit Category Modal */}
      <Dialog
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { bgcolor: "background.paper", color: "text.primary" } }}
      >
        <form onSubmit={handleSaveEdit}>
          <DialogTitle sx={{ fontWeight: 700, fontSize: "1.1rem" }}>
            Edit Storefront Tile
          </DialogTitle>
          <DialogContent sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2.5 }}>
            <TextField
              label="Display Label"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              required
              fullWidth
              size="small"
            />
            <TextField
              label="Image Banner URL"
              value={editForm.image}
              onChange={(e) => setEditForm({ ...editForm, image: e.target.value })}
              required
              fullWidth
              size="small"
              helperText="Paste direct image link (Unsplash, Cloudinary, etc.)"
            />
            <TextField
              label="Target Category ID"
              value={editForm.categoryId}
              onChange={(e) =>
                setEditForm({ ...editForm, categoryId: e.target.value })
              }
              required
              fullWidth
              size="small"
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button
              onClick={() => setEditModalOpen(false)}
              color="inherit"
              sx={{ textTransform: "none" }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={saving}
              sx={{
                textTransform: "none",
              }}
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
};
