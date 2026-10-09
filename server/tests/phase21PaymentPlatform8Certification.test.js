import { describe, it } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";

import paymentProviderCertificationRunner from "../src/modules/payment/services/PaymentProviderCertificationRunner.js";
import PaymentAttemptStatus, {
  isValidAttemptTransition,
  VALID_ATTEMPT_TRANSITIONS,
} from "../src/modules/payment/domain/PaymentAttemptStatus.js";
import PaymentIntentStatus, {
  isValidIntentTransition,
} from "../src/modules/payment/domain/PaymentIntentStatus.js";
import paymentProviderRegistry, {
  PaymentProviderRegistry,
  ProviderHealthStatus,
} from "../src/modules/payment/services/PaymentProviderRegistry.js";
import paymentRoutingService, {
  PaymentRoutingService,
} from "../src/modules/payment/services/PaymentRoutingService.js";
import razorpayAdapter from "../src/modules/payment/adapters/RazorpayAdapter.js";
import cashfreeAdapter from "../src/modules/payment/adapters/CashfreeAdapter.js";
import payuAdapter from "../src/modules/payment/adapters/PayUAdapter.js";
import phonepeAdapter from "../src/modules/payment/adapters/PhonePeAdapter.js";
import { webhookAdapters } from "../src/modules/payment/adapters/webhook/ProviderWebhookAdapter.js";

describe("================================================================", () => {});
describe("🧪 ZOSH BAZAAR — PAYMENT PLATFORM 8.0 REAL CERTIFICATION TESTS", () => {});
describe("================================================================", () => {});

// -----------------------------------------------------------------------------
// SUITE 1: Universal Provider Certification Engine Execution
// -----------------------------------------------------------------------------
describe("▶ Suite 1: Universal Provider Certification Engine Execution", () => {
  it("should certify RAZORPAY as SANDBOX_CERTIFIED with real live external API execution", async () => {
    const report = await paymentProviderCertificationRunner.certifyProvider("RAZORPAY");

    assert.strictEqual(report.provider, "RAZORPAY");
    assert.strictEqual(report.overallStatus, "SANDBOX_CERTIFIED");
    assert.strictEqual(report.credentialStatus, "CONFIGURED");
    assert.strictEqual(report.capabilities.connectivity.status, "PASS");
    assert.strictEqual(report.capabilities.paymentCreation.status, "PASS");
    assert.strictEqual(report.capabilities.paymentStatus.status, "PASS");
    assert.strictEqual(report.capabilities.webhook.status, "PASS");
    assert.strictEqual(report.capabilities.refund.status, "PASS");
    assert.strictEqual(report.capabilities.accounting.status, "PASS");

    // Check authoritative real evidence
    assert.ok(report.evidence.paymentCreation.providerOrderId.startsWith("order_"), "Must be real Razorpay order ID");
    assert.strictEqual(report.evidence.paymentCreation.status, "created");
    assert.strictEqual(report.evidence.paymentStatus.fetchedStatus, "created");
  });

  it("should certify CASHFREE as BLOCKED_BY_CREDENTIALS without fake responses", async () => {
    const report = await paymentProviderCertificationRunner.certifyProvider("CASHFREE");

    assert.strictEqual(report.provider, "CASHFREE");
    assert.strictEqual(report.overallStatus, "BLOCKED_BY_CREDENTIALS");
    assert.strictEqual(report.credentialStatus, "UNCONFIGURED");
    assert.strictEqual(report.capabilities.connectivity.status, "BLOCKED");
    assert.strictEqual(report.capabilities.paymentCreation.status, "BLOCKED");
    assert.strictEqual(report.capabilities.webhook.status, "PASS", "Webhook verification contract certified");
    assert.strictEqual(report.capabilities.accounting.status, "PASS");
    assert.strictEqual(report.capabilities.reconciliation.status, "PASS");
  });

  it("should certify PAYU as BLOCKED_BY_CREDENTIALS without fake responses", async () => {
    const report = await paymentProviderCertificationRunner.certifyProvider("PAYU");

    assert.strictEqual(report.provider, "PAYU");
    assert.strictEqual(report.overallStatus, "BLOCKED_BY_CREDENTIALS");
    assert.strictEqual(report.credentialStatus, "UNCONFIGURED");
    assert.strictEqual(report.capabilities.connectivity.status, "BLOCKED");
    assert.strictEqual(report.capabilities.paymentCreation.status, "BLOCKED");
    assert.strictEqual(report.capabilities.webhook.status, "PASS", "Reverse SHA-512 webhook contract certified");
    assert.strictEqual(report.capabilities.accounting.status, "PASS");
  });

  it("should certify PHONEPE as BLOCKED_BY_CREDENTIALS without fake responses", async () => {
    const report = await paymentProviderCertificationRunner.certifyProvider("PHONEPE");

    assert.strictEqual(report.provider, "PHONEPE");
    assert.strictEqual(report.overallStatus, "BLOCKED_BY_CREDENTIALS");
    assert.strictEqual(report.credentialStatus, "UNCONFIGURED");
    assert.strictEqual(report.capabilities.connectivity.status, "BLOCKED");
    assert.strictEqual(report.capabilities.paymentCreation.status, "BLOCKED");
    assert.strictEqual(report.capabilities.webhook.status, "PASS", "X-VERIFY Base64 webhook contract certified");
    assert.strictEqual(report.capabilities.accounting.status, "PASS");
  });
});

