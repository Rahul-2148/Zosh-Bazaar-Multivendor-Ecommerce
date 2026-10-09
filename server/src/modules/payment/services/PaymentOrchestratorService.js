import { distributedLock } from "../utils/distributedLock.js";
import paymentIntentService from "./PaymentIntentService.js";
import paymentAttemptService from "./PaymentAttemptService.js";
import paymentPricingService from "./PaymentPricingService.js";
import paymentRiskService from "./PaymentRiskService.js";
import walletService from "./WalletService.js";
import ledgerService from "./LedgerService.js";
import LedgerAccount, { EntryType } from "../domain/LedgerAccount.js";
import PaymentIntentStatus from "../domain/PaymentIntentStatus.js";
import PaymentAttemptStatus from "../domain/PaymentAttemptStatus.js";
import { PaymentAttempt } from "../models/paymentAttempt.model.js";
import OrderStatus from "../../../domain/OrderStatus.js";
import PaymentStatus from "../../../domain/PaymentStatus.js";
import { Order } from "../../../models/order.model.js";
import { Cart } from "../../../models/cart.model.js";
import { CartItem } from "../../../models/cartItem.model.js";
import SellerService from "../../seller/services/seller.service.js";
import SellerReportService from "../../seller/services/sellerReport.service.js";
import TransactionService from "../../customer/services/transaction.service.js";
import { publishOrderStatusUpdated } from "../../../realtime/publishers.js";
import { emailEvents } from "../../email/index.js";
import paymentOutboxService from "./PaymentOutboxService.js";
import paymentRoutingService from "./PaymentRoutingService.js";

// Import rail adapters for backward compatibility
import sandboxAdapter from "../adapters/SandboxAdapter.js";
import razorpayAdapter from "../adapters/RazorpayAdapter.js";
import upiRailAdapter from "../adapters/UpiRailAdapter.js";
import cardRailAdapter from "../adapters/CardRailAdapter.js";
import netBankingRailAdapter from "../adapters/NetBankingRailAdapter.js";
import codRailAdapter from "../adapters/CodRailAdapter.js";
import cashfreeAdapter from "../adapters/CashfreeAdapter.js";
import payuAdapter from "../adapters/PayUAdapter.js";
import phonepeAdapter from "../adapters/PhonePeAdapter.js";

/**
 * Master Payment Orchestrator Service
 * Decouples e-commerce checkout from individual payment gateways.
 * Coordinates pricing, eligibility, risk evaluation, attempts, double-entry ledger, and order reconciliations.
 */
class PaymentOrchestratorService {
  constructor() {
    this.adapters = {
      SANDBOX: sandboxAdapter,
      RAZORPAY: razorpayAdapter,
      CASHFREE: cashfreeAdapter,
      PAYU: payuAdapter,
      PHONEPE: phonepeAdapter,
      UPI: upiRailAdapter,
      CARD: cardRailAdapter,
      NETBANKING: netBankingRailAdapter,
      COD: codRailAdapter,
      WALLET: sandboxAdapter, // Internal wallet debit executed via WalletService
    };
  }

  /**
   * Resolve appropriate rail adapter via paymentRoutingService or direct adapter lookup.
   * Enforces fail-closed protection for mock simulation rails in production.
   */
  resolveAdapter(rail, options = {}) {
    const key = (rail || "SANDBOX").toUpperCase();
    if (this.adapters[key]) {
      const adapter = this.adapters[key];
      const isProd =
        process.env.NODE_ENV === "production" ||
        process.env.PAYMENT_ENV === "production" ||
        options.isProduction;
      if (isProd && !adapter.isProductionReady()) {
        const err = new Error(
          `Payment rail adapter "${adapter.name}" is not certified for production`
        );
        err.code = "RAIL_NOT_PRODUCTION_READY";
        err.statusCode = 503;
        throw err;
      }
      return adapter;
    }
    return paymentRoutingService.resolveAdapter(rail, options);
  }

