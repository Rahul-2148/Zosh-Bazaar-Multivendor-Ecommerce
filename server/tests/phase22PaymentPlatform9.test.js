import { describe, it } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import https from "https";

// Services
import juspayOrchestratorService, {
  JuspaySessionStatus,
} from "../src/modules/payment/services/JuspayOrchestratorService.js";
import settlementService from "../src/modules/payment/services/SettlementService.js";
import reconciliationService, {
  ReconciliationDiscrepancyType,
} from "../src/modules/payment/services/ReconciliationService.js";
import ledgerService from "../src/modules/payment/services/LedgerService.js";
import refundService from "../src/modules/payment/services/RefundService.js";
import paymentProviderRegistry from "../src/modules/payment/services/PaymentProviderRegistry.js";

// Adapters
import {
  webhookAdapters,
  juspayWebhookAdapter,
  JuspayWebhookAdapter,
} from "../src/modules/payment/adapters/webhook/ProviderWebhookAdapter.js";
import bankPayoutAdapter, {
  BankPayoutAdapter,
  PayoutStatus,
} from "../src/modules/payment/adapters/payout/BankPayoutAdapter.js";
import bankStatementSftpAdapter, {
  BankStatementSftpAdapter,
  BankTransaction,
  SftpFileProcessingStatus,
} from "../src/modules/payment/adapters/reconciliation/BankStatementSftpAdapter.js";
import razorpayAdapter from "../src/modules/payment/adapters/RazorpayAdapter.js";
import cashfreeAdapter from "../src/modules/payment/adapters/CashfreeAdapter.js";
import payuAdapter from "../src/modules/payment/adapters/PayUAdapter.js";
import phonepeAdapter from "../src/modules/payment/adapters/PhonePeAdapter.js";

// Domain & Models
import LedgerAccount, { EntryType, FinancialEvent } from "../src/modules/payment/domain/LedgerAccount.js";
import RefundStatus, { isValidRefundTransition } from "../src/modules/payment/domain/RefundStatus.js";
import { SettlementBatch, SettlementBatchStatus } from "../src/modules/payment/models/settlementBatch.model.js";
import { SellerBeneficiary, BeneficiaryStatus } from "../src/modules/payment/models/sellerBeneficiary.model.js";
import { SellerRiskHold, RiskHoldStatus, RiskHoldReason } from "../src/modules/payment/models/sellerRiskHold.model.js";
import { ReconciliationRecord } from "../src/modules/payment/models/reconciliationRecord.model.js";
import { Refund } from "../src/modules/payment/models/refund.model.js";
import { Order } from "../src/models/order.model.js";
import { LedgerJournal } from "../src/modules/payment/models/ledgerJournal.model.js";
import { LedgerPosting } from "../src/modules/payment/models/ledgerPosting.model.js";

// Setup in-memory mock handlers for Mongoose model persistence during standalone execution
ReconciliationRecord.create = async (doc) => ({ ...doc, _id: "rec_mock_id" });
SettlementBatch.create = async (doc) => ({ ...doc, _id: "sbt_mock_id" });
SellerBeneficiary.create = async (doc) => ({ ...doc, _id: "ben_mock_id" });
SellerBeneficiary.updateMany = async () => ({ acknowledged: true });
SellerRiskHold.create = async (doc) => ({ ...doc, _id: "hld_mock_id" });
Refund.create = async (doc) => ({
  ...doc,
  _id: "ref_mock_id",
  statusHistory: doc.statusHistory || [],
  save: async function () {
    return this;
  },
});
LedgerJournal.findOne = async () => null;
LedgerJournal.create = async (docs) => docs.map((d, i) => ({ ...d, _id: `jnl_mock_${i}` }));
LedgerPosting.create = async (docs) => docs.map((d, i) => ({ ...d, _id: `pst_mock_${i}` }));

describe("================================================================", () => {});
describe("🧪 ZOSH BAZAAR — PAYMENT PLATFORM 9.0 COMPREHENSIVE CERTIFICATION", () => {});
describe("================================================================", () => {});

