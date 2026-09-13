import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "../../api/adminApi";
import type { ProductItem } from "../../types/adminTypes";
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
  AddOutlined,
  DeleteOutline,
  EditOutlined,
  SearchOutlined,
} from "@mui/icons-material";

export const Products: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<ProductItem | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const loadProducts = useCallback((pageNum: number, query?: string) => {
    let ignore = false;
    adminApi
      .getAllProducts(pageNum, query || undefined)
      .then((data) => {
        if (!ignore) {
          const list = Array.isArray(data.products) ? data.products : [];
          setProducts(list);
          setTotalPages(data.totalPages || 1);
          setTotalElements(data.totalElements || 0);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load products", err);
        if (!ignore) {
          setProducts([]);
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    return loadProducts(page, search);
  }, [page, loadProducts, search]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadProducts(1, search);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminApi.deleteProduct(deleteTarget._id);
      setProducts((prev) => prev.filter((p) => p._id !== deleteTarget._id));
      setDeleteModalOpen(false);
    } catch (err) {
      console.error("Failed to delete product", err);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Global Product Catalog"
        subtitle={`Monitoring ${totalElements} listed products across marketplace vendors.`}
        action={
          <div className="flex items-center gap-3">
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
              <div className="relative">
                <SearchOutlined className="absolute left-3 top-2.5 text-muted-foreground text-sm" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search catalog by title..."
                  className="pl-9 pr-3 py-1.5 bg-card border border-input rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary w-56 shadow-sm"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
              >
                Search
              </button>
            </form>

            <button
              onClick={() => navigate("/products/create")}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
            >
              <AddOutlined sx={{ fontSize: 18 }} />
              Add Product
            </button>
          </div>
        }
      />

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Loading catalog items..." />
        ) : !Array.isArray(products) || products.length === 0 ? (
          <EmptyState
            title="No products found"
            description="No catalog items matched your search query or database is empty."
            actionLabel="Create First Product"
            onAction={() => navigate("/products/create")}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-muted-foreground">
                <thead className="bg-muted/60 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                  <tr>
                    <th className="px-6 py-3.5">Product</th>
                    <th className="px-6 py-3.5">Category</th>
                    <th className="px-6 py-3.5">Vendor</th>
                    <th className="px-6 py-3.5">Price</th>
                    <th className="px-6 py-3.5">Variants & Stock</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-medium">
                  {products.map((prod) => (
                    <tr key={prod._id} className="hover:bg-surface-hover transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={prod.images?.[0] || "https://via.placeholder.com/40"}
                            alt={prod.title}
                            className="w-10 h-10 rounded-lg object-cover border border-border"
                          />
                          <div className="min-w-0 max-w-xs">
                            <p className="font-semibold text-foreground text-xs truncate">
                              {prod.title}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {prod.brand || "Generic"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-foreground">
                        {prod.category?.name || "Uncategorized"}
                      </td>
                      <td className="px-6 py-4 text-xs text-foreground">
                        {prod.seller?.sellerName || "Platform"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-foreground">
                            ₹{prod.sellingPrice?.toLocaleString("en-IN")}
                          </span>
                          {prod.mrpPrice && prod.mrpPrice > prod.sellingPrice && (
                            <span className="text-[11px] text-muted-foreground line-through">
                              ₹{prod.mrpPrice.toLocaleString("en-IN")}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold w-fit ${
                              prod.countInStock > 10
                                ? "bg-success-soft text-success border border-success/25"
                                : prod.countInStock > 0
                                ? "bg-warning-soft text-warning border border-warning/25"
                                : "bg-destructive-soft text-destructive border border-destructive/25"
                            }`}
                          >
                            {prod.countInStock === 0
                              ? "Out of Stock"
                              : `${prod.countInStock} in stock`}
                          </span>
                          {prod.hasVariants && (
                            <span className="text-[10px] text-purple-400 font-medium">
                              {prod.variants?.length || 0} variants configured
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Tooltip title="Edit Product">
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/products/${prod._id}/edit`)}
                              className="text-muted-foreground hover:text-primary"
                            >
                              <EditOutlined fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete from Catalog">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setDeleteTarget(prod);
                                setDeleteModalOpen(true);
                              }}
                              sx={{ color: "error.main" }}
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
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteTarget?.title}" from the platform catalog? This action is permanent.`}
        confirmLabel="Delete Product"
        isDestructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModalOpen(false)}
      />
    </div>
  );
};
