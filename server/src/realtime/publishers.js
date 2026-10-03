import { getIO } from "./socket.js";
import { RealtimeEvents } from "./events.js";
import {
  getCustomerRoom,
  getSellerRoom,
  getAdminRoom,
  getLogisticsTowerRoom,
} from "./rooms.js";

/**
 * Domain Event Realtime Publishers (Phase 14 - Section 2 & 6)
 * Decouples business domain workflows from raw WebSocket transport.
 */

// -------------------------------------------------------------
// 1. ORDER & COMMERCIAL EVENT PUBLISHERS (SELLER & ADMIN)
// -------------------------------------------------------------
export const publishOrderCreated = (order) => {
  const io = getIO();
  if (!io || !order) return;

  const sellerId = order.seller?._id?.toString() || order.seller?.toString();

  // Alert assigned vendor on their private channel
  if (sellerId) {
    io.to(getSellerRoom(sellerId)).emit(RealtimeEvents.ORDER_CREATED, {
      orderId: order._id,
      totalSellingPrice: order.totalSellingPrice,
      totalItems: order.totalItems,
      orderDate: order.orderDate,
    });
  }

  // Alert platform administrator
  io.to(getAdminRoom()).emit(RealtimeEvents.ADMIN_NEW_ORDER, {
    orderId: order._id,
    sellerName: order.seller?.sellerName || "Vendor",
    amount: order.totalSellingPrice,
  });
};

export const publishOrderStatusUpdated = async (order) => {
  const io = getIO();
  if (!io || !order) return;

  const userId = order.user?._id?.toString() || order.user?.toString();
  const sellerId = order.seller?._id?.toString() || order.seller?.toString();

  const payload = {
    orderId: order._id,
    orderStatus: order.orderStatus,
    updatedAt: new Date(),
  };

  // 1. Private Customer notification
  if (userId) {
    io.to(getCustomerRoom(userId)).emit(
      RealtimeEvents.ORDER_STATUS_UPDATED,
      payload
    );

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
      publishCustomerNotification(userId, notif);
    } catch (err) {
      console.error("[Realtime Notification Error]:", err.message);
    }
  }

  // 2. Private Seller notification
  if (sellerId) {
    io.to(getSellerRoom(sellerId)).emit(
      RealtimeEvents.ORDER_STATUS_UPDATED,
      payload
    );
  }

  // 3. Private Admin notification
  io.to(getAdminRoom()).emit(RealtimeEvents.ADMIN_ORDER_STATUS_UPDATED, payload);
};

export const publishCustomerNotification = (userId, notification) => {
  const io = getIO();
  if (!io || !userId) return;
  io.to(getCustomerRoom(userId)).emit(
    RealtimeEvents.NOTIFICATION_CREATED,
    notification
  );
};

// -------------------------------------------------------------
// 2. INVENTORY & STOCK ALERT PUBLISHERS
// -------------------------------------------------------------
export const publishLowStockAlert = (product, variantTitle = "") => {
  const io = getIO();
  if (!io || !product) return;

  const sellerId = product.seller?._id?.toString() || product.seller?.toString();
  const payload = {
    productId: product._id,
    title: product.title,
    variantTitle,
    countInStock: product.countInStock,
  };

  if (sellerId) {
    io.to(getSellerRoom(sellerId)).emit(RealtimeEvents.INVENTORY_LOW_STOCK, payload);
  }
  io.to(getAdminRoom()).emit(RealtimeEvents.ADMIN_LOW_STOCK, payload);
};

export const publishVariantStockUpdated = (product, variant = null) => {
  const io = getIO();
  if (!io || !product) return;

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

  // Public event for storefront catalog sync
  io.emit(RealtimeEvents.PRODUCT_STOCK_UPDATED, payload);

  // Private vendor channel
  if (sellerId) {
    io.to(getSellerRoom(sellerId)).emit(
      RealtimeEvents.INVENTORY_STOCK_UPDATED,
      payload
    );
  }
  io.to(getAdminRoom()).emit(RealtimeEvents.ADMIN_STOCK_UPDATED, payload);
};

export const publishStockUpdated = ({
  productId,
  countInStock,
  inStock,
  variantId = null,
  sku = null,
  sellingPrice = null,
}) => {
  const io = getIO();
  if (!io) return;

  io.emit(RealtimeEvents.PRODUCT_STOCK_UPDATED, {
    productId,
    variantId,
    sku,
    sellingPrice,
    countInStock,
    inStock: typeof inStock === "boolean" ? inStock : countInStock > 0,
    updatedAt: new Date(),
  });
};

