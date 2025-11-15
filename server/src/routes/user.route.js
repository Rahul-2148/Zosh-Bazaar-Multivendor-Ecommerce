import express from "express";
import { getUserProfileByJwt } from "../controllers/user.controller.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const userRouter = express.Router();

userRouter.get("/profile", authMiddleware, getUserProfileByJwt);

export default userRouter;
