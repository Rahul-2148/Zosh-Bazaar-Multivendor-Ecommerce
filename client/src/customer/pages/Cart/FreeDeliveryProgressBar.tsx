import React from "react";
import { LocalShippingOutlined, CheckCircle, ArrowForward } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

export interface FreeDeliveryProgressBarProps {
  currentAmount: number;
  threshold?: number;
}

export const FreeDeliveryProgressBar: React.FC<FreeDeliveryProgressBarProps> = ({
  currentAmount,
  threshold = 500,
}) => {
  const navigate = useNavigate();
  const progressPercent = Math.min(100, Math.round((currentAmount / threshold) * 100));
  const amountNeeded = Math.max(0, threshold - currentAmount);
  const isUnlocked = currentAmount >= threshold;

  return (
    <div className="w-full bg-card border border-border rounded-xl p-3 sm:px-4 sm:py-3 shadow-xs flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs font-bold">
        <div className="flex items-center gap-2">
          {isUnlocked ? (
            <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle sx={{ fontSize: 16 }} />
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center shrink-0">
              <LocalShippingOutlined sx={{ fontSize: 15 }} />
            </div>
          )}

          <span className="text-foreground">
            {isUnlocked ? (
              <strong className="text-emerald-600 dark:text-emerald-400">
                You've unlocked FREE Delivery!
              </strong>
            ) : (
              <>
                Add <strong className="text-primary">₹{amountNeeded.toLocaleString("en-IN")}</strong> more for{" "}
                <strong className="text-emerald-600">FREE Delivery</strong>
              </>
            )}
          </span>
        </div>

        {!isUnlocked && (
          <button
            type="button"
            onClick={() => navigate("/products")}
            className="text-[11px] font-extrabold text-primary hover:underline cursor-pointer inline-flex items-center gap-0.5"
          >
            Add items <ArrowForward sx={{ fontSize: 12 }} />
          </button>
        )}
      </div>

      {/* Progress Track */}
      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 rounded-full ${
            isUnlocked ? "bg-emerald-500" : "bg-primary"
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};

export default FreeDeliveryProgressBar;
