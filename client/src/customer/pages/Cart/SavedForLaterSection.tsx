import React, { useState } from "react";
import { BookmarkBorder, ShoppingCartOutlined, Close, Star, AutoAwesome } from "@mui/icons-material";
import { IconButton, CircularProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import {
  moveItemToCart,
  removeSavedItem,
  getWishlist,
} from "../../../Redux Toolkit/features/customer/WishlistSlice";
import { fetchUserCart } from "../../../Redux Toolkit/features/customer/CartSlice";
import SaveButton from "../Wishlist/components/SaveButton";
import SimilarItemsModal from "./SimilarItemsModal";

export const SavedForLaterSection: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const jwt = localStorage.getItem("jwt") || "";
  const { wishlist } = useAppSelector((store) => store);

  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [similarSourceItem, setSimilarSourceItem] = useState<any>(null);

  // Filter items in "Buy Later" collection
  const savedItems = (wishlist.items || []).filter(
    (i: any) =>
      i.collection?.name === "Buy Later" ||
      i.collectionName === "Buy Later" ||
      i.isSavedForLater ||
      i.collectionId === "buy-later"
  );

  if (savedItems.length === 0) return null;

  const handleMoveToCart = async (itemId: string) => {
    setLoadingId(itemId);
    try {
      await dispatch(moveItemToCart({ itemId })).unwrap();
      dispatch(fetchUserCart(jwt));
      dispatch(getWishlist());
    } catch {
      // ignore
    } finally {
      setLoadingId(null);
    }
  };

  const handleRemove = async (itemId: string) => {
    setLoadingId(itemId);
    try {
      await dispatch(removeSavedItem(itemId)).unwrap();
      dispatch(getWishlist());
    } catch {
      // ignore
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div id="saved-for-later-section" className="flex flex-col gap-4 w-full mt-6 pt-6 border-t border-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
            <BookmarkBorder sx={{ fontSize: 18 }} />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black tracking-tight text-foreground">
              Saved for Later ({savedItems.length} {savedItems.length === 1 ? "item" : "items"})
            </h3>
            <p className="text-[11px] text-muted-foreground font-medium">
              Items you moved from your shopping cart to review later
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {savedItems.map((item: any) => {
          const prod = item.product || {};
          const isBusy = loadingId === item._id;
          const ratingVal = prod.ratings?.average || 4.3;

          return (
            <div
              key={item._id}
              className="p-3.5 rounded-2xl border border-border bg-card shadow-xs flex gap-3.5 items-start relative hover:border-primary/30 transition-all"
            >
              {/* Product Thumbnail */}
              <div
                onClick={() =>
                  navigate(
                    `/product-details/${prod.category?.categoryId || "all"}/${encodeURIComponent(
                      prod.title || "product"
                    )}/${prod._id || prod.productId}`
                  )
                }
                className="w-20 h-24 rounded-xl border border-border bg-muted/20 p-1 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer relative group/img"
              >
                <img
                  src={item.snapshot?.image || prod.images?.[0] || ""}
                  alt={prod.title}
                  className="w-full h-full object-contain"
                />

                {/* Wishlist Heart Button (Top Right) */}
                <div
                  className="absolute top-1 right-1 z-10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <SaveButton product={prod} size="small" />
                </div>
              </div>

              {/* Details & Actions */}
              <div className="flex-1 min-w-0 flex flex-col justify-between h-full gap-2">
                <div>
                  <span className="text-[10px] font-extrabold text-primary uppercase tracking-wider block truncate">
                    {prod.brand || item.snapshot?.brand || "Zosh Certified"}
                  </span>
                  <h4
                    onClick={() =>
                      navigate(
                        `/product-details/${prod.category?.categoryId || "all"}/${encodeURIComponent(
                          prod.title || "product"
                        )}/${prod._id || prod.productId}`
                      )
                    }
                    className="text-xs sm:text-sm font-bold text-foreground hover:text-primary cursor-pointer transition-colors line-clamp-2 leading-snug mt-0.5"
                  >
                    {prod.title || item.snapshot?.title}
                  </h4>

                  {/* Rating */}
                  <div className="mt-1 inline-flex items-center gap-0.5 bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded shadow-2xs">
                    <span>{ratingVal.toFixed(1)}</span>
                    <Star sx={{ fontSize: 10 }} />
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline gap-1.5 mt-1.5">
                    <span className="text-sm font-black text-foreground">
                      ₹{(item.savedPrice || prod.sellingPrice || 0).toLocaleString("en-IN")}
                    </span>
                    {(item.savedMrp || prod.mrpPrice) > (item.savedPrice || prod.sellingPrice) && (
                      <span className="text-[10px] line-through text-muted-foreground">
                        ₹{(item.savedMrp || prod.mrpPrice).toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>
                </div>

                {/* Move to Cart & Actions CTA */}
                <div className="flex items-center gap-1.5 pt-1 border-t border-border">
                  <button
                    type="button"
                    onClick={() => handleMoveToCart(item._id)}
                    disabled={isBusy}
                    className="flex-1 py-1.5 px-2.5 rounded-lg text-xs font-black bg-primary text-primary-foreground hover:opacity-90 transition flex items-center justify-center gap-1 cursor-pointer shadow-xs disabled:opacity-50 truncate"
                  >
                    {isBusy ? (
                      <CircularProgress size={13} color="inherit" />
                    ) : (
                      <ShoppingCartOutlined sx={{ fontSize: 14 }} />
                    )}
                    <span>Move to Cart</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSimilarSourceItem(item)}
                    className="py-1.5 px-2 rounded-lg text-xs font-bold border border-primary/30 text-primary hover:bg-primary/10 transition flex items-center justify-center gap-1 cursor-pointer bg-primary/5 shrink-0"
                  >
                    <AutoAwesome sx={{ fontSize: 13 }} />
                    <span>Similar</span>
                  </button>

                  <IconButton
                    size="small"
                    onClick={() => handleRemove(item._id)}
                    disabled={isBusy}
                    aria-label="Remove item"
                    sx={{
                      color: "text.secondary",
                      "&:hover": { color: "error.main", bgcolor: "rgba(239, 68, 68, 0.1)" },
                    }}
                  >
                    <Close sx={{ fontSize: 16 }} />
                  </IconButton>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Similar Items Modal */}
      {similarSourceItem && (
        <SimilarItemsModal
          open={Boolean(similarSourceItem)}
          onClose={() => setSimilarSourceItem(null)}
          sourceItem={similarSourceItem}
        />
      )}
    </div>
  );
};

export default SavedForLaterSection;
