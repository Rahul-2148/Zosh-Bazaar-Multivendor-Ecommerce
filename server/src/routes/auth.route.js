import express from "express";
import authController from "../controllers/auth.controller.js";

const authRouter = express.Router();

authRouter.post("/sent/login-signup-otp", authController.sendLoginOtp);

authRouter.post("/signup", authController.createUser);
authRouter.post("/signin", authController.signin);

export default authRouter;
