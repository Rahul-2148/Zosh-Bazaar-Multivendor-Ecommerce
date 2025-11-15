import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { Api } from "../../../config/Api";

const initialState = {
  coupon: null,
  cart: null,
  loading: false,
  error: null,
  couponCreated: false,
  couponApplied: false,
  message: null,
};

const API_URL = "/coupon";

// Async Thunks
export const applyCoupon = createAsyncThunk<
  any,
  { apply: string; code: string; orderValue: number; jwt: string }
>(
  "/coupon/applyCoupon",
  async ({ apply, code, orderValue, jwt }, { rejectWithValue }) => {
    try {
      const response = await Api.post(
        `${API_URL}/apply`,
        { code },
        {
          headers: { Authorization: `Bearer ${jwt}` },
        }
      );
      console.log("apply coupon", response.data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { message: error.message }
      );
    }
  }
);

// Slice
const couponSlice = createSlice({
  name: "coupon",
  initialState: initialState,
  reducers: {
    clearMessage: (state) => {
      state.message = null;
    },
  },
  extraReducers: (builder) => {
    // applyCoupon
    builder.addCase(applyCoupon.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.couponApplied = false;
      state.couponCreated = false;
      state.message = null;
    });
    builder.addCase(applyCoupon.fulfilled, (state, action) => {
      state.loading = false;
      state.coupon = action.payload.coupon;
      state.cart = action.payload.cart;

      if(action.meta.arg.apply == "true") {
        state.couponApplied = true;
      }
      state.message = action.payload.message || "Coupon applied successfully";
      state.error = null;
    });
    builder.addCase(applyCoupon.rejected, (state, action: PayloadAction<string | any>) => {
      state.loading = false;
      state.error = action.payload;
      state.message = action.payload?.message || "Failed to apply coupon";
      state.coupon = null;
      state.couponApplied = false;
    });
  },
});

export const { clearMessage } = couponSlice.actions;
export default couponSlice.reducer;
