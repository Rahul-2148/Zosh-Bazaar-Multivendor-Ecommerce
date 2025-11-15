import { Button, CircularProgress, TextField } from "@mui/material";
import { useFormik } from "formik";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../Redux Toolkit/Store";
import {
  sendLoginSignupOtp,
  signup,
} from "../Redux Toolkit/features/Auth/AuthSlice";
import { SignupFormValidationSchema } from "../Validation/validationSchemas";

const SignupForm = () => {
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
      // after OTP entered, call signup
      console.log(values);
      dispatch(signup({ ...values, navigate }));
    },
  });

  const handleSendOtp = () => {
    // send OTP request with mode=signup
    dispatch(
      sendLoginSignupOtp({ email: formik.values.email, mode: "signup" })
    );
  };

  return (
    <div className="">
      <h1 className="text-2xl text-center font-bold text-teal-600 pb-5">
        Signup
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

        {/* fullname */}
        {auth.otpSent && (
          <div>
            <TextField
              fullWidth
              id="fullName"
              name="fullName"
              label="Full Name"
              value={formik.values.fullName}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.fullName && Boolean(formik.errors.fullName)}
              helperText={formik.touched.fullName && formik.errors.fullName}
            />
          </div>
        )}

        {/* mobile */}
        {auth.otpSent && (
          <div>
            <TextField
              fullWidth
              id="mobile"
              name="mobile"
              label="Mobile"
              value={formik.values.mobile}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.mobile && Boolean(formik.errors.mobile)}
              helperText={formik.touched.mobile && formik.errors.mobile}
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
              "Create Account"
            ) : (
              "Send OTP"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SignupForm;