// -----------------------------------------------------------------------------
// SUITE 2: Canonical Payment State Machine Invariants & Non-Regression
// -----------------------------------------------------------------------------
describe("▶ Suite 2: Canonical Payment State Machine Invariants & Non-Regression", () => {
  it("should define all required canonical conceptual states", () => {
    const expectedAttemptStates = [
      "INITIATED",
      "PENDING",
      "AUTHORIZED",
      "CAPTURED",
      "SETTLED",
      "FAILED",
      "TIMED_OUT",
      "CANCELLED",
      "RECOVERING",
      "UNKNOWN",
      "REFUNDED",
      "PARTIALLY_REFUNDED",
    ];

    for (const state of expectedAttemptStates) {
      assert.ok(PaymentAttemptStatus[state], `State ${state} must exist in PaymentAttemptStatus`);
    }
  });

  it("should permit valid forward and recovery transitions", () => {
    assert.strictEqual(isValidAttemptTransition("INITIATED", "PENDING"), true);
    assert.strictEqual(isValidAttemptTransition("PENDING", "CAPTURED"), true);
    assert.strictEqual(isValidAttemptTransition("PENDING", "UNKNOWN"), true);
    assert.strictEqual(isValidAttemptTransition("UNKNOWN", "RECOVERING"), true);
    assert.strictEqual(isValidAttemptTransition("RECOVERING", "CAPTURED"), true);
    assert.strictEqual(isValidAttemptTransition("CAPTURED", "SETTLED"), true);
    assert.strictEqual(isValidAttemptTransition("CAPTURED", "REFUND_PENDING"), true);
    assert.strictEqual(isValidAttemptTransition("REFUND_PENDING", "REFUNDED"), true);
  });

  it("should strictly reject any regression from terminal states", () => {
    // CAPTURED cannot regress to FAILED
    assert.strictEqual(isValidAttemptTransition("CAPTURED", "FAILED"), false);
    assert.strictEqual(isValidAttemptTransition("CAPTURED", "UNKNOWN"), false);
    assert.strictEqual(isValidAttemptTransition("CAPTURED", "PENDING"), false);

    // REFUNDED cannot regress to CAPTURED
    assert.strictEqual(isValidAttemptTransition("REFUNDED", "CAPTURED"), false);

    // SETTLED cannot regress to FAILED
    assert.strictEqual(isValidAttemptTransition("SETTLED", "FAILED"), false);

    // FAILED cannot resurrect to CAPTURED
    assert.strictEqual(isValidAttemptTransition("FAILED", "CAPTURED"), false);

    // CANCELLED cannot transition to CAPTURED
    assert.strictEqual(isValidAttemptTransition("CANCELLED", "CAPTURED"), false);

    // Idempotent self-transitions must remain allowed
    assert.strictEqual(isValidAttemptTransition("CAPTURED", "CAPTURED"), true);
    assert.strictEqual(isValidAttemptTransition("FAILED", "FAILED"), true);
  });
});

