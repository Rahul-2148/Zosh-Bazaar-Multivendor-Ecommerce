import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export interface LogisticsAlert {
  id: string;
  type: "SHIPMENT_CREATED" | "SHIPMENT_STATUS" | "EXCEPTION" | "AGENT_STATUS" | "HUB_BACKLOG";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  data?: any;
}

export interface LogisticsSocketContextType {
  socket: Socket | null;
  connected: boolean;
  alerts: LogisticsAlert[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAlerts: () => void;
}

const LogisticsSocketContext = createContext<LogisticsSocketContextType | undefined>(undefined);

const SOCKET_SERVER_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL
    ? (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL)
        .replace("/api/v1", "")
        .replace("/api", "")
    : "http://localhost:5000");

export const LogisticsSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [alerts, setAlerts] = useState<LogisticsAlert[]>([]);

  useEffect(() => {
    const s = io(SOCKET_SERVER_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    s.on("connect", () => {
      setConnected(true);
      s.emit("join", { role: "LOGISTICS_OPERATOR", id: "CONTROL_TOWER" });
    });

    s.on("disconnect", () => {
      setConnected(false);
    });

    // 1. Shipment Created
    s.on("shipment:created", (payload: any) => {
      const alert: LogisticsAlert = {
        id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: "SHIPMENT_CREATED",
        title: "New Shipment Booked",
        message: `${payload.shipmentId} (${payload.trackingNumber}) in ${payload.city || "Hub"}`,
        timestamp: new Date().toISOString(),
        read: false,
        data: payload,
      };
      setAlerts((prev) => [alert, ...prev.slice(0, 49)]);
    });

    // 2. Shipment Status Updated
    s.on("shipment:status_updated", (payload: any) => {
      const alert: LogisticsAlert = {
        id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: "SHIPMENT_STATUS",
        title: `Shipment Status: ${payload.status}`,
        message: `${payload.shipmentId} updated to ${payload.status}`,
        timestamp: new Date().toISOString(),
        read: false,
        data: payload,
      };
      setAlerts((prev) => [alert, ...prev.slice(0, 49)]);
    });

    // 3. Exception Logged
    s.on("exception:created", (payload: any) => {
      const alert: LogisticsAlert = {
        id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: "EXCEPTION",
        title: `⚠️ Exception: ${payload.type}`,
        message: `${payload.exceptionCode}: ${payload.reason}`,
        timestamp: new Date().toISOString(),
        read: false,
        data: payload,
      };
      setAlerts((prev) => [alert, ...prev.slice(0, 49)]);
    });

    // 4. Agent Status Updated
    s.on("agent:status_updated", (payload: any) => {
      const alert: LogisticsAlert = {
        id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: "AGENT_STATUS",
        title: `Agent ${payload.name}`,
        message: `Status changed to ${payload.status}`,
        timestamp: new Date().toISOString(),
        read: false,
        data: payload,
      };
      setAlerts((prev) => [alert, ...prev.slice(0, 49)]);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  const unreadCount = alerts.filter((a) => !a.read).length;

  const markAsRead = (id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)));
  };

  const markAllAsRead = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
  };

  const clearAlerts = () => {
    setAlerts([]);
  };

  return (
    <LogisticsSocketContext.Provider
      value={{
        socket,
        connected,
        alerts,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearAlerts,
      }}
    >
      {children}
    </LogisticsSocketContext.Provider>
  );
};

export const useLogisticsSocket = () => {
  const context = useContext(LogisticsSocketContext);
  if (!context) {
    throw new Error("useLogisticsSocket must be used within LogisticsSocketProvider");
  }
  return context;
};
