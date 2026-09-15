import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useLogisticsAuth } from "../../context/LogisticsAuthContext";
import { OtpInputField } from "../../components/common/OtpInputField";
import {
  LocalShippingOutlined,
  ShieldOutlined,
  EmailOutlined,
  CheckCircleOutline,
  LockOutlined,
  SpeedOutlined,
  AltRouteOutlined,
} from "@mui/icons-material";
import { CircularProgress, Alert } from "@mui/material";

export const LogisticsLogin: React.FC = () => {
  const { sendLoginOtp, loginWithOtp, isAuthenticated } = useLogisticsAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"EMAIL" | "OTP">("EMAIL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Check if session expired
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("session_expired") === "true") {
      setError("Your session has expired or authentication is required. Please sign in again.");
    }
  }, [location.search]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || "/";
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location.state]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError("Please enter your registered operator or administrator email.");
      return;
    }

    setLoading(true);
    setError(null);
    setInfo(null);

    const res = await sendLoginOtp(cleanEmail);
    setLoading(false);

    if (res.success) {
      setStep("OTP");
      setInfo(res.message || "Authentication code dispatched to your email.");
    } else {
      setError(res.message || "Could not send OTP code. Please check your email.");
    }
  };

  const handleVerifyOtp = async (otpCode: string) => {
    if (!otpCode || otpCode.length !== 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await loginWithOtp(email.trim().toLowerCase(), otpCode);
    setLoading(false);

    if (res.success) {
      const from = (location.state as any)?.from?.pathname || "/";
      navigate(from, { replace: true });
    } else {
      setError(res.message || "Authentication failed. Code may be invalid or expired.");
    }
  };

  const handleQuickDemoFill = () => {
    setEmail("rahulraj21480@gmail.com");
    setError(null);
    setInfo("Demo Admin account filled. Click 'Dispatch Security OTP' to proceed.");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center px-4 py-12 antialiased selection:bg-primary/20">
      {/* Background ambient gradient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-primary/10 rounded-full blur-3xl opacity-50" />
        <div className="absolute -bottom-40 right-10 w-[500px] h-[400px] bg-info/10 rounded-full blur-3xl opacity-40" />
      </div>

      <div className="relative w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 border border-primary/25 text-primary shadow-sm mb-2">
            <LocalShippingOutlined fontSize="large" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Logistics Control Tower
          </h1>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Zosh Bazaar Supply Chain Telemetry, Hub Dispatch & Fleet Orchestration Platform
          </p>
        </div>

        {/* Login Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border shadow-xl backdrop-blur-sm space-y-6">
          {error && (
            <Alert
              severity="error"
              onClose={() => setError(null)}
              className="text-xs rounded-xl"
            >
              {error}
            </Alert>
          )}

          {info && (
            <Alert
              severity="info"
              onClose={() => setInfo(null)}
              className="text-xs rounded-xl"
            >
              {info}
            </Alert>
          )}

          {step === "EMAIL" ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <EmailOutlined fontSize="inherit" /> Operator Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. rahulraj21480@gmail.com"
                    disabled={loading}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-foreground placeholder:text-muted-foreground/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Authorized for Logistics Operators, Dispatchers, and Platform Administrators.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full py-2.5 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-xs tracking-wide uppercase hover:opacity-90 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                {loading ? (
                  <>
                    <CircularProgress size={16} color="inherit" />
                    <span>Dispatching OTP...</span>
                  </>
                ) : (
                  <>
                    <ShieldOutlined fontSize="small" />
                    <span>Dispatch Security OTP</span>
                  </>
                )}
              </button>

              {/* Dev Quick Access Helper */}
              <div className="pt-2 border-t border-border/60">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">Seeded Admin Account:</span>
                  <button
                    type="button"
                    onClick={handleQuickDemoFill}
                    className="text-[11px] font-medium text-primary hover:underline"
                  >
                    Auto-Fill rahulraj21480@gmail.com
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="space-y-5">
              <div className="space-y-1 text-center">
                <div className="text-xs text-muted-foreground">
                  Verification code sent to:
                </div>
                <div className="text-sm font-semibold font-mono text-foreground flex items-center justify-center gap-2">
                  <span>{email}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("EMAIL");
                      setOtp("");
                      setError(null);
                    }}
                    className="text-[11px] font-sans text-primary hover:underline font-normal"
                  >
                    (Change)
                  </button>
                </div>
              </div>

              <OtpInputField
                length={6}
                value={otp}
                onChange={(val) => {
                  setOtp(val);
                  setError(null);
                }}
                onComplete={handleVerifyOtp}
                onResend={() => handleSendOtp()}
                isLoading={loading}
              />

              <button
                type="button"
                onClick={() => handleVerifyOtp(otp)}
                disabled={loading || otp.length !== 6}
                className="w-full py-2.5 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-xs tracking-wide uppercase hover:opacity-90 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                {loading ? (
                  <>
                    <CircularProgress size={16} color="inherit" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <CheckCircleOutline fontSize="small" />
                    <span>Verify & Launch Control Tower</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Security / System Badges */}
        <div className="grid grid-cols-3 gap-2 text-center text-muted-foreground">
          <div className="p-2 rounded-xl bg-card border border-border/80 space-y-0.5">
            <LockOutlined fontSize="small" className="text-success" />
            <div className="text-[10px] font-bold text-foreground">RBAC Guard</div>
            <div className="text-[9px]">Strict Clearance</div>
          </div>
          <div className="p-2 rounded-xl bg-card border border-border/80 space-y-0.5">
            <SpeedOutlined fontSize="small" className="text-primary" />
            <div className="text-[10px] font-bold text-foreground">WebSocket</div>
            <div className="text-[9px]">Live Telemetry</div>
          </div>
          <div className="p-2 rounded-xl bg-card border border-border/80 space-y-0.5">
            <AltRouteOutlined fontSize="small" className="text-info" />
            <div className="text-[10px] font-bold text-foreground">Multi-Hub</div>
            <div className="text-[9px]">Fulfillment Lanes</div>
          </div>
        </div>
      </div>
    </div>
  );
};
