import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Star, FlashOnOutlined } from "@mui/icons-material";
import SaveButton from "../Wishlist/components/SaveButton";

interface ProductCardProps {
  item: any;
}

const ProductCard: React.FC<ProductCardProps> = ({ item }) => {
  const [currentImage, setCurrentImage] = useState(0);
  const navigate = useNavigate();

  const categorySlug =
    typeof item.category === "object" && item.category !== null
      ? item.category.categoryId || item.category.name || "all"
      : item.category1 || item.category || "all";

  const productUrl = `/product-details/${encodeURIComponent(categorySlug)}/${encodeURIComponent(
    item.title || "product"
  )}/${item._id}`;

  const discountPercent =
    item.discountPercent ||
    (item.mrpPrice > item.sellingPrice
      ? Math.round(((item.mrpPrice - item.sellingPrice) / item.mrpPrice) * 100)
      : 0);

  const hasVariants = item.hasVariants || (item.variants && item.variants.length > 0);
  const isLowStock = item.countInStock > 0 && item.countInStock <= 5;
  const isOutOfStock = item.countInStock === 0;

  return (
    <div
      onClick={() => navigate(productUrl)}
      onMouseLeave={() => {
        setCurrentImage(0);
      }}
      className="group relative bg-card rounded-xl border border-border/80 hover:border-primary/50 p-2.5 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer flex flex-col justify-between"
    >
      {/* Media Box */}
      <div className="relative w-full aspect-[4/5] overflow-hidden rounded-xl bg-muted/60 border border-border/40">
        {item.images && item.images.length > 0 ? (
          <img
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
            src={
              (typeof item.images[currentImage] === "object"
                ? item.images[currentImage]?.url
                : item.images[currentImage]) ||
              (typeof item.images[0] === "object"
                ? item.images[0]?.url
                : item.images[0])
            }
            alt={item.title || "Product"}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted text-xs font-medium">
            No image
          </div>
        )}

        {/* Discount badge */}
        {discountPercent > 0 && (
          <div className="absolute top-2.5 left-2.5 z-10 bg-destructive text-destructive-foreground text-[10px] sm:text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-md tracking-tight">
            {discountPercent}% OFF
          </div>
        )}

        {/* Wishlist toggle */}
        <div className="absolute top-2.5 right-2.5 z-10">
          <SaveButton product={item} size="small" />
        </div>

        {/* Floating Quick Action Overlay on Hover */}
        <div className="absolute inset-x-2.5 bottom-2.5 z-10 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200 hidden sm:block">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(productUrl);
            }}
            className="w-full py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-bold shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <FlashOnOutlined sx={{ fontSize: 15, color: "inherit" }} />
            <span>{hasVariants ? "Choose Options" : "View Details"}</span>
          </button>
        </div>
      </div>

      {/* Product Information */}
      <div className="pt-2 sm:pt-3 px-1 space-y-1 sm:space-y-1.5">
        {/* Brand & Rating Row */}
        <div className="flex items-center justify-between gap-1 text-[11px]">
          <span className="font-bold text-primary tracking-wider uppercase truncate max-w-[65%]">
            {item.brand || item?.seller?.businessDetails?.businessName || "Zosh"}
          </span>

          <div className="flex items-center gap-0.5 bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded-md font-bold text-[10px] shrink-0">
            <Star sx={{ fontSize: 11, color: "inherit" }} />
            <span>{item.ratings?.average ? item.ratings.average.toFixed(1) : (item.ratings?.count ? "4.8" : "4.7")}</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-foreground text-xs sm:text-sm font-semibold truncate group-hover:text-primary transition-colors">
          {item.title}
        </h3>

        {/* Price Row */}
        <div className="flex items-baseline gap-2 flex-wrap pt-0.5">
          <span className="font-black text-base sm:text-lg text-foreground tracking-tight">
            ₹{item.sellingPrice?.toLocaleString("en-IN")}
          </span>

          {item.mrpPrice > item.sellingPrice && (
            <span className="text-xs line-through text-muted-foreground font-medium">
              ₹{item.mrpPrice?.toLocaleString("en-IN")}
            </span>
          )}

          {discountPercent > 0 && (
            <span className="text-[11px] font-bold text-success">
              Save ₹{(item.mrpPrice - item.sellingPrice)?.toLocaleString("en-IN")}
            </span>
          )}
        </div>

        {/* Stock & Delivery Micro-Badges */}
        <div className="flex items-center justify-between text-[11px] pt-2 text-muted-foreground border-t border-border/60">
          <span className="text-success font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
            Free Delivery
          </span>

          {isOutOfStock ? (
            <span className="text-destructive font-bold text-[10px] bg-destructive-soft px-1.5 py-0.5 rounded">Sold Out</span>
          ) : isLowStock ? (
            <span className="text-warning font-bold text-[10px] bg-warning-soft px-1.5 py-0.5 rounded">Only {item.countInStock} left</span>
          ) : hasVariants ? (
            <span className="text-muted-foreground font-medium text-[10px]">{item.variants.length} Options</span>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
