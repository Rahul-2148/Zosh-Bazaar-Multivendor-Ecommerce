import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Star,
  ArrowForward,
  Check,
  AutoAwesome,
  ChevronLeft,
  ChevronRight,
  HistoryOutlined,
  FavoriteBorder,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import { addItemToCart, fetchUserCart } from "../../../Redux Toolkit/features/customer/CartSlice";
import { getWishlist, moveItemToCart } from "../../../Redux Toolkit/features/customer/WishlistSlice";
import { getAllProducts } from "../../../Redux Toolkit/features/customer/ProductSlice";
import { getRecentlyViewedProducts } from "../../../utils/recentlyViewed";
import { fetchCartRecommendations, type RecommendationItem } from "../../../services/aiRecommendationService";
import type { IRecentlyViewedItem } from "../../../utils/recentlyViewed";
import SaveButton from "../Wishlist/components/SaveButton";

export interface CartCrossSellCarouselsProps {
  cartProductIds?: string[];
}

/**
 * Clean & punchy badge formatter to prevent awkward text wrapping/cut-offs
 */
const getBadgeText = (reason?: string) => {
  if (!reason) return "⚡ Add-on";
  const r = reason.toLowerCase();
  if (r.includes("complement") || r.includes("together") || r.includes("match")) {
    return "⚡ Pairs Well";
  }
  if (r.includes("popular") || r.includes("trending")) {
    return "🔥 Popular Pick";
  }
  if (r.includes("frequently") || r.includes("bought")) {
    return "✨ Best Match";
  }
  return reason.length > 18 ? "✨ Top Add-on" : reason;
};

/**
 * Standard card responsive sizing class:
 * - Mobile (<640px): 2 cards per view (w-[calc(50%-6px)])
 * - Small tablet (640-768px): 3 cards per view (sm:w-[calc(33.333%-8px)])
 * - Tablet/Desktop (768px+): 4 cards per view (md:w-[calc(25%-9px)])
 * - XL desktop (1280px+): 5 cards per view (xl:w-[calc(20%-9.6px)])
 * Exactly fits container width with zero awkward edge clipping.
 */
const CARD_RESPONSIVE_CLASSES =
  "w-[calc(50%-6px)] min-w-[calc(50%-6px)] max-w-[calc(50%-6px)] sm:w-[calc(33.333%-8px)] sm:min-w-[calc(33.333%-8px)] sm:max-w-[calc(33.333%-8px)] md:w-[calc(25%-9px)] md:min-w-[calc(25%-9px)] md:max-w-[calc(25%-9px)] lg:w-[calc(25%-9px)] lg:min-w-[calc(25%-9px)] lg:max-w-[calc(25%-9px)] xl:w-[calc(20%-9.6px)] xl:min-w-[calc(20%-9.6px)] xl:max-w-[calc(20%-9.6px)] shrink-0 snap-start bg-card border border-border rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between gap-2 shadow-2xs hover:shadow-md hover:border-primary/40 transition-all cursor-pointer select-none";

/**
 * Reusable Responsive Carousel Track with:
 * - Paged stepper calculation so cards never sit chopped in half
 * - Desktop Left/Right navigation arrow buttons
 * - Mobile Touch Momentum Snap (snap-x snap-mandatory)
 */
interface CarouselTrackProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  viewAllUrl?: string;
  viewAllText?: string;
  children: React.ReactNode;
  itemCount: number;
}

