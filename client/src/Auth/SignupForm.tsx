import React from "react";
import { Button, CircularProgress, TextField, Alert } from "@mui/material";
import { EditOutlined } from "@mui/icons-material";
import { useFormik } from "formik";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../Redux Toolkit/Store";
import {
  sendLoginSignupOtp,
  signup,
  resetOtpState,
} from "../Redux Toolkit/features/Auth/AuthSlice";
import { SignupFormValidationSchema } from "../Validation/validationSchemas";
import { OtpInputField } from "../common/OtpInputField";

interface SignupFormProps {
  returnTo?: string;
}

const SignupForm: React.FC<SignupFormProps> = ({ returnTo = "/" }) => {
  const { auth } = useAppSelector((store) => store);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {
      fullName: "",
      mobile: "",
      email: "",
      otp: "",
    },
    validationSchema: SignupFormValidationSchema,
    onSubmit: (values) => {
      dispatch(signup({ ...values, returnTo, navigate }));
    },
  });

  const handleSendOtp = async (isResend = false) => {
    if (!formik.values.email) {
      formik.setFieldTouched("email", true);
      return;
    }
    await dispatch(
      sendLoginSignupOtp({ email: formik.values.email, mode: "auto", isResend })
    );
  };

  const handleAutoSubmit = (otpVal: string) => {
    formik.setFieldValue("otp", otpVal);
    if (
      formik.values.email &&
      formik.values.fullName &&
      formik.values.mobile &&
      otpVal.length === 6
    ) {
      dispatch(
        signup({
          ...formik.values,
          otp: otpVal,
          returnTo,
          navigate,
        })
      );
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
          {auth.otpSent ? "Complete Registration" : "Create an Account"}
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          {auth.otpSent
            ? "Enter your details and the 6-digit code sent to your email"
            : "Enter your email to receive a registration verification code"}
        </p>
      </div>

      {/* Prominent Error Alert */}
      {auth.error && (
        <Alert
          severity="error"
          sx={{ mb: 2.5, borderRadius: "0.75rem", fontSize: "12.5px" }}
        >
          {auth.error}
        </Alert>
      )}

      <form
        className="flex flex-col gap-4"
        onSubmit={
          auth.otpSent
            ? formik.handleSubmit
            : (e) => {
                e.preventDefault();
                handleSendOtp(false);
              }
        }
      >
        {/* Email step */}
        {!auth.otpSent ? (
          <div className="w-full">
            <TextField
              fullWidth
              id="email"
              name="email"
              label="Email Address"
              placeholder="e.g. yourname@example.com"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
              autoFocus
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "0.75rem",
                },
              }}
            />
          </div>
        ) : (
          /* Details + OTP Step */
          <div className="flex flex-col gap-4">
            {/* Email chip with change option */}
            <div className="flex items-center justify-between bg-primary/10 border border-primary/20 px-3.5 py-2.5 rounded-xl text-xs">
              <span className="text-muted-foreground truncate">
                Code sent to <strong className="text-foreground font-bold">{formik.values.email}</strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  formik.setFieldValue("otp", "");
                  dispatch(resetOtpState());
                }}
                className="text-primary hover:text-primary/80 font-semibold flex items-center gap-1 cursor-pointer shrink-0 ml-2"
              >
                <EditOutlined sx={{ fontSize: 13 }} />
                <span>Change</span>
              </button>
            </div>

            {/* Full Name */}
            <div className="w-full">
              <TextField
                fullWidth
                id="fullName"
                name="fullName"
                label="Full Name"
                placeholder="e.g. John Doe"
                value={formik.values.fullName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.fullName && Boolean(formik.errors.fullName)}
                helperText={formik.touched.fullName && formik.errors.fullName}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "0.75rem",
                  },
                }}
              />
            </div>

            {/* Mobile Number */}
            <div className="w-full">
              <TextField
                fullWidth
                id="mobile"
                name="mobile"
                label="Mobile Number (10 digits)"
                placeholder="e.g. 9876543210"
                value={formik.values.mobile}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.mobile && Boolean(formik.errors.mobile)}
                helperText={formik.touched.mobile && formik.errors.mobile}
                inputProps={{ maxLength: 10, inputMode: "numeric" }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "0.75rem",
                  },
                }}
              />
            </div>

            <div className="pt-1">
              <label className="block text-xs font-semibold text-muted-foreground mb-2 text-center">
                Enter 6-Digit Email OTP
              </label>
              <OtpInputField
                length={6}
                value={formik.values.otp}
                onChange={(val) => formik.setFieldValue("otp", val)}
                onComplete={handleAutoSubmit}
                onResend={() => handleSendOtp(true)}
                initialCooldown={auth.cooldownSeconds || 60}
                isLoading={auth.loading}
              />
              {formik.touched.otp && formik.errors.otp && (
                <p className="text-xs font-semibold text-destructive text-center mt-1.5">
                  {formik.errors.otp}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="pt-2">
          <Button
            type="submit"
            variant="contained"
            color="primary"
            sx={{
              py: "12px",
              borderRadius: "12px",
              fontWeight: 700,
              textTransform: "none",
              fontSize: "0.95rem",
            }}
            fullWidth
            disabled={
              auth.loading ||
              (!auth.otpSent && auth.otpLoading) ||
              (auth.otpSent && formik.values.otp.length !== 6)
            }
          >
            {auth.loading || (!auth.otpSent && auth.otpLoading) ? (
              <CircularProgress size={24} sx={{ color: "white" }} />
            ) : auth.otpSent ? (
              "Create Account & Continue"
            ) : (
              "Send Verification Code"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SignupForm;
