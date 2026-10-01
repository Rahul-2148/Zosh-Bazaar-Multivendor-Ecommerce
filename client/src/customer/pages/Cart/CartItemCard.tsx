import React, { useState } from "react";
import { IconButton } from "@mui/material";
import {
  Add,
  Remove,
  LocalShippingOutlined,
  ShieldOutlined,
  KeyboardArrowDown,
  KeyboardArrowUp,
  Star,
  Tag,
  StorefrontOutlined,
  WarningAmberOutlined,
  DeleteOutline,
  BookmarkBorder,
  AutoAwesome,
  FlashOnOutlined,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import type { ICartItem } from "../../../types/cartTypes";
import SaveButton from "../Wishlist/components/SaveButton";
import SimilarItemsModal from "./SimilarItemsModal";

export interface CartItemCardProps {
  item: ICartItem;
  onQuantityChange: (cartItemId: string, newQuantity: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onMoveToWishlist: (cartItemId: string, productId: string, variantId?: string) => void;
}

export const CartItemCard: React.FC<CartItemCardProps> = ({
  item,
  onQuantityChange,
  onRemoveItem,
  onMoveToWishlist,
}) => {
  const navigate = useNavigate();
  const [showOffers, setShowOffers] = useState(false);
  const [similarModalOpen, setSimilarModalOpen] = useState(false);

  const prod = item.product || ({} as any);

  // Delivery estimation: 3 business days
  const deliveryDateStr = React.useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  }, []);

  // Variant resolution
  const variantTitle =
    item.selectedVariant?.title ||
    (Array.isArray(item.selectedVariant?.attributes)
      ? item.selectedVariant.attributes.map((a: any) => a.value).join(" / ")
      : null) ||
    item.size ||
    item.ram ||
    null;

  // Authoritative Unit and Line Pricing
  const unitSellingPrice =
    item.unitSellingPrice ||
    Math.round((item.sellingPrice || prod.sellingPrice || 0) / Math.max(1, item.quantity));
  const unitMrpPrice =
    item.unitMrpPrice ||
    Math.round((item.mrpPrice || prod.mrpPrice || unitSellingPrice) / Math.max(1, item.quantity));
  const lineSellingPrice = item.sellingPrice || unitSellingPrice * item.quantity;
  const lineMrpPrice = item.mrpPrice || unitMrpPrice * item.quantity;

  const discountPercent =
    unitMrpPrice > unitSellingPrice
      ? Math.round(((unitMrpPrice - unitSellingPrice) / unitMrpPrice) * 100)
      : 0;

  const ratingVal = prod.ratings?.average || 4.4;
  const ratingCount = prod.ratings?.count || 428;

  // Stock Intelligence
  const isOutOfStock =
    item.stockStatus === "OUT_OF_STOCK" ||
    (prod.countInStock !== undefined && prod.countInStock <= 0);
  const maxStock = item.availableStock ?? prod.countInStock ?? 99;

  const sellerName =
    prod.seller?.businessDetails?.businessName ||
    prod.seller?.sellerName ||
    "Zosh Certified Vendor";

  const handlePdpNavigate = () => {
    const cat = prod.category?.categoryId || "all";
    const titleSlug = encodeURIComponent(prod.title || "product");
    const id = prod._id || (prod as any).productId;
    navigate(`/product-details/${cat}/${titleSlug}/${id}`);
  };

  const handleBuyNowSingle = () => {
    navigate("/checkout");
  };

  return (
    <div
      className={`bg-card text-card-foreground border rounded-2xl p-4 sm:p-5 shadow-xs transition-all flex flex-col gap-4 ${
        isOutOfStock
          ? "border-destructive/30 bg-destructive/5"
          : "border-border hover:border-slate-300 dark:hover:border-slate-700"
      }`}
    >
      {/* Top: Image + Stepper (Left) and Details (Right) */}
      <div className="flex gap-3 sm:gap-5 items-start">
        {/* Left Column: Image + Stepper right beneath */}
        <div className="flex flex-col items-center shrink-0 w-24 sm:w-28">
          <div
            onClick={handlePdpNavigate}
            className="w-24 h-28 sm:w-28 sm:h-32 rounded-xl border border-border bg-muted/20 p-2 flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-90 transition-opacity relative group/thumb"
          >
            <img
              className={`w-full h-full object-contain ${isOutOfStock ? "grayscale opacity-60" : ""}`}
              src={item.selectedVariant?.image || prod.images?.[0] || ""}
              alt={prod.title || "Product"}
              loading="lazy"
            />

            {/* Wishlist Save Button (Top Right) */}
            <div
              className="absolute top-1 right-1 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <SaveButton product={prod} size="small" />
            </div>

            {/* Discount Badge (Top Left) */}
            {discountPercent > 0 && (
              <span className="absolute top-1 left-1 bg-destructive text-destructive-foreground text-[8px] sm:text-[9px] font-black px-1 py-0.5 rounded shadow-xs tracking-tight uppercase">
                {discountPercent}% OFF
              </span>
            )}

            {isOutOfStock && (
              <span className="absolute inset-x-1 bottom-1 bg-destructive text-destructive-foreground text-[9px] font-black uppercase text-center py-0.5 rounded shadow-xs">
                Out of Stock
              </span>
            )}
          </div>

          {/* Stepper directly beneath image */}
          <div className="flex items-center justify-between w-full border border-border rounded-lg bg-card mt-2.5 px-1 py-0.5 shadow-2xs">
            <IconButton
              size="small"
              onClick={() => onQuantityChange(item._id, item.quantity - 1)}
              disabled={item.quantity <= 1}
              sx={{ p: 0.5, color: "text.primary" }}
              aria-label="Decrease quantity"
            >
              <Remove sx={{ fontSize: 13 }} />
            </IconButton>
            <span className="text-xs font-black text-foreground min-w-[24px] text-center select-none">
              {item.quantity}
            </span>
            <IconButton
              size="small"
              onClick={() => onQuantityChange(item._id, item.quantity + 1)}
              disabled={isOutOfStock || item.quantity >= maxStock}
              sx={{ p: 0.5, color: "text.primary" }}
              aria-label="Increase quantity"
            >
              <Add sx={{ fontSize: 13 }} />
            </IconButton>
          </div>
        </div>

        {/* Right Column: Title, Variant, Ratings, Seller, Price & Delivery */}
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          {/* Brand & Title */}
          <div>
            <span className="text-[10px] sm:text-[11px] font-extrabold text-primary uppercase tracking-wider block truncate">
              {prod.brand || "Zosh Certified"}
            </span>
            <h3
              onClick={handlePdpNavigate}
              className="text-sm sm:text-base font-bold text-foreground hover:text-primary cursor-pointer transition-colors line-clamp-2 leading-snug mt-0.5"
            >
              {prod.title}
            </h3>
          </div>

          {/* Variant specs (e.g., 8 GB RAM, Blue, Size L) */}
          {variantTitle && (
            <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded bg-muted text-foreground border border-border text-[11px]">
                {variantTitle}
              </span>
              {item.selectedVariant?.sku && (
                <span className="text-[10px] font-mono text-muted-foreground">
                  SKU: {item.selectedVariant.sku}
                </span>
              )}
            </div>
          )}

          {/* Rating Pill + Zosh Assured Badge + Seller */}
          <div className="flex items-center gap-2 flex-wrap pt-0.5">
            <div className="inline-flex items-center gap-0.5 bg-emerald-600 text-white text-[11px] font-bold px-1.5 py-0.5 rounded shadow-2xs">
              <span>{ratingVal.toFixed(1)}</span>
              <Star sx={{ fontSize: 11 }} />
            </div>
            <span className="text-[11px] text-muted-foreground font-medium">
              {ratingCount > 1000 ? `${(ratingCount / 1000).toFixed(1)}K+` : ratingCount}
            </span>

            {/* Zosh Assured Verification Badge */}
            <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60">
              <ShieldOutlined sx={{ fontSize: 12 }} className="text-blue-600 dark:text-blue-400" />
              <span className="text-[10px] font-black italic tracking-tight text-blue-700 dark:text-blue-300">
                Assured
              </span>
            </div>

            {/* Seller attribution */}
            <span className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
              <StorefrontOutlined sx={{ fontSize: 13 }} />
              <span>{sellerName}</span>
            </span>

            {/* Live Stock Alert */}
            {item.stockWarning && !isOutOfStock && (
              <span className="text-[10px] font-bold text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                <WarningAmberOutlined sx={{ fontSize: 11 }} />
                {item.stockWarning}
              </span>
            )}
          </div>

          {/* Price Block: Line Price, Unit Breakdown, Discount Arrow, MRP */}
          <div className="flex flex-wrap items-baseline gap-2 pt-1">
            <span className="text-base sm:text-lg font-black text-foreground">
              ₹{lineSellingPrice.toLocaleString("en-IN")}
            </span>

            {item.quantity > 1 && (
              <span className="text-[11px] font-medium text-muted-foreground">
                (₹{unitSellingPrice.toLocaleString("en-IN")} each)
              </span>
            )}

            {discountPercent > 0 && (
              <>
                <span className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
                  ↓ {discountPercent}%
                </span>
                <span className="text-xs line-through text-muted-foreground font-medium">
                  ₹{lineMrpPrice.toLocaleString("en-IN")}
                </span>
              </>
            )}
          </div>

          {/* Value note: Protect Promise Fee waived */}
          <div className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
            <span>+₹0 Free Protect Promise</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">• 100% Verified</span>
          </div>

          {/* Explore Offers Accordion Button */}
          <div className="pt-0.5">
            <button
              type="button"
              onClick={() => setShowOffers((prev) => !prev)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-[11px] font-bold hover:opacity-90 transition cursor-pointer"
            >
              <span>{showOffers ? "Hide offers" : "Explore offers"}</span>
              {showOffers ? (
                <KeyboardArrowUp sx={{ fontSize: 15 }} />
              ) : (
                <KeyboardArrowDown sx={{ fontSize: 15 }} />
              )}
            </button>
          </div>

          {/* Expandable Offers Content */}
          {showOffers && (
            <div className="mt-2 p-2.5 rounded-xl bg-muted/40 border border-border text-[11px] flex flex-col gap-1.5 animate-fadeIn">
              <div className="flex items-start gap-1.5 text-foreground font-medium">
                <Tag sx={{ fontSize: 14 }} className="text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Bank Offer:</strong> 5% Unlimited Cashback on Zosh Axis Bank Card.</span>
              </div>
              <div className="flex items-start gap-1.5 text-foreground font-medium">
                <Tag sx={{ fontSize: 14 }} className="text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Special Price:</strong> Extra marketplace savings already reflected in cart.</span>
              </div>
              <div className="flex items-start gap-1.5 text-foreground font-medium">
                <Tag sx={{ fontSize: 14 }} className="text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Partner Offer:</strong> Sign up for Zosh Pay Later & get free fast delivery.</span>
              </div>
            </div>
          )}

          {/* Delivery Row */}
          <div className="flex items-center gap-1.5 text-xs text-foreground font-semibold pt-1">
            <LocalShippingOutlined sx={{ fontSize: 16 }} className="text-muted-foreground" />
            <span>Delivery by <strong className="text-foreground">{deliveryDateStr}</strong></span>
            <span className="text-emerald-600 dark:text-emerald-400 font-extrabold ml-1">FREE</span>
          </div>
        </div>
      </div>

      {/* Trust Shield Value Add */}
      <div className="p-2.5 sm:p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
          <ShieldOutlined sx={{ fontSize: 18 }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-black text-blue-900 dark:text-blue-200 truncate">
            Protected with Zosh Trust Shield
          </div>
          <p className="text-[11px] text-blue-700 dark:text-blue-300 font-medium">
            ₹999 <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold">FREE</strong> • 30 Days Quality & Damage Coverage
          </p>
        </div>
      </div>

      {/* 4 Action Buttons Row: Remove | Save for Later | Similar Items | Buy Now */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-border">
        <button
          type="button"
          onClick={() => onRemoveItem(item._id)}
          className="py-2 px-2 text-xs font-bold text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl border border-border transition-colors cursor-pointer flex items-center justify-center gap-1.5"
        >
          <DeleteOutline sx={{ fontSize: 16 }} />
          <span>Remove</span>
        </button>
        <button
          type="button"
          onClick={() =>
            onMoveToWishlist(
              item._id,
              prod._id || (prod as any).productId,
              item.variantId || undefined
            )
          }
          className="py-2 px-2 text-xs font-bold text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl border border-border transition-colors cursor-pointer flex items-center justify-center gap-1.5"
        >
          <BookmarkBorder sx={{ fontSize: 16 }} />
          <span>Save for Later</span>
        </button>
        <button
          type="button"
          onClick={() => setSimilarModalOpen(true)}
          className="py-2 px-2 text-xs font-bold text-primary hover:bg-primary/10 rounded-xl border border-primary/30 transition-colors cursor-pointer flex items-center justify-center gap-1.5 bg-primary/5"
        >
          <AutoAwesome sx={{ fontSize: 15 }} className="text-primary" />
          <span>Similar Items</span>
        </button>
        <button
          type="button"
          onClick={handleBuyNowSingle}
          disabled={isOutOfStock}
          className={`py-2 px-2 text-xs font-black rounded-xl transition-colors flex items-center justify-center gap-1 shadow-xs ${
            isOutOfStock
              ? "bg-muted text-muted-foreground cursor-not-allowed border border-border"
              : "text-slate-900 bg-amber-400 hover:bg-amber-300 cursor-pointer"
          }`}
        >
          <FlashOnOutlined sx={{ fontSize: 16 }} />
          <span>{isOutOfStock ? "Out of Stock" : "Buy Now"}</span>
        </button>
      </div>

      {/* Similar Items Modal */}
      <SimilarItemsModal
        open={similarModalOpen}
        onClose={() => setSimilarModalOpen(false)}
        sourceItem={item}
      />
    </div>
  );
};

export default CartItemCard;
