import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  AddCircleOutline,
  Search,
  FilterList,
  DeleteOutline,
  EditOutlined,
  MoreVert,
  DownloadOutlined,
  CheckCircleOutline,
  ArchiveOutlined,
  PublishOutlined,
  VisibilityOutlined,
  Inventory2Outlined,
  Refresh,
} from "@mui/icons-material";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Tooltip,
} from "@mui/material";
import { productApi, metaApi } from "../../services/api";

export const ProductList: React.FC = () => {
  const navigate = useNavigate();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedStockStatus, setSelectedStockStatus] = useState("ALL");
  const [categories, setCategories] = useState<any[]>([]);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  // Single delete dialog
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Row menu state
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [activeProduct, setActiveProduct] = useState<any | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await productApi.getProducts();
      setProducts(Array.isArray(res.data?.products) ? res.data.products : []);
    } catch (err) {
      console.error("Failed to load products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    metaApi.getCategoryTree()
      .then((res) => setCategories(Array.isArray(res.data) ? res.data : []))
      .catch(() => {});
  }, []);

  // Filter logic
  const filteredProducts = products.filter((p) => {
    // Search query match
    const matchesSearch =
      !searchQuery ||
      p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.variants?.some((v: any) => v.sku?.toLowerCase().includes(searchQuery.toLowerCase()));

    // Status filter
    const matchesStatus =
      selectedStatus === "ALL" || p.status === selectedStatus;

    // Stock status filter
    const count = p.countInStock || 0;
    const matchesStock =
      selectedStockStatus === "ALL" ||
      (selectedStockStatus === "IN_STOCK" && count > 5) ||
      (selectedStockStatus === "LOW_STOCK" && count > 0 && count <= 5) ||
      (selectedStockStatus === "OUT_OF_STOCK" && count === 0);

    // Category filter
    const matchesCategory =
      selectedCategory === "ALL" ||
      p.category?._id === selectedCategory ||
      p.category?.categoryId === selectedCategory;

    return matchesSearch && matchesStatus && matchesStock && matchesCategory;
  });

  // Select all toggle
  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map((p) => p._id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Bulk status update
  const handleBulkStatus = async (status: string) => {
    if (selectedIds.length === 0) return;
    try {
      setActionLoading(true);
      await productApi.bulkStatus(selectedIds, status);
      await fetchProducts();
      setSelectedIds([]);
    } catch (err) {
      console.error("Bulk status failed:", err);
    } finally {
      setActionLoading(false);
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} products?`)) return;
    try {
      setActionLoading(true);
      await productApi.deleteMultiple(selectedIds);
      await fetchProducts();
      setSelectedIds([]);
    } catch (err) {
      console.error("Bulk delete failed:", err);
    } finally {
      setActionLoading(false);
    }
  };

  // Single delete
  const confirmSingleDelete = async () => {
    if (!deleteId) return;
    try {
      setActionLoading(true);
      await productApi.deleteProduct(deleteId);
      await fetchProducts();
      setDeleteId(null);
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setActionLoading(false);
    }
  };

  // Export genuine CSV
  const handleExportCSV = () => {
    if (products.length === 0) return;

    const headers = ["ID", "Title", "Brand", "Category", "VariantsCount", "SellingPrice", "MRPPrice", "Stock", "Status"];
    const rows = products.map((p) => [
      p._id,
      `"${(p.title || "").replace(/"/g, '""')}"`,
      `"${p.brand || ""}"`,
      `"${p.category?.name || ""}"`,
      p.variants?.length || 0,
      p.sellingPrice,
      p.mrpPrice,
      p.countInStock,
      p.status,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `catalog_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
            Product Catalog
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your store items, generic variants, pricing, and live marketplace status
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outlined"
            size="small"
            onClick={handleExportCSV}
            startIcon={<DownloadOutlined fontSize="small" />}
            sx={{ borderColor: "var(--color-border)", color: "var(--color-foreground)", textTransform: "none", fontSize: "12px", borderRadius: "10px" }}
          >
            Export CSV
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={() => navigate("/products/new")}
            startIcon={<AddCircleOutline fontSize="small" />}
            sx={{ backgroundColor: "var(--color-primary)", color: "var(--color-primary-foreground)", textTransform: "none", fontSize: "12px", borderRadius: "10px", fontWeight: 700 }}
          >
            Add Product
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-card border border-border space-y-3 shadow-xs">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" fontSize="small" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, brand, or SKU..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-primary transition-colors"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 rounded-xl bg-surface border border-border text-xs text-foreground focus:outline-hidden focus:border-primary"
            >
              <option value="ALL">All Statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </select>

            <select
              value={selectedStockStatus}
              onChange={(e) => setSelectedStockStatus(e.target.value)}
              className="px-3 py-2 rounded-xl bg-surface border border-border text-xs text-foreground focus:outline-hidden focus:border-primary"
            >
              <option value="ALL">All Stock Levels</option>
              <option value="IN_STOCK">In Stock (&gt; 5)</option>
              <option value="LOW_STOCK">Low Stock (1 - 5)</option>
              <option value="OUT_OF_STOCK">Out of Stock (0)</option>
            </select>

            <button
              onClick={fetchProducts}
              className="p-2 rounded-xl bg-surface border border-border text-muted-foreground hover:text-foreground hover:bg-card transition-colors shrink-0"
              title="Refresh catalog"
            >
              <Refresh fontSize="small" />
            </button>
          </div>
        </div>

        {/* Bulk Action Toolbar (Appears when items selected) */}
        {selectedIds.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/60 text-xs animate-in fade-in duration-150">
            <span className="font-semibold text-primary">
              {selectedIds.length} item(s) selected
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={actionLoading}
                onClick={() => handleBulkStatus("PUBLISHED")}
                className="px-2.5 py-1 rounded-lg bg-surface border border-border hover:bg-card font-medium text-[11px] text-emerald-600 transition-colors"
              >
                Publish Selected
              </button>
              <button
                disabled={actionLoading}
                onClick={() => handleBulkStatus("DRAFT")}
                className="px-2.5 py-1 rounded-lg bg-surface border border-border hover:bg-card font-medium text-[11px] text-amber-600 transition-colors"
              >
                Draft Selected
              </button>
              <button
                disabled={actionLoading}
                onClick={() => handleBulkStatus("ARCHIVED")}
                className="px-2.5 py-1 rounded-lg bg-surface border border-border hover:bg-card font-medium text-[11px] text-muted-foreground transition-colors"
              >
                Archive Selected
              </button>
              <button
                disabled={actionLoading}
                onClick={handleBulkDelete}
                className="px-2.5 py-1 rounded-lg bg-destructive/10 border border-destructive/20 hover:bg-destructive/20 font-medium text-[11px] text-destructive transition-colors"
              >
                Delete Selected
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Catalog Table */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <CircularProgress size={32} />
            <span className="text-xs text-muted-foreground">Loading catalog...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-16 text-center">
            <Inventory2Outlined className="text-muted-foreground/40 mb-2" sx={{ fontSize: 48 }} />
            <h3 className="text-sm font-bold text-foreground">No products found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
              {products.length === 0
                ? "Your store catalog is completely clean. Click 'Add Product' to configure generic variants and publish your first item."
                : "No products matched your active filters or search terms."}
            </p>
            {products.length === 0 ? (
              <Button
                variant="contained"
                size="small"
                onClick={() => navigate("/products/new")}
                startIcon={<AddCircleOutline fontSize="small" />}
                sx={{ backgroundColor: "var(--color-primary)", textTransform: "none", borderRadius: "10px", fontWeight: 700 }}
              >
                Add Your First Product
              </Button>
            ) : (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedStatus("ALL");
                  setSelectedStockStatus("ALL");
                  setSelectedCategory("ALL");
                }}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-surface/50 border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4 w-8">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filteredProducts.length && filteredProducts.length > 0}
                      onChange={handleToggleSelectAll}
                      className="rounded-sm text-primary focus:ring-primary cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-2 font-semibold">Product</th>
                  <th className="py-3 px-3 font-semibold">Category</th>
                  <th className="py-3 px-3 font-semibold">Variants / Attributes</th>
                  <th className="py-3 px-3 font-semibold">Price</th>
                  <th className="py-3 px-3 font-semibold">Inventory</th>
                  <th className="py-3 px-3 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredProducts.map((prod) => {
                  const isSelected = selectedIds.includes(prod._id);
                  const firstImg = prod.images?.[0] || "https://placehold.co/80x80/png?text=No+Img";
                  const variantCount = prod.variants?.length || 0;

                  return (
                    <tr
                      key={prod._id}
                      className={`hover:bg-surface/50 transition-colors ${
                        isSelected ? "bg-primary/5" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(prod._id)}
                          className="rounded-sm text-primary focus:ring-primary cursor-pointer"
                        />
                      </td>

                      {/* Thumbnail & Title */}
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-3">
                          <img
                            src={firstImg}
                            alt={prod.title}
                            className="w-12 h-12 rounded-xl object-cover border border-border shrink-0 bg-surface"
                          />
                          <div className="truncate max-w-[200px] sm:max-w-xs">
                            <span className="font-bold text-foreground block truncate hover:text-primary transition-colors cursor-pointer" onClick={() => navigate(`/products/${prod._id}/edit`)}>
                              {prod.title}
                            </span>
                            <span className="text-[10px] text-muted-foreground block truncate">
                              Brand: {prod.brand || "Generic"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3 text-muted-foreground">
                        <span className="font-medium text-foreground block truncate max-w-[120px]">
                          {prod.category?.name || "Uncategorized"}
                        </span>
                      </td>

                      {/* Variants & Attributes */}
                      <td className="py-3 px-3">
                        {prod.hasVariants && variantCount > 0 ? (
                          <div>
                            <span className="font-bold text-primary text-[11px] block">
                              {variantCount} Variants
                            </span>
                            <span className="text-[10px] text-muted-foreground block truncate max-w-[140px]">
                              {prod.attributeDefinitions?.map((a: any) => a.name).join(", ") || "Custom Options"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">Standalone</span>
                        )}
                      </td>

                      {/* Pricing */}
                      <td className="py-3 px-3">
                        <div>
                          <span className="font-extrabold text-foreground text-xs block">
                            ₹{prod.sellingPrice?.toLocaleString("en-IN")}
                          </span>
                          {prod.mrpPrice > prod.sellingPrice && (
                            <span className="text-[10px] text-muted-foreground line-through block">
                              ₹{prod.mrpPrice?.toLocaleString("en-IN")}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Inventory Count & Status Pill */}
                      <td className="py-3 px-3">
                        <div>
                          <span className="font-bold text-foreground block">
                            {prod.countInStock} units
                          </span>
                          <span
                            className={`text-[10px] font-semibold inline-block ${
                              prod.countInStock > 5
                                ? "text-emerald-500"
                                : prod.countInStock > 0
                                ? "text-amber-500"
                                : "text-destructive"
                            }`}
                          >
                            {prod.countInStock > 5
                              ? "In Stock"
                              : prod.countInStock > 0
                              ? "Low Stock"
                              : "Out of Stock"}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            prod.status === "PUBLISHED"
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                              : prod.status === "DRAFT"
                              ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                              : "bg-surface text-muted-foreground border-border"
                          }`}
                        >
                          {prod.status || "PUBLISHED"}
                        </span>
                      </td>

                      {/* Row Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Tooltip title="Edit Product">
                            <button
                              onClick={() => navigate(`/products/${prod._id}/edit`)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
                            >
                              <EditOutlined fontSize="small" />
                            </button>
                          </Tooltip>

                          <Tooltip title="Delete">
                            <button
                              onClick={() => setDeleteId(prod._id)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            >
                              <DeleteOutline fontSize="small" />
                            </button>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Summary */}
        <div className="p-4 border-t border-border bg-surface/30 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Showing <strong className="text-foreground">{filteredProducts.length}</strong> of{" "}
            <strong className="text-foreground">{products.length}</strong> total products
          </span>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        PaperProps={{
          sx: { borderRadius: "16px", p: 1 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: "16px" }}>
          Delete Product?
        </DialogTitle>
        <DialogContent sx={{ fontSize: "13px", color: "var(--color-muted-foreground)" }}>
          Are you sure you want to permanently delete this product? This action cannot be undone and will remove all variants from your catalog.
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteId(null)}
            sx={{ textTransform: "none", color: "var(--color-foreground)" }}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmSingleDelete}
            variant="contained"
            color="error"
            disabled={actionLoading}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: "8px" }}
          >
            {actionLoading ? "Deleting..." : "Delete Permanently"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
