import React, { useState, useEffect } from "react";
import {
  TextField,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  ConfirmationNumberOutlined,
  CheckCircle,
  ChevronRight,
  AutoAwesome,
  Close,
} from "@mui/icons-material";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import {
  applyCoupon,
  removeCoupon,
  getAvailableCoupons,
} from "../../../Redux Toolkit/features/customer/CouponSlice";
import { fetchUserCart } from "../../../Redux Toolkit/features/customer/CartSlice";
import { useNavigate } from "react-router-dom";

export const SavingsZoneCard: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { coupon, cart } = useAppSelector((store) => store);
  const jwt = localStorage.getItem("jwt") || "";

  const [inputCode, setInputCode] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch available coupons from server
  useEffect(() => {
    if (jwt) {
      dispatch(getAvailableCoupons(jwt));
    }
  }, [dispatch, jwt]);

  const activeCouponCode = cart?.cart?.couponCode || coupon?.coupon?.code;
  const activeCouponDiscount = cart?.cart?.couponPrice || coupon?.coupon?.discount;

  const handleApply = async (codeToApply: string) => {
    if (!codeToApply.trim() || coupon.loading) return;
    setErrorMsg(null);

    const res = await dispatch(
      applyCoupon({ code: codeToApply.trim().toUpperCase(), jwt, apply: "true" })
    );

    if (applyCoupon.rejected.match(res)) {
      setErrorMsg(
        (res.payload as any)?.message || "Invalid or expired coupon code."
      );
    } else {
      setInputCode("");
      dispatch(fetchUserCart(jwt));
    }
  };

  const handleRemove = async () => {
    if (coupon.loading) return;
    setErrorMsg(null);
    await dispatch(removeCoupon(jwt));
    dispatch(fetchUserCart(jwt));
  };

  const couponsList = coupon.availableCoupons && coupon.availableCoupons.length > 0
    ? coupon.availableCoupons
    : [
        {
          _id: "1",
          code: "WELCOME50",
          discountPercentage: 10,
          minimumOrderValue: 499,
          validityStartDate: "",
          validityEndDate: "",
        },
        {
          _id: "2",
          code: "FESTIVE15",
          discountPercentage: 15,
          minimumOrderValue: 999,
          validityStartDate: "",
          validityEndDate: "",
        },
        {
          _id: "3",
          code: "ZOSH100",
          discountPercentage: 20,
          minimumOrderValue: 1499,
          validityStartDate: "",
          validityEndDate: "",
        },
      ];

  return (
    <div className="rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-gradient-to-b from-blue-50/70 via-card to-card p-4 sm:p-5 shadow-xs flex flex-col gap-4">
      {/* Header: WOW! Savings zone */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <AutoAwesome sx={{ fontSize: 18 }} />
          </div>
          <div>
            <h3 className="text-sm font-black tracking-tight text-foreground flex items-center gap-1.5">
              <span className="italic text-blue-600 dark:text-blue-400">WOW!</span> Savings zone
            </h3>
            <p className="text-[11px] text-muted-foreground font-medium">
              Authoritative bank offers & promo vouchers for your cart
            </p>
          </div>
        </div>
      </div>

      {/* Active Coupon Banner if applied */}
      {activeCouponCode && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle sx={{ fontSize: 18 }} className="text-emerald-600 shrink-0" />
            <div className="min-w-0">
              <span className="text-xs font-black text-emerald-900 dark:text-emerald-200 block truncate">
                Code <span className="font-mono">{activeCouponCode}</span> Applied!
              </span>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold">
                You saved ₹{(activeCouponDiscount || 0).toLocaleString("en-IN")} extra on this order
              </span>
            </div>
          </div>
          <Button
            size="small"
            color="error"
            onClick={handleRemove}
            disabled={coupon.loading}
            startIcon={<Close sx={{ fontSize: 14 }} />}
            sx={{
              textTransform: "none",
              fontSize: "11px",
              fontWeight: 800,
              py: 0.2,
              px: 1,
              borderRadius: "0.5rem",
              bgcolor: "rgba(239, 68, 68, 0.1)",
              "&:hover": { bgcolor: "rgba(239, 68, 68, 0.2)" },
            }}
          >
            Remove
          </Button>
        </div>
      )}

      {/* Available Coupons List */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-xs font-bold text-foreground">
          <span className="flex items-center gap-1">
            <ConfirmationNumberOutlined sx={{ fontSize: 16 }} className="text-primary" />
            Available Coupons & Vouchers
          </span>
          <button
            type="button"
            onClick={() => navigate("/account/coupons")}
            className="text-[11px] font-bold text-primary hover:underline cursor-pointer inline-flex items-center"
          >
            Show all <ChevronRight sx={{ fontSize: 14 }} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {couponsList.map((c) => {
            const isThisApplied = activeCouponCode === c.code;

            return (
              <div
                key={c._id || c.code}
                className={`p-2.5 rounded-xl border flex flex-col justify-between gap-1.5 transition-all ${
                  isThisApplied
                    ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black font-mono tracking-wider text-primary">
                      {c.code}
                    </span>
                    {isThisApplied && (
                      <span className="text-[10px] font-extrabold text-emerald-600 flex items-center gap-0.5">
                        <CheckCircle sx={{ fontSize: 12 }} /> Active
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-bold text-foreground mt-0.5">
                    {c.discountPercentage}% OFF
                  </div>
                  <p className="text-[10px] text-muted-foreground line-clamp-1">
                    On orders above ₹{c.minimumOrderValue.toLocaleString("en-IN")}
                  </p>
                </div>

                <Button
                  size="small"
                  variant={isThisApplied ? "contained" : "outlined"}
                  color={isThisApplied ? "success" : "primary"}
                  onClick={() => handleApply(c.code)}
                  disabled={coupon.loading || isThisApplied}
                  sx={{
                    textTransform: "none",
                    fontSize: "11px",
                    fontWeight: 800,
                    py: 0.3,
                    borderRadius: "0.5rem",
                  }}
                >
                  {isThisApplied ? "Applied" : "Apply"}
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Manual Input Promo Code Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleApply(inputCode);
        }}
        className="flex gap-2 pt-1 border-t border-border"
      >
        <TextField
          size="small"
          fullWidth
          placeholder="Enter custom promo code"
          value={inputCode}
          onChange={(e) => {
            setInputCode(e.target.value.toUpperCase());
            setErrorMsg(null);
          }}
          disabled={coupon.loading}
          inputProps={{
            style: {
              textTransform: "uppercase",
              fontSize: "12px",
              fontWeight: "600",
            },
          }}
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={!inputCode.trim() || coupon.loading}
          sx={{
            textTransform: "none",
            fontWeight: 800,
            fontSize: "12px",
            minWidth: "85px",
            borderRadius: "0.6rem",
          }}
        >
          {coupon.loading ? <CircularProgress size={16} color="inherit" /> : "Apply"}
        </Button>
      </form>

      {/* Feedback alerts */}
      {errorMsg && (
        <Alert severity="error" sx={{ fontSize: "12px", py: 0.5, borderRadius: "0.5rem" }}>
          {errorMsg}
        </Alert>
      )}
    </div>
  );
};

export default SavingsZoneCard;
