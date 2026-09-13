import { Server } from "socket.io";
import { getAllowedOrigins } from "../config/corsConfig.js";

let io = null;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: getAllowedOrigins(),
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    // Join room based on user role and id
    socket.on("join", ({ role, id, agentId }) => {
      if (role === "ADMIN" || role === "LOGISTICS_OPERATOR" || role === "SUPER_ADMIN") {
        socket.join("admin_room");
        socket.join("logistics_control_tower");
      } else if (role === "SELLER" && id) {
        socket.join(`seller_${id}`);
      } else if (role === "CUSTOMER" && id) {
        socket.join(`customer_${id}`);
      } else if (role === "DELIVERY_AGENT") {
        if (id) socket.join(`agent_${id}`);
        if (agentId) socket.join(`agent_${agentId}`);
        socket.join("logistics_control_tower");
      }
    });

    socket.on("join_agent", ({ agentId, id }) => {
      if (agentId) socket.join(`agent_${agentId}`);
      if (id) socket.join(`agent_${id}`);
      socket.join("logistics_control_tower");
    });

    socket.on("disconnect", () => {
      // Clean disconnect
    });
  });

  return io;
};

export const getIO = () => io;

export const emitOrderCreated = (order) => {
  if (!io) return;
  const sellerId = order.seller?._id?.toString() || order.seller?.toString();

  // Alert the vendor
  if (sellerId) {
    io.to(`seller_${sellerId}`).emit("order:created", {
      orderId: order._id,
      totalSellingPrice: order.totalSellingPrice,
      totalItems: order.totalItems,
      orderDate: order.orderDate,
    });
  }

  // Alert the platform admin
  io.to("admin_room").emit("admin:new_order", {
    orderId: order._id,
    sellerName: order.seller?.sellerName || "Vendor",
    amount: order.totalSellingPrice,
  });
};

export const emitCustomerNotification = (userId, notification) => {
  if (!io || !userId) return;
  io.to(`customer_${userId}`).emit("notification:created", notification);
};

export const emitOrderStatusUpdated = async (order) => {
  if (!io) return;
  const userId = order.user?._id?.toString() || order.user?.toString();
  const sellerId = order.seller?._id?.toString() || order.seller?.toString();

  const payload = {
    orderId: order._id,
    orderStatus: order.orderStatus,
    updatedAt: new Date(),
  };

  if (userId) {
    io.to(`customer_${userId}`).emit("order:status_updated", payload);

    // Save persistent notification for customer
    try {
      const { Notification } = await import("../models/notification.model.js");
      const notif = await Notification.create({
        recipient: userId,
        type: "ORDER",
        title: "Order Status Update",
        message: `Your order #${order._id.toString().slice(-6).toUpperCase()} is now ${order.orderStatus.replace(/_/g, " ")}.`,
        data: { orderId: order._id, orderStatus: order.orderStatus },
        link: `/order/${order._id}`,
      });
      emitCustomerNotification(userId, notif);
    } catch (err) {
      console.error("[Realtime Notification Error]:", err.message);
    }
  }
  if (sellerId) {
    io.to(`seller_${sellerId}`).emit("order:status_updated", payload);
  }
  io.to("admin_room").emit("admin:order_status_updated", payload);
};


export const emitLowStockAlert = (product, variantTitle = "") => {
  if (!io) return;
  const sellerId = product.seller?._id?.toString() || product.seller?.toString();
  const payload = {
    productId: product._id,
    title: product.title,
    variantTitle,
    countInStock: product.countInStock,
  };

  if (sellerId) {
    io.to(`seller_${sellerId}`).emit("inventory:low_stock", payload);
  }
  io.to("admin_room").emit("admin:low_stock", payload);
};

// -----------------------------------------------------
// LOGISTICS CONTROL TOWER REAL-TIME EVENTS
// -----------------------------------------------------

export const emitShipmentCreated = (shipment) => {
  if (!io) return;
  io.to("logistics_control_tower").emit("shipment:created", {
    shipmentId: shipment.shipmentId,
    trackingNumber: shipment.trackingNumber,
    status: shipment.status,
    serviceLevel: shipment.serviceLevel,
    priority: shipment.priority,
    city: shipment.deliveryAddress?.city,
    createdAt: shipment.createdAt,
  });
};

export const emitShipmentStatusUpdated = (shipment) => {
  if (!io) return;
  const payload = {
    shipmentId: shipment.shipmentId,
    trackingNumber: shipment.trackingNumber,
    status: shipment.status,
    slaStatus: shipment.sla?.slaStatus,
    currentHub: shipment.currentHub,
    assignedAgent: shipment.assignedAgent,
    updatedAt: new Date(),
  };

  io.to("logistics_control_tower").emit("shipment:status_updated", payload);

  // If customer is connected, alert customer
  const customerId = shipment.customer?._id?.toString() || shipment.customer?.toString();
  if (customerId) {
    io.to(`customer_${customerId}`).emit("shipment:customer_update", {
      trackingNumber: shipment.trackingNumber,
      status: shipment.status,
    });
  }
};

export const emitLogisticsException = (exception) => {
  if (!io) return;
  io.to("logistics_control_tower").emit("exception:created", {
    exceptionCode: exception.exceptionCode,
    type: exception.type,
    priority: exception.priority,
    reason: exception.reason,
    detectedAt: exception.detectedAt,
  });
};

export const emitAgentStatusUpdated = (agent) => {
  if (!io) return;
  io.to("logistics_control_tower").emit("agent:status_updated", {
    agentId: agent.agentId,
    name: agent.name,
    status: agent.status,
    activeShipmentsCount: agent.activeShipmentsCount,
  });
};

export const emitHubBacklogUpdated = (hubId, count) => {
  if (!io) return;
  io.to("logistics_control_tower").emit("hub:backlog_updated", {
    hubId,
    count,
  });
};

/**
 * Real-time Product & Inventory Sync
 */
export const emitProductCreated = (product) => {
  if (!io) return;
  io.emit("product:created", {
    productId: product._id,
    title: product.title,
    slug: product.slug,
    category: product.category,
    sellingPrice: product.sellingPrice,
    mrpPrice: product.mrpPrice,
    discountPercent: product.discountPercent,
    images: product.images,
    brand: product.brand,
    inStock: product.inStock,
    countInStock: product.countInStock,
    createdAt: product.createdAt,
  });
};

export const emitProductUpdated = (product) => {
  if (!io) return;
  io.emit("product:updated", {
    productId: product._id,
    title: product.title,
    slug: product.slug,
    sellingPrice: product.sellingPrice,
    mrpPrice: product.mrpPrice,
    discountPercent: product.discountPercent,
    images: product.images,
    inStock: product.inStock,
    countInStock: product.countInStock,
    updatedAt: new Date(),
  });
};

export const emitStockUpdated = ({ productId, countInStock, inStock }) => {
  if (!io) return;
  io.emit("product:stock_updated", {
    productId,
    countInStock,
    inStock: typeof inStock === "boolean" ? inStock : countInStock > 0,
    updatedAt: new Date(),
  });
};

export const emitSessionRevoked = (userId, { sessionId, allOthers, currentSessionId }) => {
  if (!io || !userId) return;
  io.to(`customer_${userId}`).emit("session:revoked", {
    sessionId,
    allOthers: Boolean(allOthers),
    currentSessionId,
    timestamp: new Date(),
  });
};

