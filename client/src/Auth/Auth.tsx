import { useState } from "react";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";
import { Button, Snackbar } from "@mui/material";
import {
  VerifiedUserOutlined,
  LocalShippingOutlined,
  AssignmentReturnOutlined,
  ShieldOutlined,
} from "@mui/icons-material";
import { useAppDispatch, useAppSelector } from "../Redux Toolkit/Store";
import { clearMessage } from "../Redux Toolkit/features/Auth/AuthSlice";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { getSafeReturnUrl } from "../utils/navigation";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { auth } = useAppSelector((store) => store);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const returnTo = getSafeReturnUrl(searchParams, location.state, "/");

  const handleCloseSnackbar = () => {
    dispatch(clearMessage());
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-3 sm:p-6 lg:p-10 bg-muted/20">
      {/* Flipkart / Myntra Dual-Pane Master Card */}
      <div className="w-full max-w-4xl bg-card rounded-2xl sm:rounded-3xl shadow-2xl border border-border/80 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[580px]">
        {/* Left Branding & Trust Panel (Flipkart / Myntra Benchmark) */}
        <div className="md:col-span-5 bg-gradient-to-br from-[#064e3b] via-[#022c22] to-[#01140e] p-6 sm:p-8 lg:p-10 flex flex-col justify-between text-white relative overflow-hidden">
          {/* Subtle Ambient Glow Effect */}
          <div className="absolute -top-20 -left-20 w-56 h-56 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-56 h-56 rounded-full bg-teal-500/20 blur-3xl pointer-events-none" />

          {/* Top Section */}
          <div className="relative z-10">
            <div
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-2 cursor-pointer group mb-6"
            >
              <span className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-emerald-300 group-hover:scale-105 transition-transform">
                <ShieldOutlined sx={{ fontSize: 18 }} />
              </span>
              <span className="text-xl font-black tracking-tight text-white">
                Zosh<span className="text-emerald-400">Bazaar</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              {auth.otpSent
                ? auth.isNewUser
                  ? "Looks like you're new here!"
                  : "Welcome back!"
                : isLogin
                ? "Login"
                : "Looks like you're new here!"}
            </h1>

            <p className="text-xs sm:text-sm text-emerald-200/80 mt-2 font-normal leading-relaxed">
              {auth.otpSent
                ? auth.isNewUser
                  ? "Sign up with your details to start shopping on India's premier multi-vendor marketplace."
                  : "Enter the security code to access your Orders, Wishlist & Saved Addresses."
                : isLogin
                ? "Get access to your Orders, Wishlist and Personalized Recommendations."
                : "Sign up with your details to unlock verified seller offers and express delivery."}
            </p>
          </div>

          {/* Middle Decorative Trust Graphic */}
          <div className="my-6 hidden md:flex items-center justify-center relative z-10">
            <div className="w-28 h-28 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shadow-inner">
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
                <VerifiedUserOutlined sx={{ fontSize: 40 }} />
              </div>
            </div>
          </div>

          {/* Bottom Trust Pillars (Flipkart / Amazon Benchmark) */}
          <div className="space-y-3 pt-4 border-t border-white/10 relative z-10 text-xs text-emerald-100/90 font-medium">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                <VerifiedUserOutlined sx={{ fontSize: 14 }} />
              </span>
              <span>100% Genuine & Certified Vendors</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                <LocalShippingOutlined sx={{ fontSize: 14 }} />
              </span>
              <span>Real-time Live Order Tracking</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                <AssignmentReturnOutlined sx={{ fontSize: 14 }} />
              </span>
              <span>Hassle-Free 7-Day Easy Returns</span>
            </div>
          </div>
        </div>

        {/* Right Authentication Form Panel */}
        <div className="md:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between bg-card text-card-foreground">
          {/* Top Switch Tabs (if OTP not sent yet) */}
          {!auth.otpSent && (
            <div className="flex items-center bg-muted/50 p-1 rounded-xl border border-border/80 mb-6 w-fit">
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isLogin
                    ? "bg-card text-primary shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Existing User
              </button>
              <button
                type="button"
                onClick={() => setIsLogin(false)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  !isLogin
                    ? "bg-card text-primary shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                New Customer
              </button>
            </div>
          )}

          {/* Dynamic Active Form */}
          <div className="flex-1 flex flex-col justify-center">
            {isLogin ? (
              <LoginForm returnTo={returnTo} />
            ) : (
              <SignupForm returnTo={returnTo} />
            )}
          </div>

          {/* Bottom Policy & Secondary Switch */}
          <div className="pt-6 border-t border-border/60 mt-6 space-y-3 text-center">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              By continuing, you agree to Zosh Bazaar's{" "}
              <a href="#" className="text-primary hover:underline font-semibold">
                Terms of Use
              </a>{" "}
              and{" "}
              <a href="#" className="text-primary hover:underline font-semibold">
                Privacy Policy
              </a>
              .
            </p>

            {!auth.otpSent && (
              <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <span>
                  {isLogin ? "New to Zosh Bazaar?" : "Already have an account?"}
                </span>
                <Button
                  onClick={() => setIsLogin(!isLogin)}
                  variant="text"
                  color="primary"
                  size="small"
                  sx={{
                    textTransform: "none",
                    fontWeight: 700,
                    p: 0,
                    minWidth: "auto",
                  }}
                >
                  {isLogin ? "Create an account" : "Log in"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Snackbar
        open={Boolean(auth.message)}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={auth.message}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </div>
  );
};

export default Auth;
