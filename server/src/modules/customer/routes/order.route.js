import express from "express";
import orderController from "../controllers/order.controller.js";
import authMiddleware from "../../../middlewares/authMiddleware.js";

const orderRouter = express.Router();

// Create a new order
orderRouter.post("/create", authMiddleware, orderController.createOrder);

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
  orderController.cancelOrder
);
orderRouter.post(
  "/:orderId/cancel",
  authMiddleware,
  orderController.cancelOrder
);

// Request return on delivered order
orderRouter.post(
  "/:orderId/return",
  authMiddleware,
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
