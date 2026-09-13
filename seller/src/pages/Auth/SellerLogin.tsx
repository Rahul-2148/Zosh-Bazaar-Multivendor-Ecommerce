import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Store, ArrowForward, EmailOutlined, LockOutlined, VpnKeyOutlined, CheckCircleOutline } from "@mui/icons-material";
import { Button, CircularProgress } from "@mui/material";
import { useSellerAuth } from "../../context/SellerAuthContext";

export const SellerLogin: React.FC = () => {
  const { sendOtp, loginWithOtp } = useSellerAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [step, setStep] = useState<"EMAIL" | "OTP">("EMAIL");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      setLoading(true);
      setErrorMsg("");
      setSuccessMsg("");
      await sendOtp(email.trim(), "login");
      setSuccessMsg("A 6-digit one-time password has been sent to your email.");
      setStep("OTP");
    } catch (err: any) {
      console.error("Send OTP failed:", err);
      setErrorMsg(err.response?.data?.message || err.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) return;

    try {
      setLoading(true);
      setErrorMsg("");
      await loginWithOtp(email.trim(), otp.trim());
      const destination = (location.state as any)?.from?.pathname || "/";
      navigate(destination, { replace: true });
    } catch (err: any) {
      console.error("Login verify error:", err);
      setErrorMsg(err.response?.data?.message || err.message || "Invalid OTP code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-3xl p-8 shadow-xl space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto mb-3">
            <Store fontSize="large" />
          </div>
          <h1 className="text-xl font-black tracking-tight text-foreground">
            ZOSH BAZAAR
          </h1>
          <p className="text-xs font-semibold text-primary uppercase tracking-widest">
            Merchant Operating System
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Sign in to access your vendor dashboard, catalog, and fulfill customer orders
          </p>
        </div>

        {/* Feedback alerts */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-semibold flex items-center gap-2">
            <CheckCircleOutline fontSize="small" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Step 1: Request OTP */}
        {step === "EMAIL" && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Registered Merchant Email
              </label>
              <div className="relative">
                <EmailOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" fontSize="small" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. vendor@zoshbazaar.com"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-surface border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-primary"
                />
              </div>
            </div>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <ArrowForward fontSize="small" />}
              sx={{
                backgroundColor: "var(--color-primary)",
                color: "var(--color-primary-foreground)",
                fontWeight: 800,
                textTransform: "none",
                borderRadius: "12px",
                py: 1.3,
                fontSize: "13px",
              }}
            >
              {loading ? "Sending OTP..." : "Send Verification OTP"}
            </Button>
          </form>
        )}

        {/* Step 2: Verify OTP */}
        {step === "OTP" && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">
                  6-Digit Verification OTP
                </label>
                <button
                  type="button"
                  onClick={() => setStep("EMAIL")}
                  className="text-[11px] font-semibold text-primary hover:underline"
                >
                  Change Email
                </button>
              </div>
              <div className="relative">
                <VpnKeyOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" fontSize="small" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-surface border border-border text-base text-foreground font-mono tracking-widest text-center focus:outline-hidden focus:border-primary"
                />
              </div>
            </div>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <LockOutlined fontSize="small" />}
              sx={{
                backgroundColor: "var(--color-primary)",
                color: "var(--color-primary-foreground)",
                fontWeight: 800,
                textTransform: "none",
                borderRadius: "12px",
                py: 1.3,
                fontSize: "13px",
              }}
            >
              {loading ? "Verifying..." : "Verify & Sign In"}
            </Button>
          </form>
        )}

        {/* Footer info */}
        <div className="border-t border-border pt-4 text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            Don&apos;t have a seller account yet?{" "}
            <Link to="/register" className="font-bold text-primary hover:underline">
              Register Storefront
            </Link>
          </p>
          <p className="text-[11px] text-muted-foreground">
            Enter your registered seller email to receive a secure one-time verification code.
          </p>
        </div>
      </div>
    </div>
  );
};