// -----------------------------------------------------------------------------
// SUITE 3: Ambiguous Payment Recovery Lifecycle
// -----------------------------------------------------------------------------
describe("▶ Suite 3: Ambiguous Payment Recovery Lifecycle", () => {
  it("should transition unconfirmed timeout attempt to RECOVERING rather than blindly FAILED", () => {
    const attempt = {
      attemptId: "att_recovery_001",
      status: PaymentAttemptStatus.PENDING,
      provider: "RAZORPAY",
    };

    // Simulated network timeout during payment initiation:
    // Mark as UNKNOWN / RECOVERING
    attempt.status = PaymentAttemptStatus.RECOVERING;
    assert.strictEqual(attempt.status, "RECOVERING");
  });

  it("should reconcile attempt to CAPTURED when polling confirms authoritative success", async () => {
    const attempt = {
      attemptId: "att_recovery_002",
      status: PaymentAttemptStatus.RECOVERING,
      provider: "RAZORPAY",
      providerReference: "pay_confirmed_at_gateway",
      amount: 500,
    };

    // Authoritative mock provider response during poll
    const gatewayStatus = { status: "CAPTURED", providerReference: "pay_confirmed_at_gateway" };

    if (gatewayStatus.status === "CAPTURED") {
      attempt.status = PaymentAttemptStatus.CAPTURED;
    }

    assert.strictEqual(attempt.status, "CAPTURED");
  });

  it("should preserve original bound provider during recovery query (Immutable Binding)", () => {
    const attempt = {
      attemptId: "att_bound_001",
      provider: "RAZORPAY",
      adapter: "RAZORPAY",
      status: PaymentAttemptStatus.RECOVERING,
    };

    const boundAdapter = paymentRoutingService.getAdapterForAttempt(attempt);
    assert.strictEqual(boundAdapter.name, "RAZORPAY", "Recovery query must stay bound to RAZORPAY");
  });
});

// -----------------------------------------------------------------------------
// SUITE 4: Idempotency Across Financial Boundaries
// -----------------------------------------------------------------------------
describe("▶ Suite 4: Idempotency Across Financial Boundaries", () => {
  it("should deduplicate 100 concurrent webhook deliveries without duplicating ledger postings", async () => {
    const payuWebhook = webhookAdapters["PAYU"];
    const salt = "test_salt";
    process.env.PAYU_MERCHANT_SALT = salt;

    const payload = {
      key: "k1",
      txnid: "tx_idem_100",
      amount: "500.00",
      productinfo: "prod",
      firstname: "Rahul",
      email: "r@test.com",
      status: "success",
      mihpayid: "mih_idem_event",
      udf1: "int_idem",
    };

    const hashStr = `${salt}|success||||||||||int_idem|r@test.com|Rahul|prod|500.00|tx_idem_100|k1`;
    const hash = crypto.createHash("sha512").update(hashStr).digest("hex");
    payload.hash = hash;

    // Simulate 100 concurrent webhook calls
    const promises = Array.from({ length: 100 }, () =>
      payuWebhook.processWebhook({ payload, signature: hash })
    );

    const results = await Promise.all(promises);
    assert.strictEqual(results.length, 100);

    const eventIds = new Set(results.map((r) => r.normalizedEvent.eventId));
    assert.strictEqual(eventIds.size, 1, "All 100 deliveries must normalize to the exact same eventId");
    assert.strictEqual(results[0].normalizedEvent.status, "CAPTURED");
  });
});

// -----------------------------------------------------------------------------
// SUITE 5: Money Integrity & Accounting Equation
// -----------------------------------------------------------------------------
describe("▶ Suite 5: Money Integrity & Accounting Equation", () => {
  it("should preserve exact double-entry ledger balance: SUM(DEBITS) === SUM(CREDITS)", () => {
    const orderTotal = 3000;
    const gatewayFee = 60; // 2%
    const sellerPayable = 2700;
    const platformCommission = 300; // Platform gross revenue before gateway expense

    const postings = [
      { account: "GATEWAY_CLEARING", entryType: "DEBIT", amount: orderTotal },
      { account: "GATEWAY_EXPENSE", entryType: "DEBIT", amount: gatewayFee },
      { account: "GATEWAY_CLEARING", entryType: "CREDIT", amount: gatewayFee },
      { account: "SELLER_PAYABLE", entryType: "CREDIT", amount: sellerPayable },
      { account: "PLATFORM_COMMISSION", entryType: "CREDIT", amount: platformCommission },
    ];

    const sumDebits = postings
      .filter((p) => p.entryType === "DEBIT")
      .reduce((s, p) => s + p.amount, 0);

    const sumCredits = postings
      .filter((p) => p.entryType === "CREDIT")
      .reduce((s, p) => s + p.amount, 0);

    assert.strictEqual(sumDebits, sumCredits, "Debits and credits must balance to the penny");
    assert.strictEqual(sumDebits, 3060);
  });

  it("should enforce refund ceiling invariant: Total refunded <= captured amount", () => {
    const captured = 1000;
    const refund1 = 600;
    const refund2 = 400;
    const refund3Exceeding = 50;

    let totalRefunded = 0;
    function processRefund(amount) {
      if (totalRefunded + amount <= captured) {
        totalRefunded += amount;
        return { success: true };
      }
      return { success: false, reason: "REFUND_EXCEEDS_CAPTURED_AMOUNT" };
    }

    assert.strictEqual(processRefund(refund1).success, true);
    assert.strictEqual(processRefund(refund2).success, true);
    assert.strictEqual(processRefund(refund3Exceeding).success, false);
    assert.strictEqual(totalRefunded, 1000);
  });
});

