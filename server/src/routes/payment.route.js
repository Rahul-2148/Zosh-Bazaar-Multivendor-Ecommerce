import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { paymentSuccessHandler } from "../controllers/payment.controller.js";

const paymentRouter = express.Router();

// Define route for payment success
paymentRouter.get("/:paymentId", authMiddleware, paymentSuccessHandler);

export default paymentRouter;