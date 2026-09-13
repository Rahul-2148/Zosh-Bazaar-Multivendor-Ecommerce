import express from "express";
import brandController from "../controllers/brand.controller.js";
import authMiddleware from "../../../middlewares/authMiddleware.js";
import { adminOnly } from "../../../middlewares/rbac.middleware.js";

const brandRouter = express.Router();

// Public read
brandRouter.get("/", brandController.getAllBrands);

// Admin operations
brandRouter.use(authMiddleware);
brandRouter.use(adminOnly);

brandRouter.post("/", brandController.createBrand);
brandRouter.patch("/:id", brandController.updateBrand);
brandRouter.delete("/:id", brandController.deleteBrand);

export default brandRouter;
