// client/src/Redux Toolkit/features/seller/SellerSlice.ts

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type {
  DeleteSellerResponse,
  FetchSellerProfileResponse,
  GetAllSellersResponse,
  Seller,
  SellerState,
  UpdateSellerResponse,
  ErrorResponse,
  FetchSellerReportResponse,
  FetchSellerByIdResponse,
} from "../../../types/sellerTypes/sellerTypes";
import { Api } from "../../../config/Api";

const initialState: SellerState = {
  sellers: [],
  selectedSeller: null,
  profile: null,
  loading: false,
  error: null,
  report: null,
  profileUpdated: false,
  message: null,
};

const API_URL = "/seller";

// ---------------- THUNKS ----------------

// fetch seller profile
export const fetchSellerProfile = createAsyncThunk<
  FetchSellerProfileResponse,
  string,
  { rejectValue: ErrorResponse }
>("seller/fetchSellerProfile", async (jwt, { rejectWithValue }) => {
  try {
    const response = await Api.get(`${API_URL}/profile`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    // console.log("fetch seller profile", response.data);
    return response.data as FetchSellerProfileResponse;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data || { message: "Failed to fetch seller profile" }
    );
  }
});

// fetch all sellers
export const fetchAllSellers = createAsyncThunk<
  GetAllSellersResponse,
  string,
  { rejectValue: ErrorResponse }
>("seller/fetchAllSellers", async (status: string, { rejectWithValue }) => {
  try {
    const response = await Api.get(`${API_URL}/all-sellers`, {
      params: { status },
    });
    return response.data as GetAllSellersResponse;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data || { message: "Failed to fetch sellers" }
    );
  }
});

// fetch seller report
export const fetchSellerReport = createAsyncThunk<
  FetchSellerReportResponse,
  string,
  { rejectValue: ErrorResponse }
>("seller/fetchSellerReport", async (jwt, { rejectWithValue }) => {
  try {
    const response = await Api.get(`${API_URL}/report`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    return response.data as FetchSellerReportResponse;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data || { message: "Failed to fetch seller report" }
    );
  }
});

// fetch seller by id
export const fetchSellerById = createAsyncThunk<
  FetchSellerByIdResponse,
  string,
  { rejectValue: ErrorResponse }
>("seller/fetchSellerById", async (id: string, { rejectWithValue }) => {
  try {
    const response = await Api.get(`${API_URL}/${id}`);
    return response.data as FetchSellerByIdResponse;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data || { message: "Failed to fetch seller" }
    );
  }
});

// update seller
export const updateSeller = createAsyncThunk<
  UpdateSellerResponse,
  { seller: Partial<Seller>; jwt: string },
  { rejectValue: ErrorResponse }
>("seller/updateSeller", async ({ seller, jwt }, { rejectWithValue }) => {
  try {
    const response = await Api.patch(`${API_URL}/`, seller, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    return response.data as UpdateSellerResponse;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data || { message: "Failed to update seller" }
    );
  }
});

// delete seller
export const deleteSeller = createAsyncThunk<
  DeleteSellerResponse,
  { id: string; jwt: string },
  { rejectValue: ErrorResponse }
>("seller/deleteSeller", async ({ id, jwt }, { rejectWithValue }) => {
  try {
    const response = await Api.delete(`${API_URL}/${id}`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    return response.data as DeleteSellerResponse;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data || { message: "Failed to delete seller" }
    );
  }
});

// ---------------- SLICE ----------------

export const sellerSlice = createSlice({
  name: "seller",
  initialState,
  reducers: {
    clearSellerMessages: (state) => {
      state.message = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // fetch seller profile
    builder.addCase(fetchSellerProfile.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.message = null;
      state.profile = null;
    });
    builder.addCase(fetchSellerProfile.fulfilled, (state, action) => {
      state.loading = false;
      state.profile = action.payload.seller;
      state.message = action.payload.message;
      state.error = null;
    });
    builder.addCase(fetchSellerProfile.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload?.message || "Failed to fetch seller profile";
      state.profile = null;
    });

    // fetch all sellers
    builder.addCase(fetchAllSellers.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.message = null;
      state.sellers = [];
    });
    builder.addCase(fetchAllSellers.fulfilled, (state, action) => {
      state.loading = false;
      state.sellers = action.payload.sellers;
      state.message = action.payload.message;
      state.error = null;
    });
    builder.addCase(fetchAllSellers.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload?.message || "Failed to fetch sellers";
      state.sellers = [];
    });

    // fetch seller report
    builder.addCase(fetchSellerReport.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.message = null;
      state.report = null;
    });
    builder.addCase(fetchSellerReport.fulfilled, (state, action) => {
      state.loading = false;
      state.report = action.payload.report;
      state.message = action.payload.message;
      state.error = null;
    });
    builder.addCase(fetchSellerReport.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload?.message || "Failed to fetch seller report";
      state.report = null;
    });

    // fetch seller by id
    builder.addCase(fetchSellerById.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.message = null;
      state.selectedSeller = null;
    });
    builder.addCase(fetchSellerById.fulfilled, (state, action) => {
      state.loading = false;
      state.selectedSeller = action.payload.seller;
      state.message = action.payload.message;
      state.error = null;
    });
    builder.addCase(fetchSellerById.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload?.message || "Failed to fetch seller";
      state.selectedSeller = null;
    });

    // update seller
    builder.addCase(updateSeller.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.message = null;
      state.profileUpdated = false;
      state.profile = null;
    });
    builder.addCase(updateSeller.fulfilled, (state, action) => {
      state.loading = false;
      state.profile = action.payload.seller;
      state.message = action.payload.message;
      state.error = null;
      state.profileUpdated = true;
    });
    builder.addCase(updateSeller.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload?.message || "Failed to update seller";
      state.profileUpdated = false;
    });

    // delete seller
    builder.addCase(deleteSeller.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.message = null;
      state.profile = null;
      state.selectedSeller = null;
    });
    builder.addCase(deleteSeller.fulfilled, (state, action) => {
      state.loading = false;
      state.message = action.payload.message;
      state.error = null;
      // ✅ remove from sellers list
      state.sellers = state.sellers.filter(
        (s) => s._id !== action.payload.seller._id
      );
      if (state.profile?._id === action.payload.seller._id) {
        state.profile = null;
      }
      if (state.selectedSeller?._id === action.payload.seller._id) {
        state.selectedSeller = null;
      }
    });
    builder.addCase(deleteSeller.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload?.message || "Failed to delete seller";
    });
  },
});

export const { clearSellerMessages } = sellerSlice.actions;
export default sellerSlice.reducer;