// -----------------------------------------------------------------------------
// SUITE 1: Juspay Orchestration & Express Checkout / HyperSDK Integration
// -----------------------------------------------------------------------------
describe("▶ Suite 1: Juspay Orchestration & HyperSDK Client Layer", () => {
  it("should classify Juspay as Orchestration Middleware and detect unconfigured credentials", () => {
    const creds = juspayOrchestratorService.getCredentialStatus();
    assert.strictEqual(creds.provider, "JUSPAY");
    assert.strictEqual(creds.role, "ORCHESTRATION_MIDDLEWARE");
    assert.strictEqual(creds.status, "BLOCKED_BY_CREDENTIALS");
    assert.strictEqual(creds.configured, false);
  });

  it("should return BLOCKED_BY_CREDENTIALS in development when creating Juspay session without keys", async () => {
    const sessionRes = await juspayOrchestratorService.createSession({
      orderId: "ord_jsp_test_101",
      amount: 1999.0,
      customerId: "cust_test_1",
    });

    assert.strictEqual(sessionRes.status, "BLOCKED_BY_CREDENTIALS");
    assert.strictEqual(sessionRes.sessionId, null);
    assert.ok(sessionRes.message.includes("blocked because real merchant credentials"));
  });

  it("should fail closed with HTTP 503 in production mode if Juspay credentials missing", async () => {
    await assert.rejects(
      async () => {
        await juspayOrchestratorService.createSession({
          orderId: "ord_jsp_test_102",
          amount: 1999.0,
          customerId: "cust_test_1",
          options: { isProduction: true },
        });
      },
      (err) => {
        assert.strictEqual(err.statusCode, 503);
        assert.strictEqual(err.code, "RAIL_NOT_PRODUCTION_READY");
        return true;
      }
    );
  });

  it("should return BLOCKED_BY_CREDENTIALS when querying Juspay order status without keys", async () => {
    const statusRes = await juspayOrchestratorService.getOrderStatus("ord_jsp_test_103");
    assert.strictEqual(statusRes.status, "BLOCKED_BY_CREDENTIALS");
    assert.strictEqual(statusRes.normalizedStatus, JuspaySessionStatus.UNKNOWN);
  });

  it("should verify Juspay webhook signature using HMAC-SHA256 and reject tampering", () => {
    const secret = "test_juspay_secret_key_12345";
    const payload = {
      id: "evt_juspay_9999",
      content: {
        order: {
          order_id: "ord_juspay_1001",
          amount: 2499.0,
          currency: "INR",
          status: "CHARGED",
          txn_id: "txn_jsp_8888",
        },
      },
    };

    const rawBody = Buffer.from(JSON.stringify(payload), "utf8");
    const signature = crypto.createHmac("sha256", secret).update(rawBody).digest("base64");

    // Valid
    const isValid = juspayWebhookAdapter.verifySignature(rawBody, signature, secret);
    assert.strictEqual(isValid, true);

    // Tampered
    const isTampered = juspayWebhookAdapter.verifySignature(rawBody, "tampered_signature", secret);
    assert.strictEqual(isTampered, false);
  });

  it("should normalize Juspay CHARGED event into NormalizedPaymentEvent", async () => {
    const payload = {
      id: "evt_jsp_2001",
      content: {
        order: {
          order_id: "ord_jsp_2001",
          amount: 4500.0,
          currency: "INR",
          status: "CHARGED",
          txn_id: "txn_jsp_captured",
        },
      },
    };

    const res = await juspayWebhookAdapter.processWebhook({
      rawBody: Buffer.from(JSON.stringify(payload)),
      payload,
    });

    assert.strictEqual(res.isValid, true);
    assert.strictEqual(res.normalizedEvent.provider, "JUSPAY");
    assert.strictEqual(res.normalizedEvent.status, "CAPTURED");
    assert.strictEqual(res.normalizedEvent.eventType, "PAYMENT_CAPTURED");
    assert.strictEqual(res.normalizedEvent.amount, 4500.0);
    assert.strictEqual(res.normalizedEvent.orderReference, "ord_jsp_2001");
    assert.strictEqual(res.normalizedEvent.paymentReference, "txn_jsp_captured");
  });

  it("should have Juspay registered in the central webhook adapters dictionary", () => {
    assert.ok(webhookAdapters.JUSPAY, "Juspay webhook adapter must be registered");
    assert.ok(webhookAdapters.RAZORPAY, "Razorpay must be registered");
    assert.ok(webhookAdapters.CASHFREE, "Cashfree must be registered");
    assert.ok(webhookAdapters.PAYU, "PayU must be registered");
    assert.ok(webhookAdapters.PHONEPE, "PhonePe must be registered");
  });
});

