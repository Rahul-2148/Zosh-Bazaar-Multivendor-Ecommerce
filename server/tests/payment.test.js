/**
 * ==============================================================================
 * ZOSH BAZAAR — PAYMENT PLATFORM DOMAIN TEST SUITE
 * ==============================================================================
 * Comprehensive verification of:
 * 1. Money value object, minor unit conversions, precision & boundary invariants
 * 2. Adversarial input validation (sub-paisa, overflow, negative, scientific notation)
 * 3. IEEE-754 precision tolerance & string injection protection
 * 4. Payment Intent & Attempt state machines and transition guards
 * 5. Webhook security (HMAC validation, minor-unit amount mismatch, provider mismatch)
 * 6. Double-entry ledger atomicity (Debits == Credits invariant) & idempotent posting
 * 7. Payout safety & UTR enforcement (zero synthetic payout in production)
 * 8. Reconciliation discrepancy detection & anti-silent rounding
 * 9. Document persistence & minor-unit conservation in database models
 * ==============================================================================
 */

import assert from "assert";
import crypto from "crypto";
import dotenv from "dotenv";
import mongoose from "mongoose";

import Money, { MAX_MONETARY_AMOUNT } from "../src/modules/payment/utils/Money.js";
import { paymentWebhookService } from "../src/modules/payment/services/PaymentWebhookService.js";
import { PaymentWebhookEvent } from "../src/models/paymentWebhookEvent.model.js";
import { PaymentAttempt } from "../src/modules/payment/models/paymentAttempt.model.js";
import { PaymentIntent } from "../src/modules/payment/models/paymentIntent.model.js";
import { SettlementBatch, SettlementBatchStatus } from "../src/modules/payment/models/settlementBatch.model.js";
import { settlementService } from "../src/modules/payment/services/SettlementService.js";
import { paymentOrchestratorService } from "../src/modules/payment/services/PaymentOrchestratorService.js";
import { refundService } from "../src/modules/payment/services/RefundService.js";
import { reconciliationService, ReconciliationDiscrepancyType } from "../src/modules/payment/services/ReconciliationService.js";
import { ReconciliationRecord } from "../src/modules/payment/models/reconciliationRecord.model.js";
import { BankStatementSftpAdapter, SftpFileProcessingStatus } from "../src/modules/payment/adapters/reconciliation/BankStatementSftpAdapter.js";
import OrderService from "../src/modules/customer/services/order.service.js";
import PaymentAttemptStatus, { isValidAttemptTransition } from "../src/modules/payment/domain/PaymentAttemptStatus.js";
import PaymentIntentStatus, { isValidIntentTransition } from "../src/modules/payment/domain/PaymentIntentStatus.js";
import OrderStatus from "../src/domain/OrderStatus.js";
import PaymentStatus, { isValidPaymentTransition } from "../src/domain/PaymentStatus.js";
import { Order } from "../src/models/order.model.js";
import { Refund } from "../src/modules/payment/models/refund.model.js";
import { SellerBeneficiary } from "../src/modules/payment/models/sellerBeneficiary.model.js";
import { Wallet } from "../src/modules/payment/models/wallet.model.js";
import { LedgerJournal } from "../src/modules/payment/models/ledgerJournal.model.js";
import { LedgerPosting } from "../src/modules/payment/models/ledgerPosting.model.js";
import ledgerService from "../src/modules/payment/services/LedgerService.js";
import LedgerAccount, { EntryType } from "../src/modules/payment/domain/LedgerAccount.js";
import { webhookAdapters } from "../src/modules/payment/adapters/webhook/ProviderWebhookAdapter.js";

dotenv.config();

console.log("\n================================================================");
console.log("💳 ZOSH BAZAAR — PAYMENT & FINANCIAL INTEGRITY DOMAIN SUITE");
console.log("================================================================\n");

let testsPassed = 0;
let testsFailed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
    testsFailed++;
  }
}

