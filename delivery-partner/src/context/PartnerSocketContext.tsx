import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { usePartnerAuth } from "./PartnerAuthContext";
import { partnerApi } from "../api/partnerApi";
import { audioFeedback } from "../components/common/AudioFeedback";

interface PartnerSocketContextType {
  socket: Socket | null;
  connected: boolean;
  online: boolean;
  gpsStatus: "ACTIVE" | "DENIED" | "UNAVAILABLE" | "OFF";
  currentCoords: { lat: number; lng: number } | null;
}

const PartnerSocketContext = createContext<PartnerSocketContextType | undefined>(undefined);

export const PartnerSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { partner, token } = usePartnerAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [online, setOnline] = useState<boolean>(navigator.onLine);
  const [gpsStatus, setGpsStatus] = useState<"ACTIVE" | "DENIED" | "UNAVAILABLE" | "OFF">("OFF");
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Network online/offline detection
  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Socket.IO Setup
  useEffect(() => {
    if (!token || !partner) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    const socketUrl =
      import.meta.env.VITE_SOCKET_URL ||
      (import.meta.env.VITE_API_BASE_URL
        ? import.meta.env.VITE_API_BASE_URL.replace("/api/v1", "").replace("/api", "")
        : "http://localhost:5000");
    const newSocket = io(socketUrl, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 15,
      reconnectionDelay: 2000,
    });

    newSocket.on("connect", () => {
      setConnected(true);
      newSocket.emit("join", {
        role: "DELIVERY_AGENT",
        id: partner._id,
        agentId: partner.agentId,
      });
    });

    newSocket.on("disconnect", () => {
      setConnected(false);
    });

    newSocket.on("route:assigned", () => {
      audioFeedback.playSuccessChime();
      window.dispatchEvent(new CustomEvent("zb:route_assigned"));
    });

    newSocket.on("route:updated", () => {
      audioFeedback.playWarningPing();
      window.dispatchEvent(new CustomEvent("zb:route_updated"));
    });

    newSocket.on("notification:created", () => {
      audioFeedback.playWarningPing();
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token, partner?.agentId, partner?._id]);

  // Real Geolocation Telemetry (debounced, strictly scoped to active shift)
  useEffect(() => {
    if (!token || !partner?.shift?.isShiftActive) {
      setGpsStatus("OFF");
      return;
    }

    if (!("geolocation" in navigator)) {
      setGpsStatus("UNAVAILABLE");
      return;
    }

    let isMounted = true;
    let lastPingTime = 0;

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        if (!isMounted) return;
        setGpsStatus("ACTIVE");
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCurrentCoords({ lat, lng });

        // Throttle server telemetry pings to at most once every 15 seconds
        const now = Date.now();
        if (now - lastPingTime > 15000) {
          lastPingTime = now;
          try {
            await partnerApi.pingLocation({
              lat,
              lng,
              speed: pos.coords.speed || 0,
              heading: pos.coords.heading || 0,
            });
          } catch {
            // Non-blocking network ping failure
          }
        }
      },
      (err) => {
        if (!isMounted) return;
        if (err.code === err.PERMISSION_DENIED) {
          setGpsStatus("DENIED");
        } else {
          setGpsStatus("UNAVAILABLE");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 10000,
      }
    );

    return () => {
      isMounted = false;
      navigator.geolocation.clearWatch(watchId);
    };
  }, [token, partner?.shift?.isShiftActive]);

  return (
    <PartnerSocketContext.Provider value={{ socket, connected, online, gpsStatus, currentCoords }}>
      {children}
    </PartnerSocketContext.Provider>
  );
};

export const usePartnerSocket = () => {
  const context = useContext(PartnerSocketContext);
  if (!context) throw new Error("usePartnerSocket must be used within PartnerSocketProvider");
  return context;
};
