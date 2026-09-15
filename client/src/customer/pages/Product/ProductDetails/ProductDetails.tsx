import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Add,
  AddShoppingCart,
  LocalShipping,
  Remove,
  Shield,
  Star,
  Wallet,
  WorkspacePremium,
  VerifiedUserOutlined,
  LocationOnOutlined,
  StorefrontOutlined,
  Stars,
} from "@mui/icons-material";
import { Button, Alert, CircularProgress } from "@mui/material";
import SimilarProducts from "./SimilarProducts";
import PriceHistoryWidget from "./PriceHistoryWidget";
import AIReviewSummary from "./AIReviewSummary";
import { aiTracker } from "../../../../services/aiEventTracker";
import {
  useAppDispatch,
  useAppSelector,
} from "../../../../Redux Toolkit/Store";
import { fetchProductById } from "../../../../Redux Toolkit/features/customer/ProductSlice";
import { useParams, useNavigate } from "react-router-dom";
import { addItemToCart } from "../../../../Redux Toolkit/features/customer/CartSlice";
import {
  fetchProductReviews,
  checkCanReview,
  submitProductReview,
} from "../../../../Redux Toolkit/features/customer/ReviewSlice";
import { Api } from "../../../../config/Api";
import { buildAuthRedirectUrl } from "../../../../utils/navigation";
import SaveButton from "../../Wishlist/components/SaveButton";
import { saveRecentlyViewedProduct } from "../../../../utils/recentlyViewed";