// -------------------------------------------------------------
// 3. PUBLIC CATALOG PUBLISHERS (Broadcast to all clients/guests)
// -------------------------------------------------------------
export const publishProductCreated = (product) => {
  const io = getIO();
  if (!io || !product) return;

  io.emit(RealtimeEvents.PRODUCT_CREATED, {
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

export const publishProductUpdated = (product) => {
  const io = getIO();
  if (!io || !product) return;

  io.emit(RealtimeEvents.PRODUCT_UPDATED, {
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

// -------------------------------------------------------------
// 4. LOGISTICS & DELIVERY HUB PUBLISHERS
// -------------------------------------------------------------
export const publishShipmentCreated = (shipment) => {
  const io = getIO();
  if (!io || !shipment) return;

  io.to(getLogisticsTowerRoom()).emit(RealtimeEvents.SHIPMENT_CREATED, {
    shipmentId: shipment.shipmentId,
    trackingNumber: shipment.trackingNumber,
    status: shipment.status,
    serviceLevel: shipment.serviceLevel,
    priority: shipment.priority,
    city: shipment.deliveryAddress?.city,
    createdAt: shipment.createdAt,
  });
};

export const publishShipmentStatusUpdated = (shipment) => {
  const io = getIO();
  if (!io || !shipment) return;

  const payload = {
    shipmentId: shipment.shipmentId,
    trackingNumber: shipment.trackingNumber,
    status: shipment.status,
    slaStatus: shipment.sla?.slaStatus,
    currentHub: shipment.currentHub,
    assignedAgent: shipment.assignedAgent,
    updatedAt: new Date(),
  };

  io.to(getLogisticsTowerRoom()).emit(
    RealtimeEvents.SHIPMENT_STATUS_UPDATED,
    payload
  );

  const customerId =
    shipment.customer?._id?.toString() || shipment.customer?.toString();
  if (customerId) {
    io.to(getCustomerRoom(customerId)).emit(
      RealtimeEvents.SHIPMENT_CUSTOMER_UPDATE,
      {
        trackingNumber: shipment.trackingNumber,
        status: shipment.status,
      }
    );
  }
};

export const publishLogisticsException = (exception) => {
  const io = getIO();
  if (!io || !exception) return;

  io.to(getLogisticsTowerRoom()).emit(RealtimeEvents.LOGISTICS_EXCEPTION, {
    exceptionCode: exception.exceptionCode,
    type: exception.type,
    priority: exception.priority,
    reason: exception.reason,
    detectedAt: exception.detectedAt,
  });
};

export const publishAgentStatusUpdated = (agent) => {
  const io = getIO();
  if (!io || !agent) return;

  io.to(getLogisticsTowerRoom()).emit(RealtimeEvents.AGENT_STATUS_UPDATED, {
    agentId: agent.agentId,
    name: agent.name,
    status: agent.status,
    activeShipmentsCount: agent.activeShipmentsCount,
  });
};

export const publishHubBacklogUpdated = (hubId, count) => {
  const io = getIO();
  if (!io) return;

  io.to(getLogisticsTowerRoom()).emit(RealtimeEvents.HUB_BACKLOG_UPDATED, {
    hubId,
    count,
  });
};

export const publishSessionRevoked = (
  userId,
  { sessionId, allOthers, currentSessionId }
) => {
  const io = getIO();
  if (!io || !userId) return;

  io.to(getCustomerRoom(userId)).emit(RealtimeEvents.SESSION_REVOKED, {
    sessionId,
    allOthers: Boolean(allOthers),
    currentSessionId,
    timestamp: new Date(),
  });
};

// Aliases matching legacy emit* naming conventions for backward compatibility
export const emitOrderCreated = publishOrderCreated;
export const emitOrderStatusUpdated = publishOrderStatusUpdated;
export const emitCustomerNotification = publishCustomerNotification;
export const emitLowStockAlert = publishLowStockAlert;
export const emitVariantStockUpdated = publishVariantStockUpdated;
export const emitStockUpdated = publishStockUpdated;
export const emitProductCreated = publishProductCreated;
export const emitProductUpdated = publishProductUpdated;
export const emitShipmentCreated = publishShipmentCreated;
export const emitShipmentStatusUpdated = publishShipmentStatusUpdated;
export const emitLogisticsException = publishLogisticsException;
export const emitAgentStatusUpdated = publishAgentStatusUpdated;
export const emitHubBacklogUpdated = publishHubBacklogUpdated;
export const emitSessionRevoked = publishSessionRevoked;
