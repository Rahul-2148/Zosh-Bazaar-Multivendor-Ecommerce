import React from "react";
import { Divider, Button } from "@mui/material";
import {
  LocalOfferOutlined,
  LockOutlined,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import type { IPricingSummary } from "../../../types/cartTypes";

export interface CartPriceDetailsProps {
  totalItem: number;
  pricingSummary?: IPricingSummary;
  totalMrpPrice?: number;
  totalSellingPrice?: number;
  couponSavings?: number;
  deliveryFee?: number;
  onProceedToCheckout?: () => void;
}

export const CartPriceDetails: React.FC<CartPriceDetailsProps> = ({
  totalItem,
  pricingSummary,
  totalMrpPrice = 0,
  totalSellingPrice = 0,
  couponSavings = 0,
  deliveryFee = 0,
  onProceedToCheckout,
}) => {
  const navigate = useNavigate();

  // Authoritative server numbers if present, otherwise compute safely
  const mrp = pricingSummary?.totalMrpPrice ?? totalMrpPrice;
  const selling = pricingSummary?.itemSellingPrice ?? totalSellingPrice;
  const couponDisc = pricingSummary?.couponDiscount ?? couponSavings;
  const shipping = pricingSummary?.deliveryFee ?? deliveryFee;
  const payable = pricingSummary?.totalPayable ?? Math.max(0, selling - couponDisc + shipping);
  const savings = pricingSummary?.totalSavings ?? Math.max(0, mrp - (selling - couponDisc) + (shipping === 0 ? 40 : 0));
  const productDiscount = Math.max(0, mrp - selling);

  const handleCheckout = () => {
    if (onProceedToCheckout) {
      onProceedToCheckout();
    } else {
      navigate("/checkout");
    }
  };

  return (
    <div className="bg-card text-card-foreground border border-border rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col gap-4">
      {/* Header */}
      <div className="pb-2 border-b border-border">
        <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
          Price Details
        </h3>
      </div>

      {/* Bill Breakdown Items */}
      <div className="flex flex-col gap-3 text-xs sm:text-sm">
        {/* MRP */}
        <div className="flex justify-between items-center text-foreground">
          <span className="text-muted-foreground font-medium">
            Price ({totalItem} {totalItem === 1 ? "item" : "items"})
          </span>
          <span className="font-semibold">
            ₹{mrp.toLocaleString("en-IN")}
          </span>
        </div>

        {/* Protect Promise Fee */}
        <div className="flex justify-between items-center text-foreground">
          <span className="text-muted-foreground font-medium">
            Protect Promise Fee
          </span>
          <div className="flex items-center gap-1.5">
            <span className="line-through text-xs text-muted-foreground">₹299</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-xs">
              FREE
            </span>
          </div>
        </div>

        {/* Marketplace Discount */}
        {productDiscount > 0 && (
          <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-semibold">
            <span>Special Marketplace Discount</span>
            <span>-₹{productDiscount.toLocaleString("en-IN")}</span>
          </div>
        )}

        {/* Coupon Discount */}
        {couponDisc > 0 && (
          <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-semibold">
            <span>Coupon Savings</span>
            <span>-₹{couponDisc.toLocaleString("en-IN")}</span>
          </div>
        )}

        {/* Delivery Charges */}
        <div className="flex justify-between items-center text-foreground">
          <span className="text-muted-foreground font-medium">
            Delivery Charges
          </span>
          {shipping === 0 ? (
            <div className="flex items-center gap-1.5">
              <span className="line-through text-xs text-muted-foreground">₹40</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-xs">
                FREE
              </span>
            </div>
          ) : (
            <span className="font-semibold text-foreground">
              ₹{shipping.toLocaleString("en-IN")}
            </span>
          )}
        </div>

        <Divider sx={{ my: 0.5 }} />

        {/* Total Amount */}
        <div className="flex justify-between items-baseline pt-1">
          <span className="font-extrabold text-sm sm:text-base text-foreground">
            Total Amount
          </span>
          <span className="text-lg sm:text-2xl font-black text-foreground tracking-tight">
            ₹{payable.toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {/* Savings Highlight Box */}
      {savings > 0 && (
        <div className="p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-2">
          <LocalOfferOutlined sx={{ fontSize: 18 }} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
            You will save ₹{savings.toLocaleString("en-IN")} on this order
          </span>
        </div>
      )}

      {/* Primary CTA (Desktop) */}
      <Button
        variant="contained"
        fullWidth
        onClick={handleCheckout}
        sx={{
          bgcolor: "#fb641b",
          color: "#ffffff",
          "&:hover": { bgcolor: "#e65100" },
          py: 1.4,
          borderRadius: "0.85rem",
          fontWeight: 800,
          fontSize: "14px",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          boxShadow: "0 4px 14px rgba(251, 100, 27, 0.35)",
        }}
      >
        Place Order
      </Button>

      {/* Safe & Secure Trust Footer */}
      <div className="pt-2 border-t border-border flex items-center justify-center gap-2 text-[11px] text-muted-foreground text-center font-medium">
        <LockOutlined sx={{ fontSize: 15 }} className="text-slate-500 shrink-0" />
        <span>Safe and secure 256-bit encrypted checkout. 100% Authentic products.</span>
      </div>
    </div>
  );
};

export default CartPriceDetails;
