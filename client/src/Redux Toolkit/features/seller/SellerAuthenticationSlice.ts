import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { Api } from "../../../config/Api";
import type {
  CreateSellerResponse,
  sellerAuthState,
  OtpResponse,
  VerifyOtpResponse,
  CreateSellerRequest, 
} from "../../../types/sellerTypes/sellerAuthTypes";

const initialState: sellerAuthState = {
  jwt: null,
  role: null,
  otpSent: false,
  loading: false,
  error: null,
  message: null,
};

const API_URL = "/seller";

// Send Login OTP
export const sendLoginOtp = createAsyncThunk<
  OtpResponse,
  { email: string; mode: "signup" | "login" },
  { rejectValue: string }
>("/seller/sendLoginOtp", async ({ email, mode }, { rejectWithValue }) => {
  try {
    const response = await Api.post(`${API_URL}/sent/login-otp`, {
      email,
      mode,
    });
    return response.data as OtpResponse;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to send OTP"
    );
  }
});

// Verify Login OTP
export const verifyLoginOtp = createAsyncThunk<
  VerifyOtpResponse,
  { email: string; otp: string; navigate: (path: string) => void },
  { rejectValue: string }
>(
  "/seller/verifyLoginOtp",
  async ({ email, otp, navigate }, { rejectWithValue }) => {
    try {
      const response = await Api.post(`${API_URL}/verify/login-otp`, {
        email,
        otp,
      });
      localStorage.setItem("jwt", response.data.jwt);
      navigate("/seller");
      return response.data as VerifyOtpResponse;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Login failed");
    }
  }
);

// Create Seller
export const createSeller = createAsyncThunk<
  CreateSellerResponse,
  CreateSellerRequest, 
  { rejectValue: string }
>("/seller/createSeller", async (seller, { rejectWithValue }) => {
  try {
    const response = await Api.post(`${API_URL}/create`, seller);
    // console.log("create seller", response.data);
    return response.data as CreateSellerResponse;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || "Signup failed");
  }
});

// Slice
const sellerAuthenticationSlice = createSlice({
  name: "sellerAuthentication",
  initialState: initialState,
  reducers: {
    sellerLogout: (state) => {
      state.jwt = null;
      state.role = null;
      state.otpSent = false;
      state.loading = false;
      state.error = null;
      state.message = "Logout successful";
      localStorage.removeItem("jwt");
    },
    clearSellerAuthMessages: (state) => {
      state.message = null;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    // Send OTP
    builder.addCase(sendLoginOtp.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.message = null;
    });
    builder.addCase(sendLoginOtp.fulfilled, (state, action) => {
      state.loading = false;
      state.otpSent = action.payload.otpSent;
      state.message = action.payload.message;
      state.error = null;
    });
    builder.addCase(sendLoginOtp.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || "Failed to send OTP";
      state.message = null;
    });

    // Verify Login OTP
    builder.addCase(verifyLoginOtp.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.message = null;
    });
    builder.addCase(verifyLoginOtp.fulfilled, (state, action) => {
      state.loading = false;
      state.jwt = action.payload.jwt;
      state.role = action.payload.role;
      state.message = action.payload.message || "Login successful";
      state.error = null;
    });
    builder.addCase(verifyLoginOtp.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || "Login failed";
      state.message = null;
    });

    // Create Seller
    builder.addCase(createSeller.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.message = null;
    });
    builder.addCase(createSeller.fulfilled, (state, action) => {
      state.loading = false;
      state.jwt = action.payload.jwt;
      state.role = action.payload.role;
      state.message = action.payload.message || "Seller created successfully";
      state.error = null;
    });
    builder.addCase(createSeller.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || "Signup failed";
      state.message = null;
    });
  },
});

export const performSellerLogout = () => async (dispatch: any) => {
  dispatch(sellerLogout());
};

export const { sellerLogout, clearSellerAuthMessages } = sellerAuthenticationSlice.actions;
export default sellerAuthenticationSlice.reducer;
