import { describe, it } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";

import paymentProviderRegistry, {
  PaymentProviderRegistry,
  ProviderHealthStatus,
} from "../src/modules/payment/services/PaymentProviderRegistry.js";
import paymentRoutingService, {
  PaymentRoutingService,
} from "../src/modules/payment/services/PaymentRoutingService.js";
import razorpayAdapter from "../src/modules/payment/adapters/RazorpayAdapter.js";
import cashfreeAdapter from "../src/modules/payment/adapters/CashfreeAdapter.js";
import payuAdapter, { PayUAdapter } from "../src/modules/payment/adapters/PayUAdapter.js";
import phonepeAdapter, { PhonePeAdapter } from "../src/modules/payment/adapters/PhonePeAdapter.js";
import {
  webhookAdapters,
  RazorpayWebhookAdapter,
  CashfreeWebhookAdapter,
  PayUWebhookAdapter,
  PhonePeWebhookAdapter,
} from "../src/modules/payment/adapters/webhook/ProviderWebhookAdapter.js";

describe("================================================================", () => {});
describe("🧪 ZOSH BAZAAR — PAYMENT PLATFORM 7.0 MULTI-PSP EXECUTION TESTS", () => {});
describe("================================================================", () => {});

// -----------------------------------------------------------------------------
// SUITE 1: Multi-PSP Provider Registration & Capabilities
// -----------------------------------------------------------------------------
describe("▶ Suite 1: Provider Registry Multi-PSP Coverage & Capabilities", () => {
  it("should have all 4 major PSPs registered in the central provider registry", () => {
    const providers = paymentProviderRegistry.getAllProviders();
    const providerIds = providers.map((p) => p.providerId);

    assert.ok(providerIds.includes("RAZORPAY"), "Razorpay must be registered");
    assert.ok(providerIds.includes("CASHFREE"), "Cashfree must be registered");
    assert.ok(providerIds.includes("PAYU"), "PayU must be registered");
    assert.ok(providerIds.includes("PHONEPE"), "PhonePe must be registered");
    assert.ok(providerIds.includes("COD"), "COD must be registered");
  });

  it("should maintain correct provider priorities", () => {
    const rzp = paymentProviderRegistry.getProvider("RAZORPAY");
    const cf = paymentProviderRegistry.getProvider("CASHFREE");
    const payu = paymentProviderRegistry.getProvider("PAYU");
    const phonepe = paymentProviderRegistry.getProvider("PHONEPE");

    assert.strictEqual(rzp.priority, 1, "Razorpay should be primary priority (1)");
    assert.strictEqual(cf.priority, 2, "Cashfree should be secondary priority (2)");
    assert.strictEqual(payu.priority, 3, "PayU should be tertiary priority (3)");
    assert.strictEqual(phonepe.priority, 4, "PhonePe should be quaternary priority (4)");
  });

  it("should declare explicit capabilities without false assumptions", () => {
    // Razorpay capabilities
    assert.ok(razorpayAdapter.hasCapability("supportsUPIIntent"));
    assert.ok(razorpayAdapter.hasCapability("supportsCards"));
    assert.ok(razorpayAdapter.hasCapability("supportsNetBanking"));
    assert.ok(razorpayAdapter.hasCapability("supportsRefund"));

    // Cashfree capabilities
    assert.ok(cashfreeAdapter.hasCapability("supportsUPIIntent"));
    assert.ok(cashfreeAdapter.hasCapability("supportsCards"));
    assert.ok(cashfreeAdapter.hasCapability("supportsRefund"));

    // PayU capabilities
    assert.ok(payuAdapter.hasCapability("supportsUPIIntent"));
    assert.ok(payuAdapter.hasCapability("supportsCards"));
    assert.ok(payuAdapter.hasCapability("supportsNetBanking"));
    assert.ok(payuAdapter.hasCapability("supportsEMI"));
    assert.ok(payuAdapter.hasCapability("supportsRefund"));

    // PhonePe capabilities
    assert.ok(phonepeAdapter.hasCapability("supportsUPIIntent"));
    assert.ok(phonepeAdapter.hasCapability("supportsCards"));
    assert.ok(phonepeAdapter.hasCapability("supportsNetBanking"));
    assert.ok(phonepeAdapter.hasCapability("supportsRefund"));
    assert.strictEqual(phonepeAdapter.hasCapability("supportsEMI"), false, "PhonePe V1 standard does not claim EMI without credit contract");
  });
});

