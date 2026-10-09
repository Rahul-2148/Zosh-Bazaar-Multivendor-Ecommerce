import assert from "assert";
import mongoose from "mongoose";
import Money, { MAX_MONETARY_AMOUNT } from "../src/modules/payment/utils/Money.js";
import ledgerService from "../src/modules/payment/services/LedgerService.js";
import LedgerAccount, { EntryType } from "../src/modules/payment/domain/LedgerAccount.js";
import refundService from "../src/modules/payment/services/RefundService.js";
import walletService from "../src/modules/payment/services/WalletService.js";
import settlementService from "../src/modules/payment/services/SettlementService.js";
import paymentWebhookService from "../src/modules/payment/services/PaymentWebhookService.js";
import { PaymentAttempt } from "../src/modules/payment/models/paymentAttempt.model.js";
import PaymentStatus, { isValidPaymentTransition } from "../src/domain/PaymentStatus.js";
import { Order } from "../src/models/order.model.js";
import { Wallet } from "../src/modules/payment/models/wallet.model.js";
import { User } from "../src/models/user.model.js";
import reconciliationService from "../src/modules/payment/services/ReconciliationService.js";

console.log("\n================================================================");
console.log("🧪 ZOSH BAZAAR — PHASE 26 PAYMENT PLATFORM 12.1 ADVERSARIAL AUDIT");
console.log("================================================================\n");

let passed = 0;
let failed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
    failed++;
  }
}

async function runAsyncTest(name, fn) {
  try {
    await fn();
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
    failed++;
  }
}

