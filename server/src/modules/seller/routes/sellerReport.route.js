import express from "express";
import sellerAuthMiddleware from "../../../middlewares/sellerAuthMiddleware.js";
import authMiddleware from "../../../middlewares/authMiddleware.js";
import { adminOnly } from "../../../middlewares/rbac.middleware.js";
import sellerReportController from "../controllers/sellerReport.controller.js";

const sellerReportRouter = express.Router();

// get seller report (strictly read-only for seller)
sellerReportRouter.get("/", sellerAuthMiddleware, sellerReportController.getSellerReport);

// update seller report (restricted to Platform Admin only for manual dispute reconciliation)
sellerReportRouter.patch("/", authMiddleware, adminOnly, sellerReportController.updateSellerReport);

export default sellerReportRouter;
