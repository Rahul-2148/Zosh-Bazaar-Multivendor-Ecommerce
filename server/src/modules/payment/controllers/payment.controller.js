import paymentOrchestratorService from "../services/PaymentOrchestratorService.js";
import paymentEligibilityService from "../services/PaymentEligibilityService.js";
import paymentOffersService from "../services/PaymentOffersService.js";
import paymentPricingService from "../services/PaymentPricingService.js";
import paymentIntentService from "../services/PaymentIntentService.js";
import paymentWebhookService from "../services/PaymentWebhookService.js";
import walletService from "../services/WalletService.js";
import ledgerService from "../services/LedgerService.js";
import refundService from "../services/RefundService.js";
import reconciliationService from "../services/ReconciliationService.js";
import settlementService from "../services/SettlementService.js";
import CartService from "../../customer/services/cart.service.js";
import OrderService from "../../customer/services/order.service.js";
import { PaymentIntent } from "../models/paymentIntent.model.js";
import { PaymentAttempt } from "../models/paymentAttempt.model.js";
import { IdempotencyManager } from "../utils/idempotency.js";
import { DistributedLock } from "../utils/distributedLock.js";
import paymentProviderRegistry from "../services/PaymentProviderRegistry.js";
import emiService from "../services/EmiService.js";
import paymentRoutingService from "../services/PaymentRoutingService.js";
import { SettlementBatch } from "../models/settlementBatch.model.js";
import Money from "../utils/Money.js";

class PaymentPlatformController {
  /**
   * POST /api/v1/payment/checkout/initiate
   * Step 1 of Zosh Native Checkout: Server-authoritative pricing + intent creation.
   * P0 Hardening: Idempotency is checked BEFORE any order, inventory, or money mutations.
   */
  async initiateCheckout(req, res, next) {
    let lockToken = null;
    let lockKey = null;

    try {
      const user = req.user;
      const {
        shippingAddress,
        paymentMethod = "UPI",
        offerCode = null,
        bankCode = null,
        cardNetwork = null,
        splitWithWallet = false,
      } = req.body;
      const idempotencyKey = req.headers["idempotency-key"] || req.body.idempotencyKey;
      const ipAddress = req.ip || req.headers["x-forwarded-for"] || "127.0.0.1";
      const endpoint = "/api/v1/payment/checkout/initiate";

      const payloadToHash = {
        userId: (user._id || user).toString(),
        shippingAddress,
        paymentMethod,
        offerCode,
        bankCode,
        cardNetwork,
        splitWithWallet,
      };

      // 1. Fast idempotency check before any state change
      if (idempotencyKey) {
        const existing = await IdempotencyManager.getExistingResult(
          idempotencyKey,
          endpoint,
          payloadToHash
        );
        if (existing) {
          return res.status(existing.status || 200).json(existing.data || existing);
        }
      }

      // 2. Concurrency Lock: Prevent parallel double-click or simultaneous duplicate submissions
      lockKey = idempotencyKey
        ? `checkout:idempotency:${idempotencyKey}`
        : `checkout:user:${user._id || user}`;
      lockToken = await DistributedLock.acquire(lockKey, 15);
      if (!lockToken) {
        return res.status(409).json({
          success: false,
          error: true,
          message: "A checkout operation is currently processing for this request. Please wait or retry shortly.",
        });
      }

      // 3. Double-check idempotency under lock
      if (idempotencyKey) {
        const existing = await IdempotencyManager.getExistingResult(
          idempotencyKey,
          endpoint,
          payloadToHash
        );
        if (existing) {
          await DistributedLock.release(lockKey, lockToken);
          lockToken = null;
          return res.status(existing.status || 200).json(existing.data || existing);
        }
      }

      // 4. Validate user cart
      const cart = await CartService.findUserCart(user);
      if (!cart || !cart.cartItems || cart.cartItems.length === 0) {
        if (lockToken) {
          await DistributedLock.release(lockKey, lockToken);
          lockToken = null;
        }
        return res.status(400).json({
          success: false,
          error: true,
          message: "Cart is empty. Cannot initiate checkout.",
        });
      }

      // 5. Create orders across sellers with inventory lock (DO NOT clear cart yet!)
      let orders = [];
      try {
        orders = await OrderService.createOrder(user, shippingAddress, cart, {
          clearCart: false,
          emitEvents: false,
        });
      } catch (orderErr) {
        if (lockToken) {
          await DistributedLock.release(lockKey, lockToken);
          lockToken = null;
        }
        return res.status(400).json({
          success: false,
          error: true,
          message: orderErr.message,
        });
      }

      // 6. Orchestrate checkout intent
      let result;
      try {
        result = await paymentOrchestratorService.initializeCheckout({
          user,
          cart,
          orders,
          paymentMethod,
          offerCode,
          bankCode,
          cardNetwork,
          splitWithWallet,
          idempotencyKey,
          ipAddress,
        });
      } catch (intentErr) {
        // Rollback created orders & restore inventory if intent creation fails
        try {
          await OrderService.rollbackOrders(orders);
        } catch (rbErr) {
          console.error("[PaymentPlatform] Failed to rollback orders after intent failure:", rbErr.message);
        }
        if (lockToken) {
          await DistributedLock.release(lockKey, lockToken);
          lockToken = null;
        }
        throw intentErr;
      }

      const responseBody = {
        success: true,
        message: "Payment intent initialized successfully",
        orders,
        intent: result.intent,
        pricing: result.pricingSnapshot,
        splitConfig: result.splitConfig,
      };

      // 7. Persist authoritative idempotency result
      if (idempotencyKey) {
        await IdempotencyManager.recordResult(
          idempotencyKey,
          endpoint,
          "POST",
          payloadToHash,
          201,
          responseBody,
          user._id || user
        );
      }

      if (lockToken) {
        await DistributedLock.release(lockKey, lockToken);
        lockToken = null;
      }

      return res.status(201).json(responseBody);
    } catch (error) {
      if (lockToken) {
        await DistributedLock.release(lockKey, lockToken).catch(() => {});
      }
      next(error);
    }
  }

