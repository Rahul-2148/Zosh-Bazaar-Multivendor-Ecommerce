import express from "express";
import DealController from "../controllers/deal.controller.js";
import authMiddleware from "../../../middlewares/authMiddleware.js";
import { adminOnly } from "../../../middlewares/rbac.middleware.js";

const dealRouter = express.Router();

// Public: Get all deals
dealRouter.get("/", DealController.getAllDeals);

// Protected: Admin only operations
dealRouter.post("/create", authMiddleware, adminOnly, DealController.createDeal);
dealRouter.put("/:id", authMiddleware, adminOnly, DealController.updateDeal);
dealRouter.delete("/:id", authMiddleware, adminOnly, DealController.deleteDeal);

export default dealRouter;
