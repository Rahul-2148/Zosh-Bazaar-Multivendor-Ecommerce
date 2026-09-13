import express from "express";
import settingsController from "../controllers/settings.controller.js";
import authMiddleware from "../../../middlewares/authMiddleware.js";
import { adminOnly } from "../../../middlewares/rbac.middleware.js";

const settingsRouter = express.Router();

// Public: get store settings (currency, shipping fee, etc.)
settingsRouter.get("/", settingsController.getSettings);

// Admin: update store settings
settingsRouter.patch(
  "/",
  authMiddleware,
  adminOnly,
  settingsController.updateSettings
);

export default settingsRouter;
