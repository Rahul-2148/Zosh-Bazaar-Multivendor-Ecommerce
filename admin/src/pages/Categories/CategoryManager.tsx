import React, { useCallback, useEffect, useState } from "react";
import { adminApi } from "../../api/adminApi";
import type {
  CategoryItem,
  CategoryTreeItem,
  CategoryAttribute,
} from "../../types/adminTypes";
import { PageHeader } from "../../components/common/PageHeader";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { EmptyState } from "../../components/common/EmptyState";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import {
  AddOutlined,
  DeleteOutline,
  EditOutlined,
  FolderOpenOutlined,
  LayersOutlined,
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

export const CategoryManager: React.FC = () => {
  const [tree, setTree] = useState<CategoryTreeItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected level 1 / level 2 for drilldown
  const [selectedL1, setSelectedL1] = useState<CategoryTreeItem | null>(null);
  const [selectedL2, setSelectedL2] = useState<CategoryTreeItem | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [targetParent, setTargetParent] = useState<{ id: string; name: string; level: number } | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [attributes, setAttributes] = useState<CategoryAttribute[]>([]);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<CategoryItem | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const loadTree = useCallback(() => {
    adminApi
      .getCategoryTree()
      .then((data) => {
        setTree(data);
        setLoading(false);
        // Sync selected nodes
        if (selectedL1) {
          const freshL1 = data.find((c) => c._id === selectedL1._id) || null;
          setSelectedL1(freshL1);
          if (freshL1 && selectedL2) {
            const freshL2 =
              freshL1.children?.find((c) => c._id === selectedL2._id) || null;
            setSelectedL2(freshL2);
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load category tree", err);
        setLoading(false);
      });
  }, [selectedL1, selectedL2]);

  useEffect(() => {
    loadTree();
  }, [loadTree]);

  const openCreateModal = (parent?: { id: string; name: string; level: number }) => {
    setEditingCategory(null);
    setTargetParent(parent || null);
    setName("");
    setCategoryId("");
    setDescription("");
    setImage("");
    setAttributes([]);
    setModalOpen(true);
  };

  const openEditModal = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setTargetParent(null);
    setName(cat.name);
    setCategoryId(cat.categoryId);
    setDescription(cat.description || "");
    setImage(cat.image || "");
    setAttributes(cat.attributes || []);
    setModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingCategory) {
      setCategoryId(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_+|_+$/g, "")
      );
    }
  };

  // Attribute Builder Helpers
  const addAttribute = () => {
    setAttributes((prev) => [
      ...prev,
      {
        name: "",
        key: "",
        type: "SELECT",
        isVariant: false,
        options: [],
        allowedUnits: [],
        required: false,
      },
    ]);
  };

  const updateAttr = (index: number, field: keyof CategoryAttribute, val: any) => {
    setAttributes((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      if (field === "name" && !copy[index].key) {
        copy[index].key = String(val).toLowerCase().replace(/[^a-z0-9]+/g, "_");
      }
      return copy;
    });
  };

  const removeAttr = (index: number) => {
    setAttributes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await adminApi.updateCategory(editingCategory._id, {
          name,
          description,
          image,
          attributes,
        });
      } else {
        await adminApi.createCategory({
          name,
          categoryId,
          description,
          image,
          parentCategory: targetParent ? (targetParent.id as any) : null,
          attributes,
        });
      }
      setModalOpen(false);
      loadTree();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || "Failed to save category");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminApi.deleteCategory(deleteTarget._id);
      setDeleteModalOpen(false);
      if (selectedL2?._id === deleteTarget._id) setSelectedL2(null);
      if (selectedL1?._id === deleteTarget._id) setSelectedL1(null);
      loadTree();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || "Failed to delete category");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Category & Specification Architecture"
        subtitle="Configure the 3-level catalog hierarchy and define category-specific variant attributes and specifications."
        action={
          <button
            onClick={() => openCreateModal()}
            className="flex items-center gap-2 px-3.5 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
          >
            <AddOutlined fontSize="small" />
            Add Department (Level 1)
          </button>
        }
      />

      {loading ? (
        <LoadingSpinner message="Loading catalog structure..." />
      ) : tree.length === 0 ? (
        <EmptyState
          title="No Categories Configured"
          description="Your catalog is completely empty. Create your first top-level department to begin structuring real products."
          actionLabel="Create Top-Level Department"
          onAction={() => openCreateModal()}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Level 1: Departments */}
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col h-[650px]">
            <div className="p-4 border-b border-border bg-muted/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LayersOutlined className="text-primary text-sm" />
                <h3 className="font-semibold text-xs text-foreground uppercase tracking-wider">
                  1. Departments ({tree.length})
                </h3>
              </div>
            </div>
            <div className="p-3 overflow-y-auto flex-1 divide-y divide-border">
              {tree.map((cat) => (
                <div
                  key={cat._id}
                  onClick={() => {
                    setSelectedL1(cat);
                    setSelectedL2(cat.children?.[0] || null);
                  }}
                  className={`p-3 rounded-xl cursor-pointer transition-all flex items-center justify-between group ${
                    selectedL1?._id === cat._id
                      ? "bg-primary/10 border border-primary/30 text-primary font-semibold"
                      : "hover:bg-muted/60 text-foreground"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate">{cat.name}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">/{cat.categoryId}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(cat);
                        }}
                      >
                        <EditOutlined fontSize="small" className="text-muted-foreground" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(cat);
                          setDeleteModalOpen(true);
                        }}
                      >
                        <DeleteOutline fontSize="small" className="text-destructive" />
                      </IconButton>
                    </Tooltip>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Level 2: Sections */}
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col h-[650px]">
            <div className="p-4 border-b border-border bg-muted/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderOpenOutlined className="text-info text-sm" />
                <h3 className="font-semibold text-xs text-foreground uppercase tracking-wider truncate">
                  2. Sections {selectedL1 ? `under ${selectedL1.name}` : ""}
                </h3>
              </div>
              {selectedL1 && (
                <button
                  onClick={() =>
                    openCreateModal({
                      id: selectedL1._id,
                      name: selectedL1.name,
                      level: 1,
                    })
                  }
                  className="p-1 hover:bg-muted rounded-lg text-xs font-medium text-foreground flex items-center gap-1 transition-colors"
                >
                  <AddOutlined sx={{ fontSize: 16 }} /> Add
                </button>
              )}
            </div>
            <div className="p-3 overflow-y-auto flex-1 divide-y divide-border">
              {!selectedL1 ? (
                <div className="h-full flex items-center justify-center text-center p-6 text-muted-foreground text-xs">
                  Select a Department on the left to view sub-sections.
                </div>
              ) : !selectedL1.children || selectedL1.children.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">No sections created yet</p>
                  <button
                    onClick={() =>
                      openCreateModal({
                        id: selectedL1._id,
                        name: selectedL1.name,
                        level: 1,
                      })
                    }
                    className="text-xs text-primary font-semibold underline"
                  >
                    + Add first section
                  </button>
                </div>
              ) : (
                selectedL1.children.map((cat) => (
                  <div
                    key={cat._id}
                    onClick={() => setSelectedL2(cat)}
                    className={`p-3 rounded-xl cursor-pointer transition-all flex items-center justify-between group ${
                      selectedL2?._id === cat._id
                        ? "bg-primary/10 border border-primary/30 text-primary font-semibold"
                        : "hover:bg-muted/60 text-foreground"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">{cat.name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">/{cat.categoryId}</p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(cat);
                        }}
                      >
                        <EditOutlined fontSize="small" className="text-muted-foreground" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(cat);
                          setDeleteModalOpen(true);
                        }}
                      >
                        <DeleteOutline fontSize="small" className="text-destructive" />
                      </IconButton>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Level 3: Leaf Categories & Attributes */}
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col h-[650px]">
            <div className="p-4 border-b border-border bg-muted/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-xs text-foreground uppercase tracking-wider truncate">
                  3. Leaf Categories {selectedL2 ? `under ${selectedL2.name}` : ""}
                </h3>
              </div>
              {selectedL2 && (
                <button
                  onClick={() =>
                    openCreateModal({
                      id: selectedL2._id,
                      name: selectedL2.name,
                      level: 2,
                    })
                  }
                  className="p-1 hover:bg-muted rounded-lg text-xs font-medium text-foreground flex items-center gap-1 transition-colors"
                >
                  <AddOutlined sx={{ fontSize: 16 }} /> Add
                </button>
              )}
            </div>
            <div className="p-3 overflow-y-auto flex-1 divide-y divide-border">
              {!selectedL2 ? (
                <div className="h-full flex items-center justify-center text-center p-6 text-muted-foreground text-xs">
                  Select a Section to inspect product categories and attributes.
                </div>
              ) : !selectedL2.children || selectedL2.children.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">No leaf categories created</p>
                  <button
                    onClick={() =>
                      openCreateModal({
                        id: selectedL2._id,
                        name: selectedL2.name,
                        level: 2,
                      })
                    }
                    className="text-xs text-primary font-semibold underline"
                  >
                    + Add leaf category
                  </button>
                </div>
              ) : (
                selectedL2.children.map((cat) => (
                  <div
                    key={cat._id}
                    className="p-3 rounded-xl hover:bg-muted/60 transition-all flex flex-col gap-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-foreground">{cat.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">/{cat.categoryId}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <IconButton size="small" onClick={() => openEditModal(cat)}>
                          <EditOutlined fontSize="small" className="text-muted-foreground" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setDeleteTarget(cat);
                            setDeleteModalOpen(true);
                          }}
                        >
                          <DeleteOutline fontSize="small" className="text-destructive" />
                        </IconButton>
                      </div>
                    </div>
                    {/* Attributes tags preview */}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {cat.attributes && cat.attributes.length > 0 ? (
                        cat.attributes.map((attr, idx) => (
                          <span
                            key={idx}
                            className={`px-2 py-0.5 text-[10px] rounded-md font-medium ${
                              attr.isVariant
                                ? "bg-purple-500/15 text-purple-400 border border-purple-500/30"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {attr.name} {attr.isVariant && "• Variant"}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-muted-foreground italic">
                          No specific attributes defined
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Category Create/Edit Dialog with Attribute Builder */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: "1rem", p: 1, bgcolor: "background.paper", color: "text.primary" } }}
      >
        <form onSubmit={handleSave}>
          <DialogTitle sx={{ pb: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p className="text-base font-bold text-foreground">
                {editingCategory ? `Edit Category: ${editingCategory.name}` : "Create Category"}
              </p>
              {targetParent && (
                <p className="text-xs text-muted-foreground font-normal">
                  Parent: {targetParent.name} (Level {targetParent.level + 1})
                </p>
              )}
            </div>
            <IconButton size="small" onClick={() => setModalOpen(false)}>
              <Close fontSize="small" />
            </IconButton>
          </DialogTitle>

          <DialogContent dividers sx={{ spaceY: 4 }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Smartphones, T-Shirts, Sofas"
                  className="w-full px-3 py-2 border border-input rounded-lg text-xs bg-card text-foreground focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Category Slug / Identifier *
                </label>
                <input
                  type="text"
                  required
                  disabled={Boolean(editingCategory)}
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  placeholder="smartphones"
                  className="w-full px-3 py-2 border border-input rounded-lg text-xs bg-muted text-foreground focus:outline-none focus:border-primary font-mono"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description for SEO and catalog presentation..."
                  className="w-full px-3 py-2 border border-input rounded-lg text-xs bg-card text-foreground focus:outline-none focus:border-primary"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Banner / Representative Image URL
                </label>
                <input
                  type="url"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-input rounded-lg text-xs bg-card text-foreground focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Dynamic Attribute Builder */}
            <div className="mt-6 border-t border-border pt-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Category Specification & Variant Attributes
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Define the specifications products in this category accept (e.g. RAM, Color, Storage, Shoe Size, Material, Weight).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addAttribute}
                  className="px-3 py-1.5 bg-primary/10 text-primary border border-primary/30 rounded-lg text-xs font-semibold hover:bg-primary/20 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <AddOutlined sx={{ fontSize: 16 }} /> Add Attribute
                </button>
              </div>

              {attributes.length === 0 ? (
                <div className="p-4 bg-muted/60 rounded-xl text-center text-xs text-muted-foreground border border-dashed border-border">
                  No attributes defined yet. Click "Add Attribute" to add RAM, Color, Size, etc.
                </div>
              ) : (
                <div className="space-y-3">
                  {attributes.map((attr, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-muted/60 border border-border rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-3 items-center text-xs"
                    >
                      <div className="sm:col-span-3">
                        <label className="block text-[10px] text-muted-foreground font-semibold mb-0.5">
                          Attribute Name
                        </label>
                        <input
                          type="text"
                          required
                          value={attr.name}
                          onChange={(e) => updateAttr(idx, "name", e.target.value)}
                          placeholder="e.g. RAM"
                          className="w-full px-2 py-1.5 border border-input rounded-md bg-card text-foreground text-xs"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] text-muted-foreground font-semibold mb-0.5">
                          Field Type
                        </label>
                        <select
                          value={attr.type}
                          onChange={(e) => updateAttr(idx, "type", e.target.value)}
                          className="w-full px-2 py-1.5 border border-input rounded-md bg-card text-foreground text-xs"
                        >
                          <option value="SELECT">Select Options</option>
                          <option value="MEASUREMENT">Measurement</option>
                          <option value="TEXT">Text</option>
                          <option value="NUMBER">Number</option>
                          <option value="BOOLEAN">Yes / No</option>
                        </select>
                      </div>

                      <div className="sm:col-span-4">
                        <label className="block text-[10px] text-muted-foreground font-semibold mb-0.5">
                          {attr.type === "MEASUREMENT"
                            ? "Allowed Units (comma separated)"
                            : "Options (comma separated)"}
                        </label>
                        <input
                          type="text"
                          value={
                            attr.type === "MEASUREMENT"
                              ? attr.allowedUnits?.join(", ") || ""
                              : attr.options?.join(", ") || ""
                          }
                          onChange={(e) => {
                            const arr = e.target.value.split(",").map((s) => s.trim());
                            if (attr.type === "MEASUREMENT") {
                              updateAttr(idx, "allowedUnits", arr);
                            } else {
                              updateAttr(idx, "options", arr);
                            }
                          }}
                          placeholder={
                            attr.type === "MEASUREMENT"
                              ? "g, kg, ml, L, cm"
                              : "8GB, 12GB, 16GB"
                          }
                          className="w-full px-2 py-1.5 border border-input rounded-md bg-card text-foreground text-xs"
                        />
                      </div>

                      <div className="sm:col-span-2 flex items-center gap-3 pt-3 sm:pt-0">
                        <label className="flex items-center gap-1 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={attr.isVariant}
                            onChange={(e) => updateAttr(idx, "isVariant", e.target.checked)}
                            className="rounded text-primary focus:ring-primary"
                          />
                          <span className="text-[11px] font-semibold text-foreground">Variant</span>
                        </label>
                      </div>

                      <div className="sm:col-span-1 text-right">
                        <IconButton size="small" onClick={() => removeAttr(idx)}>
                          <DeleteOutline fontSize="small" className="text-destructive" />
                        </IconButton>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
              {editingCategory ? "Save Changes" : "Create Category"}
            </button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog
        open={deleteModalOpen}
        title="Delete Category"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? Make sure there are no subcategories or products attached.`}
        confirmLabel="Delete Category"
        isDestructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModalOpen(false)}
      />
    </div>
  );
};
