import express from "express";
import reviewController from "../controllers/review.controller.js";
import authMiddleware from "../../../middlewares/authMiddleware.js";
import { adminOnly } from "../../../middlewares/rbac.middleware.js";

const reviewRouter = express.Router();

// Public: get product reviews
reviewRouter.get("/product/:productId", reviewController.getProductReviews);

// Customer: add review
reviewRouter.post(
  "/product/:productId",
  authMiddleware,
  reviewController.addReview
);

// Admin moderation routes
reviewRouter.get(
  "/admin/all",
  authMiddleware,
  adminOnly,
  reviewController.getAllReviewsForAdmin
);

reviewRouter.patch(
  "/admin/:id/status",
  authMiddleware,
  adminOnly,
  reviewController.updateReviewStatus
);

reviewRouter.delete(
  "/admin/:id",
  authMiddleware,
  adminOnly,
  reviewController.deleteReview
);

export default reviewRouter;
