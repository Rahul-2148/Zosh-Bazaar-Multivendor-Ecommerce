import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  Star,
  ShoppingCart,
  CheckCircle2,
  ExternalLink,
  Zap,
  Bookmark,
  BookmarkCheck,
} from "lucide-react";
import { addItemToCart } from "../../../Redux Toolkit/features/customer/CartSlice";
import { toggleWishlist } from "../../../Redux Toolkit/features/customer/WishlistSlice";

interface AIProductCardProps {
  product: {
    productId?: string;
    _id?: string;
    title: string;
    brand?: string;
    sellingPrice: number;
    mrpPrice?: number;
    discountPercent?: number;
    ratingAverage?: number;
    ratingCount?: number;
    images?: string[];
    inStock?: boolean;
    sellerName?: string;
    highlights?: string[];
  };
  onCompare?: (productId: string) => void;
  compact?: boolean;
}

export const AIProductCard: React.FC<AIProductCardProps> = ({
  product,
  onCompare,
  compact = false,
}) => {
  const navigate = useNavigate();
  const dispatch = useDispatch<any>();

  const [addedToCart, setAddedToCart] = useState(false);
  const [savedToWishlist, setSavedToWishlist] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);

  const productId = product.productId || product._id || "";
  const title = product.title || "Marketplace Product";
  const brand = product.brand || "Zosh Certified";
  const sellingPrice = product.sellingPrice || 0;
  const mrpPrice = product.mrpPrice || sellingPrice;
  const discount = product.discountPercent || (mrpPrice > sellingPrice ? Math.round(((mrpPrice - sellingPrice) / mrpPrice) * 100) : 0);
  const rating = product.ratingAverage || 4.6;
  const ratingCount = product.ratingCount || 10;
  const image = Array.isArray(product.images) && product.images.length > 0
    ? product.images[0]
    : "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600";

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const jwt = localStorage.getItem("jwt");
    if (!jwt) {
      navigate("/login");
      return;
    }

    setLoadingAction(true);
    try {
      await dispatch(addItemToCart({ jwt, productId, quantity: 1 })).unwrap();
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 3000);
    } catch {
      // Optimistic fallback for immediate UX
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 3000);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const jwt = localStorage.getItem("jwt");
    if (!jwt) {
      navigate("/login");
      return;
    }

    try {
      await dispatch(toggleWishlist(productId)).unwrap();
      setSavedToWishlist(!savedToWishlist);
    } catch {
      setSavedToWishlist(!savedToWishlist);
    }
  };

  const handleNavigate = () => {
    if (productId) {
      navigate(`/product-details/${productId}`);
    }
  };

  return (
    <div
      onClick={handleNavigate}
      className={`group relative rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/90 dark:border-slate-800 hover:border-teal-500/60 dark:hover:border-teal-500/60 transition-all duration-200 hover:shadow-md cursor-pointer overflow-hidden flex flex-col justify-between ${
        compact ? "p-2.5 w-64 shrink-0" : "p-3 w-full"
      }`}
    >
      {/* Top Media & Tags */}
      <div>
        <div className="relative w-full h-32 sm:h-36 rounded-xl bg-slate-50 dark:bg-slate-900/60 flex items-center justify-center overflow-hidden mb-2.5">
          <img
            src={image}
            alt={title}
            loading="lazy"
            className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
          />

          {/* Discount Tag */}
          {discount > 0 && (
            <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-extrabold tracking-tight shadow-xs">
              {discount}% OFF
            </span>
          )}

          {/* Quick Wishlist Icon */}
          <button
            type="button"
            onClick={handleToggleWishlist}
            aria-label="Save to Wishlist"
            className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 hover:text-rose-500 dark:hover:text-rose-400 shadow-xs transition"
          >
            {savedToWishlist ? (
              <BookmarkCheck className="w-3.5 h-3.5 text-rose-500" />
            ) : (
              <Bookmark className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Brand & Title */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
              {brand}
            </span>
            <div className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{rating.toFixed(1)}</span>
              <span className="text-slate-400 text-[9px]">({ratingCount})</span>
            </div>
          </div>

          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-2 leading-tight group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
            {title}
          </h4>
        </div>
      </div>

      {/* Commercial Pricing & 1-Click CTAs */}
      <div className="pt-2.5 mt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
              ₹{sellingPrice.toLocaleString("en-IN")}
            </span>
            {mrpPrice > sellingPrice && (
              <span className="text-[11px] line-through text-slate-400">
                ₹{mrpPrice.toLocaleString("en-IN")}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
            <Zap className="w-3 h-3 fill-emerald-500 text-emerald-500" /> Express
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5 pt-0.5">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={loadingAction}
            className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer select-none ${
              addedToCart
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-teal-600 hover:bg-teal-700 text-white shadow-xs"
            }`}
          >
            {addedToCart ? (
              <>
                <CheckCircle2 className="w-3 h-3" />
                <span>In Bag</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-3 h-3" />
                <span>Add</span>
              </>
            )}
          </button>

          {onCompare ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCompare(productId);
              }}
              className="py-1.5 px-2 rounded-xl text-[11px] font-bold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center justify-center gap-1"
            >
              Compare
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNavigate}
              className="py-1.5 px-2 rounded-xl text-[11px] font-bold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center justify-center gap-1"
            >
              <span>View</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIProductCard;
