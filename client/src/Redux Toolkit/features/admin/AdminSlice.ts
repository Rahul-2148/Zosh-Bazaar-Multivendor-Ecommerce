import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { Api } from "../../../config/Api";
import type {
  AdminState,
  UpdateSellerAccountStatusResponse,
  ErrorResponse,
} from "../../../types/adminTypes/adminTypes";

const initialState: AdminState = {
  sellers: [],
  selectedSeller: null,
  profile: null,
  report: null,
  profileUpdated: false,
  loading: false,
  error: null,
  message: null,
};

const API_URL = "/admin";

// ---------------- THUNK ----------------
export const updateSellerAccountStatus = createAsyncThunk<
  UpdateSellerAccountStatusResponse,
  { id: string; accountStatus: string },
  { rejectValue: ErrorResponse }
>(
  "admin/updateSellerAccountStatus",
  async ({ id, accountStatus }, { rejectWithValue }) => {
    try {
      const response = await Api.patch(
        `${API_URL}/seller/${id}/status/${accountStatus}`
      );
      console.log("update seller account status by admin", response.data);
      return response.data as UpdateSellerAccountStatusResponse;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || {
          message: "Failed to update seller account status",
        }
      );
    }
  }
);

// ---------------- SLICE ----------------
export const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    clearAdminMessage: (state) => {
      state.message = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // updateSellerAccountStatus
    builder.addCase(updateSellerAccountStatus.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.message = null;
    });
    builder.addCase(updateSellerAccountStatus.fulfilled, (state, action) => {
      state.loading = false;
      state.message = action.payload.message;
      state.error = null;

      // update seller in profile if present
      if (state.profile?._id === action.payload.seller._id) {
        state.profile = action.payload.seller;
      }

      // update seller in report if present
      if (state.report?._id === action.payload.seller._id) {
        state.report = action.payload.seller;
      }

      // update seller in selectedSeller if present
      if (state.selectedSeller?._id === action.payload.seller._id) {
        state.selectedSeller = action.payload.seller;
      }

      // update seller in list if present
      state.sellers = state.sellers.map((s) =>
        s._id === action.payload.seller._id ? action.payload.seller : s
      );

      // update seller in list if present
      state.sellers = state.sellers.map((s) =>
        s._id === action.payload.seller._id ? action.payload.seller : s
      );

      if (state.selectedSeller?._id === action.payload.seller._id) {
        state.selectedSeller = action.payload.seller;
      }
    });
    builder.addCase(updateSellerAccountStatus.rejected, (state, action) => {
      state.loading = false;
      state.error =
        action.payload?.message || "Failed to update seller account status";
    });
  },
});

export const { clearAdminMessage } = adminSlice.actions;
export default adminSlice.reducer;