  /**
   * Initialize a PaymentIntent for checkout.
   */
  async initializeCheckout({
    user,
    cart,
    orders,
    paymentMethod = "UPI",
    offerCode = null,
    bankCode = null,
    cardNetwork = null,
    splitWithWallet = false,
    idempotencyKey = null,
    ipAddress = "127.0.0.1",
  }) {
    const userId = user._id || user;

    // 1. Authoritative Pricing Calculation
    const pricingSnapshot = await paymentPricingService.computePricing({
      cartItems: cart.cartItems || [],
      couponCode: cart.couponCode || null,
      offerCode,
      rail: paymentMethod,
      bankCode,
      cardNetwork,
    });

    const payableAmount = pricingSnapshot.finalPayable;

    // 2. Risk & Velocity Evaluation
    const riskResult = await paymentRiskService.evaluateRisk({
      userId,
      amount: payableAmount,
      ipAddress,
      rail: paymentMethod,
    });

    if (riskResult.riskState === "REJECTED") {
      throw new Error("Checkout rejected by automated transaction risk policies. Please contact support.");
    }

    // 3. Wallet Split Calculation & Reservation
    let walletAmount = 0;
    let railAmount = payableAmount;

    if (splitWithWallet || paymentMethod === "WALLET") {
      const wallet = await walletService.getOrCreateWallet(userId);
      const availableBalance = Number(wallet.availableBalance) || 0;

      if (paymentMethod === "WALLET") {
        if (availableBalance < payableAmount) {
          throw new Error(
            `Insufficient wallet balance (₹${availableBalance}) for full order payable (₹${payableAmount})`
          );
        }
        walletAmount = payableAmount;
        railAmount = 0;
      } else if (splitWithWallet && availableBalance > 0) {
        walletAmount = Math.min(availableBalance, payableAmount);
        railAmount = Math.max(0, payableAmount - walletAmount);
      }
    }

    const splitConfig = { walletAmount, railAmount };

    // 4. Create PaymentIntent
    const orderIds = (orders || []).map((o) => o._id || o);
    const { intent } = await paymentIntentService.createIntent({
      userId,
      orderIds,
      amount: payableAmount,
      currency: "INR",
      pricingSnapshot,
      selectedMethod: {
        rail: paymentMethod,
        bankCode,
      },
      splitConfig,
      idempotencyKey,
      riskScore: riskResult.riskScore,
      riskState: riskResult.riskState,
      riskReason: riskResult.reasons?.join("; ") || "",
      metadata: {
        splitWithWallet,
        ipAddress,
      },
    });

    // 5. Reserve wallet funds if applicable
    if (walletAmount > 0) {
      await walletService.reserveFunds(userId, walletAmount, intent.intentId);
    }

    return {
      intent,
      pricingSnapshot,
      splitConfig,
    };
  }