const ProductDetails: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { product, review, location } = useAppSelector((store) => store);
  const jwt = localStorage.getItem("jwt");

  const currentProduct = product?.product;

  // Track recently viewed products
  useEffect(() => {
    if (currentProduct && currentProduct._id) {
      try {
        const stored = localStorage.getItem("zosh_recently_viewed");
        const list: any[] = stored ? JSON.parse(stored) : [];
        const filtered = list.filter((p: any) => p._id !== currentProduct._id);
        const updated = [
          {
            _id: currentProduct._id,
            title: currentProduct.title,
            brand: currentProduct.brand,
            images: currentProduct.images,
            sellingPrice: currentProduct.sellingPrice,
            mrpPrice: currentProduct.mrpPrice,
            ratings: currentProduct.ratings,
            category: currentProduct.category,
            countInStock: currentProduct.countInStock,
          },
          ...filtered,
        ].slice(0, 10);
        localStorage.setItem("zosh_recently_viewed", JSON.stringify(updated));

        // Track AI product view event
        aiTracker.trackProductView(
          currentProduct._id,
          currentProduct.category?.categoryId || currentProduct.category?._id,
          currentProduct.brand,
          currentProduct.sellingPrice
        );
      } catch {
        // ignore
      }
    }
  }, [currentProduct]);

  // Selected Media
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [cartSuccess, setCartSuccess] = useState(false);

  // Variant Selection State (key -> selected value, e.g. { color: "Midnight Black", storage: "256GB" })
  const [selectedAttrMap, setSelectedAttrMap] = useState<Record<string, string>>({});

  // Review Form State
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);

  // Delivery Serviceability State (connected to Redux activeLocation)
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
        message: "Delivery not available for this area",
      });
    } finally {
      setCheckingDelivery(false);
    }
  }, []);

  // Automatically check delivery serviceability when activePin changes
  useEffect(() => {
    const pinToCheck = activePin && activePin.length === 6
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
            message: "Delivery not available for this area",
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

  // Persist viewed product to device browsing history
  useEffect(() => {
    if (currentProduct?._id) {
      saveRecentlyViewedProduct(currentProduct);
    }
  }, [currentProduct]);

  // Extract distinct variant attributes from product variants
  const variantAttributesList = useMemo(() => {
    if (!currentProduct?.hasVariants || !currentProduct?.variants?.length) return [];

    const attrMap: Record<string, { name: string; key: string; options: Set<string> }> = {};
    currentProduct.variants.forEach((v: any) => {
      if (v.status !== "INACTIVE" && Array.isArray(v.attributes)) {
        v.attributes.forEach((attr: any) => {
          if (!attrMap[attr.key]) {
            attrMap[attr.key] = {
              name: attr.name || attr.key,
              key: attr.key,
              options: new Set<string>(),
            };
          }
          if (attr.value) {
            attrMap[attr.key].options.add(attr.value);
          }
        });
      }
    });

    return Object.values(attrMap).map((item) => ({
      name: item.name,
      key: item.key,
      options: Array.from(item.options),
    }));
  }, [currentProduct]);

  // Derive effective selection (fallback to first available option)
  const effectiveAttrMap = useMemo(() => {
    const map: Record<string, string> = {};
    variantAttributesList.forEach((attr) => {
      map[attr.key] = selectedAttrMap[attr.key] || attr.options[0] || "";
    });
    return map;
  }, [variantAttributesList, selectedAttrMap]);

  // Find exact matching variant based on current selections
  const matchingVariant = useMemo(() => {
    if (!currentProduct?.hasVariants || !currentProduct?.variants?.length) return null;

    return (
      currentProduct.variants.find((v: any) => {
        if (v.status === "INACTIVE" || !Array.isArray(v.attributes)) return false;
        return v.attributes.every((attr: any) => effectiveAttrMap[attr.key] === attr.value);
      }) || currentProduct.variants[0]
    );
  }, [currentProduct, effectiveAttrMap]);

  // Effective prices and stock
  const displaySellingPrice = matchingVariant
    ? matchingVariant.sellingPrice
    : currentProduct?.sellingPrice || 0;
  const displayMrpPrice = matchingVariant
    ? matchingVariant.mrpPrice
    : currentProduct?.mrpPrice || 0;
  const displayDiscountPercent =
    displayMrpPrice > displaySellingPrice
      ? Math.round(((displayMrpPrice - displaySellingPrice) / displayMrpPrice) * 100)
      : 0;
  const displayStock = matchingVariant
    ? matchingVariant.countInStock
    : currentProduct?.countInStock || 0;
  const isOutOfStock = displayStock <= 0;

  // Images to display: prioritize matching variant's image if present
  const galleryImages: string[] = useMemo(() => {
    const rawList = matchingVariant?.images?.length
      ? [
          ...matchingVariant.images,
          ...(currentProduct?.images || []).filter(
            (img: any) => !matchingVariant.images.includes(img)
          ),
        ]
      : currentProduct?.images || [];

    const stringUrls = rawList
      .map((img: any) => (typeof img === "object" ? img.url || img.relativePath : img))
      .filter(Boolean);

    return Array.from(new Set(stringUrls));
  }, [matchingVariant, currentProduct]);

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
              image: matchingVariant.images?.[0] || galleryImages[0],
            }
          : undefined,
        quantity,
      })
    );

    setCartSuccess(true);
    setTimeout(() => setCartSuccess(false), 3500);
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

  if (!currentProduct) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading product details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-28 sm:py-10 min-h-[calc(100vh-140px)] w-full flex flex-col gap-12 sm:gap-16">
      {/* Product Hero: Gallery + Buying Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-16">
        {/* Left: Gallery */}
        <section className="flex flex-col-reverse lg:flex-row gap-4">
          {/* Thumbnails */}
          {galleryImages.length > 1 && (
            <div className="w-full lg:w-20 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto max-h-[500px] scrollbar-none">
              {galleryImages.map((image, index) => (
                <button
                  type="button"
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`w-16 h-16 lg:w-full lg:h-20 rounded-xl overflow-hidden border-2 transition-all p-1 bg-card cursor-pointer shrink-0 ${
                    selectedImageIndex === index
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-border hover:border-primary/40 opacity-70 hover:opacity-100"
                  }`}
                >
                  <img
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-contain"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Main Stage Image */}
          <div className="flex-1 bg-card border border-border/80 rounded-3xl p-6 shadow-sm flex items-center justify-center min-h-[380px] lg:min-h-[500px]">
            <img
              src={galleryImages[selectedImageIndex] || galleryImages[0]}
              alt={currentProduct.title}
              className="max-h-[460px] w-auto object-contain transition-transform hover:scale-105 duration-300"
            />
          </div>
        </section>

        {/* Right: Commercial Information & Options */}
        <section className="flex flex-col gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                {currentProduct.brand || "Authentic"}
              </span>
              {matchingVariant?.sku && (
                <span className="text-[11px] font-mono text-muted-foreground">
                  SKU: {matchingVariant.sku}
                </span>
              )}
            </div>
            <h1 className="font-extrabold text-2xl lg:text-3xl text-foreground tracking-tight">
              {currentProduct.title}
            </h1>
            {matchingVariant?.title && (
              <p className="text-sm font-semibold text-primary mt-1">
                Selected: {matchingVariant.title}
              </p>
            )}
          </div>

          {/* Rating Summary */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-warning-soft border border-warning/25 px-2.5 py-1 rounded-lg">
              <span className="text-xs font-bold text-foreground">
                {review.averageRating > 0 ? review.averageRating.toFixed(1) : "5.0"}
              </span>
              <Star sx={{ fontSize: 16 }} className="text-amber-500" />
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              {review.totalReviews} verified reviews
            </span>
          </div>

          {/* Pricing */}
          <div className="flex flex-col gap-1 bg-primary/5 p-5 rounded-xl border border-primary/20 shadow-sm">
            <div className="flex items-baseline gap-3">
              <span className="font-black text-2xl lg:text-3xl text-foreground">
                ₹{displaySellingPrice.toLocaleString("en-IN")}
              </span>
              {displayMrpPrice > displaySellingPrice && (
                <>
                  <span className="text-sm line-through text-muted-foreground">
                    ₹{displayMrpPrice.toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                    {displayDiscountPercent}% OFF
                  </span>
                </>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground font-medium">
              Inclusive of all taxes. Free express shipping on this order.
            </p>
          </div>

          {/* Dynamic Variant Attributes Selector */}
          {variantAttributesList.length > 0 && (
            <div className="flex flex-col gap-4 pt-2">
              {variantAttributesList.map((attr) => (
                <div key={attr.key} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-foreground uppercase tracking-wide">
                      Select {attr.name}:
                    </span>
                    <span className="font-semibold text-primary">
                      {effectiveAttrMap[attr.key]}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {attr.options.map((option) => {
                      const isSelected = effectiveAttrMap[attr.key] === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => {
                            setSelectedAttrMap((prev) => ({
                              ...prev,
                              [attr.key]: option,
                            }));
                          }}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? "bg-primary text-primary-foreground shadow-md shadow-primary/25 ring-2 ring-primary/30"
                              : "bg-card text-foreground border border-input hover:border-primary/50 hover:bg-muted/60"
                          }`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Stock Status */}
          <div className="flex items-center gap-2">
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                isOutOfStock
                  ? "bg-destructive-soft text-destructive border border-destructive/25"
                  : displayStock <= 5
                  ? "bg-warning-soft text-warning border border-warning/25"
                  : "bg-success-soft text-success border border-success/25"
              }`}
            >
              {isOutOfStock
                ? "Out of Stock"
                : displayStock <= 5
                ? `Only ${displayStock} left in stock - order soon`
                : "In Stock & Ready to Ship"}
            </span>
          </div>

          {/* Quantity Controls */}
          {!isOutOfStock && (
            <div className="flex items-center gap-4 pt-1">
              <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                Quantity:
              </span>
              <div className="flex items-center border border-input rounded-xl bg-card overflow-hidden shadow-sm">
                <button
                  type="button"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                  className="px-3 py-1.5 text-foreground hover:bg-muted transition-colors disabled:opacity-30 cursor-pointer"
                >
                  <Remove sx={{ fontSize: 16 }} />
                </button>
                <span className="px-4 py-1 text-xs font-bold text-foreground min-w-[36px] text-center">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= displayStock}
                  className="px-3 py-1.5 text-foreground hover:bg-muted transition-colors disabled:opacity-30 cursor-pointer"
                >
                  <Add sx={{ fontSize: 16 }} />
                </button>
              </div>
            </div>
          )}

          {/* Cart Success Alert */}
          {cartSuccess && (
            <Alert severity="success" sx={{ borderRadius: "0.75rem", fontSize: "12px" }}>
              Item added to your shopping bag successfully!
            </Alert>
          )}

          {/* Delivery Pincode Checker */}
          <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <LocationOnOutlined className="text-primary" sx={{ fontSize: 16 }} />
                Check Delivery Serviceability
              </span>
              {deliveryInfo?.serviceable && (
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  Serviceable Area
                </span>
              )}
            </div>

            {location?.activeLocation?.headerSecondary && location.activeLocation.headerSecondary !== "Select Delivery Location" && (
              <p className="text-[11px] text-muted-foreground">
                Delivering to: <span className="font-semibold text-foreground">{location.activeLocation.headerSecondary}</span>
              </p>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter 6-digit Pincode"
                maxLength={6}
                value={pincodeInput}
                onChange={(e) => setPincodeInput(e.target.value)}
                className="flex-1 bg-muted/60 border border-input rounded-xl px-3 py-1.5 text-xs text-foreground font-semibold focus:outline-none focus:border-primary"
              />
              <Button
                size="small"
                variant="outlined"
                onClick={() => handleCheckDelivery(pincodeInput)}
                disabled={checkingDelivery || pincodeInput.trim().length !== 6}
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  borderRadius: "0.65rem",
                  minWidth: "75px",
                }}
              >
                {checkingDelivery ? <CircularProgress size={14} /> : "Check"}
              </Button>
            </div>

            {deliveryInfo && (
              <div className="text-[11px] pt-1">
                {deliveryInfo.serviceable ? (
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <LocalShipping sx={{ fontSize: 15 }} />
                    <span>{deliveryInfo.message || "Express delivery available"}</span>
                  </div>
                ) : (
                  <span className="text-destructive font-medium">
                    {deliveryInfo.message || "Delivery not available for this area"}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Marketplace Seller Information Card */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border/80 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <StorefrontOutlined sx={{ fontSize: 20 }} />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                  Sold By
                </span>
                <h4 className="text-xs sm:text-sm font-bold text-foreground">
                  {currentProduct.seller?.businessDetails?.businessName ||
                    currentProduct.seller?.sellerName ||
                    "Zosh Certified Partner"}
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  Direct vendor fulfillment & quality verified
                </p>
              </div>
            </div>
          </div>

          {/* Enterprise Key Highlights */}
          {currentProduct.highlights && currentProduct.highlights.length > 0 && (
            <div className="p-4 rounded-2xl bg-card border border-border/80 flex flex-col gap-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <Stars className="text-amber-500" sx={{ fontSize: 16 }} />
                <span>Product Highlights</span>
              </h4>
              <ul className="flex flex-col gap-1.5">
                {currentProduct.highlights.map((point: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-foreground/90">
                    <span className="text-primary font-bold">✓</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Warranty & Return Policy Badges */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-muted/50 border border-border text-xs flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Warranty</span>
              <span className="font-semibold text-foreground mt-0.5">
                {currentProduct.warranty?.summary || "1 Year Official Warranty"}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-muted/50 border border-border text-xs flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Returns</span>
              <span className="font-semibold text-foreground mt-0.5">
                {currentProduct.returnPolicy?.windowDays
                  ? `${currentProduct.returnPolicy.windowDays} Days Return Policy`
                  : "7 Days Replacement"}
              </span>
            </div>
          </div>

          {/* Action CTA Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              onClick={handleAddCartItem}
              disabled={isOutOfStock}
              startIcon={<AddShoppingCart />}
              fullWidth
              variant="contained"
              color="primary"
              sx={{
                py: "0.95rem",
                borderRadius: "0.85rem",
                fontSize: "14px",
                fontWeight: 700,
                textTransform: "none",
                boxShadow: "0 4px 14px rgba(13, 148, 136, 0.35)",
              }}
            >
              {isOutOfStock ? "Out of Stock" : "Add to Bag"}
            </Button>
            <SaveButton
              product={currentProduct}
              variantId={matchingVariant?._id}
              variant="button"
              size="medium"
            />
          </div>

          {/* Trust Guarantees */}
          <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-muted/30 border border-border/60 text-xs text-muted-foreground font-medium">
            <div className="flex items-center gap-2">
              <Shield className="text-primary" sx={{ fontSize: 18 }} />
              <span>100% Genuine Item</span>
            </div>
            <div className="flex items-center gap-2">
              <LocalShipping className="text-primary" sx={{ fontSize: 18 }} />
              <span>Fast Express Dispatch</span>
            </div>
            <div className="flex items-center gap-2">
              <WorkspacePremium className="text-primary" sx={{ fontSize: 18 }} />
              <span>7-Day Return Guarantee</span>
            </div>
            <div className="flex items-center gap-2">
              <Wallet className="text-primary" sx={{ fontSize: 18 }} />
              <span>Secure Digital Payment</span>
            </div>
          </div>
        </section>
      </div>

      {/* Price Intelligence & Trend Chart */}
      {currentProduct?._id && (
        <PriceHistoryWidget
          productId={currentProduct._id}
          currentPrice={displaySellingPrice}
        />
      )}

      {/* Description & Dynamic Specifications Table */}
      <div className="bg-card rounded-3xl border border-border shadow-sm p-6 lg:p-10 space-y-8">
        <div>
          <h2 className="text-base font-bold text-foreground uppercase tracking-wider mb-3">
            Product Overview
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {currentProduct.description}
          </p>
        </div>

        {/* Specifications Matrix */}
        {currentProduct.specifications && currentProduct.specifications.length > 0 && (
          <div className="border-t border-border pt-6">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">
              Detailed Specifications
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {currentProduct.specifications.map((spec: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-muted/60 border border-border text-xs"
                >
                  <span className="font-semibold text-muted-foreground">{spec.name}</span>
                  <span className="font-bold text-foreground">
                    {spec.value} {spec.unit || ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Real Customer Reviews & Ratings */}
      <div className="bg-card rounded-3xl border border-border shadow-sm p-6 lg:p-10 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <h2 className="text-lg font-bold text-foreground">Customer Ratings & Reviews</h2>
            <p className="text-xs text-muted-foreground">
              Verified commercial feedback from shoppers who bought this item.
            </p>
          </div>

          {jwt && (
            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm cursor-pointer w-fit"
            >
              {showReviewForm ? "Cancel Review" : "Write a Review"}
            </button>
          )}
        </div>

        {/* AI Aspect-Based Review Summary */}
        {currentProduct?._id && (
          <AIReviewSummary productId={currentProduct._id} />
        )}

        {/* Review Submission Form */}
        {showReviewForm && (
          <form
            onSubmit={handleReviewSubmit}
            className="p-6 bg-muted/60 border border-border rounded-xl space-y-4 max-w-xl"
          >
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Share Your Experience
            </h4>

            {/* Star selector */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Your Rating
              </label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setReviewRating(star)}
                    className="p-1 cursor-pointer"
                  >
                    <Star
                      sx={{ fontSize: 24 }}
                      className={
                        star <= reviewRating ? "text-amber-400" : "text-muted-foreground/30"
                      }
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Headline / Title
              </label>
              <input
                type="text"
                required
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
                placeholder="e.g. Outstanding performance and sleek design!"
                className="w-full px-3 py-2 border border-input rounded-xl text-xs bg-card text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Detailed Review
              </label>
              <textarea
                rows={3}
                required
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Describe your satisfaction with build quality, battery, performance, etc."
                className="w-full px-3 py-2 border border-input rounded-xl text-xs bg-card text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <button
              type="submit"
              disabled={review.submitting}
              className="px-5 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
            >
              {review.submitting ? "Submitting..." : "Submit Review"}
            </button>
          </form>
        )}

        {/* Reviews List */}
        {review.reviews.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-xs">
            No reviews yet for this product. Be the first customer to leave feedback!
          </div>
        ) : (
          <div className="flex flex-col gap-4 divide-y divide-border">
            {review.reviews.map((rev) => (
              <div key={rev._id} className="pt-4 first:pt-0 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5 text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          sx={{ fontSize: 14 }}
                          className={i < rev.rating ? "text-amber-400" : "text-muted-foreground/30"}
                        />
                      ))}
                    </div>
                    {rev.title && (
                      <p className="text-xs font-bold text-foreground">{rev.title}</p>
                    )}
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(rev.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">{rev.comment}</p>

                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {rev.user?.fullName || "Verified Shopper"}
                  </span>
                  {rev.verifiedPurchase && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] text-success font-bold bg-success-soft px-2 py-0.5 rounded-full border border-success/25">
                      <VerifiedUserOutlined sx={{ fontSize: 12 }} /> Verified Purchase
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Similar Products */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-bold text-foreground">Similar Products You May Like</h2>
        <SimilarProducts productId={currentProduct?._id || productId} />
      </section>

      {/* Mobile Sticky Bottom Commerce Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-3 bg-card/95 backdrop-blur-md border-t border-border z-40 flex items-center justify-between gap-3 shadow-2xl">
        <div>
          <div className="text-[10px] text-muted-foreground font-semibold">Price:</div>
          <div className="text-base font-black text-foreground leading-none">
            ₹{displaySellingPrice.toLocaleString("en-IN")}
          </div>
        </div>
        <Button
          onClick={handleAddCartItem}
          disabled={isOutOfStock}
          variant="contained"
          color="primary"
          size="small"
          startIcon={<AddShoppingCart />}
          sx={{
            py: 1,
            px: 3,
            borderRadius: "0.75rem",
            fontWeight: 700,
            textTransform: "none",
            fontSize: "13px",
          }}
        >
          {isOutOfStock ? "Out of Stock" : "Add to Bag"}
        </Button>
      </div>
    </div>
  );
};

export default ProductDetails;
