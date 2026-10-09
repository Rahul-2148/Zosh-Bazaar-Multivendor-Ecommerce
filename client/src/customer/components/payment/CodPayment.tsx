import React from "react";
import { LocalAtmOutlined, InfoOutlined, CheckCircle, WarningAmberOutlined } from "@mui/icons-material";

interface CodPaymentProps {
  available: boolean;
  reasonMessage?: string;
  payableAmount: number;
  onConfirmCod?: () => void;
  disabled?: boolean;
}

export const CodPayment: React.FC<CodPaymentProps> = ({
  available,
  reasonMessage,
  payableAmount,
  onConfirmCod,
  disabled = false,
}) => {
  return (
    <div className="p-4 rounded-xl border border-border/80 bg-card space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold shrink-0">
          <LocalAtmOutlined sx={{ fontSize: 24 }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-foreground">Cash on Delivery (COD)</span>
            {available ? (
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase">
                Eligible
              </span>
            ) : (
              <span className="text-[10px] font-bold text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded-full uppercase">
                Unavailable
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            Pay in cash or scan the delivery partner's dynamic UPI QR at your doorstep upon arrival.
          </p>
        </div>
      </div>

      {!available ? (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-start gap-2 text-xs text-rose-700 dark:text-rose-400">
          <WarningAmberOutlined sx={{ fontSize: 16 }} className="mt-0.5 shrink-0" />
          <span>{reasonMessage || "Cash on Delivery is unavailable for this order."}</span>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-muted/40 border border-border/60 flex items-start gap-2 text-xs text-muted-foreground">
            <InfoOutlined sx={{ fontSize: 16 }} className="text-primary mt-0.5 shrink-0" />
            <span>
              Please keep exact change of <strong className="text-foreground">₹{payableAmount.toLocaleString("en-IN")}</strong> handy, or you can pay digitally via any UPI app during delivery.
            </span>
          </div>
          {onConfirmCod && (
            <button
              type="button"
              disabled={disabled}
              onClick={onConfirmCod}
              className="w-full py-2.5 px-4 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              Confirm Cash on Delivery Order — ₹{payableAmount.toLocaleString("en-IN")}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CodPayment;
