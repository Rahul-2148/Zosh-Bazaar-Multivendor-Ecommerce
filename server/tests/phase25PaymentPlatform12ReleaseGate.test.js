/**
 * ==============================================================================
 * ZOSH BAZAAR — PAYMENT PLATFORM 12.0
 * FINAL CRITICAL-FIX VERIFICATION, SECURITY REGRESSION & RELEASE GATE TEST SUITE
 * ==============================================================================
 * Independent verification of all critical fixes, invariants, money precision,
 * webhook security, ledger atomicity, and payout safety controls.
 * ==============================================================================
 */

import assert from "assert";
import crypto from "crypto";
import dotenv from "dotenv";
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
import PaymentAttemptStatus from "../src/modules/payment/domain/PaymentAttemptStatus.js";
import OrderStatus from "../src/domain/OrderStatus.js";
import PaymentStatus from "../src/domain/PaymentStatus.js";
import { Order } from "../src/models/order.model.js";
import { Refund } from "../src/modules/payment/models/refund.model.js";
import { SellerBeneficiary, BeneficiaryStatus } from "../src/modules/payment/models/sellerBeneficiary.model.js";
import ledgerService from "../src/modules/payment/services/LedgerService.js";
import LedgerAccount, { EntryType } from "../src/modules/payment/domain/LedgerAccount.js";
import { webhookAdapters } from "../src/modules/payment/adapters/webhook/ProviderWebhookAdapter.js";

dotenv.config();

console.log("================================================================");
console.log("🛡️  ZOSH BAZAAR — PAYMENT PLATFORM 12.0 PRODUCTION RELEASE GATE");
console.log("================================================================");

let testsPassed = 0;
let testsFailed = 0;
const testRecords = [];

async function runTest(desc, fn) {
  try {
    await fn();
    console.log(`  ✅ PASS: ${desc}`);
    testsPassed++;
    testRecords.push({ desc, status: "PASS" });
  } catch (err) {
    console.error(`  ❌ FAIL: ${desc}`);
    console.error(`     Error: ${err.message}`);
    testsFailed++;
    testRecords.push({ desc, status: "FAIL", error: err.message });
  }
}

