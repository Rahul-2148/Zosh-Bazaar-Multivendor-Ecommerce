import { Server } from "socket.io";
import { getAllowedOrigins } from "../config/corsConfig.js";
import { socketAuthMiddleware } from "./auth.js";
import { canJoinRoom, getAuthorizedUserRooms } from "./rooms.js";

let io = null;

/**
 * Socket.IO Realtime Engine Initialization (Phase 14 - Section 1 & 2)
 *
 * Current Topology: Modular Monolith (Express HTTP Server + Socket.IO in-process)
 * Future Topology: Readily extractable to a dedicated Realtime Gateway cluster via publishers/rooms interface.
 */
export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: getAllowedOrigins(),
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 30000,
    pingInterval: 25000,
  });

  // Attach handshake authentication middleware
  io.use(socketAuthMiddleware);

  io.on("connection", (socket) => {
    const user = socket.user;

    // Auto-join authenticated identity to their authorized private rooms
    if (user && user.authenticated && !user.isGuest) {
      const authorizedRooms = getAuthorizedUserRooms(user);
      for (const room of authorizedRooms) {
        socket.join(room);
      }
    }

    // Explicit room join request with authoritative permission verification (Section 5)
    socket.on("join", ({ role, id, agentId }) => {
      const user = socket.user;

      // Determine requested target room based on client payload
      let requestedRoom = null;
      if (role === "ADMIN" || role === "SUPER_ADMIN") {
        requestedRoom = "admin_room";
      } else if (role === "LOGISTICS_OPERATOR") {
        requestedRoom = "logistics_control_tower";
      } else if (role === "SELLER" && id) {
        requestedRoom = `seller_${id}`;
      } else if (role === "CUSTOMER" && id) {
        requestedRoom = `customer_${id}`;
      } else if (role === "DELIVERY_AGENT") {
        requestedRoom = `agent_${agentId || id}`;
      }

      if (!requestedRoom) {
        socket.emit("error:invalid_room", { message: "Invalid room request parameters" });
        return;
      }

      // Cryptographic Authorization Check: Never trust client-supplied role or id alone
      if (canJoinRoom(user, requestedRoom)) {
        socket.join(requestedRoom);
        if (role === "DELIVERY_AGENT" && canJoinRoom(user, "logistics_control_tower")) {
          socket.join("logistics_control_tower");
        }
      } else {
        socket.emit("error:unauthorized", {
          message: `Unauthorized: Access to room "${requestedRoom}" is forbidden.`,
          room: requestedRoom,
        });
      }
    });

    socket.on("join_agent", ({ agentId, id }) => {
      const targetAgentId = agentId || id;
      const agentRoom = `agent_${targetAgentId}`;

      if (canJoinRoom(socket.user, agentRoom)) {
        socket.join(agentRoom);
        socket.join("logistics_control_tower");
      } else {
        socket.emit("error:unauthorized", {
          message: "Unauthorized: Delivery partner access forbidden",
          room: agentRoom,
        });
      }
    });

    socket.on("disconnect", () => {
      // Clean disconnect
    });
  });

  return io;
};

export const getIO = () => io;

export const closeSocket = async () => {
  if (io) {
    return new Promise((resolve) => {
      io.close(() => {
        io = null;
        resolve();
      });
    });
  }
};

// Re-export all domain publishers for backward compatibility (Section 2)
export {
  publishOrderCreated,
  publishOrderStatusUpdated,
  publishCustomerNotification,
  publishLowStockAlert,
  publishVariantStockUpdated,
  publishStockUpdated,
  publishProductCreated,
  publishProductUpdated,
  publishShipmentCreated,
  publishShipmentStatusUpdated,
  publishLogisticsException,
  publishAgentStatusUpdated,
  publishHubBacklogUpdated,
  publishSessionRevoked,
  // Legacy aliases
  emitOrderCreated,
  emitOrderStatusUpdated,
  emitCustomerNotification,
  emitLowStockAlert,
  emitVariantStockUpdated,
  emitStockUpdated,
  emitProductCreated,
  emitProductUpdated,
  emitShipmentCreated,
  emitShipmentStatusUpdated,
  emitLogisticsException,
  emitAgentStatusUpdated,
  emitHubBacklogUpdated,
  emitSessionRevoked,
} from "./publishers.js";

export default initSocket;
