import { api } from "./apiConfig";

export interface DeliveryPartnerProfile {
  _id: string;
  agentId: string;
  name: string;
  phone: string;
  email: string;
  status: "AVAILABLE" | "ASSIGNED" | "OUT_FOR_DELIVERY" | "ON_BREAK" | "OFFLINE" | "SUSPENDED";
  accountStatus: "ACTIVE" | "ON_HOLD" | "SUSPENDED" | "PENDING_VERIFICATION";
  assignedHub?: {
    _id: string;
    hubCode: string;
    name: string;
    city: string;
    address?: string;
  };
  currentZone: string;
  vehicle: {
    vehicleType: string;
    plateNumber: string;
    capacityKg: number;
    batteryLevel: number;
  };
  currentLocation: {
    lat: number;
    lng: number;
    lastPingAt: string;
  };
  rating: number;
  shift: {
    isShiftActive: boolean;
    shiftStartedAt?: string;
    shiftEndedAt?: string;
    onBreak: boolean;
  };
  todayStats: {
    assigned: number;
    completed: number;
    failed: number;
  };
  earnings?: {
    todayBasePay: number;
    todayIncentives: number;
    todayDistancePay: number;
    todayDeductions: number;
    totalSettled: number;
    pendingSettlement: number;
    history: Array<{
      date: string;
      amount: number;
      type: string;
      description: string;
      shipmentId?: string;
      stopIndex?: number;
    }>;
  };
}

export interface RouteStop {
  _id: string;
  stopIndex: number;
  shipmentId: string;
  trackingNumber: string;
  customerName: string;
  customerPhone?: string;
  address: string;
  customerInstructions?: string;
  preferredDropLocation?: string;
  packagesCount?: number;
  paymentType: "COD" | "PREPAID";
  codAmount: number;
  codCollected: boolean;
  codCollectedAmount?: number;
  otpRequired: boolean;
  otp?: string;
  otpVerified: boolean;
  isPackageScanned?: boolean;
  scannedBarcode?: string;
  location: {
    lat: number;
    lng: number;
  };
  timeWindow?: {
    from: string;
    to: string;
  };
  status: "PENDING" | "EN_ROUTE" | "ARRIVED" | "DELIVERED" | "FAILED";
  failureReason?: string;
  completedAt?: string;
}

export interface DeliveryRouteData {
  _id: string;
  routeCode: string;
  status: "PLANNED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  date: string;
  totalStops: number;
  completedStops: number;
  totalDistanceKm: number;
  estimatedDurationMinutes: number;
  stops: RouteStop[];
  hub?: {
    _id: string;
    hubCode: string;
    name: string;
    city: string;
    address?: string;
  };
  startedAt?: string;
  endedAt?: string;
}

export const partnerApi = {
  // 1. Auth & Profile
  login: async (identifier: string, secret: string = "") => {
    const res = await api.post("/auth/login", { identifier, secret });
    return res.data;
  },

  getProfile: async (): Promise<DeliveryPartnerProfile> => {
    const res = await api.get("/profile");
    return res.data.data;
  },

  updateShift: async (action: "START_SHIFT" | "END_SHIFT" | "TOGGLE_BREAK") => {
    const res = await api.patch("/shift", { action });
    return res.data.data;
  },

  // 2. Active Route & Stops
  getActiveRoute: async (): Promise<DeliveryRouteData> => {
    const res = await api.get("/route/active");
    return res.data.data;
  },

  startRoute: async (routeId: string) => {
    const res = await api.post(`/route/${routeId}/start`);
    return res.data.data;
  },

  arriveAtStop: async (routeId: string, stopId: string) => {
    const res = await api.post(`/route/${routeId}/stops/${stopId}/arrive`);
    return res.data.data;
  },

  scanPackage: async (routeId: string, stopId: string, barcode: string) => {
    const res = await api.post(`/route/${routeId}/stops/${stopId}/scan`, { barcode });
    return res.data;
  },

  verifyOtp: async (routeId: string, stopId: string, otp: string) => {
    const res = await api.post(`/route/${routeId}/stops/${stopId}/otp`, { otp });
    return res.data;
  },

  collectPayment: async (
    routeId: string,
    stopId: string,
    data: { amount: number; paymentMethod?: string; idempotencyKey?: string }
  ) => {
    const res = await api.post(`/route/${routeId}/stops/${stopId}/payment`, data, {
      headers: data.idempotencyKey ? { "x-idempotency-key": data.idempotencyKey } : {},
    });
    return res.data;
  },

  completeDelivery: async (
    routeId: string,
    stopId: string,
    data: {
      pod: {
        recipientName?: string;
        relationship?: string;
        signatureUrl?: string;
        photoUrl?: string;
        location?: { lat: number; lng: number };
      };
      idempotencyKey?: string;
    }
  ) => {
    const res = await api.post(`/route/${routeId}/stops/${stopId}/complete`, data, {
      headers: data.idempotencyKey ? { "x-idempotency-key": data.idempotencyKey } : {},
    });
    return res.data;
  },

  failDelivery: async (
    routeId: string,
    stopId: string,
    data: { reason: string; notes?: string; photoUrl?: string }
  ) => {
    const res = await api.post(`/route/${routeId}/stops/${stopId}/fail`, data);
    return res.data;
  },

  // 3. Exceptions & Telemetry
  reportException: async (data: {
    type: string;
    description: string;
    routeId?: string;
    stopIndex?: number;
    photoUrl?: string;
  }) => {
    const res = await api.post("/exceptions/report", data);
    return res.data;
  },

  pingLocation: async (data: {
    lat: number;
    lng: number;
    speed?: number;
    heading?: number;
    batteryLevel?: number;
  }) => {
    const res = await api.post("/location/ping", data);
    return res.data;
  },

  // 4. Earnings & History
  getEarnings: async () => {
    const res = await api.get("/earnings");
    return res.data.data;
  },

  getHistory: async (params: { status?: string; limit?: number } = {}) => {
    const res = await api.get("/history", { params });
    return res.data.data;
  },
};