async function runSuite() {
  // ----------------------------------------------------------------------
  // 1. INDEPENDENT NEGATIVE REGRESSION VERIFICATION OF ALL 11.0 CRITICAL FIXES
  // ----------------------------------------------------------------------
  console.log("\n▶ [Section 1] Negative Regression Tests for 11.0 Fixes");

  await runTest("Negative: Webhook rejects minor-unit amount mismatch (e.g., 10.10 vs 10.11)", async () => {
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

  await runTest("Negative: Synthetic MOCK/SANDBOX webhook is rejected in production mode", async () => {
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

      errThrown = false;
      try {
        await paymentWebhookService.processWebhook({
          provider: "SANDBOX",
          payload: { eventId: "sbx_evt_01" },
          signature: "sig",
          rawBody: Buffer.from("{}"),
        });
      } catch (err) {
        errThrown = true;
        assert.strictEqual(err.code, "SYNTHETIC_WEBHOOK_PROHIBITED_IN_PROD");
      }
      assert.strictEqual(errThrown, true, "Must reject SANDBOX webhook in production");
    } finally {
      process.env.NODE_ENV = origNodeEnv;
      process.env.PAYMENT_ENV = origPayEnv;
    }
  });

  await runTest("Negative: Webhook referencing non-existent payment attempt is rejected", async () => {
    const origAttemptFindOne = PaymentAttempt.findOne;
    const origEventFindOne = PaymentWebhookEvent.findOne;
    const origEventSave = PaymentWebhookEvent.prototype.save;
    const origAdapterProcess = webhookAdapters.RAZORPAY?.processWebhook;

    try {
      PaymentWebhookEvent.findOne = async () => null;
      PaymentWebhookEvent.prototype.save = async function () { return this; };
      PaymentAttempt.findOne = async () => null; // Not found!

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

  await runTest("Negative: Webhook rejects currency mismatch (e.g., attempt INR vs webhook USD)", async () => {
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
          currency: "USD", // Mismatched!
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

  await runTest("Negative: Webhook rejects provider mismatch (attempt CASHFREE vs webhook via RAZORPAY)", async () => {
    const origAttemptFindOne = PaymentAttempt.findOne;
    const origEventFindOne = PaymentWebhookEvent.findOne;
    const origEventSave = PaymentWebhookEvent.prototype.save;
    const origAdapterProcess = webhookAdapters.RAZORPAY?.processWebhook;

    try {
      PaymentWebhookEvent.findOne = async () => null;
      PaymentWebhookEvent.prototype.save = async function () { return this; };
      PaymentAttempt.findOne = async () => ({
        attemptId: "att_prov_mismatch_01",
        amount: 500,
        currency: "INR",
        provider: "CASHFREE", // Bound to CASHFREE!
        status: PaymentAttemptStatus.PENDING,
      });

      webhookAdapters.RAZORPAY.processWebhook = async () => ({
        isValid: true,
        normalizedEvent: {
          eventId: "evt_prov_mismatch",
          eventType: "payment.captured",
          status: "CAPTURED",
          paymentReference: "pay_prov_01",
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
        assert.strictEqual(err.code, "WEBHOOK_PROVIDER_MISMATCH");
      }
      assert.strictEqual(errThrown, true, "Must fail-closed on provider mismatch");
    } finally {
      PaymentAttempt.findOne = origAttemptFindOne;
      PaymentWebhookEvent.findOne = origEventFindOne;
      PaymentWebhookEvent.prototype.save = origEventSave;
      if (webhookAdapters.RAZORPAY) webhookAdapters.RAZORPAY.processWebhook = origAdapterProcess;
    }
  });

  await runTest("Negative: Shipping unpaid prepaid order is blocked", async () => {
    const origFindById = Order.findById;
    try {
      Order.findById = () => ({
        populate: async () => ({
          _id: "ord_unpaid_prepaid",
          orderStatus: OrderStatus.CONFIRMED,
          paymentStatus: PaymentStatus.PENDING,
          paymentMethod: "RAZORPAY", // Prepaid!
          orderItems: [],
        }),
      });

      let errThrown = false;
      try {
        await OrderService.updateOrderStatus("ord_unpaid_prepaid", OrderStatus.SHIPPED);
      } catch (err) {
        errThrown = true;
        assert.strictEqual(err.code, "ORDER_PAYMENT_UNCONFIRMED");
      }
      assert.strictEqual(errThrown, true, "Prepaid order cannot be shipped prior to capture");
    } finally {
      Order.findById = origFindById;
    }
  });

  await runTest("Negative: Payout execution rejects dummy or unverified beneficiary", async () => {
    const origBatchFindOne = SettlementBatch.findOne;
    try {
      SettlementBatch.findOne = () => ({
        populate: async () => ({
          batchId: "sbt_unverified_ben",
          seller: "sel_123",
          netPayable: 10000,
          currency: "INR",
          status: SettlementBatchStatus.CALCULATED,
          beneficiary: {
            status: "PENDING_VERIFICATION", // Unverified!
            accountNumberMasked: "XXXX1234",
            ifscCode: "HDFC0001234",
          },
          save: async function () { return this; },
        }),
      });

      let errThrown = false;
      try {
        await settlementService.executeBatchPayout("sbt_unverified_ben");
      } catch (err) {
        errThrown = true;
        assert.strictEqual(err.code, "BENEFICIARY_NOT_VERIFIED");
      }
      assert.strictEqual(errThrown, true, "Must fail-closed when beneficiary is unverified");
    } finally {
      SettlementBatch.findOne = origBatchFindOne;
    }
  });

  await runTest("Negative: Maker-checker prevents same operator self-approving critical discrepancy", async () => {
    const origRecFindOne = ReconciliationRecord.findOne;
    try {
      ReconciliationRecord.findOne = async () => ({
        reconciliationId: "rec_mc_test",
        discrepancies: [
          {
            referenceId: "anom_01",
            severity: "CRITICAL",
            resolved: false,
            auditTrail: [],
          },
        ],
        save: async function () { return this; },
      });

      let errThrown = false;
      try {
        await reconciliationService.resolveDiscrepancy({
          reconciliationId: "rec_mc_test",
          referenceId: "anom_01",
          reason: "Authoritative manual bank adjustment verified with external statement",
          operatorId: "OPERATOR_ALICE",
          checkerId: "OPERATOR_ALICE", // Self-approval conflict!
        });
      } catch (err) {
        errThrown = true;
        assert.strictEqual(err.code, "MAKER_CHECKER_CONFLICT");
      }
      assert.strictEqual(errThrown, true, "Self-approval of CRITICAL discrepancy must be blocked");
    } finally {
      ReconciliationRecord.findOne = origRecFindOne;
    }
  });

  await runTest("Negative: Provider failover blocked while prior attempt is active", async () => {
    const origGetIntent = (await import("../src/modules/payment/services/PaymentIntentService.js")).default.getIntentById;
    const origFindAttempts = PaymentAttempt.find;
    const origRecover = paymentOrchestratorService.checkAndRecoverAttemptStatus;

    try {
      (await import("../src/modules/payment/services/PaymentIntentService.js")).default.getIntentById = async () => ({
        intentId: "int_failover_test",
        amount: 2500,
        currency: "INR",
        status: "PROCESSING",
        selectedMethod: { rail: "UPI" },
      });

      PaymentAttempt.find = async () => [
        {
          attemptId: "att_prior_active",
          intentId: "int_failover_test",
          provider: "RAZORPAY",
          status: PaymentAttemptStatus.PENDING, // Active on RAZORPAY!
        },
      ];

      paymentOrchestratorService.checkAndRecoverAttemptStatus = async () => ({
        status: PaymentAttemptStatus.PENDING,
      });

      let errThrown = false;
      try {
        await paymentOrchestratorService.submitPaymentAttempt({
          intentId: "int_failover_test",
          method: "UPI",
          metadata: { preferredProvider: "CASHFREE" },
        });
      } catch (err) {
        errThrown = true;
        assert.strictEqual(err.code, "FAILOVER_BLOCKED_UNCONFIRMED_ATTEMPT");
      }
      assert.strictEqual(errThrown, true, "Failover to CASHFREE must be blocked while RAZORPAY attempt is pending");
    } finally {
      (await import("../src/modules/payment/services/PaymentIntentService.js")).default.getIntentById = origGetIntent;
      PaymentAttempt.find = origFindAttempts;
      paymentOrchestratorService.checkAndRecoverAttemptStatus = origRecover;
    }
  });

  // ----------------------------------------------------------------------
  // 2. MONEY PRECISION REVALIDATION
  // ----------------------------------------------------------------------
  console.log("\n▶ [Section 2] Money Precision Revalidation");

  const precisionCases = [
    { name: "₹0.01 (Minimum Paisa)", amount: 0.01, expectedMinor: 1 },
    { name: "₹0.10 (Ten Paise)", amount: 0.10, expectedMinor: 10 },
    { name: "₹10.10 (Ten Rupees Ten Paise)", amount: 10.10, expectedMinor: 1010 },
    { name: "₹50.05 (Fifty Rupees Five Paise)", amount: 50.05, expectedMinor: 5005 },
    { name: "₹100.10 (Hundred Rupees Ten Paise)", amount: 100.10, expectedMinor: 10010 },
    { name: "₹99,999,999.99 (Upper Bound INR)", amount: 99999999.99, expectedMinor: 9999999999 },
  ];

  for (const testCase of precisionCases) {
    await runTest(`Precision: ${testCase.name} converts accurately to minor units without loss`, async () => {
      const minor = Math.round(testCase.amount * 100);
      assert.strictEqual(minor, testCase.expectedMinor);
      const backToMajor = minor / 100;
      assert.strictEqual(backToMajor, testCase.amount);
    });
  }

  await runTest("Precision: Exact remaining balance refund succeeds down to the paisa (100.10 = 50.05 + 50.05)", async () => {
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

      // Simulating first refund of 50.05 already completed
      Refund.find = async () => [
        { amount: 50.05, status: "COMPLETED" },
      ];

      Refund.create = async (doc) => ({
        ...doc,
        save: async function () { return this; },
      });

      refundService.processRefund = async (refundDoc) => refundDoc;

      // Requesting exact remaining balance of 50.05
      const res = await refundService.createRefund({
        orderId: "ord_prec_100",
        amount: 50.05,
      });

      assert.strictEqual(res.amount, 50.05);

      // Attempting 1 paisa over remaining balance (50.06) must fail
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

  await runTest("Precision: Commission & Fee split identity guarantees zero leakage (Gross = Comm + GW + Tax + Net)", async () => {
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
      commissionRatePercent: 5.0, // 5%
      gatewayFeePercent: 2.0,    // 2%
      tcsRatePercent: 1.0,       // 1%
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
      `Exact minor-unit zero-leakage identity must hold: ${commPaise} + ${gwPaise} + ${taxPaise} + ${netPaise} === ${grossPaise}`
    );
  });

  // ----------------------------------------------------------------------
  // 3. LEDGER & TRANSACTION ATOMICITY
  // ----------------------------------------------------------------------
  console.log("\n▶ [Section 3] Ledger & Transaction Atomicity");

  await runTest("Ledger: Journal posting enforces strict debit-credit balance equality", async () => {
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
            amount: 99.99, // 1-paisa unbalance!
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

  await runTest("Ledger: Duplicate journal posting returns existing entry idempotently", async () => {
    const origFindOne = (await import("../src/modules/payment/models/ledgerJournal.model.js")).LedgerJournal.findOne;
    try {
      const mockExistingJournal = {
        journalId: "jrn_existing_123",
        idempotencyKey: "led_idemp_key_01",
        referenceType: "PAYMENT_INTENT",
        referenceId: "ord_idemp_01",
        status: "POSTED",
      };

      (await import("../src/modules/payment/models/ledgerJournal.model.js")).LedgerJournal.findOne = async () => mockExistingJournal;

      const result = await ledgerService.postJournal({
        referenceType: "PAYMENT_INTENT",
        referenceId: "ord_idemp_01",
        idempotencyKey: "led_idemp_key_01",
        description: "Idempotent retry",
        postings: [
          { account: LedgerAccount.GATEWAY_CLEARING, entryType: EntryType.DEBIT, amount: 100 },
          { account: LedgerAccount.CUSTOMER_ESCROW, entryType: EntryType.CREDIT, amount: 100 },
        ],
      });

      assert.strictEqual(result.journal?.journalId, "jrn_existing_123");
      assert.strictEqual(result.alreadyPosted, true);
    } finally {
      (await import("../src/modules/payment/models/ledgerJournal.model.js")).LedgerJournal.findOne = origFindOne;
    }
  });

  // ----------------------------------------------------------------------
  // 4. PAYOUT SAFETY & ZERO-FABRICATION CONTROLS
  // ----------------------------------------------------------------------
  console.log("\n▶ [Section 4] Payout Safety & Zero-Fabrication Controls");

  await runTest("Payout: Production environment blocks synthetic or fake UTR settlement", async () => {
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

  await runTest("Payout: SettlementBatch locks payout provider to prevent cross-rail retry", async () => {
    const origFindOne = SettlementBatch.findOne;
    try {
      SettlementBatch.findOne = () => ({
        populate: async () => ({
          batchId: "sbt_provider_locked",
          status: SettlementBatchStatus.CALCULATED,
          payoutProvider: "HDFC_NODAL_BANK", // Already locked to HDFC!
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
          name: "ICICI_NODAL_BANK", // Trying to execute via ICICI!
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

  await runTest("Payout: Ambiguous timeout recovers to STATUS_CHECK_REQUIRED (no blind retry)", async () => {
    const origFindOne = SettlementBatch.findOne;
    try {
      SettlementBatch.findOne = () => ({
        populate: async () => ({
          batchId: "sbt_timeout_batch",
          status: SettlementBatchStatus.CALCULATED,
          beneficiary: {
            status: "VERIFIED",
            accountNumberMasked: "XXXX9988",
            ifscCode: "HDFC0000001",
          },
          save: async function () { return this; },
        }),
      });

      const failingAdapter = {
        name: "BANK_PAYOUT_ADAPTER",
        createPayout: async () => {
          throw new Error("ETIMEDOUT: Connection reset by peer after payout dispatch");
        },
      };

      const result = await settlementService.executeBatchPayout("sbt_timeout_batch", failingAdapter);
      assert.strictEqual(result.status, SettlementBatchStatus.STATUS_CHECK_REQUIRED);
      assert.ok(result.batch.holdReason.includes("AMBIGUOUS_TIMEOUT"));
    } finally {
      SettlementBatch.findOne = origFindOne;
    }
  });

  // ----------------------------------------------------------------------
  // 5. SECURITY & ACCESS CONTROL VERIFICATION
  // ----------------------------------------------------------------------
  console.log("\n▶ [Section 5] Security & Access Control Verification");

  await runTest("Security: Client GET callback cannot capture payment without gateway authoritative proof", async () => {
    const origAttemptFindOne = PaymentAttempt.findOne;
    const origRecover = paymentOrchestratorService.checkAndRecoverAttemptStatus;

    try {
      PaymentAttempt.findOne = async () => ({
        attemptId: "att_unconfirmed_01",
        providerReference: "pay_client_unconfirmed",
        status: PaymentAttemptStatus.PENDING,
      });

      // Gateway inquiry confirms still PENDING
      paymentOrchestratorService.checkAndRecoverAttemptStatus = async () => ({
        status: PaymentAttemptStatus.PENDING,
      });

      const req = {
        params: { paymentId: "pay_client_unconfirmed" },
        query: {},
      };

      let statusCode = null;
      let jsonBody = null;
      const res = {
        status: (code) => {
          statusCode = code;
          return {
            json: (body) => {
              jsonBody = body;
              return body;
            },
          };
        },
      };

      const { default: controller } = await import("../src/modules/payment/controllers/payment.controller.js");
      await controller.handleLegacyVerification(req, res, () => {});

      assert.strictEqual(statusCode, 400);
      assert.strictEqual(jsonBody.success, false);
      assert.ok(jsonBody.message.includes("Payment is not captured"));
    } finally {
      PaymentAttempt.findOne = origAttemptFindOne;
      paymentOrchestratorService.checkAndRecoverAttemptStatus = origRecover;
    }
  });

  await runTest("Ledger: Lost chargeback resolution debits SELLER_RESERVE to balance platform dispute account", async () => {
    const origRefundFindOne = Refund.findOne;
    const origPostJournal = ledgerService.postJournal;
    let capturedPostings = null;

    try {
      Refund.findOne = async () => ({
        refundId: "cb_lost_test_01",
        order: "ord_cb_01",
        amount: 2500,
        status: "CHARGEBACK_OPEN",
        statusHistory: [],
        save: async function () { return this; },
      });

      ledgerService.postJournal = async (params) => {
        capturedPostings = params.postings;
        return { journalId: "jnl_cb_lost_01", status: "POSTED" };
      };

      await refundService.resolveChargeback({
        disputeReference: "disp_ref_123",
        outcome: "LOST", // Cardholder wins chargeback!
        sellerId: "seller_responsible_01",
        notes: "Bank confirmed chargeback lost to cardholder",
      });

      assert.ok(capturedPostings, "Journal postings must be generated for lost chargeback");
      const sellerDebit = capturedPostings.find(
        (p) => p.account === LedgerAccount.SELLER_RESERVE && p.entryType === EntryType.DEBIT
      );
      assert.ok(sellerDebit, "Must debit SELLER_RESERVE to offset platform liability");
      assert.strictEqual(sellerDebit.amount, 2500);

      // Verify that total debits equal total credits
      const debits = capturedPostings.filter((p) => p.entryType === EntryType.DEBIT).reduce((s, p) => s + p.amount, 0);
      const credits = capturedPostings.filter((p) => p.entryType === EntryType.CREDIT).reduce((s, p) => s + p.amount, 0);
      assert.strictEqual(debits, credits, "Chargeback journal must be balanced");
    } finally {
      Refund.findOne = origRefundFindOne;
      ledgerService.postJournal = origPostJournal;
    }
  });

  await runTest("Reconciliation: BankStatementSftpAdapter durable deduplication prevents re-ingestion", async () => {
    const adapter = new BankStatementSftpAdapter();
    const csvContent = "UTR,Date,Amount,Type\nUTR_DUR_01,2026-03-31,1000,CR";

    const res1 = await adapter.processStatementFile({
      content: csvContent,
      filename: "hdfc_statement_20260331.csv",
    });
    assert.strictEqual(res1.status, SftpFileProcessingStatus.PROCESSED);

    // Duplicate submission
    const res2 = await adapter.processStatementFile({
      content: csvContent,
      filename: "hdfc_statement_20260331_dup.csv",
    });
    assert.strictEqual(res2.status, SftpFileProcessingStatus.DUPLICATE);
  });

  await runTest("Beneficiary: Schema defines compound unique index on seller and accountNumberToken", async () => {
    const indexes = SellerBeneficiary.schema.indexes();
    const hasUniqueTokenIndex = indexes.some(
      ([fields, options]) =>
        fields.seller === 1 && fields.accountNumberToken === 1 && options?.unique === true
    );
    assert.strictEqual(
      hasUniqueTokenIndex,
      true,
      "SellerBeneficiary must have unique compound index on { seller: 1, accountNumberToken: 1 }"
    );
  });

  await runTest("Security: Multi-provider webhook adapters strictly reject invalid HMAC signatures", async () => {
    const origRzpSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const origCfSecret = process.env.CASHFREE_SECRET_KEY;
    const origPayuSalt = process.env.PAYU_MERCHANT_SALT;

    try {
      process.env.RAZORPAY_WEBHOOK_SECRET = "test_rzp_sec_123";
      process.env.CASHFREE_SECRET_KEY = "test_cf_sec_123";
      process.env.PAYU_MERCHANT_SALT = "test_payu_salt_123";

      // 1. Razorpay invalid sig
      const rzpRes = await webhookAdapters.RAZORPAY.processWebhook({
        rawBody: Buffer.from(JSON.stringify({ event: "payment.captured" })),
        signature: "invalid_hex_signature_razorpay",
        payload: { event: "payment.captured" },
      });
      assert.strictEqual(rzpRes.isValid, false, "Razorpay must reject invalid signature");

      // 2. Cashfree invalid sig
      const cfRes = await webhookAdapters.CASHFREE.processWebhook({
        rawBody: Buffer.from(JSON.stringify({ type: "PAYMENT_SUCCESS_WEBHOOK" })),
        signature: "invalid_base64_sig_cashfree",
        headers: { "x-webhook-timestamp": "1610000000" },
        payload: { type: "PAYMENT_SUCCESS_WEBHOOK" },
      });
      assert.strictEqual(cfRes.isValid, false, "Cashfree must reject invalid signature");

      // 3. PayU invalid sig
      const payuRes = await webhookAdapters.PAYU.processWebhook({
        rawBody: Buffer.from(JSON.stringify({ status: "success", amount: 100 })),
        signature: "invalid_sha512_sig_payu",
        payload: { status: "success", amount: 100, txnid: "tx_01", key: "m_key" },
      });
      assert.strictEqual(payuRes.isValid, false, "PayU must reject invalid signature");
    } finally {
      process.env.RAZORPAY_WEBHOOK_SECRET = origRzpSecret;
      process.env.CASHFREE_SECRET_KEY = origCfSecret;
      process.env.PAYU_MERCHANT_SALT = origPayuSalt;
    }
  });

  // ----------------------------------------------------------------------
  // FINAL SUMMARY
  // ----------------------------------------------------------------------
  console.log("\n================================================================");
  console.log(`🏁 PLATFORM 12.0 RELEASE GATE SUITE SUMMARY: ${testsPassed} PASSED | ${testsFailed} FAILED`);
  console.log("================================================================\n");

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runSuite().catch((err) => {
  console.error("Fatal Test Suite Crash:", err);
  process.exit(1);
});
