import { ReconciliationRecord } from "../models/reconciliationRecord.model.js";
import { PaymentAttempt } from "../models/paymentAttempt.model.js";
import { LedgerPosting } from "../models/ledgerPosting.model.js";
import PaymentAttemptStatus from "../domain/PaymentAttemptStatus.js";
import { csvSettlementDataSourceAdapter } from "../adapters/reconciliation/CsvSettlementDataSourceAdapter.js";

/**
 * Standard Reconciliation Discrepancy Taxonomy
 */
export const ReconciliationDiscrepancyType = Object.freeze({
  MATCHED: "MATCHED",
  MISSING_IN_PROVIDER: "MISSING_IN_PROVIDER",
  MISSING_IN_ZOSH: "MISSING_IN_ZOSH",
  AMOUNT_MISMATCH: "AMOUNT_MISMATCH",
  FEE_MISMATCH: "FEE_MISMATCH",
  REFUND_MISMATCH: "REFUND_MISMATCH",
  DUPLICATE: "DUPLICATE",
  SETTLEMENT_MISMATCH: "SETTLEMENT_MISMATCH",
  PENDING_BANK: "PENDING_BANK",
  MISSING_BANK: "MISSING_BANK",
  REFERENCE_MISMATCH: "REFERENCE_MISMATCH",
  REVERSAL: "REVERSAL",
  UNKNOWN_REFERENCE: "UNKNOWN_REFERENCE",
  DATE_MISMATCH: "DATE_MISMATCH",
  UNKNOWN: "UNKNOWN",
});

/**
 * Automated Financial Reconciliation Engine
 * Distinguishes between:
 * 1. Internal Financial Integrity Check (Attempts vs Double-Entry Ledger)
 * 2. External Provider Reconciliation (Imported settlement feeds vs Internal state)
 * 3. Three-Way Reconciliation (Zosh Ledger vs Payout Provider vs Bank Statement)
 */
