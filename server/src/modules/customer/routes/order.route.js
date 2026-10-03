import express from "express";
import orderController from "../controllers/order.controller.js";
import authMiddleware from "../../../middlewares/authMiddleware.js";
import { requireIdempotency } from "../../../middlewares/idempotency.middleware.js";

const orderRouter = express.Router();

// Create a new order (with optional Idempotency-Key support)
orderRouter.post(
  "/create",
  authMiddleware,
  requireIdempotency(),
  orderController.createOrder
);

// Get user's order history
orderRouter.get(
  "/user-order-history",
  authMiddleware,
  orderController.getUserOrderHistory
);

// Cancel an order (supports PUT and POST)
orderRouter.put(
  "/:orderId/cancel",
  authMiddleware,
  requireIdempotency(),
  orderController.cancelOrder
);
orderRouter.post(
  "/:orderId/cancel",
  authMiddleware,
  requireIdempotency(),
  orderController.cancelOrder
);

// Request return on delivered order
orderRouter.post(
  "/:orderId/return",
  authMiddleware,
  requireIdempotency(),
  orderController.requestReturn
);

// Get order by id
orderRouter.get("/:orderId", authMiddleware, orderController.getOrderById);

// Get order item by id
orderRouter.get(
  "/item/:orderItemId",
  authMiddleware,
  orderController.getOrderItemById
);



export default orderRouter;
