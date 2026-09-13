import { Button, CircularProgress, TextField, Alert } from "@mui/material";
import { EditOutlined, Stars } from "@mui/icons-material";
import { useFormik } from "formik";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../Redux Toolkit/Store";
import {
  sendLoginSignupOtp,
  signin,
  resetOtpState,
} from "../Redux Toolkit/features/Auth/AuthSlice";
import { LoginFormValidationSchema } from "../Validation/validationSchemas";
import { OtpInputField } from "../common/OtpInputField";

interface LoginFormProps {
  returnTo?: string;
}

const LoginForm: React.FC<LoginFormProps> = ({ returnTo = "/" }) => {
  const { auth } = useAppSelector((store) => store);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {
      email: "",
      fullName: "",
      otp: "",
    },
    validationSchema: LoginFormValidationSchema,
    onSubmit: (values) => {
      dispatch(
        signin({
          email: values.email.trim().toLowerCase(),
          otp: values.otp.trim(),
          fullName: values.fullName?.trim(),
          returnTo,
          navigate,
        })
      );
    },
  });

  const handleSendOtp = async (isResend = false) => {
    if (!formik.values.email) {
      formik.setFieldTouched("email", true);
      return;
    }
    dispatch(sendLoginSignupOtp({ email: formik.values.email.trim().toLowerCase(), mode: "auto", isResend }));
  };

  const handleAutoSubmit = (otpVal: string) => {
    if (formik.values.email && otpVal.length === 6) {
      dispatch(
        signin({
          email: formik.values.email.trim().toLowerCase(),
          otp: otpVal.trim(),
          fullName: formik.values.fullName?.trim(),
          returnTo,
          navigate,
        })
      );
    }
  };

  const handleChangeEmail = () => {
    formik.setFieldValue("otp", "");
    dispatch(resetOtpState());
  };

  return (
    <div className="w-full">
      <div className="mb-5">
        <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
          {auth.otpSent
            ? auth.isNewUser
              ? "Welcome to Zosh Bazaar!"
              : "Verify Identity"
            : "Sign in with OTP"}
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          {auth.otpSent
            ? auth.isNewUser
              ? "Looks like you're new here! Enter your name & the 6-digit code sent to your inbox."
              : "Enter the 6-digit security code sent to your registered email"
            : "Enter your email address to receive an instant verification code"}
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
          <div className="w-full space-y-1">
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
          /* OTP + Name Step */
          <div className="flex flex-col gap-3.5">
            {/* Email confirmation chip with change option */}
            <div className="flex items-center justify-between bg-primary/10 border border-primary/20 px-3.5 py-2.5 rounded-xl text-xs">
              <span className="text-muted-foreground truncate">
                Code sent to <strong className="text-foreground font-bold">{formik.values.email}</strong>
              </span>
              <button
                type="button"
                onClick={handleChangeEmail}
                className="text-primary hover:text-primary/80 font-semibold flex items-center gap-1 cursor-pointer shrink-0 ml-2"
              >
                <EditOutlined sx={{ fontSize: 13 }} />
                <span>Change</span>
              </button>
            </div>

            {/* If New User, collect Name */}
            {auth.isNewUser && (
              <div>
                <TextField
                  fullWidth
                  id="fullName"
                  name="fullName"
                  label="What should we call you? (Full Name)"
                  placeholder="e.g. Rahul Sharma"
                  value={formik.values.fullName}
                  onChange={formik.handleChange}
                  size="small"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "0.75rem",
                    },
                  }}
                />
              </div>
            )}

            {/* Smart 6-digit OTP Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold text-foreground uppercase tracking-wider">
                  Enter 6-Digit Code
                </label>
                {auth.isNewUser && (
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Stars sx={{ fontSize: 13 }} />
                    New Customer Registration
                  </span>
                )}
              </div>
              <OtpInputField
                length={6}
                value={formik.values.otp}
                onChange={(val) => formik.setFieldValue("otp", val)}
                onComplete={handleAutoSubmit}
                onResend={() => handleSendOtp(true)}
                initialCooldown={auth.cooldownSeconds || 60}
                isLoading={auth.loading}
              />
            </div>

            {formik.touched.otp && formik.errors.otp && (
              <p className="text-xs font-semibold text-destructive text-center">
                {formik.errors.otp}
              </p>
            )}
          </div>
        )}

        <div className="pt-1">
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
              boxShadow: "0 4px 14px rgba(13, 148, 136, 0.3)",
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
              auth.isNewUser ? "Create Account & Continue" : "Verify & Continue"
            ) : (
              "Get Verification Code"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
