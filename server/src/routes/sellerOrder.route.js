import express from "express";
import sellerAuthMiddleware from "../middlewares/sellerAuthMiddleware.js";
import orderController from "../controllers/order.controller.js";

const sellerOrderRouter = express.Router();

// get all orders of a seller
sellerOrderRouter.get(
  "/",
  sellerAuthMiddleware,
  orderController.getSellersOrders
);

// update order status by seller
sellerOrderRouter.patch(
  "/:orderId/status/:orderStatus",
  sellerAuthMiddleware,
  orderController.updateOrderStatus
);

// delete an order
sellerOrderRouter.delete(
  "/:orderId",
  sellerAuthMiddleware,
  orderController.deleteOrder
);

export default sellerOrderRouter;
