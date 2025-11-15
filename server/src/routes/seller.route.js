import express from "express";
import sellerController from "../controllers/seller.controller.js";
import sellerAuthMiddleware from "../middlewares/sellerAuthMiddleware.js";

const sellerRouter = express.Router();

sellerRouter.post("/sent/login-otp", sellerController.sendSellerLoginOtp);
sellerRouter.post("/verify/login-otp", sellerController.verifyLoginOtp);
sellerRouter.post("/create", sellerController.createSeller);

// ------------------
sellerRouter.get("/profile", sellerAuthMiddleware, sellerController.getSellerProfile);
sellerRouter.get("/all-sellers", sellerController.getAllSellers);
sellerRouter.patch("/", sellerAuthMiddleware, sellerController.updateSeller);
sellerRouter.delete("/:id", sellerController.deleteSeller);

export default sellerRouter;