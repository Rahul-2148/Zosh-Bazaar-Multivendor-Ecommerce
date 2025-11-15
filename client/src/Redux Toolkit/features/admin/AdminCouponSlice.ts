import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { AdminCouponState } from "../../../types/adminTypes/adminCouponTypes";
import { Api } from "../../../config/Api";

const initialState: AdminCouponState = {
  coupons: [],
  loading: false,
  error: null,
  message: null,
};

const API_URL = "/coupon";

// ---------------- THUNKS ----------------

export const createCoupon = createAsyncThunk<
  any,
  { code: string; discount: number; jwt: string },
  { rejectValue: string }
>(
  "Coupon/createCoupon",
  async ({ code, discount, jwt }, { rejectWithValue }) => {
    try {
      const response = await Api.post(
        `${API_URL}/admin/create`,
        { code, discount },
        {
          headers: { Authorization: `Bearer ${jwt}` },
        }
      );
      console.log("create coupon", response.data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

// fetch all coupons
export const fetchAllCoupons = createAsyncThunk<
  any,
  string,
  { rejectValue: string }
>("Coupon/fetchAllCoupons", async (jwt, { rejectWithValue }) => {
  try {
    const response = await Api.get(`${API_URL}/admin/all`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    console.log("fetch all coupons", response.data);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response.data.message);
  }
});

// delete coupon
export const deleteCoupon = createAsyncThunk<
  any,
  { couponId: string; jwt: string },
  { rejectValue: string }
>("Coupon/deleteCoupon", async ({ couponId, jwt }, { rejectWithValue }) => {
  try {
    const response = await Api.delete(`${API_URL}/admin/delete/${couponId}`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    console.log("delete coupon", response.data);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response.data.message);
  }
});

// ---------------- SLICE ----------------
const adminCouponSlice = createSlice({
  name: "adminCoupon",
  initialState: initialState,
  reducers: {
    clearDealMessages: (state) => {
      state.error = null;
      state.message = null;
    },
  },
  extraReducers: (builder) => {
    // create coupon
    builder.addCase(createCoupon.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.message = null;
    })
    builder.addCase(createCoupon.fulfilled, (state, action) => {
      state.loading = false;
      state.coupons.push(action.payload.coupon);
      state.message = action.payload.message;
      state.error = null;
    });
    builder.addCase(createCoupon.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || "Failed to create coupon";
      state.message = null;
    });

    // fetch all coupons
    builder.addCase(fetchAllCoupons.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.message = null;
    });
    builder.addCase(fetchAllCoupons.fulfilled, (state, action) => {
      state.loading = false;
      state.coupons = action.payload.coupons;
      state.message = action.payload.message || "Coupons fetched successfully";
      state.error = null;
    });
    builder.addCase(fetchAllCoupons.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || "Failed to fetch coupons";
      state.message = null;
    });

    // delete coupon
    builder.addCase(deleteCoupon.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.message = null;
    });
    builder.addCase(deleteCoupon.fulfilled, (state, action) => {
      state.loading = false;
      state.coupons = state.coupons.filter(
        (coupon) => coupon._id !== action.payload.coupon._id
      );
      state.message = action.payload.message || "Coupon deleted successfully";
      state.error = null;
    });
    builder.addCase(deleteCoupon.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || "Failed to delete coupon";
      state.message = null;
    });
  },
});

export const { clearDealMessages } = adminCouponSlice.actions;
export default adminCouponSlice.reducer;
