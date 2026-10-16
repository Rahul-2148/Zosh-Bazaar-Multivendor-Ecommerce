import React, { useState, useEffect } from "react";
import {
  StorefrontOutlined,
  VerifiedOutlined,
  LocalShippingOutlined,
  AssignmentReturnOutlined,
  CheckCircle,
  SwapHorizOutlined,
  ShieldOutlined,
} from "@mui/icons-material";
import { Button, Chip } from "@mui/material";
import { Api } from "../../../../config/Api";

export interface SellerOfferItem {
  productId: string;
  title: string;
  slug: string;
  sku: string;
  seller: {
    sellerId: string;
    sellerCode: string;
    sellerName: string;
    businessName: string;
    businessLogo?: string;
    isVerified: boolean;
    rating: number | null;
    ratingCount: number;
    shipsFromCity: string;
    shipsFromState: string;
    fulfillmentMethod: string | null;
  };
  pricing: {
    mrpPrice: number;
    sellingPrice: number;
    discountPercent: number;
    savingsVsCurrentOffer: number;
    isCheaper: boolean;
  };
  inventory: {
    countInStock: number;
    inStock: boolean;
    status: string;
  };
  shippingDetails?: {
    estimatedDeliveryDays?: number | null;
    freeShipping?: boolean;
  } | null;
  returnPolicy?: {
    returnable?: boolean | null;
    windowDays?: number | null;
    policyType?: string | null;
  } | null;
  warranty?: {
    summary?: string | null;
    durationMonths?: number | null;
    type?: string | null;
  } | null;
}

interface SellerOffersSectionProps {
  productId: string;
  currentSellerId?: string;
  currentPrice: number;
  onSelectOffer: (offer: SellerOfferItem) => void;
  selectedOfferProductId?: string;
}

export const SellerOffersSection: React.FC<SellerOffersSectionProps> = ({
  productId,
  currentSellerId: _currentSellerId,
  currentPrice,
  onSelectOffer,
  selectedOfferProductId,
}) => {
  const [offers, setOffers] = useState<SellerOfferItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (!productId) return;

    const fetchOffers = async () => {
      setLoading(true);
      try {
        const res = await Api.get(`/products/${productId}/seller-offers`);
        if (isMounted) {
          if (Array.isArray(res.data?.offers)) {
            setOffers(res.data.offers);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          console.warn("[SellerOffers] Unable to fetch offers:", err.message);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchOffers();

    return () => {
      isMounted = false;
    };
  }, [productId]);

  if (loading) {
    return null; // Silent loader to avoid layout shift
  }

  if (offers.length === 0) {
    return null; // No other genuine seller offers exist for this canonical product
  }

  return (
    <div className="mt-8 border border-border/80 rounded-2xl bg-card shadow-sm p-4 sm:p-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <StorefrontOutlined sx={{ fontSize: 20 }} />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-foreground">
              Other Sellers on Zosh Bazaar
            </h3>
            <p className="text-xs text-muted-foreground">
              {offers.length} more {offers.length === 1 ? "seller offers" : "sellers offer"} this exact product
            </p>
          </div>
        </div>

        <Chip
          label={`From ₹${Math.min(...offers.map((o) => o.pricing.sellingPrice)).toLocaleString("en-IN")}`}
          size="small"
          color="primary"
          variant="outlined"
          sx={{ fontWeight: 700, fontSize: "0.75rem", borderRadius: "0.5rem" }}
        />
      </div>

      {/* Offer Cards List */}
      <div className="mt-4 space-y-3">
        {offers.map((offer) => {
          const isSelected = selectedOfferProductId === offer.productId;
          const priceDiff = currentPrice - offer.pricing.sellingPrice;
          const isCheaper = priceDiff > 0;

          return (
            <div
              key={offer.productId}
              className={`p-3.5 sm:p-4 rounded-xl border transition-all duration-150 ${
                isSelected
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-border/70 hover:border-primary/50 bg-background/50"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Seller & Reputation Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-foreground">
                      {offer.seller.businessName}
                    </span>
                    {offer.seller.isVerified && (
                      <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded-md">
                        <VerifiedOutlined sx={{ fontSize: 13 }} />
                        Verified
                      </span>
                    )}
                    {offer.seller.rating ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded-md">
                        ★ {offer.seller.rating.toFixed(1)}
                        <span className="text-[10px] text-muted-foreground font-normal">
                          ({offer.seller.ratingCount})
                        </span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md">
                        New Merchant
                      </span>
                    )}
                  </div>

                  {/* Fulfillment and SLA */}
                  <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    {offer.shippingDetails && (
                      <span className="flex items-center gap-1">
                        <LocalShippingOutlined sx={{ fontSize: 14 }} className="text-primary" />
                        {offer.shippingDetails.freeShipping
                          ? "Free Delivery"
                          : offer.seller.fulfillmentMethod
                          ? offer.seller.fulfillmentMethod
                          : "Delivery available"}
                        {offer.shippingDetails.estimatedDeliveryDays ? ` in ${offer.shippingDetails.estimatedDeliveryDays} days` : ""}
                      </span>
                    )}
                    {offer.returnPolicy && (
                      <span className="flex items-center gap-1">
                        <AssignmentReturnOutlined sx={{ fontSize: 14 }} className="text-muted-foreground" />
                        {offer.returnPolicy.returnable === false
                          ? "Non-returnable"
                          : offer.returnPolicy.returnable === true
                          ? offer.returnPolicy.windowDays
                            ? `${offer.returnPolicy.windowDays} Days Return`
                            : offer.returnPolicy.policyType
                            ? offer.returnPolicy.policyType.replace(/_/g, " ")
                            : "Returnable"
                          : "Return policy unlisted"}
                      </span>
                    )}
                    {offer.warranty?.summary && (
                      <span className="flex items-center gap-1">
                        <ShieldOutlined sx={{ fontSize: 14 }} className="text-muted-foreground" />
                        {offer.warranty.summary}
                      </span>
                    )}
                  </div>
                </div>

                {/* Price & Action Button */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-border/50">
                  <div className="text-left sm:text-right">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-base sm:text-lg font-bold text-foreground">
                        ₹{offer.pricing.sellingPrice.toLocaleString("en-IN")}
                      </span>
                      {offer.pricing.mrpPrice > offer.pricing.sellingPrice && (
                        <span className="text-xs text-muted-foreground line-through">
                          ₹{offer.pricing.mrpPrice.toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>
                    {isCheaper && (
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 block">
                        Save ₹{priceDiff.toLocaleString("en-IN")} vs current
                      </span>
                    )}
                  </div>

                  <Button
                    variant={isSelected ? "contained" : "outlined"}
                    color="primary"
                    size="small"
                    startIcon={isSelected ? <CheckCircle sx={{ fontSize: 16 }} /> : <SwapHorizOutlined sx={{ fontSize: 16 }} />}
                    onClick={() => onSelectOffer(offer)}
                    disabled={!offer.inventory.inStock}
                    sx={{
                      textTransform: "none",
                      fontWeight: 700,
                      fontSize: "0.78rem",
                      borderRadius: "0.6rem",
                      px: 2,
                      py: 0.5,
                      boxShadow: isSelected ? 2 : 0,
                    }}
                  >
                    {!offer.inventory.inStock
                      ? "Out of Stock"
                      : isSelected
                      ? "Selected Offer"
                      : "Choose Seller"}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SellerOffersSection;