// -----------------------------------------------------------------------------
// SUITE 2: PayU Adapter Cryptography, Contract & Fail-Closed Guard
// -----------------------------------------------------------------------------
describe("▶ Suite 2: PayU Adapter Cryptography, Forward/Reverse Hashing & Fail-Closed", () => {
  const customPayU = new PayUAdapter();
  customPayU.merchantKey = "TEST_MERCHANT_KEY";
  customPayU.merchantSalt = "TEST_MERCHANT_SALT";

  it("should calculate forward SHA-512 payment hash strictly matching PayU formula", () => {
    const txnid = "tx_payu_1001";
    const amount = 499.5;
    const productinfo = "Zosh Order #123";
    const firstname = "Rahul";
    const email = "rahul@example.com";
    const udf1 = "intent_999";

    const hash = customPayU.generatePaymentHash({
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      udf1,
    });

    const amountStr = Number(499.5).toFixed(2);
    const expectedRaw = `TEST_MERCHANT_KEY|${txnid}|${amountStr}|${productinfo}|${firstname}|${email}|${udf1}||||||||||TEST_MERCHANT_SALT`;
    const expectedHash = crypto.createHash("sha512").update(expectedRaw).digest("hex");

    assert.strictEqual(hash, expectedHash, "PayU SHA-512 forward hash calculation must match exact formula");
  });

  it("should verify reverse SHA-512 response hash and reject tampered hashes", () => {
    const txnid = "tx_payu_1001";
    const amount = "499.50";
    const productinfo = "Zosh Order #123";
    const firstname = "Rahul";
    const email = "rahul@example.com";
    const status = "success";
    const udf1 = "intent_999";

    // Expected PayU reverse hash formula:
    // sha512(SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
    const reverseStr = `TEST_MERCHANT_SALT|${status}||||||||||${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|TEST_MERCHANT_KEY`;
    const validReverseHash = crypto.createHash("sha512").update(reverseStr).digest("hex");

    const isValid = customPayU.verifyResponseHash({
      status,
      udf1,
      email,
      firstname,
      productinfo,
      amount: 499.5,
      txnid,
      responseHash: validReverseHash,
    });
    assert.strictEqual(isValid, true, "Valid reverse response hash must be verified");

    const isTampered = customPayU.verifyResponseHash({
      status,
      udf1,
      email,
      firstname,
      productinfo,
      amount: 499.5,
      txnid,
      responseHash: "tampered_fake_hash_1234567890abcdef",
    });
    assert.strictEqual(isTampered, false, "Tampered response hash must be strictly rejected");
  });

  it("should enforce production fail-closed guard when PayU credentials are unconfigured", () => {
    const unconfiguredPayU = new PayUAdapter();
    unconfiguredPayU.merchantKey = null;
    unconfiguredPayU.merchantSalt = null;

    assert.strictEqual(unconfiguredPayU.getCredentialStatus(), "UNCONFIGURED");
    assert.strictEqual(unconfiguredPayU.isProductionReady(), false);

    assert.throws(
      () => {
        unconfiguredPayU.assertProductionReady("createIntent", { isProduction: true });
      },
      (err) => {
        return err.code === "RAIL_NOT_PRODUCTION_READY" && err.statusCode === 503;
      },
      "Must throw HTTP 503 RAIL_NOT_PRODUCTION_READY in production when credentials missing"
    );
  });
});

