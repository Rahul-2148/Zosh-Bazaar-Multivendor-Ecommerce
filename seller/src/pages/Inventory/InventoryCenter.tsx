import React, { useState, useEffect } from "react";
import {
  TuneOutlined,
  Search,
  WarningAmberOutlined,
  CheckCircleOutline,
  ErrorOutline,
  EditOutlined,
  Refresh,
  SaveOutlined,
  Inventory2Outlined,
} from "@mui/icons-material";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Tooltip,
} from "@mui/material";
import { productApi } from "../../services/api";

interface InventoryRow {
  productId: string;
  productTitle: string;
  brand: string;
  image: string;
  variantId?: string;
  variantTitle?: string;
  sku: string;
  price: number;
  countInStock: number;
  isVariant: boolean;
}

export const InventoryCenter: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"ALL" | "LOW_STOCK" | "OUT_OF_STOCK" | "HEALTHY">("ALL");

  // Stock edit modal
  const [editingItem, setEditingItem] = useState<InventoryRow | null>(null);
  const [editStockValue, setEditStockValue] = useState<number>(0);
  const [saveLoading, setSaveLoading] = useState(false);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await productApi.getProducts();
      setProducts(Array.isArray(res.data?.products) ? res.data.products : []);
    } catch (err) {
      console.error("Failed to load inventory:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // Flatten products and variants into operational SKU rows
  const inventoryRows: InventoryRow[] = [];
  products.forEach((p) => {
    const mainImg = p.images?.[0] || "https://placehold.co/80x80/png?text=No+Img";
    if (p.hasVariants && Array.isArray(p.variants) && p.variants.length > 0) {
      p.variants.forEach((v: any) => {
        inventoryRows.push({
          productId: p._id,
          productTitle: p.title,
          brand: p.brand || "Generic",
          image: v.images?.[0] || mainImg,
          variantId: v._id,
          variantTitle: v.title || v.attributes?.map((a: any) => a.value).join(" / "),
          sku: v.sku || `${p.title.slice(0, 4)}-${v._id?.slice(-4)}`,
          price: v.sellingPrice || p.sellingPrice,
          countInStock: v.countInStock || 0,
          isVariant: true,
        });
      });
    } else {
      inventoryRows.push({
        productId: p._id,
        productTitle: p.title,
        brand: p.brand || "Generic",
        image: mainImg,
        sku: `${(p.title || "PROD").slice(0, 4).toUpperCase()}-${p._id?.slice(-4)}`,
        price: p.sellingPrice,
        countInStock: p.countInStock || 0,
        isVariant: false,
      });
    }
  });

  // Calculate high-level metrics
  const totalSkus = inventoryRows.length;
  const lowStockCount = inventoryRows.filter((r) => r.countInStock > 0 && r.countInStock <= 5).length;
  const outOfStockCount = inventoryRows.filter((r) => r.countInStock === 0).length;
  const healthyStockCount = inventoryRows.filter((r) => r.countInStock > 5).length;

  // Filtered rows
  const filteredRows = inventoryRows.filter((row) => {
    const matchesQuery =
      !searchQuery ||
      row.productTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.variantTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.brand.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab =
      filterTab === "ALL" ||
      (filterTab === "LOW_STOCK" && row.countInStock > 0 && row.countInStock <= 5) ||
      (filterTab === "OUT_OF_STOCK" && row.countInStock === 0) ||
      (filterTab === "HEALTHY" && row.countInStock > 5);

    return matchesQuery && matchesTab;
  });

  // Save stock edit
  const handleSaveStock = async () => {
    if (!editingItem) return;
    try {
      setSaveLoading(true);
      const product = products.find((p) => p._id === editingItem.productId);
      if (!product) return;

      if (editingItem.isVariant && editingItem.variantId) {
        // Update variant array inside product
        const updatedVariants = product.variants.map((v: any) =>
          v._id === editingItem.variantId ? { ...v, countInStock: editStockValue } : v
        );
        await productApi.updateProduct(editingItem.productId, {
          hasVariants: true,
          variants: updatedVariants,
        });
      } else {
        await productApi.updateProduct(editingItem.productId, {
          countInStock: editStockValue,
        });
      }

      await fetchInventory();
      setEditingItem(null);
    } catch (err) {
      console.error("Failed to update stock count:", err);
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
            Inventory Center
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Operational stock control, variant-level availability, replenishment triggers, and alerts
          </p>
        </div>

        <button
          onClick={fetchInventory}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border text-xs font-semibold text-foreground hover:border-primary transition-colors shadow-xs w-fit"
        >
          <Refresh fontSize="small" />
          <span>Refresh Stock</span>
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setFilterTab("ALL")}
          className={`p-4 rounded-2xl bg-card border cursor-pointer transition-all ${
            filterTab === "ALL" ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-border-strong"
          }`}
        >
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Total SKUs Tracked
          </span>
          <span className="text-2xl font-black text-foreground mt-2 block">{totalSkus}</span>
          <span className="text-[10px] text-muted-foreground mt-0.5 block">Catalog items & variants</span>
        </div>

        <div
          onClick={() => setFilterTab("LOW_STOCK")}
          className={`p-4 rounded-2xl bg-card border cursor-pointer transition-all ${
            filterTab === "LOW_STOCK" ? "border-amber-500 ring-2 ring-amber-500/20" : "border-border hover:border-border-strong"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-amber-500 uppercase tracking-wider">
              Low Stock (&lt; 5)
            </span>
            <WarningAmberOutlined fontSize="small" className="text-amber-500" />
          </div>
          <span className="text-2xl font-black text-amber-500 mt-2 block">{lowStockCount}</span>
          <span className="text-[10px] text-muted-foreground mt-0.5 block">Needs immediate restock</span>
        </div>

        <div
          onClick={() => setFilterTab("OUT_OF_STOCK")}
          className={`p-4 rounded-2xl bg-card border cursor-pointer transition-all ${
            filterTab === "OUT_OF_STOCK" ? "border-rose-500 ring-2 ring-rose-500/20" : "border-border hover:border-border-strong"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-rose-500 uppercase tracking-wider">
              Out of Stock (0)
            </span>
            <ErrorOutline fontSize="small" className="text-rose-500" />
          </div>
          <span className="text-2xl font-black text-rose-500 mt-2 block">{outOfStockCount}</span>
          <span className="text-[10px] text-muted-foreground mt-0.5 block">Unavailable to buyers</span>
        </div>

        <div
          onClick={() => setFilterTab("HEALTHY")}
          className={`p-4 rounded-2xl bg-card border cursor-pointer transition-all ${
            filterTab === "HEALTHY" ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-border hover:border-border-strong"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-emerald-500 uppercase tracking-wider">
              Healthy Stock
            </span>
            <CheckCircleOutline fontSize="small" className="text-emerald-500" />
          </div>
          <span className="text-2xl font-black text-emerald-500 mt-2 block">{healthyStockCount}</span>
          <span className="text-[10px] text-muted-foreground mt-0.5 block">Over 5 units available</span>
        </div>
      </div>

      {/* Search and Table */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-xs">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface/30">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" fontSize="small" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by title, variant, or SKU..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-card border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-primary"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Showing {filteredRows.length} of {inventoryRows.length} SKUs</span>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <CircularProgress size={32} />
            <span className="text-xs text-muted-foreground">Auditing inventory levels...</span>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="py-16 text-center">
            <Inventory2Outlined className="text-muted-foreground/40 mb-2" sx={{ fontSize: 44 }} />
            <h3 className="text-xs font-bold text-foreground">No inventory items match filter</h3>
            <p className="text-[11px] text-muted-foreground mt-1">
              Try adjusting your search query or selecting a different stock tab.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-surface/60 border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4 font-semibold">SKU & Item</th>
                  <th className="py-3 px-3 font-semibold">Variant Options</th>
                  <th className="py-3 px-3 font-semibold">Price</th>
                  <th className="py-3 px-3 font-semibold">Stock Level</th>
                  <th className="py-3 px-3 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Quick Adjust</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredRows.map((row, idx) => {
                  const isOut = row.countInStock === 0;
                  const isLow = row.countInStock > 0 && row.countInStock <= 5;

                  return (
                    <tr key={idx} className="hover:bg-surface/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={row.image}
                            alt={row.productTitle}
                            className="w-10 h-10 rounded-xl object-cover border border-border bg-surface shrink-0"
                          />
                          <div className="truncate max-w-[220px]">
                            <span className="font-bold text-foreground block truncate">
                              {row.productTitle}
                            </span>
                            <span className="font-mono text-[10px] text-muted-foreground block">
                              SKU: {row.sku}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        {row.isVariant ? (
                          <span className="px-2 py-0.5 rounded-md bg-surface border border-border text-[11px] font-semibold text-foreground inline-block">
                            {row.variantTitle}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">Standalone Unit</span>
                        )}
                      </td>

                      <td className="py-3 px-3 font-bold text-foreground">
                        ₹{row.price?.toLocaleString("en-IN")}
                      </td>

                      <td className="py-3 px-3">
                        <span className="text-xs font-black text-foreground">
                          {row.countInStock} units
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            isOut
                              ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                              : isLow
                              ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                              : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          }`}
                        >
                          {isOut ? "Out of Stock" : isLow ? "Low Stock" : "In Stock"}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setEditingItem(row);
                            setEditStockValue(row.countInStock);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface border border-border hover:border-primary text-foreground text-[11px] font-semibold transition-colors ml-auto"
                        >
                          <EditOutlined fontSize="inherit" />
                          <span>Adjust</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Stock Adjustment Dialog */}
      <Dialog
        open={Boolean(editingItem)}
        onClose={() => setEditingItem(null)}
        PaperProps={{
          sx: { borderRadius: "16px", p: 1, minWidth: 320 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: "16px" }}>
          Adjust Stock Count
        </DialogTitle>
        <DialogContent>
          <div className="space-y-3 pt-2">
            <div>
              <span className="text-xs font-bold text-foreground block truncate">
                {editingItem?.productTitle}
              </span>
              <span className="text-[11px] text-muted-foreground font-mono block">
                SKU: {editingItem?.sku} • {editingItem?.variantTitle || "Standalone"}
              </span>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-semibold text-foreground">
                Available Physical Units
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditStockValue((prev) => Math.max(0, prev - 1))}
                  className="w-10 h-10 rounded-xl bg-surface border border-border text-foreground font-bold hover:bg-card flex items-center justify-center text-base"
                >
                  -
                </button>
                <input
                  type="number"
                  min="0"
                  value={editStockValue}
                  onChange={(e) => setEditStockValue(Math.max(0, Number(e.target.value)))}
                  className="w-full text-center px-3 py-2 rounded-xl bg-surface border border-border text-sm font-bold text-foreground focus:outline-hidden focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setEditStockValue((prev) => prev + 1)}
                  className="w-10 h-10 rounded-xl bg-surface border border-border text-foreground font-bold hover:bg-card flex items-center justify-center text-base"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
              <span>Quick add:</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setEditStockValue((prev) => prev + 10)}
                  className="px-2 py-0.5 rounded-md bg-surface border border-border font-semibold hover:bg-card"
                >
                  +10
                </button>
                <button
                  type="button"
                  onClick={() => setEditStockValue((prev) => prev + 50)}
                  className="px-2 py-0.5 rounded-md bg-surface border border-border font-semibold hover:bg-card"
                >
                  +50
                </button>
                <button
                  type="button"
                  onClick={() => setEditStockValue(0)}
                  className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-500 border border-rose-500/20 font-semibold"
                >
                  Set 0
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setEditingItem(null)}
            sx={{ textTransform: "none", color: "var(--color-foreground)" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveStock}
            variant="contained"
            disabled={saveLoading}
            startIcon={saveLoading ? <CircularProgress size={14} color="inherit" /> : <SaveOutlined fontSize="small" />}
            sx={{
              backgroundColor: "var(--color-primary)",
              textTransform: "none",
              fontWeight: 700,
              borderRadius: "8px",
            }}
          >
            {saveLoading ? "Saving..." : "Update Stock"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
