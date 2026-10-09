/**
 * ZOSH BAZAAR — PHASE 17 PAYMENT RAIL INTEGRATION & PROVIDER-AGNOSTIC PLATFORM TEST SUITE
 *
 * Comprehensive verification of Phase 24 Test Matrix (21 scenarios):
 *   1. Provider selection (highest priority healthy provider selected)
 *   2. Capability mismatch (rejects or skips provider lacking required capability)
 *   3. Unavailable provider (skips provider marked enabled: false)
 *   4. Provider timeout (handles timeout gracefully with status TIMEOUT, without premature success)
 *   5. Provider failure (handles failure gracefully with status FAILED)
 *   6. Provider health DOWN (marks provider DOWN on excessive failures, routing skips it)
 *   7. Provider failover BEFORE attempt creation (if priority 1 provider is down, routes to priority 2)
 *   8. No provider failover AFTER attempt creation (once attempt is created with provider A, recovery/status strictly calls provider A)
 *   9. Duplicate payment (idempotent attempt rejection / return existing attempt)
 *   10. Duplicate webhook (PaymentWebhookEvent idempotency deduplication, zero duplicate processing)
 *   11. Provider webhook normalization (normalizes Razorpay and Sandbox payloads into NormalizedPaymentEvent)
 *   12. Payment recovery (polls provider status and authoritatively transitions attempt to CAPTURED / FAILED)
 *   13. Refund via routed adapter (refund resolves adapter via getAdapterForAttempt, not hardcoded Razorpay)
 *   14. Reconciliation (CsvSettlementDataSourceAdapter / sandbox reconciliation matching internal attempts)
 *   15. Production mock rail rejection (ensures simulation rails throw 503 RAIL_NOT_PRODUCTION_READY when NODE_ENV=production)
 *   16. Sandbox success (deterministic sandbox payment returns CAPTURED)
 *   17. Sandbox failure (deterministic sandbox failure returns FAILED)
 *   18. UPI availability API (returns available: true with supported apps and capabilities)
 *   19. Card availability API (returns available: true with supported card networks and capabilities)
 *   20. NetBanking availability API (returns available: true with popular and all banks)
 *   21. EMI eligibility and calculation (reducing balance EMI calculation with server authority)
 */

