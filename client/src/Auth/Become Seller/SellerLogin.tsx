// src/components/seller/SellerLogin.tsx
import { useFormik } from "formik";
import { Button, CircularProgress, TextField } from "@mui/material";
import { LoginFormValidationSchema } from "../../Validation/validationSchemas";
import { useAppDispatch, useAppSelector } from "../../Redux Toolkit/Store";
import {
  sendLoginOtp,
  verifyLoginOtp,
  clearSellerAuthMessages,
} from "../../Redux Toolkit/features/seller/SellerAuthenticationSlice";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "../../common/SnackbarProvider";
import { useEffect } from "react";

const SellerLogin = () => {
  const { sellerAuth } = useAppSelector((store) => store);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();

  // Formik setup
  const formik = useFormik({
    initialValues: { email: "", otp: "" },
    validationSchema: LoginFormValidationSchema,
    onSubmit: (values) => {
      // OTP is already sent → verify OTP
      dispatch(verifyLoginOtp({ ...values, navigate }));
    },
  });

  // Show global snackbar for success/error messages
  useEffect(() => {
    if (sellerAuth.error) {
      showSnackbar(sellerAuth.error, "error");
      dispatch(clearSellerAuthMessages());
    }
    if (sellerAuth.message) {
      showSnackbar(sellerAuth.message, "success");
      dispatch(clearSellerAuthMessages());
    }
  }, [sellerAuth.error, sellerAuth.message, dispatch, showSnackbar]);

  // Unified submit: send OTP if not sent yet, else verify login
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formik.values.email) {
      showSnackbar("Email is required to send OTP", "error");
      return;
    }

    if (sellerAuth.otpSent) {
      formik.handleSubmit(); // verify OTP
    } else {
      // Send OTP
      dispatch(sendLoginOtp({ email: formik.values.email, mode: "login" }));
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 shadow-lg rounded-lg bg-white">
      <h1 className="text-2xl text-center font-bold text-teal-600 pb-5">
        Seller Login
      </h1>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <TextField
            fullWidth
            id="email"
            name="email"
            label="Email"
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.email && Boolean(formik.errors.email)}
            helperText={formik.touched.email && formik.errors.email}
          />
        </div>

        {sellerAuth.otpSent && (
          <div className="mb-4">
            <TextField
              fullWidth
              id="otp"
              name="otp"
              label="OTP"
              value={formik.values.otp}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.otp && Boolean(formik.errors.otp)}
              helperText={formik.touched.otp && formik.errors.otp}
            />
          </div>
        )}

        <div className="mt-4">
          <Button
            type="submit"
            variant="contained"
            color="primary"
            sx={{ py: "12px" }}
            fullWidth
            disabled={sellerAuth.loading}
          >
            {sellerAuth.loading ? (
              <CircularProgress size={24} sx={{ color: "white" }} />
            ) : sellerAuth.otpSent ? (
              "Login"
            ) : (
              "Send OTP"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SellerLogin;
