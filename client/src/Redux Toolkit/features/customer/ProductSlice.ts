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
  searchSuggestions: {
    products: [],
    categories: [],
    brands: [],
  },
  categoryFilters: null,
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
export const searchProduct = createAsyncThunk<FetchProductsResponse, any>(
  "/product/searchProduct",
  async (params, { rejectWithValue }) => {
    try {
      const queryParams =
        typeof params === "string" ? { query: params } : params;
      const response = await Api.get(`${API_URL}/search`, {
        params: queryParams,
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

// fetch search suggestions (products, categories, brands)
export const fetchSearchSuggestions = createAsyncThunk<any, string>(
  "/product/fetchSearchSuggestions",
  async (query, { rejectWithValue }) => {
    try {
      const response = await Api.get(`${API_URL}/search/suggestions`, {
        params: { q: query },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch suggestions" }
      );
    }
  }
);

// fetch category filters and facets
export const fetchCategoryFilters = createAsyncThunk<any, { category?: string } | undefined>(
  "/product/fetchCategoryFilters",
  async (params, { rejectWithValue }) => {
    try {
      const response = await Api.get(`${API_URL}/filters`, {
        params,
      });
      return response.data?.filters || response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch filters" }
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
    clearSearchSuggestions: (state) => {
      state.searchSuggestions = {
        products: [],
        categories: [],
        brands: [],
      };
    },
    productCreatedRealtime: (state, action) => {
      const newProduct = action.payload;
      if (newProduct && !state.products.some((p: any) => p._id === newProduct._id || p._id === newProduct.productId)) {
        state.products = [newProduct, ...state.products];
        state.totalElements += 1;
      }
    },
    productUpdatedRealtime: (state, action) => {
      const updated = action.payload;
      const targetId = updated._id || updated.productId;
      if (!targetId) return;

      state.products = state.products.map((p: any) =>
        p._id === targetId ? { ...p, ...updated } : p
      );

      if (state.product && (state.product._id === targetId || state.product.id === targetId)) {
        state.product = { ...state.product, ...updated };
      }
    },
    stockUpdatedRealtime: (state, action) => {
      const { productId, countInStock, inStock } = action.payload;
      state.products = state.products.map((p: any) =>
        p._id === productId
          ? { ...p, countInStock, inStock: inStock !== undefined ? inStock : countInStock > 0 }
          : p
      );

      if (state.product && (state.product._id === productId || state.product.id === productId)) {
        state.product = {
          ...state.product,
          countInStock,
          inStock: inStock !== undefined ? inStock : countInStock > 0,
        };
      }
    },
  },
  extraReducers: (builder) => {
    // category filters
    builder.addCase(fetchCategoryFilters.fulfilled, (state, action) => {
      state.categoryFilters = action.payload;
    });

    // search suggestions
    builder.addCase(fetchSearchSuggestions.fulfilled, (state, action) => {
      state.searchSuggestions = {
        products: action.payload?.products || [],
        categories: action.payload?.categories || [],
        brands: action.payload?.brands || [],
      };
    });
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

export const {
  clearMessage,
  clearSearchSuggestions,
  productCreatedRealtime,
  productUpdatedRealtime,
  stockUpdatedRealtime,
} = productSlice.actions;
export default productSlice.reducer;