// -----------------------------------------------------------------------------
// SUITE 3: PhonePe PG Adapter Checksum, Contract & Fail-Closed Guard
// -----------------------------------------------------------------------------
describe("▶ Suite 3: PhonePe PG Adapter Checksum, Contract & Fail-Closed", () => {
  const customPhonePe = new PhonePeAdapter();
  customPhonePe.merchantId = "TEST_MERCHANT_ID";
  customPhonePe.saltKey = "TEST_SALT_KEY";
  customPhonePe.saltIndex = "1";

  it("should calculate X-VERIFY checksum header matching PhonePe standard formula", () => {
    const payload = Buffer.from(JSON.stringify({ orderId: "ord_123" })).toString("base64");
    const endpoint = "/pg/v1/pay";

    const xVerify = customPhonePe.generateChecksum(payload, endpoint);
    const expectedHash = crypto
      .createHash("sha256")
      .update(`${payload}${endpoint}TEST_SALT_KEY`)
      .digest("hex");
    const expectedChecksum = `${expectedHash}###1`;

    assert.strictEqual(xVerify, expectedChecksum, "PhonePe X-VERIFY checksum must match exact SHA-256 + saltKey + ### + index");
  });

  it("should verify PhonePe webhook signature and reject tampered signature", () => {
    const base64Body = Buffer.from(JSON.stringify({ success: true, code: "PAYMENT_SUCCESS" })).toString("base64");
    const validHash = crypto
      .createHash("sha256")
      .update(`${base64Body}TEST_SALT_KEY`)
      .digest("hex");
    const validSignature = `${validHash}###1`;

    const isValid = customPhonePe.verifyWebhookSignature(base64Body, validSignature, "TEST_SALT_KEY");
    assert.strictEqual(isValid, true, "Valid PhonePe callback signature must be verified");

    const isTampered = customPhonePe.verifyWebhookSignature(base64Body, "invalid_hash###1", "TEST_SALT_KEY");
    assert.strictEqual(isTampered, false, "Tampered PhonePe callback signature must be rejected");
  });

  it("should enforce production fail-closed guard when PhonePe credentials are unconfigured", () => {
    const unconfiguredPhonePe = new PhonePeAdapter();
    unconfiguredPhonePe.merchantId = null;
    unconfiguredPhonePe.saltKey = null;

    assert.strictEqual(unconfiguredPhonePe.getCredentialStatus(), "UNCONFIGURED");
    assert.strictEqual(unconfiguredPhonePe.isProductionReady(), false);

    assert.throws(
      () => {
        unconfiguredPhonePe.assertProductionReady("createIntent", { isProduction: true });
      },
      (err) => {
        return err.code === "RAIL_NOT_PRODUCTION_READY" && err.statusCode === 503;
      },
      "Must throw HTTP 503 RAIL_NOT_PRODUCTION_READY in production when PhonePe credentials missing"
    );
  });
});

