import express from "express";
import sellerController from "../controllers/seller.controller.js";

const adminRouter = express.Router();

// update seller account status
adminRouter.patch("/seller/:id/status/:accountStatus", sellerController.updateSellerAccountStatus);

export default adminRouter;