import express from "express";
import CartController from "../controllers/cart.controller.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const cartRouter = express.Router();

cartRouter.get("/", authMiddleware, CartController.findUserCartHandler);

cartRouter.post("/add", authMiddleware, CartController.addItemToCart);

cartRouter.delete(
  "/item/:cartItemId",
  authMiddleware,
  CartController.deleteCartItemHandler
);

cartRouter.put(
  "/item/:cartItemId",
  authMiddleware,
  CartController.updateCartItemHandler
);

export default cartRouter;
