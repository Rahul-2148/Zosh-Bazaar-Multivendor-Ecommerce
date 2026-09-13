import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { partnerApi, DeliveryRouteData, RouteStop } from "../api/partnerApi";
import { usePartnerAuth } from "./PartnerAuthContext";
import { audioFeedback } from "../components/common/AudioFeedback";

interface ActiveRouteContextType {
  route: DeliveryRouteData | null;
  loading: boolean;
  isOfflineCached: boolean;
  activeStop: RouteStop | null;
  remainingStopsCount: number;
  completedStopsCount: number;
  refreshRoute: () => Promise<void>;
  startRoute: () => Promise<void>;
  arriveAtStop: (stopId: string) => Promise<void>;
  scanPackage: (stopId: string, barcode: string) => Promise<{ success: boolean; message: string }>;
  verifyOtp: (stopId: string, otp: string) => Promise<{ success: boolean; message: string }>;
  collectPayment: (stopId: string, amount: number, paymentMethod?: string) => Promise<{ success: boolean; message: string }>;
  completeDelivery: (
    stopId: string,
    pod: {
      recipientName?: string;
      relationship?: string;
      signatureUrl?: string;
      photoUrl?: string;
      location?: { lat: number; lng: number };
    }
  ) => Promise<{ success: boolean; message: string; earnedAmount?: number }>;
  failDelivery: (
    stopId: string,
    data: { reason: string; notes?: string; photoUrl?: string }
  ) => Promise<{ success: boolean; message: string }>;
}

const ActiveRouteContext = createContext<ActiveRouteContextType | undefined>(undefined);

