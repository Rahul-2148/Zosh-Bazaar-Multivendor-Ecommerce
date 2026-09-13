import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AddShoppingCart,
  DeleteOutline,
  DriveFileMoveOutlined,
  ShareOutlined,
  MoreVert,
  TrendingDown,
  TrendingUp,
  WarningAmber,
} from "@mui/icons-material";
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
  CircularProgress,
} from "@mui/material";
import type { ISavedItem } from "../../../../types/wishlistTypes";
import { useAppDispatch } from "../../../../Redux Toolkit/Store";
import {
  removeSavedItem,
  moveItemToCart,
} from "../../../../Redux Toolkit/features/customer/WishlistSlice";
import { fetchUserCart } from "../../../../Redux Toolkit/features/customer/CartSlice";
import { useSnackbar } from "../../../../common/SnackbarProvider";

interface SavedItemCardProps {
  item: ISavedItem;
  isSelected?: boolean;
  onToggleSelect?: (itemId: string) => void;
  onOpenMoveModal?: (item: ISavedItem) => void;
  onOpenShareModal?: (product: any) => void;
}

export const SavedItemCard: React.FC<SavedItemCardProps> = ({
  item,
  isSelected = false,
  onToggleSelect,
  onOpenMoveModal,
  onOpenShareModal,
}) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { showSnackbar } = useSnackbar();

  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [movingToCart, setMovingToCart] = useState(false);
  const [removing, setRemoving] = useState(false);

  const prod = item.product || {};
  const smartState = item.smartState || {
    currentPrice: item.savedPrice,
    currentMrp: item.savedMrp,
    savedPrice: item.savedPrice,
    savedMrp: item.savedMrp,
    priceDrop: 0,
    isPriceDropped: false,
    priceIncrease: 0,
    isPriceIncreased: false,
    discountPercent: 0,
    stockStatus: "IN_STOCK",
    countInStock: 10,
    isAvailable: true,
    isArchived: false,
  };

  const isArchived = smartState.isArchived || !prod._id;
  const isOutOfStock = smartState.stockStatus === "OUT_OF_STOCK" || smartState.stockStatus === "UNAVAILABLE";
  const isLowStock = smartState.stockStatus === "LOW_STOCK";

  const productTitle = prod.title || item.snapshot?.title || "Product";
  const productBrand = prod.brand || item.snapshot?.brand || "Brand";
  const firstImage = prod.images?.[0];
  const productImage =
    item.selectedVariant?.image ||
    (typeof firstImage === "object" ? (firstImage as any)?.url : firstImage) ||
    item.snapshot?.image ||
    "https://via.placeholder.com/260";

  const productUrl = prod._id
    ? `/product-details/${encodeURIComponent(
        prod.category?.categoryId || prod.category || "all"
      )}/${encodeURIComponent(productTitle)}/${prod._id}`
    : "#";

  const handleCardClick = () => {
    if (!isArchived && productUrl !== "#") {
      navigate(productUrl);
    }
  };

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuAnchor(null);
    setRemoving(true);
    try {
      await dispatch(removeSavedItem(item._id)).unwrap();
      showSnackbar("Item removed from collection", "info");
    } catch (err: any) {
      showSnackbar(err.message || "Failed to remove item", "error");
      setRemoving(false);
    }
  };

  const handleMoveToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock || isArchived) return;

    setMovingToCart(true);
    try {
      const result = await dispatch(
        moveItemToCart({ itemId: item._id, quantity: 1 })
      ).unwrap();

      // Refresh cart state
      const jwt = localStorage.getItem("jwt");
      if (jwt) {
        dispatch(fetchUserCart(jwt));
      }

      showSnackbar(result.message || "Added to your shopping bag!", "success");
    } catch (err: any) {
      showSnackbar(err.message || "Failed to add to cart", "error");
    } finally {
      setMovingToCart(false);
    }
  };

  const handleOpenMenu = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setMenuAnchor(e.currentTarget);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group relative bg-card text-card-foreground rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-lg cursor-pointer ${
        isSelected
          ? "border-primary ring-2 ring-primary/20"
          : "border-border/80 hover:border-primary/40 hover:-translate-y-1"
      }`}
    >
      {/* Top action bar: Bulk Checkbox + Options Menu */}
      <div className="absolute top-2.5 inset-x-2.5 z-20 flex items-center justify-between pointer-events-none">
        {/* Selection Checkbox */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect?.(item._id);
          }}
          className="pointer-events-auto bg-card/85 backdrop-blur-md rounded-lg shadow-sm border border-border/40 p-0.5"
        >
          <Checkbox
            checked={isSelected}
            size="small"
            color="primary"
            sx={{ p: 0.5 }}
            inputProps={{ "aria-label": `Select ${productTitle}` }}
          />
        </div>

        {/* Options Menu (⋯) */}
        <div className="pointer-events-auto bg-card/85 backdrop-blur-md rounded-lg shadow-sm border border-border/40">
          <IconButton
            size="small"
            onClick={handleOpenMenu}
            sx={{ color: "var(--foreground)" }}
            aria-label="Item options"
          >
            <MoreVert fontSize="small" />
          </IconButton>
        </div>
      </div>

      {/* Product Image Area */}
      <div className="relative w-full aspect-square bg-muted/60 overflow-hidden flex items-center justify-center">
        <img
          src={productImage}
          alt={productTitle}
          loading="lazy"
          className={`w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out ${
            isOutOfStock || isArchived ? "opacity-60 grayscale-[40%]" : ""
          }`}
        />

        {/* Price Drop Alert Ribbon */}
        {smartState.isPriceDropped && (
          <div className="absolute bottom-2.5 left-2.5 z-10 bg-emerald-600 text-white text-[10px] sm:text-[11px] font-black px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 tracking-tight">
            <TrendingDown sx={{ fontSize: 13 }} />
            <span>₹{smartState.priceDrop.toLocaleString("en-IN")} Drop!</span>
          </div>
        )}

        {/* Price Increase Subtle Indicator */}
        {smartState.isPriceIncreased && !smartState.isPriceDropped && (
          <div className="absolute bottom-2.5 left-2.5 z-10 bg-muted/90 text-muted-foreground text-[10px] font-bold px-2 py-0.5 rounded-full border border-border/60 flex items-center gap-1">
            <TrendingUp sx={{ fontSize: 12 }} />
            <span>Price increased</span>
          </div>
        )}

        {/* Discount Badge */}
        {smartState.discountPercent > 0 && !smartState.isPriceDropped && (
          <div className="absolute bottom-2.5 left-2.5 z-10 bg-destructive text-destructive-foreground text-[10px] font-black px-2 py-0.5 rounded-full shadow-md">
            {smartState.discountPercent}% OFF
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Brand & Stock Pill */}
          <div className="flex items-center justify-between gap-1 text-[11px] mb-1">
            <span className="font-bold text-primary uppercase tracking-wider truncate">
              {productBrand}
            </span>

            {isArchived ? (
              <span className="text-[10px] font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">
                Unavailable
              </span>
            ) : isOutOfStock ? (
              <span className="text-[10px] font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">
                Sold Out
              </span>
            ) : isLowStock ? (
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/15 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                <WarningAmber sx={{ fontSize: 10 }} />
                Only {smartState.countInStock} left
              </span>
            ) : (
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                In Stock
              </span>
            )}
          </div>

          {/* Product Title */}
          <h3 className="text-xs sm:text-sm font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {productTitle}
          </h3>

          {/* Selected Variant info if saved with variant */}
          {item.selectedVariant?.title && (
            <p className="text-[11px] text-muted-foreground font-medium mt-1">
              Variant:{" "}
              <span className="text-foreground font-semibold">
                {item.selectedVariant.title}
              </span>
            </p>
          )}

          {/* Note if added */}
          {item.note && (
            <p className="text-[11px] italic text-muted-foreground mt-1 line-clamp-1 bg-muted/40 px-2 py-0.5 rounded border border-border/40">
              "{item.note}"
            </p>
          )}
        </div>

        {/* Price & Move CTA */}
        <div className="pt-2 border-t border-border/50 space-y-2.5">
          {/* Prices */}
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="font-black text-base sm:text-lg text-foreground tracking-tight">
              ₹{smartState.currentPrice?.toLocaleString("en-IN")}
            </span>

            {smartState.currentMrp > smartState.currentPrice && (
              <span className="text-xs line-through text-muted-foreground font-medium">
                ₹{smartState.currentMrp?.toLocaleString("en-IN")}
              </span>
            )}

            {smartState.isPriceDropped && (
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block w-full">
                Saved at ₹{smartState.savedPrice.toLocaleString("en-IN")}
              </span>
            )}
          </div>

          {/* Action Button */}
          {isArchived ? (
            <button
              type="button"
              onClick={handleRemove}
              disabled={removing}
              className="w-full py-2 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <DeleteOutline sx={{ fontSize: 16 }} />
              <span>Remove Unavailable Item</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={isOutOfStock || movingToCart}
              onClick={handleMoveToCart}
              className={`w-full py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                isOutOfStock
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20"
              }`}
            >
              {movingToCart ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <>
                  <AddShoppingCart sx={{ fontSize: 15 }} />
                  <span>{isOutOfStock ? "Currently Out of Stock" : "Move to Cart"}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Options Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        slotProps={{
          paper: {
            sx: {
              borderRadius: "0.85rem",
              minWidth: 180,
              boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
            },
          },
        }}
      >
        <MenuItem
          onClick={(e) => {
            e.stopPropagation();
            setMenuAnchor(null);
            onOpenMoveModal?.(item);
          }}
        >
          <ListItemIcon>
            <DriveFileMoveOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Move to Collection" primaryTypographyProps={{ fontSize: "12px", fontWeight: 600 }} />
        </MenuItem>

        <MenuItem
          onClick={(e) => {
            e.stopPropagation();
            setMenuAnchor(null);
            onOpenShareModal?.(prod);
          }}
        >
          <ListItemIcon>
            <ShareOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Share Product" primaryTypographyProps={{ fontSize: "12px", fontWeight: 600 }} />
        </MenuItem>

        <MenuItem
          onClick={(e) => {
            e.stopPropagation();
            setMenuAnchor(null);
            handleRemove(e);
          }}
          className="text-destructive"
        >
          <ListItemIcon>
            <DeleteOutline fontSize="small" sx={{ color: "var(--destructive)" }} />
          </ListItemIcon>
          <ListItemText
            primary="Remove"
            primaryTypographyProps={{
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--destructive)",
            }}
          />
        </MenuItem>
      </Menu>
    </div>
  );
};

export default SavedItemCard;
