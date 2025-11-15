import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { Api } from "../../../config/Api";
import type {
  FetchProductsResponse,
  FetchSingleProductResponse,
  ProductState,
} from "../../../types/productTypes";

const API_URL = "/product";

const initialState: ProductState = {
  product: null,
  products: [],
  totalElements: 0,
  totalPages: 0,
  loading: false,
  error: null,
  searchProducts: [],
  message: null,
};

// fetch product by id
export const fetchProductById = createAsyncThunk<
  FetchSingleProductResponse,
  string
>("/product/fetchProductById", async (productId, { rejectWithValue }) => {
  try {
    const response = await Api.get(`${API_URL}/${productId}`);
    return response.data as FetchSingleProductResponse;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data || { message: "Failed to fetch product" }
    );
  }
});

// search product
export const searchProduct = createAsyncThunk<FetchProductsResponse, string>(
  "/product/searchProduct",
  async (query, { rejectWithValue }) => {
    try {
      const response = await Api.get(`${API_URL}/search`, {
        params: { query },
      });
      return response.data as FetchProductsResponse;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to search product" }
      );
    }
  }
);

// get all products
export const getAllProducts = createAsyncThunk<FetchProductsResponse, any>(
  "/product/getAllProducts",
  async (params, { rejectWithValue }) => {
    try {
      const response = await Api.get(API_URL, {
        params: { ...params, pageNumber: params.pageNumber || 0 },
      });
      console.log("get all products", response.data);
      return response.data as FetchProductsResponse;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch products" }
      );
    }
  }
);

const productSlice = createSlice({
  name: "product",
  initialState: initialState,
  reducers: {
    clearMessage: (state) => {
      state.message = null;
    },
  },
  extraReducers: (builder) => {
    // fetch product by id
    builder.addCase(fetchProductById.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.message = null;
      state.product = null;
    });
    builder.addCase(fetchProductById.fulfilled, (state, action) => {
      state.loading = false;
      state.product = action.payload.product;
      state.message = action.payload.message || "Product fetched successfully";
      state.error = null;
    });
    builder.addCase(fetchProductById.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload;
      state.message = action.payload?.message || "Failed to fetch product";
      state.product = null;
    });

    // search product
    builder.addCase(searchProduct.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.message = null;
      state.searchProducts = [];
    });
    builder.addCase(searchProduct.fulfilled, (state, action) => {
      state.loading = false;
      state.searchProducts = action.payload.products.content;
      state.totalElements = action.payload.products.totalElements;
      state.totalPages = action.payload.products.totalPages;
      state.message = action.payload.message || "Product fetched successfully";
      state.error = null;
    });
    builder.addCase(searchProduct.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload;
      state.message = action.payload?.message || "Failed to search product";
      state.searchProducts = [];
    });

    // get all products
    builder.addCase(getAllProducts.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.message = null;
    });
    builder.addCase(getAllProducts.fulfilled, (state, action) => {
      state.loading = false;
      state.products = action.payload.products.content; 
      state.totalElements = action.payload.products.totalElements;
      state.totalPages = action.payload.products.totalPages;
      state.message = action.payload.message || "Products fetched successfully";
      state.error = null;
    });

    builder.addCase(getAllProducts.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload;
      state.message = action.payload?.message || "Failed to fetch products";
    });
  },
});

export const { clearMessage } = productSlice.actions;
export default productSlice.reducer;
