import express from "express";
import notificationController from "../controllers/notification.controller.js";
import authMiddleware from "../../../middlewares/authMiddleware.js";

const notificationRouter = express.Router();

// All customer notification endpoints require authentication
notificationRouter.use(authMiddleware);

notificationRouter.get("/", notificationController.getUserNotifications);
notificationRouter.patch("/read-all", notificationController.markAllAsRead);
notificationRouter.patch("/:id/read", notificationController.markAsRead);
notificationRouter.delete("/:id", notificationController.deleteNotification);

export default notificationRouter;