  /**
   * Submit a payment attempt for a PaymentIntent.
   */
  async submitPaymentAttempt({
    intentId,
    method,
    payload = {},
    metadata = {},
    idempotencyKey = null,
  }) {
    const intent = await paymentIntentService.getIntentById(intentId);

    if (intent.status === PaymentIntentStatus.SUCCEEDED) {
      return {
        alreadyCaptured: true,
        intent,
      };
    }

    const { acquired, lockToken } = await distributedLock.acquire(`intent:${intent.intentId}`, 15);
    if (!acquired) {
      throw new Error("Payment is already in progress for this order. Please wait a moment.");
    }

    try {
      const railToExecute = method || intent.selectedMethod?.rail || "UPI";
      const providerRecord = paymentRoutingService.resolveProviderForAttempt({
        rail: railToExecute,
        preferredProvider: metadata?.preferredProvider || null,
      });
      const adapter = providerRecord.adapter;

      // Amount to charge on the external rail (excluding reserved wallet amount)
      const railAmount = intent.splitConfig?.railAmount ?? intent.amount;

      // If split payment with wallet, ensure wallet funds are actively reserved for this intent attempt
      if ((intent.splitConfig?.walletAmount || 0) > 0) {
        const userId = intent.user?._id || intent.user;
        await walletService.reserveFunds(
          userId,
          intent.splitConfig.walletAmount,
          intent.intentId
        );
      }

      // Special case: 100% Wallet Payment
      if (railAmount === 0 && (intent.splitConfig?.walletAmount || 0) > 0) {
        const attempt = await paymentAttemptService.createAttempt({
          intent,
          method: "WALLET",
          rail: "WALLET",
          provider: "WALLET",
          adapter: "WALLET",
          environment: "production",
          amount: intent.splitConfig.walletAmount,
          currency: intent.currency,
          metadata,
        });

        return await this.handleAttemptCapture({
          attemptId: attempt.attemptId,
          providerReference: `wal_pay_${Date.now()}`,
          source: "WALLET_INSTANT",
        });
      }

      // Guard against failover double-charging: verify any in-flight attempts on other providers
      const priorAttempts = await PaymentAttempt.find({
        intentId: intent.intentId,
        status: {
          $in: [
            PaymentAttemptStatus.INITIATED,
            PaymentAttemptStatus.PENDING,
            PaymentAttemptStatus.PROCESSING,
            PaymentAttemptStatus.REQUIRES_ACTION,
          ],
        },
      });

      for (const prior of priorAttempts) {
        if (prior.provider && prior.provider !== providerRecord.providerId) {
          const recovered = await this.checkAndRecoverAttemptStatus(prior);
          if (
            recovered.status === PaymentAttemptStatus.CAPTURED ||
            prior.status === PaymentAttemptStatus.CAPTURED
          ) {
            return {
              alreadyCaptured: true,
              intent: await paymentIntentService.getIntentById(intentId),
              attempt: prior,
            };
          }
          if (
            prior.status !== PaymentAttemptStatus.FAILED &&
            prior.status !== PaymentAttemptStatus.TIMED_OUT &&
            prior.status !== PaymentAttemptStatus.VOIDED
          ) {
            const err = new Error(
              `Cannot failover to provider "${providerRecord.providerId}" while attempt "${prior.attemptId}" on "${prior.provider}" is active and unverified. Authoritative cancellation or status confirmation required.`
            );
            err.code = "FAILOVER_BLOCKED_UNCONFIRMED_ATTEMPT";
            err.statusCode = 409;
            throw err;
          }
        }
      }

      // Create Attempt with immutable provider binding
      const attempt = await paymentAttemptService.createAttempt({
        intent,
        method: railToExecute,
        rail: railToExecute,
        provider: providerRecord.providerId,
        adapter: adapter.name,
        environment: providerRecord.environment,
        amount: railAmount,
        currency: intent.currency,
        metadata: {
          ...metadata,
          ...payload,
        },
      });

      await paymentIntentService.transitionStatus(
        intent,
        PaymentIntentStatus.PROCESSING,
        `Attempt #${attempt.attemptNumber} initiated via ${adapter.name}`,
        "ORCHESTRATOR"
      );

      // Call down to rail adapter contract
      const adapterResult = await adapter.createIntent({
        intent,
        attempt,
        user: intent.user,
        metadata: {
          ...metadata,
          ...payload,
          simMode: payload.simMode,
        },
      });

      // Update attempt with adapter response
      attempt.actionPayload = adapterResult.actionPayload || null;
      if (adapterResult.providerReference) {
        attempt.providerReference = adapterResult.providerReference;
      }
      await attempt.save();

      // If adapter resolved to immediate success (e.g. Sandbox instant or synchronous rail)
      if (adapterResult.status === PaymentAttemptStatus.CAPTURED) {
        return await this.handleAttemptCapture({
          attemptId: attempt.attemptId,
          providerReference: adapterResult.providerReference,
          actionPayload: adapterResult.actionPayload,
          source: adapter.name,
        });
      }

      // If adapter failed immediately
      if (
        adapterResult.status === PaymentAttemptStatus.FAILED ||
        adapterResult.status === PaymentAttemptStatus.TIMED_OUT
      ) {
        return await this.handleAttemptFailure({
          attemptId: attempt.attemptId,
          failureCode: adapterResult.failureCode || "INITIATION_FAILED",
          failureReason: adapterResult.failureReason || "Rail declined attempt initiation",
          source: adapter.name,
        });
      }

      return {
        intent,
        attempt,
        actionPayload: adapterResult.actionPayload,
      };
    } finally {
      await distributedLock.release(`intent:${intent.intentId}`, lockToken);
    }
  }

