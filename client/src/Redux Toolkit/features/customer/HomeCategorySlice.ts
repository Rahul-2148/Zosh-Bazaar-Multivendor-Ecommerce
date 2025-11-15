import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { Api } from "../../../config/Api";

const initialState = {
  homeCategories: {} as any, // 👈 object rakha, array nahi
  loading: false,
  error: null as any,
  message: null as any,
};

const API_URL = "/homeCategory";

// Create home categories
export const createHomeCategories = createAsyncThunk<any, any>(
  "/homeCategory/createHomeCategories",
  async (homeCategories, { rejectWithValue }) => {
    try {
      const response = await Api.post(`${API_URL}/categories`, homeCategories);
      console.log("create home categories", response.data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || "Failed to create home categories"
      );
    }
  }
);

// Update home category
export const updateHomeCategory = createAsyncThunk<any, any>(
  "/homeCategory/updateHomeCategory",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await Api.patch(`${API_URL}/home-category/${id}`, data);
      console.log("update home category", response.data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || "Failed to update home category"
      );
    }
  }
);

// Get all home categories
export const getAllHomeCategories = createAsyncThunk<any, void>(
  "/homeCategory/getAllHomeCategories",
  async (_, { rejectWithValue }) => {
    try {
      const response = await Api.get(`${API_URL}/home-category`);
      console.log("get all home categories", response.data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || "Failed to get home categories"
      );
    }
  }
);

const homeCategorySlice = createSlice({
  name: "homeCategories",
  initialState,
  reducers: {
    clearMessage(state) {
      state.message = null;
    },
  },
  extraReducers: (builder) => {
    // create
    builder.addCase(createHomeCategories.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.message = null;
    });
    builder.addCase(createHomeCategories.fulfilled, (state, action) => {
      state.loading = false;
      state.homeCategories = action.payload?.homeCategories || {}; // 👈 {}
      state.message =
        action.payload?.message || "Home categories created successfully";
    });
    builder.addCase(createHomeCategories.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
      state.message = action.payload;
    });

    // update
    builder.addCase(updateHomeCategory.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.message = null;
    });
    builder.addCase(updateHomeCategory.fulfilled, (state, action) => {
      state.loading = false;
      const updated = action.payload?.homeCategory;

      // Agar updated ek specific category object hai toh
      if (updated && updated._id) {
        state.homeCategories = {
          ...state.homeCategories,
          [updated.key]: updated, // 👈 server ke response ka shape depend karega
        };
      }

      state.message =
        action.payload?.message || "Home category updated successfully";
    });
    builder.addCase(updateHomeCategory.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
      state.message = action.payload;
    });

    // get all
    builder.addCase(getAllHomeCategories.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.message = null;
    });
    builder.addCase(getAllHomeCategories.fulfilled, (state, action) => {
      state.loading = false;
      state.homeCategories = action.payload?.homeCategories || {}; // 👈 {}
      state.message =
        action.payload?.message || "Home categories fetched successfully";
    });
    builder.addCase(getAllHomeCategories.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
      state.message = action.payload;
    });
  },
});

export const { clearMessage } = homeCategorySlice.actions;
export default homeCategorySlice.reducer;
