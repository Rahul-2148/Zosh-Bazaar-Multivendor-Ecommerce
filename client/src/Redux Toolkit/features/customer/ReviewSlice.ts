import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { Api } from "../../../config/Api";

export interface IReview {
  _id: string;
  user: {
    _id: string;
    fullName: string;
    email: string;
  };
  product: string;
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
  verifiedPurchase: boolean;
  createdAt: string;
}

interface ReviewState {
  reviews: IReview[];
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<string, number>;
  canReview: boolean;
  loading: boolean;
  submitting: boolean;
  error: string | null;
}

const initialState: ReviewState = {
  reviews: [],
  averageRating: 0,
  totalReviews: 0,
  ratingDistribution: {},
  canReview: false,
  loading: false,
  submitting: false,
  error: null,
};

export const fetchProductReviews = createAsyncThunk(
  "review/fetchProductReviews",
  async (productId: string, { rejectWithValue }) => {
    try {
      const response = await Api.get(`/review/product/${productId}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load product reviews"
      );
    }
  }
);

export const checkCanReview = createAsyncThunk(
  "review/checkCanReview",
  async (productId: string) => {
    try {
      const response = await Api.get(`/review/can-review/${productId}`);
      return response.data?.canReview || false;
    } catch {
      return false;
    }
  }
);

export const submitProductReview = createAsyncThunk(
  "review/submitProductReview",
  async (
    payload: {
      productId: string;
      rating: number;
      title?: string;
      comment: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await Api.post(`/review/product/${payload.productId}`, {
        rating: payload.rating,
        title: payload.title,
        comment: payload.comment,
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to submit review"
      );
    }
  }
);

const reviewSlice = createSlice({
  name: "review",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProductReviews.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProductReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.reviews = action.payload.reviews || [];
        state.averageRating = action.payload.averageRating || 0;
        state.totalReviews = action.payload.totalReviews || 0;
        state.ratingDistribution = action.payload.ratingDistribution || {};
      })
      .addCase(fetchProductReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(checkCanReview.fulfilled, (state, action) => {
        state.canReview = Boolean(action.payload);
      })
      .addCase(submitProductReview.pending, (state) => {
        state.submitting = true;
      })
      .addCase(submitProductReview.fulfilled, (state, action) => {
        state.submitting = false;
        if (action.payload?.review) {
          state.reviews.unshift(action.payload.review);
          state.totalReviews += 1;
        }
      })
      .addCase(submitProductReview.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload as string;
      });
  },
});

export default reviewSlice.reducer;
