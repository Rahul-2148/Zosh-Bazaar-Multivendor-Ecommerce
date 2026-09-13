import React, { useEffect, useState } from "react";
import { adminApi } from "../../api/adminApi";
import type { BrandItem } from "../../types/adminTypes";
import { PageHeader } from "../../components/common/PageHeader";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { EmptyState } from "../../components/common/EmptyState";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import {
  AddOutlined,
  DeleteOutline,
  EditOutlined,
  Close,
} from "@mui/icons-material";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
} from "@mui/material";

export const Brands: React.FC = () => {
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<BrandItem | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [logo, setLogo] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<BrandItem | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const loadBrands = () => {
    adminApi
      .getAllBrands(true)
      .then((data) => {
        setBrands(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load brands", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadBrands();
  }, []);

  const openCreateModal = () => {
    setEditingBrand(null);
    setName("");
    setSlug("");
    setLogo("");
    setDescription("");
    setWebsite("");
    setIsActive(true);
    setModalOpen(true);
  };

  const openEditModal = (b: BrandItem) => {
    setEditingBrand(b);
    setName(b.name);
    setSlug(b.slug);
    setLogo(b.logo || "");
    setDescription(b.description || "");
    setWebsite(b.website || "");
    setIsActive(b.isActive);
    setModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingBrand) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
      );
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBrand) {
        await adminApi.updateBrand(editingBrand._id, {
          name,
          slug,
          logo,
          description,
          website,
          isActive,
        });
      } else {
        await adminApi.createBrand({
          name,
          slug,
          logo,
          description,
          website,
          isActive,
        });
      }
      setModalOpen(false);
      loadBrands();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || "Failed to save brand");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminApi.deleteBrand(deleteTarget._id);
      setDeleteModalOpen(false);
      loadBrands();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || "Failed to delete brand");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Brand Registry"
        subtitle="Manage recognized manufacturing and retail brands available on Zosh Bazaar."
        action={
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-3.5 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
          >
            <AddOutlined fontSize="small" />
            Add New Brand
          </button>
        }
      />

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Loading brands..." />
        ) : brands.length === 0 ? (
          <EmptyState
            title="No Brands Registered"
            description="Register official brands so products can be categorized and filtered by brand."
            actionLabel="Add Brand"
            onAction={openCreateModal}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-muted-foreground">
              <thead className="bg-muted/60 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                <tr>
                  <th className="px-6 py-3.5">Brand</th>
                  <th className="px-6 py-3.5">Slug</th>
                  <th className="px-6 py-3.5">Website</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {brands.map((brand) => (
                  <tr key={brand._id} className="hover:bg-surface-hover transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {brand.logo ? (
                          <img
                            src={brand.logo}
                            alt={brand.name}
                            className="w-9 h-9 rounded-lg object-contain border border-border p-1 bg-card"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                            {brand.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-foreground text-xs">{brand.name}</p>
                          {brand.description && (
                            <p className="text-[11px] text-muted-foreground truncate max-w-xs">
                              {brand.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-muted-foreground">
                      {brand.slug}
                    </td>
                    <td className="px-6 py-4 text-xs text-foreground">
                      {brand.website ? (
                        <a
                          href={brand.website}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline"
                        >
                          {brand.website.replace(/^https?:\/\//, "")}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          brand.isActive
                            ? "bg-success-soft text-success border border-success/25"
                            : "bg-muted text-muted-foreground border border-border"
                        }`}
                      >
                        {brand.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip title="Edit Brand">
                          <IconButton size="small" onClick={() => openEditModal(brand)}>
                            <EditOutlined fontSize="small" className="text-muted-foreground" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Brand">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setDeleteTarget(brand);
                              setDeleteModalOpen(true);
                            }}
                          >
                            <DeleteOutline fontSize="small" className="text-destructive" />
                          </IconButton>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Brand Dialog */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "1rem", p: 1, bgcolor: "background.paper", color: "text.primary" } }}
      >
        <form onSubmit={handleSave}>
          <DialogTitle sx={{ pb: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p className="text-base font-bold text-foreground">
              {editingBrand ? `Edit Brand: ${editingBrand.name}` : "Add New Brand"}
            </p>
            <IconButton size="small" onClick={() => setModalOpen(false)}>
              <Close fontSize="small" />
            </IconButton>
          </DialogTitle>

          <DialogContent dividers className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Brand Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Apple, Nike, Samsung"
                className="w-full px-3 py-2 border border-input rounded-lg text-xs bg-card text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Brand Slug
              </label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="apple"
                className="w-full px-3 py-2 border border-input rounded-lg text-xs bg-muted text-foreground focus:outline-none focus:border-primary font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Logo Image URL
              </label>
              <input
                type="url"
                value={logo}
                onChange={(e) => setLogo(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-input rounded-lg text-xs bg-card text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Website
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://brand.com"
                className="w-full px-3 py-2 border border-input rounded-lg text-xs bg-card text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Description
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of brand identity..."
                className="w-full px-3 py-2 border border-input rounded-lg text-xs bg-card text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="brandActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded text-primary focus:ring-primary"
              />
              <label htmlFor="brandActive" className="text-xs font-semibold text-foreground cursor-pointer">
                Active in marketplace
              </label>
            </div>
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2 }}>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 border border-border rounded-xl text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
            >
              {editingBrand ? "Update Brand" : "Create Brand"}
            </button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog
        open={deleteModalOpen}
        title="Delete Brand"
        message={`Are you sure you want to delete brand "${deleteTarget?.name}"?`}
        confirmLabel="Delete Brand"
        isDestructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModalOpen(false)}
      />
    </div>
  );
};