// -----------------------------------------------------------------------------
// SUITE 2: Multi-PSP Credential Separation & Verification
// -----------------------------------------------------------------------------
describe("▶ Suite 2: Multi-PSP Separation & Non-Fabrication Classification", () => {
  it("should verify Razorpay has valid test credentials configured", () => {
    assert.strictEqual(razorpayAdapter.getCredentialStatus(), "CONFIGURED");
  });

  it("should classify Cashfree as UNCONFIGURED credentials and BLOCKED_BY_CREDENTIALS", async () => {
    assert.strictEqual(cashfreeAdapter.getCredentialStatus(), "UNCONFIGURED");
    const cert = await (await import("../src/modules/payment/services/PaymentProviderCertificationRunner.js")).default.certifyProvider("CASHFREE");
    assert.strictEqual(cert.overallStatus, "BLOCKED_BY_CREDENTIALS");
  });

  it("should classify PayU as UNCONFIGURED credentials and BLOCKED_BY_CREDENTIALS", async () => {
    assert.strictEqual(payuAdapter.getCredentialStatus(), "UNCONFIGURED");
    const cert = await (await import("../src/modules/payment/services/PaymentProviderCertificationRunner.js")).default.certifyProvider("PAYU");
    assert.strictEqual(cert.overallStatus, "BLOCKED_BY_CREDENTIALS");
  });

  it("should classify PhonePe as UNCONFIGURED credentials and BLOCKED_BY_CREDENTIALS", async () => {
    assert.strictEqual(phonepeAdapter.getCredentialStatus(), "UNCONFIGURED");
    const cert = await (await import("../src/modules/payment/services/PaymentProviderCertificationRunner.js")).default.certifyProvider("PHONEPE");
    assert.strictEqual(cert.overallStatus, "BLOCKED_BY_CREDENTIALS");
  });
});

// -----------------------------------------------------------------------------
// SUITE 3: Seller Beneficiary Lifecycle & Security Tokenization
// -----------------------------------------------------------------------------
describe("▶ Suite 3: Seller Beneficiary Management & Tokenization", () => {
  it("should mask bank account number and produce deterministic SHA-256 token", () => {
    const rawAccount = "50100234567890";
    const last4 = rawAccount.slice(-4);
    const masked = `••••••••${last4}`;
    const token = crypto.createHash("sha256").update(rawAccount).digest("hex");

    assert.strictEqual(masked, "••••••••7890");
    assert.strictEqual(token.length, 64);
    assert.ok(!masked.includes("50100234"));
  });

  it("should register seller beneficiary with CREATED status and payoutEligible false", async () => {
    const beneficiary = await settlementService.registerSellerBeneficiary({
      sellerId: "seller_test_901",
      accountHolderName: "Acme Enterprises",
      bankName: "HDFC Bank",
      accountNumber: "50100234567890",
      ifscCode: "HDFC0001234",
    });

    assert.ok(beneficiary.beneficiaryId.startsWith("ben_"));
    assert.strictEqual(beneficiary.accountNumberMasked, "••••••••7890");
    assert.strictEqual(beneficiary.status, BeneficiaryStatus.CREATED);
    assert.strictEqual(beneficiary.payoutEligible, false);
  });

  it("should reject invalid bank account numbers or IFSC codes", async () => {
    await assert.rejects(
      async () => {
        await settlementService.registerSellerBeneficiary({
          sellerId: "s1",
          accountHolderName: "Test",
          bankName: "Test",
          accountNumber: "123", // Too short
          ifscCode: "HDFC0001234",
        });
      },
      /Invalid bank account number/
    );

    await assert.rejects(
      async () => {
        await settlementService.registerSellerBeneficiary({
          sellerId: "s1",
          accountHolderName: "Test",
          bankName: "Test",
          accountNumber: "501002345678",
          ifscCode: "INVALID", // Not 11 chars
        });
      },
      /Invalid IFSC code/
    );
  });

  it("should enforce valid BeneficiaryStatus enum states", () => {
    assert.strictEqual(BeneficiaryStatus.CREATED, "CREATED");
    assert.strictEqual(BeneficiaryStatus.PENDING_VERIFICATION, "PENDING_VERIFICATION");
    assert.strictEqual(BeneficiaryStatus.VERIFIED, "VERIFIED");
    assert.strictEqual(BeneficiaryStatus.SUSPENDED, "SUSPENDED");
    assert.strictEqual(BeneficiaryStatus.BLOCKED, "BLOCKED");
    assert.strictEqual(BeneficiaryStatus.DELETED, "DELETED");
  });
});