export class ReconciliationService {
  /**
   * Internal Financial Integrity Check:
   * Verifies that all internal CAPTURED attempts have corresponding balanced ledger postings.
   */
  async runInternalIntegrityCheck({
    startDate = new Date(Date.now() - 24 * 60 * 60 * 1000),
    endDate = new Date(),
    gateway = "RAZORPAY",
  }) {
    const reconciliationId = `rec_int_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // 1. Fetch all attempts in range
    const attempts = await PaymentAttempt.find({
      createdAt: { $gte: startDate, $lte: endDate },
    }).lean();

    const discrepancies = [];
    let matchedCount = 0;
    let mismatchedCount = 0;

    for (const att of attempts) {
      if (att.status === PaymentAttemptStatus.CAPTURED) {
        // Find corresponding ledger posting
        const postings = await LedgerPosting.find({
          partyId: att.providerReference,
        }).lean();

        if (postings.length === 0) {
          // Check if posted under attemptId
          const altPostings = await LedgerPosting.find({
            partyId: att.attemptId,
          }).lean();

          if (altPostings.length === 0) {
            discrepancies.push({
              referenceId: att.attemptId,
              issueType: ReconciliationDiscrepancyType.MISSING_IN_ZOSH,
              expectedAmount: att.amount,
              actualAmount: 0,
              severity: "HIGH",
              owner: "LEDGER_OPS",
              notes: `Attempt ${att.attemptId} (Ref: ${att.providerReference}) has CAPTURED status but no matching ledger postings.`,
            });
            mismatchedCount++;
            continue;
          }
        }

        matchedCount++;
      }
    }

    const status = discrepancies.length > 0 ? "ANOMALIES_DETECTED" : "COMPLETED";

    const record = await ReconciliationRecord.create({
      reconciliationId,
      gateway,
      periodStart: startDate,
      periodEnd: endDate,
      totalCompared: attempts.length,
      matchedCount,
      mismatchedCount,
      orphanCount: 0,
      discrepancies,
      status,
      completedAt: new Date(),
    });

    return record;
  }

  /**
   * Alias for backward compatibility.
   */
  async runReconciliation(params = {}) {
    return await this.runInternalIntegrityCheck(params);
  }

  /**
   * External Provider Settlement Reconciliation:
   * Parses external settlement feeds (via SettlementDataSourceAdapter) and reconciles against
   * internal attempts and ledger entries.
   */
  async runExternalReconciliation({
    rawSettlementData,
    adapter = csvSettlementDataSourceAdapter,
    gateway = "EXTERNAL_FEED",
  }) {
    const reconciliationId = `rec_ext_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const parsedRecords = await adapter.parseSettlementData(rawSettlementData);

    const discrepancies = [];
    let matchedCount = 0;
    let mismatchedCount = 0;
    const seenRefs = new Set();

    for (const record of parsedRecords) {
      const ref = record.providerReference || record.externalReference;

      // Duplicate check in external feed
      if (seenRefs.has(ref)) {
        discrepancies.push({
          referenceId: ref,
          issueType: ReconciliationDiscrepancyType.DUPLICATE,
          expectedAmount: record.amount,
          actualAmount: record.amount,
          severity: "MEDIUM",
          owner: "FINANCE_OPS",
          notes: `Duplicate transaction record in external settlement data for reference ${ref}`,
        });
        mismatchedCount++;
        continue;
      }
      seenRefs.add(ref);

      // Match against internal attempt
      const attempt = await PaymentAttempt.findOne({
        $or: [{ providerReference: ref }, { attemptId: ref }],
      });

      if (!attempt) {
        discrepancies.push({
          referenceId: ref,
          issueType: ReconciliationDiscrepancyType.MISSING_IN_ZOSH,
          expectedAmount: record.amount,
          actualAmount: 0,
          severity: "HIGH",
          owner: "FINANCE_OPS",
          notes: `External settlement item ${ref} (₹${record.amount}) does not exist in internal records.`,
        });
        mismatchedCount++;
        continue;
      }

      if (attempt.currency !== record.currency) {
        discrepancies.push({
          referenceId: ref,
          issueType: "CURRENCY_MISMATCH",
          expectedAmount: record.amount,
          actualAmount: attempt.amount,
          severity: "HIGH",
          owner: "FINANCE_OPS",
          notes: `Currency mismatch: external=${record.currency}, internal=${attempt.currency}`,
        });
        mismatchedCount++;
        continue;
      }

      if (Math.abs(attempt.amount - record.amount) > 0.01) {
        discrepancies.push({
          referenceId: ref,
          issueType: ReconciliationDiscrepancyType.AMOUNT_MISMATCH,
          expectedAmount: attempt.amount,
          actualAmount: record.amount,
          severity: "CRITICAL",
          owner: "FINANCE_OPS",
          notes: `Amount mismatch: internal expected ₹${attempt.amount}, external reported ₹${record.amount}`,
        });
        mismatchedCount++;
        continue;
      }

      matchedCount++;
    }

    const status = discrepancies.length > 0 ? "ANOMALIES_DETECTED" : "COMPLETED";

    const record = await ReconciliationRecord.create({
      reconciliationId,
      gateway,
      periodStart: new Date(),
      periodEnd: new Date(),
      totalCompared: parsedRecords.length,
      matchedCount,
      mismatchedCount,
      orphanCount: 0,
      discrepancies,
      status,
      completedAt: new Date(),
    });

    return record;
  }