  /**
   * Authoritative capture execution when payment succeeds.
   * Commits wallet debits, updates orders, creates double-entry postings, and clears cart.
   */
  async handleAttemptCapture({
    attemptId,
    providerReference,
    actionPayload = {},
    source = "GATEWAY",
  }) {
    const attempt = await paymentAttemptService.getAttemptById(attemptId);
    const intent = await paymentIntentService.getIntentById(attempt.intentId);

    // Transition attempt to CAPTURED
    await paymentAttemptService.transitionStatus(attempt, PaymentAttemptStatus.CAPTURED, {
      providerReference: providerReference || attempt.providerReference,
      reason: `Payment captured via ${source}`,
      source,
    });

    // Transition intent to SUCCEEDED
    await paymentIntentService.transitionStatus(
      intent,
      PaymentIntentStatus.SUCCEEDED,
      `Funds captured successfully (Ref: ${providerReference})`,
      source
    );

    const userId = intent.user?._id || intent.user;

    // 1. Commit reserved wallet funds if split payment was used
    if (intent.splitConfig?.walletAmount > 0) {
      try {
        await walletService.commitDebit(
          userId,
          intent.splitConfig.walletAmount,
          intent.intentId,
          `wal_commit_${intent.intentId}`
        );
      } catch (wErr) {
        console.error("[PaymentOrchestrator] Error committing wallet debit:", wErr.message);
      }
    }

    // 2. Post double-entry journal for external rail amount
    if (attempt.amount > 0) {
      try {
        await ledgerService.postJournal({
          referenceType: "PAYMENT_ATTEMPT",
          referenceId: attempt.attemptId,
          idempotencyKey: `led_cap_${attempt.attemptId}`,
          description: `Captured funds for Intent ${intent.intentId} via ${attempt.adapter} (Ref: ${attempt.providerReference})`,
          postings: [
            {
              account: LedgerAccount.GATEWAY_CLEARING,
              entryType: EntryType.DEBIT,
              amount: attempt.amount,
              partyType: "GATEWAY",
              partyId: attempt.providerReference || attempt.adapter,
            },
            {
              account: LedgerAccount.SELLER_PAYABLE,
              entryType: EntryType.CREDIT,
              amount: attempt.amount,
              partyType: "PLATFORM",
              partyId: "ESCROW_ACCRUAL",
            },
          ],
        });
      } catch (lErr) {
        console.warn("[PaymentOrchestrator] Ledger posting warning:", lErr.message);
      }
    }

    // 3. Reconcile linked Orders
    const orderIds = intent.orders || [];
    for (const orderId of orderIds) {
      const order = await Order.findById(orderId);
      if (order && order.paymentStatus !== PaymentStatus.CAPTURED) {
        order.paymentStatus = PaymentStatus.CAPTURED;
        order.orderStatus = OrderStatus.CONFIRMED;
        order.statusHistory.push({
          status: OrderStatus.CONFIRMED,
          timestamp: new Date(),
          note: `Payment captured via ${attempt.adapter} (Ref: ${attempt.providerReference})`,
          updatedBy: "SYSTEM",
        });
        await order.save();

        // Create transaction log
        try {
          await TransactionService.createTransaction(order);
        } catch (tErr) {
          console.warn("[PaymentOrchestrator] Transaction warning:", tErr.message);
        }

        // Update seller performance report
        if (order.seller) {
          try {
            const seller = await SellerService.getSellerById(order.seller);
            if (seller) {
              const sellerReport = await SellerReportService.getSellerReport(seller);
              if (sellerReport) {
                sellerReport.totalOrders = (sellerReport.totalOrders || 0) + 1;
                sellerReport.totalEarnings =
                  (sellerReport.totalEarnings || 0) + (order.totalSellingPrice || 0);
                sellerReport.totalSales =
                  (sellerReport.totalSales || 0) + (order.orderItems?.length || 0);
                await SellerReportService.updateSellerReport(sellerReport);
              }
            }
          } catch (srErr) {
            console.warn("[PaymentOrchestrator] Seller report warning:", srErr.message);
          }
        }

        // Realtime notification
        publishOrderStatusUpdated(order);

        // Enqueue durable PaymentCaptured event into transactional Outbox
        await paymentOutboxService
          .enqueueEvent({
            eventType: "PaymentCaptured",
            aggregateType: "PaymentAttempt",
            aggregateId: attempt.attemptId,
            payload: {
              intentId: intent.intentId,
              attemptId: attempt.attemptId,
              order,
              amount: attempt.amount,
            },
            idempotencyKey: `outbox_captured_${attempt.attemptId}`,
          })
          .catch((oErr) => console.warn("[PaymentOrchestrator] Outbox enqueue warning:", oErr.message));
      }
    }

    // 4. Clean customer cart
    if (userId) {
      try {
        const userCart = await Cart.findOne({ user: userId });
        if (userCart) {
          await CartItem.deleteMany({ cart: userCart._id });
          userCart.cartItems = [];
          userCart.totalMrpPrice = 0;
          userCart.totalSellingPrice = 0;
          userCart.totalItem = 0;
          userCart.discount = 0;
          userCart.couponCode = null;
          userCart.couponPrice = 0;
          await userCart.save();
        }
      } catch (cErr) {
        console.warn("[PaymentOrchestrator] Cart cleanup warning:", cErr.message);
      }
    }

    return {
      status: "SUCCESS",
      intent,
      attempt,
      actionPayload,
    };
  }