  /**
   * POST /api/v1/payment/checkout/attempt
   * Step 2 of Zosh Native Checkout: Execute rail attempt (UPI intent/QR, Saved Card, NetBanking, COD).
   */
  async submitPaymentAttempt(req, res, next) {
    let lockToken = null;
    let lockKey = null;

    try {
      const { intentId, method, payload = {}, metadata = {} } = req.body;
      const idempotencyKey = req.headers["idempotency-key"] || req.body.idempotencyKey;
      const endpoint = "/api/v1/payment/checkout/attempt";

      if (!intentId) {
        return res.status(400).json({
          success: false,
          error: true,
          message: "Missing intentId for payment attempt",
        });
      }

      const payloadToHash = {
        intentId,
        method,
        payload,
      };

      // 1. Idempotency check before executing attempt
      if (idempotencyKey) {
        const existing = await IdempotencyManager.getExistingResult(
          idempotencyKey,
          endpoint,
          payloadToHash
        );
        if (existing) {
          return res.status(existing.status || 200).json(existing.data || existing);
        }
      }

      // 2. Concurrency lock on attempt
      lockKey = `attempt:intent:${intentId}`;
      lockToken = await DistributedLock.acquire(lockKey, 15);
      if (!lockToken) {
        return res.status(409).json({
          success: false,
          error: true,
          message: "A payment attempt is currently being processed for this order. Please wait.",
        });
      }

      const result = await paymentOrchestratorService.submitPaymentAttempt({
        intentId,
        method,
        payload,
        metadata,
        idempotencyKey,
      });

      const responseBody = {
        success: true,
        ...result,
      };

      // 3. Record authoritative idempotency result
      if (idempotencyKey) {
        await IdempotencyManager.recordResult(
          idempotencyKey,
          endpoint,
          "POST",
          payloadToHash,
          200,
          responseBody,
          req.user?._id || null
        );
      }

      if (lockToken) {
        await DistributedLock.release(lockKey, lockToken);
        lockToken = null;
      }

      return res.status(200).json(responseBody);
    } catch (error) {
      if (lockToken) {
        await DistributedLock.release(lockKey, lockToken).catch(() => {});
      }
      next(error);
    }
  }

