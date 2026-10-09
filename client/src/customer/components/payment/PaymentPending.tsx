import React, { useEffect, useState } from "react";
import { CircularProgress, Button, Typography, Alert } from "@mui/material";
import {
  HourglassEmptyOutlined,
  RefreshOutlined,
  WarningAmberOutlined,
  ArrowBack,
  SecurityOutlined,
} from "@mui/icons-material";
import { Api as api } from "../../../config/Api";

interface PaymentPendingProps {
  intentId: string;
  attemptId?: string;
  amount: number;
  method: string;
  onSuccess: (data: any) => void;
  onFailure: (error: string) => void;
  onCancel: () => void;
}

export const PaymentPending: React.FC<PaymentPendingProps> = ({
  intentId,
  attemptId,
  amount,
  method,
  onSuccess,
  onFailure,
  onCancel,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(300); // 5 minutes standard UPI / 3DS timeout
  const [checking, setChecking] = useState(false);
  const [pollError, setPollError] = useState<string | null>(null);

  const checkStatus = async () => {
    try {
      setChecking(true);
      setPollError(null);
      const jwt = localStorage.getItem("jwt");
      const res = await api.get(`/api/v1/payment/intent/${intentId}`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });

      const intent = res.data?.intent;
      if (intent?.status === "SUCCEEDED") {
        onSuccess(intent);
      } else if (intent?.status === "FAILED") {
        onFailure(intent?.lastFailureReason || "Payment was declined by your bank or payment provider.");
      }
    } catch (err: any) {
      setPollError(err.response?.data?.message || "Temporarily unable to fetch status. Retrying...");
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onFailure("Payment session timed out. No funds were debited, or any deducted funds will be refunded within 24-48 hours.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Poll every 3.5 seconds
    const pollInterval = setInterval(() => {
      checkStatus();
    }, 3500);

    return () => {
      clearInterval(timer);
      clearInterval(pollInterval);
    };
  }, [intentId]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

  return (
    <div className="flex flex-col items-center justify-center p-6 sm:p-10 max-w-md mx-auto text-center space-y-6 bg-card text-card-foreground border border-border/70 rounded-3xl shadow-lg">
      <div className="relative flex items-center justify-center">
        <CircularProgress
          size={76}
          thickness={3.5}
          sx={{ color: "var(--color-primary, #0d9488)" }}
        />
        <HourglassEmptyOutlined
          className="absolute text-primary animate-pulse"
          sx={{ fontSize: 32 }}
        />
      </div>

      <div className="space-y-2">
        <span className="text-xs font-black tracking-widest uppercase text-primary px-3 py-1 rounded-full bg-primary/10">
          Authorization in Progress
        </span>
        <Typography variant="h5" fontWeight="800" className="text-foreground">
          Waiting for Payment
        </Typography>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          Please authorize the payment of{" "}
          <strong className="text-foreground">₹{amount?.toLocaleString("en-IN")}</strong> via your {method} app.
        </p>
      </div>

      {/* Countdown Clock */}
      <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 w-full flex items-center justify-between text-xs">
        <span className="font-semibold text-muted-foreground">Session expires in:</span>
        <span className="font-black text-sm tracking-widest text-primary font-mono bg-background px-2.5 py-1 rounded-lg border border-border/80">
          {formattedTime}
        </span>
      </div>

      {pollError && (
        <Alert severity="warning" sx={{ width: "100%", fontSize: "12px", textAlign: "left" }}>
          {pollError}
        </Alert>
      )}

      <div className="w-full space-y-3 pt-2">
        <Button
          variant="outlined"
          color="primary"
          fullWidth
          onClick={checkStatus}
          disabled={checking}
          startIcon={checking ? <CircularProgress size={16} /> : <RefreshOutlined />}
          sx={{
            py: 1.2,
            borderRadius: "0.75rem",
            textTransform: "none",
            fontWeight: 700,
          }}
        >
          {checking ? "Checking with Bank..." : "I have completed payment"}
        </Button>

        <Button
          variant="text"
          color="inherit"
          fullWidth
          onClick={onCancel}
          startIcon={<ArrowBack />}
          sx={{
            py: 1,
            borderRadius: "0.75rem",
            textTransform: "none",
            fontSize: "12px",
            color: "text.secondary",
          }}
        >
          Cancel & Select Another Method
        </Button>
      </div>

      <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground pt-2">
        <SecurityOutlined sx={{ fontSize: 14 }} className="text-emerald-500" />
        <span>Do not press back or refresh this window</span>
      </div>
    </div>
  );
};
