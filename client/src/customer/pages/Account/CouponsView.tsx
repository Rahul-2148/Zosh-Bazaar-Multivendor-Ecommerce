import React, { useEffect, useState } from "react";
import {
  LocalOfferOutlined,
  ContentCopyOutlined,
  CheckCircleOutline,
  ShoppingBagOutlined,
  InfoOutlined,
} from "@mui/icons-material";
import { Button, CircularProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import { fetchAvailableCoupons } from "../../../Redux Toolkit/features/customer/UserSlice";

export const CouponsView: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { availableCoupons, loading } = useAppSelector((store) => store.user);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchAvailableCoupons());
  }, [dispatch]);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
        <div>
          <h2 className="text-xl font-bold text-foreground">My Coupons & Offers</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Active discount vouchers, festive promo codes, and eligible checkout offers
          </p>
        </div>
        <Button
          variant="outlined"
          startIcon={<ShoppingBagOutlined />}
          onClick={() => navigate("/products")}
          sx={{ textTransform: "none", fontWeight: 600, borderRadius: "0.75rem" }}
        >
          Explore Catalog
        </Button>
      </div>

      {loading && (!availableCoupons || availableCoupons.length === 0) ? (
        <div className="flex justify-center p-12">
          <CircularProgress size={32} />
        </div>
      ) : !availableCoupons || availableCoupons.length === 0 ? (
        <div className="p-8 text-center rounded-2xl border border-dashed border-border bg-card/50 space-y-3">
          <LocalOfferOutlined sx={{ fontSize: 44 }} className="text-muted-foreground mx-auto" />
          <p className="text-sm font-semibold text-foreground">No active coupons available right now</p>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Check back during seasonal sales, festival drops, and special marketplace promotions!
          </p>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate("/products")}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: "0.75rem" }}
          >
            Start Shopping
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availableCoupons.map((coupon: any) => {
            const isCopied = copiedCode === coupon.code;
            return (
              <div
                key={coupon._id || coupon.code}
                className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 p-5 shadow-xs hover:border-primary/50 transition-all flex flex-col justify-between"
              >
                {/* Decorative cutouts */}
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-background border-r border-primary/20" />
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-background border-l border-primary/20" />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black tracking-widest text-primary uppercase bg-primary/10 px-2.5 py-1 rounded-md">
                      {coupon.discountPercentage ? `${coupon.discountPercentage}% OFF` : "SPECIAL OFFER"}
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      Verified Active
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-black tracking-tight text-foreground font-mono">
                      {coupon.code}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Min. Cart Order:{" "}
                      <span className="font-semibold text-foreground">
                        ₹{Number(coupon.minimumOrderValue || 0).toLocaleString("en-IN")}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-dashed border-border/80 flex items-center justify-between">
                  <div className="text-[11px] text-muted-foreground">
                    {coupon.validityEndDate ? (
                      <>Valid till {new Date(coupon.validityEndDate).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</>
                    ) : (
                      "Limited time marketplace coupon"
                    )}
                  </div>

                  <button
                    onClick={() => handleCopy(coupon.code)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isCopied
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
                    }`}
                  >
                    {isCopied ? (
                      <>
                        <CheckCircleOutline sx={{ fontSize: 14 }} /> Copied!
                      </>
                    ) : (
                      <>
                        <ContentCopyOutlined sx={{ fontSize: 14 }} /> Copy Code
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Policy card */}
      <div className="p-4 rounded-xl bg-muted/40 border border-border/60 flex items-start gap-3">
        <InfoOutlined sx={{ fontSize: 20 }} className="text-primary mt-0.5 shrink-0" />
        <div className="text-xs text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground">How to use coupons:</span> Copy the coupon code and apply it during the checkout payment step. Coupons cannot be stacked with certain category-specific clearance promotions unless explicitly stated.
        </div>
      </div>
    </div>
  );
};
export default CouponsView;
