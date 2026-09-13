import express from "express";
import homeCategoryController from "../controllers/homeCategory.controller.js";
import authMiddleware from "../../../middlewares/authMiddleware.js";
import { adminOnly } from "../../../middlewares/rbac.middleware.js";

const homeCategoryRouter = express.Router();

// Public: Marketplace feed and active home categories
homeCategoryRouter.get(
  "/feed",
  homeCategoryController.getMarketplaceFeed
);
homeCategoryRouter.get(
  "/home-category",
  homeCategoryController.getAllHomeCategories
);

// Admin only: create home categories
homeCategoryRouter.post(
  "/categories",
  authMiddleware,
  adminOnly,
  homeCategoryController.createHomeCategories
);

// Admin only: update home category
homeCategoryRouter.patch(
  "/home-category/:id",
  authMiddleware,
  adminOnly,
  homeCategoryController.updateHomeCategory
);

export default homeCategoryRouter;
