import React, { useState } from "react";
import { usePartnerAuth } from "../../context/PartnerAuthContext";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Truck, ArrowRight, AlertCircle } from "lucide-react";

export const PartnerLogin: React.FC = () => {
  const { login } = usePartnerAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const [secret, setSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!identifier.trim()) {
      setErrorMsg("Please enter your Phone Number or Agent ID.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");
      await login(identifier.trim(), secret.trim());
      navigate("/");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed";
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex items-center justify-center p-3 sm:p-6 lg:p-10">
      <div className="w-full max-w-md bg-card border border-border rounded-3xl p-5 sm:p-8 shadow-xl flex flex-col justify-between space-y-6">
        {/* Top Brand Header */}
        <div className="space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-black text-2xl shadow-xl">
            <Truck size={30} />
          </div>
          <div>
            <span className="text-[11px] font-black uppercase tracking-widest text-primary">
              Zosh Bazaar Logistics
            </span>
            <h1 className="text-2xl font-black text-foreground tracking-tight mt-0.5">
              Delivery Partner App
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Sign in to start your delivery shift, access optimized routes, and capture proof of delivery.
            </p>
          </div>
        </div>

        {/* Main Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-muted-foreground block mb-1.5">
              Registered Phone Number or Agent ID
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. 9876543210 or AGT-001"
              className="w-full px-3.5 py-3 rounded-xl border border-border bg-surface text-sm font-bold focus:ring-2 focus:ring-primary focus:outline-hidden"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground block mb-1.5">
              Password or Login OTP
            </label>
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Enter your password or 6-digit OTP"
              className="w-full px-3.5 py-3 rounded-xl border border-border bg-surface text-sm font-bold focus:ring-2 focus:ring-primary focus:outline-hidden"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-13 rounded-xl bg-primary text-primary-foreground font-black text-sm flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-transform cursor-pointer"
          >
            <span>{loading ? "Authenticating..." : "Sign In & Start Shift"}</span>
            <ArrowRight size={18} />
          </button>

          {/* Real Enterprise Support Info */}
          <div className="pt-3 border-t border-border/80 text-center space-y-1">
            <p className="text-[11px] text-muted-foreground">
              New partner or having difficulty signing in?
            </p>
            <p className="text-[11px] text-primary font-bold">
              Contact your assigned Delivery Hub Coordinator
            </p>
          </div>
        </form>

        {/* Footer Security Notice */}
        <div className="pt-2 border-t border-border flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>Secured Zosh Express Partner Gateway</span>
        </div>
      </div>
    </div>
  );
};
