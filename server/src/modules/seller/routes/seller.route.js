import express from "express";
import sellerController from "../controllers/seller.controller.js";
import sellerAuthMiddleware from "../../../middlewares/sellerAuthMiddleware.js";
import authMiddleware from "../../../middlewares/authMiddleware.js";
import { adminOnly } from "../../../middlewares/rbac.middleware.js";

const sellerRouter = express.Router();

// Public routes (no auth required)
sellerRouter.post("/sent/login-otp", sellerController.sendSellerLoginOtp);
sellerRouter.post("/login/otp", sellerController.sendSellerLoginOtp);
sellerRouter.post("/verify/login-otp", sellerController.verifyLoginOtp);
sellerRouter.post("/verify/otp", sellerController.verifyLoginOtp);
sellerRouter.post("/create", sellerController.createSeller);

// Seller-authenticated routes
sellerRouter.get("/profile", sellerAuthMiddleware, sellerController.getSellerProfile);
sellerRouter.patch("/", sellerAuthMiddleware, sellerController.updateSeller);
sellerRouter.get("/report", sellerAuthMiddleware, sellerController.getSellerReport);

// Admin-protected routes
sellerRouter.get("/all-sellers", authMiddleware, adminOnly, sellerController.getAllSellers);
sellerRouter.delete("/:id", authMiddleware, adminOnly, sellerController.deleteSeller);

// Public route for fetching seller info by ID (for product pages)
sellerRouter.get("/:id", sellerController.getSellerById);

export default sellerRouter;
