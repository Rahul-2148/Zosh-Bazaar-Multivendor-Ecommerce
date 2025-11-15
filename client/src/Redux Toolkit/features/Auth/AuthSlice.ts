import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { Api } from "../../../config/Api";
import { resetUserState } from "../customer/UserSlice";
import { resetCartState } from "../customer/CartSlice";
import { resetOrderState } from "../customer/OrderSlice";

const API_URL = "/auth";

interface AuthState {
  jwt: string | null;
  role: string | null;
  loading: boolean;
  error: string | null;
  otpSent: boolean;
  message: string | null;
}

const initialState: AuthState = {
  jwt: null,
  role: null,
  loading: false,
  error: null,
  otpSent: false,
  message: null,
};

// Send Login Signup Otp
export const sendLoginSignupOtp = createAsyncThunk<
  any,
  { email: string; mode: "signup" | "login" }
>("/auth/sendLoginSignupOtp", async ({ email, mode }, { rejectWithValue }) => {
  try {
    const response = await Api.post(`${API_URL}/sent/login-signup-otp`, {
      email,
      mode,
    });
    // console.log("response", response.data);
    return response.data;
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
      signupRequest.navigate("/");
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
      if (response.data.role === "ROLE_ADMIN") {
        signinRequest.navigate("/admin");
      } else {
        signinRequest.navigate("/");
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
      state.message = "Logout successful";
      state.loading = false;
      state.error = null;
      localStorage.removeItem("jwt");
    },
    clearMessage: (state) => {
      state.message = null;
    },
  },
  extraReducers: (builder) => {
    // 🔹 Send OTP
    builder.addCase(sendLoginSignupOtp.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(sendLoginSignupOtp.fulfilled, (state, action) => {
      state.loading = false;
      state.otpSent = true;
      state.message = action.payload?.message || "OTP sent successfully";
    });
    builder.addCase(sendLoginSignupOtp.rejected, (state, action: any) => {
      state.loading = false;
      state.message = action.payload?.message || "Failed to send OTP";
    });

    // 🔹 Signup
    builder.addCase(signup.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(signup.fulfilled, (state, action) => {
      state.loading = false;
      state.jwt = action.payload.jwt;
      state.role = action.payload.role;
      state.message = action.payload?.message || "Signup successful";
    });
    builder.addCase(signup.rejected, (state, action: any) => {
      state.loading = false;
      state.message = action.payload?.message || "Signup failed";
    });

    // 🔹 Signin
    builder.addCase(signin.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(signin.fulfilled, (state, action) => {
      state.loading = false;
      state.jwt = action.payload.jwt;
      state.role = action.payload.role;
      state.message = action.payload?.message || "Signin successful";
    });
    builder.addCase(signin.rejected, (state, action: any) => {
      state.loading = false;
      state.message = action.payload?.message || "Signin failed";
    });
  },
});

export const performLogout = () => async (dispatch: any) => {
  dispatch(logout());
  dispatch(resetUserState());
  dispatch(resetCartState());
  dispatch(resetOrderState());
};

export const { logout, clearMessage } = authSlice.actions;
export default authSlice.reducer;
