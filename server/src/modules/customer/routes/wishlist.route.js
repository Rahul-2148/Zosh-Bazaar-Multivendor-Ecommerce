import express from "express";
import authMiddleware from "../../../middlewares/authMiddleware.js";
import wishlistController from "../controllers/wishlist.controller.js";

const wishlistRouter = express.Router();

// Public shared collection link
wishlistRouter.get("/shared/:shareToken", wishlistController.getSharedCollection);

// Protected routes (User authenticated)
wishlistRouter.get("/", authMiddleware, wishlistController.getWishlistOverview);
wishlistRouter.post("/toggle/:productId", authMiddleware, wishlistController.toggleWishlistProduct);
wishlistRouter.post("/save", authMiddleware, wishlistController.saveProductToCollections);
wishlistRouter.get("/product-status/:productId", authMiddleware, wishlistController.getProductSavedStatus);
wishlistRouter.delete("/items/:id", authMiddleware, wishlistController.removeSavedItem);
wishlistRouter.post("/remove-product/:productId", authMiddleware, wishlistController.removeProductFromAll);

// Collection CRUD
wishlistRouter.post("/collections", authMiddleware, wishlistController.createCollection);
wishlistRouter.patch("/collections/:id", authMiddleware, wishlistController.updateCollection);
wishlistRouter.delete("/collections/:id", authMiddleware, wishlistController.deleteCollection);
wishlistRouter.post("/collections/:id/share", authMiddleware, wishlistController.shareCollection);

// Bulk and organization
wishlistRouter.post("/items/move", authMiddleware, wishlistController.moveItems);
wishlistRouter.post("/bulk-delete", authMiddleware, wishlistController.bulkDelete);

// Cart integration
wishlistRouter.post("/save-for-later", authMiddleware, wishlistController.saveForLater);
wishlistRouter.post("/move-to-cart", authMiddleware, wishlistController.moveToCart);

// Guest sync
wishlistRouter.post("/sync-guest", authMiddleware, wishlistController.syncGuestItems);

export default wishlistRouter;
