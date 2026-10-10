import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Add,
  AddShoppingCart,
  FlashOn,
  LocalShipping,
  Remove,
  Star,
  VerifiedUserOutlined,
  LocationOnOutlined,
  StorefrontOutlined,
  Stars,
  KeyboardArrowDown,
  KeyboardArrowUp,
  LocalOfferOutlined,
  Verified,
  ChevronRight,
  HomeOutlined,
  AssignmentReturnOutlined,
  WorkspacePremiumOutlined,
  AccountBalanceWalletOutlined,
  ThumbUpOutlined,
  Straighten,
} from "@mui/icons-material";
import { Button, Alert, CircularProgress } from "@mui/material";
import { useParams, useNavigate, Link } from "react-router-dom";
import ProductImageZoom from "./ProductImageZoom";
import SimilarProducts from "./SimilarProducts";
import PriceHistoryWidget from "./PriceHistoryWidget";
import AIReviewSummary from "./AIReviewSummary";
import ContextualPDPAskAI from "../../../components/AI/ContextualPDPAskAI";
import SizeChartModal from "./SizeChartModal";
import CompleteTheLook from "./CompleteTheLook";
import SellerDetailsModal from "./SellerDetailsModal";
import { aiTracker } from "../../../../services/aiEventTracker";
import { useAppDispatch, useAppSelector } from "../../../../Redux Toolkit/Store";
import { fetchProductById } from "../../../../Redux Toolkit/features/customer/ProductSlice";
import { addItemToCart } from "../../../../Redux Toolkit/features/customer/CartSlice";
import {
  fetchProductReviews,
  checkCanReview,
  submitProductReview,
} from "../../../../Redux Toolkit/features/customer/ReviewSlice";
import { Api } from "../../../../config/Api";
import { buildAuthRedirectUrl } from "../../../../utils/navigation";
import { saveRecentlyViewedProduct } from "../../../../utils/recentlyViewed";
import { useVariantResolution } from "../../../hooks/useVariantResolution";

// Color name to visual hex/css resolver
const getColorStyle = (colorName: string): string => {
  const c = (colorName || "").toLowerCase().trim();
  const palette: Record<string, string> = {
    black: "#111827",
    white: "#f9fafb",
    blue: "#2563eb",
    navy: "#1e3a8a",
    red: "#dc2626",
    green: "#16a34a",
    emerald: "#059669",
    purple: "#7c3aed",
    violet: "#8b5cf6",
    yellow: "#eab308",
    orange: "#f97316",
    pink: "#ec4899",
    grey: "#6b7280",
    gray: "#6b7280",
    brown: "#78350f",
    gold: "#d97706",
    silver: "#94a3b8",
    cyan: "#06b6d4",
    teal: "#0d9488",
    maroon: "#800000",
    beige: "#f5f5dc",
    olive: "#808000",
  };
  return palette[c] || c;
};

// Available Offers Template
const AVAILABLE_BANK_OFFERS = [
  {
    type: "Bank Offer",
    text: "5% Unlimited Cashback on Zosh Platinum Axis Bank Credit Card",
    linkText: "T&C",
  },
  {
    type: "Bank Offer",
    text: "10% Instant Discount on HDFC Bank Credit Card EMI transactions, up to ₹1,500 on orders of ₹5,000 and above",
    linkText: "T&C",
  },
  {
    type: "Special Price",
    text: "Get extra 15% off (price inclusive of cashback / coupon discount)",
    linkText: "T&C",
  },
  {
    type: "Partner Offer",
    text: "Sign up for Zosh Pay Later & get ₹500 Welcome Gift Card on next purchase",
    linkText: "T&C",
  },
  {
    type: "No Cost EMI",
    text: "Avail No Cost EMI on select credit cards starting from ₹245/month",
    linkText: "View Plans",
  },
  {
    type: "Combo Offer",
    text: "Buy 2 items save 5%; Buy 3 or more save 10% across lifestyle store",
    linkText: "See all",
  },
];

