import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { Api } from "../../../config/Api";
import type { FetchUserResponse, UserState } from "../../../types/userTypes";

const API_URL = "/user";

// fetch user profile
export const fetchUserProfile = createAsyncThunk<FetchUserResponse, string>(
  "/user/fetchUserProfile",
  async (jwt, { rejectWithValue }) => {
    try {
      const response = await Api.get(`${API_URL}/profile`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      return response.data as FetchUserResponse;
    } catch (error: any) {
      console.log(error);
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch user profile" }
      );
    }
  }
);

// update user profile
export const updateUserProfile = createAsyncThunk<any, { jwt: string; data: { fullName?: string; mobile?: number; gender?: any; dateOfBirth?: any; avatar?: string } }>(
  "/user/updateUserProfile",
  async ({ jwt, data }, { rejectWithValue }) => {
    try {
      const response = await Api.patch(`${API_URL}/profile`, data, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to update profile" }
      );
    }
  }
);

// fetch user addresses
export const fetchUserAddresses = createAsyncThunk<any, string>(
  "/user/fetchUserAddresses",
  async (jwt, { rejectWithValue }) => {
    try {
      const response = await Api.get(`${API_URL}/address`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch addresses" }
      );
    }
  }
);

// add user address
export const addUserAddress = createAsyncThunk<any, { jwt: string; address: any }>(
  "/user/addUserAddress",
  async ({ jwt, address }, { rejectWithValue }) => {
    try {
      const response = await Api.post(`${API_URL}/address`, address, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to add address" }
      );
    }
  }
);

// update user address
export const updateUserAddress = createAsyncThunk<any, { jwt: string; addressId: string; address: any }>(
  "/user/updateUserAddress",
  async ({ jwt, addressId, address }, { rejectWithValue }) => {
    try {
      const response = await Api.put(`${API_URL}/address/${addressId}`, address, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to update address" }
      );
    }
  }
);

// delete user address
export const deleteUserAddress = createAsyncThunk<any, { jwt: string; addressId: string }>(
  "/user/deleteUserAddress",
  async ({ jwt, addressId }, { rejectWithValue }) => {
    try {
      const response = await Api.delete(`${API_URL}/address/${addressId}`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      return { addressId, ...response.data };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to delete address" }
      );
    }
  }
);

// set default user address
export const setDefaultUserAddress = createAsyncThunk<any, { jwt: string; addressId: string }>(
  "/user/setDefaultUserAddress",
  async ({ jwt, addressId }, { rejectWithValue }) => {
    try {
      const response = await Api.patch(`${API_URL}/address/${addressId}/default`, {}, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      return { addressId, ...response.data };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to set default address" }
      );
    }
  }
);

// fetch account overview
export const fetchAccountOverview = createAsyncThunk<any, void>(
  "/account/fetchOverview",
  async (_, { rejectWithValue }) => {
    try {
      const response = await Api.get("/account/overview");
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch account overview" }
      );
    }
  }
);

// update user preferences
export const updateUserPreferences = createAsyncThunk<any, any>(
  "/account/updatePreferences",
  async (preferences, { rejectWithValue }) => {
    try {
      const response = await Api.patch("/account/preferences", preferences);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to update preferences" }
      );
    }
  }
);

// change password
export const changeUserPassword = createAsyncThunk<any, { currentPassword?: string; newPassword: string }>(
  "/account/changePassword",
  async (passwords, { rejectWithValue }) => {
    try {
      const response = await Api.post("/account/change-password", passwords);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to change password" }
      );
    }
  }
);

// payment methods
export const fetchPaymentMethods = createAsyncThunk<any, void>(
  "/account/fetchPaymentMethods",
  async (_, { rejectWithValue }) => {
    try {
      const response = await Api.get("/account/payment-methods");
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch payment methods" }
      );
    }
  }
);

export const addPaymentMethod = createAsyncThunk<any, any>(
  "/account/addPaymentMethod",
  async (methodData, { rejectWithValue }) => {
    try {
      const response = await Api.post("/account/payment-methods", methodData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to save payment method" }
      );
    }
  }
);

