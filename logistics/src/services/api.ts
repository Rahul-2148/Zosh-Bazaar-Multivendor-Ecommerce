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

// Request Interceptor: Attach token (logistics operator / admin)
api.interceptors.request.use(
  (config) => {
    const rawToken =
      localStorage.getItem("logistics_jwt") ||
      localStorage.getItem("admin_jwt") ||
      localStorage.getItem("jwt");

    if (
      rawToken &&
      rawToken.trim() &&
      rawToken !== "undefined" &&
      rawToken !== "null" &&
      !config.headers.Authorization
    ) {
      config.headers.Authorization = `Bearer ${rawToken.trim()}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401/403 with circuit breaker to prevent request storms
let isRedirecting = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      // Clear invalid session
      localStorage.removeItem("logistics_jwt");
      localStorage.removeItem("logistics_operator");
      window.dispatchEvent(new CustomEvent("logistics:unauthorized"));

      // Redirect to /login if not already on the login page (debounced to avoid storms)
      if (
        typeof window !== "undefined" &&
        !window.location.pathname.includes("/login") &&
        !isRedirecting
      ) {
        isRedirecting = true;
        setTimeout(() => {
          window.location.href = "/login?session_expired=true";
          isRedirecting = false;
        }, 300);
      }
    }

    return Promise.reject(error);
  }
);

/* =========================================================
   AUTH CONTRACTS
   ========================================================= */

export const authApi = {
  sendLoginOtp: (email: string) =>
    api.post("/auth/sent/login-signup-otp", { email }),
  signin: (data: { email: string; otp?: string; password?: string }) =>
    api.post("/auth/signin", data),
  getProfile: () => api.get("/user/profile"),
};


/* =========================================================
   LOGISTICS API CONTRACTS
   ========================================================= */

export const logisticsApi = {
  // Overview & Board
  getOverview: () => api.get("/logistics/overview"),
  getOperationsBoard: (params?: any) => api.get("/logistics/operations-board", { params }),
  getAnalytics: (params?: any) => api.get("/logistics/analytics", { params }),

  // Shipments
  getShipments: (params?: any) => api.get("/logistics/shipments", { params }),
  getShipmentById: (id: string) => api.get(`/logistics/shipments/${id}`),
  createShipment: (data: any) => api.post("/logistics/shipments/create", data),
  transitionStatus: (id: string, data: { status: string; note?: string; location?: string; hubName?: string }) =>
    api.patch(`/logistics/shipments/${id}/transition`, data),
  assignAgent: (id: string, agentId: string) =>
    api.patch(`/logistics/shipments/${id}/assign`, { agentId }),
  recordProofOfDelivery: (id: string, data: any) =>
    api.post(`/logistics/shipments/${id}/pod`, data),
  recordDeliveryAttempt: (id: string, data: any) =>
    api.post(`/logistics/shipments/${id}/attempt`, data),

  // Customer Tracking
  getTracking: (trackingNumber: string) =>
    api.get(`/logistics/tracking/${trackingNumber}`),

  // Hubs & Facilities
  getHubs: (params?: any) => api.get("/logistics/hubs", { params }),
  getHubById: (id: string) => api.get(`/logistics/hubs/${id}`),
  createHub: (data: any) => api.post("/logistics/hubs", data),
  updateHub: (id: string, data: any) => api.patch(`/logistics/hubs/${id}`, data),

  // Zones & Serviceability
  getZones: (params?: any) => api.get("/logistics/zones", { params }),
  createZone: (data: any) => api.post("/logistics/zones", data),
  checkServiceability: (pincode: number | string, serviceLevel?: string) =>
    api.get("/logistics/serviceability", { params: { pincode, serviceLevel } }),

  // Manifests
  getManifests: (params?: any) => api.get("/logistics/manifests", { params }),
  createManifest: (data: any) => api.post("/logistics/manifests", data),
  sealManifest: (id: string, sealNumber?: string) =>
    api.patch(`/logistics/manifests/${id}/seal`, { sealNumber }),
  dispatchManifest: (id: string) => api.patch(`/logistics/manifests/${id}/dispatch`),
  receiveManifest: (id: string, receivedBy?: string) =>
    api.patch(`/logistics/manifests/${id}/receive`, { receivedBy }),

  // Scanner
  processScan: (data: { barcode: string; scanEvent: string; hubId?: string; operatorName?: string }) =>
    api.post("/logistics/scan", data),

  // Fleet & Agents
  getAgents: (params?: any) => api.get("/logistics/agents", { params }),
  getAgentById: (id: string) => api.get(`/logistics/agents/${id}`),
  createAgent: (data: any) => api.post("/logistics/agents", data),
  updateAgentStatus: (id: string, status: string) =>
    api.patch(`/logistics/agents/${id}/status`, { status }),
  updateAgentLocation: (id: string, coords: { lat: number; lng: number }) =>
    api.patch(`/logistics/agents/${id}/location`, coords),

  // Routes
  getRoutes: (params?: any) => api.get("/logistics/routes", { params }),
  createRoute: (data: any) => api.post("/logistics/routes", data),
  updateRouteStop: (routeId: string, stopId: string, data: { status: string; failureReason?: string }) =>
    api.patch(`/logistics/routes/${routeId}/stops/${stopId}`, data),

  // Exceptions
  getExceptions: (params?: any) => api.get("/logistics/exceptions", { params }),
  createException: (data: any) => api.post("/logistics/exceptions", data),
  updateExceptionStatus: (id: string, data: any) =>
    api.patch(`/logistics/exceptions/${id}`, data),
};
