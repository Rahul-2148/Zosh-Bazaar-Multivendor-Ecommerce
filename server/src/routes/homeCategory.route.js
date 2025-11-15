import express from "express";
import homeCategoryController from "../controllers/homeCategory.controller.js";

const homeCategoryRouter = express.Router();

// create home categories (admin only)
homeCategoryRouter.post(
  "/categories",
  homeCategoryController.createHomeCategories
);
homeCategoryRouter.get(
  "/home-category",
  homeCategoryController.getAllHomeCategories
);

// update home category (admin only)
homeCategoryRouter.patch(
  "/home-category/:id",
  homeCategoryController.updateHomeCategory
);

export default homeCategoryRouter;

// faltu for future
// homeCategoryRouter.patch("/home-page", homeCategoryController.fetchHomePageData);
