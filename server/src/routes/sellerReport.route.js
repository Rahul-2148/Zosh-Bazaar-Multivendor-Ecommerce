import express from "express";
import sellerAuthMiddleware from "../middlewares/sellerAuthMiddleware.js";
import sellerReportController from "../controllers/sellerReport.controller.js";

const sellerReportRouter = express.Router();

// get seller report (for seller)
sellerReportRouter.get("/", sellerAuthMiddleware, sellerReportController.getSellerReport);

// update seller report (for admin)
sellerReportRouter.patch("/", sellerAuthMiddleware, sellerReportController.updateSellerReport);

export default sellerReportRouter;