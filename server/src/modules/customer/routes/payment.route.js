import express from "express";
import authMiddleware from "../../../middlewares/authMiddleware.js";
import {
  paymentSuccessHandler,
  razorpayWebhookHandler,
} from "../controllers/payment.controller.js";

const paymentRouter = express.Router();

/**
 * Authoritative Webhook Endpoint for Razorpay (Section 3.1)
 * POST /api/v1/payment/webhook/razorpay
 */
paymentRouter.post("/webhook/razorpay", razorpayWebhookHandler);

/**
 * Client-facing verification callback
 * GET /api/v1/payment/:paymentId
 */
paymentRouter.get("/:paymentId", authMiddleware, paymentSuccessHandler);

export default paymentRouter;
