import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { Api } from "../../../config/Api";

export interface ICouponItem {
  _id: string;
  code: string;
  discountPercentage: number;
  validityStartDate: string;
  validityEndDate: string;
  minimumOrderValue: number;
}

export interface CouponState {
  coupon: any | null;
  cart: any | null;
  availableCoupons: ICouponItem[];
  loading: boolean;
  couponsLoading: boolean;
  error: any;
  couponCreated: boolean;
  couponApplied: boolean;
  message: string | null;
}

const initialState: CouponState = {
  coupon: null,
  cart: null,
  availableCoupons: [],
  loading: false,
  couponsLoading: false,
  error: null,
  couponCreated: false,
  couponApplied: false,
  message: null,
};

const API_URL = "/coupon";

// 🔹 Fetch Available Active Coupons
export const getAvailableCoupons = createAsyncThunk(
  "/coupon/getAvailableCoupons",
  async (jwt: string, { rejectWithValue }) => {
    try {
      const response = await Api.get(`${API_URL}/available`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      return response.data?.coupons || [];
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { message: error.message || "Failed to fetch coupons" }
      );
    }
  }
);

// 🔹 Apply Coupon
export const applyCoupon = createAsyncThunk<
  any,
  { apply?: string; code: string; orderValue?: number; jwt: string }
>(
  "/coupon/applyCoupon",
  async ({ code, jwt }, { rejectWithValue }) => {
    try {
      const response = await Api.post(
        `${API_URL}/apply`,
        { code },
        {
          headers: { Authorization: `Bearer ${jwt}` },
        }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { message: error.message || "Failed to apply coupon" }
      );
    }
  }
);

// 🔹 Remove Coupon
export const removeCoupon = createAsyncThunk<any, string>(
  "/coupon/removeCoupon",
  async (jwt, { rejectWithValue }) => {
    try {
      const response = await Api.post(
        `${API_URL}/remove`,
        {},
        {
          headers: { Authorization: `Bearer ${jwt}` },
        }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { message: error.message || "Failed to remove coupon" }
      );
    }
  }
);

// 🔹 Slice
const couponSlice = createSlice({
  name: "coupon",
  initialState: initialState,
  reducers: {
    clearMessage: (state) => {
      state.message = null;
      state.error = null;
    },
    resetCouponState: (state) => {
      state.coupon = null;
      state.couponApplied = false;
      state.message = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // getAvailableCoupons
    builder.addCase(getAvailableCoupons.pending, (state) => {
      state.couponsLoading = true;
    });
    builder.addCase(getAvailableCoupons.fulfilled, (state, action) => {
      state.couponsLoading = false;
      state.availableCoupons = action.payload;
    });
    builder.addCase(getAvailableCoupons.rejected, (state) => {
      state.couponsLoading = false;
    });

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
      state.couponApplied = true;
      state.message = action.payload.message || "Coupon applied successfully";
      state.error = null;
    });
    builder.addCase(applyCoupon.rejected, (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.error = action.payload;
      state.message = action.payload?.message || "Failed to apply coupon";
      state.coupon = null;
      state.couponApplied = false;
    });

    // removeCoupon
    builder.addCase(removeCoupon.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(removeCoupon.fulfilled, (state, action) => {
      state.loading = false;
      state.coupon = null;
      state.couponApplied = false;
      state.cart = action.payload.cart;
      state.message = action.payload.message || "Coupon removed";
      state.error = null;
    });
    builder.addCase(removeCoupon.rejected, (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.error = action.payload;
      state.message = action.payload?.message || "Failed to remove coupon";
    });
  },
});

export const { clearMessage, resetCouponState } = couponSlice.actions;
export default couponSlice.reducer;