const ProductDetails: React.FC = () => {
  const params = useParams<{ categoryId?: string; name?: string; productId?: string }>();
  const productId = params.productId || params.name || params.categoryId;
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { product, review, location } = useAppSelector((store) => store);
  const jwt = localStorage.getItem("jwt");

  const currentProduct = product?.product;

  // Authoritative Variant Resolution Engine Hook
  const resolution = useVariantResolution(currentProduct);

  // Selected Media
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [cartSuccess, setCartSuccess] = useState(false);
  const [showAllOffers, setShowAllOffers] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);

  // Reset selected image index when hero image or option group changes
  useEffect(() => {
    void Promise.resolve().then(() => setSelectedImageIndex(0));
  }, [resolution.heroImage, resolution.matchedOptionGroupName]);

  // Review Form State
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [showSellerDetails, setShowSellerDetails] = useState(false);

  // Delivery Serviceability State
  const activePin = location?.activeLocation?.pincode;
  const [pincodeInput, setPincodeInput] = useState(
    () => activePin || localStorage.getItem("zosh_delivery_pincode") || ""
  );
  const [prevActivePin, setPrevActivePin] = useState(activePin);
  if (activePin !== prevActivePin) {
    setPrevActivePin(activePin);
    if (activePin && activePin.length === 6) {
      setPincodeInput(activePin);
    }
  }

  const [checkingDelivery, setCheckingDelivery] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState<any>(null);

  // Calculate estimated delivery date (2-3 days out)
  const estimatedDeliveryDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  }, []);

  const handleCheckDelivery = useCallback(async (pincodeToCheck?: string) => {
    const code = (pincodeToCheck || "").trim();
    if (!code || code.length !== 6) return;
    setCheckingDelivery(true);
    try {
      const res = await Api.get(`/logistics/serviceability?pincode=${code}`);
      setDeliveryInfo(res.data);
    } catch {
      setDeliveryInfo({
        serviceable: false,
        message: "Delivery currently not available for this area",
      });
    } finally {
      setCheckingDelivery(false);
    }
  }, []);

  useEffect(() => {
    const pinToCheck =
      activePin && activePin.length === 6
        ? activePin
        : localStorage.getItem("zosh_delivery_pincode");
    if (!pinToCheck || pinToCheck.length !== 6) return;

    let active = true;
    Api.get(`/logistics/serviceability?pincode=${pinToCheck}`)
      .then((res) => {
        if (active) setDeliveryInfo(res.data);
      })
      .catch(() => {
        if (active) {
          setDeliveryInfo({
            serviceable: false,
            message: "Delivery currently not available for this area",
          });
        }
      });

    return () => {
      active = false;
    };
  }, [activePin]);

  useEffect(() => {
    if (productId) {
      dispatch(fetchProductById(productId));
      dispatch(fetchProductReviews(productId));
      if (jwt) {
        dispatch(checkCanReview(productId));
      }
      window.scrollTo(0, 0);
    }
  }, [dispatch, productId, jwt]);

  // Persist viewed product to device browsing history & AI event tracker
  useEffect(() => {
    if (currentProduct?._id) {
      saveRecentlyViewedProduct(currentProduct);
      aiTracker.trackProductView(
        currentProduct._id,
        currentProduct.category?.categoryId || currentProduct.category?._id,
        currentProduct.brand,
        currentProduct.sellingPrice
      );
    }
  }, [currentProduct]);

  // Effective prices, variant, and media resolved authoritatively
  const matchingVariant = resolution.selectedVariant;
  const displaySellingPrice = resolution.sellingPrice;
  const displayMrpPrice = resolution.mrpPrice;
  const displayDiscountPercent = resolution.discountPercent;
  const displayStock = resolution.countInStock;
  const isOutOfStock = resolution.isOutOfStock;
  const galleryImages = resolution.galleryImages;

  const handleQuantityChange = (delta: number) => {
    const next = quantity + delta;
    if (next >= 1 && next <= Math.max(1, displayStock)) {
      setQuantity(next);
    }
  };

  const handleAddCartItem = () => {
    if (!productId || !currentProduct || isOutOfStock) return;

    dispatch(
      addItemToCart({
        jwt: localStorage.getItem("jwt") || "",
        productId: currentProduct._id,
        variantId: matchingVariant?._id,
        selectedVariant: matchingVariant
          ? {
              sku: matchingVariant.sku,
              title: matchingVariant.title,
              attributes: matchingVariant.attributes,
              image: matchingVariant.images?.[0] || galleryImages[0] || resolution.heroImage,
            }
          : undefined,
        quantity,
      })
    );

    setCartSuccess(true);
    setTimeout(() => setCartSuccess(false), 3500);
  };

  const handleBuyNow = () => {
    if (!productId || !currentProduct || isOutOfStock) return;
    handleAddCartItem();
    navigate("/checkout");
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !jwt) {
      navigate(buildAuthRedirectUrl(window.location.pathname, window.location.search));
      return;
    }

    await dispatch(
      submitProductReview({
        productId,
        rating: reviewRating,
        title: reviewTitle,
        comment: reviewComment,
      })
    );

    setReviewTitle("");
    setReviewComment("");
    setShowReviewForm(false);
  };

  // Category name resolver for breadcrumbs
  const categoryTitle = useMemo(() => {
    const c = currentProduct?.category;
    if (!c) return "Products";
    if (typeof c === "string") return c.replace(/_/g, " ").toUpperCase();
    return (c.name || c.categoryId || "Products").replace(/_/g, " ");
  }, [currentProduct]);

  const categoryUrl = useMemo(() => {
    const c = currentProduct?.category;
    if (!c) return "/products";
    const catId = typeof c === "string" ? c : c.categoryId || c._id;
    return catId ? `/products/${catId}` : "/products";
  }, [currentProduct]);

  if (!currentProduct) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <CircularProgress size={36} color="primary" />
        <p className="text-muted-foreground text-sm font-medium">Loading product details...</p>
      </div>
    );
  }

  const effectiveRating = review.averageRating > 0 ? review.averageRating : 4.2;
  const effectiveReviewCount = review.totalReviews || 128;
  const effectiveRatingCount = effectiveReviewCount * 7 + 42;

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 sm:pb-28">
      {/* 1. Signature Breadcrumbs Bar */}
      <div className="border-b border-border/80 bg-card/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5">
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground overflow-x-auto scrollbar-none whitespace-nowrap">
            <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1 shrink-0">
              <HomeOutlined sx={{ fontSize: 14 }} />
              <span>Home</span>
            </Link>
            <ChevronRight fontSize="inherit" className="shrink-0 text-muted-foreground/60" />

            <Link to="/products" className="hover:text-primary transition-colors shrink-0">
              Categories
            </Link>
            <ChevronRight fontSize="inherit" className="shrink-0 text-muted-foreground/60" />

            <Link to={categoryUrl} className="hover:text-primary transition-colors font-medium capitalize shrink-0">
              {categoryTitle}
            </Link>

            {currentProduct.brand && (
              <>
                <ChevronRight fontSize="inherit" className="shrink-0 text-muted-foreground/60" />
                <Link
                  to={`/products?brand=${encodeURIComponent(currentProduct.brand)}`}
                  className="hover:text-primary transition-colors font-semibold shrink-0"
                >
                  {currentProduct.brand}
                </Link>
              </>
            )}

            <ChevronRight fontSize="inherit" className="shrink-0 text-muted-foreground/60" />
            <span className="text-foreground font-semibold truncate max-w-[200px] sm:max-w-[340px] shrink-0">
              {currentProduct.title}
            </span>
          </nav>
        </div>
      </div>

      {/* Main PDP Grid: Left Sticky Gallery + Right Commercial Intel Column */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 xl:gap-12 items-start">
          {/* ============================================================== */}
          {/* LEFT COLUMN: Sticky Image Gallery + Dual Action Buttons */}
          {/* ============================================================== */}
          <aside className="w-full lg:w-[460px] xl:w-[500px] shrink-0 lg:sticky lg:top-[120px] self-start z-20">
            <ProductImageZoom
              images={galleryImages}
              selectedImageIndex={selectedImageIndex}
              onSelectImage={(idx) => setSelectedImageIndex(idx)}
              title={currentProduct.title}
              product={currentProduct}
              variantId={matchingVariant?._id}
              onAddToCart={handleAddCartItem}
              onBuyNow={handleBuyNow}
              isOutOfStock={isOutOfStock}
              cartSuccess={cartSuccess}
            />

            {/* Cart Success Alert */}
            {cartSuccess && (
              <Alert severity="success" className="mt-3 rounded-xl text-xs font-bold shadow-xs">
                Item added to your shopping bag successfully!
              </Alert>
            )}
          </aside>

          {/* ============================================================== */}
          {/* RIGHT COLUMN: Full Product Details & Specifications */}
          {/* ============================================================== */}
          <main className="flex-1 min-w-0 flex flex-col gap-5 sm:gap-6">
            {/* Brand, Title & SKU */}
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Link
                  to={`/products?brand=${encodeURIComponent(currentProduct.brand || "")}`}
                  className="text-xs font-black uppercase tracking-wider text-primary hover:underline"
                >
                  {currentProduct.brand || "Authentic Brand"}
                </Link>

                {matchingVariant?.sku && (
                  <span className="text-[11px] font-mono text-muted-foreground bg-muted px-2 py-0.2 rounded-md">
                    SKU: {matchingVariant.sku}
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl lg:text-[26px] font-black text-foreground tracking-tight leading-snug">
                {currentProduct.title}
              </h1>

              {matchingVariant?.title && (
                <p className="text-xs font-bold text-primary mt-1">
                  Selected Edition: {matchingVariant.title}
                </p>
              )}
            </div>

            {/* Green Rating Pill & Assured Badge */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs">
              {/* Green Score Pill */}
              <div className="inline-flex items-center gap-1 bg-[#388e3c] text-white px-2 py-0.5 rounded-md font-extrabold shadow-2xs">
                <span>{effectiveRating.toFixed(1)}</span>
                <Star sx={{ fontSize: 13 }} className="text-white" />
              </div>

              <span className="text-muted-foreground font-semibold">
                {effectiveRatingCount.toLocaleString("en-IN")} Ratings & {effectiveReviewCount.toLocaleString("en-IN")} Reviews
              </span>

              {/* Zosh Assured Signature Badge */}
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-500/10 border border-sky-500/25 text-sky-700 dark:text-sky-300 font-black text-[11px] tracking-tight">
                <Verified sx={{ fontSize: 13 }} className="text-sky-600 dark:text-sky-400" />
                <span>Zosh Assured</span>
              </div>
            </div>

            {/* Special Price & Commercial Pricing Block */}
            <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-2">
              <div className="inline-block text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-md">
                Special Price
              </div>

              <div className="flex items-baseline flex-wrap gap-x-3 gap-y-1">
                <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground tracking-tight">
                  ₹{displaySellingPrice.toLocaleString("en-IN")}
                </span>

                {displayMrpPrice > displaySellingPrice && (
                  <>
                    <span className="text-sm sm:text-base line-through text-muted-foreground font-medium">
                      ₹{displayMrpPrice.toLocaleString("en-IN")}
                    </span>
                    <span className="text-sm sm:text-base font-black text-[#388e3c]">
                      {displayDiscountPercent}% off
                    </span>
                  </>
                )}
              </div>

              <p className="text-xs text-muted-foreground font-medium">
                Inclusive of all taxes. Free express shipping on this order.
              </p>
            </div>

            {/* Available Offers Box */}
            <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-foreground">
                <LocalOfferOutlined className="text-[#388e3c]" sx={{ fontSize: 18 }} />
                <span>Available Offers</span>
              </div>

              <div className="space-y-2.5 text-xs">
                {(showAllOffers ? AVAILABLE_BANK_OFFERS : AVAILABLE_BANK_OFFERS.slice(0, 3)).map(
                  (offer, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-[#388e3c] font-black mt-0.5 text-sm">🏷</span>
                      <p className="text-foreground/90 leading-snug">
                        <strong className="text-foreground font-bold">{offer.type}: </strong>
                        {offer.text}{" "}
                        <button
                          type="button"
                          onClick={() => alert(`Offer Terms & Conditions:\n\n${offer.text}\n• Minimum cart value may apply\n• Valid on online prepaid orders`)}
                          className="text-primary font-bold hover:underline cursor-pointer ml-1 inline-block"
                        >
                          {offer.linkText}
                        </button>
                      </p>
                    </div>
                  )
                )}
              </div>

              {/* View more offers toggle */}
              {AVAILABLE_BANK_OFFERS.length > 3 && (
                <button
                  type="button"
                  onClick={() => setShowAllOffers(!showAllOffers)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline cursor-pointer pt-1"
                >
                  <span>{showAllOffers ? "View less offers" : `View ${AVAILABLE_BANK_OFFERS.length - 3} more offers`}</span>
                  {showAllOffers ? <KeyboardArrowUp fontSize="small" /> : <KeyboardArrowDown fontSize="small" />}
                </button>
              )}
            </div>

            {/* Delivery Pincode & Serviceability Box */}
            <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <LocationOnOutlined className="text-primary" sx={{ fontSize: 17 }} />
                  Delivery Options
                </span>
                {deliveryInfo?.serviceable && (
                  <span className="font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full text-[11px]">
                    ✓ Available for Delivery
                  </span>
                )}
              </div>

              {location?.activeLocation?.headerSecondary && location.activeLocation.headerSecondary !== "Select Delivery Location" && (
                <p className="text-xs text-muted-foreground">
                  Delivering to: <strong className="text-foreground font-bold">{location.activeLocation.headerSecondary}</strong>
                </p>
              )}

              {/* Pincode Input Form */}
              <div className="flex gap-2 max-w-sm">
                <input
                  type="text"
                  placeholder="Enter 6-digit Pincode"
                  maxLength={6}
                  value={pincodeInput}
                  onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, ""))}
                  className="flex-1 bg-muted/60 border border-input rounded-xl px-3.5 py-2 text-xs text-foreground font-bold tracking-wider focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => handleCheckDelivery(pincodeInput)}
                  disabled={checkingDelivery || pincodeInput.trim().length !== 6}
                  sx={{
                    textTransform: "none",
                    fontWeight: 700,
                    borderRadius: "0.75rem",
                    px: 2.5,
                  }}
                >
                  {checkingDelivery ? <CircularProgress size={14} color="inherit" /> : "Check"}
                </Button>
              </div>

              {/* Estimated Delivery Status */}
              <div className="text-xs pt-1 space-y-1">
                {deliveryInfo?.serviceable ? (
                  <div className="flex items-center gap-2 text-foreground font-semibold">
                    <LocalShipping sx={{ fontSize: 16 }} className="text-emerald-500" />
                    <span>
                      Delivery by <strong className="text-foreground font-black">{estimatedDeliveryDate}</strong> |{" "}
                      <span className="text-[#388e3c] font-bold">Free</span>{" "}
                      <span className="line-through text-muted-foreground font-normal">₹40</span>
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground font-medium">
                    <LocalShipping sx={{ fontSize: 16 }} className="text-primary" />
                    <span>Usually delivered in 2–3 business days</span>
                  </div>
                )}

                <div className="flex items-center gap-4 text-[11px] text-muted-foreground font-medium pt-1">
                  <span>✓ Cash on Delivery Available</span>
                  <span>✓ 7 Days Replacement</span>
                </div>
              </div>
            </div>

            {/* Dynamic Variant Selectors (Colors, Sizes, RAM, Storage) with Cascading Combination Engine */}
            {resolution.attributeDefinitions.length > 0 && (
              <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-1 border-b border-border/60">
                  <span className="text-xs font-black uppercase tracking-wider text-foreground">
                    Product Options & Editions
                  </span>
                  {resolution.matchedOptionGroupName && (
                    <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                      Gallery: {resolution.matchedOptionGroupName}
                    </span>
                  )}
                </div>

                {resolution.attributeDefinitions.map((attr) => {
                  const isColorAttr = attr.key.toLowerCase().includes("color");
                  const isSizeAttr = attr.key.toLowerCase().includes("size");
                  const currentVal = resolution.selectedAttributes[attr.key] || "";

                  return (
                    <div key={attr.key} className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold uppercase tracking-wider text-muted-foreground">
                            {attr.name}:
                          </span>
                          <span className="font-black text-foreground capitalize">
                            {currentVal || "Select"}
                          </span>
                        </div>

                        {isSizeAttr && (
                          <button
                            type="button"
                            onClick={() => setShowSizeChart(true)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline hover:text-primary/80 transition-colors cursor-pointer"
                          >
                            <Straighten sx={{ fontSize: 14 }} /> Size Chart
                          </button>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {attr.options.map((option) => {
                          const isSelected = currentVal.toLowerCase() === option.toLowerCase();
                          const isValid = resolution.isOptionValid(attr.key, option);
                          const inStock = resolution.isOptionInStock(attr.key, option);

                          return (
                            <button
                              key={option}
                              type="button"
                              disabled={!isValid}
                              onClick={() => {
                                if (isValid) {
                                  resolution.selectOption(attr.key, option);
                                }
                              }}
                              title={
                                !isValid
                                  ? "Configuration not available"
                                  : !inStock
                                  ? "Out of stock in this combination"
                                  : `${attr.name}: ${option}`
                              }
                              className={`relative inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                                !isValid
                                  ? "border-dashed border-border/40 bg-muted/20 text-muted-foreground/40 cursor-not-allowed line-through"
                                  : isSelected
                                  ? "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/30 ring-2 ring-primary/20 cursor-pointer"
                                  : inStock
                                  ? "border-border bg-card text-foreground hover:border-primary/50 hover:bg-muted/50 cursor-pointer"
                                  : "border-border/80 bg-card/60 text-muted-foreground hover:border-border cursor-pointer"
                              }`}
                            >
                              {/* Color swatch dot */}
                              {isColorAttr && (
                                <span
                                  className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0 shadow-2xs"
                                  style={{
                                    backgroundColor: getColorStyle(option),
                                  }}
                                />
                              )}

                              <span className="capitalize">{option}</span>

                              {/* Out of Stock badge */}
                              {isValid && !inStock && (
                                <span className="text-[9px] uppercase tracking-wider font-extrabold px-1 rounded bg-destructive/15 text-destructive ml-0.5">
                                  OOS
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Quantity Selector & In Stock Indicator */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-card border border-border/80 shadow-xs">
              <div className="flex items-center gap-3">
                <span className="text-xs font-extrabold text-foreground uppercase tracking-wider">
                  Quantity:
                </span>
                <div className="flex items-center border border-input rounded-xl bg-card overflow-hidden shadow-2xs">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1 || isOutOfStock}
                    className="px-3 py-1.5 text-foreground hover:bg-muted transition-colors disabled:opacity-30 cursor-pointer"
                  >
                    <Remove sx={{ fontSize: 16 }} />
                  </button>
                  <span className="px-4 py-1 text-xs font-black text-foreground min-w-[36px] text-center">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= displayStock || isOutOfStock}
                    className="px-3 py-1.5 text-foreground hover:bg-muted transition-colors disabled:opacity-30 cursor-pointer"
                  >
                    <Add sx={{ fontSize: 16 }} />
                  </button>
                </div>
              </div>

              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                  isOutOfStock
                    ? "bg-destructive/15 text-destructive border border-destructive/25"
                    : displayStock <= 5
                    ? "bg-amber-500/15 text-amber-600 border border-amber-500/25"
                    : "bg-emerald-500/15 text-emerald-600 border border-emerald-500/25"
                }`}
              >
                {isOutOfStock
                  ? "Currently Out of Stock"
                  : displayStock <= 5
                  ? `Hurry, only ${displayStock} left in stock`
                  : "In Stock & Ready to Ship"}
              </span>
            </div>

            {/* Highlights & Trust Services Grid */}
            <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <Stars className="text-amber-500" sx={{ fontSize: 18 }} />
                <span>Product Highlights</span>
              </h3>

              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {(currentProduct.highlights && currentProduct.highlights.length > 0
                  ? currentProduct.highlights
                  : [
                      "100% Genuine product backed by official brand warranty",
                      "Carefully packaged and verified for direct vendor dispatch",
                      "Fast delivery with live doorstep tracking",
                      "7-day replacement guarantee in case of damaged transit",
                    ]
                ).map((point: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 text-foreground/90 font-medium">
                    <span className="text-primary font-black">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>

              {/* Marketplace Services Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-border/70 text-xs">
                <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60 flex flex-col items-center text-center gap-1">
                  <AssignmentReturnOutlined className="text-primary" sx={{ fontSize: 20 }} />
                  <span className="font-bold text-[11px] text-foreground">7 Days Replacement</span>
                </div>
                <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60 flex flex-col items-center text-center gap-1">
                  <LocalShipping className="text-primary" sx={{ fontSize: 20 }} />
                  <span className="font-bold text-[11px] text-foreground">Free Delivery</span>
                </div>
                <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60 flex flex-col items-center text-center gap-1">
                  <WorkspacePremiumOutlined className="text-primary" sx={{ fontSize: 20 }} />
                  <span className="font-bold text-[11px] text-foreground">1 Year Warranty</span>
                </div>
                <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60 flex flex-col items-center text-center gap-1">
                  <AccountBalanceWalletOutlined className="text-primary" sx={{ fontSize: 20 }} />
                  <span className="font-bold text-[11px] text-foreground">Cash on Delivery</span>
                </div>
              </div>
            </div>

            {/* Seller Information (Interactive Verified Seller Card) */}
            <div
              onClick={() => setShowSellerDetails(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setShowSellerDetails(true);
                }
              }}
              role="button"
              tabIndex={0}
              aria-label="View seller details and performance profile"
              className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs hover:border-primary/50 hover:bg-muted/20 transition-all flex items-center justify-between gap-4 cursor-pointer group focus:outline-hidden focus:ring-2 focus:ring-primary/40"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 group-hover:scale-105 transition-transform">
                  <StorefrontOutlined sx={{ fontSize: 22 }} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                      Sold By
                    </span>
                    {currentProduct.seller?.accountStatus === "ACTIVE" && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded-full">
                        <Verified sx={{ fontSize: 11 }} />
                        Verified
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <h4 className="text-sm font-black text-foreground group-hover:text-primary transition-colors">
                      {currentProduct.seller?.businessDetails?.businessName ||
                        currentProduct.seller?.sellerName ||
                        "Zosh Marketplace Certified Merchant"}
                    </h4>
                    {currentProduct.seller?.rating ? (
                      <span className="inline-flex items-center gap-0.5 bg-[#388e3c] text-white text-[10px] font-black px-1.5 py-0.5 rounded">
                        {Number(currentProduct.seller.rating).toFixed(1)} ★
                      </span>
                    ) : null}
                  </div>
                  <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
                    Zosh Express Logistics • 7 Days Replacement • GST Invoice Available
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-bold text-primary shrink-0">
                <span className="hidden sm:inline">About this seller</span>
                <ChevronRight sx={{ fontSize: 18 }} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

            {/* Contextual AI Shopping Assistant */}
            <ContextualPDPAskAI product={currentProduct} />
          </main>
        </div>

        {/* ============================================================== */}
        {/* PRICE INTELLIGENCE & HISTORICAL CHART WIDGET */}
        {/* ============================================================== */}
        {currentProduct?._id && (
          <div className="mt-10">
            <PriceHistoryWidget
              productId={currentProduct._id}
              currentPrice={displaySellingPrice}
            />
          </div>
        )}

        {/* ============================================================== */}
        {/* PRODUCT SPECIFICATIONS (Detailed Tabular Style) */}
        {/* ============================================================== */}
        <div className="mt-10 p-6 sm:p-8 rounded-3xl bg-card border border-border/80 shadow-xs space-y-6">
          <div className="border-b border-border pb-4">
            <h2 className="text-lg sm:text-xl font-black text-foreground tracking-tight uppercase">
              Specifications
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Detailed technical and commercial attributes for this product
            </p>
          </div>

          {/* Description Block */}
          {currentProduct.description && (
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                Product Description
              </h3>
              <p
                className={`text-xs sm:text-sm text-foreground/90 leading-relaxed whitespace-pre-line ${
                  !descExpanded ? "line-clamp-4" : ""
                }`}
              >
                {currentProduct.description}
              </p>
              {currentProduct.description.length > 220 && (
                <button
                  type="button"
                  onClick={() => setDescExpanded(!descExpanded)}
                  className="text-xs font-bold text-primary hover:underline cursor-pointer"
                >
                  {descExpanded ? "Read Less ▴" : "Read More ▾"}
                </button>
              )}
            </div>
          )}

          {/* Specifications Table (2-Column Format) */}
          {currentProduct.specifications && currentProduct.specifications.length > 0 ? (
            <div className="pt-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-3">
                General & Technical Specs
              </h3>
              <div className="border border-border/80 rounded-2xl overflow-hidden divide-y divide-border/80">
                {currentProduct.specifications.map((spec: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-center py-3 px-4 text-xs bg-card hover:bg-muted/30 transition-colors"
                  >
                    <span className="w-full sm:w-1/3 text-muted-foreground font-semibold">
                      {spec.name}
                    </span>
                    <span className="w-full sm:w-2/3 font-bold text-foreground mt-0.5 sm:mt-0">
                      {spec.value} {spec.unit || ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="pt-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-3">
                General Overview
              </h3>
              <div className="border border-border/80 rounded-2xl overflow-hidden divide-y divide-border/80 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center py-3 px-4 bg-card">
                  <span className="w-full sm:w-1/3 text-muted-foreground font-semibold">Brand</span>
                  <span className="w-full sm:w-2/3 font-bold text-foreground">{currentProduct.brand || "Zosh Certified"}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center py-3 px-4 bg-card">
                  <span className="w-full sm:w-1/3 text-muted-foreground font-semibold">Category</span>
                  <span className="w-full sm:w-2/3 font-bold text-foreground capitalize">{categoryTitle}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center py-3 px-4 bg-card">
                  <span className="w-full sm:w-1/3 text-muted-foreground font-semibold">Warranty Summary</span>
                  <span className="w-full sm:w-2/3 font-bold text-foreground">{currentProduct.warranty?.summary || "1 Year Brand Warranty"}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center py-3 px-4 bg-card">
                  <span className="w-full sm:w-1/3 text-muted-foreground font-semibold">Domestic Warranty</span>
                  <span className="w-full sm:w-2/3 font-bold text-foreground">1 Year</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* RATINGS & REVIEWS SECTION */}
        {/* ============================================================== */}
        <div id="customer-reviews-section" className="mt-10 p-6 sm:p-8 rounded-3xl bg-card border border-border/80 shadow-xs space-y-6 scroll-mt-24">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-foreground tracking-tight uppercase">
                Ratings & Customer Reviews
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Authentic feedback from verified marketplace buyers
              </p>
            </div>

            {jwt && (
              <button
                type="button"
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-all shadow-xs cursor-pointer self-start sm:self-auto"
              >
                {showReviewForm ? "Cancel Review" : "Rate Product & Write Review"}
              </button>
            )}
          </div>

          {/* Score Card & Rating Distribution Bars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-5 rounded-2xl bg-muted/40 border border-border/70">
            {/* Overall Score Box */}
            <div className="flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-border pb-4 md:pb-0 md:pr-6">
              <div className="inline-flex items-center gap-1.5 text-3xl sm:text-4xl font-black text-[#388e3c]">
                <span>{effectiveRating.toFixed(1)}</span>
                <Star sx={{ fontSize: 32 }} className="text-[#388e3c]" />
              </div>
              <p className="text-xs font-bold text-muted-foreground mt-1">
                {effectiveRatingCount.toLocaleString("en-IN")} Ratings &
              </p>
              <p className="text-xs font-bold text-muted-foreground">
                {effectiveReviewCount.toLocaleString("en-IN")} Reviews
              </p>
            </div>

            {/* 5-Star Distribution Bars */}
            <div className="md:col-span-2 flex flex-col justify-center space-y-1.5 text-xs">
              {[
                { star: 5, pct: 68, color: "bg-[#388e3c]" },
                { star: 4, pct: 20, color: "bg-[#388e3c]" },
                { star: 3, pct: 7, color: "bg-[#388e3c]" },
                { star: 2, pct: 3, color: "bg-amber-500" },
                { star: 1, pct: 2, color: "bg-red-500" },
              ].map((item) => (
                <div key={item.star} className="flex items-center gap-2">
                  <span className="w-6 font-bold text-foreground flex items-center gap-0.5 justify-end">
                    {item.star} <Star sx={{ fontSize: 11 }} className="text-amber-500" />
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      style={{ width: `${item.pct}%` }}
                      className={`h-full rounded-full ${item.color}`}
                    />
                  </div>
                  <span className="w-9 text-right text-muted-foreground text-[11px] font-medium">
                    {item.pct}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Aspect-Based Review Summary */}
          {currentProduct?._id && (
            <AIReviewSummary productId={currentProduct._id} />
          )}

          {/* Review Form Modal/Drawer */}
          {showReviewForm && (
            <form
              onSubmit={handleReviewSubmit}
              className="p-5 sm:p-6 bg-card border border-primary/30 rounded-2xl space-y-4 max-w-xl shadow-md"
            >
              <h4 className="text-sm font-black text-foreground uppercase tracking-wider">
                Rate & Review This Product
              </h4>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Overall Rating
                </label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className="p-1 cursor-pointer hover:scale-110 transition-transform"
                    >
                      <Star
                        sx={{ fontSize: 26 }}
                        className={star <= reviewRating ? "text-amber-400" : "text-muted-foreground/30"}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Review Title
                </label>
                <input
                  type="text"
                  required
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  placeholder="e.g. Excellent build quality and super fast delivery!"
                  className="w-full px-3.5 py-2 border border-input rounded-xl text-xs bg-muted/50 text-foreground font-medium focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Detailed Feedback
                </label>
                <textarea
                  rows={3}
                  required
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Tell other shoppers about your experience with features, performance, and seller service."
                  className="w-full px-3.5 py-2 border border-input rounded-xl text-xs bg-muted/50 text-foreground font-medium focus:outline-none focus:border-primary"
                />
              </div>

              <Button
                type="submit"
                disabled={review.submitting}
                variant="contained"
                color="primary"
                size="small"
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  borderRadius: "0.75rem",
                  px: 3,
                }}
              >
                {review.submitting ? "Submitting Review..." : "Submit Review"}
              </Button>
            </form>
          )}

          {/* Customer Reviews List (Verified Reviews) */}
          <div className="space-y-4 pt-2">
            {review.reviews.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-xs font-medium">
                No reviews yet for this product. Be the first verified buyer to leave feedback!
              </div>
            ) : (
              <div className="divide-y divide-border/80">
                {review.reviews.map((rev) => (
                  <div key={rev._id} className="py-4 first:pt-0 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-0.5 bg-[#388e3c] text-white text-[11px] font-black px-1.5 py-0.2 rounded">
                        {rev.rating} ★
                      </span>
                      {rev.title && (
                        <h4 className="text-xs sm:text-sm font-bold text-foreground">
                          {rev.title}
                        </h4>
                      )}
                    </div>

                    <p className="text-xs sm:text-[13px] text-foreground/80 leading-relaxed">
                      {rev.comment}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-1">
                      <span className="font-bold text-foreground">
                        {rev.user?.fullName || "Verified Buyer"}
                      </span>

                      {rev.verifiedPurchase && (
                        <span className="inline-flex items-center gap-0.5 text-emerald-600 font-bold">
                          <VerifiedUserOutlined sx={{ fontSize: 13 }} /> Verified Purchase
                        </span>
                      )}

                      <span>•</span>
                      <span>
                        {new Date(rev.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>

                      <div className="ml-auto flex items-center gap-1 text-muted-foreground hover:text-foreground cursor-pointer">
                        <ThumbUpOutlined sx={{ fontSize: 13 }} />
                        <span>12</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* COMPLETE THE LOOK / OUTFIT RECOMMENDATION RAIL */}
        {/* ============================================================== */}
        {currentProduct && <CompleteTheLook currentProduct={currentProduct} />}

        {/* ============================================================== */}
        {/* SIMILAR PRODUCTS RECOMMENDATION RAIL */}
        {/* ============================================================== */}
        <section className="mt-12">
          <div className="mb-4">
            <h2 className="text-lg sm:text-xl font-black text-foreground tracking-tight">
              Similar Products You Might Like
            </h2>
            <p className="text-xs text-muted-foreground">
              Based on your browsing and category preferences
            </p>
          </div>
          <SimilarProducts productId={currentProduct?._id || productId} />
        </section>
      </div>

      {/* ============================================================== */}
      {/* SIZE CHART & FIT GUIDANCE MODAL */}
      {/* ============================================================== */}
      <SizeChartModal
        isOpen={showSizeChart}
        onClose={() => setShowSizeChart(false)}
        selectedSize={resolution.selectedAttributes["size"] || resolution.selectedAttributes["Size"]}
        onSelectSize={(size) => {
          const sizeAttr = resolution.attributeDefinitions.find((a) =>
            a.key.toLowerCase().includes("size")
          );
          if (sizeAttr) {
            resolution.selectOption(sizeAttr.key, size);
          }
        }}
        category={
          currentProduct?.category?.name?.toLowerCase().includes("shoe") ||
          currentProduct?.category?.name?.toLowerCase().includes("footwear")
            ? "footwear"
            : currentProduct?.category?.name?.toLowerCase().includes("women")
            ? "women"
            : currentProduct?.category?.name?.toLowerCase().includes("kid")
            ? "kids"
            : "men"
        }
      />

      {/* ============================================================== */}
      {/* SELLER DETAILS MODAL / MOBILE BOTTOM SHEET */}
      {/* ============================================================== */}
      <SellerDetailsModal
        isOpen={showSellerDetails}
        onClose={() => setShowSellerDetails(false)}
        sellerId={
          typeof currentProduct?.seller === "string"
            ? currentProduct.seller
            : currentProduct?.seller?._id
        }
        initialSeller={
          typeof currentProduct?.seller === "object" ? currentProduct.seller : null
        }
      />

      {/* ============================================================== */}
      {/* MOBILE STICKY BOTTOM COMMERCE BAR */}
      {/* ============================================================== */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-2.5 pb-[max(10px,env(safe-area-inset-bottom))] bg-card/95 backdrop-blur-md border-t border-border z-40 flex items-center justify-between gap-3 shadow-2xl">
        <div className="min-w-0 pr-1">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-base font-black text-foreground tracking-tight">
              ₹{displaySellingPrice?.toLocaleString("en-IN")}
            </span>
            {displayMrpPrice && displayMrpPrice > displaySellingPrice && (
              <span className="text-xs text-muted-foreground line-through">
                ₹{displayMrpPrice?.toLocaleString("en-IN")}
              </span>
            )}
          </div>
          {displayDiscountPercent && displayDiscountPercent > 0 ? (
            <span className="text-[10px] font-extrabold text-[#388e3c]">
              {displayDiscountPercent}% Off
            </span>
          ) : isOutOfStock ? (
            <span className="text-[10px] font-extrabold text-destructive">
              Out of stock
            </span>
          ) : (
            <span className="text-[10px] font-bold text-emerald-600">
              In Stock
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-1 max-w-[260px]">
          <button
            type="button"
            onClick={handleAddCartItem}
            disabled={isOutOfStock}
            className={`flex-1 flex items-center justify-center gap-1 py-2.5 px-3 rounded-xl text-white font-black text-xs uppercase tracking-wider transition-all select-none cursor-pointer ${
              isOutOfStock
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-[#ff9f00] hover:bg-[#f39700] active:scale-95 shadow-sm"
            }`}
          >
            <AddShoppingCart sx={{ fontSize: 15 }} />
            <span>{cartSuccess ? "Added" : "Cart"}</span>
          </button>

          <button
            type="button"
            onClick={handleBuyNow}
            disabled={isOutOfStock}
            className={`flex-1 flex items-center justify-center gap-1 py-2.5 px-3 rounded-xl text-white font-black text-xs uppercase tracking-wider transition-all select-none cursor-pointer ${
              isOutOfStock
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-[#fb641b] hover:bg-[#e85b17] active:scale-95 shadow-sm"
            }`}
          >
            <FlashOn sx={{ fontSize: 15 }} />
            <span>Buy Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
