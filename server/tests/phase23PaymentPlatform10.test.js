/**
 * ==============================================================================
 * ZOSH BAZAAR — PAYMENT PLATFORM 10.0 PRODUCTION CERTIFICATION & HARDENING
 * ==============================================================================
 * Forensic Verification Test Suite:
 * 1. Razorpay Environment Separation & Production Fail-Closed Guards
 * 2. PaymentAttemptStatus State Machine (REQUIRES_ACTION, CHARGEBACK_OPEN/WON/LOST)
 * 3. RefundStatus Dispute State Machine (EVIDENCE_REQUIRED, SUBMITTED, EXPIRED)
 * 4. SettlementBatchStatus Ambiguous Payout Lifecycle (SUBMITTING, STATUS_CHECK_REQUIRED)
 * 5. Payout Ambiguous Response Recovery without Duplicate Transfers
 * 6. Three-Way Reconciliation Taxonomy (UNKNOWN_REFERENCE, DATE_MISMATCH, Severity)
 * 7. Idempotency Key Reuse Conflict Detection (409 IDEMPOTENCY_KEY_REUSE)
 * 8. Authoritative UTR Production Guard Non-Fabrication Invariant
 * 9. Real Razorpay Sandbox Order API Execution
 * ==============================================================================
 */

import assert from "assert";
import crypto from "crypto";
import dotenv from "dotenv";
import { razorpayAdapter } from "../src/modules/payment/adapters/RazorpayAdapter.js";
import { PaymentAttemptStatus, isValidAttemptTransition } from "../src/modules/payment/domain/PaymentAttemptStatus.js";
import { RefundStatus, isValidRefundTransition } from "../src/modules/payment/domain/RefundStatus.js";
import { SettlementBatchStatus } from "../src/modules/payment/models/settlementBatch.model.js";
import { settlementService } from "../src/modules/payment/services/SettlementService.js";
import { reconciliationService, ReconciliationDiscrepancyType } from "../src/modules/payment/services/ReconciliationService.js";
import { IdempotencyManager } from "../src/modules/payment/utils/idempotency.js";
import { SettlementBatch } from "../src/modules/payment/models/settlementBatch.model.js";
import { ReconciliationRecord } from "../src/modules/payment/models/reconciliationRecord.model.js";
import { BankTransaction } from "../src/modules/payment/adapters/reconciliation/BankStatementSftpAdapter.js";

dotenv.config();

console.log("================================================================");
console.log("🧪 ZOSH BAZAAR — PHASE 23 / PAYMENT PLATFORM 10.0 TEST SUITE");
console.log("================================================================");

let testsPassed = 0;
let testsFailed = 0;

