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
    variantId?: string;
    selectedVariant?: any;
    size?: string;
    ram?: string;
    weight?: string;
    capacity?: string;
    quantity: number;
  }
>("/cart/addItemToCart", async (payload, { rejectWithValue }) => {
  try {
    const { jwt, ...data } = payload;
    if (!jwt) {
      // Store in guest cart localStorage
      try {
        const existingRaw = localStorage.getItem("zosh_guest_cart");
        const existing = existingRaw ? JSON.parse(existingRaw) : [];
        const index = existing.findIndex(
          (item: any) =>
            item.productId === data.productId &&
            item.variantId === data.variantId &&
            item.size === data.size
        );
        if (index > -1) {
          existing[index].quantity += data.quantity;
        } else {
          existing.push({
            productId: data.productId,
            variantId: data.variantId,
            selectedVariant: data.selectedVariant,
            size: data.size,
            ram: data.ram,
            capacity: data.capacity,
            quantity: data.quantity,
          });
        }
        localStorage.setItem("zosh_guest_cart", JSON.stringify(existing));
        return {
          message: "Item saved to guest cart",
          cartItem: { ...data, _id: "guest_" + Date.now() },
        } as any;
      } catch {
        return rejectWithValue({ message: "Failed to save to guest cart" });
      }
    }

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

// 🔹 Merge Guest Cart
export const mergeGuestCart = createAsyncThunk<
  FetchCartResponse,
  {
    jwt: string;
    items: any[];
    isRetry?: boolean;
    retryFailed?: boolean;
    retryMode?: string;
    idempotencyKey?: string;
    attempt?: number;
  }
>(
  "/cart/mergeGuestCart",
  async (
    { jwt, items, isRetry, retryFailed, retryMode, idempotencyKey, attempt },
    { rejectWithValue }
  ) => {
    try {
      const response = await Api.post(
        `${API_URL}/merge`,
        {
          items,
          guestItems: items,
          isRetry: Boolean(isRetry || retryFailed),
          retryFailed: Boolean(isRetry || retryFailed),
          retryMode: retryMode || (isRetry || retryFailed ? "FAILED_ITEMS" : "NONE"),
          idempotencyKey,
          attempt: attempt || 1,
        },
        { headers: { Authorization: `Bearer ${jwt}` } }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// 🔹 Retry Failed or Stock-Capped Guest Cart Items
export const retryFailedGuestCart = createAsyncThunk<
  FetchCartResponse | null,
  string
>(
  "/cart/retryFailedGuestCart",
  async (jwt, { dispatch, rejectWithValue }) => {
    try {
      const rawGuest = localStorage.getItem("zosh_guest_cart");
      if (!rawGuest) return null;
      let guestItems: any[] = [];
      try {
        guestItems = JSON.parse(rawGuest);
      } catch {
        return null;
      }
      if (!Array.isArray(guestItems) || guestItems.length === 0) return null;

      const storedKey = sessionStorage.getItem("zosh_cart_merge_idempotency_key") || undefined;
      const attempt = Number(sessionStorage.getItem("zosh_cart_merge_attempt") || "1") + 1;
      sessionStorage.setItem("zosh_cart_merge_attempt", String(attempt));

      const response = await dispatch(
        mergeGuestCart({
          jwt,
          items: guestItems,
          isRetry: true,
          retryFailed: true,
          retryMode: "FAILED_ITEMS",
          idempotencyKey: storedKey,
          attempt,
        })
      ).unwrap();

      const mergedList: any[] = (response as any)?.mergedItems || [];
      const failedList: any[] = (response as any)?.failedItems || [];

      const mergedMap = new Map<string, any>();
      mergedList.forEach((mi: any) => {
        if (mi.clientItemId) mergedMap.set(String(mi.clientItemId), mi);
      });

      const remainingGuestItems: any[] = [];
      guestItems.forEach((gi: any) => {
        const cId = String(gi.clientItemId);
        const merged = mergedMap.get(cId);
        if (merged) {
          const unmergedRemainder =
            typeof merged.remainingQuantity === "number"
              ? merged.remainingQuantity
              : (merged.partialStockApplied
                ? Math.max(0, (Number(gi.quantity) || 1) - (Number(merged.quantityMerged) || 0))
                : 0);

          if (unmergedRemainder > 0) {
            remainingGuestItems.push({
              ...gi,
              quantity: unmergedRemainder,
              partialStockApplied: true,
              warning: `Stock capped: ${merged.quantityMerged} added, ${unmergedRemainder} remaining unmerged.`,
            });
          }
        } else {
          remainingGuestItems.push(gi);
        }
      });

      if (remainingGuestItems.length === 0) {
        localStorage.removeItem("zosh_guest_cart");
        sessionStorage.removeItem("zosh_cart_merge_warnings");
      } else {
        localStorage.setItem("zosh_guest_cart", JSON.stringify(remainingGuestItems));
        if (failedList.length > 0) {
          sessionStorage.setItem("zosh_cart_merge_warnings", JSON.stringify(failedList));
        }
      }

      await dispatch(fetchUserCart(jwt));
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

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
    });

    // add item to cart
    builder.addCase(addItemToCart.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.message = null;
    });
    builder.addCase(addItemToCart.fulfilled, (state, action) => {
      state.loading = false;
      const newItem = action.payload.cartItem as ICartItem;
      if (newItem) {
        if (state.cart) {
          const existingIdx = state.cart.cartItems.findIndex(
            (ci) =>
              ci._id === newItem._id ||
              (ci.product?._id &&
                newItem.product?._id &&
                ci.product._id === newItem.product._id &&
                ci.variantId === newItem.variantId)
          );
          if (existingIdx >= 0) {
            state.cart.cartItems[existingIdx] = newItem;
          } else {
            state.cart.cartItems.push(newItem);
          }
          state.cart.totalItem = state.cart.cartItems.reduce(
            (acc, it) => acc + (it.quantity || 1),
            0
          );
        } else {
          state.cart = {
            _id:
              (typeof newItem.cart === "string"
                ? newItem.cart
                : (newItem.cart as any)?._id) || "cart_temp",
            user: newItem.userId,
            cartItems: [newItem],
            totalMrpPrice: newItem.mrpPrice || 0,
            totalSellingPrice: newItem.sellingPrice || 0,
            totalItem: newItem.quantity || 1,
            discount: 0,
          };
        }
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

    // merge guest cart
    builder.addCase(mergeGuestCart.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(mergeGuestCart.fulfilled, (state, action) => {
      state.loading = false;
      state.cart = action.payload.cart;
      state.message = action.payload.message || "Cart merged successfully";
    });
    builder.addCase(mergeGuestCart.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload;
    });
  },
});

export const { resetCartState, clearCartMessage } = cartSlice.actions;
export default cartSlice.reducer;