  /**
   * GET /api/v1/payment/eligibility
   * Fetch real-time available payment methods & wallet balance.
   */
  async getEligibility(req, res, next) {
    try {
      const user = req.user;
      const cart = await CartService.findUserCart(user);
      const payableAmount = Number(cart?.totalSellingPrice || 0);

      const eligibility = await paymentEligibilityService.evaluateEligibility({
        userId: user._id,
        payableAmount,
      });

      const offers = await paymentOffersService.getActiveOffers({
        cartTotal: payableAmount,
      });

      return res.status(200).json({
        success: true,
        eligibility,
        offers,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/payment/intent/:intentId
   * Polling / real-time intent status check.
   */
  async getIntentStatus(req, res, next) {
    try {
      const { intentId } = req.params;
      const intent = await paymentIntentService.getIntentById(intentId);
      const attempts = await PaymentAttempt.find({ intentId: intent.intentId })
        .sort({ createdAt: -1 })
        .lean();

      return res.status(200).json({
        success: true,
        intent,
        attempts,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/payment/wallet
   * Customer wallet details & balance.
   */
  async getWallet(req, res, next) {
    try {
      const user = req.user;
      const wallet = await walletService.getOrCreateWallet(user._id);
      return res.status(200).json({
        success: true,
        wallet,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/payment/wallet/topup
   * Add money to customer wallet.
   */
  async topupWallet(req, res, next) {
    try {
      const user = req.user;
      const { amount, sourceReference } = req.body;
      const idempotencyKey = req.headers["idempotency-key"] || req.body.idempotencyKey;

      Money.validate(amount, "amount");

      const wallet = await walletService.topupWallet(
        user._id,
        amount,
        sourceReference || `topup_${Date.now()}`,
        idempotencyKey
      );

      return res.status(200).json({
        success: true,
        message: "Wallet topped up successfully",
        wallet,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/payment/refund
   * Customer / vendor refund request.
   */
  async requestRefund(req, res, next) {
    try {
      const { orderId, amount, reason, destination } = req.body;
      const idempotencyKey = req.headers["idempotency-key"] || req.body.idempotencyKey;
      const endpoint = "/api/v1/payment/refund";

      Money.validate(amount, "amount");

      const payloadToHash = {
        orderId,
        amount: Number(amount),
        destination: destination || "WALLET",
      };

      if (idempotencyKey) {
        const existing = await IdempotencyManager.getExistingResult(
          idempotencyKey,
          endpoint,
          payloadToHash
        );
        if (existing) {
          return res.status(existing.status || 200).json(existing.data || existing);
        }
      }

      const result = await refundService.createRefund({
        orderId,
        amount: Number(amount),
        reason,
        destination: destination || "WALLET",
        idempotencyKey,
        initiatedBy: req.user?.role || "CUSTOMER",
      });

      const responseBody = {
        success: true,
        message: "Refund processed successfully",
        refund: result.refund,
      };

      if (idempotencyKey) {
        await IdempotencyManager.recordResult(
          idempotencyKey,
          endpoint,
          "POST",
          payloadToHash,
          200,
          responseBody,
          req.user?._id || req.user
        );
      }

      return res.status(200).json(responseBody);
    } catch (error) {
      if (error.code === "IDEMPOTENCY_KEY_REUSE" || error.statusCode === 409) {
        return res.status(409).json({
          success: false,
          error: true,
          code: "IDEMPOTENCY_KEY_REUSE",
          message: error.message || "Idempotency key reused with different request payload",
        });
      }
      next(error);
    }
  }

  /**
   * POST /api/v1/payment/webhook/:provider
   * Universal provider webhook endpoint.
   */
  async handleWebhook(req, res) {
    const provider = (req.params.provider || "RAZORPAY").toUpperCase();
    const signature =
      req.headers["x-razorpay-signature"] ||
      req.headers["x-cashfree-signature"] ||
      req.headers["x-webhook-signature"] ||
      req.headers["x-sandbox-signature"] ||
      req.headers["x-verify"] ||
      req.headers["X-VERIFY"] ||
      req.headers["x-payu-signature"] ||
      req.body?.hash;
    const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body || {}));

    try {
      const result = await paymentWebhookService.processWebhook({
        provider,
        payload: req.body,
        signature,
        rawBody,
        headers: req.headers,
      });

      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error(`[PaymentWebhook ${provider} Error]:`, error.message);
      return res.status(error.statusCode || 400).json({
        success: false,
        error: true,
        message: error.message,
      });
    }
  }

  /**
   * GET /api/v1/payment/:paymentId
   * Legacy and client-side verification callback endpoint.
   */
  async handleLegacyVerification(req, res, next) {
    const { paymentId } = req.params;
    const { paymentLinkId } = req.query;

    try {
      // Find matching attempt or intent
      const attempt = await PaymentAttempt.findOne({
        $or: [{ providerReference: paymentId }, { attemptId: paymentId }],
      });

      if (attempt) {
        if (attempt.status === "CAPTURED" || attempt.status === "SETTLED") {
          return res.status(200).json({
            success: true,
            message: "Payment verified successfully",
            status: attempt.status,
            attemptId: attempt.attemptId,
            intentId: attempt.intentId,
          });
        }

        // Authoritative gateway status inquiry (never capture blindly on client GET!)
        const recoveryResult = await paymentOrchestratorService.checkAndRecoverAttemptStatus(attempt);
        const isCaptured =
          recoveryResult.status === "CAPTURED" ||
          recoveryResult.attempt?.status === "CAPTURED" ||
          recoveryResult.attempt?.status === "SETTLED";

        if (isCaptured) {
          return res.status(200).json({
            success: true,
            message: "Payment verified successfully via authoritative gateway confirmation",
            status: "CAPTURED",
            attemptId: attempt.attemptId,
            intentId: attempt.intentId,
          });
        }

        return res.status(400).json({
          success: false,
          message: `Payment is not captured. Current gateway status is "${recoveryResult.status || attempt.status}".`,
          status: recoveryResult.status || attempt.status,
          attemptId: attempt.attemptId,
          intentId: attempt.intentId,
        });
      }

      // Backward compatibility: delegate to legacy payment order lookup
      const legacyService = (await import("../../customer/services/payment.service.js")).default;
      let paymentOrder = null;
      if (paymentLinkId) {
        paymentOrder = await legacyService.getPaymentOrderByPaymentLinkId(paymentLinkId);
      } else {
        paymentOrder = await legacyService.getPaymentOrderById(paymentId);
      }

      const verified = await legacyService.proceedPaymentOrder(
        paymentOrder,
        paymentId,
        paymentLinkId
      );

      return res.status(200).json({
        success: true,
        message: "Payment verified successfully",
        paymentOrder: verified,
      });
    } catch (error) {
      next(error);
    }
  }

  // ----------------------------------------------------------------------
  // ADMIN FINANCIAL OPERATIONS CONTROLLERS
  // ----------------------------------------------------------------------

  /**
   * GET /api/v1/payment/admin/dashboard
   */
  async getAdminDashboard(req, res, next) {
    try {
      const [totalIntents, totalAttempts, successfulAttempts, failedAttempts, totalRefunds] =
        await Promise.all([
          PaymentIntent.countDocuments(),
          PaymentAttempt.countDocuments(),
          PaymentAttempt.countDocuments({ status: "CAPTURED" }),
          PaymentAttempt.countDocuments({ status: "FAILED" }),
          (await import("../models/refund.model.js")).Refund.countDocuments(),
        ]);

      const successRate =
        totalAttempts > 0 ? Math.round((successfulAttempts / totalAttempts) * 100) : 100;

      return res.status(200).json({
        success: true,
        metrics: {
          totalIntents,
          totalAttempts,
          successfulAttempts,
          failedAttempts,
          totalRefunds,
          successRate,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/payment/admin/intents
   */
  async getAdminIntents(req, res, next) {
    try {
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
      const skip = (page - 1) * limit;

      const filter = {};
      if (req.query.status && req.query.status !== "ALL") {
        filter.status = req.query.status;
      }

      const [intents, total] = await Promise.all([
        PaymentIntent.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate("user", "fullName email mobile")
          .lean(),
        PaymentIntent.countDocuments(filter),
      ]);

      return res.status(200).json({
        success: true,
        intents,
        total,
        totalPages: Math.ceil(total / limit),
        page,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/payment/admin/ledger
   */
  async getAdminLedger(req, res, next) {
    try {
      const result = await ledgerService.getAllJournals(req.query);
      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/payment/admin/refunds
   */
  async getAdminRefunds(req, res, next) {
    try {
      const result = await refundService.getAllRefunds(req.query);
      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/payment/admin/reconciliation/run
   */
  async runReconciliation(req, res, next) {
    try {
      const record = await reconciliationService.runReconciliation(req.body);
      return res.status(200).json({
        success: true,
        message: "Reconciliation job completed",
        record,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/payment/checkout/attempt/:attemptId/status
   * Authoritative status check and recovery for in-flight/pending payment attempt.
   */
  async getAttemptStatus(req, res, next) {
    try {
      const { attemptId } = req.params;
      const result = await paymentOrchestratorService.checkAndRecoverAttemptStatus(attemptId);
      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/payment/admin/attempts
   */
  async getAdminAttempts(req, res, next) {
    try {
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
      const skip = (page - 1) * limit;

      const filter = {};
      if (req.query.status && req.query.status !== "ALL") {
        filter.status = req.query.status;
      }
      if (req.query.method && req.query.method !== "ALL") {
        filter.method = req.query.method;
      }

      const [attempts, total] = await Promise.all([
        PaymentAttempt.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate("intent", "amount currency status")
          .lean(),
        PaymentAttempt.countDocuments(filter),
      ]);

      return res.status(200).json({
        success: true,
        attempts,
        total,
        totalPages: Math.ceil(total / limit),
        page,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/payment/admin/outbox
   */
  async getAdminOutbox(req, res, next) {
    try {
      const { PaymentOutbox } = await import("../models/paymentOutbox.model.js");
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
      const skip = (page - 1) * limit;

      const filter = {};
      if (req.query.status && req.query.status !== "ALL") {
        filter.status = req.query.status;
      }

      const [events, total] = await Promise.all([
        PaymentOutbox.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        PaymentOutbox.countDocuments(filter),
      ]);

      return res.status(200).json({
        success: true,
        events,
        total,
        totalPages: Math.ceil(total / limit),
        page,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/payment/admin/settlements
   */
  async getAdminSettlements(req, res, next) {
    try {
      const result = await settlementService.getAllSettlements(req.query);
      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/payment/methods (Phase 12: Payment Method Availability API)
   * Server-authoritative endpoint returning dynamically available rails, providers, apps, and banks.
   */
  async getPaymentMethods(req, res, next) {
    try {
      const amount = Number(req.query.amount) || 0;
      const currency = req.query.currency || "INR";
      const user = req.user;

      // 1. UPI Rail
      const upiProviders = paymentProviderRegistry.getProvidersForRail("UPI")
        .filter((p) => p.enabled)
        .map((p) => p.name);
      const upiAvailable = upiProviders.length > 0;

      // 2. Card Rail
      const cardProviders = paymentProviderRegistry.getProvidersForRail("CARD")
        .filter((p) => p.enabled)
        .map((p) => p.name);
      const cardAvailable = cardProviders.length > 0;

      // 3. NetBanking Rail
      const nbProviders = paymentProviderRegistry.getProvidersForRail("NETBANKING")
        .filter((p) => p.enabled)
        .map((p) => p.name);
      const nbAvailable = nbProviders.length > 0;

      // 4. EMI Rail
      const emiCheck = emiService.checkEligibility({ amount });
      const emiAvailable = emiCheck.eligible;

      // 5. COD Rail
      const codProviders = paymentProviderRegistry.getProvidersForRail("COD")
        .filter((p) => p.enabled)
        .map((p) => p.name);
      const codAvailable = codProviders.length > 0;

      // 6. Wallet
      let walletBalance = 0;
      if (user && user._id) {
        try {
          const w = await walletService.getOrCreateWallet(user._id);
          walletBalance = w.availableBalance || 0;
        } catch {}
      }

      const methods = [
        {
          type: "UPI",
          name: "UPI (Google Pay, PhonePe, Paytm, QR)",
          available: upiAvailable,
          providers: upiProviders,
          capabilities: [
            "supportsUPIIntent",
            "supportsUPICollect",
            "supportsUPIQR",
            "supportsWebhook",
            "supportsPolling",
          ],
          apps: [
            { id: "gpay", name: "Google Pay", scheme: "gpay" },
            { id: "phonepe", name: "PhonePe", scheme: "phonepe" },
            { id: "paytm", name: "Paytm", scheme: "paytmmp" },
            { id: "bhim", name: "BHIM UPI", scheme: "upi" },
            { id: "cred", name: "CRED", scheme: "cred" },
          ],
        },
        {
          type: "CARD",
          name: "Credit / Debit Card",
          available: cardAvailable,
          providers: cardProviders,
          capabilities: [
            "supportsCards",
            "supportsTokenization",
            "supports3DS",
            "supportsAuthorization",
            "supportsCapture",
          ],
          supportedNetworks: ["VISA", "MASTERCARD", "RUPAY", "AMEX"],
        },
        {
          type: "NETBANKING",
          name: "Net Banking",
          available: nbAvailable,
          providers: nbProviders,
          capabilities: ["supportsNetBanking", "supportsWebhook"],
          popularBanks: [
            { code: "HDFC", name: "HDFC Bank" },
            { code: "SBIN", name: "State Bank of India" },
            { code: "ICIC", name: "ICICI Bank" },
            { code: "AXIS", name: "Axis Bank" },
            { code: "KKBK", name: "Kotak Mahindra Bank" },
            { code: "PUNB", name: "Punjab National Bank" },
          ],
          allBanks: [
            { code: "HDFC", name: "HDFC Bank" },
            { code: "SBIN", name: "State Bank of India" },
            { code: "ICIC", name: "ICICI Bank" },
            { code: "AXIS", name: "Axis Bank" },
            { code: "KKBK", name: "Kotak Mahindra Bank" },
            { code: "PUNB", name: "Punjab National Bank" },
            { code: "BARB", name: "Bank of Baroda" },
            { code: "CNRB", name: "Canara Bank" },
            { code: "IDFB", name: "IDFC FIRST Bank" },
            { code: "UTIB", name: "Yes Bank" },
            { code: "INDB", name: "IndusInd Bank" },
            { code: "UBIN", name: "Union Bank of India" },
          ],
        },
        {
          type: "EMI",
          name: "Equated Monthly Installment (EMI)",
          available: emiAvailable,
          reasonCode: emiCheck.eligible ? null : emiCheck.reasonCode,
          message: emiCheck.eligible ? null : emiCheck.message,
          minOrderAmount: 3000,
          eligibleBanks: emiService.getEligibleBanks(),
          plans: emiAvailable ? emiService.getAvailablePlans(amount) : [],
        },
        {
          type: "WALLET",
          name: "Zosh Wallet",
          available: true,
          balance: walletBalance,
          currency,
        },
        {
          type: "COD",
          name: "Cash on Delivery",
          available: codAvailable,
          providers: codProviders,
          maxLimit: 25000,
        },
      ];

      return res.status(200).json({
        success: true,
        methods,
        environment: process.env.NODE_ENV || "development",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/payment/emi/calculate (Phase 11: Server-authoritative EMI calculation)
   */
  async calculateEmi(req, res, next) {
    try {
      const { amount, bankCode, tenureMonths, subventionType } = req.body;
      const numAmount = Number(amount);
      if (!numAmount || numAmount < 3000) {
        return res.status(400).json({
          success: false,
          error: "ORDER_VALUE_TOO_LOW",
          message: "Order amount must be at least ₹3,000 for EMI eligibility",
        });
      }

      const calculation = emiService.calculateEmi({
        amount: numAmount,
        bankCode: bankCode || "HDFC",
        tenureMonths: Number(tenureMonths) || 6,
        subventionType: subventionType || "NONE",
      });

      return res.status(200).json({
        success: true,
        calculation,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/payment/admin/providers (Phase 20: Admin Provider Control Plane)
   */
  async getAdminProviders(req, res, next) {
    try {
      const providers = paymentProviderRegistry.getAllProviders();
      return res.status(200).json({
        success: true,
        providers,
        total: providers.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/payment/admin/providers/:providerKey (Phase 20: Audited Provider Config Update)
   */
  async updateAdminProvider(req, res, next) {
    try {
      const { providerKey } = req.params;
      const { priority, enabled, environment } = req.body;
      const adminUser = req.user;

      const existing = paymentProviderRegistry.getProvider(providerKey);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: `Provider '${providerKey}' not found in registry`,
        });
      }

      // Security check: Never allow enabling sandbox/mock in production
      if (
        process.env.NODE_ENV === "production" &&
        (providerKey.startsWith("SANDBOX_") || environment === "sandbox") &&
        enabled === true
      ) {
        return res.status(400).json({
          success: false,
          message: "Security Policy: Mock or Sandbox rails cannot be enabled in production",
        });
      }

      const updated = paymentProviderRegistry.updateProvider(providerKey, {
        priority: priority !== undefined ? Number(priority) : undefined,
        enabled: enabled !== undefined ? Boolean(enabled) : undefined,
        environment: environment !== undefined ? String(environment) : undefined,
      });

      console.info(`[ADMIN_AUDIT] Provider ${providerKey} updated by ${adminUser?.email || adminUser?._id || "admin"}:`, {
        previous: { priority: existing.priority, enabled: existing.enabled, environment: existing.environment },
        updated: { priority: updated.priority, enabled: updated.enabled, environment: updated.environment },
        timestamp: new Date().toISOString(),
      });

      return res.status(200).json({
        success: true,
        message: `Provider '${providerKey}' configuration updated successfully`,
        provider: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  // --------------------------------------------------------------------------
  // PLATFORM 9.0 JUSPAY ORCHESTRATION & HYPERSDK SESSIONS
  // --------------------------------------------------------------------------

  async createJuspaySession(req, res, next) {
    try {
      const user = req.user;
      const { orderId, amount, currency = "INR", returnUrl } = req.body;

      if (!orderId || !amount) {
        return res.status(400).json({
          success: false,
          message: "orderId and amount are required to create a Juspay session",
        });
      }

      const sessionResult = await juspayOrchestratorService.createSession({
        orderId,
        amount,
        currency,
        customerId: (user._id || user).toString(),
        customerEmail: user.email,
        customerPhone: user.mobile ? String(user.mobile) : undefined,
        returnUrl,
      });

      return res.status(200).json({
        success: sessionResult.status !== "FAILED",
        session: sessionResult,
      });
    } catch (error) {
      next(error);
    }
  }

  async getJuspayOrderStatus(req, res, next) {
    try {
      const { orderId } = req.params;
      const statusResult = await juspayOrchestratorService.getOrderStatus(orderId);
      return res.status(200).json({
        success: true,
        orderStatus: statusResult,
      });
    } catch (error) {
      next(error);
    }
  }

  // --------------------------------------------------------------------------
  // PLATFORM 9.0 SETTLEMENT BATCH CONTROL TOWER
  // --------------------------------------------------------------------------

  async getAdminSettlementBatches(req, res, next) {
    try {
      const { status, sellerId, page = 1, limit = 20 } = req.query;
      const filter = {};
      if (status && status !== "ALL") filter.status = status;
      if (sellerId) filter.seller = sellerId;

      const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
      const [batches, total] = await Promise.all([
        SettlementBatch.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit, 10))
          .populate("seller", "sellerName email businessDetails")
          .populate("beneficiary")
          .lean(),
        SettlementBatch.countDocuments(filter),
      ]);

      return res.status(200).json({
        success: true,
        batches,
        total,
        page: parseInt(page, 10),
        totalPages: Math.ceil(total / parseInt(limit, 10)),
      });
    } catch (error) {
      next(error);
    }
  }

  async generateAdminSettlementBatch(req, res, next) {
    try {
      const { sellerId, options = {} } = req.body;
      const idempotencyKey = req.headers["idempotency-key"] || req.body.idempotencyKey;
      const endpoint = "/api/v1/payment/admin/settlement-batches/generate";
      const payloadToHash = { sellerId, options };

      if (!sellerId) {
        return res.status(400).json({ success: false, message: "sellerId is required" });
      }

      if (idempotencyKey) {
        const existing = await IdempotencyManager.getExistingResult(
          idempotencyKey,
          endpoint,
          payloadToHash
        );
        if (existing) {
          return res.status(existing.status || 200).json(existing.data || existing);
        }
      }

      const result = await settlementService.generateSettlementBatch(sellerId, options);
      const responseBody = {
        success: Boolean(result.batch),
        message: result.message,
        batch: result.batch,
      };

      if (idempotencyKey) {
        await IdempotencyManager.recordResult(
          idempotencyKey,
          endpoint,
          "POST",
          payloadToHash,
          200,
          responseBody,
          req.user?._id || req.user
        );
      }

      return res.status(200).json(responseBody);
    } catch (error) {
      if (error.code === "IDEMPOTENCY_KEY_REUSE" || error.statusCode === 409) {
        return res.status(409).json({
          success: false,
          error: true,
          code: "IDEMPOTENCY_KEY_REUSE",
          message: error.message || "Idempotency key reused with different request payload",
        });
      }
      next(error);
    }
  }

  async executeAdminBatchPayout(req, res, next) {
    try {
      const { batchId } = req.params;
      const result = await settlementService.executeBatchPayout(batchId);
      return res.status(200).json({
        success: true,
        message: result.message,
        batch: result.batch,
      });
    } catch (error) {
      next(error);
    }
  }

  async markAdminBatchSettled(req, res, next) {
    try {
      const { batchId } = req.params;
      const { utrNumber } = req.body;

      if (!utrNumber) {
        return res.status(400).json({
          success: false,
          message: "Authoritative bank utrNumber is required to mark settlement completed",
        });
      }

      const batch = await settlementService.markBatchSettled(batchId, utrNumber);
      return res.status(200).json({
        success: true,
        message: `SettlementBatch ${batchId} marked PAID with UTR ${utrNumber}`,
        batch,
      });
    } catch (error) {
      next(error);
    }
  }

  // --------------------------------------------------------------------------
  // PLATFORM 9.0 SELLER RISK HOLDS & BENEFICIARIES
  // --------------------------------------------------------------------------

  async getAdminSellerHolds(req, res, next) {
    try {
      const { sellerId } = req.params;
      const holds = await settlementService.getSellerRiskHolds(sellerId);
      return res.status(200).json({ success: true, holds });
    } catch (error) {
      next(error);
    }
  }

  async createAdminSellerHold(req, res, next) {
    try {
      const adminUser = req.user;
      const { sellerId, amount, reason, notes, expiresAt } = req.body;
      const idempotencyKey = req.headers["idempotency-key"] || req.body.idempotencyKey;
      const endpoint = "/api/v1/payment/admin/seller-holds";

      Money.validate(amount, "amount");

      const payloadToHash = { sellerId, amount: Number(amount), reason };

      if (idempotencyKey) {
        const existing = await IdempotencyManager.getExistingResult(
          idempotencyKey,
          endpoint,
          payloadToHash
        );
        if (existing) {
          return res.status(existing.status || 201).json(existing.data || existing);
        }
      }

      const hold = await settlementService.createSellerRiskHold({
        sellerId,
        amount,
        reason,
        notes,
        expiresAt,
        placedBy: adminUser?._id || adminUser,
      });

      const responseBody = {
        success: true,
        message: "Seller risk hold placed successfully",
        hold,
      };

      if (idempotencyKey) {
        await IdempotencyManager.recordResult(
          idempotencyKey,
          endpoint,
          "POST",
          payloadToHash,
          201,
          responseBody,
          adminUser?._id || adminUser
        );
      }

      return res.status(201).json(responseBody);
    } catch (error) {
      if (error.code === "IDEMPOTENCY_KEY_REUSE" || error.statusCode === 409) {
        return res.status(409).json({
          success: false,
          error: true,
          code: "IDEMPOTENCY_KEY_REUSE",
          message: error.message || "Idempotency key reused with different request payload",
        });
      }
      next(error);
    }
  }

  async releaseAdminSellerHold(req, res, next) {
    try {
      const adminUser = req.user;
      const { holdId } = req.params;
      const hold = await settlementService.releaseSellerRiskHold({
        holdId,
        releasedBy: adminUser?._id || adminUser,
      });

      return res.status(200).json({
        success: true,
        message: "Seller risk hold released successfully",
        hold,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAdminBeneficiaries(req, res, next) {
    try {
      const { sellerId } = req.params;
      const beneficiaries = await settlementService.getSellerBeneficiaries(sellerId);
      return res.status(200).json({ success: true, beneficiaries });
    } catch (error) {
      next(error);
    }
  }

  async verifyAdminBeneficiary(req, res, next) {
    try {
      const { beneficiaryId } = req.params;
      const { verificationRef, isSuccessful = true } = req.body;

      const beneficiary = await settlementService.verifySellerBeneficiary({
        beneficiaryId,
        verificationRef,
        isSuccessful,
      });

      return res.status(200).json({
        success: true,
        message: `Beneficiary ${beneficiaryId} status updated to ${beneficiary.status}`,
        beneficiary,
      });
    } catch (error) {
      next(error);
    }
  }

  // --------------------------------------------------------------------------
  // PLATFORM 9.0 THREE-WAY RECONCILIATION & DISPUTES
  // --------------------------------------------------------------------------

  async runThreeWayReconciliation(req, res, next) {
    try {
      const { settlementBatches = [], providerPayouts = [], bankTransactions = [] } = req.body;
      const record = await reconciliationService.runThreeWayReconciliation({
        settlementBatches,
        providerPayouts,
        bankTransactions,
      });

      return res.status(200).json({
        success: true,
        message: "Three-way bank reconciliation completed",
        record,
      });
    } catch (error) {
      next(error);
    }
  }

  async resolveReconciliationDiscrepancy(req, res, next) {
    try {
      const { reconciliationId } = req.params;
      const { referenceId, resolutionStatus, reason, evidence, checkerId } = req.body;
      const operatorId = req.user?._id || req.user || "ADMIN_OPERATOR";

      const result = await reconciliationService.resolveDiscrepancy({
        reconciliationId,
        referenceId,
        resolutionStatus,
        reason,
        operatorId,
        evidence,
        checkerId,
      });

      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async openChargebackDispute(req, res, next) {
    try {
      const { orderId, disputeReference, amount, reason } = req.body;
      if (amount !== undefined && amount !== null && amount !== "") {
        Money.validate(amount, "amount");
      }
      const idempotencyKey = req.headers["idempotency-key"] || req.body.idempotencyKey || `cb_${disputeReference}`;
      const endpoint = "/api/v1/payment/admin/disputes/chargeback";
      const payloadToHash = { orderId, disputeReference, amount: Number(amount || 0) };

      if (idempotencyKey) {
        const existing = await IdempotencyManager.getExistingResult(
          idempotencyKey,
          endpoint,
          payloadToHash
        );
        if (existing) {
          return res.status(existing.status || 201).json(existing.data || existing);
        }
      }

      const record = await refundService.openChargeback({
        orderId,
        disputeReference,
        amount,
        reason,
      });

      const responseBody = {
        success: true,
        message: "Chargeback dispute registered",
        dispute: record,
      };

      if (idempotencyKey) {
        await IdempotencyManager.recordResult(
          idempotencyKey,
          endpoint,
          "POST",
          payloadToHash,
          201,
          responseBody,
          req.user?._id || req.user
        );
      }

      return res.status(201).json(responseBody);
    } catch (error) {
      if (error.code === "IDEMPOTENCY_KEY_REUSE" || error.statusCode === 409) {
        return res.status(409).json({
          success: false,
          error: true,
          code: "IDEMPOTENCY_KEY_REUSE",
          message: error.message || "Idempotency key reused with different request payload",
        });
      }
      next(error);
    }
  }

  async resolveChargebackDispute(req, res, next) {
    try {
      const { disputeReference } = req.params;
      const { outcome = "WON", notes } = req.body;

      const record = await refundService.resolveChargeback({
        disputeReference,
        outcome,
        notes,
      });

      return res.status(200).json({
        success: true,
        message: `Chargeback resolved with outcome ${outcome}`,
        dispute: record,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const paymentPlatformController = new PaymentPlatformController();
export default paymentPlatformController;
