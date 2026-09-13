import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { Api } from "../../../config/Api";

export interface CategoryTreeItem {
  _id: string;
  name: string;
  categoryId: string;
  parentCategory?: string | null;
  level: number;
  image?: string;
  description?: string;
  attributes?: any[];
  children?: CategoryTreeItem[];
}

interface CategoryState {
  tree: CategoryTreeItem[];
  loading: boolean;
  error: string | null;
}

const initialState: CategoryState = {
  tree: [],
  loading: false,
  error: null,
};

export const fetchCategoryTree = createAsyncThunk(
  "category/fetchTree",
  async (_, { rejectWithValue }) => {
    try {
      const response = await Api.get("/category/tree");
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load category tree"
      );
    }
  }
);

const categorySlice = createSlice({
  name: "category",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategoryTree.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategoryTree.fulfilled, (state, action) => {
        state.loading = false;
        state.tree = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchCategoryTree.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default categorySlice.reducer;
