import express from "express";
import productController from "../controllers/product.controller.js";

const productRouter = express.Router();

productRouter.get("/search/suggestions", productController.getSearchSuggestions);
productRouter.get("/search", productController.searchProduct);
productRouter.get("/filters", productController.getCategoryFilters);
productRouter.get("/", productController.getAllProducts);
productRouter.get("/:productId", productController.getProductById);


export default productRouter;
