import React from "react";
import { Divider, Typography } from "@mui/material";
import { VerifiedUserOutlined, SavingsOutlined } from "@mui/icons-material";

export interface PricingBreakdown {
  mrpTotal: number;
  sellingPriceTotal: number;
  productDiscount: number;
  couponCode?: string | null;
  couponDiscount: number;
  offerCode?: string | null;
  offerDiscount: number;
  deliveryFee: number;
  packagingFee: number;
  finalPayable: number;
  totalSavings?: number;
}

interface PaymentSummaryProps {
  pricing: PricingBreakdown;
  itemCount: number;
  walletDeduction?: number;
  selectedAddress?: any;
}

export const PaymentSummary: React.FC<PaymentSummaryProps> = ({
  pricing,
  itemCount,
  walletDeduction = 0,
  selectedAddress,
}) => {
  const netDue = Math.max(0, pricing.finalPayable - walletDeduction);
  const totalSavings =
    (pricing.productDiscount || 0) +
    (pricing.couponDiscount || 0) +
    (pricing.offerDiscount || 0);

  return (
    <div className="border border-border/80 bg-card text-card-foreground rounded-2xl p-6 flex flex-col gap-4 shadow-xs">
      <div className="flex items-center justify-between pb-1">
        <Typography variant="h6" fontWeight="800" className="text-foreground tracking-tight">
          Price Details ({itemCount} {itemCount === 1 ? "Item" : "Items"})
        </Typography>
      </div>

      <Divider />

      <div className="flex flex-col gap-2.5 text-xs sm:text-sm">
        {/* Total MRP */}
        <div className="flex justify-between text-muted-foreground font-medium">
          <span>Total MRP</span>
          <span className="text-foreground font-semibold">
            ₹{pricing.mrpTotal?.toLocaleString("en-IN")}
          </span>
        </div>

        {/* Product Discount */}
        {pricing.productDiscount > 0 && (
          <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
            <span>Discount on MRP</span>
            <span>-₹{pricing.productDiscount.toLocaleString("en-IN")}</span>
          </div>
        )}

        {/* Coupon Discount */}
        {pricing.couponDiscount > 0 && (
          <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
            <span>Coupon Savings ({pricing.couponCode || "COUPON"})</span>
            <span>-₹{pricing.couponDiscount.toLocaleString("en-IN")}</span>
          </div>
        )}

        {/* Bank / Payment Offer Discount */}
        {pricing.offerDiscount > 0 && (
          <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
            <span>Payment Offer ({pricing.offerCode || "OFFER"})</span>
            <span>-₹{pricing.offerDiscount.toLocaleString("en-IN")}</span>
          </div>
        )}

        {/* Delivery Fee */}
        <div className="flex justify-between text-muted-foreground font-medium">
          <span>Delivery Charges</span>
          {pricing.deliveryFee === 0 ? (
            <span className="text-emerald-600 dark:text-emerald-400 font-bold uppercase text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded">
              Free Delivery
            </span>
          ) : (
            <span className="text-foreground font-semibold">
              ₹{pricing.deliveryFee.toLocaleString("en-IN")}
            </span>
          )}
        </div>

        {/* Packaging / Platform Handling */}
        {pricing.packagingFee > 0 && (
          <div className="flex justify-between text-muted-foreground font-medium">
            <span>Secured Packaging & Handling</span>
            <span className="text-foreground font-semibold">
              ₹{pricing.packagingFee.toLocaleString("en-IN")}
            </span>
          </div>
        )}

        {/* Wallet Split Deduction */}
        {walletDeduction > 0 && (
          <div className="flex justify-between text-primary font-bold pt-1">
            <span>Paid from Zosh Wallet</span>
            <span>-₹{walletDeduction.toLocaleString("en-IN")}</span>
          </div>
        )}

        <Divider />

        {/* Total Payable / Due */}
        <div className="flex justify-between font-black text-base pt-1">
          <span className="text-foreground">
            {walletDeduction > 0 ? "Remaining Payable" : "Total Payable"}
          </span>
          <span className="text-primary font-black text-xl">
            ₹{netDue.toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {/* Savings Banner */}
      {totalSavings > 0 && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400">
          <SavingsOutlined sx={{ fontSize: 18 }} />
          <span>You will save ₹{totalSavings.toLocaleString("en-IN")} on this order</span>
        </div>
      )}

      {selectedAddress && (
        <div className="p-3 rounded-xl bg-muted/40 border border-border/60 text-xs">
          <span className="font-bold text-foreground block mb-0.5">Delivering to:</span>
          <p className="text-muted-foreground truncate">
            {selectedAddress.name} ({selectedAddress.pincode})
          </p>
          <p className="text-muted-foreground truncate">
            {selectedAddress.address}, {selectedAddress.city}
          </p>
        </div>
      )}

      <div className="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-muted-foreground font-medium">
        <VerifiedUserOutlined sx={{ fontSize: 15 }} className="text-primary" />
        <span>Safe & Secure Payments · 100% Authentic Products</span>
      </div>
    </div>
  );
};

export default PaymentSummary;
