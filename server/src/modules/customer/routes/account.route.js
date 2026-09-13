import express from "express";
import authMiddleware from "../../../middlewares/authMiddleware.js";
import accountController from "../controllers/account.controller.js";
import { deletionRequestLimiter, verificationOtpLimiter, supportRequestLimiter } from "../../../middlewares/rateLimiter.middleware.js";

const accountRouter = express.Router();

// Require authenticated customer identity
accountRouter.use(authMiddleware);

// Dashboard Overview
accountRouter.get("/overview", accountController.getOverview);

// Profile
accountRouter.patch("/profile", accountController.updateProfile);
accountRouter.post("/change-password", accountController.changePassword);

// Preferences
accountRouter.get("/preferences", accountController.getPreferences);
accountRouter.patch("/preferences", accountController.updatePreferences);

// Payment Methods
accountRouter.get("/payment-methods", accountController.getPaymentMethods);
accountRouter.post("/payment-methods", accountController.addPaymentMethod);
accountRouter.delete("/payment-methods/:id", accountController.deletePaymentMethod);
accountRouter.patch("/payment-methods/:id/default", accountController.setDefaultPaymentMethod);

// Transactions
accountRouter.get("/transactions", accountController.getTransactions);

// Buy Again
accountRouter.get("/buy-again", accountController.getBuyAgain);

// Returns & Refunds
accountRouter.get("/returns", accountController.getReturns);

// Privacy & Data Export
accountRouter.get("/data-export", accountController.exportData);
accountRouter.post("/delete-account", accountController.deleteAccount); // Legacy — returns error directing to new flow

// ── Account Lifecycle ────────────────────────────────────

// Lifecycle config (frontend needs reasons, grace period, etc.)
accountRouter.get("/lifecycle/config", accountController.getLifecycleConfig);

// Deactivation (reversible)
accountRouter.post("/deactivate", accountController.deactivateAccount);
accountRouter.post("/reactivate", accountController.reactivateAccount);

// Deletion (permanent, multi-step)
accountRouter.post("/deletion/request", deletionRequestLimiter, accountController.requestDeletion);
accountRouter.post("/deletion/send-otp", verificationOtpLimiter, accountController.sendDeletionOTP);
accountRouter.post("/deletion/verify-otp", verificationOtpLimiter, accountController.verifyDeletionOTP);
accountRouter.post("/deletion/confirm", accountController.confirmDeletion);
accountRouter.post("/deletion/cancel", accountController.cancelDeletion);
accountRouter.get("/deletion/status", accountController.getDeletionStatus);

// Customer Care fallback
accountRouter.post("/deletion/support-request", supportRequestLimiter, accountController.submitSupportDeletionRequest);

// Active Device Sessions (Real-time Flipkart Grade)
accountRouter.get("/sessions", accountController.getSessions);
accountRouter.post("/sessions/heartbeat", accountController.registerSession);
accountRouter.delete("/sessions/:id", accountController.revokeSession);
accountRouter.post("/sessions/revoke-others", accountController.revokeAllOtherSessions);

export default accountRouter;
