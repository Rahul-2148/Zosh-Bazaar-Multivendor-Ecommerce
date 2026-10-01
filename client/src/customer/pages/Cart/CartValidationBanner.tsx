import React from "react";
import { Alert, AlertTitle } from "@mui/material";
import { InfoOutlined, WarningAmberOutlined, TrendingDownOutlined } from "@mui/icons-material";
import type { IValidationWarning } from "../../../types/cartTypes";

export interface CartValidationBannerProps {
  warnings: IValidationWarning[];
  onDismissWarning?: (index: number) => void;
}

export const CartValidationBanner: React.FC<CartValidationBannerProps> = ({
  warnings,
}) => {
  if (!warnings || warnings.length === 0) return null;

  return (
    <div className="flex flex-col gap-2.5 w-full mb-4">
      {warnings.map((w, idx) => {
        const isPriceDrop = w.type === "PRICE_CHANGED" && w.diff && w.diff < 0;
        const isPriceIncrease = w.type === "PRICE_CHANGED" && w.diff && w.diff > 0;

        return (
          <Alert
            key={idx}
            severity={
              isPriceDrop
                ? "success"
                : isPriceIncrease || w.type === "STOCK_CHANGED"
                ? "warning"
                : "info"
            }
            icon={
              isPriceDrop ? (
                <TrendingDownOutlined sx={{ fontSize: 20 }} />
              ) : isPriceIncrease ? (
                <WarningAmberOutlined sx={{ fontSize: 20 }} />
              ) : (
                <InfoOutlined sx={{ fontSize: 20 }} />
              )
            }
            sx={{
              borderRadius: "0.85rem",
              fontSize: "12px",
              fontWeight: 600,
              py: 0.75,
              border: "1px solid",
              borderColor: isPriceDrop
                ? "rgba(16, 185, 129, 0.3)"
                : isPriceIncrease
                ? "rgba(245, 158, 11, 0.3)"
                : "rgba(59, 130, 246, 0.3)",
            }}
          >
            <AlertTitle sx={{ fontSize: "12px", fontWeight: 800, mb: 0.2 }}>
              {isPriceDrop
                ? "Price Drop Alert"
                : isPriceIncrease
                ? "Price Update"
                : w.type === "COUPON_INVALIDATED"
                ? "Coupon Eligibility Update"
                : "Cart Notice"}
            </AlertTitle>
            {w.message}
          </Alert>
        );
      })}
    </div>
  );
};

export default CartValidationBanner;
