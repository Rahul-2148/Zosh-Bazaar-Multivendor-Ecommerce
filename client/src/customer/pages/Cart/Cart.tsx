import {
  Button,
  CircularProgress,
  Divider,
  IconButton,
  TextField,
  Typography,
  Alert,
} from "@mui/material";
import {
  Add,
  Close,
  Remove,
  ShoppingBagOutlined,
  LocalShippingOutlined,
  VerifiedUserOutlined,
  FavoriteBorder,
  ConfirmationNumberOutlined,
  StorefrontOutlined,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import {
  deleteCartItem,
  fetchUserCart,
  updateCartItem,
} from "../../../Redux Toolkit/features/customer/CartSlice";
import { saveForLater } from "../../../Redux Toolkit/features/customer/WishlistSlice";
import { applyCoupon } from "../../../Redux Toolkit/features/customer/CouponSlice";

const Cart = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { cart, coupon } = useAppSelector((store) => store);
  const jwt = localStorage.getItem("jwt") || "";

  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);

  useEffect(() => {
    if (jwt) {
      dispatch(fetchUserCart(jwt));
    }
  }, [dispatch, jwt]);

  const handleQuantityChange = (cartItemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    dispatch(updateCartItem({ jwt, cartItemId, quantity: newQuantity }));
  };

  const handleRemoveItem = (cartItemId: string) => {
    dispatch(deleteCartItem({ jwt, cartItemId }));
  };

  const handleMoveToWishlist = async (cartItemId: string, productId: string, variantId?: string) => {
    try {
      await dispatch(saveForLater({ cartItemId, productId, variantId })).unwrap();
      dispatch(fetchUserCart(jwt));
    } catch {
      // ignore
    }
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setCouponError(null);

    const action = await dispatch(
      applyCoupon({ code: couponCode.trim(), jwt, apply: "true" })
    );

    if (applyCoupon.rejected.match(action)) {
      setCouponError(
        (action.payload as any)?.message || "Invalid or expired coupon code."
      );
    }
  };

  const cartData = cart?.cart;

  // Group items by Seller (Multi-Vendor Packages)
  const sellerGroups = useMemo(() => {
    if (!cartData?.cartItems) return [];

    const map = new Map<string, { seller: any; items: any[] }>();

    cartData.cartItems.forEach((item: any) => {
      const seller = item.product?.seller;
      const sellerId = seller?._id?.toString() || "default-vendor";

      if (!map.has(sellerId)) {
        map.set(sellerId, {
          seller: seller || {
            sellerName: "Zosh Certified Fulfillment",
            businessDetails: { businessName: "Zosh Certified Partner" },
          },
          items: [],
        });
      }
      map.get(sellerId)!.items.push(item);
    });

    return Array.from(map.values());
  }, [cartData]);

  if (cart.loading && !cartData) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] space-y-3">
        <CircularProgress size={36} color="primary" />
        <p className="text-xs text-muted-foreground font-medium">Loading your shopping bag...</p>
      </div>
    );
  }

  if (!cartData || !cartData.cartItems || cartData.cartItems.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 sm:py-24 flex flex-col items-center justify-center text-center gap-4">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
          <ShoppingBagOutlined sx={{ fontSize: 56 }} />
        </div>
        <Typography variant="h5" fontWeight="800" className="text-foreground tracking-tight text-xl sm:text-2xl">
          Your Shopping Bag is Empty
        </Typography>
        <Typography variant="body2" color="text.secondary" className="max-w-md leading-relaxed text-sm">
          Explore millions of products across thousands of certified sellers on Zosh Bazaar with verified quality inspection and express delivery.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate("/")}
          sx={{
            mt: 2,
            px: 4,
            py: 1.3,
            borderRadius: "0.85rem",
            textTransform: "none",
            fontWeight: 700,
            fontSize: "14px",
            boxShadow: "0 4px 14px rgba(13, 148, 136, 0.35)",
          }}
        >
          Explore Trending Products
        </Button>
      </div>
    );
  }

  const effectiveSellingPrice = coupon?.cart?.totalSellingPrice || cartData.totalSellingPrice || 0;
  const effectiveDiscount =
    (cartData.totalMrpPrice || 0) - effectiveSellingPrice;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-28 sm:py-10 min-h-[calc(100vh-140px)] w-full">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between pb-6 gap-2 border-b border-border">
        <div>
          <Typography variant="h5" fontWeight="800" className="text-foreground tracking-tight text-xl sm:text-2xl">
            Shopping Cart ({cartData.totalItem} items)
          </Typography>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Grouped into {sellerGroups.length} vendor {sellerGroups.length === 1 ? "package" : "packages"} for direct fulfillment
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="text-xs sm:text-sm font-bold text-primary hover:underline self-start sm:self-auto cursor-pointer"
        >
          Continue Shopping →
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start mt-6">
        {/* Left: Multi-Vendor Seller Packages */}
        <div className="flex-1 w-full flex flex-col gap-6 min-w-0">
          {sellerGroups.map((group, groupIdx) => (
            <div
              key={groupIdx}
              className="border border-border bg-card text-card-foreground rounded-2xl p-4 sm:p-6 shadow-sm overflow-hidden"
            >
              {/* Seller Package Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-border">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <StorefrontOutlined sx={{ fontSize: 22 }} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-foreground truncate">
                      Package {groupIdx + 1} of {sellerGroups.length}: Sold by{" "}
                      <span className="text-primary font-black">
                        {group.seller?.businessDetails?.businessName ||
                          group.seller?.sellerName ||
                          "Zosh Certified Vendor"}
                      </span>
                    </h3>
                    <p className="text-[11px] sm:text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      <LocalShippingOutlined sx={{ fontSize: 14 }} />
                      <span>Direct fulfillment & quality inspection</span>
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-muted-foreground bg-muted px-3 py-1 rounded-full shrink-0 border border-border">
                  {group.items.length} {group.items.length === 1 ? "item" : "items"}
                </span>
              </div>

              {/* Package Items List */}
              <div className="flex flex-col gap-4">
                {group.items.map((item: any) => {
                  const prod = item.product || {};
                  const isOutOfStock = prod.countInStock !== undefined && prod.countInStock <= 0;

                  return (
                    <div
                      key={item._id}
                      className="flex flex-col sm:flex-row gap-4 sm:gap-5 p-4 sm:p-5 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-muted/10 transition-all shadow-xs"
                    >
                      {/* Product Thumbnail */}
                      <div
                        onClick={() =>
                          navigate(
                            `/product-details/${prod.category?.categoryId || "all"}/${encodeURIComponent(prod.title || "")}/${prod._id}`
                          )
                        }
                        className="cursor-pointer shrink-0 self-center sm:self-start w-24 h-28 sm:w-28 sm:h-32 rounded-xl border border-border bg-muted/20 p-2 flex items-center justify-center overflow-hidden hover:opacity-90 transition-opacity"
                      >
                        <img
                          className="w-full h-full object-contain"
                          src={item.selectedVariant?.image || prod.images?.[0] || ""}
                          alt={prod.title || "Product"}
                        />
                      </div>

                      {/* Product Information */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between gap-3">
                        <div>
                          <div className="flex justify-between items-start gap-3">
                            <div className="min-w-0 flex-1">
                              <span className="text-[10px] sm:text-[11px] font-extrabold text-primary uppercase tracking-wider block truncate">
                                {prod.brand || "Zosh Certified"}
                              </span>
                              <h4
                                onClick={() =>
                                  navigate(
                                    `/product-details/${prod.category?.categoryId || "all"}/${encodeURIComponent(prod.title || "")}/${prod._id}`
                                  )
                                }
                                className="text-sm sm:text-base font-bold text-foreground hover:text-primary cursor-pointer transition-colors line-clamp-2 mt-1 leading-snug"
                              >
                                {prod.title}
                              </h4>
                            </div>

                            <IconButton
                              size="small"
                              onClick={() => handleRemoveItem(item._id)}
                              aria-label="Remove item"
                              sx={{
                                color: "text.secondary",
                                "&:hover": { color: "error.main", bgcolor: "rgba(239, 68, 68, 0.1)" },
                              }}
                              className="shrink-0 -mr-1 -mt-1"
                            >
                              <Close sx={{ fontSize: 18 }} />
                            </IconButton>
                          </div>

                          {/* Selected Variant Information */}
                          <div className="flex flex-wrap items-center gap-2 mt-2.5">
                            {item.size && (
                              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-muted text-foreground border border-border">
                                Size: {item.size}
                              </span>
                            )}
                            {item.selectedVariant?.title && (
                              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                                {item.selectedVariant.title}
                              </span>
                            )}
                            {isOutOfStock ? (
                              <span className="text-xs font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-md border border-destructive/20">
                                Currently Out of Stock
                              </span>
                            ) : prod.countInStock <= 5 && prod.countInStock > 0 ? (
                              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                                Only {prod.countInStock} left
                              </span>
                            ) : null}
                          </div>
                        </div>

                        {/* Price & Quantity Controls */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-1 border-t border-border">
                          {/* Price */}
                          <div className="flex flex-wrap items-baseline gap-2">
                            <span className="font-extrabold text-base sm:text-lg text-foreground">
                              ₹{item.sellingPrice?.toLocaleString("en-IN")}
                            </span>
                            {item.mrpPrice > item.sellingPrice && (
                              <>
                                <span className="text-xs line-through text-muted-foreground font-medium">
                                  ₹{item.mrpPrice?.toLocaleString("en-IN")}
                                </span>
                                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md border border-emerald-500/20">
                                  {Math.round(
                                    ((item.mrpPrice - item.sellingPrice) / item.mrpPrice) *
                                      100
                                  )}
                                  % OFF
                                </span>
                              </>
                            )}
                          </div>

                          {/* Actions: Quantity + Wishlist */}
                          <div className="flex items-center gap-3 ml-auto sm:ml-0">
                            <button
                              type="button"
                              onClick={() => handleMoveToWishlist(item._id, prod._id, item.variantId)}
                              className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors cursor-pointer px-2.5 py-1.5 rounded-lg hover:bg-muted"
                            >
                              <FavoriteBorder sx={{ fontSize: 15 }} />
                              <span className="hidden sm:inline">Save for Later</span>
                            </button>

                            <div className="flex items-center border border-border rounded-xl bg-card shadow-xs">
                              <IconButton
                                size="small"
                                onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                                sx={{ p: 0.75, color: "text.primary" }}
                              >
                                <Remove sx={{ fontSize: 14 }} />
                              </IconButton>
                              <span className="w-8 text-center text-xs font-bold text-foreground select-none">
                                {item.quantity}
                              </span>
                              <IconButton
                                size="small"
                                onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
                                disabled={prod.countInStock && item.quantity >= prod.countInStock}
                                sx={{ p: 0.75, color: "text.primary" }}
                              >
                                <Add sx={{ fontSize: 14 }} />
                              </IconButton>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Right: Order Summary & Coupon (Sticky below 110px navbar) */}
        <div className="w-full lg:w-[380px] shrink-0 flex flex-col gap-6 lg:sticky lg:top-[128px]">
          {/* Coupon Box */}
          <div className="border border-border bg-card text-card-foreground rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <ConfirmationNumberOutlined className="text-primary" sx={{ fontSize: 20 }} />
              <Typography variant="subtitle2" fontWeight="700" className="text-foreground">
                Apply Coupon Code
              </Typography>
            </div>

            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <TextField
                size="small"
                fullWidth
                placeholder="Enter promo code (e.g. WELCOME50)"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                disabled={coupon.loading}
                inputProps={{ style: { textTransform: "uppercase", fontSize: "13px" } }}
              />
              <Button
                type="submit"
                variant="outlined"
                color="primary"
                disabled={!couponCode.trim() || coupon.loading}
                sx={{ textTransform: "none", fontWeight: 700, minWidth: "80px", borderRadius: "0.65rem" }}
              >
                {coupon.loading ? <CircularProgress size={16} /> : "Apply"}
              </Button>
            </form>

            {couponError && (
              <Alert severity="error" sx={{ mt: 2, fontSize: "12px", borderRadius: "0.5rem" }}>
                {couponError}
              </Alert>
            )}

            {coupon.couponApplied && (
              <Alert severity="success" sx={{ mt: 2, fontSize: "12px", borderRadius: "0.5rem" }}>
                Coupon applied successfully!
              </Alert>
            )}
          </div>

          {/* Pricing Breakdown */}
          <div className="border border-border bg-card text-card-foreground rounded-2xl p-6 shadow-sm flex flex-col gap-5">
            <Typography variant="h6" fontWeight="800" className="text-foreground tracking-tight">
              Order Summary
            </Typography>
            <Divider />

            <div className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between text-muted-foreground font-medium">
                <span>Total MRP ({cartData.totalItem} items)</span>
                <span className="text-foreground font-semibold">
                  ₹{cartData.totalMrpPrice?.toLocaleString("en-IN")}
                </span>
              </div>

              {effectiveDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span>Promotional & Coupon Savings</span>
                  <span>-₹{effectiveDiscount.toLocaleString("en-IN")}</span>
                </div>
              )}

              <div className="flex justify-between text-muted-foreground font-medium">
                <span>Standard Express Delivery</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">FREE</span>
              </div>

              <Divider />

              <div className="flex justify-between items-baseline pt-1">
                <span className="font-extrabold text-base text-foreground">Total Payable</span>
                <span className="text-primary font-black text-2xl tracking-tight">
                  ₹{effectiveSellingPrice.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={() => navigate("/checkout/address")}
              sx={{
                py: 1.5,
                borderRadius: "0.85rem",
                fontWeight: 800,
                fontSize: "14px",
                textTransform: "none",
                boxShadow: "0 4px 14px rgba(13, 148, 136, 0.35)",
              }}
            >
              Proceed to Checkout →
            </Button>

            <div className="flex items-center justify-center gap-2 pt-1 text-[11px] text-muted-foreground font-medium">
              <VerifiedUserOutlined sx={{ fontSize: 15 }} className="text-primary" />
              <span>Safe & Secure 256-Bit Encrypted Payments</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
