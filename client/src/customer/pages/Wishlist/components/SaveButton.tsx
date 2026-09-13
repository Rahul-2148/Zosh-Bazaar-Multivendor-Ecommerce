import React, { useState } from "react";
import { Favorite, FavoriteBorder, BookmarkAddOutlined } from "@mui/icons-material";
import { IconButton, Tooltip, Button } from "@mui/material";
import { useAppDispatch, useAppSelector } from "../../../../Redux Toolkit/Store";
import { toggleWishlist } from "../../../../Redux Toolkit/features/customer/WishlistSlice";
import { useSnackbar } from "../../../../common/SnackbarProvider";
import {
  isGuestProductSaved,
  toggleGuestSavedItem,
} from "../../../../utils/guestWishlist";
import SaveToCollectionModal from "./SaveToCollectionModal";

interface SaveButtonProps {
  product: any;
  variantId?: string | null;
  size?: "small" | "medium" | "large";
  variant?: "icon" | "button" | "pill";
  showLabel?: boolean;
  className?: string;
  onSavedChange?: (isSaved: boolean) => void;
}

export const SaveButton: React.FC<SaveButtonProps> = ({
  product,
  variantId,
  size = "small",
  variant = "icon",
  showLabel = false,
  className = "",
  onSavedChange,
}) => {
  const dispatch = useAppDispatch();
  const { showSnackbar } = useSnackbar();
  const { savedProductIds } = useAppSelector((store) => store.wishlist);
  const jwt = typeof window !== "undefined" ? localStorage.getItem("jwt") : null;

  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const productId = product?._id || product?.id || (typeof product === "string" ? product : "");

  // Determine if item is saved
  const isSaved = jwt
    ? savedProductIds.includes(productId)
    : isGuestProductSaved(productId);

  const handleQuickSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 400);

    if (!jwt) {
      // Guest local storage save
      const res = toggleGuestSavedItem(product, variantId);
      if (res.isSaved) {
        showSnackbar("Saved to device! Login anytime to sync across devices.", "info");
      } else {
        showSnackbar("Removed from saved items", "info");
      }
      onSavedChange?.(res.isSaved);
      return;
    }

    // Authenticated optimistic toggle
    dispatch(toggleWishlist(productId));
    const nextSaved = !isSaved;
    onSavedChange?.(nextSaved);

    if (nextSaved) {
      showSnackbar(
        "Saved to Favorites! Click here or ⋯ to organize into collections.",
        "success"
      );
    } else {
      showSnackbar("Removed from Favorites", "info");
    }
  };

  const handleOpenCollectionModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsCollectionModalOpen(true);
  };

  const iconFontSize = size === "small" ? 18 : size === "large" ? 24 : 20;

  return (
    <>
      {variant === "icon" ? (
        <div className={`relative inline-flex items-center group/save ${className}`}>
          <Tooltip
            title={isSaved ? "Saved to Wishlist (Click to remove)" : "Save to Wishlist"}
            placement="top"
          >
            <IconButton
              size={size}
              onClick={handleQuickSave}
              onContextMenu={(e) => {
                e.preventDefault();
                handleOpenCollectionModal(e);
              }}
              sx={{
                backgroundColor: "var(--card)",
                backdropFilter: "blur(8px)",
                border: "1px solid var(--border)",
                color: isSaved ? "var(--destructive)" : "var(--foreground)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                transition: "all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
                transform: isAnimating ? "scale(1.28)" : "scale(1)",
                "&:hover": {
                  backgroundColor: "var(--accent)",
                  transform: "scale(1.1)",
                },
              }}
              aria-label={isSaved ? "Remove from wishlist" : "Save to wishlist"}
            >
              {isSaved ? (
                <Favorite
                  sx={{
                    fontSize: iconFontSize,
                    color: "var(--destructive)",
                    filter: "drop-shadow(0 1px 2px rgba(239, 68, 68, 0.3))",
                  }}
                />
              ) : (
                <FavoriteBorder
                  sx={{
                    fontSize: iconFontSize,
                    color: "var(--foreground)",
                  }}
                />
              )}
            </IconButton>
          </Tooltip>

          {/* Quick Collection Picker trigger on hover for logged in users */}
          {jwt && isSaved && (
            <Tooltip title="Organize into collections" placement="bottom">
              <button
                type="button"
                onClick={handleOpenCollectionModal}
                className="opacity-0 group-hover/save:opacity-100 transition-opacity absolute -bottom-6 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] font-bold px-1.5 py-0.5 rounded shadow-md whitespace-nowrap cursor-pointer z-30"
              >
                + List
              </button>
            </Tooltip>
          )}
        </div>
      ) : variant === "pill" ? (
        <button
          type="button"
          onClick={handleQuickSave}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
            isSaved
              ? "bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/20"
              : "bg-card text-foreground border-border hover:bg-muted"
          } ${className}`}
        >
          {isSaved ? (
            <Favorite sx={{ fontSize: 16, color: "var(--destructive)" }} />
          ) : (
            <FavoriteBorder sx={{ fontSize: 16 }} />
          )}
          <span>{isSaved ? "Saved" : "Save"}</span>
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <Button
            onClick={handleQuickSave}
            variant="outlined"
            size={size}
            startIcon={
              isSaved ? (
                <Favorite sx={{ color: "var(--destructive)" }} />
              ) : (
                <FavoriteBorder />
              )
            }
            sx={{
              textTransform: "none",
              fontWeight: 600,
              borderRadius: "0.75rem",
              borderColor: isSaved ? "var(--destructive)" : "var(--border)",
              color: isSaved ? "var(--destructive)" : "var(--foreground)",
              backgroundColor: isSaved ? "rgba(239, 68, 68, 0.08)" : "transparent",
              "&:hover": {
                backgroundColor: isSaved ? "rgba(239, 68, 68, 0.15)" : "var(--accent)",
              },
            }}
            className={className}
          >
            {isSaved ? "Saved to Wishlist" : showLabel ? "Save to Wishlist" : "Save"}
          </Button>

          {jwt && (
            <Tooltip title="Save to specific collection">
              <IconButton
                size={size}
                onClick={handleOpenCollectionModal}
                sx={{
                  border: "1px solid var(--border)",
                  borderRadius: "0.75rem",
                  "&:hover": { backgroundColor: "var(--accent)" },
                }}
              >
                <BookmarkAddOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </div>
      )}

      {/* Save to Collection Modal */}
      {isCollectionModalOpen && (
        <SaveToCollectionModal
          product={product}
          variantId={variantId}
          open={isCollectionModalOpen}
          onClose={() => setIsCollectionModalOpen(false)}
        />
      )}
    </>
  );
};

export default SaveButton;
