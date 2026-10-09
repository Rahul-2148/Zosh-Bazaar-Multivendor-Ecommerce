import express from "express";
import authMiddleware from "../../../middlewares/authMiddleware.js";
import { adminOnly } from "../../../middlewares/rbac.middleware.js";
import paymentPlatformController from "../controllers/payment.controller.js";

const router = express.Router();

// ----------------------------------------------------
// CUSTOMER CHECKOUT & PAYMENT FLOWS
// ----------------------------------------------------

/**
 * 1. Step 1 of Native Checkout: Server-authoritative pricing + Intent Creation
 * POST /api/v1/payment/checkout/initiate
 */
router.post(
  "/checkout/initiate",
  authMiddleware,
  paymentPlatformController.initiateCheckout
);

/**
 * 2. Step 2 of Native Checkout: Execute Payment Attempt (UPI, Card, NetBanking, COD, Wallet)
 * POST /api/v1/payment/checkout/attempt
 */
router.post(
  "/checkout/attempt",
  authMiddleware,
  paymentPlatformController.submitPaymentAttempt
);

/**
 * 3. Payment Method Eligibility & Dynamic Options
 * GET /api/v1/payment/eligibility
 */
router.get(
  "/eligibility",
  authMiddleware,
  paymentPlatformController.getEligibility
);

/**
 * 3b. Payment Method Availability API (Phase 12)
 * Server-authoritative rail availability, supported providers, apps, and banks.
 * GET /api/v1/payment/methods
 */
router.get(
  "/methods",
  (req, res, next) => paymentPlatformController.getPaymentMethods(req, res, next)
);

/**
 * 3c. Server-Authoritative EMI Calculator (Phase 11)
 * POST /api/v1/payment/emi/calculate
 */
router.post(
  "/emi/calculate",
  (req, res, next) => paymentPlatformController.calculateEmi(req, res, next)
);

/**
 * 4. Real-time PaymentIntent polling / status
 * GET /api/v1/payment/intent/:intentId
 */
router.get(
  "/intent/:intentId",
  authMiddleware,
  paymentPlatformController.getIntentStatus
);

/**
 * 5. Customer Wallet Balance & Details
 * GET /api/v1/payment/wallet
 */
router.get(
  "/wallet",
  authMiddleware,
  paymentPlatformController.getWallet
);

/**
 * 6. Top-up Customer Wallet
 * POST /api/v1/payment/wallet/topup
 */
router.post(
  "/wallet/topup",
  authMiddleware,
  paymentPlatformController.topupWallet
);

/**
 * 7. Refund Request
 * POST /api/v1/payment/refund
 */
router.post(
  "/refund",
  authMiddleware,
  paymentPlatformController.requestRefund
);

// ----------------------------------------------------
// WEBHOOKS & CALLBACKS (PUBLIC WITH SIGNATURE VERIFICATION)
// ----------------------------------------------------

/**
 * Universal Webhook Ingress
 * POST /api/v1/payment/webhook/:provider
 * POST /api/v1/payment/webhook/razorpay
 * POST /api/v1/payment/webhook/sandbox
 */
router.post(
  "/webhook/:provider",
  (req, res) => paymentPlatformController.handleWebhook(req, res)
);

/**
 * Client-facing verification callback / redirect fallback
 * GET /api/v1/payment/:paymentId
 */
router.get(
  "/:paymentId",
  authMiddleware,
  paymentPlatformController.handleLegacyVerification
);

// ----------------------------------------------------
// ADMIN FINANCIAL OPERATIONS CONSOLE
// ----------------------------------------------------

/**
 * Admin Financial & Payment Metrics
 * GET /api/v1/payment/admin/dashboard
 */
router.get(
  "/admin/dashboard",
  authMiddleware,
  adminOnly,
  paymentPlatformController.getAdminDashboard
);

/**
 * Admin Payment Intents List
 * GET /api/v1/payment/admin/intents
 */
router.get(
  "/admin/intents",
  authMiddleware,
  adminOnly,
  paymentPlatformController.getAdminIntents
);

/**
 * Admin Double-Entry Ledger Explorer
 * GET /api/v1/payment/admin/ledger
 */
router.get(
  "/admin/ledger",
  authMiddleware,
  adminOnly,
  paymentPlatformController.getAdminLedger
);

/**
 * Admin Refunds Review & Management
 * GET /api/v1/payment/admin/refunds
 */
router.get(
  "/admin/refunds",
  authMiddleware,
  adminOnly,
  paymentPlatformController.getAdminRefunds
);

/**
 * Run Automated Financial Reconciliation Audit
 * POST /api/v1/payment/admin/reconciliation/run
 */
router.post(
  "/admin/reconciliation/run",
  authMiddleware,
  adminOnly,
  paymentPlatformController.runReconciliation
);

/**
 * Admin Payment Attempts List
 * GET /api/v1/payment/admin/attempts
 */
router.get(
  "/admin/attempts",
  authMiddleware,
  adminOnly,
  paymentPlatformController.getAdminAttempts
);

/**
 * Admin Transactional Outbox Events
 * GET /api/v1/payment/admin/outbox
 */
router.get(
  "/admin/outbox",
  authMiddleware,
  adminOnly,
  paymentPlatformController.getAdminOutbox
);

/**
 * 2b. Authoritative Attempt Status & Recovery
 * GET /api/v1/payment/checkout/attempt/:attemptId/status
 */