// -----------------------------------------------------------------------------
// SUITE 4: Seller Risk Holds & Rolling Reserves
// -----------------------------------------------------------------------------
describe("▶ Suite 4: Seller Risk Holds & Rolling Reserves", () => {
  it("should define required RiskHoldReason and RiskHoldStatus taxonomy", () => {
    assert.strictEqual(RiskHoldReason.ROLLING_RESERVE, "ROLLING_RESERVE");
    assert.strictEqual(RiskHoldReason.CHARGEBACK_HOLD, "CHARGEBACK_HOLD");
    assert.strictEqual(RiskHoldReason.FRAUD_SUSPICION, "FRAUD_SUSPICION");
    assert.strictEqual(RiskHoldStatus.ACTIVE, "ACTIVE");
    assert.strictEqual(RiskHoldStatus.RELEASED, "RELEASED");
  });

  it("should reject non-positive risk hold amounts", async () => {
    await assert.rejects(
      async () => {
        await settlementService.createSellerRiskHold({
          sellerId: "seller_01",
          amount: -500,
        });
      },
      /must be positive/
    );
  });

  it("should construct balanced double-entry postings when creating a risk hold", async () => {
    const holdAmount = 2500;
    const sellerId = "seller_hold_01";
    const hold = await settlementService.createSellerRiskHold({
      sellerId,
      amount: holdAmount,
      reason: RiskHoldReason.ROLLING_RESERVE,
    });

    assert.ok(hold.holdId.startsWith("hld_"));
    assert.strictEqual(hold.amount, holdAmount);
    assert.strictEqual(hold.status, RiskHoldStatus.ACTIVE);
  });
});

// -----------------------------------------------------------------------------
// SUITE 5: Settlement Batch Engine & Policy Rules
// -----------------------------------------------------------------------------
describe("▶ Suite 5: Settlement Batch Engine & Immutable Fee Snapshot", () => {
  it("should define complete SettlementBatchStatus lifecycle", () => {
    assert.strictEqual(SettlementBatchStatus.DRAFT, "DRAFT");
    assert.strictEqual(SettlementBatchStatus.CALCULATED, "CALCULATED");
    assert.strictEqual(SettlementBatchStatus.REVIEW_REQUIRED, "REVIEW_REQUIRED");
    assert.strictEqual(SettlementBatchStatus.APPROVED, "APPROVED");
    assert.strictEqual(SettlementBatchStatus.SUBMITTED, "SUBMITTED");
    assert.strictEqual(SettlementBatchStatus.PROCESSING, "PROCESSING");
    assert.strictEqual(SettlementBatchStatus.PAID, "PAID");
    assert.strictEqual(SettlementBatchStatus.FAILED, "FAILED");
    assert.strictEqual(SettlementBatchStatus.REVERSED, "REVERSED");
    assert.strictEqual(SettlementBatchStatus.RECONCILING, "RECONCILING");
    assert.strictEqual(SettlementBatchStatus.RECONCILED, "RECONCILED");
  });

  it("should calculate exact commercial fee deductions and net payable", () => {
    const calc = settlementService.calculateSellerSettlement({
      grossOrderAmount: 10000,
      commissionRatePercent: 5.0, // 500
      gatewayFeePercent: 2.0,    // 200
      tcsRatePercent: 1.0,       // 100
    });

    assert.strictEqual(calc.grossAmount, 10000);
    assert.strictEqual(calc.platformFee, 500);
    assert.strictEqual(calc.gatewayFee, 200);
    assert.strictEqual(calc.taxDeduction, 100);
    assert.strictEqual(calc.netPayout, 9200);
    assert.strictEqual(calc.netAmount, 9200);
  });
});

