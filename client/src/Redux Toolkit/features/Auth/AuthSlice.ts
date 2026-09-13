import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { Api } from "../../../config/Api";
import { resetUserState } from "../customer/UserSlice";
import { resetCartState } from "../customer/CartSlice";
import { resetOrderState } from "../customer/OrderSlice";
import { resetWishlistState } from "../customer/WishlistSlice";

import { getSafeReturnUrl } from "../../../utils/navigation";

const API_URL = "/auth";

interface AuthState {
  jwt: string | null;
  role: string | null;
  loading: boolean;
  otpLoading: boolean;
  resendLoading: boolean;
  error: string | null;
  otpSent: boolean;
  isNewUser: boolean;
  message: string | null;
  cooldownSeconds: number;
}

const initialState: AuthState = {
  jwt: typeof window !== "undefined" ? localStorage.getItem("jwt") : null,
  role: typeof window !== "undefined" ? localStorage.getItem("role") : null,
  loading: false,
  otpLoading: false,
  resendLoading: false,
  error: null,
  otpSent: false,
  isNewUser: false,
  message: null,
  cooldownSeconds: 60,
};

// Send Login Signup Otp
export const sendLoginSignupOtp = createAsyncThunk<
  any,
  { email: string; mode?: "signup" | "login" | "auto"; isResend?: boolean }
>("/auth/sendLoginSignupOtp", async ({ email, mode = "auto", isResend = false }, { rejectWithValue }) => {
  try {
    const response = await Api.post(`${API_URL}/sent/login-signup-otp`, {
      email,
      mode,
    });
    return { ...response.data, isResend };
  } catch (error: any) {
    console.log(error);
    return rejectWithValue(
      error.response?.data || { message: "Something went wrong" }
    );
  }
});

// Signup
export const signup = createAsyncThunk<any, any>(
  "/auth/signup",
  async (signupRequest, { rejectWithValue }) => {
    try {
      const response = await Api.post(`${API_URL}/signup`, signupRequest);
      console.log("response", response.data);

      localStorage.setItem("jwt", response.data.jwt);
      if (response.data.role) {
        localStorage.setItem("role", response.data.role);
      }
      if (response.data.role === "ROLE_ADMIN") {
        signupRequest.navigate("/admin");
      } else {
        const dest = getSafeReturnUrl(signupRequest.returnTo, null, "/");
        signupRequest.navigate(dest);
      }
      return response.data;
    } catch (error: any) {
      console.log(error);
      return rejectWithValue(
        error.response?.data || { message: "Signup failed" }
      );
    }
  }
);

// Signin or Login
export const signin = createAsyncThunk<any, any>(
  "/auth/signin",
  async (signinRequest, { rejectWithValue }) => {
    try {
      const response = await Api.post(`${API_URL}/signin`, signinRequest);
      console.log("response", response.data);
      localStorage.setItem("jwt", response.data.jwt);
      if (response.data.role) {
        localStorage.setItem("role", response.data.role);
      }
      if (response.data.role === "ROLE_ADMIN") {
        signinRequest.navigate("/admin");
      } else {
        const dest = getSafeReturnUrl(signinRequest.returnTo, null, "/");
        signinRequest.navigate(dest);
      }
      return response.data;
    } catch (error: any) {
      console.log(error);
      return rejectWithValue(
        error.response?.data || { message: "Signin failed" }
      );
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: initialState,
  reducers: {
    logout: (state) => {
      state.jwt = null;
      state.role = null;
      state.otpSent = false;
      state.isNewUser = false;
      state.message = "Logout successful";
      state.loading = false;
      state.otpLoading = false;
      state.resendLoading = false;
      state.error = null;
      localStorage.removeItem("jwt");
      localStorage.removeItem("role");
    },
    clearMessage: (state) => {
      state.message = null;
      state.error = null;
    },
    resetOtpState: (state) => {
      state.otpSent = false;
      state.isNewUser = false;
      state.error = null;
      state.message = null;
      state.otpLoading = false;
      state.resendLoading = false;
    },
  },
  extraReducers: (builder) => {
    // 🔹 Send OTP
    builder.addCase(sendLoginSignupOtp.pending, (state, action) => {
      if (action.meta.arg?.isResend) {
        state.resendLoading = true;
      } else {
        state.otpLoading = true;
      }
      state.error = null;
    });
    builder.addCase(sendLoginSignupOtp.fulfilled, (state, action) => {
      state.otpLoading = false;
      state.resendLoading = false;
      state.otpSent = true;
      if (typeof action.payload?.isNewUser === "boolean") {
        state.isNewUser = action.payload.isNewUser;
      }
      state.cooldownSeconds = action.payload?.cooldownSeconds || 60;
      state.message = action.payload?.message || "OTP sent successfully";
    });
    builder.addCase(sendLoginSignupOtp.rejected, (state, action: any) => {
      state.otpLoading = false;
      state.resendLoading = false;
      state.error = action.payload?.message || "Failed to send OTP";
      state.message = action.payload?.message || "Failed to send OTP";
    });

    // 🔹 Signup
    builder.addCase(signup.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(signup.fulfilled, (state, action) => {
      state.loading = false;
      state.jwt = action.payload.jwt;
      state.role = action.payload.role;
      state.message = action.payload?.message || "Signup successful";
    });
    builder.addCase(signup.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload?.message || "Signup failed";
      state.message = action.payload?.message || "Signup failed";
    });

    // 🔹 Signin
    builder.addCase(signin.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(signin.fulfilled, (state, action) => {
      state.loading = false;
      state.jwt = action.payload.jwt;
      state.role = action.payload.role;
      state.message = action.payload?.message || "Signin successful";
    });
    builder.addCase(signin.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload?.message || "Signin failed";
      state.message = action.payload?.message || "Signin failed";
    });
  },
});

export const performLogout = () => async (dispatch: any) => {
  dispatch(logout());
  dispatch(resetUserState());
  dispatch(resetCartState());
  dispatch(resetOrderState());
  dispatch(resetWishlistState());
};

export const { logout, clearMessage, resetOtpState } = authSlice.actions;
export default authSlice.reducer;
