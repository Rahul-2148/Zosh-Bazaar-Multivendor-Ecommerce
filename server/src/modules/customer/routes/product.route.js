import express from "express";
import productController from "../controllers/product.controller.js";

const productRouter = express.Router();

productRouter.get("/search/suggestions", productController.getSearchSuggestions);
productRouter.get("/search", productController.searchProduct);
productRouter.get("/filters", productController.getCategoryFilters);
productRouter.get("/", productController.getAllProducts);
productRouter.get("/:productId/resolve-variant", productController.resolveProductVariant);
productRouter.get("/resolve-variant/:productId", productController.resolveProductVariant);
productRouter.get("/:productId", productController.getProductById);

export default productRouter;

