import express from "express";
import sellerAuthMiddleware from "../middlewares/sellerAuthMiddleware.js";
import sellerProductController from "../controllers/product.controller.js";

const sellerProductRouter = express.Router();

sellerProductRouter.get(
  "/",
  sellerAuthMiddleware,
  sellerProductController.getProductBySellerId
);

sellerProductRouter.post(
  "/create",
  sellerAuthMiddleware,
  sellerProductController.createProduct
);

sellerProductRouter.patch(
  "/:productId",
  sellerAuthMiddleware,
  sellerProductController.updateProduct
);

sellerProductRouter.delete(
  "/:productId",
  sellerAuthMiddleware,
  sellerProductController.deleteProduct
);

sellerProductRouter.post(
  "/delete-multiple",
  sellerAuthMiddleware,
  sellerProductController.deleteMultipleProducts
);

export default sellerProductRouter;
