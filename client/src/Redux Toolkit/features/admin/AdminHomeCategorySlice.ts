import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { Api } from "../../../config/Api";
import type {
  IHomeCategory,
  HomeCategoryState,
  CreateHomeCategoriesResponse,
  GetAllHomeCategoriesResponse,
  UpdateHomeCategoryResponse,
} from "../../../types/homeCategoryTypes";

const initialState: HomeCategoryState = {
  homeCategories: [],
  loading: false,
  error: null,
  message: null,
};

const API_URL = "/homeCategory";

// create home categories
export const createHomeCategories = createAsyncThunk<
  CreateHomeCategoriesResponse,
  IHomeCategory[],
  { rejectValue: { message: string } }
>("/home/createHomeCategories", async (homeCategories, { rejectWithValue }) => {
  try {
    const response = await Api.post(`${API_URL}/categories`, homeCategories);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data || { message: "Failed to create home categories" }
    );
  }
});

// update home category
export const updateHomeCategory = createAsyncThunk<
  UpdateHomeCategoryResponse,
  { id: string; data: Partial<IHomeCategory> },
  { rejectValue: { message: string } }
>("/homeCategory/updateHomeCategory", async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await Api.patch(`${API_URL}/home-category/${id}`, data);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data || { message: "Failed to update home category" }
    );
  }
});

// get all home categories
export const getAllHomeCategories = createAsyncThunk<
  GetAllHomeCategoriesResponse,
  void,
  { rejectValue: { message: string } }
>("/homeCategory/getAllHomeCategories", async (_, { rejectWithValue }) => {
  try {
    const response = await Api.get(`${API_URL}/home-category`);
    console.log("get all home categories", response.data);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data || { message: "Failed to get home categories" }
    );
  }
});

const adminHomeCategorySlice = createSlice({
  name: "adminHomeCategories",
  initialState: initialState,
  reducers: {
    clearMessage(state) {
      state.message = null;
    },
  },
  extraReducers: (builder) => {
    // create home categories
    builder.addCase(createHomeCategories.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.message = null;
    });
    builder.addCase(createHomeCategories.fulfilled, (state, action) => {
      state.loading = false;
      state.homeCategories = action.payload.homeCategories;
      state.message =
        action.payload.message || "Home categories created successfully";
    });
    builder.addCase(createHomeCategories.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || { message: "Unknown error" };
      state.message = action.payload?.message ?? null;
    });

    // update home category
    builder.addCase(updateHomeCategory.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.message = null;
    });
    builder.addCase(updateHomeCategory.fulfilled, (state, action) => {
      state.loading = false;
      const updated = action.payload.homeCategory;
      state.homeCategories = state.homeCategories.map((cat) =>
        cat._id === updated._id ? updated : cat
      );
      state.message =
        action.payload.message || "Home category updated successfully";
    });
    builder.addCase(updateHomeCategory.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || { message: "Unknown error" };
      state.message = action.payload?.message ?? null;
    });

    // get all home categories
    builder.addCase(getAllHomeCategories.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.message = null;
    });
    builder.addCase(getAllHomeCategories.fulfilled, (state, action) => {
      state.loading = false;
      state.homeCategories = action.payload.homeCategories;
      state.message =
        action.payload.message || "Home categories fetched successfully";
    });
    builder.addCase(getAllHomeCategories.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || { message: "Unknown error" };
      state.message = action.payload?.message ?? null;
    });
  },
});

export const { clearMessage } = adminHomeCategorySlice.actions;
export default adminHomeCategorySlice.reducer;

