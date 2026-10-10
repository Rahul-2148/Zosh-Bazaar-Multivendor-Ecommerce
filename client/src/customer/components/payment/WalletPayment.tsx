import React from "react";
import { Button, Checkbox, FormControlLabel } from "@mui/material";
import { AccountBalanceWalletOutlined, AddCircleOutline } from "@mui/icons-material";

interface WalletPaymentProps {
  walletBalance: number;
  payableAmount: number;
  useWallet: boolean;
  onToggleUseWallet: (use: boolean) => void;
  splitWithWallet: boolean;
  onToggleSplit: (split: boolean) => void;
  onOpenTopup?: () => void;
}

export const WalletPayment: React.FC<WalletPaymentProps> = ({
  walletBalance,
  payableAmount,
  useWallet,
  onToggleUseWallet,
  splitWithWallet,
  onToggleSplit,
  onOpenTopup,
}) => {
  const isSufficient = walletBalance >= payableAmount;
  const isPartial = walletBalance > 0 && walletBalance < payableAmount;
  const remainingAmount = Math.max(0, payableAmount - walletBalance);

  return (
    <div className="p-4 rounded-xl border border-border/80 bg-card space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <AccountBalanceWalletOutlined sx={{ fontSize: 22 }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-foreground">Zosh Wallet</span>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                1-Click Checkout
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Available Balance: <strong className="text-foreground">₹{walletBalance.toLocaleString("en-IN")}</strong>
            </p>
          </div>
        </div>

        {onOpenTopup && (
          <Button
            size="small"
            variant="outlined"
            startIcon={<AddCircleOutline />}
            onClick={onOpenTopup}
            sx={{ textTransform: "none", fontWeight: 600, borderRadius: "0.5rem" }}
          >
            Add Money
          </Button>
        )}
      </div>

      {walletBalance === 0 ? (
        <div className="p-3 rounded-lg bg-muted/40 text-xs text-muted-foreground">
          Your wallet balance is ₹0. You can top up or select UPI, Card, or Net Banking below.
        </div>
      ) : isSufficient ? (
        <div className="pt-2 border-t border-border/60">
          <FormControlLabel
            control={
              <Checkbox
                checked={useWallet}
                onChange={(e) => onToggleUseWallet(e.target.checked)}
                color="primary"
              />
            }
            label={
              <div>
                <span className="text-xs font-bold text-foreground">
                  Pay full ₹{payableAmount.toLocaleString("en-IN")} from Zosh Wallet
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Remaining balance after order: ₹{(walletBalance - payableAmount).toLocaleString("en-IN")}
                </p>
              </div>
            }
          />
        </div>
      ) : isPartial ? (
        <div className="pt-2 border-t border-border/60">
          <FormControlLabel
            control={
              <Checkbox
                checked={splitWithWallet}
                onChange={(e) => onToggleSplit(e.target.checked)}
                color="primary"
              />
            }
            label={
              <div>
                <span className="text-xs font-bold text-foreground">
                  Use ₹{walletBalance.toLocaleString("en-IN")} from Wallet (Split Payment)
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Pay the remaining <strong className="text-primary font-bold">₹{remainingAmount.toLocaleString("en-IN")}</strong> via UPI, Card, or Net Banking
                </p>
              </div>
            }
          />
        </div>
      ) : null}
    </div>
  );
};

export default WalletPayment;
