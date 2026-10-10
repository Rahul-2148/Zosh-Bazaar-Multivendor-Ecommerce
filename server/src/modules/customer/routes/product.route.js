import express from "express";
import productController from "../controllers/product.controller.js";
import authMiddleware from "../../../middlewares/authMiddleware.js";

const productRouter = express.Router();

productRouter.get("/search/suggestions", productController.getSearchSuggestions);
productRouter.get("/search", productController.searchProduct);
productRouter.get("/filters", productController.getCategoryFilters);
productRouter.post("/compare", productController.compareProducts);
productRouter.get("/", productController.getAllProducts);
productRouter.get("/:productId/resolve-variant", productController.resolveProductVariant);
productRouter.get("/resolve-variant/:productId", productController.resolveProductVariant);
productRouter.get("/:productId/seller-offers", productController.getOtherSellerOffers);
productRouter.get("/:productId/price-history", productController.getProductPriceHistory);
productRouter.post("/:productId/price-alert", authMiddleware, productController.subscribePriceAlert);
productRouter.get("/:productId/questions", productController.getProductQuestions);
productRouter.post("/:productId/questions", authMiddleware, productController.askProductQuestion);
productRouter.post("/questions/:questionId/upvote", authMiddleware, productController.upvoteProductQuestion);
productRouter.post("/questions/:questionId/answer", authMiddleware, productController.answerProductQuestion);
productRouter.get("/:productId", productController.getProductById);

export default productRouter;

