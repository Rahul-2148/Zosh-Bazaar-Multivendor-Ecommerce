import axios from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// Request Interceptor: Attach seller token
api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("seller_jwt") || localStorage.getItem("jwt");
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      if (!currentPath.includes("/login") && !currentPath.includes("/register")) {
        localStorage.removeItem("seller_jwt");
        localStorage.removeItem("seller_info");
        window.dispatchEvent(new Event("seller:unauthorized"));
      }
    }
    return Promise.reject(error);
  }
);

/* =========================================================
   API CONTRACTS
   ========================================================= */

// Authentication & Profile
export const authApi = {
  sendLoginOtp: (email: string, mode: "signup" | "login" = "login") =>
    api.post("/seller/sent/login-otp", { email, mode }),

  verifyLoginOtp: (email: string, otp: string) =>
    api.post("/seller/verify/login-otp", { email, otp }),

  createSeller: (data: any) => api.post("/seller/create", data),

  getProfile: () => api.get("/seller/profile"),

  updateProfile: (data: any) => api.patch("/seller", data),
};

// Report & Dashboard Analytics
export const reportApi = {
  getReport: () => api.get("/seller/report"),
};

// Catalog / Product Management
export const productApi = {
  getProducts: () => api.get("/seller/product"),

  getProductById: (id: string) => api.get(`/product/${id}`),

  createProduct: (data: any) => api.post("/seller/product/create", data),

  updateProduct: (id: string, data: any) =>
    api.patch(`/seller/product/${id}`, data),

  deleteProduct: (id: string) => api.delete(`/seller/product/${id}`),

  deleteMultiple: (productIds: string[]) =>
    api.post("/seller/product/delete-multiple", { productIds }),

  bulkStatus: (productIds: string[], status: string) =>
    api.patch("/seller/product/bulk-status", { productIds, status }),

  bulkStock: (updates: any[]) =>
    api.patch("/seller/product/bulk-stock", { updates }),
};

// Orders & Fulfillment
export const orderApi = {
  getOrders: () => api.get("/seller/order"),

  updateOrderStatus: (orderId: string, status: string, note?: string) =>
    api.patch(`/seller/order/${orderId}/status/${status}`, { note }),

  deleteOrder: (orderId: string) => api.delete(`/seller/order/${orderId}`),
};

// Transactions & Finances
export const transactionApi = {
  getTransactions: () => api.get("/transaction/seller"),
};

// Categories & Brands
export const metaApi = {
  getCategoryTree: () => api.get("/category/tree"),
  getBrands: () => api.get("/brand"),
};
