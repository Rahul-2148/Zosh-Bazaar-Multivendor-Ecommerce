import express from "express";
import sellerAuthMiddleware from "../../../middlewares/sellerAuthMiddleware.js";
import { sellerActiveOnly } from "../../../middlewares/rbac.middleware.js";
import sellerProductController from "../../customer/controllers/product.controller.js";

const sellerProductRouter = express.Router();

sellerProductRouter.get(
  "/",
  sellerAuthMiddleware,
  sellerProductController.getProductBySellerId
);

sellerProductRouter.post(
  "/create",
  sellerAuthMiddleware,
  sellerActiveOnly,
  sellerProductController.createProduct
);

sellerProductRouter.patch(
  "/:productId",
  sellerAuthMiddleware,
  sellerActiveOnly,
  sellerProductController.updateProduct
);

sellerProductRouter.delete(
  "/:productId",
  sellerAuthMiddleware,
  sellerActiveOnly,
  sellerProductController.deleteProduct
);

sellerProductRouter.post(
  "/delete-multiple",
  sellerAuthMiddleware,
  sellerActiveOnly,
  sellerProductController.deleteMultipleProducts
);

sellerProductRouter.patch(
  "/bulk-status",
  sellerAuthMiddleware,
  sellerActiveOnly,
  sellerProductController.bulkUpdateStatus
);

export default sellerProductRouter;
