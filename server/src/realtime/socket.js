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

  // P1 — Socket.IO Handshake Authentication Middleware (Section 22)
  io.use(async (socket, next) => {
    try {
      const authHeader =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization ||
        socket.handshake.query?.token;

      if (!authHeader) {
        // Guests can connect to receive public catalog updates (product stock sync)
        socket.user = { isGuest: true, role: "GUEST" };
        return next();
      }

      const token = authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : authHeader;

      const secret =
        process.env.JWT_SECRET_KEY || process.env.JWT_SECRET || "default_jwt_secret";
      const jwt = (await import("jsonwebtoken")).default;
      const decoded = jwt.verify(token, secret);

      const email = decoded.email;
      let authenticatedUser = null;

      if (email) {
        const { User } = await import("../models/user.model.js");
        const user = await User.findOne({ email }).select("_id email role fullName");
        if (user) {
          authenticatedUser = {
            _id: user._id.toString(),
            email: user.email,
            role: user.role,
            isGuest: false,
          };
        } else {
          const Seller = (await import("../models/seller.model.js")).default;
          const seller = await Seller.findOne({ email }).select("_id email role sellerName");
          if (seller) {
            authenticatedUser = {
              _id: seller._id.toString(),
              sellerId: seller._id.toString(),
              email: seller.email,
              role: "ROLE_SELLER",
              isGuest: false,
            };
          }
        }
      }

      socket.user = authenticatedUser || {
        _id: decoded._id || decoded.id,
        email: decoded.email,
        role: decoded.role || "ROLE_CUSTOMER",
        isGuest: false,
      };

      next();
    } catch (err) {
      console.warn("[Socket.IO] Handshake authentication note:", err.message);
      socket.user = { isGuest: true, role: "GUEST" };
      next();
    }
  });

  io.on("connection", (socket) => {
    const user = socket.user;

    // Auto-join authenticated user to their verified private room
    if (user && !user.isGuest) {
      const role = (user.role || "").toUpperCase();
      const isAdmin =
        role === "ROLE_ADMIN" ||
        role === "ROLE_SUPER_ADMIN" ||
        role === "ADMIN" ||
        role === "SUPER_ADMIN" ||
        role === "LOGISTICS_OPERATOR";

      const isSeller = role === "ROLE_SELLER" || role === "SELLER";
      const isAgent = role === "ROLE_DELIVERY_AGENT" || role === "DELIVERY_AGENT";

      if (isAdmin) {
        socket.join("admin_room");
        socket.join("logistics_control_tower");
      }
      if (isSeller && user._id) {
        socket.join(`seller_${user._id}`);
      }
      if (isAgent && user._id) {
        socket.join(`agent_${user._id}`);
        socket.join("logistics_control_tower");
      }
      if (!isSeller && !isAdmin && user._id) {
        socket.join(`customer_${user._id}`);
      }
    }

    // Explicit room join request with cryptographic authorization check
    socket.on("join", ({ role, id, agentId }) => {
      if (!socket.user || socket.user.isGuest) {
        socket.emit("error:unauthorized", {
          message: "Authentication required to join private room",
        });
        return;
      }

      const verifiedRole = (socket.user.role || "").toUpperCase();
      const verifiedId = socket.user._id?.toString();

      const isAdmin =
        verifiedRole === "ROLE_ADMIN" ||
        verifiedRole === "ROLE_SUPER_ADMIN" ||
        verifiedRole === "ADMIN" ||
        verifiedRole === "SUPER_ADMIN" ||
        verifiedRole === "LOGISTICS_OPERATOR";

      const isSeller = verifiedRole === "ROLE_SELLER" || verifiedRole === "SELLER";
      const isAgent = verifiedRole === "ROLE_DELIVERY_AGENT" || verifiedRole === "DELIVERY_AGENT";

      // 1. Admin Room Authorization
      if (role === "ADMIN" || role === "LOGISTICS_OPERATOR" || role === "SUPER_ADMIN") {
        if (isAdmin) {
          socket.join("admin_room");
          socket.join("logistics_control_tower");
        } else {
          socket.emit("error:unauthorized", {
            message: "Unauthorized: Admin privileges required",
          });
        }
      }
      // 2. Seller Room Authorization: Never allow seller A -> seller_B
      else if (role === "SELLER") {
        if (isSeller || isAdmin) {
          const targetSellerId = isSeller ? verifiedId : id;
          if (targetSellerId) {
            socket.join(`seller_${targetSellerId}`);
          }
        } else {
          socket.emit("error:unauthorized", {
            message: "Unauthorized: Seller room access denied",
          });
        }
      }
      // 3. Customer Room Authorization: Only own userId
      else if (role === "CUSTOMER") {
        const targetCustomerId = isAdmin ? id : verifiedId;
        if (targetCustomerId) {
          socket.join(`customer_${targetCustomerId}`);
        }
      }
      // 4. Delivery Agent Room Authorization
      else if (role === "DELIVERY_AGENT") {
        if (isAgent || isAdmin) {
          const targetAgentId = isAgent ? verifiedId : (agentId || id);
          if (targetAgentId) socket.join(`agent_${targetAgentId}`);
          socket.join("logistics_control_tower");
        } else {
          socket.emit("error:unauthorized", {
            message: "Unauthorized: Delivery agent access denied",
          });
        }
      }
    });

    socket.on("join_agent", ({ agentId, id }) => {
      const verifiedRole = (socket.user?.role || "").toUpperCase();
      const verifiedId = socket.user?._id?.toString();
      const isAgent = verifiedRole === "ROLE_DELIVERY_AGENT" || verifiedRole === "DELIVERY_AGENT";
      const isAdmin = verifiedRole === "ROLE_ADMIN" || verifiedRole === "ROLE_SUPER_ADMIN";

      if (isAgent || isAdmin) {
        const targetId = isAgent ? verifiedId : (agentId || id);
        if (targetId) socket.join(`agent_${targetId}`);
        socket.join("logistics_control_tower");
      } else {
        socket.emit("error:unauthorized", {
          message: "Unauthorized: Delivery partner access denied",
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

export const emitVariantStockUpdated = (product, variant = null) => {
  if (!io) return;
  const sellerId = product.seller?._id?.toString() || product.seller?.toString();
  const payload = {
    productId: product._id,
    variantId: variant?._id || null,
    sku: variant?.sku || null,
    title: variant?.title || product.title,
    countInStock: variant?.countInStock ?? product.countInStock,
    inStock: (variant?.countInStock ?? product.countInStock) > 0,
    sellingPrice: variant?.sellingPrice ?? product.sellingPrice,
    updatedAt: new Date(),
  };

  io.emit("product:stock_updated", payload);

  if (sellerId) {
    io.to(`seller_${sellerId}`).emit("inventory:stock_updated", payload);
  }
  io.to("admin_room").emit("admin:stock_updated", payload);
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

export const emitStockUpdated = ({
  productId,
  countInStock,
  inStock,
  variantId = null,
  sku = null,
  sellingPrice = null,
}) => {
  if (!io) return;
  io.emit("product:stock_updated", {
    productId,
    variantId,
    sku,
    sellingPrice,
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

