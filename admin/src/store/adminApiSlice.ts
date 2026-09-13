import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const adminApi = createApi({
  reducerPath: "adminApi",
  baseQuery: fetchBaseQuery({
    baseUrl:
      import.meta.env.VITE_API_BASE_URL ||
      import.meta.env.VITE_API_URL ||
      "http://localhost:5000/api/v1",
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("admin_jwt");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: [
    "Categories",
    "Brands",
    "Products",
    "Inventory",
    "Orders",
    "Reviews",
    "Settings",
    "Coupons",
    "Deals",
  ],
  endpoints: (builder) => ({
    // Categories
    getCategoryTree: builder.query<any[], void>({
      query: () => "/category/tree",
      providesTags: ["Categories"],
    }),
    createCategory: builder.mutation<any, Partial<any>>({
      query: (body) => ({
        url: "/category",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Categories"],
    }),
    updateCategory: builder.mutation<any, { id: string; data: any }>({
      query: ({ id, data }) => ({
        url: `/category/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Categories"],
    }),
    deleteCategory: builder.mutation<any, string>({
      query: (id) => ({
        url: `/category/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Categories"],
    }),

    // Brands
    getBrands: builder.query<any[], void>({
      query: () => "/brand",
      providesTags: ["Brands"],
    }),
    createBrand: builder.mutation<any, any>({
      query: (body) => ({
        url: "/brand",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Brands"],
    }),
    updateBrand: builder.mutation<any, { id: string; data: any }>({
      query: ({ id, data }) => ({
        url: `/brand/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Brands"],
    }),
    deleteBrand: builder.mutation<any, string>({
      query: (id) => ({
        url: `/brand/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Brands"],
    }),

    // Products & Inventory
    getProducts: builder.query<{ content: any[]; totalElements: number; totalPages: number }, { page?: number; size?: number; search?: string } | void>({
      query: (params) => ({
        url: "/admin/products",
        params: params || {},
      }),
      providesTags: ["Products"],
    }),
    createProduct: builder.mutation<any, any>({
      query: (body) => ({
        url: "/admin/products",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Products", "Inventory"],
    }),
    updateProduct: builder.mutation<any, { id: string; data: any }>({
      query: ({ id, data }) => ({
        url: `/admin/products/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Products", "Inventory"],
    }),
    deleteProduct: builder.mutation<any, string>({
      query: (id) => ({
        url: `/admin/products/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Products", "Inventory"],
    }),
    getInventory: builder.query<any[], { lowStock?: boolean } | void>({
      query: (params) => ({
        url: "/admin/inventory",
        params: params || {},
      }),
      providesTags: ["Inventory"],
    }),
    updateStock: builder.mutation<any, { productId: string; variantId?: string; stockAdjustment: number }>({
      query: (body) => ({
        url: "/admin/inventory/adjust",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Inventory", "Products"],
    }),

    // Orders
    getOrders: builder.query<any[], void>({
      query: () => "/admin/orders",
      providesTags: ["Orders"],
    }),
    updateOrderStatus: builder.mutation<any, { orderId: string; status: string }>({
      query: ({ orderId, status }) => ({
        url: `/admin/orders/${orderId}/status`,
        method: "PUT",
        body: { status },
      }),
      invalidatesTags: ["Orders"],
    }),

    // Reviews
    getReviews: builder.query<any[], { status?: string } | void>({
      query: (params) => ({
        url: "/review/admin/all",
        params: params || {},
      }),
      providesTags: ["Reviews"],
    }),
    updateReviewStatus: builder.mutation<any, { id: string; status: string }>({
      query: ({ id, status }) => ({
        url: `/review/admin/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["Reviews"],
    }),
    deleteReview: builder.mutation<any, string>({
      query: (id) => ({
        url: `/review/admin/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Reviews"],
    }),

    // Platform Settings
    getSettings: builder.query<any, void>({
      query: () => "/settings",
      providesTags: ["Settings"],
    }),
    updateSettings: builder.mutation<any, any>({
      query: (body) => ({
        url: "/settings",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Settings"],
    }),
  }),
});

export const {
  useGetCategoryTreeQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useGetBrandsQuery,
  useCreateBrandMutation,
  useUpdateBrandMutation,
  useDeleteBrandMutation,
  useGetProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGetInventoryQuery,
  useUpdateStockMutation,
  useGetOrdersQuery,
  useUpdateOrderStatusMutation,
  useGetReviewsQuery,
  useUpdateReviewStatusMutation,
  useDeleteReviewMutation,
  useGetSettingsQuery,
  useUpdateSettingsMutation,
} = adminApi;
