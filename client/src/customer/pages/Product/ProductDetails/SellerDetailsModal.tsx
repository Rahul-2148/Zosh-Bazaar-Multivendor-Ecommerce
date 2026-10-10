import React, { useEffect, useState, useCallback } from "react";
import {
  X,
  Store,
  ShieldCheck,
  Star,
  MapPin,
  Truck,
  RotateCcw,
  FileText,
  Package,
  Calendar,
  ExternalLink,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Api } from "../../../../config/Api";

export interface SellerPublicProfile {
  sellerId: string;
  sellerCode: string;
  businessName: string;
  sellerName?: string;
  businessLogo?: string | null;
  banner?: string | null;
  isVerified: boolean;
  accountStatus: string;
  rating: number | null;
  ratingCount: number;
  ratingBreakdown?: Record<number, number>;
  activeProductsCount: number;
  shipsFrom: {
    city: string;
    state: string;
  };
  fulfillmentMethod: string;
  returnPolicy: string;
  maskedGstin?: string | null;
  joinedDate?: string;
  tenureMonths?: number;
}

export interface SellerDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sellerId?: string;
  initialSeller?: {
    _id?: string;
    sellerName?: string;
    businessDetails?: {
      businessName?: string;
      businessLogo?: string;
    };
    isVerified?: boolean;
    createdAt?: string | Date;
    accountStatus?: string;
  } | null;
  onNavigateToStorefront?: (sellerId: string) => void;
}