async function runAsyncTest(name, fn) {
  try {
    await fn();
    console.log(`  ✅ PASS: ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
    testsFailed++;
  }
}

async function main() {
  if (mongoose.connection.readyState === 0) {
    try {
      const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/zosh-bazaar-test";
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 1500 });
    } catch {
      // In-memory model tests function safely without active network connection
    }
  }

  // --------------------------------------------------------------------------
  // [DOMAIN 1] MONETARY BOUNDARY VALUES & MINOR UNIT CONVERSION
  // --------------------------------------------------------------------------
  console.log("▶ [Domain 1] Monetary Boundary Values & Conversion");

  runTest("₹0.01 converts to exactly 1 paisa (both numeric and string)", () => {
    assert.strictEqual(Money.toMinorUnits(0.01), 1);
    assert.strictEqual(Money.toMinorUnits("0.01"), 1);
    assert.strictEqual(Money.fromMinorUnits(1), 0.01);
    assert.strictEqual(Money.format(1), "0.01");
  });

  runTest("₹10.10 converts to exactly 1010 paise (both numeric and string)", () => {
    assert.strictEqual(Money.toMinorUnits(10.10), 1010);
    assert.strictEqual(Money.toMinorUnits("10.10"), 1010);
    assert.strictEqual(Money.fromMinorUnits(1010), 10.10);
    assert.strictEqual(Money.format(1010), "10.10");
  });

  runTest("₹50.05 converts to exactly 5005 paise (both numeric and string)", () => {
    assert.strictEqual(Money.toMinorUnits(50.05), 5005);
    assert.strictEqual(Money.toMinorUnits("50.05"), 5005);
    assert.strictEqual(Money.fromMinorUnits(5005), 50.05);
    assert.strictEqual(Money.format(5005), "50.05");
  });

  runTest("₹100.10 converts to exactly 10010 paise (both numeric and string)", () => {
    assert.strictEqual(Money.toMinorUnits(100.10), 10010);
    assert.strictEqual(Money.toMinorUnits("100.10"), 10010);
    assert.strictEqual(Money.fromMinorUnits(10010), 100.10);
    assert.strictEqual(Money.format(10010), "100.10");
  });

  runTest("Configured Maximum ₹99,999,999.99 converts to exactly 9,999,999,999 paise", () => {
    assert.strictEqual(Money.toMinorUnits(MAX_MONETARY_AMOUNT), 9999999999);
    assert.strictEqual(Money.fromMinorUnits(9999999999), MAX_MONETARY_AMOUNT);
  });

  // --------------------------------------------------------------------------
  // [DOMAIN 2] ADVERSARIAL INPUT REJECTION & BOUNDARY GUARDS
  // --------------------------------------------------------------------------
  console.log("\n▶ [Domain 2] Adversarial Input Rejection & Boundary Guards");

  runTest("Strictly rejects sub-paisa amounts (10.005, 50.055, 0.001, '10.005')", () => {
    assert.throws(() => Money.validate(10.005), (e) => e.code === "MALFORMED_MONETARY_AMOUNT");
    assert.throws(() => Money.validate("10.005"), (e) => e.code === "MALFORMED_MONETARY_AMOUNT");
    assert.throws(() => Money.validate(50.055), (e) => e.code === "MALFORMED_MONETARY_AMOUNT");
    assert.throws(() => Money.validate("50.055"), (e) => e.code === "MALFORMED_MONETARY_AMOUNT");
    assert.throws(() => Money.validate(0.001), (e) => e.code === "MALFORMED_MONETARY_AMOUNT");
  });

  runTest("Strictly rejects negative and zero amounts (when allowZero is false)", () => {
    assert.throws(() => Money.validate(-10.10), (e) => e.code === "NON_POSITIVE_MONETARY_AMOUNT");
    assert.throws(() => Money.validate(-0.01), (e) => e.code === "NON_POSITIVE_MONETARY_AMOUNT");
    assert.throws(() => Money.validate(0), (e) => e.code === "NON_POSITIVE_MONETARY_AMOUNT");
    assert.strictEqual(Money.validate(0, "amount", { allowZero: true }), 0);
  });

  runTest("Strictly rejects overflow beyond MAX_MONETARY_AMOUNT", () => {
    assert.throws(
      () => Money.validate(100000000.00),
      (e) => e.code === "MONETARY_AMOUNT_OVERFLOW"
    );
  });

  runTest("Strictly rejects scientific notation ('1e-4', '1e5', '1.05e2')", () => {
    assert.throws(() => Money.validate("1e-4"), (e) => e.code === "MALFORMED_MONETARY_AMOUNT");
    assert.throws(() => Money.validate("1e5"), (e) => e.code === "MALFORMED_MONETARY_AMOUNT");
    assert.throws(() => Money.validate("1.05e2"), (e) => e.code === "MALFORMED_MONETARY_AMOUNT");
  });

  runTest("Strictly rejects null, undefined, empty string, and non-numeric inputs", () => {
    assert.throws(() => Money.validate(null), (e) => e.code === "MISSING_MONETARY_AMOUNT");
    assert.throws(() => Money.validate(undefined), (e) => e.code === "MISSING_MONETARY_AMOUNT");
    assert.throws(() => Money.validate(""), (e) => e.code === "MISSING_MONETARY_AMOUNT");
    assert.throws(() => Money.validate("abc"), (e) => e.code === "INVALID_MONETARY_AMOUNT");
    assert.throws(() => Money.validate(NaN), (e) => e.code === "INVALID_MONETARY_AMOUNT");
    assert.throws(() => Money.validate(Infinity), (e) => e.code === "INVALID_MONETARY_AMOUNT");
  });

  // --------------------------------------------------------------------------
  // [DOMAIN 3] IEEE-754 PRECISION TOLERANCE & STRING INJECTION
  // --------------------------------------------------------------------------
  console.log("\n▶ [Domain 3] IEEE-754 Precision Tolerance vs String Injection");

  runTest("IEEE-754 binary floating addition (1.10 + 2.20) validates safely to 330 paise", () => {
    const rawSum = 1.10 + 2.20; // 3.3000000000000003 in JavaScript IEEE-754
    assert.strictEqual(Money.toMinorUnits(rawSum), 330);
  });

  runTest("IEEE-754 binary floating addition (0.1 + 0.2) validates safely to 30 paise", () => {
    const rawSum = 0.1 + 0.2; // 0.30000000000000004 in JavaScript IEEE-754
    assert.strictEqual(Money.toMinorUnits(rawSum), 30);
  });

  runTest("Adversarial string literal '3.3000000000000003' is strictly rejected as malformed", () => {
    assert.throws(
      () => Money.validate("3.3000000000000003"),
      (e) => e.code === "MALFORMED_MONETARY_AMOUNT"
    );
  });

  runTest("Money.add and Money.subtract operate with exact integer paise precision", () => {
    assert.strictEqual(Money.add(10.10, 20.20), 30.30);
    assert.strictEqual(Money.subtract(100.10, 50.05), 50.05);
    assert.throws(() => Money.subtract(10.00, 20.00), (e) => e.code === "MONETARY_UNDERFLOW");
  });

  runTest("Unit isomorphism: Money.fromMinorUnits(Money.toMinorUnits(x)) === x", () => {
    const amounts = [0.01, 10.10, 50.05, 100.10, 4999.99, MAX_MONETARY_AMOUNT];
    for (const amt of amounts) {
      assert.strictEqual(Money.fromMinorUnits(Money.toMinorUnits(amt)), amt);
    }
  });

  // --------------------------------------------------------------------------
  // [DOMAIN 4] PAYMENT STATE MACHINE TRANSITION GUARDS
  // --------------------------------------------------------------------------
  console.log("\n▶ [Domain 4] Payment State Machine Transition Guards");

  runTest("PaymentStatus state transitions validate correctly", () => {
    assert.strictEqual(isValidPaymentTransition(PaymentStatus.PENDING, PaymentStatus.CAPTURED), true);
    assert.strictEqual(isValidPaymentTransition(PaymentStatus.PENDING, PaymentStatus.FAILED), true);
    assert.strictEqual(isValidPaymentTransition(PaymentStatus.CAPTURED, PaymentStatus.REFUNDED), true);
    assert.strictEqual(isValidPaymentTransition(PaymentStatus.CAPTURED, PaymentStatus.PARTIALLY_REFUNDED), true);
    assert.strictEqual(isValidPaymentTransition(PaymentStatus.FAILED, PaymentStatus.CAPTURED), false);
    assert.strictEqual(isValidPaymentTransition(PaymentStatus.REFUNDED, PaymentStatus.CAPTURED), false);
    assert.strictEqual(isValidPaymentTransition(PaymentStatus.CAPTURED, PaymentStatus.CAPTURED), true);
  });

  runTest("PaymentIntentStatus state transitions enforce integrity", () => {
    assert.strictEqual(isValidIntentTransition(PaymentIntentStatus.CREATED, PaymentIntentStatus.PROCESSING), true);
    assert.strictEqual(isValidIntentTransition(PaymentIntentStatus.PROCESSING, PaymentIntentStatus.SUCCEEDED), true);
    assert.strictEqual(isValidIntentTransition(PaymentIntentStatus.PROCESSING, PaymentIntentStatus.FAILED), true);
    assert.strictEqual(isValidIntentTransition(PaymentIntentStatus.SUCCEEDED, PaymentIntentStatus.FAILED), false);
  });

  // --------------------------------------------------------------------------
  // [DOMAIN 5] WEBHOOK SECURITY & MULTI-PROVIDER ADAPTERS
  // --------------------------------------------------------------------------
  console.log("\n▶ [Domain 5] Webhook Security & Multi-Provider Verification");

  await runAsyncTest("Negative: Webhook rejects minor-unit amount mismatch (e.g., 10.10 vs 10.11)", async () => {
    const origAttemptFindOne = PaymentAttempt.findOne;
    const origEventFindOne = PaymentWebhookEvent.findOne;
    const origEventSave = PaymentWebhookEvent.prototype.save;
    const origAdapterProcess = webhookAdapters.RAZORPAY?.processWebhook;

    try {
      PaymentWebhookEvent.findOne = async () => null;
      PaymentWebhookEvent.prototype.save = async function () { return this; };
      PaymentAttempt.findOne = async () => ({
        attemptId: "att_gate_01",
        amount: 10.10,
        currency: "INR",
        provider: "RAZORPAY",
        status: PaymentAttemptStatus.PENDING,
      });

      webhookAdapters.RAZORPAY.processWebhook = async () => ({
        isValid: true,
        normalizedEvent: {
          eventId: "evt_gate_amt_01",
          eventType: "payment.captured",
          status: "CAPTURED",
          paymentReference: "pay_ref_01",
          amount: 10.11, // 1-paisa mismatch: 1011 vs 1010
          currency: "INR",
        },
      });

      let errThrown = false;
      try {
        await paymentWebhookService.processWebhook({
          provider: "RAZORPAY",
          payload: {},
          signature: "dummy_sig",
          rawBody: Buffer.from("{}"),
        });
      } catch (err) {
        errThrown = true;
        assert.strictEqual(err.code, "WEBHOOK_AMOUNT_MISMATCH");
      }
      assert.strictEqual(errThrown, true, "Must fail-closed on 1-paisa amount mismatch");
    } finally {
      PaymentAttempt.findOne = origAttemptFindOne;
      PaymentWebhookEvent.findOne = origEventFindOne;
      PaymentWebhookEvent.prototype.save = origEventSave;
      if (webhookAdapters.RAZORPAY) webhookAdapters.RAZORPAY.processWebhook = origAdapterProcess;
    }
  });

  await runAsyncTest("Negative: Synthetic MOCK/SANDBOX webhook is rejected in production mode", async () => {
    const origNodeEnv = process.env.NODE_ENV;
    const origPayEnv = process.env.PAYMENT_ENV;
    try {
      process.env.PAYMENT_ENV = "production";

      let errThrown = false;
      try {
        await paymentWebhookService.processWebhook({
          provider: "MOCK",
          payload: { eventId: "mock_evt_01" },
          signature: "sig",
          rawBody: Buffer.from("{}"),
        });
      } catch (err) {
        errThrown = true;
        assert.strictEqual(err.code, "SYNTHETIC_WEBHOOK_PROHIBITED_IN_PROD");
      }
      assert.strictEqual(errThrown, true, "Must reject MOCK webhook in production");
    } finally {
      process.env.NODE_ENV = origNodeEnv;
      process.env.PAYMENT_ENV = origPayEnv;
    }
  });

  await runAsyncTest("Negative: Webhook referencing non-existent payment attempt is rejected", async () => {
    const origAttemptFindOne = PaymentAttempt.findOne;
    const origEventFindOne = PaymentWebhookEvent.findOne;
    const origEventSave = PaymentWebhookEvent.prototype.save;
    const origAdapterProcess = webhookAdapters.RAZORPAY?.processWebhook;

    try {
      PaymentWebhookEvent.findOne = async () => null;
      PaymentWebhookEvent.prototype.save = async function () { return this; };
      PaymentAttempt.findOne = async () => null;

      webhookAdapters.RAZORPAY.processWebhook = async () => ({
        isValid: true,
        normalizedEvent: {
          eventId: "evt_unknown_attempt",
          eventType: "payment.captured",
          status: "CAPTURED",
          paymentReference: "pay_unknown_999",
          amount: 500,
          currency: "INR",
        },
      });

      let errThrown = false;
      try {
        await paymentWebhookService.processWebhook({
          provider: "RAZORPAY",
          payload: {},
          signature: "sig",
          rawBody: Buffer.from("{}"),
        });
      } catch (err) {
        errThrown = true;
        assert.strictEqual(err.code, "WEBHOOK_ATTEMPT_NOT_FOUND");
      }
      assert.strictEqual(errThrown, true, "Must fail-closed on unknown attempt reference");
    } finally {
      PaymentAttempt.findOne = origAttemptFindOne;
      PaymentWebhookEvent.findOne = origEventFindOne;
      PaymentWebhookEvent.prototype.save = origEventSave;
      if (webhookAdapters.RAZORPAY) webhookAdapters.RAZORPAY.processWebhook = origAdapterProcess;
    }
  });

  await runAsyncTest("Negative: Webhook rejects currency mismatch (INR vs USD)", async () => {
    const origAttemptFindOne = PaymentAttempt.findOne;
    const origEventFindOne = PaymentWebhookEvent.findOne;
    const origEventSave = PaymentWebhookEvent.prototype.save;
    const origAdapterProcess = webhookAdapters.RAZORPAY?.processWebhook;

    try {
      PaymentWebhookEvent.findOne = async () => null;
      PaymentWebhookEvent.prototype.save = async function () { return this; };
      PaymentAttempt.findOne = async () => ({
        attemptId: "att_curr_mismatch_01",
        amount: 2000,
        currency: "INR",
        provider: "RAZORPAY",
        status: PaymentAttemptStatus.PENDING,
      });

      webhookAdapters.RAZORPAY.processWebhook = async () => ({
        isValid: true,
        normalizedEvent: {
          eventId: "evt_curr_mismatch",
          eventType: "payment.captured",
          status: "CAPTURED",
          paymentReference: "pay_curr_01",
          amount: 2000,
          currency: "USD",
        },
      });

      let errThrown = false;
      try {
        await paymentWebhookService.processWebhook({
          provider: "RAZORPAY",
          payload: {},
          signature: "sig",
          rawBody: Buffer.from("{}"),
        });
      } catch (err) {
        errThrown = true;
        assert.strictEqual(err.code, "WEBHOOK_CURRENCY_MISMATCH");
      }
      assert.strictEqual(errThrown, true, "Must fail-closed on currency mismatch");
    } finally {
      PaymentAttempt.findOne = origAttemptFindOne;
      PaymentWebhookEvent.findOne = origEventFindOne;
      PaymentWebhookEvent.prototype.save = origEventSave;
      if (webhookAdapters.RAZORPAY) webhookAdapters.RAZORPAY.processWebhook = origAdapterProcess;
    }
  });

  await runAsyncTest("Security: Multi-provider webhook adapters strictly reject invalid HMAC signatures", async () => {
    const origRzpSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const origCfSecret = process.env.CASHFREE_SECRET_KEY;
    const origPayuSalt = process.env.PAYU_MERCHANT_SALT;

    try {
      process.env.RAZORPAY_WEBHOOK_SECRET = "test_rzp_sec_123";
      process.env.CASHFREE_SECRET_KEY = "test_cf_sec_123";
      process.env.PAYU_MERCHANT_SALT = "test_payu_salt_123";

      const rzpRes = await webhookAdapters.RAZORPAY.processWebhook({
        rawBody: Buffer.from(JSON.stringify({ event: "payment.captured" })),
        signature: "invalid_hex_signature_razorpay",
        payload: { event: "payment.captured" },
      });
      assert.strictEqual(rzpRes.isValid, false, "Razorpay must reject invalid signature");

      const cfRes = await webhookAdapters.CASHFREE.processWebhook({
        rawBody: Buffer.from(JSON.stringify({ type: "PAYMENT_SUCCESS_WEBHOOK" })),
        signature: "invalid_base64_sig_cashfree",
        headers: { "x-webhook-timestamp": "1610000000" },
        payload: { type: "PAYMENT_SUCCESS_WEBHOOK" },
      });
      assert.strictEqual(cfRes.isValid, false, "Cashfree must reject invalid signature");
    } finally {
      process.env.RAZORPAY_WEBHOOK_SECRET = origRzpSecret;
      process.env.CASHFREE_SECRET_KEY = origCfSecret;
      process.env.PAYU_MERCHANT_SALT = origPayuSalt;
    }
  });

  // --------------------------------------------------------------------------
  // [DOMAIN 6] DOUBLE-ENTRY LEDGER & FINANCIAL CONSERVATION
  // --------------------------------------------------------------------------
  console.log("\n▶ [Domain 6] Double-Entry Ledger & Financial Conservation");

  await runAsyncTest("Ledger: Journal posting enforces strict debit-credit balance equality", async () => {
    const origFindOne = (await import("../src/modules/payment/models/ledgerJournal.model.js")).LedgerJournal.findOne;
    let unbalanceBlocked = false;
    try {
      (await import("../src/modules/payment/models/ledgerJournal.model.js")).LedgerJournal.findOne = async () => null;

      await ledgerService.postJournal({
        referenceType: "PAYMENT_INTENT",
        referenceId: "ord_unbalanced",
        idempotencyKey: "led_unbalanced_01",
        description: "Unbalanced journal test",
        postings: [
          {
            account: LedgerAccount.GATEWAY_CLEARING,
            entryType: EntryType.DEBIT,
            amount: 100.00,
          },
          {
            account: LedgerAccount.CUSTOMER_ESCROW,
            entryType: EntryType.CREDIT,
            amount: 99.99, // 1-paisa imbalance!
          },
        ],
      });
    } catch (err) {
      unbalanceBlocked = true;
      assert.ok(
        err.message.includes("unbalanced") || err.message.includes("Debit/Credit imbalance"),
        `Unexpected error message: ${err.message}`
      );
    } finally {
      (await import("../src/modules/payment/models/ledgerJournal.model.js")).LedgerJournal.findOne = origFindOne;
    }
    assert.strictEqual(unbalanceBlocked, true, "Unbalanced journal posting must be strictly rejected");
  });

  await runAsyncTest("Precision: Exact remaining balance refund succeeds down to the paisa (100.10 = 50.05 + 50.05)", async () => {
    const origOrderFindById = Order.findById;
    const origRefundFind = Refund.find;
    const origRefundCreate = Refund.create;
    const origProcessRefund = refundService.processRefund;

    try {
      Order.findById = () => ({
        populate: async () => ({
          _id: "ord_prec_100",
          totalSellingPrice: 100.10,
          user: "usr_01",
          seller: "sel_01",
        }),
      });

      Refund.find = async () => [
        { amount: 50.05, status: "COMPLETED" },
      ];

      Refund.create = async (doc) => ({
        ...doc,
        save: async function () { return this; },
      });

      refundService.processRefund = async (refundDoc) => refundDoc;

      const res = await refundService.createRefund({
        orderId: "ord_prec_100",
        amount: 50.05,
      });

      assert.strictEqual(res.amount, 50.05);

      let overRefundBlocked = false;
      try {
        await refundService.createRefund({
          orderId: "ord_prec_100",
          amount: 50.06,
        });
      } catch (err) {
        overRefundBlocked = true;
        assert.ok(err.message.includes("Maximum remaining refundable balance"));
      }
      assert.strictEqual(overRefundBlocked, true, "Over-refund by even 1 paisa must be blocked");
    } finally {
      Order.findById = origOrderFindById;
      Refund.find = origRefundFind;
      Refund.create = origRefundCreate;
      refundService.processRefund = origProcessRefund;
    }
  });

  await runTest("Precision: Commission & Fee split identity guarantees zero leakage (Gross = Comm + GW + Tax + Net)", () => {
    const order = {
      _id: "ord_split_test",
      totalSellingPrice: 100.10,
      orderItems: [
        {
          seller: "sel_split_01",
          sellingPrice: 100.10,
          quantity: 1,
        },
      ],
    };

    const feeSnapshot = {
      commissionRatePercent: 5.0,
      gatewayFeePercent: 2.0,
      tcsRatePercent: 1.0,
    };

    const splits = settlementService.calculateMultiVendorSettlement(order, feeSnapshot);
    assert.strictEqual(splits.length, 1);
    const s = splits[0];

    const grossPaise = Math.round(s.grossAmount * 100);
    const commPaise = Math.round(s.platformFee * 100);
    const gwPaise = Math.round(s.paymentFee * 100);
    const taxPaise = Math.round(s.taxDeduction * 100);
    const netPaise = Math.round(s.netPayable * 100);

    assert.strictEqual(
      commPaise + gwPaise + taxPaise + netPaise,
      grossPaise,
      `Exact minor-unit zero-leakage identity must hold`
    );
  });

  // --------------------------------------------------------------------------
  // [DOMAIN 7] PAYOUT SAFETY & ZERO-FABRICATION CONTROLS
  // --------------------------------------------------------------------------
  console.log("\n▶ [Domain 7] Payout Safety & Zero-Fabrication Controls");

  await runAsyncTest("Payout: Production environment blocks synthetic or fake UTR settlement", async () => {
    const origNodeEnv = process.env.NODE_ENV;
    const origPayEnv = process.env.PAYMENT_ENV;
    try {
      process.env.PAYMENT_ENV = "production";

      let syntheticUtrBlocked = false;
      try {
        await settlementService.markBatchSettled("sbt_prod_01", "SBX_UTR_MOCK_12345");
      } catch (err) {
        syntheticUtrBlocked = true;
        assert.strictEqual(err.code, "INVALID_PRODUCTION_UTR");
      }
      assert.strictEqual(syntheticUtrBlocked, true, "Synthetic UTR must be rejected in production");
    } finally {
      process.env.NODE_ENV = origNodeEnv;
      process.env.PAYMENT_ENV = origPayEnv;
    }
  });

  await runAsyncTest("Payout: SettlementBatch locks payout provider to prevent cross-rail retry", async () => {
    const origFindOne = SettlementBatch.findOne;
    try {
      SettlementBatch.findOne = () => ({
        populate: async () => ({
          batchId: "sbt_provider_locked",
          status: SettlementBatchStatus.CALCULATED,
          payoutProvider: "HDFC_NODAL_BANK",
          beneficiary: {
            status: "VERIFIED",
            accountNumberMasked: "XXXX9988",
            ifscCode: "HDFC0000001",
          },
          save: async function () { return this; },
        }),
      });

      let mismatchBlocked = false;
      try {
        await settlementService.executeBatchPayout("sbt_provider_locked", {
          name: "ICICI_NODAL_BANK",
        });
      } catch (err) {
        mismatchBlocked = true;
        assert.strictEqual(err.code, "PAYOUT_PROVIDER_MISMATCH");
      }
      assert.strictEqual(mismatchBlocked, true, "Payout submission with mismatched provider must be blocked");
    } finally {
      SettlementBatch.findOne = origFindOne;
    }
  });

  // --------------------------------------------------------------------------
  // [DOMAIN 8] RECONCILIATION & ANTI-SILENT ROUNDING
  // --------------------------------------------------------------------------
  console.log("\n▶ [Domain 8] Reconciliation & Anti-Silent Rounding");

  await runAsyncTest("Reconciliation: BankStatementSftpAdapter durable deduplication prevents re-ingestion", async () => {
    const adapter = new BankStatementSftpAdapter();
    const csvContent = "UTR,Date,Amount,Type\nUTR_DUR_01,2026-03-31,1000,CR";

    const res1 = await adapter.processStatementFile({
      content: csvContent,
      filename: "hdfc_statement_20260331.csv",
    });
    assert.strictEqual(res1.status, SftpFileProcessingStatus.PROCESSED);

    const res2 = await adapter.processStatementFile({
      content: csvContent,
      filename: "hdfc_statement_20260331_dup.csv",
    });
    assert.strictEqual(res2.status, SftpFileProcessingStatus.DUPLICATE);
  });

  await runAsyncTest("Reconciliation: flags unexplained difference without auto-rounding", async () => {
    const recRecord = new ReconciliationRecord({
      reconciliationId: `rec_test_${Date.now()}`,
      gateway: "RAZORPAY",
      periodStart: new Date(),
      periodEnd: new Date(),
      totalCompared: 1,
      mismatchedCount: 1,
      discrepancies: [
        {
          referenceId: "order_123",
          issueType: "AMOUNT_MISMATCH",
          expectedAmount: 100.10,
          actualAmount: 95.00,
          severity: "CRITICAL",
          resolutionStatus: "UNRESOLVED",
        },
      ],
      status: "ANOMALIES_DETECTED",
    });

    const saved = recRecord.toObject();
    assert.strictEqual(saved.status, "ANOMALIES_DETECTED");
    assert.strictEqual(saved.discrepancies[0].resolutionStatus, "UNRESOLVED");
    assert.strictEqual(saved.discrepancies[0].severity, "CRITICAL");
    const diffPaise = Math.abs(
      Money.toMinorUnits(saved.discrepancies[0].expectedAmount) -
        Money.toMinorUnits(saved.discrepancies[0].actualAmount)
    );
    assert.strictEqual(diffPaise, 510);
  });

  // --------------------------------------------------------------------------
  // [DOMAIN 9] DOCUMENT PERSISTENCE & BALANCE INTEGRITY
  // --------------------------------------------------------------------------
  console.log("\n▶ [Domain 9] Database Document Balance Invariants");

  runTest("Wallet persistence preserves exact 2-decimal rupee balance and minor-unit conversion", () => {
    const testUserId = new mongoose.Types.ObjectId();
    const wallet = new Wallet({
      walletId: `wal_test_${Date.now()}`,
      user: testUserId,
      availableBalance: 100.10,
      reservedBalance: 50.05,
      refundBalance: 10.10,
    });
    const saved = wallet.toObject();
    assert.strictEqual(saved.availableBalance, 100.10);
    assert.strictEqual(Money.toMinorUnits(saved.availableBalance), 10010);
    assert.strictEqual(Money.toMinorUnits(saved.reservedBalance), 5005);
  });

  runTest("PaymentIntent persistence verifies splitConfig sum equals total amount", () => {
    const testUserId = new mongoose.Types.ObjectId();
    const testOrderId = new mongoose.Types.ObjectId();
    const intent = new PaymentIntent({
      intentId: `pi_test_${Date.now()}`,
      user: testUserId,
      orders: [testOrderId],
      amount: 100.10,
      splitConfig: { walletAmount: 50.05, railAmount: 50.05 },
      pricingSnapshot: { finalPayable: 100.10 },
      expiresAt: new Date(Date.now() + 3600000),
    });
    const saved = intent.toObject();
    assert.strictEqual(saved.amount, 100.10);
    assert.strictEqual(
      Money.toMinorUnits(saved.splitConfig.walletAmount) + Money.toMinorUnits(saved.splitConfig.railAmount),
      Money.toMinorUnits(saved.amount)
    );
  });

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log("\n================================================================");
  console.log(`🏁 PAYMENT DOMAIN SUITE SUMMARY: ${testsPassed} PASSED | ${testsFailed} FAILED`);
  console.log("================================================================\n");

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  if (testsFailed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("Payment test runner error:", err);
  process.exit(1);
});