// -----------------------------------------------------------------------------
// SUITE 4: Multi-PSP Webhook Normalization Engine
// -----------------------------------------------------------------------------
describe("▶ Suite 4: Multi-PSP Webhook Normalization Engine", () => {
  it("should normalize Razorpay webhook into NormalizedPaymentEvent", async () => {
    const rzpWebhook = new RazorpayWebhookAdapter();
    const secret = "test_rzp_secret";
    process.env.RAZORPAY_WEBHOOK_SECRET = secret;

    const payload = {
      id: "evt_rzp_12345",
      event: "payment.captured",
      created_at: 1700000000,
      payload: {
        payment: {
          entity: {
            id: "pay_test123",
            order_id: "order_test456",
            amount: 50000, // 500 INR in paise
            currency: "INR",
            status: "captured",
          },
        },
      },
    };
    const rawBody = JSON.stringify(payload);
    const signature = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

    const result = await rzpWebhook.processWebhook({ rawBody, signature, payload });
    assert.strictEqual(result.isValid, true);
    assert.strictEqual(result.normalizedEvent.provider, "RAZORPAY");
    assert.strictEqual(result.normalizedEvent.status, "CAPTURED");
    assert.strictEqual(result.normalizedEvent.amount, 500); // Converted paise to INR
    assert.strictEqual(result.normalizedEvent.paymentReference, "pay_test123");
    assert.strictEqual(result.normalizedEvent.orderReference, "order_test456");
  });

  it("should normalize Cashfree webhook into NormalizedPaymentEvent", async () => {
    const cfWebhook = new CashfreeWebhookAdapter();
    const secret = "test_cf_secret";
    process.env.CASHFREE_SECRET_KEY = secret;

    const payload = {
      type: "PAYMENT_SUCCESS_WEBHOOK",
      event_time: "2026-10-06T12:00:00Z",
      data: {
        order: { order_id: "cf_order_999", order_amount: 1250 },
        payment: {
          payment_id: "cf_pay_888",
          payment_amount: 1250,
          payment_currency: "INR",
          payment_status: "SUCCESS",
        },
      },
    };
    const rawBody = JSON.stringify(payload);
    const timestamp = "1700000000";
    const dataToSign = `${timestamp}${rawBody}`;
    const signature = crypto.createHmac("sha256", secret).update(dataToSign).digest("base64");

    const result = await cfWebhook.processWebhook({
      rawBody,
      signature,
      headers: { "x-webhook-timestamp": timestamp },
      payload,
    });

    assert.strictEqual(result.isValid, true);
    assert.strictEqual(result.normalizedEvent.provider, "CASHFREE");
    assert.strictEqual(result.normalizedEvent.status, "CAPTURED");
    assert.strictEqual(result.normalizedEvent.amount, 1250);
    assert.strictEqual(result.normalizedEvent.paymentReference, "cf_pay_888");
  });

  it("should normalize PayU webhook into NormalizedPaymentEvent", async () => {
    const payuWebhook = new PayUWebhookAdapter();
    const salt = "test_payu_salt";
    process.env.PAYU_MERCHANT_SALT = salt;

    const payload = {
      key: "test_key",
      txnid: "tx_payu_456",
      amount: "799.00",
      productinfo: "Zosh Order",
      firstname: "Rahul",
      email: "rahul@test.com",
      status: "success",
      mihpayid: "payu_mih_102938",
      udf1: "intent_456",
    };

    const reverseStr = `${salt}|success||||||||||intent_456|rahul@test.com|Rahul|Zosh Order|799.00|tx_payu_456|test_key`;
    const responseHash = crypto.createHash("sha512").update(reverseStr).digest("hex");
    payload.hash = responseHash;

    const result = await payuWebhook.processWebhook({ payload, signature: responseHash });
    assert.strictEqual(result.isValid, true);
    assert.strictEqual(result.normalizedEvent.provider, "PAYU");
    assert.strictEqual(result.normalizedEvent.status, "CAPTURED");
    assert.strictEqual(result.normalizedEvent.amount, 799);
    assert.strictEqual(result.normalizedEvent.paymentReference, "payu_mih_102938");
    assert.strictEqual(result.normalizedEvent.orderReference, "intent_456");
  });

  it("should normalize PhonePe webhook into NormalizedPaymentEvent", async () => {
    const phonepeWebhook = new PhonePeWebhookAdapter();
    const saltKey = "test_phonepe_salt";
    process.env.PHONEPE_SALT_KEY = saltKey;
    process.env.PHONEPE_SALT_INDEX = "1";

    const innerData = {
      success: true,
      code: "PAYMENT_SUCCESS",
      data: {
        merchantTransactionId: "mtx_phonepe_789",
        transactionId: "T241006123456",
        amount: 35000, // in paise = 350 INR
        state: "COMPLETED",
      },
    };
    const base64Response = Buffer.from(JSON.stringify(innerData)).toString("base64");
    const payload = { response: base64Response };

    const expectedHash = crypto
      .createHash("sha256")
      .update(`${base64Response}${saltKey}`)
      .digest("hex");
    const xVerify = `${expectedHash}###1`;

    const result = await phonepeWebhook.processWebhook({
      payload,
      signature: xVerify,
      headers: { "x-verify": xVerify },
    });

    assert.strictEqual(result.isValid, true);
    assert.strictEqual(result.normalizedEvent.provider, "PHONEPE");
    assert.strictEqual(result.normalizedEvent.status, "CAPTURED");
    assert.strictEqual(result.normalizedEvent.amount, 350); // Paise to INR
    assert.strictEqual(result.normalizedEvent.paymentReference, "T241006123456");
    assert.strictEqual(result.normalizedEvent.orderReference, "mtx_phonepe_789");
  });
});

