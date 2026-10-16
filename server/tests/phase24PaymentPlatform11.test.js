/**
 * ==============================================================================
 * ZOSH BAZAAR — PAYMENT PLATFORM 11.0 SOURCE-CODE FORENSIC AUDIT & INVARIANTS
 * ==============================================================================
 * Forensic Verification Test Suite:
 * 1. Client GET Verification Authoritative Confirmation Guard (No blind capture)
 * 2. Webhook Amount, Currency & Provider Invariant Verification
 * 3. Order-Payment Consistency (Prepaid orders cannot be SHIPPED before payment)
 * 4. Beneficiary Verification, Masking Integrity & Payout Fail-Closed Guards
 * 5. Settlement Batch Idempotency & Transition Boundary Protection
 * 6. Provider Failover Double-Charge Prevention Guard
 * 7. Money Precision, Floating-Point Epsilon & Refund Cumulative Ceiling
 * 8. Chargeback Seller Reserve Offset Ledger Integrity
 * 9. Bank Statement SFTP Durable Deduplication
 * 10. Reconciliation Discrepancy Resolution & Maker-Checker Dual Authorization
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
import ledgerService from "../src/modules/payment/services/LedgerService.js";

dotenv.config();

console.log("================================================================");
console.log("🧪 ZOSH BAZAAR — PHASE 24 / PAYMENT PLATFORM 11.0 TEST SUITE");
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
  // [Part 1] Webhook Amount, Currency & Provider Invariants
  // ----------------------------------------------------------------------------
  console.log("\n▶ [Part 1] Webhook Invariant Verification & Multi-PSP Model Enum");

  await runTest("Webhook rejects payload with mismatched amount", async () => {
    const origFindOne = PaymentAttempt.findOne;
    const origEventFindOne = PaymentWebhookEvent.findOne;
    const origSave = PaymentWebhookEvent.prototype.save;
    const { webhookAdapters } = await import("../src/modules/payment/adapters/webhook/ProviderWebhookAdapter.js");
    const origAdapterProcess = webhookAdapters.RAZORPAY?.processWebhook;

    try {
      PaymentWebhookEvent.findOne = async () => null;
      PaymentWebhookEvent.prototype.save = async function () { return this; };
      PaymentAttempt.findOne = async () => ({
        attemptId: "att_webhook_test_01",
        amount: 1500,
        currency: "INR",
        provider: "RAZORPAY",
        status: PaymentAttemptStatus.PENDING,
      });

      webhookAdapters.RAZORPAY.processWebhook = async () => ({
        isValid: true,
        normalizedEvent: {
          eventId: "evt_amt_01",
          eventType: "payment.captured",
          status: "CAPTURED",
          paymentReference: "pay_12345",
          amount: 1200, // Mismatched amount!
          currency: "INR",
        },
      });

      let errorThrown = false;
      try {
        await paymentWebhookService.processWebhook({
          provider: "RAZORPAY",
          payload: {},
          signature: "dummy_sig",
          rawBody: Buffer.from("{}"),
        });
      } catch (err) {
        errorThrown = true;
        assert.strictEqual(err.code, "WEBHOOK_AMOUNT_MISMATCH");
        assert.ok(err.message.includes("amount mismatch"));
      }
      assert.strictEqual(errorThrown, true);
    } finally {
      PaymentAttempt.findOne = origFindOne;
      PaymentWebhookEvent.findOne = origEventFindOne;
      PaymentWebhookEvent.prototype.save = origSave;
      if (webhookAdapters.RAZORPAY) webhookAdapters.RAZORPAY.processWebhook = origAdapterProcess;
    }
  });

  await runTest("Webhook rejects payload with mismatched currency", async () => {
    const origFindOne = PaymentAttempt.findOne;
    const origEventFindOne = PaymentWebhookEvent.findOne;
    const origSave = PaymentWebhookEvent.prototype.save;
    const { webhookAdapters } = await import("../src/modules/payment/adapters/webhook/ProviderWebhookAdapter.js");
    const origAdapterProcess = webhookAdapters.RAZORPAY?.processWebhook;

    try {
      PaymentWebhookEvent.findOne = async () => null;
      PaymentWebhookEvent.prototype.save = async function () { return this; };
      PaymentAttempt.findOne = async () => ({
        attemptId: "att_webhook_test_02",
        amount: 2000,
        currency: "INR",
        provider: "RAZORPAY",
        status: PaymentAttemptStatus.PENDING,
      });

      webhookAdapters.RAZORPAY.processWebhook = async () => ({
        isValid: true,
        normalizedEvent: {
          eventId: "evt_curr_02",
          eventType: "payment.captured",
          status: "CAPTURED",
          paymentReference: "pay_67890",
          amount: 2000,
          currency: "USD", // Mismatched currency!
        },
      });

      let errorThrown = false;
      try {
        await paymentWebhookService.processWebhook({
          provider: "RAZORPAY",
          payload: {},
          signature: "dummy_sig",
          rawBody: Buffer.from("{}"),
        });
      } catch (err) {
        errorThrown = true;
        assert.strictEqual(err.code, "WEBHOOK_CURRENCY_MISMATCH");
      }
      assert.strictEqual(errorThrown, true);
    } finally {
      PaymentAttempt.findOne = origFindOne;
      PaymentWebhookEvent.findOne = origEventFindOne;
      PaymentWebhookEvent.prototype.save = origSave;
      if (webhookAdapters.RAZORPAY) webhookAdapters.RAZORPAY.processWebhook = origAdapterProcess;
    }
  });

  await runTest("Webhook rejects payload with mismatched provider", async () => {
    const origFindOne = PaymentAttempt.findOne;
    const origEventFindOne = PaymentWebhookEvent.findOne;
    const origSave = PaymentWebhookEvent.prototype.save;
    const { webhookAdapters } = await import("../src/modules/payment/adapters/webhook/ProviderWebhookAdapter.js");
    const origAdapterProcess = webhookAdapters.RAZORPAY?.processWebhook;

    try {
      PaymentWebhookEvent.findOne = async () => null;
      PaymentWebhookEvent.prototype.save = async function () { return this; };
      PaymentAttempt.findOne = async () => ({
        attemptId: "att_webhook_test_03",
        amount: 500,
        currency: "INR",
        provider: "CASHFREE", // Bound to CASHFREE!
        status: PaymentAttemptStatus.PENDING,
      });

      webhookAdapters.RAZORPAY.processWebhook = async () => ({
        isValid: true,
        normalizedEvent: {
          eventId: "evt_prov_03",
          eventType: "payment.captured",
          status: "CAPTURED",
          paymentReference: "pay_xyz",
          amount: 500,
          currency: "INR",
        },
      });

      let errorThrown = false;
      try {
        await paymentWebhookService.processWebhook({
          provider: "RAZORPAY", // Sent via Razorpay!
          payload: {},
          signature: "dummy_sig",
          rawBody: Buffer.from("{}"),
        });
      } catch (err) {
        errorThrown = true;
        assert.strictEqual(err.code, "WEBHOOK_PROVIDER_MISMATCH");
      }
      assert.strictEqual(errorThrown, true);
    } finally {
      PaymentAttempt.findOne = origFindOne;
      PaymentWebhookEvent.findOne = origEventFindOne;
      PaymentWebhookEvent.prototype.save = origSave;
      if (webhookAdapters.RAZORPAY) webhookAdapters.RAZORPAY.processWebhook = origAdapterProcess;
    }
  });

  await runTest("PaymentWebhookEvent schema accepts CASHFREE, PAYU, PHONEPE, JUSPAY", () => {
    const validProviders = ["RAZORPAY", "CASHFREE", "PAYU", "PHONEPE", "JUSPAY", "SANDBOX", "STRIPE"];
    for (const p of validProviders) {
      const doc = new PaymentWebhookEvent({
        eventId: `evt_${p}_${Date.now()}`,
        provider: p,
        eventType: "payment.succeeded",
        signature: "valid_hash",
        payload: { test: true },
      });
      const err = doc.validateSync();
      assert.strictEqual(err, undefined, `Schema should validate provider ${p}`);
    }
  });

  // ----------------------------------------------------------------------------
  // [Part 2] Order-Payment Consistency: Shipping Guards
  // ----------------------------------------------------------------------------
  console.log("\n▶ [Part 2] Order-Payment Consistency Guards");

  await runTest("Prepaid order with PENDING payment CANNOT be transitioned to SHIPPED", async () => {
    const origFindById = Order.findById;
    try {
      const mockOrder = {
        _id: "order_unpaid_101",
        orderId: "order_unpaid_101",
        orderStatus: OrderStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PENDING,
        paymentMethod: "ONLINE_RAZORPAY",
        paymentDetails: { paymentMethod: "ONLINE_RAZORPAY" },
        orderItems: [],
        statusHistory: [],
        save: async function () { return this; },
      };
      Order.findById = () => ({ populate: async () => mockOrder });

      let errorThrown = false;
      try {
        await OrderService.updateOrderStatus("order_unpaid_101", OrderStatus.SHIPPED);
      } catch (err) {
        errorThrown = true;
        assert.strictEqual(err.code, "ORDER_PAYMENT_UNCONFIRMED");
        assert.ok(err.message.includes("Prepaid order has not been paid"));
      }
      assert.strictEqual(errorThrown, true);
    } finally {
      Order.findById = origFindById;
    }
  });

  await runTest("Prepaid order with CAPTURED payment CAN transition to SHIPPED", async () => {
    const origFindById = Order.findById;
    try {
      const mockOrder = {
        _id: "507f1f77bcf86cd799439012",
        orderId: "507f1f77bcf86cd799439012",
        orderStatus: OrderStatus.CONFIRMED,
        paymentStatus: PaymentStatus.COMPLETED,
        paymentMethod: "ONLINE_RAZORPAY",
        paymentDetails: { paymentMethod: "ONLINE_RAZORPAY" },
        orderItems: [],
        statusHistory: [],
        save: async function () { return this; },
      };
      Order.findById = () => ({ populate: async () => mockOrder });

      const updated = await OrderService.updateOrderStatus("507f1f77bcf86cd799439012", OrderStatus.SHIPPED);
      assert.strictEqual(updated.orderStatus, OrderStatus.SHIPPED);
    } finally {
      Order.findById = origFindById;
    }
  });

  await runTest("COD order CAN transition to SHIPPED prior to payment", async () => {
    const origFindById = Order.findById;
    try {
      const mockOrder = {
        _id: "507f1f77bcf86cd799439013",
        orderId: "507f1f77bcf86cd799439013",
        orderStatus: OrderStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PENDING,
        paymentMethod: "COD",
        paymentDetails: { paymentMethod: "COD" },
        orderItems: [],
        statusHistory: [],
        save: async function () { return this; },
      };
      Order.findById = () => ({ populate: async () => mockOrder });

      const updated = await OrderService.updateOrderStatus("507f1f77bcf86cd799439013", OrderStatus.SHIPPED);
      assert.strictEqual(updated.orderStatus, OrderStatus.SHIPPED);
    } finally {
      Order.findById = origFindById;
    }
  });

  // ----------------------------------------------------------------------------
  // [Part 3] Beneficiary Verification & Payout Fail-Closed Guards
  // ----------------------------------------------------------------------------
  console.log("\n▶ [Part 3] Beneficiary Verification & Payout Provider Invariants");

  await runTest("executeBatchPayout rejects unverified beneficiary", async () => {
    const origFindOne = SettlementBatch.findOne;
    try {
      const mockBatch = {
        batchId: "sbt_unverified_ben_01",
        seller: "seller_01",
        netPayable: 5000,
        currency: "INR",
        status: SettlementBatchStatus.CALCULATED,
        beneficiary: {
          beneficiaryId: "ben_unverified",
          status: "PENDING_VERIFICATION", // Unverified!
          payoutEligible: false,
          accountNumberMasked: "••••1234",
          ifscCode: "HDFC0001234",
        },
        idempotencyKey: "key_ben_01",
        save: async function () { return this; },
      };
      SettlementBatch.findOne = () => ({ populate: async () => mockBatch });

      let errorThrown = false;
      try {
        await settlementService.executeBatchPayout("sbt_unverified_ben_01");
      } catch (err) {
        errorThrown = true;
        assert.strictEqual(err.code, "BENEFICIARY_NOT_VERIFIED");
      }
      assert.strictEqual(errorThrown, true);
      assert.strictEqual(mockBatch.status, SettlementBatchStatus.REVIEW_REQUIRED);
    } finally {
      SettlementBatch.findOne = origFindOne;
    }
  });

  await runTest("executeBatchPayout rejects missing beneficiary", async () => {
    const origFindOne = SettlementBatch.findOne;
    try {
      const mockBatch = {
        batchId: "sbt_missing_ben_02",
        seller: "seller_02",
        netPayable: 8000,
        currency: "INR",
        status: SettlementBatchStatus.CALCULATED,
        beneficiary: null, // Missing!
        idempotencyKey: "key_ben_02",
        save: async function () { return this; },
      };
      SettlementBatch.findOne = () => ({ populate: async () => mockBatch });

      let errorThrown = false;
      try {
        await settlementService.executeBatchPayout("sbt_missing_ben_02");
      } catch (err) {
        errorThrown = true;
        assert.strictEqual(err.code, "BENEFICIARY_NOT_VERIFIED");
      }
      assert.strictEqual(errorThrown, true);
    } finally {
      SettlementBatch.findOne = origFindOne;
    }
  });

  await runTest("executeBatchPayout enforces immutable payout provider binding", async () => {
    const origFindOne = SettlementBatch.findOne;
    try {
      const mockBatch = {
        batchId: "sbt_locked_provider_03",
        seller: "seller_03",
        netPayable: 12000,
        currency: "INR",
        status: SettlementBatchStatus.APPROVED,
        payoutProvider: "HDFC_NODAL", // Already locked to HDFC!
        beneficiary: {
          beneficiaryId: "ben_verified",
          status: "VERIFIED",
          payoutEligible: true,
          accountNumberMasked: "••••9999",
          ifscCode: "ICIC0001234",
        },
        idempotencyKey: "key_lock_03",
        save: async function () { return this; },
      };
      SettlementBatch.findOne = () => ({ populate: async () => mockBatch });

      const wrongAdapter = {
        name: "ICICI_CONNECTED_BANKING",
        createPayout: async () => ({ status: "SUBMITTED" }),
      };

      let errorThrown = false;
      try {
        await settlementService.executeBatchPayout("sbt_locked_provider_03", wrongAdapter);
      } catch (err) {
        errorThrown = true;
        assert.strictEqual(err.code, "PAYOUT_PROVIDER_MISMATCH");
      }
      assert.strictEqual(errorThrown, true);
    } finally {
      SettlementBatch.findOne = origFindOne;
    }
  });

  // ----------------------------------------------------------------------------
  // [Part 4] Settlement Batch Idempotency & Transition Guards
  // ----------------------------------------------------------------------------
  console.log("\n▶ [Part 4] Settlement Batch Idempotency & State Transition Guards");

  await runTest("markBatchSettled is idempotent when batch is already PAID (zero duplicate journals)", async () => {
    const origFindOne = SettlementBatch.findOne;
    let journalPosted = false;
    const origPostJournal = ledgerService.postJournal;
    try {
      ledgerService.postJournal = async () => { journalPosted = true; };

      const mockBatch = {
        batchId: "sbt_already_paid_01",
        status: SettlementBatchStatus.PAID,
        utrNumber: "CMS123456789012",
        save: async function () { return this; },
      };
      SettlementBatch.findOne = async () => mockBatch;

      const result = await settlementService.markBatchSettled("sbt_already_paid_01", "CMS123456789012");
      assert.strictEqual(result.status, SettlementBatchStatus.PAID);
      assert.strictEqual(journalPosted, false, "Must not post duplicate ledger journal for already paid batch");
    } finally {
      SettlementBatch.findOne = origFindOne;
      ledgerService.postJournal = origPostJournal;
    }
  });

  await runTest("markBatchSettled rejects transitioning unapproved DRAFT batch to PAID", async () => {
    const origFindOne = SettlementBatch.findOne;
    try {
      const mockBatch = {
        batchId: "sbt_draft_batch_02",
        status: SettlementBatchStatus.DRAFT,
        save: async function () { return this; },
      };
      SettlementBatch.findOne = async () => mockBatch;

      let errorThrown = false;
      try {
        await settlementService.markBatchSettled("sbt_draft_batch_02", "UTR999999");
      } catch (err) {
        errorThrown = true;
        assert.strictEqual(err.code, "INVALID_BATCH_STATUS_TRANSITION");
      }
      assert.strictEqual(errorThrown, true);
    } finally {
      SettlementBatch.findOne = origFindOne;
    }
  });

  // ----------------------------------------------------------------------------
  // [Part 5] Provider Failover Double-Charge Prevention
  // ----------------------------------------------------------------------------
  console.log("\n▶ [Part 5] Provider Failover Double-Charge Prevention");

  await runTest("submitPaymentAttempt blocks failover to another provider while prior attempt is active", async () => {
    const origGetIntent = (await import("../src/modules/payment/services/PaymentIntentService.js")).default.getIntentById;
    const origFind = PaymentAttempt.find;
    const origRecover = paymentOrchestratorService.checkAndRecoverAttemptStatus;

    try {
      (await import("../src/modules/payment/services/PaymentIntentService.js")).default.getIntentById = async () => ({
        intentId: "pi_failover_test_01",
        amount: 2500,
        currency: "INR",
        status: "REQUIRES_PAYMENT_METHOD",
        selectedMethod: { rail: "UPI" },
      });

      // An active attempt on RAZORPAY exists
      PaymentAttempt.find = async () => [
        {
          attemptId: "att_rzp_active_01",
          intentId: "pi_failover_test_01",
          provider: "RAZORPAY",
          status: PaymentAttemptStatus.PENDING,
        },
      ];

      // Recovery returns pending / unconfirmed
      paymentOrchestratorService.checkAndRecoverAttemptStatus = async () => ({
        status: PaymentAttemptStatus.PENDING,
      });

      let errorThrown = false;
      try {
        // Attempting to submit via CASHFREE while RAZORPAY is active
        await paymentOrchestratorService.submitPaymentAttempt({
          intentId: "pi_failover_test_01",
          method: "UPI",
          metadata: { preferredProvider: "CASHFREE" },
        });
      } catch (err) {
        errorThrown = true;
        assert.strictEqual(err.code, "FAILOVER_BLOCKED_UNCONFIRMED_ATTEMPT");
        assert.ok(err.message.includes("Cannot failover to provider"));
      }
      assert.strictEqual(errorThrown, true);
    } finally {
      (await import("../src/modules/payment/services/PaymentIntentService.js")).default.getIntentById = origGetIntent;
      PaymentAttempt.find = origFind;
      paymentOrchestratorService.checkAndRecoverAttemptStatus = origRecover;
    }
  });

  // ----------------------------------------------------------------------------
  // [Part 6] Money Precision & Floating-Point Epsilon in Refunds
  // ----------------------------------------------------------------------------
  console.log("\n▶ [Part 6] Money Precision & Epsilon Safety in Refunds");

  await runTest("createRefund handles floating-point subtraction (100.10 - 50.05 = 50.05) without false rejection", async () => {
    const origFindById = Order.findById;
    const origFind = Refund.find;
    const origCreate = Refund.create;
    const origProcess = refundService.processRefund;

    try {
      Order.findById = () => ({
        populate: async () => ({
          _id: "order_fp_01",
          totalSellingPrice: 100.10, // Fractional total
          user: "user_01",
        }),
      });

      Refund.find = async () => [
        { amount: 50.05, status: "COMPLETED" }, // Previously refunded ₹50.05
      ];

      let createdRefund = null;
      Refund.create = async (data) => {
        createdRefund = data;
        return data;
      };

      refundService.processRefund = async (ref) => ({ refund: ref, success: true });

      // Request exact remainder ₹50.05 (in naive JS, 100.10 - 50.05 = 50.049999999999995)
      const res = await refundService.createRefund({
        orderId: "order_fp_01",
        amount: 50.05,
      });

      assert.strictEqual(res.success, true);
      assert.strictEqual(createdRefund.amount, 50.05);
    } finally {
      Order.findById = origFindById;
      Refund.find = origFind;
      Refund.create = origCreate;
      refundService.processRefund = origProcess;
    }
  });

  await runTest("createRefund strictly rejects refund exceeding remaining balance", async () => {
    const origFindById = Order.findById;
    const origFind = Refund.find;

    try {
      Order.findById = () => ({
        populate: async () => ({
          _id: "order_exceed_02",
          totalSellingPrice: 500.00,
          user: "user_02",
        }),
      });

      Refund.find = async () => [
        { amount: 400.00, status: "COMPLETED" },
      ];

      let errorThrown = false;
      try {
        await refundService.createRefund({
          orderId: "order_exceed_02",
          amount: 150.00, // Remaining is ₹100, requesting ₹150!
        });
      } catch (err) {
        errorThrown = true;
        assert.ok(err.message.includes("Maximum remaining refundable balance is ₹100"));
      }
      assert.strictEqual(errorThrown, true);
    } finally {
      Order.findById = origFindById;
      Refund.find = origFind;
    }
  });

  // ----------------------------------------------------------------------------
  // [Part 7] Chargeback Seller Reserve Offsetting Invariant
  // ----------------------------------------------------------------------------
  console.log("\n▶ [Part 7] Chargeback Seller Reserve Offset Ledger Integrity");

  await runTest("resolveChargeback with outcome LOST debits SELLER_RESERVE to balance platform dispute account", async () => {
    const origFindOne = Refund.findOne;
    const origFindById = Order.findById;
    const origPostJournal = ledgerService.postJournal;
    let recordedJournal = null;

    try {
      const mockDispute = {
        refundId: "cb_lost_test_01",
        order: "order_seller_dispute_01",
        amount: 3500,
        status: "CHARGEBACK_OPEN",
        statusHistory: [],
        save: async function () { return this; },
      };
      Refund.findOne = async () => mockDispute;

      Order.findById = () => ({
        lean: async () => ({
          _id: "order_seller_dispute_01",
          seller: "seller_disputed_99",
        }),
      });

      ledgerService.postJournal = async (journal) => {
        recordedJournal = journal;
        return journal;
      };

      const resolved = await refundService.resolveChargeback({
        disputeReference: "disp_ref_99",
        outcome: "LOST",
        notes: "Cardholder arbitration lost",
      });

      assert.strictEqual(resolved.status, "CHARGEBACK_LOST");
      assert.ok(recordedJournal);
      assert.strictEqual(recordedJournal.referenceType, "CHARGEBACK_LOST");

      // Verify double-entry ledger postings include seller reserve offset
      const postings = recordedJournal.postings;
      const sellerDebit = postings.find(
        (p) => p.account === "SELLER_RESERVE" && p.entryType === "DEBIT"
      );
      assert.ok(sellerDebit, "Must debit SELLER_RESERVE on lost chargeback");
      assert.strictEqual(sellerDebit.amount, 3500);
      assert.strictEqual(sellerDebit.partyId, "seller_disputed_99");

      // Verify total debits == total credits invariant
      const totalDebits = postings
        .filter((p) => p.entryType === "DEBIT")
        .reduce((sum, p) => sum + p.amount, 0);
      const totalCredits = postings
        .filter((p) => p.entryType === "CREDIT")
        .reduce((sum, p) => sum + p.amount, 0);

      assert.strictEqual(totalDebits, totalCredits, "Total ledger debits must equal total credits");
    } finally {
      Refund.findOne = origFindOne;
      Order.findById = origFindById;
      ledgerService.postJournal = origPostJournal;
    }
  });

  // ----------------------------------------------------------------------------
  // [Part 8] Bank Statement SFTP Deduplication
  // ----------------------------------------------------------------------------
  console.log("\n▶ [Part 8] Bank Statement SFTP Ingestion Deduplication");

  await runTest("BankStatementSftpAdapter detects duplicate statement payloads", async () => {
    const adapter = new BankStatementSftpAdapter();
    const statementContent = "TxnID,Date,Amount,Type,UTR,Description\nTXN101,2026-10-01,15000,CR,CMS999000111222,Settlement Batch Payout";

    // 1st processing
    const firstResult = await adapter.processStatementFile({
      content: statementContent,
      filename: "statement_hdfc_oct.csv",
    });
    assert.strictEqual(firstResult.status, SftpFileProcessingStatus.PROCESSED);
    assert.strictEqual(firstResult.recordCount, 1);

    // 2nd processing with identical content
    const secondResult = await adapter.processStatementFile({
      content: statementContent,
      filename: "statement_hdfc_oct_dup.csv",
    });
    assert.strictEqual(secondResult.status, SftpFileProcessingStatus.DUPLICATE);
    assert.strictEqual(secondResult.recordCount, 0);
    assert.ok(secondResult.message.includes("already been processed"));
  });

  // ----------------------------------------------------------------------------
  // [Part 9] Reconciliation Discrepancy Resolution & Maker-Checker Dual Auth
  // ----------------------------------------------------------------------------
  console.log("\n▶ [Part 9] Reconciliation Discrepancy Resolution & Maker-Checker");

  await runTest("resolveDiscrepancy rejects resolution without operator ID", async () => {
    let errorThrown = false;
    try {
      await reconciliationService.resolveDiscrepancy({
        reconciliationId: "rec_test_01",
        referenceId: "ref_01",
        reason: "Valid reconciliation note for finance ledger adjustment",
        operatorId: null, // Missing operator!
      });
    } catch (err) {
      errorThrown = true;
      assert.strictEqual(err.code, "MISSING_OPERATOR_AUDIT");
    }
    assert.strictEqual(errorThrown, true);
  });

  await runTest("resolveDiscrepancy rejects resolution with reason < 10 characters", async () => {
    let errorThrown = false;
    try {
      await reconciliationService.resolveDiscrepancy({
        reconciliationId: "rec_test_01",
        referenceId: "ref_01",
        reason: "ok", // Too short!
        operatorId: "op_01",
      });
    } catch (err) {
      errorThrown = true;
      assert.strictEqual(err.code, "INSUFFICIENT_RESOLUTION_REASON");
    }
    assert.strictEqual(errorThrown, true);
  });

  await runTest("resolveDiscrepancy enforces dual authorization (maker-checker) on CRITICAL discrepancies", async () => {
    const origFindOne = ReconciliationRecord.findOne;
    try {
      const mockRecord = {
        reconciliationId: "rec_crit_01",
        status: "ANOMALIES_DETECTED",
        discrepancies: [
          {
            referenceId: "crit_ref_01",
            severity: "CRITICAL",
            resolved: false,
            auditTrail: [],
          },
        ],
        save: async function () { return this; },
      };
      ReconciliationRecord.findOne = async () => mockRecord;

      // 1. Fails when checker is omitted
      let noCheckerError = false;
      try {
        await reconciliationService.resolveDiscrepancy({
          reconciliationId: "rec_crit_01",
          referenceId: "crit_ref_01",
          reason: "Bank statement verified against treasury clearing ledger",
          operatorId: "operator_alice",
          checkerId: null, // Missing checker!
        });
      } catch (err) {
        noCheckerError = true;
        assert.strictEqual(err.code, "MAKER_CHECKER_REQUIRED");
      }
      assert.strictEqual(noCheckerError, true);

      // 2. Fails when maker is identical to checker
      let samePersonError = false;
      try {
        await reconciliationService.resolveDiscrepancy({
          reconciliationId: "rec_crit_01",
          referenceId: "crit_ref_01",
          reason: "Bank statement verified against treasury clearing ledger",
          operatorId: "operator_alice",
          checkerId: "operator_alice", // Same person!
        });
      } catch (err) {
        samePersonError = true;
        assert.strictEqual(err.code, "MAKER_CHECKER_CONFLICT");
      }
      assert.strictEqual(samePersonError, true);

      // 3. Succeeds when maker and checker are distinct
      const res = await reconciliationService.resolveDiscrepancy({
        reconciliationId: "rec_crit_01",
        referenceId: "crit_ref_01",
        reason: "Bank statement verified against treasury clearing ledger",
        operatorId: "operator_alice",
        checkerId: "supervisor_bob",
        evidence: { treasuryTicketId: "TKT-8841" },
      });

      assert.strictEqual(res.discrepancy.resolved, true);
      assert.strictEqual(res.recordStatus, "RESOLVED");
      assert.strictEqual(mockRecord.discrepancies[0].auditTrail.length, 1);
      assert.ok(mockRecord.discrepancies[0].auditTrail[0].notes.includes("supervisor_bob"));
    } finally {
      ReconciliationRecord.findOne = origFindOne;
    }
  });

  // ----------------------------------------------------------------------------
  // [Part 10] Client Verification Endpoint Authoritative Confirmation Guard
  // ----------------------------------------------------------------------------
  console.log("\n▶ [Part 10] Client GET Verification Authoritative Confirmation Guard");

  await runTest("handleLegacyVerification strictly rejects unconfirmed attempt with 400 Bad Request", async () => {
    const { paymentPlatformController } = await import(
      "../src/modules/payment/controllers/payment.controller.js"
    );
    const origFindOne = PaymentAttempt.findOne;
    const origRecover = paymentOrchestratorService.checkAndRecoverAttemptStatus;

    try {
      PaymentAttempt.findOne = async () => ({
        attemptId: "att_unconfirmed_01",
        intentId: "pi_01",
        status: PaymentAttemptStatus.PENDING,
      });

      // Gateway still reports pending / uncaptured
      paymentOrchestratorService.checkAndRecoverAttemptStatus = async () => ({
        status: PaymentAttemptStatus.PENDING,
        attempt: { status: PaymentAttemptStatus.PENDING },
      });

      const req = {
        params: {},
        query: { payment_id: "att_unconfirmed_01" },
      };
      let resStatus = null;
      let resBody = null;
      const res = {
        status: (code) => {
          resStatus = code;
          return {
            json: (body) => {
              resBody = body;
              return body;
            },
          };
        },
      };

      await paymentPlatformController.handleLegacyVerification(req, res, () => {});

      assert.strictEqual(resStatus, 400, "Must return HTTP 400 when gateway has not confirmed capture");
      assert.strictEqual(resBody.success, false);
      assert.ok(resBody.message.includes("Payment is not captured"));
    } finally {
      PaymentAttempt.findOne = origFindOne;
      paymentOrchestratorService.checkAndRecoverAttemptStatus = origRecover;
    }
  });

  await runTest("handleLegacyVerification succeeds when gateway authoritative recovery confirms CAPTURED", async () => {
    const { paymentPlatformController } = await import(
      "../src/modules/payment/controllers/payment.controller.js"
    );
    const origFindOne = PaymentAttempt.findOne;
    const origRecover = paymentOrchestratorService.checkAndRecoverAttemptStatus;

    try {
      PaymentAttempt.findOne = async () => ({
        attemptId: "att_captured_02",
        intentId: "pi_02",
        status: PaymentAttemptStatus.PENDING,
      });

      // Gateway confirms capture on authoritative inquiry
      paymentOrchestratorService.checkAndRecoverAttemptStatus = async () => ({
        status: PaymentAttemptStatus.CAPTURED,
        attempt: { status: PaymentAttemptStatus.CAPTURED },
      });

      const req = {
        params: {},
        query: { payment_id: "att_captured_02" },
      };
      let resStatus = null;
      let resBody = null;
      const res = {
        status: (code) => {
          resStatus = code;
          return {
            json: (body) => {
              resBody = body;
              return body;
            },
          };
        },
      };

      await paymentPlatformController.handleLegacyVerification(req, res, () => {});

      assert.strictEqual(resStatus, 200);
      assert.strictEqual(resBody.success, true);
      assert.strictEqual(resBody.status, "CAPTURED");
    } finally {
      PaymentAttempt.findOne = origFindOne;
      paymentOrchestratorService.checkAndRecoverAttemptStatus = origRecover;
    }
  });

  // ----------------------------------------------------------------------------
  // Final Test Summary
  // ----------------------------------------------------------------------------
  console.log("\n================================================================");
  console.log(`🏁 PHASE 24 TEST SUMMARY: ${testsPassed} PASSED | ${testsFailed} FAILED`);
  console.log("================================================================\n");

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runAll().catch((err) => {
  console.error("Unhandled error in Phase 24 test suite:", err);
  process.exit(1);
});
