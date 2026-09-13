import apiClient from "./apiClient";
import type {
  DashboardSummary,
  SellerItem,
  OrderItem,
  ProductItem,
  CustomerItem,
  CouponItem,
  DealItem,
  HomeCategoryItem,
  TransactionItem,
  CategoryItem,
  CategoryTreeItem,
  BrandItem,
  PlatformSettings,
} from "../types/adminTypes";

export const adminApi = {
  // Dashboard & Analytics
  getDashboardSummary: async (): Promise<DashboardSummary> => {
    const res = await apiClient.get<any>("/admin/analytics/summary");
    return res.data.summary || res.data;
  },

  // Categories & Attributes
  getCategoryTree: async (): Promise<CategoryTreeItem[]> => {
    const res = await apiClient.get<any>("/category/tree");
    return res.data.tree || [];
  },

  getAllCategories: async (level?: number): Promise<CategoryItem[]> => {
    const params = level ? { level } : {};
    const res = await apiClient.get<any>("/category", { params });
    return res.data.categories || [];
  },

  getCategoryById: async (id: string): Promise<CategoryItem> => {
    const res = await apiClient.get<any>(`/category/${id}`);
    return res.data.category;
  },

  createCategory: async (categoryData: Partial<CategoryItem>): Promise<CategoryItem> => {
    const res = await apiClient.post<any>("/category", categoryData);
    return res.data.category;
  },

  updateCategory: async (
    id: string,
    categoryData: Partial<CategoryItem>
  ): Promise<CategoryItem> => {
    const res = await apiClient.patch<any>(`/category/${id}`, categoryData);
    return res.data.category;
  },

  deleteCategory: async (id: string) => {
    const res = await apiClient.delete(`/category/${id}`);
    return res.data;
  },

  // Brands
  getAllBrands: async (includeInactive = true): Promise<BrandItem[]> => {
    const res = await apiClient.get<any>("/brand", {
      params: { includeInactive },
    });
    return res.data.brands || [];
  },

  createBrand: async (brandData: Partial<BrandItem>): Promise<BrandItem> => {
    const res = await apiClient.post<any>("/brand", brandData);
    return res.data.brand;
  },

  updateBrand: async (id: string, brandData: Partial<BrandItem>): Promise<BrandItem> => {
    const res = await apiClient.patch<any>(`/brand/${id}`, brandData);
    return res.data.brand;
  },

  deleteBrand: async (id: string) => {
    const res = await apiClient.delete(`/brand/${id}`);
    return res.data;
  },

  // Products
  getAllProducts: async (page: number = 1, search?: string, category?: string) => {
    const pageIndex = Math.max(0, page - 1);
    const params: any = { pageNumber: pageIndex, pageSize: 20, adminView: true };
    if (search) params.search = search;
    if (category) params.category = category;
    const res = await apiClient.get<any>("/product", { params });
    const raw = res.data;
    const items: ProductItem[] = Array.isArray(raw.content)
      ? raw.content
      : Array.isArray(raw.products)
      ? raw.products
      : Array.isArray(raw.products?.content)
      ? raw.products.content
      : Array.isArray(raw)
      ? raw
      : [];
    const totalPages = raw.totalPages || raw.products?.totalPages || 1;
    const totalElements = raw.totalElements || raw.products?.totalElements || items.length;

    return {
      products: items,
      totalElements,
      totalPages,
    };
  },

  getProductById: async (id: string): Promise<ProductItem> => {
    const res = await apiClient.get<any>(`/product/${id}`);
    return res.data.product;
  },

  createProduct: async (productData: any): Promise<ProductItem> => {
    const res = await apiClient.post<any>("/admin/product", productData);
    return res.data.product;
  },

  updateProduct: async (id: string, productData: any): Promise<ProductItem> => {
    const res = await apiClient.patch<any>(`/admin/product/${id}`, productData);
    return res.data.product;
  },

  deleteProduct: async (id: string) => {
    const res = await apiClient.delete(`/admin/product/${id}`);
    return res.data;
  },

  // Inventory
  getInventory: async (page: number = 1, lowStock = false) => {
    const res = await apiClient.get<any>("/admin/inventory", {
      params: { page, limit: 20, lowStock },
    });
    return res.data;
  },

  updateStock: async (
    productId: string,
    data: { countInStock: number; variantId?: string }
  ) => {
    const res = await apiClient.patch(`/admin/inventory/${productId}`, data);
    return res.data;
  },

  // Reviews Moderation
  getAllReviews: async (page: number = 1, status?: string) => {
    const params: any = { page, limit: 20 };
    if (status && status !== "ALL") params.status = status;
    const res = await apiClient.get<any>("/review/admin/all", { params });
    return res.data;
  },

  updateReviewStatus: async (id: string, status: "APPROVED" | "REJECTED") => {
    const res = await apiClient.patch(`/review/admin/${id}/status`, { status });
    return res.data;
  },

  deleteReview: async (id: string) => {
    const res = await apiClient.delete(`/review/admin/${id}`);
    return res.data;
  },

  // Orders
  getAllOrders: async (status?: string, page: number = 1) => {
    const params: any = { page, limit: 20 };
    if (status && status !== "ALL") params.status = status;
    const res = await apiClient.get<any>("/admin/orders", { params });
    const data = res.data;
    const orders: OrderItem[] = Array.isArray(data.orders)
      ? data.orders
      : Array.isArray(data)
      ? data
      : [];
    return {
      orders,
      totalOrders: data.totalOrders ?? orders.length,
      totalPages: data.totalPages ?? 1,
      currentPage: data.currentPage ?? page,
    };
  },

  updateOrderStatus: async (orderId: string, orderStatus: string, note?: string) => {
    const res = await apiClient.patch(`/admin/orders/${orderId}/status`, {
      orderStatus,
      note,
    });
    return res.data;
  },

  // Settings
  getSettings: async (): Promise<PlatformSettings> => {
    const res = await apiClient.get<any>("/settings");
    return res.data.settings;
  },

  updateSettings: async (settings: Partial<PlatformSettings>): Promise<PlatformSettings> => {
    const res = await apiClient.patch<any>("/settings", settings);
    return res.data.settings;
  },

  // Sellers
  getAllSellers: async (status?: string): Promise<SellerItem[]> => {
    const params = status && status !== "ALL" ? { status } : {};
    const res = await apiClient.get<any>("/seller/all-sellers", {
      params,
    });
    const data = res.data;
    if (Array.isArray(data.sellers)) return data.sellers;
    if (Array.isArray(data)) return data;
    return [];
  },

  updateSellerStatus: async (id: string, accountStatus: string) => {
    const res = await apiClient.patch(
      `/admin/seller/${id}/status/${accountStatus}`
    );
    return res.data;
  },

  deleteSeller: async (id: string) => {
    const res = await apiClient.delete(`/seller/${id}`);
    return res.data;
  },

  // Customers
  getAllCustomers: async (page: number = 1) => {
    const res = await apiClient.get<any>("/admin/customers", {
      params: { page, limit: 20 },
    });
    const data = res.data;
    const customers: CustomerItem[] = Array.isArray(data.customers)
      ? data.customers
      : Array.isArray(data)
      ? data
      : [];
    return {
      customers,
      totalCustomers: data.totalCustomers ?? customers.length,
      totalPages: data.totalPages ?? 1,
      currentPage: data.currentPage ?? page,
    };
  },

  // Coupons
  getAllCoupons: async () => {
    const res = await apiClient.get<any>("/coupon/admin/all");
    const data = res.data;
    if (Array.isArray(data.coupons)) return data.coupons;
    if (Array.isArray(data)) return data;
    return [];
  },

  createCoupon: async (couponData: Partial<CouponItem>) => {
    const res = await apiClient.post<CouponItem>(
      "/coupon/admin/create",
      couponData
    );
    return res.data;
  },

  deleteCoupon: async (id: string) => {
    const res = await apiClient.delete(`/coupon/admin/delete/${id}`);
    return res.data;
  },

  // Deals
  getAllDeals: async () => {
    const res = await apiClient.get<any>("/admin/deal");
    const data = res.data;
    if (Array.isArray(data.deals)) return data.deals;
    if (Array.isArray(data)) return data;
    return [];
  },

  createDeal: async (dealData: { deal: { discount: number; category: string } }) => {
    const res = await apiClient.post<DealItem>("/admin/deal", dealData);
    return res.data;
  },

  deleteDeal: async (id: string) => {
    const res = await apiClient.delete(`/admin/deal/${id}`);
    return res.data;
  },

  // Home Categories Layout
  getHomeCategories: async () => {
    const res = await apiClient.get<any>("/homeCategory/home-category");
    const data = res.data;
    if (Array.isArray(data.homeCategories)) return data.homeCategories;
    if (Array.isArray(data)) return data;
    return [];
  },

  updateHomeCategory: async (id: string, data: Partial<HomeCategoryItem>) => {
    const res = await apiClient.patch<HomeCategoryItem>(
      `/homeCategory/${id}`,
      data
    );
    return res.data;
  },

  // Transactions
  getAllTransactions: async (page: number = 1) => {
    const res = await apiClient.get<any>("/admin/transactions", {
      params: { page, limit: 20 },
    });
    const data = res.data;
    const transactions: TransactionItem[] = Array.isArray(data.transactions)
      ? data.transactions
      : Array.isArray(data)
      ? data
      : [];
    return {
      transactions,
      totalTransactions: data.totalTransactions ?? transactions.length,
      totalPages: data.totalPages ?? 1,
      currentPage: data.currentPage ?? page,
    };
  },
};
