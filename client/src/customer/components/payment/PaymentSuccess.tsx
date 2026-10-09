import React from "react";
import { Button, Typography, Divider, Chip } from "@mui/material";
import {
  CheckCircle,
  LocalShippingOutlined,
  ReceiptLongOutlined,
  ShoppingBagOutlined,
  VerifiedUserOutlined,
  AccountBalanceWalletOutlined,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

interface PaymentSuccessProps {
  intent: any;
  orders: any[];
  onContinueShopping?: () => void;
}

export const PaymentSuccess: React.FC<PaymentSuccessProps> = ({
  intent,
  orders = [],
  onContinueShopping,
}) => {
  const navigate = useNavigate();

  const primaryOrderId = orders[0]?._id || intent?.orderIds?.[0] || intent?.orders?.[0];
  const payableAmount = intent?.amount || orders.reduce((sum, o) => sum + (o.totalSellingPrice || 0), 0);
  const method = intent?.selectedMethod || "ONLINE";

  return (
    <div className="flex flex-col items-center justify-center p-6 sm:p-10 max-w-lg mx-auto text-center space-y-6 bg-card text-card-foreground border border-emerald-500/30 rounded-3xl shadow-xl">
      <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 animate-bounce">
        <CheckCircle sx={{ fontSize: 52 }} />
      </div>

      <div className="space-y-1.5">
        <Chip
          label="Payment Verified & Authoritative"
          size="small"
          color="success"
          variant="filled"
          icon={<VerifiedUserOutlined />}
          sx={{ fontWeight: 800, fontSize: "11px", letterSpacing: "0.05em" }}
        />
        <Typography variant="h5" fontWeight="900" className="text-foreground tracking-tight">
          Payment Successful!
        </Typography>
        <p className="text-sm text-muted-foreground">
          Your order has been confirmed and routed to vendor fulfillment centers.
        </p>
      </div>

      {/* Financial Details Card */}
      <div className="p-4 rounded-2xl bg-muted/40 border border-border/70 w-full text-left text-xs space-y-2.5">
        <div className="flex justify-between items-center text-muted-foreground">
          <span>Amount Paid:</span>
          <span className="font-extrabold text-base text-foreground text-emerald-600 dark:text-emerald-400">
            ₹{payableAmount?.toLocaleString("en-IN")}
          </span>
        </div>

        <div className="flex justify-between items-center text-muted-foreground">
          <span>Payment Method:</span>
          <span className="font-bold text-foreground uppercase tracking-wider">{method}</span>
        </div>

        {intent?.splitConfig?.useWallet && (
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 font-semibold">
              <AccountBalanceWalletOutlined sx={{ fontSize: 15 }} />
              <span>Split Payment Applied</span>
            </div>
            <span>
              ₹{intent.splitConfig.walletAmount?.toLocaleString("en-IN")} (Wallet) + ₹
              {intent.splitConfig.externalAmount?.toLocaleString("en-IN")} ({method})
            </span>
          </div>
        )}

        <Divider />

        <div className="flex justify-between items-center text-muted-foreground">
          <span>Payment Intent ID:</span>
          <span className="font-mono text-foreground truncate max-w-[220px]">
            {intent?.intentId || "INT-OK"}
          </span>
        </div>

        {primaryOrderId && (
          <div className="flex justify-between items-center text-muted-foreground">
            <span>Order Reference:</span>
            <span className="font-mono font-bold text-primary truncate max-w-[220px]">
              {String(primaryOrderId)}
            </span>
          </div>
        )}

        <div className="flex justify-between items-center text-muted-foreground">
          <span>Estimated Delivery:</span>
          <span className="font-semibold text-foreground flex items-center gap-1">
            <LocalShippingOutlined sx={{ fontSize: 14 }} className="text-primary" />
            2 - 4 Business Days
          </span>
        </div>
      </div>

      {/* Call to Actions */}
      <div className="w-full flex flex-col sm:flex-row gap-3 pt-2">
        <Button
          variant="contained"
          color="primary"
          fullWidth
          startIcon={<ReceiptLongOutlined />}
          onClick={() => {
            if (primaryOrderId) {
              navigate(`/payment-success/${primaryOrderId}`);
            } else {
              navigate("/account/orders");
            }
          }}
          sx={{
            py: 1.3,
            borderRadius: "0.75rem",
            textTransform: "none",
            fontWeight: 800,
            boxShadow: "0 4px 14px rgba(13, 148, 136, 0.4)",
          }}
        >
          View Order Status
        </Button>

        <Button
          variant="outlined"
          color="inherit"
          fullWidth
          startIcon={<ShoppingBagOutlined />}
          onClick={() => {
            if (onContinueShopping) {
              onContinueShopping();
            } else {
              navigate("/");
            }
          }}
          sx={{
            py: 1.3,
            borderRadius: "0.75rem",
            textTransform: "none",
            fontWeight: 600,
          }}
        >
          Continue Shopping
        </Button>
      </div>
    </div>
  );
};