async function main() {
  // Connect to MongoDB if not connected
  if (mongoose.connection.readyState === 0) {
    const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/zosh-bazaar-test";
    await mongoose.connect(mongoUri);
  }

  console.log("▶ [Domain 1] Adversarial Monetary Correctness & Sub-Paisa Rejection");

  runTest("Money: Strictly rejects sub-paisa fractional amount 10.005", () => {
    assert.throws(
      () => Money.validate(10.005, "testAmount"),
      (err) => err.code === "MALFORMED_MONETARY_AMOUNT"
    );
  });

  runTest("Money: Strictly rejects sub-paisa string '50.055' without silent Math.round", () => {
    assert.throws(
      () => Money.validate("50.055", "testAmount"),
      (err) => err.code === "MALFORMED_MONETARY_AMOUNT"
    );
  });

  runTest("Money: Strictly rejects micro-fractional amount 0.001", () => {
    assert.throws(
      () => Money.validate(0.001, "testAmount"),
      (err) => err.code === "MALFORMED_MONETARY_AMOUNT"
    );
  });

  runTest("Money: Strictly rejects scientific notation '1e-4'", () => {
    assert.throws(
      () => Money.validate("1e-4", "testAmount"),
      (err) => err.code === "MALFORMED_MONETARY_AMOUNT"
    );
  });

  runTest("Money: Strictly rejects negative amount -15.50", () => {
    assert.throws(
      () => Money.validate(-15.5, "testAmount"),
      (err) => err.code === "NON_POSITIVE_MONETARY_AMOUNT"
    );
  });

  runTest("Money: Strictly rejects zero amount when allowZero is false", () => {
    assert.throws(
      () => Money.validate(0, "testAmount", { allowZero: false }),
      (err) => err.code === "NON_POSITIVE_MONETARY_AMOUNT"
    );
  });

  runTest("Money: Accepts zero amount when allowZero is true", () => {
    const paise = Money.validate(0, "testAmount", { allowZero: true });
    assert.strictEqual(paise, 0);
  });

  runTest("Money: Strictly rejects overflow amount exceeding ₹99,999,999.99", () => {
    assert.throws(
      () => Money.validate(100000000.0, "testAmount"),
      (err) => err.code === "MONETARY_AMOUNT_OVERFLOW"
    );
  });

  runTest("Money: Exact minor unit conversion for ₹100.10 -> 10010 paise", () => {
    const paise = Money.toMinorUnits(100.1, "testAmount");
    assert.strictEqual(paise, 10010);
    assert.strictEqual(Money.fromMinorUnits(paise), 100.1);
  });

  runTest("Money: Exact minor unit addition ₹50.05 + ₹50.05 === ₹100.10", () => {
    const total = Money.add(50.05, 50.05);
    assert.strictEqual(total, 100.1);
  });

  runTest("Money: Exact minor unit subtraction ₹100.10 - ₹50.05 === ₹50.05", () => {
    const diff = Money.subtract(100.1, 50.05);
    assert.strictEqual(diff, 50.05);
  });

  console.log("\n▶ [Domain 2] Immutable Double-Entry Ledger Invariant Verification");

  await runAsyncTest("Ledger: Strictly rejects sub-paisa posting (e.g. ₹10.005)", async () => {
    await assert.rejects(
      async () => {
        await ledgerService.postJournal({
          referenceType: "TEST_SUBPAISA",
          referenceId: "sub_1",
          postings: [
            {
              account: LedgerAccount.GATEWAY_CLEARING,
              entryType: EntryType.DEBIT,
              amount: 10.005,
            },
            {
              account: LedgerAccount.CUSTOMER_WALLET,
              entryType: EntryType.CREDIT,
              amount: 10.005,
            },
          ],
        });
      },
      (err) => err.code === "MALFORMED_MONETARY_AMOUNT"
    );
  });

  await runAsyncTest("Ledger: Rejects unbalanced debits and credits in minor units", async () => {
    await assert.rejects(
      async () => {
        await ledgerService.postJournal({
          referenceType: "TEST_UNBALANCED",
          referenceId: "unbal_1",
          postings: [
            {
              account: LedgerAccount.GATEWAY_CLEARING,
              entryType: EntryType.DEBIT,
              amount: 100.0,
            },
            {
              account: LedgerAccount.CUSTOMER_WALLET,
              entryType: EntryType.CREDIT,
              amount: 99.99,
            },
          ],
        });
      },
      (err) => err.message.includes("Ledger journal is unbalanced")
    );
  });

  await runAsyncTest("Ledger: Balanced journal posting succeeds and computes exact balance", async () => {
    const refId = `audit_test_${Date.now()}`;
    const key = `key_${refId}`;
    const result = await ledgerService.postJournal({
      referenceType: "ADJUSTMENT",
      referenceId: refId,
      idempotencyKey: key,
      description: "Balanced audit test journal",
      postings: [
        {
          account: LedgerAccount.GATEWAY_CLEARING,
          entryType: EntryType.DEBIT,
          amount: 250.5,
          partyType: "GATEWAY",
          partyId: "ACQUIRER_1",
        },
        {
          account: LedgerAccount.CUSTOMER_WALLET,
          entryType: EntryType.CREDIT,
          amount: 250.5,
          partyType: "CUSTOMER",
          partyId: "CUST_AUDIT_1",
        },
      ],
    });

    assert.strictEqual(result.alreadyPosted, false);
    assert.strictEqual(result.journal.totalAmount, 250.5);

    // Duplicate submission is idempotent
    const duplicate = await ledgerService.postJournal({
      referenceType: "ADJUSTMENT",
      referenceId: refId,
      idempotencyKey: key,
      postings: [
        {
          account: LedgerAccount.GATEWAY_CLEARING,
          entryType: EntryType.DEBIT,
          amount: 250.5,
        },
        {
          account: LedgerAccount.CUSTOMER_WALLET,
          entryType: EntryType.CREDIT,
          amount: 250.5,
        },
      ],
    });
    assert.strictEqual(duplicate.alreadyPosted, true);
  });

  console.log("\n▶ [Domain 3] Wallet & Refund Boundary Verification");

  await runAsyncTest("Wallet: Rejects sub-paisa top-up amount ₹10.005", async () => {
    const dummyUserId = new mongoose.Types.ObjectId();
    await assert.rejects(
      async () => {
        await walletService.topupWallet(dummyUserId, 10.005, "src_test");
      },
      (err) => err.code === "MALFORMED_MONETARY_AMOUNT"
    );
  });

  await runAsyncTest("Refund: Rejects sub-paisa refund amount ₹25.005", async () => {
    // Create mock order with all required fields
    const order = await Order.create({
      user: new mongoose.Types.ObjectId(),
      seller: new mongoose.Types.ObjectId(),
      orderItems: [new mongoose.Types.ObjectId()],
      shippingAddress: new mongoose.Types.ObjectId(),
      totalMrpPrice: 500.0,
      totalSellingPrice: 500.0,
      totalItems: 1,
      orderStatus: "DELIVERED",
      paymentStatus: "COMPLETED",
    });

    await assert.rejects(
      async () => {
        await refundService.createRefund({
          orderId: order._id,
          amount: 25.005,
          reason: "Adversarial sub-paisa test",
        });
      },
      (err) => err.code === "MALFORMED_MONETARY_AMOUNT"
    );
  });

  console.log("\n▶ [Domain 4] Webhook Security & Amount Verification");

  await runAsyncTest("Webhook: Rejects sub-paisa amount mismatch adversarial injection", async () => {
    const origAttemptFindOne = PaymentAttempt.findOne;
    const WebhookModelModule = await import("../src/models/paymentWebhookEvent.model.js");
    const PaymentWebhookEventModel = WebhookModelModule.default;
    const origEventFindOne = PaymentWebhookEventModel.findOne;
    const origSave = PaymentWebhookEventModel.prototype.save;

    try {
      PaymentAttempt.findOne = async () => ({
        attemptId: "att_audit_01",
        intentId: "int_audit_01",
        provider: "CASHFREE",
        adapter: "CASHFREE",
        providerReference: "cf_pay_audit_01",
        amount: 10.01,
        currency: "INR",
        status: "PENDING",
      });

      PaymentWebhookEventModel.findOne = async () => null;
      PaymentWebhookEventModel.prototype.save = async function () { return this; };

      const payload = {
        type: "PAYMENT_SUCCESS_WEBHOOK",
        data: {
          order: { order_id: "cf_pay_audit_01", order_amount: 10.005, order_currency: "INR" },
          payment: { payment_id: "cf_pay_audit_01", payment_amount: 10.005, payment_status: "SUCCESS" },
        },
      };

      await assert.rejects(
        async () => {
          await paymentWebhookService.processWebhook({
            provider: "CASHFREE",
            payload,
            signature: "",
            rawBody: Buffer.from(JSON.stringify(payload)),
          });
        },
        (err) => err.code === "MALFORMED_MONETARY_AMOUNT"
      );
    } finally {
      PaymentAttempt.findOne = origAttemptFindOne;
      PaymentWebhookEventModel.findOne = origEventFindOne;
      PaymentWebhookEventModel.prototype.save = origSave;
    }
  });

  console.log("\n▶ [Domain 5] Settlement Fee Split Mathematical Conservation");

  runTest("Settlement: Fee split identity guarantees 100% exact minor-unit conservation", () => {
    const testAmounts = [100.0, 100.1, 499.99, 1250.75, 99999.99];

    for (const gross of testAmounts) {
      const split = settlementService.calculateSellerSettlement({
        grossOrderAmount: gross,
        commissionRatePercent: 5.0,
        gatewayFeePercent: 2.0,
        tcsRatePercent: 1.0,
      });

      const grossPaise = Money.toMinorUnits(gross, "gross");
      const commPaise = Money.toMinorUnits(split.platformFee, "platformFee");
      const gwPaise = Money.toMinorUnits(split.gatewayFee, "gatewayFee");
      const taxPaise = Money.toMinorUnits(split.taxDeduction, "taxDeduction");
      const netPaise = Money.toMinorUnits(split.netPayout, "netPayout");

      assert.strictEqual(
        grossPaise,
        commPaise + gwPaise + taxPaise + netPaise,
        `Fee split leaked paise for gross ₹${gross}!`
      );
    }
  });

  console.log("\n▶ [Domain 6] State Machine Terminal Protection & Maker-Checker");

  runTest("State Machine: FAILED is a terminal state that cannot transition to CAPTURED", () => {
    assert.strictEqual(isValidPaymentTransition(PaymentStatus.FAILED, PaymentStatus.CAPTURED), false);
    assert.strictEqual(isValidPaymentTransition(PaymentStatus.REFUNDED, PaymentStatus.CAPTURED), false);
    assert.strictEqual(isValidPaymentTransition(PaymentStatus.CANCELLED, PaymentStatus.CAPTURED), false);
  });

  runTest("State Machine: PENDING can transition to CAPTURED or FAILED", () => {
    assert.strictEqual(isValidPaymentTransition(PaymentStatus.PENDING, PaymentStatus.CAPTURED), true);
    assert.strictEqual(isValidPaymentTransition(PaymentStatus.PENDING, PaymentStatus.FAILED), true);
  });

  await runAsyncTest("Maker-Checker: Same operator cannot self-approve critical reconciliation discrepancy", async () => {
    const ReconciliationModule = await import("../src/modules/payment/models/reconciliationRecord.model.js");
    const ReconciliationRecord = ReconciliationModule.ReconciliationRecord;
    const origFindOne = ReconciliationRecord.findOne;

    try {
      ReconciliationRecord.findOne = async () => ({
        reconciliationId: "rec_audit_01",
        discrepancies: [
          {
            referenceId: "disc_audit_101",
            severity: "CRITICAL",
            resolved: false,
            auditTrail: [],
          },
        ],
        save: async function () { return this; },
      });

      await assert.rejects(
        async () => {
          await reconciliationService.resolveDiscrepancy({
            reconciliationId: "rec_audit_01",
            referenceId: "disc_audit_101",
            resolutionStatus: "RESOLVED_MANUAL_ADJUSTMENT",
            reason: "Audit manual match investigation with external statement verification",
            operatorId: "operator_audit_1",
            checkerId: "operator_audit_1", // Conflict!
          });
        },
        (err) => err.code === "MAKER_CHECKER_CONFLICT"
      );
    } finally {
      ReconciliationRecord.findOne = origFindOne;
    }
  });

  console.log("\n================================================================");
  console.log(`🏁 PHASE 26 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log("================================================================\n");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("Fatal error in test runner:", err);
  process.exit(1);
});
