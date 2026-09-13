import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Store, ArrowForward, CheckCircleOutline } from "@mui/icons-material";
import { Button, CircularProgress } from "@mui/material";
import { useSellerAuth } from "../../context/SellerAuthContext";

export const SellerRegister: React.FC = () => {
  const { registerSeller } = useSellerAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [sellerName, setSellerName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [gstin, setGstin] = useState("");
  const [businessName, setBusinessName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!sellerName || !email || !mobile || !password || !gstin) {
      setErrorMsg("Please fill in all mandatory seller fields.");
      return;
    }

    try {
      setLoading(true);
      await registerSeller({
        sellerName: sellerName.trim(),
        email: email.trim().toLowerCase(),
        mobile: Number(mobile),
        password: password.trim(),
        GSTIN: gstin.trim().toUpperCase(),
        businessDetails: {
          businessName: businessName.trim() || sellerName.trim(),
        },
      });

      setSuccessMsg("Merchant account registered! Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err: any) {
      console.error("Registration error:", err);
      setErrorMsg(err.response?.data?.message || err.message || "Failed to register seller.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-card border border-border rounded-3xl p-8 shadow-xl space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto mb-3">
            <Store fontSize="large" />
          </div>
          <h1 className="text-xl font-black tracking-tight text-foreground">
            Join Zosh Bazaar as a Seller
          </h1>
          <p className="text-xs text-muted-foreground">
            Launch your store, configure generic variants, and reach thousands of customers
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Seller / Contact Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                required
                value={sellerName}
                onChange={(e) => setSellerName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs text-foreground focus:outline-hidden focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Store / Business Name
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Acme Electronics"
                className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs text-foreground focus:outline-hidden focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Merchant Email Address <span className="text-destructive">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vendor@domain.com"
                className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs text-foreground focus:outline-hidden focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Mobile Number <span className="text-destructive">*</span>
              </label>
              <input
                type="tel"
                required
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="9876543210"
                className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs text-foreground focus:outline-hidden focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                GSTIN Tax Identifier <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                required
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                placeholder="29ABCDE1234F1Z5"
                className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs text-foreground font-mono uppercase focus:outline-hidden focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Account Password <span className="text-destructive">*</span>
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs text-foreground focus:outline-hidden focus:border-primary"
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
              mt: 2,
            }}
          >
            {loading ? "Registering Store..." : "Register Merchant Account"}
          </Button>
        </form>

        <div className="border-t border-border pt-4 text-center">
          <p className="text-xs text-muted-foreground">
            Already registered?{" "}
            <Link to="/login" className="font-bold text-primary hover:underline">
              Sign In to Merchant OS
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