export const deletePaymentMethod = createAsyncThunk<any, string>(
  "/account/deletePaymentMethod",
  async (methodId, { rejectWithValue }) => {
    try {
      const response = await Api.delete(`/account/payment-methods/${methodId}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to delete payment method" }
      );
    }
  }
);

export const setDefaultPaymentMethod = createAsyncThunk<any, string>(
  "/account/setDefaultPaymentMethod",
  async (methodId, { rejectWithValue }) => {
    try {
      const response = await Api.patch(`/account/payment-methods/${methodId}/default`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to set default payment method" }
      );
    }
  }
);

// customer transactions
export const fetchCustomerTransactions = createAsyncThunk<any, void>(
  "/account/fetchTransactions",
  async (_, { rejectWithValue }) => {
    try {
      const response = await Api.get("/account/transactions");
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch transactions" }
      );
    }
  }
);

// buy again products
export const fetchBuyAgainProducts = createAsyncThunk<any, void>(
  "/account/fetchBuyAgain",
  async (_, { rejectWithValue }) => {
    try {
      const response = await Api.get("/account/buy-again");
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch buy again products" }
      );
    }
  }
);

// user returns
export const fetchUserReturns = createAsyncThunk<any, void>(
  "/account/fetchReturns",
  async (_, { rejectWithValue }) => {
    try {
      const response = await Api.get("/account/returns");
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch returns" }
      );
    }
  }
);

// available coupons
export const fetchAvailableCoupons = createAsyncThunk<any, void>(
  "/account/fetchAvailableCoupons",
  async (_, { rejectWithValue }) => {
    try {
      const response = await Api.get("/coupon/available");
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch coupons" }
      );
    }
  }
);

// download user data
export const downloadUserData = createAsyncThunk<any, void>(
  "/account/downloadUserData",
  async (_, { rejectWithValue }) => {
    try {
      const response = await Api.get("/account/data-export");
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to export data" }
      );
    }
  }
);

// delete account (LEGACY)
export const deleteUserAccount = createAsyncThunk<any, string>(
  "/account/deleteAccount",
  async (confirmationText, { rejectWithValue }) => {
    try {
      const response = await Api.post("/account/delete-account", { confirmationText });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to delete account" }
      );
    }
  }
);

// ── Account Lifecycle Thunks ──────────────────────────

export const getLifecycleConfig = createAsyncThunk<any, void>(
  "account/getLifecycleConfig",
  async (_, { rejectWithValue }) => {
    try {
      const response = await Api.get("/account/lifecycle/config");
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || { message: "Failed to load config" });
    }
  }
);

export const deactivateAccount = createAsyncThunk<any, string>(
  "account/deactivate",
  async (reason, { rejectWithValue }) => {
    try {
      const response = await Api.post("/account/deactivate", { reason });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || { message: "Deactivation failed" });
    }
  }
);

export const reactivateAccount = createAsyncThunk<any, void>(
  "account/reactivate",
  async (_, { rejectWithValue }) => {
    try {
      const response = await Api.post("/account/reactivate");
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || { message: "Reactivation failed" });
    }
  }
);

export const requestAccountDeletion = createAsyncThunk<any, string>(
  "account/deletion/request",
  async (reason, { rejectWithValue }) => {
    try {
      const response = await Api.post("/account/deletion/request", { reason });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || { message: "Request failed" });
    }
  }
);

export const sendDeletionOTP = createAsyncThunk<any, void>(
  "account/deletion/sendOtp",
  async (_, { rejectWithValue }) => {
    try {
      const response = await Api.post("/account/deletion/send-otp");
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || { message: "Failed to send OTP" });
    }
  }
);

export const verifyDeletionOTP = createAsyncThunk<any, string>(
  "account/deletion/verifyOtp",
  async (otp, { rejectWithValue }) => {
    try {
      const response = await Api.post("/account/deletion/verify-otp", { otp });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || { message: "Verification failed" });
    }
  }
);

export const confirmAccountDeletion = createAsyncThunk<any, void>(
  "account/deletion/confirm",
  async (_, { rejectWithValue }) => {
    try {
      const response = await Api.post("/account/deletion/confirm");
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || { message: "Confirmation failed" });
    }
  }
);

export const cancelAccountDeletion = createAsyncThunk<any, void>(
  "account/deletion/cancel",
  async (_, { rejectWithValue }) => {
    try {
      const response = await Api.post("/account/deletion/cancel");
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || { message: "Cancellation failed" });
    }
  }
);

export const getDeletionStatus = createAsyncThunk<any, void>(
  "account/deletion/status",
  async (_, { rejectWithValue }) => {
    try {
      const response = await Api.get("/account/deletion/status");
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || { message: "Failed to get status" });
    }
  }
);

export const submitSupportDeletionRequest = createAsyncThunk<any, string>(
  "account/deletion/supportRequest",
  async (reason, { rejectWithValue }) => {
    try {
      const response = await Api.post("/account/deletion/support-request", { reason });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || { message: "Support request failed" });
    }
  }
);

const initialState: UserState = {
  user: null,
  addresses: [],
  overview: null,
  paymentMethods: [],
  transactions: [],
  buyAgain: [],
  returns: [],
  availableCoupons: [],
  loading: false,
  error: null,
  message: null,
};

const userSlice = createSlice({
  name: "user",
  initialState: initialState,
  reducers: {
    resetUserState: (state) => {
      state.user = null;
      state.addresses = [];
      state.overview = null;
      state.paymentMethods = [];
      state.transactions = [];
      state.buyAgain = [];
      state.returns = [];
      state.availableCoupons = [];
      state.loading = false;
      state.error = null;
      state.message = null;
    },
    clearMessage: (state) => {
      state.message = null;
    },
  },
  extraReducers: (builder) => {
    // fetch profile
    builder.addCase(fetchUserProfile.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.message = null;
      state.user = null;
    });
    builder.addCase(fetchUserProfile.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload.user;
      state.error = null;
    });
    builder.addCase(fetchUserProfile.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload;
    });

    // update profile
    builder.addCase(updateUserProfile.fulfilled, (state, action) => {
      if (action.payload?.user) {
        state.user = { ...state.user, ...action.payload.user };
      }
      state.message = "Profile updated successfully";
    });

    // fetch addresses
    builder.addCase(fetchUserAddresses.fulfilled, (state, action) => {
      state.addresses = action.payload?.addresses || [];
    });

    // add address
    builder.addCase(addUserAddress.fulfilled, (state, action) => {
      if (action.payload?.address) {
        if (action.payload.address.isDefault) {
          state.addresses.forEach((a) => {
            a.isDefault = false;
          });
          state.addresses.unshift(action.payload.address);
        } else {
          state.addresses.push(action.payload.address);
        }
      }
      state.message = "Address saved successfully";
    });

    // update address
    builder.addCase(updateUserAddress.fulfilled, (state, action) => {
      if (action.payload?.address) {
        if (action.payload.address.isDefault) {
          state.addresses.forEach((a) => {
            a.isDefault = a._id === action.payload.address._id;
          });
        }
        const index = state.addresses.findIndex(
          (a) => a._id === action.payload.address._id
        );
        if (index !== -1) {
          state.addresses[index] = action.payload.address;
        }
      }
      state.message = "Address updated successfully";
    });

    // set default address
    builder.addCase(setDefaultUserAddress.fulfilled, (state, action) => {
      state.addresses.forEach((a) => {
        a.isDefault = a._id === action.payload.addressId;
      });
      state.addresses.sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));
      state.message = "Default delivery address updated";
    });

    // delete address
    builder.addCase(deleteUserAddress.fulfilled, (state, action) => {
      state.addresses = state.addresses.filter(
        (a) => a._id !== action.payload.addressId
      );
      state.message = "Address deleted successfully";
    });

    // account overview
    builder.addCase(fetchAccountOverview.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchAccountOverview.fulfilled, (state, action) => {
      state.loading = false;
      state.overview = action.payload.overview;
      if (action.payload.overview?.user) {
        state.user = { ...state.user, ...action.payload.overview.user };
      }
    });
    builder.addCase(fetchAccountOverview.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload;
    });

    // update preferences
    builder.addCase(updateUserPreferences.fulfilled, (state, action) => {
      if (state.user) {
        state.user.preferences = action.payload.preferences;
      }
      if (state.overview) {
        state.overview.preferences = action.payload.preferences;
      }
      state.message = "Preferences updated";
    });

    // payment methods
    builder.addCase(fetchPaymentMethods.fulfilled, (state, action) => {
      state.paymentMethods = action.payload.paymentMethods || [];
    });
    builder.addCase(addPaymentMethod.fulfilled, (state, action) => {
      state.paymentMethods = action.payload.paymentMethods || [];
      state.message = "Payment method added securely";
    });
    builder.addCase(deletePaymentMethod.fulfilled, (state, action) => {
      state.paymentMethods = action.payload.paymentMethods || [];
      state.message = "Payment method removed";
    });
    builder.addCase(setDefaultPaymentMethod.fulfilled, (state, action) => {
      state.paymentMethods = action.payload.paymentMethods || [];
      state.message = "Default payment method updated";
    });

    // transactions
    builder.addCase(fetchCustomerTransactions.fulfilled, (state, action) => {
      state.transactions = action.payload.transactions || [];
    });

    // buy again
    builder.addCase(fetchBuyAgainProducts.fulfilled, (state, action) => {
      state.buyAgain = action.payload.products || [];
    });

    // returns
    builder.addCase(fetchUserReturns.fulfilled, (state, action) => {
      state.returns = action.payload.returns || [];
    });

    // coupons
    builder.addCase(fetchAvailableCoupons.fulfilled, (state, action) => {
      state.availableCoupons = action.payload.coupons || [];
    });
  },
});

export const { resetUserState, clearMessage } = userSlice.actions;
export default userSlice.reducer;
