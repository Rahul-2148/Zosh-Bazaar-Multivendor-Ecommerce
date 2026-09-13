import axios from "axios";

export const BASE_API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.VITE_API_BASE_URL
    ? `${import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, "")}/delivery-partner`
    : "http://localhost:5000/api/v1/delivery-partner");

export const api = axios.create({
  baseURL: BASE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("zb_partner_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      if (!currentPath.includes("/login")) {
        localStorage.removeItem("zb_partner_token");
        localStorage.removeItem("zb_partner_agent");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);