  /**
   * Three-Way Settlement & Bank Reconciliation:
   * Reconciles:
   * 1. Zosh Settlement Batches (Internal Ledger Obligation)
   * 2. Payout Provider Reports (External Gateway / Nodal Instruction)
   * 3. Authoritative Bank Statement (Bank-Confirmed Credit / UTR)
   */
  async runThreeWayReconciliation({
    settlementBatches = [],
    providerPayouts = [],
    bankTransactions = [],
    gateway = "THREE_WAY_BANK",
  }) {
    const reconciliationId = `rec_3way_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const discrepancies = [];
    let matchedCount = 0;
    let mismatchedCount = 0;

    // Index provider payouts by reference
    const providerMap = new Map();
    for (const p of providerPayouts) {
      const ref = p.payoutReference || p.referenceId || p.externalReference;
      if (ref) providerMap.set(ref, p);
    }

    // Index bank transactions by UTR and bank reference
    const bankUtrMap = new Map();
    const bankRefMap = new Map();
    const matchedBankUtrs = new Set();

    for (const b of bankTransactions) {
      if (b.utr) bankUtrMap.set(b.utr, b);
      if (b.bankReference) bankRefMap.set(b.bankReference, b);
    }

    for (const batch of settlementBatches) {
      const batchRef = batch.payoutReference || batch.batchId || batch.settlementId;
      const expectedAmount = Number(batch.netPayable || batch.amount || 0);

      // 1. Check Payout Provider
      const providerRecord = providerMap.get(batchRef);
      if (!providerRecord) {
        discrepancies.push({
          referenceId: batchRef,
          issueType: ReconciliationDiscrepancyType.MISSING_IN_PROVIDER,
          expectedAmount,
          actualAmount: 0,
          severity: "HIGH",
          owner: "PAYOUT_OPS",
          notes: `Settlement batch ${batchRef} (₹${expectedAmount}) has no corresponding payout instruction in provider records.`,
        });
        mismatchedCount++;
        continue;
      }

      // Check Provider Amount Mismatch
      const providerAmount = Number(providerRecord.amount || 0);
      if (Math.abs(expectedAmount - providerAmount) > 0.01) {
        discrepancies.push({
          referenceId: batchRef,
          issueType: ReconciliationDiscrepancyType.AMOUNT_MISMATCH,
          expectedAmount,
          actualAmount: providerAmount,
          severity: "CRITICAL",
          owner: "PAYOUT_OPS",
          notes: `Provider payout amount mismatch: Zosh expected ₹${expectedAmount}, provider reported ₹${providerAmount}.`,
        });
        mismatchedCount++;
        continue;
      }

      // 2. Check Bank Statement
      const utr = providerRecord.utr || batch.utrNumber;
      let bankRecord = null;
      if (utr) bankRecord = bankUtrMap.get(utr);
      if (!bankRecord && providerRecord.bankReference) {
        bankRecord = bankRefMap.get(providerRecord.bankReference);
      }

      if (!bankRecord) {
        discrepancies.push({
          referenceId: batchRef,
          issueType: ReconciliationDiscrepancyType.PENDING_BANK,
          expectedAmount,
          actualAmount: 0,
          severity: "MEDIUM",
          owner: "BANK_OPS",
          notes: `Payout ${batchRef} (UTR: ${utr || "NONE"}) confirmed by provider but not yet reflected in bank statement.`,
        });
        mismatchedCount++;
        continue;
      }

      if (utr) matchedBankUtrs.add(utr);

      // Check Bank Amount Mismatch
      const bankAmount = Number(bankRecord.amount || 0);
      if (Math.abs(expectedAmount - bankAmount) > 0.01) {
        discrepancies.push({
          referenceId: batchRef,
          issueType: ReconciliationDiscrepancyType.AMOUNT_MISMATCH,
          expectedAmount,
          actualAmount: bankAmount,
          severity: "CRITICAL",
          owner: "BANK_OPS",
          notes: `Bank statement credit mismatch: expected ₹${expectedAmount}, bank statement shows ₹${bankAmount}.`,
        });
        mismatchedCount++;
        continue;
      }

      // Check Value Date Mismatch (> 14 days discrepancy)
      if (bankRecord.valueDate && batch.createdAt) {
        const diffDays = Math.abs(new Date(bankRecord.valueDate) - new Date(batch.createdAt)) / (1000 * 60 * 60 * 24);
        if (diffDays > 14) {
          discrepancies.push({
            referenceId: batchRef,
            issueType: ReconciliationDiscrepancyType.DATE_MISMATCH,
            expectedAmount,
            actualAmount: bankAmount,
            severity: "LOW",
            owner: "FINANCE_OPS",
            notes: `Value date difference of ${Math.round(diffDays)} days between batch creation and bank clearing.`,
          });
        }
      }

      // Check Reversal
      if (bankRecord.creditDebit === "DR" || bankRecord.isReversal) {
        discrepancies.push({
          referenceId: batchRef,
          issueType: ReconciliationDiscrepancyType.REVERSAL,
          expectedAmount,
          actualAmount: bankAmount,
          severity: "CRITICAL",
          owner: "BANK_OPS",
          notes: `Bank record for payout ${batchRef} represents a debit reversal.`,
        });
        mismatchedCount++;
        continue;
      }

      matchedCount++;
    }

    // Index all known UTRs from settlement batches and provider payouts
    const knownUtrs = new Set(matchedBankUtrs);
    for (const b of settlementBatches) {
      if (b.utrNumber) knownUtrs.add(b.utrNumber);
    }
    for (const p of providerPayouts) {
      if (p.utr) knownUtrs.add(p.utr);
    }

    // 3. Detect Unknown / Orphan References in Bank Statement
    for (const b of bankTransactions) {
      if (b.utr && !knownUtrs.has(b.utr)) {
        discrepancies.push({
          referenceId: b.utr,
          issueType: ReconciliationDiscrepancyType.UNKNOWN_REFERENCE,
          expectedAmount: 0,
          actualAmount: b.amount,
          severity: "CRITICAL",
          owner: "SECURITY_AUDIT",
          notes: `Bank statement transaction ${b.utr} (₹${b.amount}) has no matching settlement batch or payout instruction in Zosh.`,
        });
        mismatchedCount++;
      }
    }

    const status = discrepancies.length > 0 ? "ANOMALIES_DETECTED" : "COMPLETED";

    const record = await ReconciliationRecord.create({
      reconciliationId,
      gateway,
      periodStart: new Date(),
      periodEnd: new Date(),
      totalCompared: settlementBatches.length,
      matchedCount,
      mismatchedCount,
      orphanCount: 0,
      discrepancies,
      status,
      completedAt: new Date(),
    });

    return record;
  }


  /**
   * Authoritative Reconciliation Discrepancy Resolution
   * Enforces evidence, operator audit trail, reason justification, and maker-checker for high-severity anomalies.
   */
  async resolveDiscrepancy({
    reconciliationId,
    referenceId,
    resolutionStatus = "RESOLVED_MANUAL_ADJUSTMENT",
    reason,
    operatorId,
    evidence = {},
    checkerId = null,
  }) {
    if (!reconciliationId || !referenceId) {
      const err = new Error("reconciliationId and referenceId are mandatory for resolution");
      err.code = "MISSING_RESOLUTION_IDENTIFIERS";
      err.statusCode = 400;
      throw err;
    }

    if (!operatorId) {
      const err = new Error("Operator ID is required to resolve a financial discrepancy");
      err.code = "MISSING_OPERATOR_AUDIT";
      err.statusCode = 400;
      throw err;
    }

    if (!reason || reason.trim().length < 10) {
      const err = new Error(
        "A comprehensive reason (minimum 10 characters) is required for financial discrepancy resolution"
      );
      err.code = "INSUFFICIENT_RESOLUTION_REASON";
      err.statusCode = 422;
      throw err;
    }

    const record = await ReconciliationRecord.findOne({ reconciliationId });
    if (!record) {
      const err = new Error(`ReconciliationRecord "${reconciliationId}" not found`);
      err.code = "RECONCILIATION_NOT_FOUND";
      err.statusCode = 404;
      throw err;
    }

    const discrepancy = record.discrepancies.find(
      (d) => d.referenceId === referenceId && !d.resolved
    );

    if (!discrepancy) {
      const err = new Error(
        `Unresolved discrepancy with reference "${referenceId}" not found in reconciliation "${reconciliationId}"`
      );
      err.code = "DISCREPANCY_NOT_FOUND";
      err.statusCode = 404;
      throw err;
    }

    // Maker-Checker policy enforcement for CRITICAL anomalies:
    if (discrepancy.severity === "CRITICAL") {
      if (!checkerId) {
        const err = new Error(
          "CRITICAL financial discrepancy resolution requires dual authorization (checkerId)"
        );
        err.code = "MAKER_CHECKER_REQUIRED";
        err.statusCode = 403;
        throw err;
      }
      if (String(checkerId) === String(operatorId)) {
        const err = new Error(
          "Maker and checker cannot be the same operator for CRITICAL discrepancies"
        );
        err.code = "MAKER_CHECKER_CONFLICT";
        err.statusCode = 403;
        throw err;
      }
    }

    discrepancy.resolved = true;
    discrepancy.resolvedAt = new Date();
    discrepancy.resolutionStatus = resolutionStatus;
    discrepancy.auditTrail.push({
      action: `RESOLVED_${resolutionStatus}`,
      performedBy: String(operatorId),
      timestamp: new Date(),
      notes: `Reason: ${reason}. Checker: ${checkerId || "N/A"}. Evidence: ${JSON.stringify(evidence)}`,
    });

    // Check if all discrepancies are resolved
    const allResolved = record.discrepancies.every((d) => d.resolved);
    if (allResolved) {
      record.status = "RESOLVED";
    }

    await record.save();
    return {
      message: `Discrepancy "${referenceId}" resolved successfully`,
      reconciliationId,
      referenceId,
      discrepancy,
      recordStatus: record.status,
    };
  }

  async getAllReconciliations() {
    return await ReconciliationRecord.find().sort({ createdAt: -1 }).limit(50).lean();
  }
}

export const reconciliationService = new ReconciliationService();
export default reconciliationService;
