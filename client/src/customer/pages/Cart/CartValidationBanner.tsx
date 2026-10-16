import React from "react";
import { Alert, AlertTitle, Button, CircularProgress } from "@mui/material";
import { InfoOutlined, WarningAmberOutlined, TrendingDownOutlined, RefreshOutlined } from "@mui/icons-material";
import type { IValidationWarning } from "../../../types/cartTypes";

export interface CartValidationBannerProps {
  warnings: IValidationWarning[];
  onDismissWarning?: (index: number) => void;
  onRetryMerge?: () => void;
  isRetryingMerge?: boolean;
}

export const CartValidationBanner: React.FC<CartValidationBannerProps> = ({
  warnings,
  onRetryMerge,
  isRetryingMerge = false,
}) => {
  if (!warnings || warnings.length === 0) return null;

  return (
    <div className="flex flex-col gap-2.5 w-full mb-4">
      {warnings.map((w, idx) => {
        const isPriceDrop = w.type === "PRICE_CHANGED" && w.diff && w.diff < 0;
        const isPriceIncrease = w.type === "PRICE_CHANGED" && w.diff && w.diff > 0;
        const isMergeWarning = w.isMergeWarning || w.canRetry || w.type === "GUEST_MERGE_FAILED";

        return (
          <Alert
            key={idx}
            severity={
              isPriceDrop
                ? "success"
                : isPriceIncrease || w.type === "STOCK_CHANGED" || isMergeWarning
                ? "warning"
                : "info"
            }
            icon={
              isPriceDrop ? (
                <TrendingDownOutlined sx={{ fontSize: 20 }} />
              ) : isPriceIncrease || isMergeWarning ? (
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
                : isPriceIncrease || isMergeWarning
                ? "rgba(245, 158, 11, 0.3)"
                : "rgba(59, 130, 246, 0.3)",
            }}
          >
            <AlertTitle sx={{ fontSize: "12px", fontWeight: 800, mb: 0.2 }}>
              {isPriceDrop
                ? "Price Drop Alert"
                : isPriceIncrease
                ? "Price Update"
                : isMergeWarning
                ? "Guest Item Merge Notice"
                : w.type === "COUPON_INVALIDATED"
                ? "Coupon Eligibility Update"
                : "Cart Notice"}
            </AlertTitle>
            <div>{w.message}</div>
            {isMergeWarning && onRetryMerge && (
              <div className="mt-2.5">
                <Button
                  size="small"
                  variant="outlined"
                  onClick={onRetryMerge}
                  disabled={isRetryingMerge}
                  startIcon={
                    isRetryingMerge ? (
                      <CircularProgress size={12} color="inherit" />
                    ) : (
                      <RefreshOutlined sx={{ fontSize: 14 }} />
                    )
                  }
                  sx={{
                    textTransform: "none",
                    fontSize: "11px",
                    fontWeight: 700,
                    borderRadius: "0.5rem",
                    py: 0.3,
                    px: 1.5,
                    bgcolor: "rgba(245, 158, 11, 0.08)",
                    borderColor: "rgba(245, 158, 11, 0.5)",
                    color: "#b45309",
                    "&:hover": {
                      bgcolor: "rgba(245, 158, 11, 0.16)",
                      borderColor: "rgba(245, 158, 11, 0.8)",
                    },
                  }}
                >
                  {isRetryingMerge ? "Retrying Merge..." : "Retry Adding to Cart"}
                </Button>
              </div>
            )}
          </Alert>
        );
      })}
    </div>
  );
};

export default CartValidationBanner;
