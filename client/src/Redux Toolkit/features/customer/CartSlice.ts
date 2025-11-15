import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { Api } from "../../../config/Api";
import type {
  CartState,
  FetchCartResponse,
  AddCartItemResponse,
  UpdateCartItemResponse,
  DeleteCartItemResponse,
  ICartItem,
} from "../../../types/cartTypes";

// 🔹 Initial State
const initialState: CartState = {
  cart: null,
  loading: false,
  error: null,
  message: null,
};

const API_URL = "/cart";

// 🔹 Fetch User Cart
export const fetchUserCart = createAsyncThunk<FetchCartResponse, string>(
  "/cart/fetchUserCart",
  async (jwt, { rejectWithValue }) => {
    try {
      const response = await Api.get(`${API_URL}/`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      console.log("fetch user cart", response.data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { message: error.message }
      );
    }
  }
);

// 🔹 Add Item to Cart
export const addItemToCart = createAsyncThunk<
  AddCartItemResponse,
  {
    jwt: string;
    productId: string;
    size?: string;
    ram?: string;
    weight?: string;
    capacity?: string;
    quantity: number;
  }
>("/cart/addItemToCart", async (payload, { rejectWithValue }) => {
  try {
    const { jwt, ...data } = payload;
    const response = await Api.post(`${API_URL}/add`, data, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    console.log("add item to cart", response.data);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data || { message: error.message });
  }
});

// 🔹 Update Cart Item (quantity change)
export const updateCartItem = createAsyncThunk<
  UpdateCartItemResponse,
  { jwt: string; cartItemId: string; quantity: number }
>(
  "/cart/updateCartItem",
  async ({ jwt, cartItemId, quantity }, { rejectWithValue }) => {
    try {
      const response = await Api.put(
        `${API_URL}/item/${cartItemId}`,
        { quantity },
        {
          headers: { Authorization: `Bearer ${jwt}` },
        }
      );
      console.log("update cart item", response.data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { message: error.message }
      );
    }
  }
);

// 🔹 Delete Cart Item
export const deleteCartItem = createAsyncThunk<
  DeleteCartItemResponse,
  { jwt: string; cartItemId: string }
>("/cart/deleteCartItem", async ({ jwt, cartItemId }, { rejectWithValue }) => {
  try {
    const response = await Api.delete(`${API_URL}/item/${cartItemId}`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    console.log("delete cart item", response.data);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data || { message: error.message });
  }
});

// 🔹 Slice
const cartSlice = createSlice({
  name: "cart",
  initialState: initialState,
  reducers: {
    resetCartState: (state) => {
      state.cart = null;
      state.loading = false;
      state.error = null;
      state.message = null;
    },
    clearCartMessage: (state) => {
      state.message = null;
    },
  },
  extraReducers: (builder) => {
    // fetch user cart
    builder.addCase(fetchUserCart.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.message = null;
      state.cart = null;
    });
    builder.addCase(fetchUserCart.fulfilled, (state, action) => {
      state.loading = false;
      state.cart = action.payload.cart;
      state.message = action.payload.message || "Cart fetched successfully";
    });
    builder.addCase(fetchUserCart.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload;
      state.message = action.payload?.message || "Failed to fetch cart";
      state.cart = null;
    });

    // add item to cart
    builder.addCase(addItemToCart.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.message = null;
    });
    builder.addCase(addItemToCart.fulfilled, (state, action) => {
      state.loading = false;
      if (state.cart) {
        state.cart = {
          ...state.cart,
          cartItems: [
            ...state.cart.cartItems,
            action.payload.cartItem as ICartItem,
          ],
        };
      }
      state.message = action.payload.message || "Item added to cart";
    });
    builder.addCase(addItemToCart.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload;
      state.message = action.payload?.message || "Failed to add item";
    });

    // update cart item
    builder.addCase(updateCartItem.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.message = null;
    });

    builder.addCase(updateCartItem.fulfilled, (state, action) => {
      state.loading = false;
      if (state.cart) {
        state.cart = {
          ...state.cart,
          cartItems: state.cart.cartItems.map((cartItem) =>
            cartItem._id === action.meta.arg.cartItemId
              ? (action.payload.cartItem as ICartItem)
              : cartItem
          ),
        };
      }
      state.message = action.payload.message || "Cart item updated";
    });

    builder.addCase(updateCartItem.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload;
      state.message = action.payload?.message || "Failed to update cart item";
    });

    // delete cart item
    builder.addCase(deleteCartItem.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.message = null;
    });
    builder.addCase(deleteCartItem.fulfilled, (state, action) => {
      state.loading = false;
      if (state.cart) {
        state.cart = {
          ...state.cart,
          cartItems: state.cart.cartItems.filter(
            (item) => item._id !== action.meta.arg.cartItemId
          ),
        };
      }
      state.message = action.payload.message || "Item removed from cart";
    });
    builder.addCase(deleteCartItem.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload;
      state.message = action.payload?.message || "Failed to delete cart item";
    });
  },
});

export const { resetCartState, clearCartMessage } = cartSlice.actions;
export default cartSlice.reducer;