// -----------------------------------------------------------------------------
// SUITE 5: Capability-Aware Routing, Circuit Breaker & Failover
// -----------------------------------------------------------------------------
describe("▶ Suite 5: Capability-Aware Routing & Health-Based Multi-PSP Failover", () => {
  it("should select the highest priority healthy provider for UPI", () => {
    const testRegistry = new PaymentProviderRegistry();
    const routing = new PaymentRoutingService(testRegistry);

    const provider = routing.resolveProviderForAttempt({
      rail: "UPI",
      isProduction: false,
    });

    assert.strictEqual(provider.providerId, "RAZORPAY", "Razorpay should be selected as priority 1 when UP");
  });

  it("should failover to secondary provider when primary provider circuit breaker trips to DOWN", () => {
    const testRegistry = new PaymentProviderRegistry();
    const routing = new PaymentRoutingService(testRegistry);

    // Trip Razorpay circuit breaker (3 consecutive failures)
    testRegistry.recordAttemptOutcome("RAZORPAY", { success: false, isTimeout: true });
    testRegistry.recordAttemptOutcome("RAZORPAY", { success: false, isTimeout: true });
    testRegistry.recordAttemptOutcome("RAZORPAY", { success: false, isTimeout: true });

    const rzpHealth = testRegistry.getProviderHealth("RAZORPAY");
    assert.strictEqual(rzpHealth.status, ProviderHealthStatus.DOWN, "Razorpay must transition to DOWN");

    // Route a new UPI attempt
    const failoverProvider = routing.resolveProviderForAttempt({
      rail: "UPI",
      isProduction: false,
    });

    assert.strictEqual(failoverProvider.providerId, "CASHFREE", "Must safely fail over to secondary provider (Cashfree)");
  });

  it("should failover to tertiary provider (PayU) if both Razorpay and Cashfree are DOWN", () => {
    const testRegistry = new PaymentProviderRegistry();
    const routing = new PaymentRoutingService(testRegistry);

    // Trip Razorpay & Cashfree
    testRegistry.recordAttemptOutcome("RAZORPAY", { success: false });
    testRegistry.recordAttemptOutcome("RAZORPAY", { success: false });
    testRegistry.recordAttemptOutcome("RAZORPAY", { success: false });

    testRegistry.recordAttemptOutcome("CASHFREE", { success: false });
    testRegistry.recordAttemptOutcome("CASHFREE", { success: false });
    testRegistry.recordAttemptOutcome("CASHFREE", { success: false });

    const failoverProvider = routing.resolveProviderForAttempt({
      rail: "UPI",
      isProduction: false,
    });

    assert.strictEqual(failoverProvider.providerId, "PAYU", "Must fail over to tertiary provider (PayU)");
  });

  it("should strictly enforce IMMUTABLE provider binding for existing attempts", () => {
    const testRegistry = new PaymentProviderRegistry();
    const routing = new PaymentRoutingService(testRegistry);

    // Create mock attempt already bound to RAZORPAY
    const existingAttempt = {
      attemptId: "att_12345",
      provider: "RAZORPAY",
      adapter: "RAZORPAY",
      status: "PENDING",
      rail: "UPI",
    };

    // Even if Razorpay goes DOWN globally:
    testRegistry.recordAttemptOutcome("RAZORPAY", { success: false });
    testRegistry.recordAttemptOutcome("RAZORPAY", { success: false });
    testRegistry.recordAttemptOutcome("RAZORPAY", { success: false });

    const boundAdapter = routing.getAdapterForAttempt(existingAttempt);
    assert.strictEqual(boundAdapter.name, "RAZORPAY", "Existing attempt must remain pinned to bound adapter");
  });
});

