import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const clientApi = createApi({
  reducerPath: "clientApi",
  baseQuery: fetchBaseQuery({
    baseUrl:
      import.meta.env.VITE_API_BASE_URL ||
      import.meta.env.VITE_API_URL ||
      "http://localhost:5000/api/v1",
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("jwt");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Categories", "Brands", "Products", "Reviews", "Settings", "Cart", "Wishlist", "Orders"],
  endpoints: (builder) => ({
    // Category Tree with automatic caching
    getCategoryTree: builder.query<any[], void>({
      query: () => "/category/tree",
      providesTags: ["Categories"],
    }),

    // Brands
    getBrands: builder.query<any[], void>({
      query: () => "/brand",
      providesTags: ["Brands"],
    }),

    // Product Details
    getProductById: builder.query<any, string>({
      query: (id) => `/products/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Products", id }],
    }),

    // Product Reviews
    getProductReviews: builder.query<{ reviews: any[]; averageRating: number; totalReviews: number }, string>({
      query: (productId) => `/review/product/${productId}`,
      providesTags: (_result, _error, productId) => [{ type: "Reviews", id: productId }],
    }),
    submitReview: builder.mutation<any, { productId: string; rating: number; title: string; comment: string }>({
      query: ({ productId, ...body }) => ({
        url: `/review/product/${productId}`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { productId }) => [{ type: "Reviews", id: productId }],
    }),

    // Platform Settings
    getPlatformSettings: builder.query<any, void>({
      query: () => "/settings",
      providesTags: ["Settings"],
    }),

    // OTP Rate Limiter Check
    getOtpCooldown: builder.query<{ canResend: boolean; remainingSeconds: number }, string>({
      query: (email) => `/auth/otp-cooldown?email=${encodeURIComponent(email)}`,
    }),
  }),
});

export const {
  useGetCategoryTreeQuery,
  useGetBrandsQuery,
  useGetProductByIdQuery,
  useGetProductReviewsQuery,
  useSubmitReviewMutation,
  useGetPlatformSettingsQuery,
  useGetOtpCooldownQuery,
} = clientApi;
