import React, { useState } from "react";
import { TextField, Button, CircularProgress } from "@mui/material";
import { QrCode2Outlined, CheckCircle } from "@mui/icons-material";

interface UpiPaymentProps {
  payableAmount: number;
  selectedUpiApp: string;
  onSelectUpiApp: (appId: string) => void;
  upiId: string;
  onChangeUpiId: (id: string) => void;
  showQr: boolean;
  onToggleQr: () => void;
  qrPayload?: string;
  onConfirmPayment: () => void;
  loading: boolean;
  availableApps?: Array<{ id: string; name: string; scheme?: string }>;
}

const DEFAULT_UPI_APPS = [
  { id: "gpay", name: "Google Pay", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  { id: "phonepe", name: "PhonePe", color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
  { id: "paytm", name: "Paytm", color: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20" },
  { id: "bhim", name: "BHIM UPI", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  { id: "cred", name: "CRED", color: "bg-slate-500/10 text-slate-800 dark:text-slate-200 border-slate-500/20" },
];

export const UpiPayment: React.FC<UpiPaymentProps> = ({
  payableAmount,
  selectedUpiApp,
  onSelectUpiApp,
  upiId,
  onChangeUpiId,
  showQr,
  onToggleQr,
  qrPayload: _qrPayload,
  onConfirmPayment,
  loading,
  availableApps,
}) => {
  const [vpaError, setVpaError] = useState<string | null>(null);

  const appsToRender = availableApps && availableApps.length > 0
    ? availableApps.map((app) => {
        const found = DEFAULT_UPI_APPS.find((a) => a.id === app.id);
        return {
          id: app.id,
          name: app.name,
          color: found ? found.color : "bg-primary/10 text-primary border-primary/20",
        };
      })
    : DEFAULT_UPI_APPS;

  const handleVpaSubmit = () => {
    if (!upiId || !upiId.includes("@")) {
      setVpaError("Please enter a valid UPI VPA (e.g. name@okhdfcbank)");
      return;
    }
    setVpaError(null);
    onConfirmPayment();
  };

  return (
    <div className="space-y-4">
      {/* 1. UPI Apps Grid */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2">
          Select your installed UPI application:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {appsToRender.map((app) => {
            const isSelected = selectedUpiApp === app.id && !showQr;
            return (
              <button
                type="button"
                key={app.id}
                onClick={() => {
                  onSelectUpiApp(app.id);
                  if (showQr) onToggleQr();
                }}
                className={`p-3 rounded-xl border transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary"
                    : "border-border/80 hover:border-primary/40 bg-card"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs border ${app.color}`}
                >
                  {app.name.slice(0, 2).toUpperCase()}
                </div>
                <span className="text-[11px] font-bold text-foreground truncate max-w-full">
                  {app.name}
                </span>
                {isSelected && (
                  <span className="text-[10px] font-bold text-primary flex items-center gap-0.5">
                    <CheckCircle sx={{ fontSize: 11 }} /> Selected
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. QR Code Toggle Card */}
      <div
        onClick={onToggleQr}
        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
          showQr
            ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary"
            : "border-border/80 hover:border-primary/40 bg-card"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <QrCode2Outlined sx={{ fontSize: 24 }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs sm:text-sm text-foreground">
                Pay via Instant QR Code
              </span>
              <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase">
                Zero App Switch
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Scan with any UPI app on another phone to complete payment
            </p>
          </div>
        </div>
        {showQr && <CheckCircle className="text-primary" sx={{ fontSize: 18 }} />}
      </div>

      {/* QR Code Expanded View */}
      {showQr && (
        <div className="p-5 rounded-2xl border border-dashed border-primary/50 bg-primary/5 flex flex-col items-center justify-center text-center space-y-3">
          <div className="p-3 bg-white rounded-xl shadow-md border border-border inline-block">
            {/* Real SVG QR Placeholder Representation */}
            <svg
              className="w-40 h-40"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="100" height="100" fill="white" />
              {/* Corner position markers */}
              <rect x="5" y="5" width="25" height="25" rx="3" fill="#0f172a" />
              <rect x="9" y="9" width="17" height="17" rx="2" fill="white" />
              <rect x="13" y="13" width="9" height="9" fill="#0f172a" />

              <rect x="70" y="5" width="25" height="25" rx="3" fill="#0f172a" />
              <rect x="74" y="9" width="17" height="17" rx="2" fill="white" />
              <rect x="78" y="13" width="9" height="9" fill="#0f172a" />

              <rect x="5" y="70" width="25" height="25" rx="3" fill="#0f172a" />
              <rect x="9" y="74" width="17" height="17" rx="2" fill="white" />
              <rect x="13" y="78" width="9" height="9" fill="#0f172a" />

              {/* Data matrix pattern */}
              <rect x="36" y="8" width="8" height="8" fill="#0f172a" />
              <rect x="48" y="8" width="8" height="8" fill="#0f172a" />
              <rect x="36" y="22" width="14" height="8" fill="#0f172a" />
              <rect x="8" y="38" width="14" height="8" fill="#0f172a" />
              <rect x="28" y="38" width="8" height="16" fill="#0f172a" />
              <rect x="42" y="38" width="16" height="8" fill="#0f172a" />
              <rect x="64" y="38" width="10" height="18" fill="#0f172a" />
              <rect x="80" y="38" width="12" height="8" fill="#0f172a" />
              <rect x="38" y="52" width="14" height="14" fill="#0f172a" />
              <rect x="58" y="60" width="8" height="14" fill="#0f172a" />
              <rect x="72" y="60" width="18" height="8" fill="#0f172a" />
              <rect x="38" y="74" width="22" height="10" fill="#0f172a" />
              <rect x="66" y="76" width="12" height="14" fill="#0f172a" />
              <rect x="84" y="76" width="10" height="18" fill="#0f172a" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold text-foreground">
              Scan & Pay ₹{payableAmount.toLocaleString("en-IN")}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Open Google Pay, PhonePe, Paytm or BHIM on your mobile phone
            </p>
          </div>
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={onConfirmPayment}
            disabled={loading}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: "0.65rem", px: 3 }}
          >
            {loading ? <CircularProgress size={18} color="inherit" /> : "I Have Completed QR Payment"}
          </Button>
        </div>
      )}

      {/* 3. Direct VPA Input Fallback */}
      {!showQr && (
        <div className="pt-2 border-t border-border/60">
          <p className="text-xs font-semibold text-muted-foreground mb-2">
            Or enter your UPI ID (VPA):
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <TextField
              fullWidth
              size="small"
              placeholder="e.g. mobile@upi or username@okhdfcbank"
              value={upiId}
              onChange={(e) => {
                onChangeUpiId(e.target.value);
                setVpaError(null);
              }}
              error={Boolean(vpaError)}
              helperText={vpaError || "A collect request will be dispatched to your UPI app"}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleVpaSubmit}
              disabled={loading || !upiId}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                borderRadius: "0.65rem",
                px: 3,
                height: 40,
                shrink: 0,
              }}
            >
              {loading ? <CircularProgress size={18} color="inherit" /> : `Pay ₹${payableAmount}`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpiPayment;