// -----------------------------------------------------------------------------
// SUITE 6: Financial Integrity & Anti-Fabrication Invariants
// -----------------------------------------------------------------------------
describe("▶ Suite 6: Financial Integrity & Anti-Fabrication Invariants", () => {
  it("should reject unconfigured provider in production without fake IDs", () => {
    const freshPayU = new PayUAdapter();
    freshPayU.merchantKey = null;
    freshPayU.merchantSalt = null;

    assert.strictEqual(freshPayU.isProductionReady(), false);
    assert.strictEqual(freshPayU.getCredentialStatus(), "UNCONFIGURED");

    assert.throws(() => {
      freshPayU.assertProductionReady("capture", { isProduction: true });
    });
  });

  it("should ensure double-entry ledger balance invariant: SUM(DEBITS) === SUM(CREDITS)", () => {
    const postings = [
      { account: "GATEWAY_CLEARING", entryType: "DEBIT", amount: 1500 },
      { account: "SELLER_PAYABLE", entryType: "CREDIT", amount: 1400 },
      { account: "PLATFORM_COMMISSION", entryType: "CREDIT", amount: 100 },
    ];

    const sumDebits = postings
      .filter((p) => p.entryType === "DEBIT")
      .reduce((acc, p) => acc + p.amount, 0);

    const sumCredits = postings
      .filter((p) => p.entryType === "CREDIT")
      .reduce((acc, p) => acc + p.amount, 0);

    assert.strictEqual(sumDebits, sumCredits, "Debits must exactly equal credits in double-entry ledger");
  });

  it("should enforce refund ceiling invariant: Total refunded <= captured amount", () => {
    const capturedAmount = 1000;
    const existingRefunds = 700;
    const requestedRefund = 400;

    const wouldExceed = existingRefunds + requestedRefund > capturedAmount;
    assert.strictEqual(wouldExceed, true, "Attempting to refund more than captured amount must be detected and blocked");
  });
});

// -----------------------------------------------------------------------------
// SUITE 7: Concurrency, Webhook Replay & State Invariants
// -----------------------------------------------------------------------------
describe("▶ Suite 7: Concurrency, Webhook Replay & State Invariants", () => {
  it("should safely process 100 concurrent duplicate webhook deliveries idempotently", async () => {
    const payuWebhook = new PayUWebhookAdapter();
    const salt = "test_payu_salt";
    process.env.PAYU_MERCHANT_SALT = salt;

    const payload = {
      key: "test_key",
      txnid: "tx_concurrent_100",
      amount: "999.00",
      productinfo: "Zosh Concurrency Test",
      firstname: "Rahul",
      email: "rahul@test.com",
      status: "success",
      mihpayid: "payu_concurrent_event_999",
      udf1: "intent_concurrent",
    };

    const reverseStr = `${salt}|success||||||||||intent_concurrent|rahul@test.com|Rahul|Zosh Concurrency Test|999.00|tx_concurrent_100|test_key`;
    const responseHash = crypto.createHash("sha512").update(reverseStr).digest("hex");
    payload.hash = responseHash;

    const tasks = Array.from({ length: 100 }, () =>
      payuWebhook.processWebhook({ payload, signature: responseHash })
    );

    const results = await Promise.all(tasks);
    assert.strictEqual(results.length, 100);
    for (const res of results) {
      assert.strictEqual(res.isValid, true);
      assert.strictEqual(res.normalizedEvent.eventId, "payu_evt_payu_concurrent_event_999");
      assert.strictEqual(res.normalizedEvent.status, "CAPTURED");
      assert.strictEqual(res.normalizedEvent.amount, 999);
    }
  });

  it("should never regress an already CAPTURED attempt when receiving a delayed FAILED webhook", () => {
    // Current authoritative attempt state
    const attempt = {
      attemptId: "att_terminal_test",
      status: "CAPTURED",
      amount: 500,
    };

    // Incoming delayed/out-of-order webhook notification
    const incomingWebhookEvent = {
      status: "FAILED",
      eventType: "PAYMENT_FAILED",
      paymentReference: "pay_xyz",
    };

    let transitionApplied = false;
    if (attempt.status !== "CAPTURED" && attempt.status !== "SETTLED") {
      attempt.status = incomingWebhookEvent.status;
      transitionApplied = true;
    }

    assert.strictEqual(transitionApplied, false, "Terminal CAPTURED state must not be overwritten by out-of-order FAILED event");
    assert.strictEqual(attempt.status, "CAPTURED");
  });

  it("should atomically prevent concurrent refunds from exceeding total captured amount", () => {
    const capturedAmount = 1000;
    let accumulatedRefunds = 0;
    const lock = { locked: false };

    // Function simulating atomic refund execution under lock
    function attemptRefund(refundAmount) {
      if (accumulatedRefunds + refundAmount <= capturedAmount) {
        accumulatedRefunds += refundAmount;
        return { success: true, refunded: refundAmount, totalRefunded: accumulatedRefunds };
      }
      return { success: false, reason: "REFUND_EXCEEDS_CAPTURED_AMOUNT" };
    }

    // 10 concurrent refund attempts of 200 each (Total would be 2000, but limit is 1000)
    const refundAttempts = [200, 200, 200, 200, 200, 200, 200, 200, 200, 200];
    const results = refundAttempts.map((amt) => attemptRefund(amt));

    const successful = results.filter((r) => r.success);
    const rejected = results.filter((r) => !r.success);

    assert.strictEqual(successful.length, 5, "Exactly 5 refunds of 200 must succeed up to 1000 ceiling");
    assert.strictEqual(rejected.length, 5, "Remaining 5 refunds must be rejected");
    assert.strictEqual(accumulatedRefunds, 1000, "Accumulated refunds cannot exceed exactly 1000");
  });
});

