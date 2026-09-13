import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { CircularProgress, Alert } from "@mui/material";
import { ShieldOutlined, EmailOutlined, ArrowForwardOutlined } from "@mui/icons-material";
import { OtpInputField } from "../../components/common/OtpInputField";

export const AdminLogin: React.FC = () => {
  const { sendLoginOtp, loginWithOtp, isAuthenticated } = useAdminAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"EMAIL" | "OTP">("EMAIL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email) {
      setError("Please enter your admin email address.");
      return;
    }

    setLoading(true);
    setError(null);
    setInfo(null);

    const res = await sendLoginOtp(email);
    setLoading(false);

    if (res.success) {
      setStep("OTP");
      setInfo(res.message || "Authentication code sent to your email.");
    } else {
      setError(res.message || "Failed to send code. Ensure the account exists.");
    }
  };

  const handleVerifyOtp = async (otpCode: string) => {
    if (!otpCode || otpCode.length !== 6) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await loginWithOtp(email, otpCode);
    setLoading(false);

    if (res.success) {
      navigate("/");
    } else {
      setError(res.message || "Invalid authentication code or missing admin role.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4 py-12">
      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center font-bold text-primary-foreground text-2xl shadow-xl shadow-primary/20">
          Z
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            Zosh Bazaar
          </h1>
          <p className="text-xs font-semibold text-primary tracking-wider uppercase">
            Operations & Admin Console
          </p>
        </div>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-card border border-border rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-2.5 mb-6 text-muted-foreground">
          <ShieldOutlined className="text-primary" />
          <h2 className="text-base font-bold text-foreground tracking-wide">
            {step === "EMAIL" ? "Authorized Personnel Sign In" : "Security Verification"}
          </h2>
        </div>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: "12px" }}>
            {error}
          </Alert>
        )}

        {info && (
          <Alert severity="info" sx={{ mb: 3, borderRadius: "12px" }}>
            {info}
          </Alert>
        )}

        {step === "EMAIL" ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Administrator Email
              </label>
              <div className="relative">
                <EmailOutlined className="absolute left-3.5 top-3 text-muted-foreground text-lg" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@zoshbazaar.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-card border border-input rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 cursor-pointer"
            >
              {loading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <>
                  <span>Request Verification Code</span>
                  <ArrowForwardOutlined sx={{ fontSize: 18 }} />
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="space-y-5">
            <div className="flex justify-between items-center bg-muted/60 border border-border px-3.5 py-2.5 rounded-xl text-xs">
              <span className="text-muted-foreground truncate">
                Target: <strong className="text-primary font-mono">{email}</strong>
              </span>
              <button
                type="button"
                onClick={() => setStep("EMAIL")}
                className="text-xs text-primary hover:underline font-semibold ml-2 shrink-0 cursor-pointer"
              >
                Change
              </button>
            </div>

            <OtpInputField
              length={6}
              value={otp}
              onChange={(val) => setOtp(val)}
              onComplete={handleVerifyOtp}
              onResend={async () => {
                await handleSendOtp();
              }}
              initialCooldown={60}
              isLoading={loading}
            />

            <button
              type="button"
              onClick={() => handleVerifyOtp(otp)}
              disabled={loading || otp.length !== 6}
              className="w-full py-3 px-4 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 cursor-pointer"
            >
              {loading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <span>Authorize & Access Console</span>
              )}
            </button>
          </div>
        )}

        <div className="mt-6 pt-5 border-t border-border flex flex-col items-center gap-2 text-center">
          <p className="text-[11px] text-muted-foreground">
            Confidential operations environment. All access attempts are authenticated via secure OTP and logged.
          </p>
        </div>
      </div>
    </div>
  );
};
