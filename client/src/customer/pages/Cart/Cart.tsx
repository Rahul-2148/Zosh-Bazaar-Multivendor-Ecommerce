import React, { useEffect, useState, useMemo } from "react";
import { CircularProgress, Typography, Button } from "@mui/material";
import {
  ShoppingBagOutlined,
  LocalShippingOutlined,
  StorefrontOutlined,
} from "@mui/icons-material";
import { Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import {
  deleteCartItem,
  fetchUserCart,
  updateCartItem,
} from "../../../Redux Toolkit/features/customer/CartSlice";
import { saveForLater, getWishlist } from "../../../Redux Toolkit/features/customer/WishlistSlice";
import { openAssistant } from "../../../Redux Toolkit/features/customer/AiAssistantSlice";
import CartAddressBar from "./CartAddressBar";
import CartItemCard from "./CartItemCard";
import SavingsZoneCard from "./SavingsZoneCard";
import CartPriceDetails from "./CartPriceDetails";
import CartCrossSellCarousels from "./CartCrossSellCarousels";
import CartValidationBanner from "./CartValidationBanner";
import FreeDeliveryProgressBar from "./FreeDeliveryProgressBar";
import SavedForLaterSection from "./SavedForLaterSection";

const Cart: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { cart, coupon: _coupon, wishlist } = useAppSelector((store) => store);
  const jwt = localStorage.getItem("jwt") || "";

  // Dual Tab State: "bazaar" vs "saved"
  const [activeTab, setActiveTab] = useState<"bazaar" | "saved">("bazaar");

  useEffect(() => {
    if (jwt) {
      dispatch(fetchUserCart(jwt));
      dispatch(getWishlist());
    }
  }, [dispatch, jwt]);

  const handleQuantityChange = (cartItemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    dispatch(updateCartItem({ jwt, cartItemId, quantity: newQuantity })).then(() => {
      dispatch(fetchUserCart(jwt));
    });
  };

  const handleRemoveItem = (cartItemId: string) => {
    dispatch(deleteCartItem({ jwt, cartItemId })).then(() => {
      dispatch(fetchUserCart(jwt));
    });
  };

  const handleMoveToWishlist = async (
    cartItemId: string,
    productId: string,
    variantId?: string
  ) => {
    try {
      await dispatch(saveForLater({ cartItemId, productId, variantId })).unwrap();
      dispatch(fetchUserCart(jwt));
      dispatch(getWishlist());
    } catch {
      // ignore
    }
  };

  const cartData = cart?.cart;
  const rawCartItems = cartData?.cartItems;
  const cartItems = useMemo(() => rawCartItems || [], [rawCartItems]);
  const pricingSummary = cartData?.pricingSummary;
  const validationWarnings = cartData?.validationWarnings || [];

  const cartProductIds = useMemo(() => {
    return cartItems.map((ci: any) => ci.product?._id || ci.product?.productId).filter(Boolean);
  }, [cartItems]);

  // Group items by Seller (Multi-Vendor Packages)
  const sellerPackages = useMemo(() => {
    if (cartData?.sellerPackages && cartData.sellerPackages.length > 0) {
      return cartData.sellerPackages;
    }

    if (!cartItems || cartItems.length === 0) return [];

    const map = new Map<string, any>();
    cartItems.forEach((item: any) => {
      const seller = item.product?.seller;
      const sellerId = seller?._id?.toString() || "zosh-fulfillment";
      const sellerName =
        seller?.businessDetails?.businessName ||
        seller?.sellerName ||
        "Zosh Certified Fulfillment";

      if (!map.has(sellerId)) {
        const eta = new Date();
        eta.setDate(eta.getDate() + 3);

        map.set(sellerId, {
          sellerId,
          sellerName,
          fulfillmentType: "Zosh Assured Direct Fulfillment",
          estimatedDeliveryDate: eta.toLocaleDateString("en-IN", {
            weekday: "short",
            day: "numeric",
            month: "short",
          }),
          items: [],
          packageMrpPrice: 0,
          packageSellingPrice: 0,
          packageItemsCount: 0,
        });
      }

      const pkg = map.get(sellerId);
      pkg.items.push(item);
      pkg.packageMrpPrice += item.mrpPrice || 0;
      pkg.packageSellingPrice += item.sellingPrice || 0;
      pkg.packageItemsCount += item.quantity || 1;
    });

    return Array.from(map.values());
  }, [cartData, cartItems]);

  // Loading State
  if (cart.loading && !cartData) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] space-y-3">
        <CircularProgress size={36} color="primary" />
        <p className="text-xs text-muted-foreground font-semibold">
          Synchronizing your shopping cart...
        </p>
      </div>
    );
  }

  // Empty Cart State
  if (!cartData || !cartItems || cartItems.length === 0) {
    return (
      <div className="max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-10 sm:py-16 flex flex-col items-center justify-center text-center gap-4">
        <div className="w-24 h-24 rounded-3xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-2 shadow-xs">
          <ShoppingBagOutlined sx={{ fontSize: 48 }} />
        </div>
        <Typography
          variant="h5"
          fontWeight="900"
          className="text-foreground tracking-tight text-xl sm:text-2xl"
        >
          Your Shopping Cart is Empty
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          className="max-w-md leading-relaxed text-xs sm:text-sm font-medium"
        >
          Explore millions of genuine products across verified sellers on Zosh Bazaar with
          Zosh Assured quality inspection and fast fulfillment.
        </Typography>

        <Button
          variant="contained"
          onClick={() => navigate("/products")}
          sx={{
            mt: 2,
            px: 4,
            py: 1.3,
            borderRadius: "0.85rem",
            textTransform: "none",
            fontWeight: 800,
            fontSize: "14px",
            bgcolor: "#2874f0",
            "&:hover": { bgcolor: "#1259c7" },
            boxShadow: "0 4px 14px rgba(40, 116, 240, 0.35)",
          }}
        >
          Explore Catalog
        </Button>

        {/* Saved For Later items if any */}
        <div className="w-full text-left mt-6">
          <SavedForLaterSection />
        </div>

        {/* Cross Sell Carousels for empty cart */}
        <div className="w-full text-left mt-6">
          <CartCrossSellCarousels cartProductIds={[]} />
        </div>
      </div>
    );
  }

  // Authoritative Pricing
  const totalItemCount = cartData.totalItem || cartItems.length;
  const totalMrp = pricingSummary?.totalMrpPrice ?? cartData.totalMrpPrice ?? 0;
  const totalSelling = pricingSummary?.itemSellingPrice ?? cartData.totalSellingPrice ?? 0;
  const couponDiscount = pricingSummary?.couponDiscount ?? cartData.couponPrice ?? 0;
  const deliveryFee = pricingSummary?.deliveryFee ?? 0;
  const totalPayable = pricingSummary?.totalPayable ?? Math.max(0, totalSelling - couponDiscount + deliveryFee);
  const totalSavings = pricingSummary?.totalSavings ?? Math.max(0, totalMrp - (totalSelling - couponDiscount) + (deliveryFee === 0 ? 40 : 0));

  const savedCount = (wishlist.items || []).filter(
    (i: any) =>
      i.collection?.name === "Buy Later" ||
      i.collectionName === "Buy Later" ||
      i.isSavedForLater ||
      i.collectionId === "buy-later"
  ).length;

  return (
    <div className="bg-background min-h-[calc(100vh-140px)] w-full">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 pb-28 sm:py-8">
        {/* Top Dual Tabs (Zosh Bazaar & Saved for Later) */}
        <div className="flex items-center gap-2 mb-4">
          <button
            type="button"
            onClick={() => setActiveTab("bazaar")}
            className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-1.5 shadow-2xs ${
              activeTab === "bazaar"
                ? "bg-[#2874f0] text-white"
                : "bg-card text-foreground border border-border hover:bg-muted/40"
            }`}
          >
            <span>Zosh Bazaar</span>
            <span className="opacity-90">({totalItemCount})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("saved");
              const el = document.getElementById("saved-for-later-section");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-1.5 shadow-2xs ${
              activeTab === "saved"
                ? "bg-[#2874f0] text-white"
                : "bg-card text-foreground border border-border hover:bg-muted/40"
            }`}
          >
            <span>Saved for Later</span>
            <span className="opacity-90">({savedCount})</span>
          </button>
        </div>

        {/* Delivery Address Snippet with Switcher */}
        <div className="mb-4">
          <CartAddressBar />
        </div>

        {/* Real-time Server Authoritative Validation Warnings */}
        <CartValidationBanner warnings={validationWarnings} />

        {/* Free Delivery Progress Bar */}
        <div className="mb-4">
          <FreeDeliveryProgressBar currentAmount={totalSelling} threshold={500} />
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Left Main Column: Items + Offers + Saved + Carousels */}
          <div className="flex-1 w-full flex flex-col gap-5 min-w-0">
            {/* Multi-Vendor Packages Grouping */}
            {sellerPackages.map((group: any, groupIdx: number) => (
              <div
                key={groupIdx}
                className="flex flex-col gap-3.5 border border-border bg-card/60 backdrop-blur-xs rounded-2xl p-3.5 sm:p-5 shadow-2xs"
              >
                {/* Vendor Package Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border text-xs">
                  <div className="flex items-center gap-2 text-foreground font-bold min-w-0">
                    <StorefrontOutlined sx={{ fontSize: 18 }} className="text-primary shrink-0" />
                    <span className="truncate">
                      Package {groupIdx + 1} of {sellerPackages.length}: Sold by{" "}
                      <strong className="text-primary">{group.sellerName}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
                      <LocalShippingOutlined sx={{ fontSize: 14 }} />
                      <span>Arrives: <strong>{group.estimatedDeliveryDate}</strong></span>
                    </span>
                    <span className="text-[10px] font-extrabold text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border">
                      {group.items.length} {group.items.length === 1 ? "item" : "items"}
                    </span>
                  </div>
                </div>

                {/* Items in this package */}
                <div className="flex flex-col gap-4">
                  {group.items.map((item: any) => (
                    <CartItemCard
                      key={item._id}
                      item={item}
                      onQuantityChange={handleQuantityChange}
                      onRemoveItem={handleRemoveItem}
                      onMoveToWishlist={handleMoveToWishlist}
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* WOW! Savings Zone Card */}
            <SavingsZoneCard />

            {/* Mobile-Only Order Summary (Before carousels on small screens) */}
            <div className="block lg:hidden">
              <CartPriceDetails
                totalItem={totalItemCount}
                pricingSummary={pricingSummary}
                totalMrpPrice={totalMrp}
                totalSellingPrice={totalSelling}
                couponSavings={couponDiscount}
                deliveryFee={deliveryFee}
                onProceedToCheckout={() => navigate("/checkout")}
              />
            </div>

            {/* Dedicated Saved for Later Section */}
            <SavedForLaterSection />

            {/* Cross-Sell & Basket-Building Carousels */}
            <CartCrossSellCarousels cartProductIds={cartProductIds} />
          </div>

          {/* Right Column: Sticky Price Details & AI Advisor (Desktop) */}
          <div className="hidden lg:flex w-[380px] shrink-0 flex-col gap-5 sticky top-[120px]">
            {/* Price Details Card */}
            <CartPriceDetails
              totalItem={totalItemCount}
              pricingSummary={pricingSummary}
              totalMrpPrice={totalMrp}
              totalSellingPrice={totalSelling}
              couponSavings={couponDiscount}
              deliveryFee={deliveryFee}
              onProceedToCheckout={() => navigate("/checkout")}
            />

            {/* AI Cart Advisor Contextual Helper Card */}
            <div className="border border-blue-500/20 bg-blue-500/5 text-card-foreground rounded-2xl p-4 shadow-2xs">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-6 h-6 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-black text-foreground">
                  Zosh AI Cart Advisor
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mb-3 font-medium">
                Ask questions about your items, delivery dates, or get matched accessories.
              </p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    dispatch(
                      openAssistant({
                        context: {
                          pageType: "cart",
                          cartProductIds,
                        },
                        initialMessage: "What complementary items should I add to my order?",
                      })
                    )
                  }
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-card border border-border text-foreground hover:border-blue-500 hover:text-blue-600 transition cursor-pointer shadow-2xs"
                >
                  + Add Matching Accessories
                </button>
                <button
                  type="button"
                  onClick={() =>
                    dispatch(
                      openAssistant({
                        context: {
                          pageType: "cart",
                          cartProductIds,
                        },
                        initialMessage: "Review my cart and check for maximum discounts",
                      })
                    )
                  }
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-card border border-border text-foreground hover:border-blue-500 hover:text-blue-600 transition cursor-pointer shadow-2xs"
                >
                  Check Best Deals
                </button>
                <button
                  type="button"
                  onClick={() =>
                    dispatch(
                      openAssistant({
                        context: {
                          pageType: "cart",
                          cartProductIds,
                        },
                        initialMessage: "Is my cart worth it and are there cheaper alternatives?",
                      })
                    )
                  }
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-card border border-border text-foreground hover:border-blue-500 hover:text-blue-600 transition cursor-pointer shadow-2xs"
                >
                  Evaluate Value
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar (Screenshots 1-5 Benchmark) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border shadow-lg pb-[max(10px,env(safe-area-inset-bottom))]">
        {/* Top Mini Offer Banner */}
        <div className="bg-blue-50 dark:bg-blue-950/60 px-4 py-1.5 flex items-center justify-between text-[11px] font-bold text-blue-800 dark:text-blue-200 border-b border-blue-100 dark:border-blue-900/40">
          <span>
            {couponDiscount > 0
              ? `🎉 Coupon applied: You saved ₹${couponDiscount} extra!`
              : totalSelling < 500
              ? `Add ₹${500 - totalSelling} more for FREE delivery`
              : "🎉 Free Express Delivery Unlocked!"}
          </span>
          {totalSavings > 0 && (
            <span className="text-emerald-700 dark:text-emerald-400 font-extrabold">
              Save ₹{totalSavings.toLocaleString("en-IN")}
            </span>
          )}
        </div>

        {/* Bottom CTA Bar */}
        <div className="px-4 py-2.5 flex items-center justify-between gap-3">
          {/* Price details left */}
          <div className="flex flex-col">
            {totalMrp > totalPayable && (
              <span className="text-[11px] line-through text-muted-foreground font-medium">
                ₹{totalMrp.toLocaleString("en-IN")}
              </span>
            )}
            <span className="text-base sm:text-lg font-black text-foreground tracking-tight">
              ₹{totalPayable.toLocaleString("en-IN")}
            </span>
          </div>

          {/* Yellow CTA Button */}
          <Button
            variant="contained"
            onClick={() => navigate("/checkout")}
            sx={{
              bgcolor: "#ffc200",
              color: "#111827",
              "&:hover": { bgcolor: "#f5b700" },
              px: 3.5,
              py: 1.1,
              borderRadius: "0.75rem",
              fontWeight: 900,
              fontSize: "13px",
              textTransform: "none",
              boxShadow: "0 2px 8px rgba(255, 194, 0, 0.4)",
            }}
          >
            Proceed to buy
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
