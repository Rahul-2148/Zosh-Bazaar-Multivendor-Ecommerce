import { Button, CircularProgress, TextField } from "@mui/material";
import { useFormik } from "formik";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../Redux Toolkit/Store";
import {
  sendLoginSignupOtp,
  signin,
} from "../Redux Toolkit/features/Auth/AuthSlice";
import { LoginFormValidationSchema } from "../Validation/validationSchemas";

const LoginForm = () => {
  const { auth } = useAppSelector((store) => store);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {
      email: "",
      otp: "",
    },
    validationSchema: LoginFormValidationSchema,
    onSubmit: (values) => {
      // after OTP entered, call signin
      dispatch(signin({ ...values, navigate }));
    },
  });

  const handleSendOtp = () => {
    const email = "signin_" + formik.values.email;
    // send OTP request with mode=login
    dispatch(sendLoginSignupOtp({ email: email, mode: "login" }));
  };

  return (
    <div>
      <h1 className="text-2xl text-center font-bold text-teal-600 pb-5">
        Login
      </h1>

      <form
        className="space-y-5"
        onSubmit={
          auth.otpSent
            ? formik.handleSubmit
            : (e) => {
                e.preventDefault();
                handleSendOtp();
              }
        }
      >
        {/* email */}
        <div>
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

        {/* otp */}
        {auth.otpSent && (
          <div>
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

        <div>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            sx={{ py: "12px" }}
            fullWidth
            disabled={auth.loading}
          >
            {auth.loading ? (
              <CircularProgress size={24} sx={{ color: "white" }} />
            ) : auth.otpSent ? (
              "Verify & Login"
            ) : (
              "Send OTP"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