const CarouselTrack: React.FC<CarouselTrackProps> = ({
  title,
  subtitle,
  icon,
  viewAllUrl,
  viewAllText = "See all",
  children,
  itemCount,
}) => {
  const navigate = useNavigate();
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    if (!trackRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = trackRef.current;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 6);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = trackRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll, { passive: true });
      window.addEventListener("resize", checkScroll, { passive: true });
    }
    return () => {
      if (el) el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll, itemCount]);

  const handleScroll = (direction: "left" | "right") => {
    if (!trackRef.current) return;
    const firstCard = trackRef.current.firstElementChild as HTMLElement;
    if (!firstCard) return;

    const cardWidth = firstCard.getBoundingClientRect().width;
    const gap = 12; // gap-3 is 12px
    const visibleCards = Math.max(1, Math.round(trackRef.current.clientWidth / (cardWidth + gap)));
    const scrollAmount = (cardWidth + gap) * visibleCards;

    trackRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  if (itemCount === 0) return null;

  return (
    <div className="flex flex-col gap-3 relative group/rail w-full">
      {/* Header Row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {icon && (
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 shadow-2xs">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base md:text-lg font-black tracking-tight text-foreground truncate">
              {title}
            </h3>
            {subtitle && (
              <p className="text-[11px] sm:text-xs text-muted-foreground font-medium truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Action Controls: Steppers + View All */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Stepper Arrow Buttons */}
          <div className="flex items-center gap-1 bg-card dark:bg-muted/40 p-0.5 rounded-xl border border-border shadow-2xs">
            <button
              type="button"
              onClick={() => handleScroll("left")}
              disabled={!canScrollLeft}
              aria-label="Previous products"
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all ${
                canScrollLeft
                  ? "hover:bg-muted dark:hover:bg-card text-foreground cursor-pointer active:scale-95 shadow-2xs"
                  : "text-muted-foreground/30 cursor-not-allowed"
              }`}
            >
              <ChevronLeft sx={{ fontSize: 20 }} />
            </button>
            <button
              type="button"
              onClick={() => handleScroll("right")}
              disabled={!canScrollRight}
              aria-label="Next products"
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all ${
                canScrollRight
                  ? "hover:bg-muted dark:hover:bg-card text-foreground cursor-pointer active:scale-95 shadow-2xs"
                  : "text-muted-foreground/30 cursor-not-allowed"
              }`}
            >
              <ChevronRight sx={{ fontSize: 20 }} />
            </button>
          </div>

          {viewAllUrl && (
            <button
              type="button"
              onClick={() => navigate(viewAllUrl)}
              className="text-xs sm:text-sm font-bold text-primary hover:underline cursor-pointer inline-flex items-center gap-0.5 shrink-0"
            >
              <span>{viewAllText}</span>
              <ArrowForward sx={{ fontSize: 13 }} />
            </button>
          )}
        </div>
      </div>

      {/* Rail Container with Floating Stepper Arrows on Desktop */}
      <div className="relative w-full">
        {/* Floating Left Arrow (Desktop hover overlay) */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => handleScroll("left")}
            aria-label="Previous products"
            className="hidden lg:flex absolute -left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-card/95 border border-border shadow-xl text-foreground items-center justify-center hover:scale-110 hover:bg-primary hover:text-white active:scale-95 transition-all cursor-pointer backdrop-blur-md"
          >
            <ChevronLeft sx={{ fontSize: 22 }} />
          </button>
        )}

        {/* Floating Right Arrow (Desktop hover overlay) */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => handleScroll("right")}
            aria-label="Next products"
            className="hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-card/95 border border-border shadow-xl text-foreground items-center justify-center hover:scale-110 hover:bg-primary hover:text-white active:scale-95 transition-all cursor-pointer backdrop-blur-md"
          >
            <ChevronRight sx={{ fontSize: 22 }} />
          </button>
        )}

        {/* Horizontal Scroll Track */}
        <div
          ref={trackRef}
          className="flex gap-3 overflow-x-auto pb-3 pt-1 px-0.5 scroll-smooth snap-x snap-mandatory scrollbar-none no-scrollbar w-full"
          style={{
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export const CartCrossSellCarousels: React.FC<CartCrossSellCarouselsProps> = ({
  cartProductIds = [],
}) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const jwt = localStorage.getItem("jwt") || "";

  const { product, wishlist } = useAppSelector((store) => store);
  const [aiRecommendations, setAiRecommendations] = useState<RecommendationItem[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<IRecentlyViewedItem[]>(() => getRecentlyViewedProducts());
  const [activeWishlistTab, setActiveWishlistTab] = useState("all");
  const [addingId, setAddingId] = useState<string | null>(null);

  // Load contextual AI cart recommendations based on items currently in cart
  useEffect(() => {
    let isMounted = true;
    const loadRecommendations = async () => {
      if (cartProductIds.length > 0) {
        const res = await fetchCartRecommendations(cartProductIds, 8);
        if (isMounted && res && res.recommendations && res.recommendations.length > 0) {
          setAiRecommendations(res.recommendations);
        }
      }
    };
    loadRecommendations();
    return () => {
      isMounted = false;
    };
  }, [cartProductIds]);

  // Listen for recently viewed updates from localStorage
  useEffect(() => {
    const handleUpdate = () => setRecentlyViewed(getRecentlyViewedProducts());
    window.addEventListener("recentlyViewedUpdated", handleUpdate);
    return () => window.removeEventListener("recentlyViewedUpdated", handleUpdate);
  }, []);

  // Fetch wishlist & products if needed
  useEffect(() => {
    if (jwt && (!wishlist.items || wishlist.items.length === 0)) {
      dispatch(getWishlist());
    }
    if (!product.products || product.products.length === 0) {
      dispatch(getAllProducts({ pageNumber: 0 }));
    }
  }, [dispatch, jwt, wishlist.items, product.products]);

  // Handle 1-Click Add to Cart
  const handleAddToCart = async (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAddingId(productId);
    try {
      await dispatch(
        addItemToCart({
          jwt,
          productId,
          quantity: 1,
        })
      ).unwrap();
      dispatch(fetchUserCart(jwt));
    } catch {
      // ignore
    } finally {
      setTimeout(() => setAddingId(null), 1500);
    }
  };

  // Handle Move to Cart from Wishlist
  const handleMoveToCart = async (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAddingId(itemId);
    try {
      await dispatch(moveItemToCart({ itemId })).unwrap();
      dispatch(fetchUserCart(jwt));
      dispatch(getWishlist());
    } catch {
      // ignore
    } finally {
      setTimeout(() => setAddingId(null), 1500);
    }
  };

  // Filtered Wishlist
  const filteredWishlistItems = useMemo(() => {
    if (!wishlist.items) return [];
    if (activeWishlistTab === "all") return wishlist.items;
    if (activeWishlistTab === "saved_for_later") {
      return wishlist.items.filter((i: any) => i.isSavedForLater || i.collection?.name === "Buy Later");
    }
    return wishlist.items.filter((i: any) => {
      const cat = i.product?.category?.categoryId || i.product?.category?.name || "";
      return cat.toLowerCase().includes(activeWishlistTab.toLowerCase());
    });
  }, [wishlist.items, activeWishlistTab]);

  // Combined Basket-Building Recommendations:
  // Prefer AI recommendations, fall back to trending catalog products not already in cart
  const complementaryItems = useMemo(() => {
    if (aiRecommendations.length > 0) {
      return aiRecommendations.map((item) => ({
        id: item.productId,
        title: item.title,
        brand: item.brand,
        image: item.images?.[0] || "",
        sellingPrice: item.sellingPrice,
        mrpPrice: item.mrpPrice || item.sellingPrice,
        rating: item.ratingAverage || 4.3,
        reason: item.explanationReason || item.explanationText || "Frequently bought together",
      }));
    }

    if (product.products && product.products.length > 0) {
      return product.products
        .filter((p: any) => !cartProductIds.includes(p._id) && !cartProductIds.includes(p.productId))
        .slice(0, 8)
        .map((p: any) => ({
          id: p._id || p.productId,
          title: p.title,
          brand: p.brand || "Authentic",
          image: p.images?.[0] || "",
          sellingPrice: p.sellingPrice,
          mrpPrice: p.mrpPrice || p.sellingPrice,
          rating: p.ratings?.average || 4.2,
          reason: "Popular complement to your cart",
        }));
    }

    return [];
  }, [aiRecommendations, product.products, cartProductIds]);

  return (
    <div className="flex flex-col gap-7 w-full mt-4 min-w-0">
      {/* 1. Basket-Building / Complementary Items */}
      {complementaryItems.length > 0 && (
        <CarouselTrack
          title="Complete Your Setup & Basket Add-ons"
          subtitle="Authoritative accessories matched to your cart"
          icon={<AutoAwesome sx={{ fontSize: 16 }} />}
          viewAllUrl="/products"
          viewAllText="See all"
          itemCount={complementaryItems.length}
        >
          {complementaryItems.map((prod) => {
            const isAdded = addingId === prod.id;

            return (
              <div
                key={prod.id}
                onClick={() =>
                  navigate(`/product-details/all/${encodeURIComponent(prod.title)}/${prod.id}`)
                }
                className={CARD_RESPONSIVE_CLASSES}
              >
                <div className="space-y-2">
                  {/* Thumbnail */}
                  <div className="w-full h-28 xs:h-32 sm:h-36 rounded-xl bg-muted/20 border border-border/50 p-2 flex items-center justify-center overflow-hidden relative group/thumb">
                    <img
                      src={prod.image}
                      alt={prod.title}
                      className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />

                    {/* Wishlist Heart Button (Top Right) */}
                    <div
                      className="absolute top-1.5 right-1.5 z-10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <SaveButton
                        product={{
                          _id: prod.id,
                          id: prod.id,
                          title: prod.title,
                          images: [prod.image],
                          sellingPrice: prod.sellingPrice,
                          mrpPrice: prod.mrpPrice,
                        }}
                        size="small"
                      />
                    </div>

                    {/* Discount % badge (Top Left) */}
                    {prod.mrpPrice > prod.sellingPrice && (
                      <span className="absolute top-1.5 left-1.5 bg-destructive text-destructive-foreground text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs tracking-tight uppercase">
                        {Math.round(((prod.mrpPrice - prod.sellingPrice) / prod.mrpPrice) * 100)}% OFF
                      </span>
                    )}
                  </div>

                  {/* Rating & Recommendation Reason Pill */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <div className="inline-flex items-center gap-0.5 bg-emerald-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-2xs">
                      <span>{(prod.rating || 4.3).toFixed(1)}</span>
                      <Star sx={{ fontSize: 10 }} />
                    </div>
                    <div className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 text-[9px] sm:text-[10px] font-extrabold border border-teal-200/80 dark:border-teal-900/50 truncate max-w-full">
                      <span className="truncate">{getBadgeText(prod.reason)}</span>
                    </div>
                  </div>

                  {/* Title */}
                  <h4 className="text-xs font-bold text-foreground line-clamp-2 min-h-[32px] sm:min-h-[34px] leading-tight">
                    {prod.title}
                  </h4>
                </div>

                <div className="pt-1 border-t border-border/50">
                  {/* Price */}
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs sm:text-sm font-black text-foreground">
                      ₹{prod.sellingPrice?.toLocaleString("en-IN")}
                    </span>
                    {prod.mrpPrice > prod.sellingPrice && (
                      <span className="text-[10px] line-through text-muted-foreground">
                        ₹{prod.mrpPrice?.toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>

                  {/* Add to Cart CTA */}
                  <button
                    type="button"
                    onClick={(e) => handleAddToCart(prod.id, e)}
                    disabled={isAdded}
                    className={`mt-2 w-full py-1.5 px-2 rounded-xl text-xs font-black border transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95 truncate ${
                      isAdded
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                        : "border-primary/60 text-primary hover:bg-primary hover:text-white"
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check sx={{ fontSize: 13 }} /> Added
                      </>
                    ) : (
                      "+ Add to cart"
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </CarouselTrack>
      )}

      {/* 2. Recently Viewed */}
      {recentlyViewed.length > 0 && (
        <CarouselTrack
          title="Recently Viewed"
          subtitle="Pick up right where you left off"
          icon={<HistoryOutlined sx={{ fontSize: 16 }} />}
          viewAllUrl="/account/recently-viewed"
          viewAllText="View history"
          itemCount={recentlyViewed.length}
        >
          {recentlyViewed.slice(0, 10).map((item) => {
            const isAdded = addingId === item.productId;
            const rating = item.rating || 4.1;

            return (
              <div
                key={item.productId}
                onClick={() =>
                  navigate(
                    `/product-details/${item.category || "all"}/${encodeURIComponent(
                      item.title || "product"
                    )}/${item.productId}`
                  )
                }
                className={CARD_RESPONSIVE_CLASSES}
              >
                <div className="space-y-2">
                  <div className="w-full h-28 xs:h-32 sm:h-36 rounded-xl bg-muted/20 border border-border/50 p-2 flex items-center justify-center overflow-hidden relative group/thumb">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />

                    {/* Wishlist Heart Button (Top Right) */}
                    <div
                      className="absolute top-1.5 right-1.5 z-10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <SaveButton
                        product={{
                          _id: item.productId,
                          id: item.productId,
                          title: item.title,
                          images: [item.image],
                          sellingPrice: item.sellingPrice,
                          mrpPrice: item.mrpPrice,
                        }}
                        size="small"
                      />
                    </div>

                    {/* Discount % badge (Top Left) */}
                    {item.mrpPrice > item.sellingPrice && (
                      <span className="absolute top-1.5 left-1.5 bg-destructive text-destructive-foreground text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs tracking-tight uppercase">
                        {Math.round(((item.mrpPrice - item.sellingPrice) / item.mrpPrice) * 100)}% OFF
                      </span>
                    )}
                  </div>

                  <div className="inline-flex items-center gap-0.5 bg-emerald-600 text-white text-[9px] sm:text-[10px] font-extrabold px-1.5 py-0.5 rounded-md">
                    <span>{rating.toFixed(1)}</span>
                    <Star sx={{ fontSize: 10 }} />
                  </div>

                  <h4 className="text-xs font-bold text-foreground line-clamp-2 min-h-[32px] sm:min-h-[34px] leading-tight">
                    {item.title}
                  </h4>
                </div>

                <div className="pt-1 border-t border-border/50">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs sm:text-sm font-black text-foreground">
                      ₹{item.sellingPrice?.toLocaleString("en-IN")}
                    </span>
                    {item.mrpPrice > item.sellingPrice && (
                      <span className="text-[10px] line-through text-muted-foreground">
                        ₹{item.mrpPrice?.toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleAddToCart(item.productId, e)}
                    disabled={isAdded}
                    className={`mt-2 w-full py-1.5 px-2 rounded-xl text-xs font-black border transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95 truncate ${
                      isAdded
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                        : "border-primary/60 text-primary hover:bg-primary hover:text-white"
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check sx={{ fontSize: 13 }} /> Added
                      </>
                    ) : (
                      "+ Add to cart"
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </CarouselTrack>
      )}

      {/* 3. Your Wishlist */}
      {wishlist.items && wishlist.items.length > 0 && (
        <div className="flex flex-col gap-3">
          {/* Wishlist Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
            {[
              { id: "all", label: "All Items" },
              { id: "saved_for_later", label: "Saved For Later" },
              { id: "electronics", label: "Electronics" },
              { id: "fashion", label: "Fashion" },
              { id: "home", label: "Home & Kitchen" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveWishlistTab(tab.id)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 border select-none ${
                  activeWishlistTab === tab.id
                    ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                    : "bg-card text-muted-foreground border-border hover:text-foreground hover:bg-muted/40"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Carousel Track */}
          {filteredWishlistItems.length > 0 ? (
            <CarouselTrack
              title="Your Wishlist"
              subtitle="Items you loved and saved for your wardrobe"
              icon={<FavoriteBorder sx={{ fontSize: 16 }} />}
              viewAllUrl="/account/wishlist"
              viewAllText="View all"
              itemCount={filteredWishlistItems.length}
            >
              {filteredWishlistItems.slice(0, 10).map((wItem: any) => {
                const prod = wItem.product || {};
                const id = wItem._id;
                const isAdded = addingId === id;
                const rating = prod.ratings?.average || 4.3;

                return (
                  <div
                    key={id}
                    onClick={() =>
                      navigate(
                        `/product-details/${prod.category?.categoryId || "all"}/${encodeURIComponent(
                          prod.title || "product"
                        )}/${prod._id || prod.productId}`
                      )
                    }
                    className={CARD_RESPONSIVE_CLASSES}
                  >
                    <div className="space-y-2">
                      <div className="w-full h-28 xs:h-32 sm:h-36 rounded-xl bg-muted/20 border border-border/50 p-2 flex items-center justify-center overflow-hidden">
                        <img
                          src={prod.images?.[0] || ""}
                          alt={prod.title}
                          className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </div>

                      <div className="inline-flex items-center gap-0.5 bg-emerald-600 text-white text-[9px] sm:text-[10px] font-extrabold px-1.5 py-0.5 rounded-md">
                        <span>{rating.toFixed(1)}</span>
                        <Star sx={{ fontSize: 10 }} />
                      </div>

                      <h4 className="text-xs font-bold text-foreground line-clamp-2 min-h-[32px] sm:min-h-[34px] leading-tight">
                        {prod.title}
                      </h4>
                    </div>

                    <div className="pt-1 border-t border-border/50">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xs sm:text-sm font-black text-foreground">
                          ₹{prod.sellingPrice?.toLocaleString("en-IN")}
                        </span>
                        {prod.mrpPrice > prod.sellingPrice && (
                          <span className="text-[10px] line-through text-muted-foreground">
                            ₹{prod.mrpPrice?.toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleMoveToCart(id, e)}
                        disabled={isAdded}
                        className={`mt-2 w-full py-1.5 px-2 rounded-xl text-xs font-black border transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95 truncate ${
                          isAdded
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                            : "border-primary/60 text-primary hover:bg-primary hover:text-white"
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check sx={{ fontSize: 13 }} /> Moved!
                          </>
                        ) : (
                          "Move to cart"
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </CarouselTrack>
          ) : (
            <div className="p-4 rounded-2xl border border-dashed border-border text-center text-xs text-muted-foreground">
              No items in this category in your wishlist.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CartCrossSellCarousels;
