import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { Api } from "../../../config/Api";
import type { IProduct } from "../../../types/productTypes";
import type {
  CreateProductResponse,
  DeleteMultipleProductsResponse,
  DeleteProductResponse,
  ErrorResponse,
  FetchSellerProductsResponse,
  SellerProductState,
  UpdateProductResponse,
} from "../../../types/sellerTypes/sellerProductTypes";

const API_URL = "/seller/product";

const initialState: SellerProductState = {
  products: [],
  loading: false,
  error: null,
  message: null,
  jwt: null,
};

// fetch seller products
export const fetchSellerProducts = createAsyncThunk<
  FetchSellerProductsResponse,
  string,
  { rejectValue: ErrorResponse }
>("/sellerProducts/fetchSellerProducts", async (jwt, { rejectWithValue }) => {
  try {
    const response = await Api.get(`${API_URL}/`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    console.log("fetch seller products", response.data);
    return response.data as FetchSellerProductsResponse;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data || { message: "Failed to fetch products" }
    );
  }
});

// create product
export const createProduct = createAsyncThunk<
  CreateProductResponse,
  { product: Partial<IProduct>; jwt: string },
  { rejectValue: ErrorResponse }
>(
  "/sellerProduct/createProduct",
  async ({ product, jwt }, { rejectWithValue }) => {
    try {
      const response = await Api.post(`${API_URL}/create`, product, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      console.log("create product", response.data);
      return response.data as CreateProductResponse;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to create product" }
      );
    }
  }
);

// update product
export const updateProduct = createAsyncThunk<
  UpdateProductResponse,
  { product: Partial<IProduct>; jwt: string; productId: string },
  { rejectValue: ErrorResponse }
>(
  "/sellerProduct/updateProduct",
  async ({ product, jwt, productId }, { rejectWithValue }) => {
    try {
      const response = await Api.patch(`${API_URL}/${productId}`, product, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      return response.data as UpdateProductResponse;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to update product" }
      );
    }
  }
);

// delete product
export const deleteProduct = createAsyncThunk<
  DeleteProductResponse,
  { productId: string; jwt: string },
  { rejectValue: ErrorResponse }
>(
  "/sellerProduct/deleteProduct",
  async ({ productId, jwt }, { rejectWithValue }) => {
    try {
      const response = await Api.delete(`${API_URL}/${productId}`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      return response.data as DeleteProductResponse;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to delete product" }
      );
    }
  }
);

// delete multiple products
export const deleteMultipleProducts = createAsyncThunk<
  DeleteMultipleProductsResponse,
  { jwt: string; productIds: string[] },
  { rejectValue: ErrorResponse }
>(
  "/sellerProduct/deleteMultipleProducts",
  async ({ jwt, productIds }, { rejectWithValue }) => {
    try {
      const response = await Api.post(
        `${API_URL}/delete-multiple`,
        { productIds },
        {
          headers: { Authorization: `Bearer ${jwt}` },
        }
      );
      return response.data as DeleteMultipleProductsResponse;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to delete products" }
      );
    }
  }
);

export const sellerProductSlice = createSlice({
  name: "sellerProduct",
  initialState,
  reducers: {
    clearMessage: (state) => {
      state.message = null;
    },
  },
  extraReducers: (builder) => {
    // fetch seller products
    builder.addCase(fetchSellerProducts.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.message = null;
    });
    builder.addCase(fetchSellerProducts.fulfilled, (state, action) => {
      state.loading = false;
      state.products = action.payload.products;
    });
    builder.addCase(fetchSellerProducts.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload ? action.payload.message : "Unknown error";
    });

    // create product
    builder.addCase(createProduct.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.message = null;
    });
    builder.addCase(createProduct.fulfilled, (state, action) => {
      state.loading = false;
      state.products.push(action.payload.product);
      state.message = action.payload.message;
    });
    builder.addCase(createProduct.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload ? action.payload.message : "Unknown error";
    });

    // update product
    builder.addCase(updateProduct.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.message = null;
    });
    builder.addCase(updateProduct.fulfilled, (state, action) => {
      state.loading = false;
      state.products = state.products.map((product) =>
        product._id === action.payload.product._id
          ? action.payload.product
          : product
      );
      state.message = action.payload.message;
    });
    builder.addCase(updateProduct.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload ? action.payload.message : "Unknown error";
    });

    // delete product
    builder.addCase(deleteProduct.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.message = null;
    });
    builder.addCase(deleteProduct.fulfilled, (state, action) => {
      state.loading = false;
      state.products = state.products.filter(
        (product) => product._id !== action.payload.product._id
      );
      state.message = action.payload.message;
    });
    builder.addCase(deleteProduct.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload ? action.payload.message : "Unknown error";
    });

    // delete multiple products
    builder.addCase(deleteMultipleProducts.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.message = null;
    });
    builder.addCase(deleteMultipleProducts.fulfilled, (state, action) => {
      state.loading = false;
      const deletedIds = action.payload.deletedProducts.map((p) => p._id);
      state.products = state.products.filter(
        (product) => !deletedIds.includes(product._id)
      );
      state.message = action.payload.message;
    });
    builder.addCase(deleteMultipleProducts.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload ? action.payload.message : "Unknown error";
    });
  },
});

export const { clearMessage } = sellerProductSlice.actions;
export default sellerProductSlice.reducer;