  /**
   * Handle payment failure or timeout.
   * Releases wallet reservations and unlocks intent for retry.
   */
  async handleAttemptFailure({ attemptId, failureCode, failureReason, source = "GATEWAY" }) {
    const attempt = await paymentAttemptService.getAttemptById(attemptId);
    const intent = await paymentIntentService.getIntentById(attempt.intentId);

    await paymentAttemptService.transitionStatus(attempt, PaymentAttemptStatus.FAILED, {
      failureCode,
      failureReason,
      reason: failureReason || "Payment failed at gateway",
      source,
    });

    // Unlock intent so user can select another method
    await paymentIntentService.transitionStatus(
      intent,
      PaymentIntentStatus.REQUIRES_PAYMENT_METHOD,
      `Attempt #${attempt.attemptNumber} failed: ${failureReason}. Ready for retry.`,
      source
    );

    // Release any reserved wallet funds back to available balance
    if (intent.splitConfig?.walletAmount > 0) {
      const userId = intent.user?._id || intent.user;
      try {
        await walletService.releaseReservation(
          userId,
          intent.splitConfig.walletAmount,
          intent.intentId
        );
      } catch (wErr) {
        console.error("[PaymentOrchestrator] Error releasing wallet reservation:", wErr.message);
      }
    }

    // Enqueue durable PaymentFailed event into outbox
    await paymentOutboxService
      .enqueueEvent({
        eventType: "PaymentFailed",
        aggregateType: "PaymentAttempt",
        aggregateId: attempt.attemptId,
        payload: {
          intentId: intent.intentId,
          attemptId: attempt.attemptId,
          failureCode,
          failureReason,
        },
        idempotencyKey: `outbox_failed_${attempt.attemptId}`,
      })
      .catch(() => {});

    return {
      status: "FAILED",
      intent,
      attempt,
      failureCode,
      failureReason,
    };
  }

  /**
   * Check and recover in-flight attempt status from rail adapter.
   * Resolves PENDING/TIMEOUT states authoritatively.
   */
  async checkAndRecoverAttemptStatus(attemptOrId) {
    let attempt;
    const attemptId = typeof attemptOrId === "object" ? attemptOrId.attemptId : attemptOrId;
    if (typeof attemptOrId === "object" && attemptOrId.provider) {
      attempt = attemptOrId;
    } else {
      attempt = await paymentAttemptService.getAttemptById(attemptId);
    }
    if (!attempt) {
      const error = new Error(`Payment attempt "${attemptId}" not found`);
      error.statusCode = 404;
      throw error;
    }

    // Terminal states: Return authoritative status immediately
    if (
      attempt.status === PaymentAttemptStatus.CAPTURED ||
      attempt.status === PaymentAttemptStatus.SETTLED
    ) {
      return { status: "CAPTURED", attempt };
    }
    if (attempt.status === PaymentAttemptStatus.FAILED) {
      return { status: "FAILED", attempt };
    }

    const adapter = paymentRoutingService.getAdapterForAttempt(attempt);
    try {
      const railStatus = await adapter.getStatus({ attempt });
      if (railStatus.status === "CAPTURED" || railStatus.status === "AUTHORIZED") {
        if (!attempt._id || typeof attempt.save !== "function") {
          return { status: "CAPTURED", attempt, source: "RECOVERY_POLL" };
        }
        return await this.handleAttemptCapture({
          attemptId: attempt.attemptId,
          providerReference: railStatus.providerReference || attempt.providerReference,
          source: "RECOVERY_POLL",
        });
      } else if (railStatus.status === "FAILED") {
        if (!attempt._id || typeof attempt.save !== "function") {
          return { status: "FAILED", attempt, source: "RECOVERY_POLL" };
        }
        return await this.handleAttemptFailure({
          attemptId: attempt.attemptId,
          failureCode: railStatus.failureCode || "POLL_FAILED",
          failureReason: railStatus.failureReason || "Payment failed at rail provider",
          source: "RECOVERY_POLL",
        });
      }
      return { status: attempt.status, attempt };
    } catch (err) {
      console.warn(`[PaymentOrchestrator] Error checking status for attempt ${attemptId}:`, err.message);
      return { status: attempt.status, attempt, error: err.message };
    }
  }
}

export const paymentOrchestratorService = new PaymentOrchestratorService();
export default paymentOrchestratorService;
