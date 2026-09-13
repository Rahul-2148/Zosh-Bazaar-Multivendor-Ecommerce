import React, { useState } from "react";
import { Add, Close, Remove, BookmarkAddOutlined } from "@mui/icons-material";
import { Divider, IconButton, CircularProgress } from "@mui/material";
import { useAppDispatch } from "../../../Redux Toolkit/Store";
import {
  deleteCartItem,
  updateCartItem,
  fetchUserCart,
} from "../../../Redux Toolkit/features/customer/CartSlice";
import { saveForLater } from "../../../Redux Toolkit/features/customer/WishlistSlice";
import { useSnackbar } from "../../../common/SnackbarProvider";

const CartItemCard = ({ item }: { item: any }) => {
  const dispatch = useAppDispatch();
  const { showSnackbar } = useSnackbar();
  const [localQuantity, setLocalQuantity] = useState(item.quantity);
  const [savingForLater, setSavingForLater] = useState(false);

  const handleSaveForLater = async () => {
    const jwt = localStorage.getItem("jwt");
    if (!jwt) return;
    setSavingForLater(true);
    try {
      const prodId = item.product?._id || item.product;
      await dispatch(
        saveForLater({
          cartItemId: item._id,
          productId: prodId,
          variantId: item.variantId,
        })
      ).unwrap();
      dispatch(fetchUserCart(jwt));
      showSnackbar("Item moved to Buy Later!", "success");
    } catch (err: any) {
      showSnackbar(err.message || "Failed to save for later", "error");
    } finally {
      setSavingForLater(false);
    }
  };

  const handleUpdateQuantity = async (quantity: number) => {
    setLocalQuantity(quantity);

    try {
      const result = await dispatch(
        updateCartItem({
          jwt: localStorage.getItem("jwt") as string,
          cartItemId: item._id,
          quantity,
        })
      ).unwrap();

      showSnackbar(result.message || "Cart updated!", "success");
    } catch (err: any) {
      showSnackbar(err.message || "Failed to update cart", "error");
      setLocalQuantity(item.quantity);
    }
  };

  const handleRemoveCartItem = async () => {
    try {
      const result = await dispatch(
        deleteCartItem({
          jwt: localStorage.getItem("jwt") as string,
          cartItemId: item._id,
        })
      ).unwrap();

      showSnackbar(result.message || "Item removed from cart", "success");
    } catch (err: any) {
      showSnackbar(err.message || "Failed to remove item", "error");
    }
  };

  // Derive accurate commercial variant information
  const variantTitle =
    item.selectedVariant?.title ||
    (Array.isArray(item.selectedVariant?.attributes)
      ? item.selectedVariant.attributes.map((a: any) => a.value).join(" / ")
      : null);

  const unitPrice = item.sellingPrice || item.product?.sellingPrice || 0;
  const unitMrp = item.mrpPrice || item.product?.mrpPrice || unitPrice;
  const itemImage =
    item.selectedVariant?.image ||
    item.product?.images?.[0] ||
    "https://via.placeholder.com/90";

  return (
    <div className="border border-border rounded-xl relative bg-card shadow-2xs overflow-hidden">
      {/* Product Info */}
      <div className="p-4 flex gap-4">
        <div className="w-[88px] h-[88px] rounded-xl bg-muted/60 border border-border flex items-center justify-center p-1 shrink-0">
          <img
            className="w-full h-full object-contain"
            src={itemImage}
            alt={item?.product?.title || "Product"}
          />
        </div>

        <div className="flex flex-col gap-1 min-w-0 flex-1 pr-6">
          <h2 className="title text-sm font-bold text-foreground truncate">
            {item?.product?.title}
          </h2>
          <p className="text-xs font-semibold text-primary">
            {item?.product?.brand || "Authentic"}
          </p>

          {/* Selected Variant Attributes Badge */}
          {variantTitle && (
            <div className="inline-block px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[11px] font-semibold border border-primary/20">
              Variant: {variantTitle}
            </div>
          )}

          {item.selectedVariant?.sku && (
            <p className="text-[10px] text-muted-foreground font-mono">
              SKU: {item.selectedVariant.sku}
            </p>
          )}

          <p className="text-[11px] text-muted-foreground">
            Sold by: <span className="font-semibold text-foreground">{item?.product?.seller?.sellerName || "Platform"}</span>
          </p>
        </div>
      </div>

      <Divider />

      {/* Quantity & Price */}
      <div className="px-4 py-3 flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="flex items-center border border-input rounded-xl bg-card overflow-hidden shadow-2xs">
            <button
              type="button"
              disabled={localQuantity <= 1}
              onClick={() => handleUpdateQuantity(localQuantity - 1)}
              className="px-2.5 py-1 text-foreground hover:bg-muted transition-colors disabled:opacity-30 cursor-pointer"
            >
              <Remove sx={{ fontSize: 14 }} />
            </button>
            <span className="px-3 py-1 text-xs font-bold text-foreground min-w-[32px] text-center">
              {localQuantity}
            </span>
            <button
              type="button"
              onClick={() => handleUpdateQuantity(localQuantity + 1)}
              className="px-2.5 py-1 text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <Add sx={{ fontSize: 14 }} />
            </button>
          </div>

          <button
            type="button"
            disabled={savingForLater}
            onClick={handleSaveForLater}
            className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors cursor-pointer disabled:opacity-50"
          >
            {savingForLater ? (
              <CircularProgress size={12} color="inherit" />
            ) : (
              <BookmarkAddOutlined sx={{ fontSize: 15 }} />
            )}
            <span>{savingForLater ? "Saving..." : "Save for Later"}</span>
          </button>
        </div>

        <div className="text-right">
          <p className="text-sm font-extrabold text-foreground">
            ₹{(unitPrice * localQuantity).toLocaleString("en-IN")}
          </p>
          {unitMrp > unitPrice && (
            <p className="text-[10px] text-muted-foreground line-through">
              ₹{(unitMrp * localQuantity).toLocaleString("en-IN")}
            </p>
          )}
        </div>
      </div>

      {/* Remove Button */}
      <div className="absolute top-2 right-2">
        <IconButton size="small" onClick={handleRemoveCartItem} sx={{ color: "#94a3b8" }}>
          <Close sx={{ fontSize: 18 }} />
        </IconButton>
      </div>
    </div>
  );
};

export default CartItemCard;
