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

export interface MergeGuestCartOptions {
  isRetry?: boolean;
  retryMode?: "FAILED_ITEMS" | "NONE";
  idempotencyKey?: string;
  attempt?: number;
}

// Helper to safely merge guest cart without item loss
export const syncAndMergeGuestCart = async (
  jwt: string,
  options: MergeGuestCartOptions = {}
) => {
  try {
    const guestCartRaw = localStorage.getItem("zosh_guest_cart");
    if (!guestCartRaw) return;
    const guestItems = JSON.parse(guestCartRaw);
    if (!Array.isArray(guestItems) || guestItems.length === 0) {
      localStorage.removeItem("zosh_guest_cart");
      return;
    }

    // Ensure each guest item has a stable unique clientItemId
    const normalizedGuestItems = guestItems.map((gi: any, idx: number) => ({
      ...gi,
      clientItemId: gi.clientItemId || gi._id || `guest_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 7)}`,
    }));

    // Persist normalized clientItemIds back to localStorage before request
    localStorage.setItem("zosh_guest_cart", JSON.stringify(normalizedGuestItems));

    const idempotencyKey =
      options.idempotencyKey ||
      sessionStorage.getItem("zosh_cart_merge_idempotency_key") ||
      `merge_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem("zosh_cart_merge_idempotency_key", idempotencyKey);

    const response = await Api.post(
      "/cart/merge",
      {
        items: normalizedGuestItems,
        guestItems: normalizedGuestItems,
        isRetry: Boolean(options.isRetry),
        retryFailed: Boolean(options.isRetry),
        retryMode: options.retryMode || (options.isRetry ? "FAILED_ITEMS" : "NONE"),
        attempt: options.attempt || 1,
        idempotencyKey,
      },
      { headers: { Authorization: `Bearer ${jwt}` } }
    );

    // If response is invalid, error status, or malformed, preserve guest cart untouched!
    if (!response || !response.data || response.data.error || !Array.isArray(response.data.mergedItems)) {
      return;
    }

    const mergedList: any[] = response.data.mergedItems || [];
    const failedList: any[] = response.data.failedItems || [];

    // Map merged items by clientItemId
    const mergedMap = new Map<string, any>();
    mergedList.forEach((mi: any) => {
      if (mi.clientItemId) {
        mergedMap.set(String(mi.clientItemId), mi);
      }
    });

    const remainingGuestItems: any[] = [];

    normalizedGuestItems.forEach((gi: any) => {
      const cId = String(gi.clientItemId);
      const merged = mergedMap.get(cId);

      if (merged) {
        // Item was processed by merge engine
        const unmergedRemainder =
          typeof merged.remainingQuantity === "number"
            ? merged.remainingQuantity
            : (merged.partialStockApplied
              ? Math.max(0, (Number(gi.quantity) || 1) - (Number(merged.quantityMerged) || 0))
              : 0);

        if (unmergedRemainder > 0) {
          // Stock-capped! Update the item to only request the unmerged remainder on future retries
          remainingGuestItems.push({
            ...gi,
            quantity: unmergedRemainder,
            partialStockApplied: true,
            warning: `Stock capped: ${merged.quantityMerged} added to account cart, ${unmergedRemainder} remaining unmerged.`,
          });
        }
        // If unmergedRemainder === 0, the item was completely merged: drop it from guest cart!
      } else {
        // Not confirmed as merged: preserve in guest cart!
        remainingGuestItems.push(gi);
      }
    });

    if (remainingGuestItems.length === 0) {
      localStorage.removeItem("zosh_guest_cart");
      sessionStorage.removeItem("zosh_cart_merge_warnings");
      sessionStorage.removeItem("zosh_cart_merge_idempotency_key");
      sessionStorage.removeItem("zosh_cart_merge_attempt");
    } else {
      localStorage.setItem(
        "zosh_guest_cart",
        JSON.stringify(remainingGuestItems)
      );
      if (failedList.length > 0) {
        sessionStorage.setItem(
          "zosh_cart_merge_warnings",
          JSON.stringify(failedList)
        );
      } else {
        sessionStorage.removeItem("zosh_cart_merge_warnings");
      }
      // Once a confirmed partial response changes the stored guest payload from the original quantity to the remaining quantity,
      // the retry must use an appropriate new per-payload idempotency key.
      const currentAttempt = Number(sessionStorage.getItem("zosh_cart_merge_attempt") || "1");
      const nextAttempt = currentAttempt + 1;
      sessionStorage.setItem("zosh_cart_merge_attempt", String(nextAttempt));
      const baseKey = (idempotencyKey || `merge_${Date.now()}`).split("_rem_")[0];
      sessionStorage.setItem(
        "zosh_cart_merge_idempotency_key",
        `${baseKey}_rem_${nextAttempt}_${Math.random().toString(36).substring(2, 7)}`
      );
    }
  } catch (mergeErr) {
    // Network or server error: NEVER wipe user's local guest cart!
    console.warn(
      "[Auth] Guest cart merge warning (preserving local items):",
      mergeErr
    );
  }
};

// Helper for explicit user or system retry of failed or partial items
export const retryFailedGuestCartMerge = async (jwt: string) => {
  const storedKey = sessionStorage.getItem("zosh_cart_merge_idempotency_key") || undefined;
  const attempt = Number(sessionStorage.getItem("zosh_cart_merge_attempt") || "1") + 1;
  sessionStorage.setItem("zosh_cart_merge_attempt", String(attempt));
  return syncAndMergeGuestCart(jwt, {
    isRetry: true,
    retryMode: "FAILED_ITEMS",
    idempotencyKey: storedKey,
    attempt,
  });
};

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

      // Safely merge guest cart without item loss
      await syncAndMergeGuestCart(response.data.jwt);

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

      // Safely merge guest cart without item loss
      await syncAndMergeGuestCart(response.data.jwt);

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