export const ActiveRouteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, partner } = usePartnerAuth();
  const [route, setRoute] = useState<DeliveryRouteData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isOfflineCached, setIsOfflineCached] = useState<boolean>(false);

  const refreshRoute = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const data = await partnerApi.getActiveRoute();
      if (data) {
        setRoute(data);
        localStorage.setItem("zb_partner_cached_route", JSON.stringify(data));
        setIsOfflineCached(false);
      } else {
        setRoute(null);
        localStorage.removeItem("zb_partner_cached_route");
        setIsOfflineCached(false);
      }
    } catch {
      // Offline fallback
      const cached = localStorage.getItem("zb_partner_cached_route");
      if (cached) {
        try {
          setRoute(JSON.parse(cached));
          setIsOfflineCached(true);
        } catch {
          setRoute(null);
        }
      } else {
        setRoute(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && partner) {
      refreshRoute();
    } else {
      setRoute(null);
      localStorage.removeItem("zb_partner_cached_route");
    }
  }, [token, partner?._id]);

  // Real-time route assignment & update listener from Socket.IO
  useEffect(() => {
    const handleRouteAssigned = () => {
      refreshRoute();
    };
    const handleRouteUpdated = () => {
      refreshRoute();
    };
    window.addEventListener("zb:route_assigned", handleRouteAssigned);
    window.addEventListener("zb:route_updated", handleRouteUpdated);
    return () => {
      window.removeEventListener("zb:route_assigned", handleRouteAssigned);
      window.removeEventListener("zb:route_updated", handleRouteUpdated);
    };
  }, [token]);

  // Derived: find current active stop
  const activeStop = useMemo(() => {
    if (!route || !route.stops || route.stops.length === 0) return null;
    // Look for ARRIVED first, then EN_ROUTE, then first PENDING
    const arrived = route.stops.find((s) => s.status === "ARRIVED");
    if (arrived) return arrived;

    const enRoute = route.stops.find((s) => s.status === "EN_ROUTE");
    if (enRoute) return enRoute;

    const pending = route.stops.find((s) => s.status === "PENDING");
    return pending || null;
  }, [route]);

  const completedStopsCount = useMemo(() => {
    if (!route?.stops) return 0;
    return route.stops.filter((s) => s.status === "DELIVERED" || s.status === "FAILED").length;
  }, [route]);

  const remainingStopsCount = useMemo(() => {
    if (!route?.stops) return 0;
    return route.stops.length - completedStopsCount;
  }, [route, completedStopsCount]);

  const startRoute = async () => {
    if (!route) return;
    try {
      const updated = await partnerApi.startRoute(route._id);
      setRoute(updated);
      audioFeedback.playSuccessChime();
    } catch (err: unknown) {
      audioFeedback.playErrorBuzz();
      throw err;
    }
  };

  const arriveAtStop = async (stopId: string) => {
    if (!route) return;
    try {
      const res = await partnerApi.arriveAtStop(route._id, stopId);
      audioFeedback.playSuccessChime();
      await refreshRoute();
      return res;
    } catch (err: unknown) {
      audioFeedback.playErrorBuzz();
      throw err;
    }
  };

  const scanPackage = async (stopId: string, barcode: string) => {
    if (!route) return { success: false, message: "No active route" };
    try {
      const res = await partnerApi.scanPackage(route._id, stopId, barcode);
      if (res.success) {
        audioFeedback.playSuccessChime();
        await refreshRoute();
      } else {
        audioFeedback.playErrorBuzz();
      }
      return res;
    } catch (err: unknown) {
      audioFeedback.playErrorBuzz();
      const message = err instanceof Error ? err.message : "Scan failed";
      return { success: false, message };
    }
  };

  const verifyOtp = async (stopId: string, otp: string) => {
    if (!route) return { success: false, message: "No active route" };
    try {
      const res = await partnerApi.verifyOtp(route._id, stopId, otp);
      if (res.success) {
        audioFeedback.playSuccessChime();
        await refreshRoute();
      } else {
        audioFeedback.playErrorBuzz();
      }
      return res;
    } catch (err: unknown) {
      audioFeedback.playErrorBuzz();
      const message = err instanceof Error ? err.message : "Invalid OTP";
      return { success: false, message };
    }
  };

  const collectPayment = async (stopId: string, amount: number, paymentMethod: string = "CASH") => {
    if (!route) return { success: false, message: "No active route" };
    try {
      const idempotencyKey = `pay-${stopId}-${Date.now()}`;
      const res = await partnerApi.collectPayment(route._id, stopId, {
        amount,
        paymentMethod,
        idempotencyKey,
      });
      audioFeedback.playSuccessChime();
      await refreshRoute();
      return res;
    } catch (err: unknown) {
      audioFeedback.playErrorBuzz();
      const message = err instanceof Error ? err.message : "Payment failed";
      return { success: false, message };
    }
  };

  const completeDelivery = async (
    stopId: string,
    pod: {
      recipientName?: string;
      relationship?: string;
      signatureUrl?: string;
      photoUrl?: string;
      location?: { lat: number; lng: number };
    }
  ) => {
    if (!route) return { success: false, message: "No active route" };
    try {
      const idempotencyKey = `dlv-${stopId}-${Date.now()}`;
      const res = await partnerApi.completeDelivery(route._id, stopId, {
        pod,
        idempotencyKey,
      });
      audioFeedback.playSuccessChime();
      await refreshRoute();
      return res;
    } catch (err: unknown) {
      audioFeedback.playErrorBuzz();
      const message = err instanceof Error ? err.message : "Completion failed";
      return { success: false, message };
    }
  };

  const failDelivery = async (
    stopId: string,
    data: { reason: string; notes?: string; photoUrl?: string }
  ) => {
    if (!route) return { success: false, message: "No active route" };
    try {
      const res = await partnerApi.failDelivery(route._id, stopId, data);
      audioFeedback.playWarningPing();
      await refreshRoute();
      return res;
    } catch (err: unknown) {
      audioFeedback.playErrorBuzz();
      const message = err instanceof Error ? err.message : "Failed to record attempt";
      return { success: false, message };
    }
  };

  return (
    <ActiveRouteContext.Provider
      value={{
        route,
        loading,
        isOfflineCached,
        activeStop,
        remainingStopsCount,
        completedStopsCount,
        refreshRoute,
        startRoute,
        arriveAtStop,
        scanPackage,
        verifyOtp,
        collectPayment,
        completeDelivery,
        failDelivery,
      }}
    >
      {children}
    </ActiveRouteContext.Provider>
  );
};

export const useActiveRoute = () => {
  const context = useContext(ActiveRouteContext);
  if (!context) throw new Error("useActiveRoute must be used within ActiveRouteProvider");
  return context;
};