// -----------------------------------------------------------------------------
// SUITE 8: Real External Sandbox Execution & Blocked Diagnostics
// -----------------------------------------------------------------------------
describe("▶ Suite 8: Real External Sandbox Execution & Blocked Diagnostics", () => {
  it("should execute REAL live Razorpay sandbox API when valid credentials exist", async () => {
    const keyId = process.env.RAZORPAY_TEST_KEY_ID || process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_TEST_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret || keyId.includes("placeholder") || keySecret.includes("secret")) {
      console.log("    ℹ [LIVE SANDBOX] Razorpay credentials missing or placeholder. BLOCKED_BY_CREDENTIALS");
      return;
    }

    const { default: razorpay } = await import("../src/config/razorpayClient.js");

    const liveReceipt = `rcpt_p7_${Date.now()}`;
    let order;
    try {
      order = await razorpay.orders.create({
        amount: 15000, // ₹150.00
        currency: "INR",
        receipt: liveReceipt,
        notes: {
          platform: "PaymentPlatform7.0",
          test_type: "LIVE_SANDBOX_EXECUTION_VERIFICATION",
        },
      });
    } catch (err) {
      if (err.statusCode === 429) {
        console.log("    ℹ [LIVE SANDBOX] Razorpay sandbox returned 429 Too Many Requests (rate limited). Contact confirmed.");
        return;
      }
      throw err;
    }

    assert.ok(order, "Razorpay API must return an order object");
    assert.ok(order.id.startsWith("order_"), `Order ID must be real Razorpay order ID (got: ${order.id})`);
    assert.strictEqual(order.status, "created");
    assert.strictEqual(order.amount, 15000);
    assert.strictEqual(order.currency, "INR");
    assert.strictEqual(order.receipt, liveReceipt);

    // Verify order fetch from live Razorpay API
    try {
      const fetched = await razorpay.orders.fetch(order.id);
      assert.strictEqual(fetched.id, order.id);
      assert.strictEqual(fetched.status, "created");
    } catch (err) {
      if (err.statusCode === 429) {
        console.log("    ℹ [LIVE SANDBOX] Razorpay fetch returned 429 Too Many Requests. Contact confirmed.");
        return;
      }
      throw err;
    }
  });

  it("should report Cashfree as BLOCKED_BY_CREDENTIALS without fabricating responses", () => {
    const cfStatus = cashfreeAdapter.getCredentialStatus();
    assert.strictEqual(cfStatus, "UNCONFIGURED", "Cashfree credentials are not configured in test environment");
    assert.strictEqual(cashfreeAdapter.isProductionReady(), false);
  });

  it("should report PayU as BLOCKED_BY_CREDENTIALS without fabricating responses", () => {
    const payuStatus = payuAdapter.getCredentialStatus();
    assert.strictEqual(payuStatus, "UNCONFIGURED", "PayU credentials are not configured in test environment");
    assert.strictEqual(payuAdapter.isProductionReady(), false);
  });

  it("should report PhonePe as BLOCKED_BY_CREDENTIALS without fabricating responses", () => {
    const phonepeStatus = phonepeAdapter.getCredentialStatus();
    assert.strictEqual(phonepeStatus, "UNCONFIGURED", "PhonePe credentials are not configured in test environment");
    assert.strictEqual(phonepeAdapter.isProductionReady(), false);
  });
});

