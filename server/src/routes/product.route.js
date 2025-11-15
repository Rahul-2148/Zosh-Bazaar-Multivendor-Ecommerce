import express from "express";
import sellerProductController from "../controllers/product.controller.js";

const productRouter = express.Router();

productRouter.get("/search", sellerProductController.searchProduct);

productRouter.get("/", sellerProductController.getAllProducts);

productRouter.get("/:productId", sellerProductController.getProductById);

export default productRouter;
