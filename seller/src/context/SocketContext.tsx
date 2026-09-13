import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useSellerAuth } from "./SellerAuthContext";

export interface SellerNotification {
  id: string;
  type: "ORDER_CREATED" | "ORDER_STATUS" | "LOW_STOCK" | "INFO";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  data?: any;
}

export interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  notifications: SellerNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

const apiEndpoint = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
const SOCKET_SERVER_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (apiEndpoint
    ? String(apiEndpoint).replace("/api/v1", "").replace("/api", "")
    : "http://localhost:5000");

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { seller } = useSellerAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState<SellerNotification[]>(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("seller_notifications");
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {
          return [];
        }
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem("seller_notifications", JSON.stringify(notifications.slice(0, 50)));
  }, [notifications]);

  useEffect(() => {
    if (!seller?._id) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    const s = io(SOCKET_SERVER_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    s.on("connect", () => {
      setConnected(true);
      s.emit("join", { role: "SELLER", id: seller._id });
    });

    s.on("disconnect", () => {
      setConnected(false);
    });

    // Real-time events
    s.on("order:created", (data: any) => {
      const newNotif: SellerNotification = {
        id: `ord_${Date.now()}`,
        type: "ORDER_CREATED",
        title: "New Order Received!",
        message: `Order #${data.orderId.slice(-6)} received for ₹${data.totalSellingPrice?.toLocaleString("en-IN") || 0}`,
        timestamp: new Date().toISOString(),
        read: false,
        data,
      };
      setNotifications((prev) => [newNotif, ...prev]);
    });

    s.on("order:status_updated", (data: any) => {
      const newNotif: SellerNotification = {
        id: `st_${Date.now()}`,
        type: "ORDER_STATUS",
        title: "Order Status Changed",
        message: `Order #${data.orderId.slice(-6)} changed to ${data.orderStatus}`,
        timestamp: new Date().toISOString(),
        read: false,
        data,
      };
      setNotifications((prev) => [newNotif, ...prev]);
    });

    s.on("inventory:low_stock", (data: any) => {
      const newNotif: SellerNotification = {
        id: `stk_${Date.now()}`,
        type: "LOW_STOCK",
        title: "Low Stock Alert!",
        message: `${data.title} ${data.variantTitle ? `(${data.variantTitle})` : ""} has only ${data.countInStock} items remaining.`,
        timestamp: new Date().toISOString(),
        read: false,
        data,
      };
      setNotifications((prev) => [newNotif, ...prev]);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [seller?._id]);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearNotifications,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