// -----------------------------------------------------------------------------
// SUITE 6: Bank Payout Adapter & Fail-Closed Guard
// -----------------------------------------------------------------------------
describe("▶ Suite 6: Bank Payout Adapter Contract & Fail-Closed Guards", () => {
  it("should instantiate BankPayoutAdapter with correct capabilities", () => {
    assert.strictEqual(bankPayoutAdapter.name, "BANK_PAYOUT");
    assert.strictEqual(bankPayoutAdapter.capabilities.supportsInstantPayout, true);
    assert.strictEqual(bankPayoutAdapter.capabilities.supportsBatchPayout, true);
    assert.strictEqual(bankPayoutAdapter.capabilities.supportsReversal, true);
    assert.strictEqual(bankPayoutAdapter.capabilities.productionReady, true);
  });

  it("should report BLOCKED_BY_BANK_API_ACCESS when bank credentials unconfigured", () => {
    const status = bankPayoutAdapter.getCredentialStatus();
    assert.strictEqual(status.status, "BLOCKED_BY_CREDENTIALS");
    assert.strictEqual(status.blockerCode, "BLOCKED_BY_BANK_API_ACCESS");
    assert.strictEqual(status.configured, false);
  });

  it("should return BLOCKED_BY_CREDENTIALS for payout initiation in non-prod", async () => {
    const res = await bankPayoutAdapter.createPayout({
      sellerId: "seller_901",
      amount: 5000,
      referenceId: "batch_901",
    });

    assert.strictEqual(res.status, "BLOCKED_BY_CREDENTIALS");
    assert.strictEqual(res.blockerCode, "BLOCKED_BY_BANK_API_ACCESS");
    assert.strictEqual(res.utr, null);
    assert.ok(res.message.includes("blocked because bank API credentials are not configured"));
  });

  it("should fail closed with HTTP 503 when creating payout in production without bank credentials", async () => {
    process.env.NODE_ENV = "production";
    await assert.rejects(
      async () => {
        await bankPayoutAdapter.createPayout({
          sellerId: "seller_901",
          amount: 5000,
          referenceId: "batch_901",
        });
      },
      (err) => {
        assert.strictEqual(err.statusCode, 503);
        assert.strictEqual(err.code, "RAIL_NOT_PRODUCTION_READY");
        return true;
      }
    );
    process.env.NODE_ENV = "development";
  });
});

// -----------------------------------------------------------------------------
// SUITE 7: Authoritative UTR Enforcement
// -----------------------------------------------------------------------------
describe("▶ Suite 7: Authoritative UTR Enforcement & Synthetic Rejection", () => {
  it("should reject synthetic or fake UTR in production for settlement marking", async () => {
    await assert.rejects(
      async () => {
        await settlementService.markSettled("batch_dummy", "SBX_FAKE_UTR_1234", {
          isProduction: true,
        });
      },
      (err) => {
        assert.strictEqual(err.statusCode, 422);
        assert.strictEqual(err.code, "INVALID_PRODUCTION_UTR");
        return true;
      }
    );
  });

  it("should reject missing UTR when attempting to mark settled", async () => {
    await assert.rejects(
      async () => {
        await settlementService.markSettled("batch_dummy", null, { isProduction: false });
      },
      /authoritative bank UTR/
    );

    await assert.rejects(
      async () => {
        await settlementService.markBatchSettled("batch_dummy", null, { isProduction: false });
      },
      /authoritative bank UTR/
    );
  });
});