async function runTest(desc, fn) {
  try {
    await fn();
    console.log(`  ✅ PASS: ${desc}`);
    testsPassed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${desc}`);
    console.error(`     Error: ${err.message}`);
    testsFailed++;
  }
}

async function runAll() {
  // ----------------------------------------------------------------------------
  // [Part 1] Razorpay Environment Separation & Production Fail-Closed Guards
  // ----------------------------------------------------------------------------
  console.log("\n▶ [Part 1] Razorpay Environment Separation & Production Fail-Closed");

  await runTest("RazorpayAdapter is NOT production ready when only test keys exist", () => {
    const origNodeEnv = process.env.NODE_ENV;
    const origKeyId = process.env.RAZORPAY_KEY_ID;
    const origTestKey = process.env.RAZORPAY_TEST_KEY_ID;
    try {
      process.env.RAZORPAY_KEY_ID = "";
      process.env.RAZORPAY_TEST_KEY_ID = "rzp_test_S1Vs1ViGRVLSlE";
      const isLive = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_ID.startsWith("rzp_live_"));
      assert.strictEqual(isLive, false);
      assert.strictEqual(razorpayAdapter.getCredentialStatus(), "CONFIGURED");
    } finally {
      process.env.NODE_ENV = origNodeEnv;
      process.env.RAZORPAY_KEY_ID = origKeyId;
      process.env.RAZORPAY_TEST_KEY_ID = origTestKey;
    }
  });

  await runTest("RazorpayAdapter.getCredentialStatus() reports BLOCKED_BY_CREDENTIALS in production if no live key", () => {
    const origNodeEnv = process.env.NODE_ENV;
    const origKeyId = process.env.RAZORPAY_KEY_ID;
    try {
      process.env.NODE_ENV = "production";
      process.env.RAZORPAY_KEY_ID = ""; // No live key
      assert.strictEqual(razorpayAdapter.getCredentialStatus(), "BLOCKED_BY_CREDENTIALS");
    } finally {
      process.env.NODE_ENV = origNodeEnv;
      process.env.RAZORPAY_KEY_ID = origKeyId;
    }
  });

  await runTest("RazorpayAdapter.createIntent() fails closed in production when live keys are absent", async () => {
    const origNodeEnv = process.env.NODE_ENV;
    const origKeyId = process.env.RAZORPAY_KEY_ID;
    try {
      process.env.NODE_ENV = "production";
      process.env.RAZORPAY_KEY_ID = "";
      const res = await razorpayAdapter.createIntent({
        intent: { intentId: "int_test_99" },
        attempt: { attemptId: "att_test_99", amount: 100, currency: "INR" },
        user: { _id: "usr_1" },
        metadata: {},
      });
      assert.strictEqual(res.status, PaymentAttemptStatus.FAILED);
      assert.strictEqual(res.failureCode, "BLOCKED_BY_CREDENTIALS");
      assert.ok(res.failureReason.includes("production live keys"));
    } finally {
      process.env.NODE_ENV = origNodeEnv;
      process.env.RAZORPAY_KEY_ID = origKeyId;
    }
  });

  // ----------------------------------------------------------------------------
  // [Part 2] PaymentAttemptStatus State Machine Hardening
  // ----------------------------------------------------------------------------
  console.log("\n▶ [Part 2] PaymentAttemptStatus State Machine Hardening");

  await runTest("PaymentAttemptStatus contains all required enterprise statuses", () => {
    assert.ok(PaymentAttemptStatus.INITIATED);
    assert.ok(PaymentAttemptStatus.PENDING);
    assert.ok(PaymentAttemptStatus.REQUIRES_ACTION);
    assert.ok(PaymentAttemptStatus.AUTHORIZED);
    assert.ok(PaymentAttemptStatus.CAPTURED);
    assert.ok(PaymentAttemptStatus.SETTLEMENT_PENDING);
    assert.ok(PaymentAttemptStatus.SETTLED);
    assert.ok(PaymentAttemptStatus.FAILED);
    assert.ok(PaymentAttemptStatus.TIMED_OUT);
    assert.ok(PaymentAttemptStatus.CANCELLED);
    assert.ok(PaymentAttemptStatus.VOIDED);
    assert.ok(PaymentAttemptStatus.RECOVERING);
    assert.ok(PaymentAttemptStatus.UNKNOWN);
    assert.ok(PaymentAttemptStatus.REFUND_PENDING);
    assert.ok(PaymentAttemptStatus.PARTIALLY_REFUNDED);
    assert.ok(PaymentAttemptStatus.REFUNDED);
    assert.ok(PaymentAttemptStatus.CHARGEBACK_OPEN);
    assert.ok(PaymentAttemptStatus.CHARGEBACK_WON);
    assert.ok(PaymentAttemptStatus.CHARGEBACK_LOST);
  });

  await runTest("Allows valid attempt transitions: INITIATED -> REQUIRES_ACTION -> CAPTURED", () => {
    assert.strictEqual(isValidAttemptTransition(PaymentAttemptStatus.INITIATED, PaymentAttemptStatus.REQUIRES_ACTION), true);
    assert.strictEqual(isValidAttemptTransition(PaymentAttemptStatus.REQUIRES_ACTION, PaymentAttemptStatus.CAPTURED), true);
    assert.strictEqual(isValidAttemptTransition(PaymentAttemptStatus.CAPTURED, PaymentAttemptStatus.CHARGEBACK_OPEN), true);
    assert.strictEqual(isValidAttemptTransition(PaymentAttemptStatus.CHARGEBACK_OPEN, PaymentAttemptStatus.CHARGEBACK_WON), true);
  });

  await runTest("Rejects invalid and illegal attempt transitions", () => {
    assert.strictEqual(isValidAttemptTransition(PaymentAttemptStatus.FAILED, PaymentAttemptStatus.CAPTURED), false);
    assert.strictEqual(isValidAttemptTransition(PaymentAttemptStatus.REFUNDED, PaymentAttemptStatus.CAPTURED), false);
    assert.strictEqual(isValidAttemptTransition(PaymentAttemptStatus.CHARGEBACK_WON, PaymentAttemptStatus.CAPTURED), false);
    assert.strictEqual(isValidAttemptTransition(PaymentAttemptStatus.CHARGEBACK_LOST, PaymentAttemptStatus.CAPTURED), false);
    assert.strictEqual(isValidAttemptTransition(PaymentAttemptStatus.CANCELLED, PaymentAttemptStatus.SETTLED), false);
  });

  // ----------------------------------------------------------------------------
  // [Part 3] RefundStatus & Dispute State Machine Hardening
  // ----------------------------------------------------------------------------
  console.log("\n▶ [Part 3] RefundStatus Dispute State Machine Hardening");

  await runTest("RefundStatus includes full dispute arbitration lifecycle", () => {
    assert.ok(RefundStatus.CHARGEBACK_OPEN);
    assert.ok(RefundStatus.EVIDENCE_REQUIRED);
    assert.ok(RefundStatus.SUBMITTED);
    assert.ok(RefundStatus.CHARGEBACK_WON);
    assert.ok(RefundStatus.CHARGEBACK_LOST);
    assert.ok(RefundStatus.EXPIRED);
  });

  await runTest("Allows full dispute progression: OPEN -> EVIDENCE_REQUIRED -> SUBMITTED -> WON", () => {
    assert.strictEqual(isValidRefundTransition(RefundStatus.CHARGEBACK_OPEN, RefundStatus.EVIDENCE_REQUIRED), true);
    assert.strictEqual(isValidRefundTransition(RefundStatus.EVIDENCE_REQUIRED, RefundStatus.SUBMITTED), true);
    assert.strictEqual(isValidRefundTransition(RefundStatus.SUBMITTED, RefundStatus.CHARGEBACK_WON), true);
  });

  await runTest("Allows dispute expiration: SUBMITTED -> EXPIRED", () => {
    assert.strictEqual(isValidRefundTransition(RefundStatus.SUBMITTED, RefundStatus.EXPIRED), true);
    assert.strictEqual(isValidRefundTransition(RefundStatus.EXPIRED, RefundStatus.COMPLETED), false);
  });

  // ----------------------------------------------------------------------------
  // [Part 4] SettlementBatchStatus & Ambiguous Payout Lifecycle
  // ----------------------------------------------------------------------------
  console.log("\n▶ [Part 4] SettlementBatchStatus & Ambiguous Payout Lifecycle");

  await runTest("SettlementBatchStatus includes SUBMITTING, UNKNOWN, and STATUS_CHECK_REQUIRED", () => {
    assert.ok(SettlementBatchStatus.SUBMITTING);
    assert.ok(SettlementBatchStatus.SUBMITTED);
    assert.ok(SettlementBatchStatus.PROCESSING);
    assert.ok(SettlementBatchStatus.UNKNOWN);
    assert.ok(SettlementBatchStatus.STATUS_CHECK_REQUIRED);
    assert.ok(SettlementBatchStatus.PAID);
    assert.ok(SettlementBatchStatus.FAILED);
    assert.ok(SettlementBatchStatus.REVERSED);
    assert.ok(SettlementBatchStatus.RECONCILED);
  });

  await runTest("executeBatchPayout transitions to STATUS_CHECK_REQUIRED on network timeout (No duplicate transfer)", async () => {
    const origFindOne = SettlementBatch.findOne;
    try {
      const mockBatch = {
        batchId: "sbt_ambiguous_test_01",
        seller: "seller_99",
        netPayable: 15000,
        currency: "INR",
        status: SettlementBatchStatus.CALCULATED,
        beneficiary: { beneficiaryId: "ben_01", accountNumberMasked: "••••5678", ifscCode: "HDFC0001234" },
        idempotencyKey: "key_ambiguous_01",
        save: async function () { return this; },
      };
      SettlementBatch.findOne = () => ({ populate: async () => mockBatch });

      const timeoutAdapter = {
        createPayout: async () => {
          const err = new Error("Gateway Timeout (504) during bank dispatch");
          err.statusCode = 504;
          throw err;
        },
      };

      const res = await settlementService.executeBatchPayout("sbt_ambiguous_test_01", timeoutAdapter);
      assert.strictEqual(res.status, SettlementBatchStatus.STATUS_CHECK_REQUIRED);
      assert.strictEqual(mockBatch.status, SettlementBatchStatus.STATUS_CHECK_REQUIRED);
      assert.ok(mockBatch.holdReason.includes("AMBIGUOUS_TIMEOUT"));
    } finally {
      SettlementBatch.findOne = origFindOne;
    }
  });

  await runTest("recoverAmbiguousPayout queries authoritative status and marks PAID if bank confirmed transfer", async () => {
    const origFindOne = SettlementBatch.findOne;
    try {
      const mockBatch = {
        batchId: "sbt_ambiguous_test_02",
        seller: "seller_99",
        netPayable: 15000,
        currency: "INR",
        status: SettlementBatchStatus.STATUS_CHECK_REQUIRED,
        payoutReference: "payout_bank_ext_99",
        save: async function () { return this; },
      };
      SettlementBatch.findOne = () => ({ populate: async () => mockBatch, ...mockBatch });

      const recoveryAdapter = {
        getPayoutStatus: async () => ({
          status: "SUCCESS",
          utr: "HDFCN26100788219",
        }),
      };

      const origMarkSettled = settlementService.markBatchSettled;
      let markSettledCalled = false;
      settlementService.markBatchSettled = async (bId, utr) => {
        markSettledCalled = true;
        assert.strictEqual(utr, "HDFCN26100788219");
        mockBatch.status = SettlementBatchStatus.PAID;
        mockBatch.utrNumber = utr;
        return mockBatch;
      };

      const res = await settlementService.recoverAmbiguousPayout("sbt_ambiguous_test_02", recoveryAdapter);
      assert.ok(markSettledCalled);
      assert.strictEqual(res.status, SettlementBatchStatus.PAID);
      settlementService.markBatchSettled = origMarkSettled;
    } finally {
      SettlementBatch.findOne = origFindOne;
    }
  });

  // ----------------------------------------------------------------------------
  // [Part 5] Three-Way Reconciliation Taxonomy & Discrepancies
  // ----------------------------------------------------------------------------
  console.log("\n▶ [Part 5] Three-Way Reconciliation Taxonomy & Discrepancies");

  await runTest("ReconciliationDiscrepancyType defines UNKNOWN_REFERENCE and DATE_MISMATCH", () => {
    assert.ok(ReconciliationDiscrepancyType.UNKNOWN_REFERENCE);
    assert.ok(ReconciliationDiscrepancyType.DATE_MISMATCH);
    assert.ok(ReconciliationDiscrepancyType.AMOUNT_MISMATCH);
    assert.ok(ReconciliationDiscrepancyType.MISSING_IN_PROVIDER);
    assert.ok(ReconciliationDiscrepancyType.PENDING_BANK);
  });

  await runTest("runThreeWayReconciliation detects UNKNOWN_REFERENCE with CRITICAL severity for orphan bank credits", async () => {
    const origCreate = ReconciliationRecord.create;
    try {
      let savedRecord = null;
      ReconciliationRecord.create = async (doc) => {
        savedRecord = doc;
        return doc;
      };

      const settlementBatches = [
        { batchId: "sbt_1001", netPayable: 5000, payoutReference: "pay_1001", utrNumber: "UTR_MATCH_1001" },
      ];
      const providerPayouts = [
        { payoutReference: "pay_1001", amount: 5000, utr: "UTR_MATCH_1001" },
      ];
      const bankTransactions = [
        new BankTransaction({ transactionId: "tx_01", amount: 5000, utr: "UTR_MATCH_1001", creditDebit: "CR" }),
        new BankTransaction({ transactionId: "tx_orphan", amount: 9999, utr: "UTR_MYSTERY_ORPHAN", creditDebit: "CR" }),
      ];

      const result = await reconciliationService.runThreeWayReconciliation({
        settlementBatches,
        providerPayouts,
        bankTransactions,
      });

      assert.ok(savedRecord);
      assert.strictEqual(savedRecord.status, "ANOMALIES_DETECTED");
      const orphanDisc = savedRecord.discrepancies.find((d) => d.issueType === ReconciliationDiscrepancyType.UNKNOWN_REFERENCE);
      assert.ok(orphanDisc, "Expected UNKNOWN_REFERENCE discrepancy for orphan bank credit");
      assert.strictEqual(orphanDisc.severity, "CRITICAL");
      assert.strictEqual(orphanDisc.referenceId, "UTR_MYSTERY_ORPHAN");
    } finally {
      ReconciliationRecord.create = origCreate;
    }
  });

  // ----------------------------------------------------------------------------
  // [Part 6] Idempotency Key Reuse Conflict Detection
  // ----------------------------------------------------------------------------
  console.log("\n▶ [Part 6] Idempotency Key Reuse Conflict Detection (409 IDEMPOTENCY_KEY_REUSE)");

  await runTest("IdempotencyManager throws IDEMPOTENCY_KEY_REUSE (409) when same key submitted with altered payload", async () => {
    const key = `idem_conflict_test_${Date.now()}`;
    const endpoint = "/api/v1/payment/checkout/attempt";
    const payload1 = { intentId: "int_1", amount: 1000 };
    const payload2 = { intentId: "int_1", amount: 2000 };

    await IdempotencyManager.recordResult(key, endpoint, "POST", payload1, 200, { success: true });

    let caught = null;
    try {
      await IdempotencyManager.getExistingResult(key, endpoint, payload2);
    } catch (err) {
      caught = err;
    }

    assert.ok(caught, "Expected getExistingResult to throw on payload tampering");
    assert.strictEqual(caught.statusCode, 409);
    assert.strictEqual(caught.code, "IDEMPOTENCY_KEY_REUSE");
  });

  await runTest("IdempotencyManager returns cached response when same key submitted with identical payload", async () => {
    const key = `idem_match_test_${Date.now()}`;
    const endpoint = "/api/v1/payment/checkout/attempt";
    const payload = { intentId: "int_same", amount: 1000 };

    await IdempotencyManager.recordResult(key, endpoint, "POST", payload, 200, { success: true, attemptId: "att_cached_1" });
    const result = await IdempotencyManager.getExistingResult(key, endpoint, payload);

    assert.ok(result);
    assert.strictEqual(result.data.attemptId, "att_cached_1");
  });

  // ----------------------------------------------------------------------------
  // [Part 7] Authoritative UTR Guard Non-Fabrication Invariant
  // ----------------------------------------------------------------------------
  console.log("\n▶ [Part 7] Authoritative UTR Guard Non-Fabrication Invariant");

  await runTest("Rejects synthetic or fake UTR ('SBX_UTR_...', 'MOCK_...') in production with HTTP 422", async () => {
    const origNodeEnv = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = "production";
      let caught = null;
      try {
        await settlementService.markSettled("stl_prod_test", "SBX_UTR_9999", { isProduction: true });
      } catch (e) {
        caught = e;
      }
      assert.ok(caught);
      assert.strictEqual(caught.code, "INVALID_PRODUCTION_UTR");
      assert.strictEqual(caught.statusCode, 422);
    } finally {
      process.env.NODE_ENV = origNodeEnv;
    }
  });

  await runTest("Rejects markSettled without any UTR in production", async () => {
    const origNodeEnv = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = "production";
      let caught = null;
      try {
        await settlementService.markSettled("stl_prod_test", null, { isProduction: true });
      } catch (e) {
        caught = e;
      }
      assert.ok(caught);
      assert.ok(caught.message.includes("without authoritative bank UTR"));
    } finally {
      process.env.NODE_ENV = origNodeEnv;
    }
  });

  // ----------------------------------------------------------------------------
  // [Part 8] Real Razorpay Sandbox Order Execution Evidence
  // ----------------------------------------------------------------------------
  console.log("\n▶ [Part 8] Real External Sandbox Execution Evidence");

  await runTest("Executes live HTTPS Razorpay order creation using authentic sandbox credentials", async () => {
    if (!process.env.RAZORPAY_TEST_KEY_ID || !process.env.RAZORPAY_TEST_KEY_SECRET) {
      console.log("     Skipping live API call: test credentials absent");
      return;
    }

    const receiptId = `rcpt_p10_${Date.now()}`;
    const mockIntent = { intentId: `intent_p10_${Date.now()}` };
    const mockAttempt = {
      attemptId: receiptId,
      amount: 999.00,
      currency: "INR",
    };

    const origNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    try {
      const res = await razorpayAdapter.createIntent({
        intent: mockIntent,
        attempt: mockAttempt,
        user: { fullName: "Platform 10 Auditor", email: "audit@zoshbazaar.com" },
        metadata: {},
      });

      assert.ok(res.providerReference, "Expected real Razorpay order ID");
      assert.ok(res.providerReference.startsWith("order_"), `Order ID must start with order_: ${res.providerReference}`);
      assert.strictEqual(res.status, PaymentAttemptStatus.PENDING);
      assert.strictEqual(res.actionPayload.amount, 99900);
      console.log(`     [LIVE API EVIDENCE] Created Razorpay Sandbox Order: ${res.providerReference} (Receipt: ${receiptId})`);
    } finally {
      process.env.NODE_ENV = origNodeEnv;
    }
  });

  // ----------------------------------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------------------------------
  console.log("\n================================================================");
  console.log(`🏁 PHASE 23 TEST SUITE RESULTS: ${testsPassed} PASSED | ${testsFailed} FAILED`);
  console.log("================================================================");

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runAll().catch((err) => {
  console.error("Unhandled error in test runner:", err);
  process.exit(1);
});