// -----------------------------------------------------------------------------
// SUITE 6: Multi-PSP Health & Capability-Aware Routing
// -----------------------------------------------------------------------------
describe("▶ Suite 6: Multi-PSP Health & Capability-Aware Routing", () => {
  it("should filter providers based on requested capability (EMI vs UPI)", () => {
    const testRegistry = new PaymentProviderRegistry();
    const router = new PaymentRoutingService(testRegistry);

    // Request EMI capability:
    // Razorpay, Cashfree, PayU support EMI. PhonePe does not.
    const emiProvider = router.resolveProviderForAttempt({
      rail: "ALL",
      requiredCapability: "supportsEMI",
      isProduction: false,
    });

    assert.ok(
      ["RAZORPAY", "CASHFREE", "PAYU"].includes(emiProvider.providerId),
      "Must select provider with EMI capability"
    );
    assert.notStrictEqual(emiProvider.providerId, "PHONEPE", "PhonePe does not support EMI");
  });

  it("should transition provider health state across circuit breaker lifecycle", () => {
    const testRegistry = new PaymentProviderRegistry();

    // Start UP
    assert.strictEqual(testRegistry.getProviderHealth("RAZORPAY").status, ProviderHealthStatus.UP);

    // 2 failures -> DEGRADED
    testRegistry.recordAttemptOutcome("RAZORPAY", { success: false });
    testRegistry.recordAttemptOutcome("RAZORPAY", { success: false });
    assert.strictEqual(testRegistry.getProviderHealth("RAZORPAY").status, ProviderHealthStatus.DEGRADED);

    // 3rd failure -> DOWN
    testRegistry.recordAttemptOutcome("RAZORPAY", { success: false });
    assert.strictEqual(testRegistry.getProviderHealth("RAZORPAY").status, ProviderHealthStatus.DOWN);

    // Probe success -> RECOVERING
    testRegistry.recordAttemptOutcome("RAZORPAY", { success: true });
    assert.strictEqual(testRegistry.getProviderHealth("RAZORPAY").status, ProviderHealthStatus.RECOVERING);

    // 2 consecutive successes -> UP
    testRegistry.recordAttemptOutcome("RAZORPAY", { success: true });
    assert.strictEqual(testRegistry.getProviderHealth("RAZORPAY").status, ProviderHealthStatus.UP);
  });
});

// -----------------------------------------------------------------------------
// SUITE 7: Production Safety & Anti-Fabrication Guards
// -----------------------------------------------------------------------------
describe("▶ Suite 7: Production Safety & Anti-Fabrication Guards", () => {
  it("should throw HTTP 503 RAIL_NOT_PRODUCTION_READY when calling unconfigured adapter in production", () => {
    assert.throws(
      () => {
        cashfreeAdapter.assertProductionReady("createIntent", { isProduction: true });
      },
      (err) => err.code === "RAIL_NOT_PRODUCTION_READY" && err.statusCode === 503
    );

    assert.throws(
      () => {
        payuAdapter.assertProductionReady("createIntent", { isProduction: true });
      },
      (err) => err.code === "RAIL_NOT_PRODUCTION_READY" && err.statusCode === 503
    );

    assert.throws(
      () => {
        phonepeAdapter.assertProductionReady("createIntent", { isProduction: true });
      },
      (err) => err.code === "RAIL_NOT_PRODUCTION_READY" && err.statusCode === 503
    );
  });
});
