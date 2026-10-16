import React from "react";
import { LocalShippingOutlined, CheckCircle, ArrowForward } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

export interface FreeDeliveryProgressBarProps {
  currentAmount: number;
  threshold?: number;
  isFreeDelivery?: boolean;
  deliveryFee?: number | null;
}

export const FreeDeliveryProgressBar: React.FC<FreeDeliveryProgressBarProps> = ({
  currentAmount,
  threshold = 999,
  isFreeDelivery,
  deliveryFee,
}) => {
  const navigate = useNavigate();
  const safeThreshold = Math.max(1, threshold);
  const safeAmount = Math.max(0, currentAmount);
  const progressPercent = Math.min(100, Math.round((safeAmount / safeThreshold) * 100));
  const amountNeeded = Math.max(0, safeThreshold - safeAmount);

  // Render header message, icon, and progress track based on explicit server state
  const renderStatus = () => {
    // State 1: Confirmed Free Delivery Unlocked
    if (isFreeDelivery === true) {
      return {
        icon: (
          <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle sx={{ fontSize: 16 }} />
          </div>
        ),
        message: (
          <strong className="text-emerald-600 dark:text-emerald-400">
            You've unlocked FREE Delivery!
          </strong>
        ),
        showAddButton: false,
        trackColor: "bg-emerald-500",
        trackWidth: "100%",
      };
    }

    // State 2: Authoritatively NOT Free Delivery
    if (isFreeDelivery === false) {
      if (amountNeeded > 0) {
        return {
          icon: (
            <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center shrink-0">
              <LocalShippingOutlined sx={{ fontSize: 15 }} />
            </div>
          ),
          message: (
            <>
              Add <strong className="text-primary">₹{amountNeeded.toLocaleString("en-IN")}</strong> more for{" "}
              <strong className="text-emerald-600">FREE Delivery</strong>
            </>
          ),
          showAddButton: true,
          trackColor: "bg-primary",
          trackWidth: `${progressPercent}%`,
        };
      }

      // Threshold reached or exceeded, but server reports delivery as NOT free
      return {
        icon: (
          <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
            <LocalShippingOutlined sx={{ fontSize: 15 }} />
          </div>
        ),
        message: (
          <span>
            {typeof deliveryFee === "number" && deliveryFee > 0 ? (
              <>
                Standard delivery fee applies:{" "}
                <strong className="text-foreground">₹{deliveryFee.toLocaleString("en-IN")}</strong>
              </>
            ) : (
              <>Standard delivery charges apply to this order</>
            )}
          </span>
        ),
        showAddButton: false,
        trackColor: "bg-amber-500/60",
        trackWidth: `${progressPercent}%`,
      };
    }

    // State 3: isFreeDelivery === undefined (Unknown eligibility / uncalculated fee)
    // Never infer free delivery benefit from cart amount alone
    return {
      icon: (
        <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center shrink-0">
          <LocalShippingOutlined sx={{ fontSize: 15 }} />
        </div>
      ),
      message: (
        <span className="text-muted-foreground font-medium">
          Delivery eligibility and charges will be confirmed at checkout
        </span>
      ),
      showAddButton: false,
      trackColor: "bg-muted-foreground/30",
      trackWidth: `${progressPercent}%`,
    };
  };

  const { icon, message, showAddButton, trackColor, trackWidth } = renderStatus();

  return (
    <div className="w-full bg-card border border-border rounded-xl p-3 sm:px-4 sm:py-3 shadow-xs flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs font-bold">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-foreground">{message}</span>
        </div>

        {showAddButton && (
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
          className={`h-full transition-all duration-500 rounded-full ${trackColor}`}
          style={{ width: trackWidth }}
        />
      </div>
    </div>
  );
};

export default FreeDeliveryProgressBar;
