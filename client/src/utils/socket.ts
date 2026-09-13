import { io, Socket } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL
    ? (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL)
        .replace("/api/v1", "")
        .replace("/api", "")
    : "http://localhost:5000");

let socket: Socket | null = null;

export const getCustomerSocket = (userId?: string): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ["polling", "websocket"],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      withCredentials: true,
    });

    socket.on("connect", () => {
      console.log("[Zosh Realtime] Connected to Marketplace Hub:", socket?.id);
      if (userId) {
        socket?.emit("join", { role: "CUSTOMER", id: userId });
      }
    });

    socket.on("disconnect", (reason) => {
      console.log("[Zosh Realtime] Disconnected:", reason);
    });
  } else if (userId && socket.connected) {
    socket.emit("join", { role: "CUSTOMER", id: userId });
  }

  return socket;
};

export const disconnectCustomerSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
