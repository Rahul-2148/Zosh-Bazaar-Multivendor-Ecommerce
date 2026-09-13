import express from "express";
import sellerController from "../../seller/controllers/seller.controller.js";
import adminController from "../controllers/admin.controller.js";
import authMiddleware from "../../../middlewares/authMiddleware.js";
import { adminOnly } from "../../../middlewares/rbac.middleware.js";

const adminRouter = express.Router();

// All admin routes require authentication + admin privileges
adminRouter.use(authMiddleware);
adminRouter.use(adminOnly);

// Analytics & Dashboard Summary
adminRouter.get("/analytics/summary", adminController.getDashboardSummary);

// Operations: Orders
adminRouter.get("/orders", adminController.getAllOrders);
adminRouter.patch("/orders/:orderId/status", adminController.updateOrderStatus);

// Operations: Customers
adminRouter.get("/customers", adminController.getAllCustomers);

// Operations: Financial Transactions
adminRouter.get("/transactions", adminController.getAllTransactions);

// Operations: Products CRUD
adminRouter.post("/product", adminController.createProduct);
adminRouter.patch("/product/:id", adminController.updateProduct);
adminRouter.delete("/product/:id", adminController.deleteProduct);

// Operations: Inventory
adminRouter.get("/inventory", adminController.getInventory);
adminRouter.patch("/inventory/:productId", adminController.updateStock);

// Operations: Seller Account Status
adminRouter.patch(
  "/seller/:id/status/:accountStatus",
  sellerController.updateSellerAccountStatus
);

export default adminRouter;
