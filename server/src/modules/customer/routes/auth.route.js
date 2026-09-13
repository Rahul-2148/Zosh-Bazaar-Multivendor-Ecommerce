import express from "express";
import authController from "../controllers/auth.controller.js";

const authRouter = express.Router();

// OTP delivery endpoints (support both sent and send variants)
authRouter.post("/sent/login-signup-otp", authController.sendLoginOtp);
authRouter.post("/send/login-signup-otp", authController.sendLoginOtp);
authRouter.post("/send-otp", authController.sendLoginOtp);
authRouter.post("/resend-otp", authController.sendLoginOtp);
authRouter.get("/otp-cooldown", authController.getOtpCooldown);

// Registration and authentication
authRouter.post("/signup", authController.createUser);
authRouter.post("/signin", authController.signin);
authRouter.post("/signing", authController.signin); // Support common alias

export default authRouter;