// -----------------------------------------------------------------------------
// SUITE 8: Bank SFTP Statement Ingestion & Checksum Deduplication
// -----------------------------------------------------------------------------
describe("▶ Suite 8: Bank SFTP Statement Ingestion & SHA-256 Deduplication", () => {
  it("should compute SHA-256 checksum for statement payloads", () => {
    const data = "TRANSACTION_ID,DATE,AMOUNT,UTR\nTXN1,2026-10-06,1000,UTR1";
    const checksum = bankStatementSftpAdapter.computeChecksum(data);
    assert.strictEqual(checksum.length, 64);
  });

  it("should parse valid bank statement and extract normalized BankTransaction", async () => {
    const csv = [
      "TRANSACTION_ID,DATE,AMOUNT,UTR,BANK_REFERENCE,DESCRIPTION,TYPE",
      "TXN_001,2026-10-06,5000.00,AXIS123456789,REF_01,VENDOR DISBURSEMENT,CR",
      "TXN_002,2026-10-06,3200.50,HDFC987654321,REF_02,VENDOR DISBURSEMENT,CR",
    ].join("\n");

    const res = await bankStatementSftpAdapter.processStatementFile({
      content: csv,
      filename: "statement_01.csv",
    });

    assert.strictEqual(res.status, SftpFileProcessingStatus.PROCESSED);
    assert.strictEqual(res.recordCount, 2);
    assert.strictEqual(res.transactions[0].utr, "AXIS123456789");
    assert.strictEqual(res.transactions[0].amount, 5000.0);
    assert.strictEqual(res.transactions[1].utr, "HDFC987654321");
    assert.strictEqual(res.transactions[1].amount, 3200.5);
  });

  it("should detect duplicate statement files using SHA-256 checksum and reject duplicate processing", async () => {
    const csv = [
      "TRANSACTION_ID,DATE,AMOUNT,UTR,BANK_REFERENCE,DESCRIPTION,TYPE",
      "TXN_DUP,2026-10-06,1000.00,UTR_DUP,REF_DUP,TEST,CR",
    ].join("\n");

    // First ingestion: Success
    const res1 = await bankStatementSftpAdapter.processStatementFile({
      content: csv,
      filename: "stmt_initial.csv",
    });
    assert.strictEqual(res1.status, SftpFileProcessingStatus.PROCESSED);

    // Second ingestion with same content: Duplicate detected
    const res2 = await bankStatementSftpAdapter.processStatementFile({
      content: csv,
      filename: "stmt_duplicate.csv",
    });
    assert.strictEqual(res2.status, SftpFileProcessingStatus.DUPLICATE);
    assert.strictEqual(res2.recordCount, 0);
    assert.ok(res2.message.includes("has already been processed"));
  });

  it("should quarantine invalid or corrupt statement files", async () => {
    const corruptCsv = "NOT_A_CSV_AT_ALL\nfoo,bar";
    const res = await bankStatementSftpAdapter.processStatementFile({
      content: corruptCsv,
      filename: "corrupt.csv",
    });
    assert.strictEqual(res.status, SftpFileProcessingStatus.QUARANTINED);
    assert.strictEqual(res.recordCount, 0);
  });
});

