import React, { useCallback, useEffect, useState } from "react";
import { adminApi } from "../../api/adminApi";
import type { ProductItem } from "../../types/adminTypes";
import { PageHeader } from "../../components/common/PageHeader";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { EmptyState } from "../../components/common/EmptyState";
import {
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from "@mui/material";
import {
  EditOutlined,
  WarningAmberOutlined,
  Close,
} from "@mui/icons-material";

export const InventoryManager: React.FC = () => {
  const [items, setItems] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // Edit stock modal
  const [editingItem, setEditingItem] = useState<ProductItem | null>(null);
  const [editStockValue, setEditStockValue] = useState<number>(0);
  const [editVariantId, setEditVariantId] = useState<string>("");
  const [stockModalOpen, setStockModalOpen] = useState(false);

  const loadInventory = useCallback((pageNum: number, lowStock: boolean) => {
    let ignore = false;
    adminApi
      .getInventory(pageNum, lowStock)
      .then((data) => {
        if (!ignore) {
          setItems(data.items || []);
          setTotalPages(data.totalPages || 1);
          setTotalProducts(data.totalProducts || 0);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load inventory", err);
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    return loadInventory(page, lowStockOnly);
  }, [page, lowStockOnly, loadInventory]);

  const openAdjustStock = (item: ProductItem, variantId?: string, currentStock?: number) => {
    setEditingItem(item);
    setEditVariantId(variantId || "");
    setEditStockValue(currentStock !== undefined ? currentStock : item.countInStock);
    setStockModalOpen(true);
  };

  const handleStockSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      await adminApi.updateStock(editingItem._id, {
        countInStock: Number(editStockValue),
        variantId: editVariantId || undefined,
      });
      setStockModalOpen(false);
      loadInventory(page, lowStockOnly);
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || "Failed to update stock");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory Operations & Stock Control"
        subtitle={`Tracking warehouse inventory across ${totalProducts} catalog products and individual variants.`}
        action={
          <label className="flex items-center gap-2 px-3 py-1.5 bg-card border border-border rounded-xl text-xs font-semibold text-foreground cursor-pointer shadow-sm select-none">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => {
                setLowStockOnly(e.target.checked);
                setPage(1);
              }}
              className="rounded text-primary focus:ring-primary"
            />
            <span>Show Low Stock Only (≤ 10)</span>
          </label>
        }
      />

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Loading inventory ledgers..." />
        ) : items.length === 0 ? (
          <EmptyState
            title="No inventory records"
            description={
              lowStockOnly
                ? "Great news! No products are currently below the critical low stock threshold."
                : "No products currently exist in the database."
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-foreground">
                <thead className="bg-muted/60 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                  <tr>
                    <th className="px-6 py-3.5">Product & SKU</th>
                    <th className="px-6 py-3.5">Vendor</th>
                    <th className="px-6 py-3.5">Total Stock</th>
                    <th className="px-6 py-3.5">Variants Breakdown</th>
                    <th className="px-6 py-3.5 text-right">Adjust Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-medium">
                  {items.map((prod) => (
                    <tr key={prod._id} className="hover:bg-surface-hover transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={prod.images?.[0] || "https://via.placeholder.com/40"}
                            alt={prod.title}
                            className="w-9 h-9 rounded-lg object-cover border border-border"
                          />
                          <div>
                            <p className="font-semibold text-foreground text-xs truncate max-w-xs">
                              {prod.title}
                            </p>
                            <p className="text-[11px] text-muted-foreground font-mono">
                              {prod.brand || "Generic"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {prod.seller?.sellerName || "Platform"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            prod.countInStock > 10
                              ? "bg-success-soft text-success border border-success/25"
                              : prod.countInStock > 0
                              ? "bg-warning-soft text-warning border border-warning/25"
                              : "bg-destructive-soft text-destructive border border-destructive/25"
                          }`}
                        >
                          {prod.countInStock <= 10 && prod.countInStock > 0 && (
                            <WarningAmberOutlined sx={{ fontSize: 14 }} />
                          )}
                          {prod.countInStock} units
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {prod.hasVariants && prod.variants && prod.variants.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 max-w-md">
                            {prod.variants.map((v) => (
                              <button
                                key={v._id || v.sku}
                                onClick={() => openAdjustStock(prod, v._id, v.countInStock)}
                                className={`px-2 py-0.5 rounded-md text-[11px] font-medium border text-left transition-colors cursor-pointer ${
                                  v.countInStock <= 3
                                    ? "bg-destructive-soft border-destructive/25 text-destructive"
                                    : "bg-card border-border text-foreground hover:bg-primary/10 hover:border-primary/30"
                                }`}
                              >
                                {v.title || v.sku}: <span className="font-bold">{v.countInStock}</span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Single item product</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => openAdjustStock(prod)}
                          className="px-3 py-1 border border-border rounded-lg text-xs font-semibold text-foreground hover:bg-muted flex items-center gap-1 ml-auto cursor-pointer"
                        >
                          <EditOutlined sx={{ fontSize: 14 }} /> Edit
                        </button>
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

      {/* Adjust Stock Modal */}
      <Dialog
        open={stockModalOpen}
        onClose={() => setStockModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: "1rem", p: 1, bgcolor: "background.paper", color: "text.primary" } }}
      >
        <form onSubmit={handleStockSave}>
          <DialogTitle sx={{ pb: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p className="text-sm font-bold text-foreground">Adjust Available Stock</p>
              <p className="text-[11px] text-muted-foreground truncate max-w-xs">{editingItem?.title}</p>
            </div>
            <IconButton size="small" onClick={() => setStockModalOpen(false)}>
              <Close fontSize="small" />
            </IconButton>
          </DialogTitle>

          <DialogContent dividers className="space-y-3">
            {editVariantId && (
              <div className="p-2.5 bg-primary/10 border border-primary/20 rounded-lg text-xs text-primary">
                Updating stock for specific variant ID:{" "}
                <span className="font-mono font-bold">{editVariantId}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                New Available Stock Quantity *
              </label>
              <input
                type="number"
                min="0"
                required
                value={editStockValue}
                onChange={(e) => setEditStockValue(Number(e.target.value))}
                className="w-full px-3 py-2 border border-input rounded-lg text-sm font-bold bg-card text-foreground focus:outline-none focus:border-primary"
              />
            </div>
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2 }}>
            <button
              type="button"
              onClick={() => setStockModalOpen(false)}
              className="px-4 py-1.5 border border-border rounded-xl text-xs font-semibold text-foreground hover:bg-muted cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-1.5 bg-primary text-primary-foreground rounded-xl text-xs font-semibold hover:bg-primary/90 cursor-pointer"
            >
              Update Stock
            </button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
};