export const SellerDetailsModal: React.FC<SellerDetailsModalProps> = ({
  isOpen,
  onClose,
  sellerId,
  initialSeller,
  onNavigateToStorefront,
}) => {
  const [profile, setProfile] = useState<SellerPublicProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolvedId = sellerId || initialSeller?._id;

  const fetchProfile = useCallback(async () => {
    if (!resolvedId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await Api.get(`/sellers/${resolvedId}/public-profile`);
      if (response.data?.seller) {
        setProfile(response.data.seller);
      } else {
        throw new Error("No seller profile returned");
      }
    } catch (err: any) {
      console.warn("[SellerDetailsModal] Error fetching public seller profile:", err?.message);
      // Fallback to initialSeller if available
      if (initialSeller) {
        setProfile({
          sellerId: initialSeller._id || resolvedId,
          sellerCode: `ZB-SLR-${(initialSeller._id || resolvedId).slice(-6).toUpperCase()}`,
          businessName:
            initialSeller.businessDetails?.businessName ||
            initialSeller.sellerName ||
            "Zosh Marketplace Merchant",
          sellerName: initialSeller.sellerName,
          businessLogo: initialSeller.businessDetails?.businessLogo || null,
          banner: null,
          isVerified: initialSeller.accountStatus === "ACTIVE",
          accountStatus: initialSeller.accountStatus || "ACTIVE",
          rating: null,
          ratingCount: 0,
          activeProductsCount: 1,
          shipsFrom: { city: "Regional Logistics Hub", state: "India" },
          fulfillmentMethod: "Zosh Express Logistics (Direct / Hub)",
          returnPolicy: "7 Days Replacement & Return Policy backed by Zosh Bazaar",
          maskedGstin: null,
          joinedDate: initialSeller.createdAt ? String(initialSeller.createdAt) : undefined,
          tenureMonths: 6,
        });
      } else {
        setError("Unable to load seller details at this moment.");
      }
    } finally {
      setLoading(false);
    }
  }, [resolvedId, initialSeller]);

  useEffect(() => {
    let isMounted = true;
    if (!isOpen) {
      document.body.style.overflow = "";
      setProfile(null);
      setError(null);
      return;
    }

    document.body.style.overflow = "hidden";
    if (resolvedId && isMounted) {
      fetchProfile();
    }

    return () => {
      document.body.style.overflow = "";
      isMounted = false;
    };
  }, [isOpen, resolvedId, fetchProfile]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const displayBusinessName =
    profile?.businessName ||
    initialSeller?.businessDetails?.businessName ||
    initialSeller?.sellerName ||
    "Marketplace Merchant";

  const displaySellerCode = profile?.sellerCode || `ZB-SLR-${resolvedId?.slice(-6).toUpperCase() || "STORE"}`;
  const isVerified = Boolean(profile?.isVerified ?? (initialSeller?.accountStatus === "ACTIVE"));

  const formatTenure = () => {
    if (profile?.tenureMonths && profile.tenureMonths > 0) {
      if (profile.tenureMonths >= 12) {
        const years = Math.floor(profile.tenureMonths / 12);
        return `${years}+ ${years === 1 ? "year" : "years"} on Zosh Bazaar`;
      }
      return `${profile.tenureMonths} ${profile.tenureMonths === 1 ? "month" : "months"} on Zosh Bazaar`;
    }
    if (profile?.joinedDate) {
      return `Seller since ${new Date(profile.joinedDate).toLocaleDateString("en-IN", {
        month: "short",
        year: "numeric",
      })}`;
    }
    return "Marketplace Partner";
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/65 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="seller-modal-title"
    >
      <div
        className="relative w-full sm:max-w-xl max-h-[88vh] sm:max-h-[85vh] bg-card text-card-foreground rounded-t-3xl sm:rounded-3xl border border-border/80 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-2 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Indicator Handle */}
        <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mt-3 mb-1 sm:hidden shrink-0" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/80 bg-muted/20 shrink-0">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-primary" />
            <h3 id="seller-modal-title" className="font-extrabold text-base sm:text-lg text-foreground">
              Seller Information
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            aria-label="Close seller modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          {loading && !profile ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-xs font-semibold">Loading verified seller credentials...</p>
            </div>
          ) : error && !profile ? (
            <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <div className="text-xs font-medium">
                <p className="font-bold">Error loading profile</p>
                <p>{error}</p>
              </div>
            </div>
          ) : (
            <>
              {/* 1. Seller Identity Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-muted/30 border border-border/80 flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-xl shrink-0 overflow-hidden">
                  {profile?.businessLogo ? (
                    <img
                      src={profile.businessLogo}
                      alt={displayBusinessName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{displayBusinessName.charAt(0).toUpperCase()}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-black text-base sm:text-lg text-foreground truncate">
                      {displayBusinessName}
                    </h4>
                    {isVerified && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full shrink-0">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        Verified Merchant
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground font-mono mt-0.5">
                    Seller Code: <span className="font-semibold text-foreground">{displaySellerCode}</span>
                  </p>

                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    <span>{formatTenure()}</span>
                  </div>
                </div>
              </div>

              {/* 2. Trust & Performance Section */}
              <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Ratings & Reputation
                </h5>

                {profile?.rating !== null && profile?.rating !== undefined && profile.ratingCount > 0 ? (
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 min-w-[80px]">
                      <div className="flex items-center gap-1 text-emerald-600 font-black text-2xl">
                        <span>{profile.rating.toFixed(1)}</span>
                        <Star className="w-5 h-5 fill-emerald-600 text-emerald-600" />
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 mt-0.5">
                        {profile.ratingCount} {profile.ratingCount === 1 ? "Rating" : "Ratings"}
                      </span>
                    </div>

                    <div className="flex-1 text-xs text-muted-foreground space-y-1">
                      <p className="font-semibold text-foreground">
                        Authentic Customer Feedback
                      </p>
                      <p className="text-[11px]">
                        Aggregated from verified buyers across {profile.activeProductsCount} catalog products.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border/60">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <Star className="w-4 h-4" />
                    </div>
                    <div className="text-xs">
                      <p className="font-bold text-foreground">New Marketplace Merchant</p>
                      <p className="text-[11px] text-muted-foreground">
                        Quality onboarding verification completed. Seller reviews build with orders.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Fulfilment & Policies Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Ships From */}
                <div className="p-3.5 rounded-2xl bg-card border border-border/80 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-foreground">Ships From</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {profile?.shipsFrom?.city || "Regional Hub"}, {profile?.shipsFrom?.state || "India"}
                    </p>
                  </div>
                </div>

                {/* Logistics */}
                <div className="p-3.5 rounded-2xl bg-card border border-border/80 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-foreground">Fulfilment Partner</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {profile?.fulfillmentMethod || "Zosh Express Logistics"}
                    </p>
                  </div>
                </div>

                {/* Replacement Policy */}
                <div className="p-3.5 rounded-2xl bg-card border border-border/80 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-foreground">Return & Replacement</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {profile?.returnPolicy || "7 Days Easy Replacement guaranteed"}
                    </p>
                  </div>
                </div>

                {/* Tax Transparency */}
                <div className="p-3.5 rounded-2xl bg-card border border-border/80 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-foreground">GST & Invoicing</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {profile?.maskedGstin
                        ? `GSTIN: ${profile.maskedGstin}`
                        : "Authoritative GST Invoice Provided"}
                    </p>
                  </div>
                </div>
              </div>

              {/* 4. Active Catalog Count & Storefront Action */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border/80">
                <div className="flex items-center gap-2 text-xs text-muted-foreground self-start sm:self-center">
                  <Package className="w-4 h-4 text-primary" />
                  <span>
                    <strong className="text-foreground">{profile?.activeProductsCount ?? 1}</strong> active products on marketplace
                  </span>
                </div>

                {resolvedId && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onNavigateToStorefront) {
                        onNavigateToStorefront(resolvedId);
                      } else {
                        window.location.href = `/products?sellerId=${resolvedId}`;
                      }
                    }}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-colors shadow-xs cursor-pointer"
                  >
                    <span>View Seller Products</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerDetailsModal;