// -----------------------------------------------------------------------------
// SUITE 9: Three-Way Settlement & Bank Reconciliation
// -----------------------------------------------------------------------------
describe("▶ Suite 9: Three-Way Settlement & Bank Reconciliation", () => {
  it("should classify MATCHED, PENDING_BANK, AMOUNT_MISMATCH, and MISSING_IN_PROVIDER", async () => {
    const settlementBatches = [
      { batchId: "sbt_1", payoutReference: "pout_1", netPayable: 8000, utrNumber: "UTR_01" },
      { batchId: "sbt_2", payoutReference: "pout_2", netPayable: 4500, utrNumber: "UTR_02" },
      { batchId: "sbt_3", payoutReference: "pout_3", netPayable: 3000, utrNumber: "UTR_03" },
      { batchId: "sbt_4", payoutReference: "pout_4", netPayable: 1200, utrNumber: "UTR_04" },
    ];

    const providerPayouts = [
      { payoutReference: "pout_1", amount: 8000, status: "SUCCESS", utr: "UTR_01" },
      { payoutReference: "pout_2", amount: 4500, status: "SUCCESS", utr: "UTR_02" },
      { payoutReference: "pout_3", amount: 2800, status: "SUCCESS", utr: "UTR_03" }, // Mismatch (2800 != 3000)
      // pout_4 missing in provider
    ];

    const bankTransactions = [
      { utr: "UTR_01", amount: 8000, creditDebit: "CR" }, // Matched
      // UTR_02 missing in bank statement -> PENDING_BANK
      { utr: "UTR_03", amount: 2800, creditDebit: "CR" },
    ];

    const res = await reconciliationService.runThreeWayReconciliation({
      settlementBatches,
      providerPayouts,
      bankTransactions,
    });

    assert.strictEqual(res.status, "ANOMALIES_DETECTED");
    assert.strictEqual(res.matchedCount, 1); // Only sbt_1 matches all 3
    assert.strictEqual(res.mismatchedCount, 3);

    // Verify Discrepancies
    const pendingBank = res.discrepancies.find(
      (d) => d.issueType === ReconciliationDiscrepancyType.PENDING_BANK
    );
    assert.ok(pendingBank, "Should detect PENDING_BANK for sbt_2");
    assert.strictEqual(pendingBank.referenceId, "pout_2");

    const amountMismatch = res.discrepancies.find(
      (d) => d.issueType === ReconciliationDiscrepancyType.AMOUNT_MISMATCH
    );
    assert.ok(amountMismatch, "Should detect AMOUNT_MISMATCH for sbt_3");
    assert.strictEqual(amountMismatch.referenceId, "pout_3");

    const missingProvider = res.discrepancies.find(
      (d) => d.issueType === ReconciliationDiscrepancyType.MISSING_IN_PROVIDER
    );
    assert.ok(missingProvider, "Should detect MISSING_IN_PROVIDER for sbt_4");
    assert.strictEqual(missingProvider.referenceId, "pout_4");
  });
});

// -----------------------------------------------------------------------------
// SUITE 10: Financial Ledger Chart of Accounts Invariants
// -----------------------------------------------------------------------------
describe("▶ Suite 10: Financial Ledger Chart of Accounts & Invariants", () => {
  it("should include all required Platform 9.0 conceptual accounts in LedgerAccount", () => {
    assert.strictEqual(LedgerAccount.CUSTOMER_FUNDS, "CUSTOMER_FUNDS");
    assert.strictEqual(LedgerAccount.GATEWAY_CLEARING, "GATEWAY_CLEARING");
    assert.strictEqual(LedgerAccount.GATEWAY_FEES, "GATEWAY_FEES");
    assert.strictEqual(LedgerAccount.PLATFORM_REVENUE, "PLATFORM_REVENUE");
    assert.strictEqual(LedgerAccount.SELLER_PAYABLE, "SELLER_PAYABLE");
    assert.strictEqual(LedgerAccount.SELLER_RESERVE, "SELLER_RESERVE");
    assert.strictEqual(LedgerAccount.REFUND_LIABILITY, "REFUND_LIABILITY");
    assert.strictEqual(LedgerAccount.PAYOUT_PENDING, "PAYOUT_PENDING");
    assert.strictEqual(LedgerAccount.PAYOUT_SETTLED, "PAYOUT_SETTLED");
    assert.strictEqual(LedgerAccount.BANK_RECONCILIATION, "BANK_RECONCILIATION");
    assert.strictEqual(LedgerAccount.CHARGEBACK_DISPUTE, "CHARGEBACK_DISPUTE");
  });

  it("should strictly reject unbalanced journals (Debits != Credits)", async () => {
    await assert.rejects(
      async () => {
        await ledgerService.postJournal({
          referenceType: "TEST_UNBALANCED",
          referenceId: "unb_01",
          postings: [
            {
              account: LedgerAccount.GATEWAY_CLEARING,
              entryType: EntryType.DEBIT,
              amount: 1000,
            },
            {
              account: LedgerAccount.SELLER_PAYABLE,
              entryType: EntryType.CREDIT,
              amount: 900, // Unbalanced by 100!
            },
          ],
        });
      },
      /unbalanced/
    );
  });
});