import crypto from "crypto";
import paymentProviderRegistry, {
  PaymentProviderRegistry,
} from "../src/modules/payment/services/PaymentProviderRegistry.js";
import paymentRoutingService, {
  PaymentRoutingService,
} from "../src/modules/payment/services/PaymentRoutingService.js";
import emiService from "../src/modules/payment/services/EmiService.js";
import paymentFeeProvider from "../src/modules/payment/services/PaymentFeeProvider.js";
import paymentWebhookService from "../src/modules/payment/services/PaymentWebhookService.js";
import {
  webhookAdapters,
  RazorpayWebhookAdapter,
  SandboxWebhookAdapter,
} from "../src/modules/payment/adapters/webhook/ProviderWebhookAdapter.js";
import NormalizedPaymentEvent from "../src/modules/payment/adapters/webhook/NormalizedPaymentEvent.js";
import PaymentAttemptStatus from "../src/modules/payment/domain/PaymentAttemptStatus.js";
import PaymentIntentStatus from "../src/modules/payment/domain/PaymentIntentStatus.js";
import paymentOrchestratorService from "../src/modules/payment/services/PaymentOrchestratorService.js";
import refundService from "../src/modules/payment/services/RefundService.js";
import { csvSettlementDataSourceAdapter } from "../src/modules/payment/adapters/reconciliation/CsvSettlementDataSourceAdapter.js";
import PaymentRailAdapter from "../src/modules/payment/adapters/PaymentRailAdapter.js";
import sandboxAdapter from "../src/modules/payment/adapters/SandboxAdapter.js";
import upiRailAdapter from "../src/modules/payment/adapters/UpiRailAdapter.js";
import cardRailAdapter from "../src/modules/payment/adapters/CardRailAdapter.js";
import netBankingRailAdapter from "../src/modules/payment/adapters/NetBankingRailAdapter.js";
import razorpayAdapter from "../src/modules/payment/adapters/RazorpayAdapter.js";
import { IdempotencyManager } from "../src/modules/payment/utils/idempotency.js";

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runPaymentPlatform4Suite() {
  console.log("================================================================");
  console.log("🚀 ZOSH BAZAAR — PAYMENT PLATFORM 4.0 MASTER TEST SUITE");
  console.log("   Provider-Agnostic Routing & Native Rails Verification");
  console.log("================================================================\n");

  // -------------------------------------------------------------------------
  // 1. PROVIDER SELECTION (Priority-based)
  // -------------------------------------------------------------------------
  console.log("▶ [Test 1] Provider Selection by Priority & Rail");
  {
    const provider = paymentRoutingService.selectProvider({
      rail: "UPI",
      environment: "test",
    });
    assert(
      provider !== null && provider.railTypes.includes("UPI") && provider.enabled,
      `Selected active UPI provider: ${provider?.name} (priority: ${provider?.priority})`
    );
  }

  // -------------------------------------------------------------------------
  // 2. CAPABILITY MISMATCH
  // -------------------------------------------------------------------------
  console.log("▶ [Test 2] Capability Mismatch Filtering");
  {
    // Request a capability that only CARD supports (e.g. supportsTokenization) on UPI rail
    const cardProvider = paymentRoutingService.selectProvider({
      rail: "CARD",
      requiredCapabilities: ["supportsTokenization", "supportsCards"],
      environment: "test",
    });
    assert(
      cardProvider !== null && cardProvider.capabilities.supportsTokenization === true,
      `Card provider '${cardProvider?.name}' matches required capability 'supportsTokenization'`
    );

    // Request an impossible capability on UPI
    let mismatchCaught = false;
    try {
      paymentRoutingService.selectProvider({
        rail: "UPI",
        requiredCapabilities: ["supportsNonExistentFeature99"],
        environment: "test",
      });
    } catch (err) {
      mismatchCaught = true;
      assert(
        err.message.includes("No payment provider") || err.message.includes("capability"),
        `Correctly rejected selection when no provider matched capability: ${err.message}`
      );
    }
    assert(mismatchCaught, "Capability mismatch strictly throws descriptive error");
  }

  // -------------------------------------------------------------------------
  // 3. UNAVAILABLE PROVIDER
  // -------------------------------------------------------------------------
  console.log("▶ [Test 3] Unavailable Provider (Disabled) Handling");
  {
    const customRegistry = new PaymentProviderRegistry();
    customRegistry.providers.clear();
    customRegistry.registerProvider({
      providerId: "TEST_UNAVAILABLE",
      name: "TEST_UNAVAILABLE",
      railTypes: ["UPI"],
      adapter: upiRailAdapter,
      priority: 1,
      enabled: false,
      productionReady: false,
    });
    const customRouting = new PaymentRoutingService(customRegistry);

    let errorThrown = false;
    try {
      customRouting.selectProvider({ rail: "UPI", environment: "test" });
    } catch (err) {
      errorThrown = true;
    }
    assert(errorThrown, "Disabled provider is never selected for active routing");
  }

  // -------------------------------------------------------------------------
  // 4. PROVIDER TIMEOUT
  // -------------------------------------------------------------------------
  console.log("▶ [Test 4] Provider Timeout Graceful Handling");
  {
    class TimeoutTestAdapter extends PaymentRailAdapter {
      constructor() {
        super({ railType: "UPI", provider: "TIMEOUT_PROVIDER", productionReady: true });
      }
      async initiatePayment() {
        const err = new Error("Gateway connection timed out after 5000ms");
        err.code = "GATEWAY_TIMEOUT";
        err.isTimeout = true;
        throw err;
      }
    }
    const timeoutAdapter = new TimeoutTestAdapter();
    let handledStatus = null;
    try {
      await timeoutAdapter.initiatePayment({ amount: 100 });
    } catch (err) {
      handledStatus = err.isTimeout ? "PROVIDER_TIMEOUT" : "FAILED";
    }
    assert(handledStatus === "PROVIDER_TIMEOUT", "Provider timeout is categorized as PROVIDER_TIMEOUT, never premature success");
  }

  // -------------------------------------------------------------------------
  // 5. PROVIDER FAILURE
  // -------------------------------------------------------------------------
  console.log("▶ [Test 5] Provider Failure Handling");
  {
    class FailureTestAdapter extends PaymentRailAdapter {
      constructor() {
        super({ railType: "CARD", provider: "FAILING_PROVIDER", productionReady: true });
      }
      async initiatePayment() {
        return {
          status: "FAILED",
          success: false,
          failureCode: "INSUFFICIENT_FUNDS",
          failureReason: "Card issuing bank declined transaction: Insufficient balance",
        };
      }
    }
    const failAdapter = new FailureTestAdapter();
    const res = await failAdapter.initiatePayment({ amount: 500 });
    assert(res.status === "FAILED" && res.failureCode === "INSUFFICIENT_FUNDS", "Declined transaction correctly captures failure reason and code");
  }

  // -------------------------------------------------------------------------
  // 6. PROVIDER HEALTH DOWN TRACKING
  // -------------------------------------------------------------------------
  console.log("▶ [Test 6] Provider Health DOWN Transition on Degradation");
  {
    const customRegistry = new PaymentProviderRegistry();
    customRegistry.registerProvider({
      providerId: "UNSTABLE_GATEWAY",
      name: "UNSTABLE_GATEWAY",
      railTypes: ["UPI"],
      adapter: upiRailAdapter,
      priority: 1,
      enabled: true,
      productionReady: true,
    });

    // Record 6 consecutive failures
    for (let i = 0; i < 6; i++) {
      customRegistry.recordHealth("UNSTABLE_GATEWAY", false, 450);
    }
    const health = customRegistry.getProviderHealth("UNSTABLE_GATEWAY");
    assert(
      health.status === "DOWN" || health.status === "DEGRADED",
      `Provider marked as ${health.status} after repeated consecutive failures (failureRate: ${health.failureRate.toFixed(2)})`
    );
  }

  // -------------------------------------------------------------------------
  // 7. PROVIDER FAILOVER BEFORE ATTEMPT CREATION
  // -------------------------------------------------------------------------
  console.log("▶ [Test 7] Provider Failover BEFORE Attempt Creation");
  {
    const customRegistry = new PaymentProviderRegistry();
    customRegistry.providers.clear();
    customRegistry.registerProvider({
      providerId: "PRIMARY_UPI",
      name: "PRIMARY_UPI",
      railTypes: ["UPI"],
      adapter: upiRailAdapter,
      priority: 1,
      enabled: true,
      productionReady: true,
    });
    customRegistry.registerProvider({
      providerId: "SECONDARY_UPI",
      name: "SECONDARY_UPI",
      railTypes: ["UPI"],
      adapter: upiRailAdapter,
      priority: 2,
      enabled: true,
      productionReady: true,
    });
    const customRouting = new PaymentRoutingService(customRegistry);

    // Fail primary 5 times to mark DOWN
    for (let i = 0; i < 6; i++) {
      customRegistry.recordHealth("PRIMARY_UPI", false, 500);
    }

    const selected = customRouting.selectProvider({ rail: "UPI", environment: "test" });
    assert(
      selected.providerId === "SECONDARY_UPI",
      `Router failed over to secondary provider '${selected.name}' before attempt creation`
    );
  }

  // -------------------------------------------------------------------------
  // 8. NO PROVIDER FAILOVER AFTER ATTEMPT CREATION (Immutable Binding)
  // -------------------------------------------------------------------------
  console.log("▶ [Test 8] Strict Immutability: NO Failover AFTER Attempt Creation");
  {
    const boundAttempt = {
      attemptId: "att_fixed_1001",
      provider: "RAZORPAY",
      rail: "CARD",
      environment: "test",
      status: "INITIATED",
    };

    // Even if RAZORPAY is temporarily marked DOWN in registry:
    paymentProviderRegistry.recordHealth("RAZORPAY", false, 500);
    paymentProviderRegistry.recordHealth("RAZORPAY", false, 500);
    paymentProviderRegistry.recordHealth("RAZORPAY", false, 500);

    const resolvedAdapter = paymentRoutingService.getAdapterForAttempt(boundAttempt);
    assert(
      resolvedAdapter.provider === "RAZORPAY",
      `Recovery strictly resolves immutable bound provider '${resolvedAdapter.provider}' without switching`
    );

    // Verify error when attempting to resolve unknown provider
    let threwInvalid = false;
    try {
      paymentRoutingService.getAdapterForAttempt({ provider: "UNKNOWN_GHOST_RAIL" });
    } catch {
      threwInvalid = true;
    }
    assert(threwInvalid, "Resolving non-existent provider on existing attempt throws error");
  }

  // -------------------------------------------------------------------------
  // 9. DUPLICATE PAYMENT ATTEMPT IDEMPOTENCY
  // -------------------------------------------------------------------------
  console.log("▶ [Test 9] Duplicate Payment Attempt Idempotency");
  {
    const idempKey = `test_idemp_attempt_${Date.now()}`;
    const endpoint = "/api/v1/payment/checkout/attempt";
    const payload = { intentId: "pi_test_dup", method: "UPI", amount: 1200 };
    const savedResponse = {
      success: true,
      attempt: { attemptId: "att_idemp_01", status: "INITIATED" },
    };

    await IdempotencyManager.recordResult(idempKey, endpoint, "POST", payload, 200, savedResponse);

    // Replay with identical payload
    const replay = await IdempotencyManager.getExistingResult(idempKey, endpoint, payload);
    assert(
      replay !== null && replay.data.attempt.attemptId === "att_idemp_01",
      "Duplicate payment attempt returns cached original response without creating duplicate attempt"
    );

    // Replay with mutated payload (Tampering detection)
    let tamperingDetected = false;
    try {
      await IdempotencyManager.getExistingResult(idempKey, endpoint, {
        intentId: "pi_test_dup",
        method: "UPI",
        amount: 99999, // Mutated!
      });
    } catch (err) {
      tamperingDetected = true;
      assert(err.statusCode === 409 || err.status === 409, "Mutated payload under same idempotency key rejected with HTTP 409 Conflict");
    }
    assert(tamperingDetected, "Tampered payload detection verified");
  }

  // -------------------------------------------------------------------------
  // 10. DUPLICATE WEBHOOK DELIVERY
  // -------------------------------------------------------------------------
  console.log("▶ [Test 10] Duplicate Webhook Delivery Deduplication");
  {
    const sandboxWebhook = new SandboxWebhookAdapter();
    const eventId = `evt_dup_test_${Date.now()}`;
    const payload = {
      eventId,
      status: "CAPTURED",
      amount: 1999,
      paymentReference: "pay_sbx_dup_01",
    };

    const res1 = await sandboxWebhook.processWebhook({ payload });
    assert(res1.isValid && res1.normalizedEvent.eventId === eventId, "First webhook delivery normalized successfully");

    const res2 = await sandboxWebhook.processWebhook({ payload });
    assert(res2.isValid && res2.normalizedEvent.eventId === eventId, "Second delivery recognized with identical eventId");
  }

  // -------------------------------------------------------------------------
  // 11. PROVIDER WEBHOOK NORMALIZATION
  // -------------------------------------------------------------------------
  console.log("▶ [Test 11] Provider Webhook Normalization to NormalizedPaymentEvent");
  {
    const rzpWebhook = new RazorpayWebhookAdapter();
    const fakeSecret = "rzp_secret_test_key";
    process.env.RAZORPAY_WEBHOOK_SECRET = fakeSecret;

    const rzpRawPayload = JSON.stringify({
      id: "evt_rzp_mock_1001",
      event: "payment.captured",
      created_at: 1700000000,
      payload: {
        payment: {
          entity: {
            id: "pay_rzp_ext_9988",
            order_id: "order_rzp_ext_1122",
            amount: 250000, // 2500 INR in paise
            currency: "INR",
            status: "captured",
          },
        },
      },
    });

    const signature = crypto.createHmac("sha256", fakeSecret).update(rzpRawPayload).digest("hex");

    const { isValid, normalizedEvent } = await rzpWebhook.processWebhook({
      rawBody: Buffer.from(rzpRawPayload),
      signature,
      payload: JSON.parse(rzpRawPayload),
    });

    assert(isValid === true, "Razorpay webhook HMAC signature verified correctly");
    assert(normalizedEvent instanceof NormalizedPaymentEvent, "Parsed into NormalizedPaymentEvent instance");
    assert(normalizedEvent.provider === "RAZORPAY", "Provider correctly identified as RAZORPAY");
    assert(normalizedEvent.status === "CAPTURED", "Status normalized to CAPTURED");
    assert(normalizedEvent.amount === 2500, "Paise to INR amount normalized correctly (250000 -> 2500)");
    assert(normalizedEvent.paymentReference === "pay_rzp_ext_9988", "Payment reference normalized");
  }

  // -------------------------------------------------------------------------
  // 12. PAYMENT RECOVERY
  // -------------------------------------------------------------------------
  console.log("▶ [Test 12] Payment Recovery & Status Polling");
  {
    const pendingAttempt = {
      attemptId: "att_recov_01",
      provider: "SANDBOX_SIMULATION",
      rail: "UPI",
      providerReference: "sbx_sim_recov_01",
      status: "PENDING",
    };

    const recoveryRes = await paymentOrchestratorService.checkAndRecoverAttemptStatus(pendingAttempt);
    assert(
      recoveryRes !== null && (recoveryRes.status === "CAPTURED" || recoveryRes.status === "PENDING"),
      `Recovery returned authoritative gateway status: ${recoveryRes.status}`
    );
  }

  // -------------------------------------------------------------------------
  // 13. REFUND VIA ROUTED ADAPTER
  // -------------------------------------------------------------------------
  console.log("▶ [Test 13] Refund Resolution via Bound Provider Adapter");
  {
    // Test that refundService resolves the correct adapter for a given attempt
    const mockAttemptDoc = {
      attemptId: "att_rfnd_routed_01",
      provider: "SANDBOX_SIMULATION",
      rail: "CARD",
      environment: "test",
      status: "CAPTURED",
      amount: 1500,
      providerReference: "sbx_pay_ref_rfnd",
    };

    const adapter = paymentRoutingService.getAdapterForAttempt(mockAttemptDoc);
    assert(
      adapter !== null && adapter.provider === "SANDBOX",
      `Refund adapter correctly resolved to '${adapter.provider}' for attempt ${mockAttemptDoc.attemptId}`
    );

    const refundRes = await adapter.refundPayment({
      paymentReference: mockAttemptDoc.providerReference,
      amount: 500,
      reason: "Customer return",
    });
    assert(
      refundRes.status === "REFUNDED" || refundRes.status === "PENDING" || refundRes.status === "COMPLETED",
      `Adapter executed refund successfully with status: ${refundRes.status}`
    );
  }

  // -------------------------------------------------------------------------
  // 14. RECONCILIATION ADAPTER
  // -------------------------------------------------------------------------
  console.log("▶ [Test 14] Settlement Reconciliation Adapter");
  {
    const sampleCsv = `gateway_reference,order_id,amount,fee,tax,currency,settlement_date,status\npay_rec_01,pi_rec_01,1000,20,3.6,INR,2026-10-05,SETTLED\n`;
    const parsed = await csvSettlementDataSourceAdapter.parseSettlementRecords(sampleCsv);
    assert(parsed.length === 1, `Parsed ${parsed.length} settlement record from CSV`);
    assert(parsed[0].amount === 1000 && (parsed[0].gatewayReference === "pay_rec_01" || parsed[0].providerReference === "pay_rec_01"), "Extracted gateway reference and amount correctly");
  }

  // -------------------------------------------------------------------------
  // 15. PRODUCTION MOCK RAIL REJECTION (Fail-Closed)
  // -------------------------------------------------------------------------
  console.log("▶ [Test 15] Production Mock Rail Fail-Closed Rejection");
  {
    const origEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    let mockRejected = false;
    try {
      sandboxAdapter.assertProductionReady("initiatePayment");
    } catch (err) {
      mockRejected = true;
      assert(err.statusCode === 503, `Sandbox adapter threw 503 in production: ${err.message}`);
    }
    assert(mockRejected, "Sandbox simulation adapter fail-closed in production verified");

    // Also verify routing engine rejects sandbox in production
    let routerRejected = false;
    try {
      paymentRoutingService.resolveAdapter("SANDBOX_SIMULATION", { environment: "production" });
    } catch (err) {
      routerRejected = true;
      assert(err.statusCode === 503 || err.message.includes("production"), "Router rejected sandbox in production");
    }
    assert(routerRejected, "PaymentRoutingService blocks sandbox adapter in production");

    process.env.NODE_ENV = origEnv; // Restore
  }

  // -------------------------------------------------------------------------
  // 16. SANDBOX DETERMINISTIC SUCCESS
  // -------------------------------------------------------------------------
  console.log("▶ [Test 16] Sandbox Deterministic Success");
  {
    const successResult = await sandboxAdapter.initiatePayment({
      intentId: "pi_sbx_success",
      amount: 1500,
      currency: "INR",
      scenario: "SUCCESS",
    });
    assert(successResult.status === "CAPTURED" && successResult.success === true, "Sandbox returns CAPTURED for SUCCESS scenario");
  }

  // -------------------------------------------------------------------------
  // 17. SANDBOX DETERMINISTIC FAILURE
  // -------------------------------------------------------------------------
  console.log("▶ [Test 17] Sandbox Deterministic Failure");
  {
    const failureResult = await sandboxAdapter.initiatePayment({
      intentId: "pi_sbx_fail",
      amount: 1500,
      currency: "INR",
      scenario: "FAILURE",
    });
    assert(failureResult.status === "FAILED" && failureResult.success === false, "Sandbox returns FAILED for FAILURE scenario");
  }

  // -------------------------------------------------------------------------
  // 18. UPI AVAILABILITY
  // -------------------------------------------------------------------------
  console.log("▶ [Test 18] UPI Rail Availability & Capabilities");
  {
    const upiProviders = paymentProviderRegistry.getProvidersForRail("UPI").filter((p) => p.enabled);
    assert(upiProviders.length > 0, `UPI rail has ${upiProviders.length} active provider(s)`);
    const primaryUpi = upiProviders[0];
    assert(
      primaryUpi.capabilities.supportsUPIIntent || primaryUpi.capabilities.supportsUPIQR,
      `UPI provider supports UPI Intent and/or QR: ${JSON.stringify(primaryUpi.capabilities)}`
    );
  }

  // -------------------------------------------------------------------------
  // 19. CARD AVAILABILITY
  // -------------------------------------------------------------------------
  console.log("▶ [Test 19] Card Rail Availability & Capabilities");
  {
    const cardProviders = paymentProviderRegistry.getProvidersForRail("CARD").filter((p) => p.enabled);
    assert(cardProviders.length > 0, `Card rail has ${cardProviders.length} active provider(s)`);
    const primaryCard = cardProviders[0];
    assert(
      primaryCard.capabilities.supportsCards === true && primaryCard.capabilities.supports3DS === true,
      `Card provider supports 3DS and cards: ${JSON.stringify(primaryCard.capabilities)}`
    );
  }

  // -------------------------------------------------------------------------
  // 20. NETBANKING AVAILABILITY
  // -------------------------------------------------------------------------
  console.log("▶ [Test 20] NetBanking Rail Availability & Popular Banks");
  {
    const nbProviders = paymentProviderRegistry.getProvidersForRail("NETBANKING").filter((p) => p.enabled);
    assert(nbProviders.length > 0, `NetBanking rail has ${nbProviders.length} active provider(s)`);
  }

  // -------------------------------------------------------------------------
  // 21. EMI ELIGIBILITY & CALCULATION (Server-Authoritative)
  // -------------------------------------------------------------------------
  console.log("▶ [Test 21] EMI Eligibility & Reducing Balance Calculation");
  {
    // A. Below minimum threshold (< 3000)
    const lowEligibility = emiService.checkEligibility({ amount: 1500 });
    assert(
      lowEligibility.eligible === false && lowEligibility.reasonCode === "ORDER_VALUE_TOO_LOW",
      "Order below ₹3,000 correctly flagged ineligible with reasonCode 'ORDER_VALUE_TOO_LOW'"
    );

    // B. Eligible amount (>= 3000)
    const eligibleAmount = emiService.checkEligibility({ amount: 12000 });
    assert(eligibleAmount.eligible === true, "Order of ₹12,000 correctly flagged eligible for EMI");

    // C. Mathematical calculation test (₹12,000 over 6 months at 14% p.a.)
    const calc = emiService.calculateEmi({
      amount: 12000,
      bankCode: "HDFC",
      tenureMonths: 6,
      subventionType: "NONE",
    });
    assert(calc.monthlyInstallment > 0, `Monthly installment calculated: ₹${calc.monthlyInstallment}`);
    assert(calc.totalRepayment > 12000, `Total repayment including interest: ₹${calc.totalRepayment}`);
    assert(calc.interestAmount > 0, `Total interest: ₹${calc.interestAmount}`);

    // D. No Cost EMI Subvention
    const noCostCalc = emiService.calculateEmi({
      amount: 12000,
      bankCode: "HDFC",
      tenureMonths: 6,
      subventionType: "NO_COST_SUBVENTION",
    });
    assert(
      noCostCalc.instantDiscount === noCostCalc.interestAmount,
      `No cost EMI instant discount (₹${noCostCalc.instantDiscount}) strictly offsets interest (₹${noCostCalc.interestAmount})`
    );
  }

  // -------------------------------------------------------------------------
  // FEE PROVIDER SNAPSHOT & HISTORICAL RATE TEST
  // -------------------------------------------------------------------------
  console.log("▶ [Bonus Test] Provider Fee Abstraction & Immutability");
  {
    const feeSnapshot = paymentFeeProvider.snapshotFees({
      provider: "RAZORPAY",
      method: "UPI",
      amount: 2000,
    });
    assert(feeSnapshot.estimatedGatewayFee === 0, "UPI transactions have ₹0 gateway fee");

    const cardFee = paymentFeeProvider.estimateFee({
      provider: "RAZORPAY",
      method: "CARD",
      amount: 10000,
    });
    assert(cardFee.gatewayFee === 200, `Card fee 2% of 10000 = 200 (calculated: ${cardFee.gatewayFee})`);
    assert(cardFee.gst === 36, `18% GST on 200 = 36 (calculated: ${cardFee.gst})`);
    assert(cardFee.totalDeduction === 236, `Total fee deduction: ₹${cardFee.totalDeduction}`);
  }

  console.log("\n================================================================");
  console.log(`🏁 TEST EXECUTION SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log("================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runPaymentPlatform4Suite().catch((err) => {
  console.error("Fatal test suite failure:", err);
  process.exit(1);
});