router.get(
  "/checkout/attempt/:attemptId/status",
  authMiddleware,
  paymentPlatformController.getAttemptStatus
);

/**
 * Admin Seller Settlements Explorer
 * GET /api/v1/payment/admin/settlements
 */
router.get(
  "/admin/settlements",
  authMiddleware,
  adminOnly,
  paymentPlatformController.getAdminSettlements
);

/**
 * Admin Provider Registry & Health Control Plane (Phase 20)
 * GET /api/v1/payment/admin/providers
 */
router.get(
  "/admin/providers",
  authMiddleware,
  adminOnly,
  paymentPlatformController.getAdminProviders
);

/**
 * Admin Provider Configuration Mutation with Audit Log (Phase 20)
 * PUT /api/v1/payment/admin/providers/:providerKey
 */
router.put(
  "/admin/providers/:providerKey",
  authMiddleware,
  adminOnly,
  paymentPlatformController.updateAdminProvider
);

// ----------------------------------------------------
// PLATFORM 9.0 JUSPAY ORCHESTRATION ROUTES
// ----------------------------------------------------

/**
 * Client Juspay Checkout Session Initialization
 * POST /api/v1/payment/juspay/session
 */
router.post(
  "/juspay/session",
  authMiddleware,
  paymentPlatformController.createJuspaySession
);

/**
 * Juspay Server-to-Server Order Status Recovery
 * GET /api/v1/payment/juspay/orders/:orderId/status
 */
router.get(
  "/juspay/orders/:orderId/status",
  authMiddleware,
  paymentPlatformController.getJuspayOrderStatus
);

// ----------------------------------------------------
// PLATFORM 9.0 SETTLEMENT BATCHES & BENEFICIARY ROUTES
// ----------------------------------------------------

/**
 * Admin Settlement Batches List
 * GET /api/v1/payment/admin/settlement-batches
 */
router.get(
  "/admin/settlement-batches",
  authMiddleware,
  adminOnly,
  paymentPlatformController.getAdminSettlementBatches
);

/**
 * Generate Settlement Batch for a Seller
 * POST /api/v1/payment/admin/settlement-batches/generate
 */
router.post(
  "/admin/settlement-batches/generate",
  authMiddleware,
  adminOnly,
  paymentPlatformController.generateAdminSettlementBatch
);

/**
 * Submit Settlement Batch to Bank Payout Rail
 * POST /api/v1/payment/admin/settlement-batches/:batchId/payout
 */
router.post(
  "/admin/settlement-batches/:batchId/payout",
  authMiddleware,
  adminOnly,
  paymentPlatformController.executeAdminBatchPayout
);

/**
 * Mark Settlement Batch Settled with Authoritative Bank UTR
 * POST /api/v1/payment/admin/settlement-batches/:batchId/settle
 */
router.post(
  "/admin/settlement-batches/:batchId/settle",
  authMiddleware,
  adminOnly,
  paymentPlatformController.markAdminBatchSettled
);

/**
 * Admin Seller Risk Holds & Reserves
 * GET /api/v1/payment/admin/seller-holds/:sellerId
 * POST /api/v1/payment/admin/seller-holds
 * POST /api/v1/payment/admin/seller-holds/:holdId/release
 */
router.get(
  "/admin/seller-holds/:sellerId",
  authMiddleware,
  adminOnly,
  paymentPlatformController.getAdminSellerHolds
);
router.post(
  "/admin/seller-holds",
  authMiddleware,
  adminOnly,
  paymentPlatformController.createAdminSellerHold
);
router.post(
  "/admin/seller-holds/:holdId/release",
  authMiddleware,
  adminOnly,
  paymentPlatformController.releaseAdminSellerHold
);

/**
 * Admin Beneficiary Verification Management
 * GET /api/v1/payment/admin/beneficiaries/:sellerId
 * POST /api/v1/payment/admin/beneficiaries/:beneficiaryId/verify
 */
router.get(
  "/admin/beneficiaries/:sellerId",
  authMiddleware,
  adminOnly,
  paymentPlatformController.getAdminBeneficiaries
);
router.post(
  "/admin/beneficiaries/:beneficiaryId/verify",
  authMiddleware,
  adminOnly,
  paymentPlatformController.verifyAdminBeneficiary
);

/**
 * Three-Way Settlement & Bank Statement Reconciliation
 * POST /api/v1/payment/admin/reconciliation/three-way
 */
router.post(
  "/admin/reconciliation/three-way",
  authMiddleware,
  adminOnly,
  paymentPlatformController.runThreeWayReconciliation
);

/**
 * Admin Reconciliation Discrepancy Resolution (Maker-Checker & Evidence Audit)
 * POST /api/v1/payment/admin/reconciliation/:reconciliationId/resolve
 */
router.post(
  "/admin/reconciliation/:reconciliationId/resolve",
  authMiddleware,
  adminOnly,
  paymentPlatformController.resolveReconciliationDiscrepancy
);

/**
 * Admin Chargebacks & Disputes Management
 * POST /api/v1/payment/admin/disputes/chargeback
 * POST /api/v1/payment/admin/disputes/chargeback/:disputeReference/resolve
 */
router.post(
  "/admin/disputes/chargeback",
  authMiddleware,
  adminOnly,
  paymentPlatformController.openChargebackDispute
);
router.post(
  "/admin/disputes/chargeback/:disputeReference/resolve",
  authMiddleware,
  adminOnly,
  paymentPlatformController.resolveChargebackDispute
);

export default router;