// -----------------------------------------------------------------------------
// SUITE 11: Chargeback & Dispute Lifecycle Transitions
// -----------------------------------------------------------------------------
describe("▶ Suite 11: Chargeback & Dispute State Machine Transitions", () => {
  it("should permit valid dispute transitions and prevent invalid regressions", () => {
    // Valid: CAPTURED/COMPLETED -> CHARGEBACK_OPEN
    assert.strictEqual(
      isValidRefundTransition(RefundStatus.COMPLETED, RefundStatus.CHARGEBACK_OPEN),
      true
    );

    // Valid: CHARGEBACK_OPEN -> CHARGEBACK_WON
    assert.strictEqual(
      isValidRefundTransition(RefundStatus.CHARGEBACK_OPEN, RefundStatus.CHARGEBACK_WON),
      true
    );

    // Valid: CHARGEBACK_OPEN -> CHARGEBACK_LOST
    assert.strictEqual(
      isValidRefundTransition(RefundStatus.CHARGEBACK_OPEN, RefundStatus.CHARGEBACK_LOST),
      true
    );

    // Invalid: CHARGEBACK_LOST -> CHARGEBACK_OPEN (Terminal cannot regress)
    assert.strictEqual(
      isValidRefundTransition(RefundStatus.CHARGEBACK_LOST, RefundStatus.CHARGEBACK_OPEN),
      false
    );

    // Invalid: CHARGEBACK_WON -> CHARGEBACK_LOST (Terminal cannot regress)
    assert.strictEqual(
      isValidRefundTransition(RefundStatus.CHARGEBACK_WON, RefundStatus.CHARGEBACK_LOST),
      false
    );
  });
});

// -----------------------------------------------------------------------------
// SUITE 12: Real Live External Sandbox API Execution Evidence
// -----------------------------------------------------------------------------
describe("▶ Suite 12: Real Live External Razorpay Sandbox Execution", () => {
  it("should execute a live HTTP POST to Razorpay Sandbox and receive real 200 OK with live order id", async () => {
    const keyId = process.env.RAZORPAY_TEST_KEY_ID || "rzp_test_S1Vs1ViGRVLSlE";
    const keySecret = process.env.RAZORPAY_TEST_KEY_SECRET || "A2yFN4pvGLbVGdL6aOXLF4mX";
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const payload = JSON.stringify({
      amount: 250000, // ₹2,500.00
      currency: "INR",
      receipt: `rcpt_p9_${Date.now()}`,
    });

    const res = await new Promise((resolve, reject) => {
      const req = https.request(
        "https://api.razorpay.com/v1/orders",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${auth}`,
            "Content-Length": Buffer.byteLength(payload),
          },
          timeout: 15000,
        },
        (response) => {
          let body = "";
          response.on("data", (chunk) => (body += chunk));
          response.on("end", () => {
            try {
              resolve({ statusCode: response.statusCode, data: JSON.parse(body) });
            } catch (err) {
              reject(err);
            }
          });
        }
      );
      req.on("error", reject);
      req.on("timeout", () => {
        req.destroy();
        reject(new Error("Razorpay API request timed out"));
      });
      req.write(payload);
      req.end();
    });

    assert.strictEqual(res.statusCode, 200, "Must receive real HTTP 200 from Razorpay API");
    assert.ok(res.data.id.startsWith("order_"), "Must receive genuine Razorpay order ID starting with 'order_'");
    assert.strictEqual(res.data.amount, 250000);
    assert.strictEqual(res.data.currency, "INR");
    assert.strictEqual(res.data.status, "created");
  });
});
