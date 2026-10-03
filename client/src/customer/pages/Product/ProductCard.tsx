import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Star,
  AddShoppingCart,
  CheckCircle,
  ArrowForwardIos,
  BlockOutlined,
} from "@mui/icons-material";
import SaveButton from "../Wishlist/components/SaveButton";
import { useAppDispatch } from "../../../Redux Toolkit/Store";
import {
  addItemToCart,
  fetchUserCart,
} from "../../../Redux Toolkit/features/customer/CartSlice";
import { useSnackbar } from "../../../common/SnackbarProvider";
import { buildAuthRedirectUrl } from "../../../utils/navigation";

export interface ProductCardProps {
  item: any;
  compact?: boolean;
  className?: string;
  badge?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  item,
  compact = false,
  className = "",
  badge,
}) => {
  const [currentImage, setCurrentImage] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { showSnackbar } = useSnackbar();

  const productId = item._id || item.id || item.productId || "";

  const categorySlug =
    (typeof item.category === "object" && item.category !== null
      ? item.category.categoryId || item.category.name || "all"
      : item.category1 || item.category || "all")
      .toString()
      .trim()
      .replace(/[\/\s]+/g, "-");

  const titleSlug =
    (item.title || "product")
      .toString()
      .trim()
      .slice(0, 60)
      .replace(/[\/\s]+/g, "-")
      .replace(/[^\w-]/g, "") || "product";

  const productUrl = `/product-details/${encodeURIComponent(categorySlug)}/${encodeURIComponent(
    titleSlug
  )}/${productId}`;

  const sellingPrice = Number(item.sellingPrice || item.mrpPrice || 0);
  const mrpPrice = Number(item.mrpPrice || sellingPrice);

  const discountPercent =
    item.discountPercent ||
    (mrpPrice > sellingPrice
      ? Math.round(((mrpPrice - sellingPrice) / mrpPrice) * 100)
      : 0);

  const savings = Math.max(0, mrpPrice - sellingPrice);

  const hasVariants = Boolean(
    item.hasVariants || (Array.isArray(item.variants) && item.variants.length > 0)
  );

  // Dynamic Pricing Range / From Price for Variant Products
  const variantPrices = useMemo(() => {
    if (!hasVariants || !Array.isArray(item.variants) || item.variants.length === 0) {
      return null;
    }
    const validVariants = item.variants.filter((v: any) => v.status !== "INACTIVE");
    const prices = validVariants
      .map((v: any) => Number(v.sellingPrice || 0))
      .filter((p: number) => p > 0);
    if (!prices.length) return null;
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return { min, max, isRange: min !== max };
  }, [hasVariants, item.variants]);

  // Extract available variant colors
  const availableColors = useMemo(() => {
    if (!hasVariants || !Array.isArray(item.variants)) return [];
    const colors = new Set<string>();
    item.variants.forEach((v: any) => {
      if (Array.isArray(v.attributes)) {
        v.attributes.forEach((attr: any) => {
          if (attr.key?.toLowerCase() === "color" && attr.value) {
            colors.add(String(attr.value).trim());
          }
        });
      }
    });
    return Array.from(colors);
  }, [hasVariants, item.variants]);

  const getColorStyle = (colorName: string): string => {
    const c = (colorName || "").toLowerCase().trim();
    const palette: Record<string, string> = {
      black: "#111827",
      white: "#f9fafb",
      blue: "#2563eb",
      navy: "#1e3a8a",
      red: "#dc2626",
      green: "#16a34a",
      emerald: "#059669",
      purple: "#7c3aed",
      violet: "#8b5cf6",
      yellow: "#eab308",
      orange: "#f97316",
      pink: "#ec4899",
      grey: "#6b7280",
      gray: "#6b7280",
      brown: "#78350f",
      gold: "#d97706",
      silver: "#94a3b8",
      cyan: "#06b6d4",
      teal: "#0d9488",
    };
    return palette[c] || c;
  };

  const isOutOfStock = item.countInStock === 0 || item.inStock === false;
  const isLowStock = !isOutOfStock && item.countInStock > 0 && item.countInStock <= 5;

  // Normalized rating
  const ratingAvg =
    typeof item.ratings?.average === "number"
      ? item.ratings.average
      : typeof item.ratingAverage === "number"
      ? item.ratingAverage
      : 4.8;

  const ratingCount =
    typeof item.ratings?.count === "number"
      ? item.ratings.count
      : typeof item.ratingCount === "number"
      ? item.ratingCount
      : 48;

  // Images list
  const rawImages = Array.isArray(item.images) ? item.images : [];
  const imageUrls = rawImages
    .map((img: any) => (typeof img === "object" && img !== null ? img.url : img))
    .filter(Boolean);

  const displayImage =
    imageUrls[currentImage] || imageUrls[0] || item.image || "";
  const hasMultipleImages = imageUrls.length > 1;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isOutOfStock) return;

    if (hasVariants) {
      navigate(productUrl);
      return;
    }

    const jwt = typeof window !== "undefined" ? localStorage.getItem("jwt") : null;
    if (!jwt) {
      showSnackbar("Please sign in to add items to your cart", "warning");
      navigate(buildAuthRedirectUrl(window.location.pathname, window.location.search));
      return;
    }

    setIsAdding(true);
    try {
      await dispatch(
        addItemToCart({
          jwt,
          productId,
          quantity: 1,
        })
      ).unwrap();

      // Refresh cart to update navbar counter immediately
      dispatch(fetchUserCart(jwt));

      setJustAdded(true);
      showSnackbar(
        `Added "${(item.title || "Product").slice(0, 26)}${(item.title || "").length > 26 ? "..." : ""}" to cart!`,
        "success"
      );
      setTimeout(() => setJustAdded(false), 2400);
    } catch (err: any) {
      const errorMsg =
        typeof err === "string"
          ? err
          : err?.message || "Could not add item to cart. Please try again.";
      showSnackbar(errorMsg, "error");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div
      onClick={() => navigate(productUrl)}
      onMouseEnter={() => {
        if (hasMultipleImages) setCurrentImage(1);
      }}
      onMouseLeave={() => {
        setCurrentImage(0);
      }}
      className={`group relative bg-card text-card-foreground rounded-2xl border border-border/80 hover:border-primary/50 p-2 sm:p-2.5 shadow-2xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between ${className}`}
    >
      {/* Media Box: 4/5 Aspect Ratio with smooth hover effects */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          navigate(productUrl);
        }}
        className="relative w-full aspect-[4/5] overflow-hidden rounded-xl bg-muted/30 border border-border/40 flex items-center justify-center cursor-pointer"
      >
        {displayImage ? (
          <img
            className="w-full h-full object-cover object-center group-hover:scale-106 transition-transform duration-500 ease-out cursor-pointer"
            src={displayImage}
            alt={item.title || "Product"}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted text-xs font-medium cursor-pointer">
            No image
          </div>
        )}

        {/* Badges Stack (Top Left) */}
        <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 items-start max-w-[65%] pointer-events-none">
          {discountPercent > 0 && (
            <span className="bg-destructive text-destructive-foreground text-[9px] sm:text-[10px] font-black px-1.5 sm:px-2 py-0.5 rounded-md shadow-xs tracking-tight uppercase">
              {discountPercent}% OFF
            </span>
          )}
          {badge && (
            <span className="bg-amber-500 text-white text-[9px] sm:text-[10px] font-black px-1.5 sm:px-2 py-0.5 rounded-md shadow-xs tracking-tight uppercase truncate">
              {badge}
            </span>
          )}
        </div>

        {/* Wishlist Save Button (Top Right) */}
        <div className="absolute top-2 right-2 z-10">
          <SaveButton product={item} size="small" />
        </div>

        {/* Multiple Image Preview Dots on Hover */}
        {hasMultipleImages && (
          <div className="absolute bottom-1.5 inset-x-0 flex justify-center gap-1 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {imageUrls.slice(0, 4).map((_: string, idx: number) => (
              <span
                key={idx}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                  idx === currentImage ? "bg-primary w-3" : "bg-background/80"
                }`}
              />
            ))}
          </div>
        )}

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] z-10 flex items-center justify-center p-2">
            <span className="bg-destructive/90 text-destructive-foreground text-[10px] sm:text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-md shadow-md">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Product Information Body */}
      <div className="pt-2 sm:pt-2.5 px-0.5 flex-1 flex flex-col justify-between space-y-1.5">
        <div>
          {/* Brand & Rating Row */}
          <div className="flex items-center justify-between gap-1 text-[11px] mb-1">
            <span className="font-bold text-primary tracking-wider uppercase text-[10px] sm:text-[11px] truncate max-w-[65%]">
              {item.brand || item?.seller?.businessDetails?.businessName || "Zosh"}
            </span>

            <div className="flex items-center gap-0.5 bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-1.5 py-0.2 rounded-md font-bold text-[10px] shrink-0">
              <Star sx={{ fontSize: 10, color: "inherit" }} />
              <span>{ratingAvg.toFixed(1)}</span>
              <span className="text-muted-foreground font-normal ml-0.5 text-[9px]">
                ({ratingCount})
              </span>
            </div>
          </div>

          {/* Product Title (2-Line Clamp for baseline alignment) */}
          <h3
            onClick={(e) => {
              e.stopPropagation();
              navigate(productUrl);
            }}
            title={item.title}
            className={`text-foreground font-semibold line-clamp-2 cursor-pointer group-hover:text-primary transition-colors leading-snug ${
              compact
                ? "text-[11px] sm:text-xs min-h-[1.9rem] sm:min-h-[2.1rem]"
                : "text-xs sm:text-[13px] min-h-[2.25rem] sm:min-h-[2.5rem]"
            }`}
          >
            {item.title}
          </h3>
        </div>

        {/* Pricing & Stock Details */}
        <div className="space-y-1.5 pt-0.5">
          {/* Variant Color Swatches preview */}
          {availableColors.length > 0 && (
            <div className="flex items-center gap-1.5 pt-0.5">
              <div className="flex items-center -space-x-1">
                {availableColors.slice(0, 4).map((c: string) => (
                  <span
                    key={c}
                    title={c}
                    className="w-3 h-3 rounded-full border border-card shadow-2xs inline-block"
                    style={{ backgroundColor: getColorStyle(c) }}
                  />
                ))}
              </div>
              <span className="text-[10px] font-semibold text-muted-foreground">
                {availableColors.length} {availableColors.length === 1 ? "color" : "colors"}
              </span>
            </div>
          )}

          {/* Price Row */}
          <div className="flex items-baseline gap-1.5 flex-wrap">
            {variantPrices?.isRange ? (
              <div className="flex items-baseline gap-1">
                <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-tight">
                  From
                </span>
                <span className="font-black text-sm sm:text-base md:text-lg text-foreground tracking-tight">
                  ₹{variantPrices.min.toLocaleString("en-IN")}
                </span>
              </div>
            ) : (
              <span className="font-black text-sm sm:text-base md:text-lg text-foreground tracking-tight">
                ₹{sellingPrice.toLocaleString("en-IN")}
              </span>
            )}

            {mrpPrice > sellingPrice && (
              <span className="text-[10px] sm:text-xs line-through text-muted-foreground font-medium">
                ₹{mrpPrice.toLocaleString("en-IN")}
              </span>
            )}

            {savings > 0 && (
              <span className="text-[10px] sm:text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                Save ₹{savings.toLocaleString("en-IN")}
              </span>
            )}
          </div>

          {/* Trust & Stock Micro-Badges */}
          <div className="flex items-center justify-between text-[10px] sm:text-[11px] pt-1 text-muted-foreground border-t border-border/40">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
              Free Delivery
            </span>

            {isOutOfStock ? (
              <span className="text-destructive font-bold text-[9px] sm:text-[10px] bg-destructive/10 px-1.5 py-0.2 rounded">
                Sold Out
              </span>
            ) : isLowStock ? (
              <span className="text-amber-600 dark:text-amber-400 font-bold text-[9px] sm:text-[10px] bg-amber-500/10 px-1.5 py-0.2 rounded">
                Only {item.countInStock} left
              </span>
            ) : hasVariants ? (
              <span className="text-muted-foreground font-medium text-[9px] sm:text-[10px]">
                {item.variants?.length || 2}+ Options
              </span>
            ) : null}
          </div>
        </div>

        {/* Action Footer: 1-Click ADD TO CART BUTTON */}
        <div className="pt-2 mt-auto">
          {isOutOfStock ? (
            <button
              type="button"
              disabled
              className="w-full py-1.5 sm:py-2 px-2.5 rounded-xl bg-muted text-muted-foreground text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 cursor-not-allowed border border-border/50 opacity-75"
            >
              <BlockOutlined sx={{ fontSize: 13 }} />
              <span>Out of Stock</span>
            </button>
          ) : hasVariants ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate(productUrl);
              }}
              className="w-full py-1.5 sm:py-2 px-2.5 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground border border-primary/25 hover:border-primary text-[11px] sm:text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1 cursor-pointer shadow-2xs group/opt"
            >
              <span>Choose Options</span>
              <ArrowForwardIos
                sx={{ fontSize: 10 }}
                className="group-hover/opt:translate-x-0.5 transition-transform"
              />
            </button>
          ) : (
            <button
              type="button"
              disabled={isAdding}
              onClick={handleAddToCart}
              className={`w-full py-1.5 sm:py-2 px-2.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 shadow-xs cursor-pointer ${
                justAdded
                  ? "bg-emerald-600 text-white border border-emerald-600 shadow-emerald-500/20"
                  : "bg-primary hover:bg-primary/90 active:scale-[0.98] text-primary-foreground border border-primary shadow-primary/20"
              }`}
            >
              {isAdding ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  <span>Adding...</span>
                </>
              ) : justAdded ? (
                <>
                  <CheckCircle sx={{ fontSize: 14 }} />
                  <span>Added!</span>
                </>
              ) : (
                <>
                  <AddShoppingCart sx={{ fontSize: 14 }} />
                  <span>Add to Cart</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
