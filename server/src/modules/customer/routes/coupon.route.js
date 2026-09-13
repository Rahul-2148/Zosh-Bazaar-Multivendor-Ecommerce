import express from "express";
import authMiddleware from "../../../middlewares/authMiddleware.js";
import { adminOnly } from "../../../middlewares/rbac.middleware.js";
import couponController from "../controllers/coupon.controller.js";

const couponRouter = express.Router();

// Customer: Available Coupons
couponRouter.get("/available", authMiddleware, couponController.getAvailableCoupons);

// Customer: Apply Coupon
couponRouter.post("/apply", authMiddleware, couponController.applyCoupon);

// Admin: Coupon Management
couponRouter.get(
  "/admin/all",
  authMiddleware,
  adminOnly,
  couponController.getAllCoupons
);
couponRouter.post(
  "/admin/create",
  authMiddleware,
  adminOnly,
  couponController.createCoupon
);
couponRouter.delete(
  "/admin/delete/:id",
  authMiddleware,
  adminOnly,
  couponController.deleteCoupon
);

export default couponRouter;
