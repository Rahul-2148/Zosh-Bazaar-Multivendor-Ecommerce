import express from "express";
import categoryController from "../controllers/category.controller.js";
import authMiddleware from "../../../middlewares/authMiddleware.js";
import { adminOnly } from "../../../middlewares/rbac.middleware.js";

const categoryRouter = express.Router();

// Public routes
categoryRouter.get("/tree", categoryController.getCategoryTree);
categoryRouter.get("/", categoryController.getAllCategories);
categoryRouter.get("/:id", categoryController.getCategoryById);

// Admin-protected routes
categoryRouter.use(authMiddleware);
categoryRouter.use(adminOnly);

categoryRouter.post("/", categoryController.createCategory);
categoryRouter.patch("/:id", categoryController.updateCategory);
categoryRouter.delete("/:id", categoryController.deleteCategory);

export default categoryRouter;
