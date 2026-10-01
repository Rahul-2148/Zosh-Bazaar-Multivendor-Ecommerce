import React, { useMemo } from "react";
import { Dialog, DialogContent, DialogTitle, IconButton } from "@mui/material";
import { Close, AutoAwesome, ArrowForward } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../../Redux Toolkit/Store";
import ProductCard from "../Product/ProductCard";

interface SimilarItemsModalProps {
  open: boolean;
  onClose: () => void;
  sourceItem: any;
}

export const SimilarItemsModal: React.FC<SimilarItemsModalProps> = ({
  open,
  onClose,
  sourceItem,
}) => {
  const navigate = useNavigate();
  const { products } = useAppSelector((store) => store.product);

  const prod = sourceItem?.product || sourceItem || {};
  const currentId = prod._id || prod.productId || prod.id || "";
  const currentCategory =
    typeof prod.category === "object" && prod.category !== null
      ? prod.category.categoryId || prod.category.name || ""
      : prod.category1 || prod.category || "";

  // Find matching similar products from store
  const similarProducts = useMemo(() => {
    if (!products || products.length === 0) return [];

    const allOtherProducts = products.filter(
      (p: any) => (p._id || p.productId || p.id) !== currentId
    );

    // 1. Same category matches
    const categoryMatches = allOtherProducts.filter((p: any) => {
      const pCat =
        typeof p.category === "object" && p.category !== null
          ? p.category.categoryId || p.category.name || ""
          : p.category1 || p.category || "";
      return (
        currentCategory &&
        pCat &&
        pCat.toString().toLowerCase().includes(currentCategory.toString().toLowerCase())
      );
    });

    // 2. Same brand matches
    const brandMatches = allOtherProducts.filter(
      (p: any) =>
        prod.brand &&
        p.brand &&
        p.brand.toLowerCase() === prod.brand.toLowerCase() &&
        !categoryMatches.includes(p)
    );

    const merged = [...categoryMatches, ...brandMatches];

    // If still under 4, add other trending products from catalog
    if (merged.length < 4) {
      const remaining = allOtherProducts.filter((p: any) => !merged.includes(p));
      return [...merged, ...remaining].slice(0, 8);
    }

    return merged.slice(0, 8);
  }, [products, currentId, currentCategory, prod.brand]);

  const categorySlug =
    typeof prod.category === "object" && prod.category !== null
      ? prod.category.categoryId || prod.category.name || "all"
      : prod.category1 || prod.category || "all";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "1.25rem",
          backgroundColor: "var(--card)",
          color: "var(--card-foreground)",
          border: "1px solid var(--border)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          p: { xs: 2, sm: 2.5 },
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1.5,
        }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0 shadow-2xs">
            <AutoAwesome sx={{ fontSize: 18 }} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-black text-foreground tracking-tight truncate">
              Similar Products
            </h3>
            <p className="text-[11px] text-muted-foreground font-medium truncate max-w-[280px] sm:max-w-[450px]">
              Alternatives & matching items for: <strong>{prod.title || "Product"}</strong>
            </p>
          </div>
        </div>

        <IconButton
          onClick={onClose}
          size="small"
          aria-label="Close"
          sx={{
            color: "var(--muted-foreground)",
            "&:hover": { color: "var(--foreground)", backgroundColor: "var(--muted)" },
          }}
        >
          <Close sx={{ fontSize: 18 }} />
        </IconButton>
      </DialogTitle>

      {/* Grid of Similar Items */}
      <DialogContent sx={{ p: { xs: 2, sm: 3 }, overflowY: "auto", maxHeight: "70vh" }}>
        {similarProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3.5">
            {similarProducts.map((item: any) => (
              <ProductCard
                key={item._id || item.productId}
                item={item}
                compact
              />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-muted-foreground">
            <AutoAwesome sx={{ fontSize: 36, mb: 1, opacity: 0.5 }} />
            <p className="text-sm font-semibold text-foreground">No similar items found</p>
            <p className="text-xs text-muted-foreground mt-1">
              Check out our complete catalog for more great options.
            </p>
          </div>
        )}

        {/* Footer Navigation Link */}
        <div className="mt-4 pt-3 border-t border-border flex justify-end">
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate(`/products/${categorySlug}`);
            }}
            className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Explore All in {prod.category?.name || "This Category"}</span>
            <ArrowForward sx={{ fontSize: 14 }} />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SimilarItemsModal;
