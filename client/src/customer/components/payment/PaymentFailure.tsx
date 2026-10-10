import React from "react";
import { Button, Typography, Alert } from "@mui/material";
import {
  ErrorOutline,
  ReplayOutlined,
  AccountBalanceWalletOutlined,
  HeadsetMicOutlined,
  ShieldOutlined,
} from "@mui/icons-material";

interface PaymentFailureProps {
  reason?: string;
  errorCode?: string;
  attemptId?: string;
  amount: number;
  onRetry: () => void;
  onChangeMethod: () => void;
}

export const PaymentFailure: React.FC<PaymentFailureProps> = ({
  reason = "Your transaction could not be processed by your bank or payment app.",
  errorCode = "PAYMENT_FAILED",
  attemptId,
  amount,
  onRetry,
  onChangeMethod,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-6 sm:p-10 max-w-lg mx-auto text-center space-y-6 bg-card text-card-foreground border border-rose-500/30 rounded-3xl shadow-lg">
      <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
        <ErrorOutline sx={{ fontSize: 38 }} />
      </div>

      <div className="space-y-2">
        <span className="text-[11px] font-black tracking-widest uppercase text-rose-600 dark:text-rose-400 px-3 py-1 rounded-full bg-rose-500/10">
          Payment Unsuccessful
        </span>
        <Typography variant="h5" fontWeight="800" className="text-foreground">
          Transaction Failed
        </Typography>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          {reason}
        </p>
      </div>

      {/* Failure Reference Box */}
      <div className="p-4 rounded-2xl bg-muted/40 border border-border/70 w-full text-left text-xs space-y-2">
        <div className="flex justify-between items-center text-muted-foreground">
          <span>Error Code:</span>
          <span className="font-mono font-bold text-foreground">{errorCode}</span>
        </div>
        {attemptId && (
          <div className="flex justify-between items-center text-muted-foreground">
            <span>Reference ID:</span>
            <span className="font-mono font-semibold text-foreground truncate max-w-[200px]">
              {attemptId}
            </span>
          </div>
        )}
        <div className="flex justify-between items-center text-muted-foreground">
          <span>Attempted Amount:</span>
          <span className="font-extrabold text-foreground">₹{amount?.toLocaleString("en-IN")}</span>
        </div>
      </div>

      {/* Reassurance Banner */}
      <Alert severity="info" sx={{ width: "100%", fontSize: "12px", textAlign: "left", borderRadius: "0.75rem" }}>
        <strong>No duplicate order created.</strong> If any amount was debited from your bank or wallet, it will automatically reverse within 24 to 48 banking hours.
      </Alert>

      <div className="w-full flex flex-col sm:flex-row gap-3 pt-2">
        <Button
          variant="contained"
          color="primary"
          fullWidth
          onClick={onChangeMethod}
          startIcon={<AccountBalanceWalletOutlined />}
          sx={{
            py: 1.2,
            borderRadius: "0.75rem",
            textTransform: "none",
            fontWeight: 700,
          }}
        >
          Change Payment Method
        </Button>
        <Button
          variant="outlined"
          color="inherit"
          fullWidth
          onClick={onRetry}
          startIcon={<ReplayOutlined />}
          sx={{
            py: 1.2,
            borderRadius: "0.75rem",
            textTransform: "none",
            fontWeight: 600,
          }}
        >
          Retry Payment
        </Button>
      </div>

      <div className="flex items-center justify-between w-full pt-4 border-t border-border/50 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1">
          <ShieldOutlined sx={{ fontSize: 14 }} className="text-primary" />
          <span>Zosh Safe Pay Guarantee</span>
        </div>
        <div className="flex items-center gap-1 cursor-pointer hover:underline">
          <HeadsetMicOutlined sx={{ fontSize: 14 }} />
          <span>Need Help? Contact Support</span>
        </div>
      </div>
    </div>
  );
};
