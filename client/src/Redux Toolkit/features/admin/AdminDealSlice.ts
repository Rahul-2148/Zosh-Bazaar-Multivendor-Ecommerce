import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { Api } from "../../../config/Api";
import type {
  AdminDealState,
  FetchDealsResponse,
  CreateDealResponse,
  UpdateDealResponse,
  DeleteDealResponse,
  IDeal,
} from "../../../types/adminTypes/adminDealTypes";

const initialState: AdminDealState = {
  deals: [],
  loading: false,
  error: null,
  message: null,
};

const API_URL = "/admin/deal";

// ---------------- THUNKS ----------------

// Get all deals
export const fetchDeals = createAsyncThunk<
  FetchDealsResponse,
  void,
  { rejectValue: { message: string } }
>("adminDeal/fetchDeals", async (_, { rejectWithValue }) => {
  try {
    const response = await Api.get(`${API_URL}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("jwt")}`,
      },
    });
    return response.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data || { message: "Failed to fetch deals" }
    );
  }
});

// Create deal
export const createDeal = createAsyncThunk<
  CreateDealResponse,
  Partial<IDeal>,
  { rejectValue: { message: string } }
>("adminDeal/createDeal", async (deal, { rejectWithValue }) => {
  try {
    const response = await Api.post(`${API_URL}/create`, deal, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("jwt")}`,
      },
    });
    console.log("create deal", response.data);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data || { message: "Failed to create deal" }
    );
  }
});

// Update deal
export const updateDeal = createAsyncThunk<
  UpdateDealResponse,
  { id: string; deal: Partial<IDeal> },
  { rejectValue: { message: string } }
>("adminDeal/updateDeal", async ({ id, deal }, { rejectWithValue }) => {
  try {
    const response = await Api.put(`${API_URL}/${id}`, deal, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("jwt")}`,
      },
    });
    console.log("update deal", response.data);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data || { message: "Failed to update deal" }
    );
  }
});

// Delete deal
export const deleteDeal = createAsyncThunk<
  DeleteDealResponse,
  string,
  { rejectValue: { message: string } }
>("adminDeal/deleteDeal", async (id, { rejectWithValue }) => {
  try {
    const response = await Api.delete(`${API_URL}/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("jwt")}`,
      },
    });
    console.log("delete deal", response.data);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data || { message: "Failed to delete deal" }
    );
  }
});

// ---------------- SLICE ----------------

const adminDealSlice = createSlice({
  name: "adminDeals",
  initialState,
  reducers: {
    clearDealMessages: (state) => {
      state.error = null;
      state.message = null;
    },
  },
  extraReducers: (builder) => {
    // fetchDeals
    builder.addCase(fetchDeals.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchDeals.fulfilled, (state, action) => {
      state.loading = false;
      state.deals = action.payload.deals;
      state.message = action.payload.message ?? null;
    });
    builder.addCase(fetchDeals.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload?.message || "Failed to fetch deals";
    });

    // createDeal
    builder.addCase(createDeal.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createDeal.fulfilled, (state, action) => {
      state.loading = false;
      state.deals.push(action.payload.deal);
      state.message = action.payload.message;
    });
    builder.addCase(createDeal.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload?.message || "Failed to create deal";
    });

    // updateDeal
    builder.addCase(updateDeal.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateDeal.fulfilled, (state, action) => {
      state.loading = false;
      state.deals = state.deals.map((deal) =>
        deal._id === action.payload.deal._id ? action.payload.deal : deal
      );
      state.message = action.payload.message;
    });
    builder.addCase(updateDeal.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload?.message || "Failed to update deal";
    });

    // deleteDeal
    builder.addCase(deleteDeal.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteDeal.fulfilled, (state, action) => {
      state.loading = false;
      state.deals = state.deals.filter(
        (deal) => deal._id !== action.payload.deletedDeal._id
      );
      state.message = action.payload.message;
    });
    builder.addCase(deleteDeal.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload?.message || "Failed to delete deal";
    });
  },
});

export const { clearDealMessages } = adminDealSlice.actions;
export default adminDealSlice.reducer;
