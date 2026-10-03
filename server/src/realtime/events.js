/**
 * ZOSH BAZAAR REALTIME EVENT CLASSIFICATION & TAXONOMY (Phase 14 - Section 2 & 6)
 *
 * Classifies every event to prevent cross-tenant & global data leaks:
 * - PUBLIC: Broadcast to all connected clients (e.g. catalog availability)
 * - CUSTOMER_PRIVATE: Targeted strictly to authenticated customer room
 * - SELLER_PRIVATE: Targeted strictly to authenticated vendor room
 * - AGENT_PRIVATE: Targeted strictly to assigned delivery partner room
 * - ADMIN_PRIVATE: Targeted strictly to platform administrative console
 * - LOGISTICS_PRIVATE: Targeted strictly to logistics control tower
 */

export const EventClassification = Object.freeze({
  PUBLIC: "PUBLIC",
  CUSTOMER_PRIVATE: "CUSTOMER_PRIVATE",
  SELLER_PRIVATE: "SELLER_PRIVATE",
  AGENT_PRIVATE: "AGENT_PRIVATE",
  ADMIN_PRIVATE: "ADMIN_PRIVATE",
  LOGISTICS_PRIVATE: "LOGISTICS_PRIVATE",
});

export const RealtimeEvents = Object.freeze({
  // Catalog & Product Inventory (PUBLIC)
  PRODUCT_CREATED: "product:created",
  PRODUCT_UPDATED: "product:updated",
  PRODUCT_STOCK_UPDATED: "product:stock_updated",

  // Orders & Commercial Transactions (PRIVATE)
  ORDER_CREATED: "order:created",
  ADMIN_NEW_ORDER: "admin:new_order",
  ORDER_STATUS_UPDATED: "order:status_updated",
  ADMIN_ORDER_STATUS_UPDATED: "admin:order_status_updated",

  // Notifications & User Lifecycle (CUSTOMER_PRIVATE)
  NOTIFICATION_CREATED: "notification:created",
  SESSION_REVOKED: "session:revoked",

  // Inventory Alerts (SELLER_PRIVATE & ADMIN_PRIVATE)
  INVENTORY_LOW_STOCK: "inventory:low_stock",
  INVENTORY_STOCK_UPDATED: "inventory:stock_updated",
  ADMIN_LOW_STOCK: "admin:low_stock",
  ADMIN_STOCK_UPDATED: "admin:stock_updated",

  // Logistics & Delivery Hub (LOGISTICS_PRIVATE & AGENT_PRIVATE)
  SHIPMENT_CREATED: "shipment:created",
  SHIPMENT_STATUS_UPDATED: "shipment:status_updated",
  SHIPMENT_CUSTOMER_UPDATE: "shipment:customer_update",
  AGENT_STATUS_UPDATED: "agent:status_updated",
  HUB_BACKLOG_UPDATED: "hub:backlog_updated",
  LOGISTICS_EXCEPTION: "exception:created",
  ROUTE_ASSIGNED: "route:assigned",
  DELIVERY_TASK_UPDATED: "delivery:task_updated",
});

export const EVENT_CLASSIFICATION_MAP = Object.freeze({
  [RealtimeEvents.PRODUCT_CREATED]: EventClassification.PUBLIC,
  [RealtimeEvents.PRODUCT_UPDATED]: EventClassification.PUBLIC,
  [RealtimeEvents.PRODUCT_STOCK_UPDATED]: EventClassification.PUBLIC,

  [RealtimeEvents.ORDER_CREATED]: EventClassification.SELLER_PRIVATE,
  [RealtimeEvents.ADMIN_NEW_ORDER]: EventClassification.ADMIN_PRIVATE,
  [RealtimeEvents.ORDER_STATUS_UPDATED]: EventClassification.CUSTOMER_PRIVATE,
  [RealtimeEvents.ADMIN_ORDER_STATUS_UPDATED]: EventClassification.ADMIN_PRIVATE,

  [RealtimeEvents.NOTIFICATION_CREATED]: EventClassification.CUSTOMER_PRIVATE,
  [RealtimeEvents.SESSION_REVOKED]: EventClassification.CUSTOMER_PRIVATE,

  [RealtimeEvents.INVENTORY_LOW_STOCK]: EventClassification.SELLER_PRIVATE,
  [RealtimeEvents.INVENTORY_STOCK_UPDATED]: EventClassification.SELLER_PRIVATE,
  [RealtimeEvents.ADMIN_LOW_STOCK]: EventClassification.ADMIN_PRIVATE,
  [RealtimeEvents.ADMIN_STOCK_UPDATED]: EventClassification.ADMIN_PRIVATE,

  [RealtimeEvents.SHIPMENT_CREATED]: EventClassification.LOGISTICS_PRIVATE,
  [RealtimeEvents.SHIPMENT_STATUS_UPDATED]: EventClassification.LOGISTICS_PRIVATE,
  [RealtimeEvents.SHIPMENT_CUSTOMER_UPDATE]: EventClassification.CUSTOMER_PRIVATE,
  [RealtimeEvents.AGENT_STATUS_UPDATED]: EventClassification.LOGISTICS_PRIVATE,
  [RealtimeEvents.HUB_BACKLOG_UPDATED]: EventClassification.LOGISTICS_PRIVATE,
  [RealtimeEvents.LOGISTICS_EXCEPTION]: EventClassification.LOGISTICS_PRIVATE,
  [RealtimeEvents.ROUTE_ASSIGNED]: EventClassification.AGENT_PRIVATE,
  [RealtimeEvents.DELIVERY_TASK_UPDATED]: EventClassification.AGENT_PRIVATE,
});

export const isPublicEvent = (eventName) => {
  return EVENT_CLASSIFICATION_MAP[eventName] === EventClassification.PUBLIC;
};

export default RealtimeEvents;
