import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api/v1";

export const Api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// Request Interceptor: automatically attach JWT token if present and valid
Api.interceptors.request.use(
  (config) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("jwt") : null;
    if (
      token &&
      token !== "undefined" &&
      token !== "null" &&
      token.trim() !== "" &&
      !config.headers.Authorization
    ) {
      config.headers.Authorization = `Bearer ${token.trim()}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: handle global errors like 401 Unauthorized
Api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // If token expired or invalid, clear stale JWT from localStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem("jwt");
        localStorage.removeItem("role");
      }
    }
    return Promise.reject(error);
  }
);
