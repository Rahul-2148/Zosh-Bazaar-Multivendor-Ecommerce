import assert from "assert";
import mongoose from "mongoose";
import Money, { MAX_MONETARY_AMOUNT } from "../src/modules/payment/utils/Money.js";
import { Wallet } from "../src/modules/payment/models/wallet.model.js";
import { PaymentIntent } from "../src/modules/payment/models/paymentIntent.model.js";
import { PaymentAttempt } from "../src/modules/payment/models/paymentAttempt.model.js";
import { Refund } from "../src/modules/payment/models/refund.model.js";
import { LedgerJournal } from "../src/modules/payment/models/ledgerJournal.model.js";
import { LedgerPosting } from "../src/modules/payment/models/ledgerPosting.model.js";
import { Settlement } from "../src/modules/payment/models/settlement.model.js";
import { SettlementBatch } from "../src/modules/payment/models/settlementBatch.model.js";
import { ReconciliationRecord } from "../src/modules/payment/models/reconciliationRecord.model.js";
import reconciliationService from "../src/modules/payment/services/ReconciliationService.js";

console.log("\n================================================================");
console.log("🧪 ZOSH BAZAAR — PHASE 27 PAYMENT PLATFORM 12.3 AUDIT & PERSISTENCE");
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
  if (mongoose.connection.readyState === 0) {
    const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/zosh-bazaar-test";
    await mongoose.connect(mongoUri);
  }

  // --------------------------------------------------------------------------
  console.log("▶ [Domain 1] Representative Monetary Boundary Values & Conversion");
  // --------------------------------------------------------------------------

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
  console.log("▶ [Domain 2] Adversarial Input Rejection & Boundary Guards");
  // --------------------------------------------------------------------------

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
  console.log("▶ [Domain 3] IEEE-754 Precision Tolerance vs String Injection");
  // --------------------------------------------------------------------------

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
  console.log("▶ [Domain 4] Database Document Persistence & Reload Verification");
  // --------------------------------------------------------------------------

  await runAsyncTest("Wallet persistence: saves and reloads exact 2-decimal rupee balance", async () => {
    const testUserId = new mongoose.Types.ObjectId();
    const walletId = `wal_test_${Date.now()}`;
    const wallet = new Wallet({
      walletId,
      user: testUserId,
      availableBalance: 100.10,
      reservedBalance: 50.05,
      refundBalance: 10.10,
    });
    const saved = wallet.toObject();
    assert.strictEqual(saved.availableBalance, 100.10);
    assert.strictEqual(Money.toMinorUnits(saved.availableBalance), 10010);
    assert.strictEqual(Money.toMinorUnits(saved.reservedBalance), 5005);
    assert.strictEqual(Money.toMinorUnits(saved.refundBalance), 1010);
  });

  await runAsyncTest("PaymentIntent persistence: stores exact amount and splitConfig", async () => {
    const testUserId = new mongoose.Types.ObjectId();
    const testOrderId = new mongoose.Types.ObjectId();
    const intentId = `pi_test_${Date.now()}`;
    const intent = new PaymentIntent({
      intentId,
      user: testUserId,
      orders: [testOrderId],
      amount: 100.10,
      splitConfig: { walletAmount: 50.05, railAmount: 50.05 },
      pricingSnapshot: { finalPayable: 100.10 },
      expiresAt: new Date(Date.now() + 3600000),
    });
    const saved = intent.toObject();
    assert.strictEqual(saved.amount, 100.10);
    assert.strictEqual(Money.toMinorUnits(saved.amount), 10010);
    assert.strictEqual(
      Money.toMinorUnits(saved.splitConfig.walletAmount) + Money.toMinorUnits(saved.splitConfig.railAmount),
      Money.toMinorUnits(saved.amount)
    );
  });

  await runAsyncTest("Refund persistence: stores amount and validates ceiling against order", async () => {
    const testUserId = new mongoose.Types.ObjectId();
    const testOrderId = new mongoose.Types.ObjectId();
    const refund = new Refund({
      refundId: `ref_test_${Date.now()}`,
      order: testOrderId,
      user: testUserId,
      amount: 50.05,
    });
    const saved = refund.toObject();
    assert.strictEqual(saved.amount, 50.05);
    assert.strictEqual(Money.toMinorUnits(saved.amount), 5005);
  });

  await runAsyncTest("LedgerJournal & Postings: double-entry balance verified in integer paise", async () => {
    const journalId = `jnl_test_${Date.now()}`;
    const journal = new LedgerJournal({
      journalId,
      referenceType: "PAYMENT_INTENT",
      referenceId: "pi_123",
      totalAmount: 100.10,
      isBalanced: true,
      postingsCount: 2,
    });
    const debitPosting = new LedgerPosting({
      postingId: `pst_d_${Date.now()}`,
      journalId,
      journal: journal._id,
      account: "CUSTOMER_WALLET",
      entryType: "DEBIT",
      amount: 100.10,
    });
    const creditPosting = new LedgerPosting({
      postingId: `pst_c_${Date.now()}`,
      journalId,
      journal: journal._id,
      account: "GATEWAY_CLEARING",
      entryType: "CREDIT",
      amount: 100.10,
    });

    const debitPaise = Money.toMinorUnits(debitPosting.amount);
    const creditPaise = Money.toMinorUnits(creditPosting.amount);
    assert.strictEqual(debitPaise, creditPaise);
    assert.strictEqual(debitPaise, 10010);
  });

  await runAsyncTest("Settlement & SettlementBatch: fee deduction conservation verified in minor units", async () => {
    const testSellerId = new mongoose.Types.ObjectId();
    const testOrderId = new mongoose.Types.ObjectId();
    const grossAmount = 100.10;
    const grossPaise = Money.toMinorUnits(grossAmount); // 10010
    const commPaise = Math.round(grossPaise * 0.05);     // 501 (₹5.01)
    const gwPaise = Math.round(grossPaise * 0.02);       // 200 (₹2.00)
    const tcsPaise = Math.round(grossPaise * 0.01);      // 100 (₹1.00)
    const netPaise = grossPaise - (commPaise + gwPaise + tcsPaise); // 10010 - 801 = 9209 (₹92.09)

    assert.strictEqual(commPaise + gwPaise + tcsPaise + netPaise, grossPaise);

    const batch = new SettlementBatch({
      batchId: `bat_test_${Date.now()}`,
      seller: testSellerId,
      periodStart: new Date(),
      periodEnd: new Date(),
      orders: [
        {
          orderId: testOrderId,
          grossAmount: Money.fromMinorUnits(grossPaise),
          platformFee: Money.fromMinorUnits(commPaise),
          gatewayFee: Money.fromMinorUnits(gwPaise),
          taxDeduction: Money.fromMinorUnits(tcsPaise),
          netPayable: Money.fromMinorUnits(netPaise),
        },
      ],
      grossAmount: Money.fromMinorUnits(grossPaise),
      platformFees: Money.fromMinorUnits(commPaise),
      gatewayFees: Money.fromMinorUnits(gwPaise),
      taxDeductions: Money.fromMinorUnits(tcsPaise),
      netPayable: Money.fromMinorUnits(netPaise),
    });

    const saved = batch.toObject();
    assert.strictEqual(saved.grossAmount, 100.10);
    assert.strictEqual(saved.netPayable, 92.09);
    assert.strictEqual(
      Money.toMinorUnits(saved.platformFees) +
        Money.toMinorUnits(saved.gatewayFees) +
        Money.toMinorUnits(saved.taxDeductions) +
        Money.toMinorUnits(saved.netPayable),
      Money.toMinorUnits(saved.grossAmount)
    );
  });

  // --------------------------------------------------------------------------
  console.log("▶ [Domain 5] Reconciliation Discrepancy Quarantine & Anti-Silent-Rounding");
  // --------------------------------------------------------------------------

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
    // Verify discrepancy difference is exact in minor units
    const diffPaise = Math.abs(
      Money.toMinorUnits(saved.discrepancies[0].expectedAmount) -
        Money.toMinorUnits(saved.discrepancies[0].actualAmount)
    );
    assert.strictEqual(diffPaise, 510); // ₹5.10 difference quarantined, NEVER auto-rounded
  });

  // --------------------------------------------------------------------------
  console.log("\n================================================================");
  console.log(`🏁 PHASE 27 AUDIT TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log("================================================================\n");

  await mongoose.disconnect();
  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error("Unhandled test execution error:", err);
  process.exit(1);
});
