import mongoose from "mongoose";
import { LedgerJournal } from "../models/ledgerJournal.model.js";
import { LedgerPosting } from "../models/ledgerPosting.model.js";
import LedgerAccount, { EntryType } from "../domain/LedgerAccount.js";
import Money from "../utils/Money.js";

/**
 * Immutable Double-Entry Ledger Service
 * Invariant: Every financial journal must strictly satisfy:
 *   SUM(debits) === SUM(credits)
 * No ledger entries can ever be updated or deleted once posted.
 */
class LedgerService {
  /**
   * Post a balanced double-entry financial journal.
   * @param {Object} params
   * @param {string} params.referenceType - e.g. "PAYMENT_INTENT", "WALLET_TOPUP", "REFUND"
   * @param {string} params.referenceId - Foreign ID
   * @param {string} [params.idempotencyKey]
   * @param {string} [params.description]
   * @param {Array<{ account: string, entryType: "DEBIT"|"CREDIT", amount: number, partyType?: string, partyId?: string }>} params.postings
   * @param {Object} [params.metadata]
   * @param {mongoose.ClientSession} [session]
   */
  async postJournal(
    {
      referenceType,
      referenceId,
      idempotencyKey,
      description = "",
      currency = "INR",
      postings = [],
      metadata = {},
    },
    session = null
  ) {
    if (!postings || postings.length < 2) {
      throw new Error("Double-entry journal requires at least two postings (one debit and one credit)");
    }

    // Check idempotency
    if (idempotencyKey) {
      const existing = await LedgerJournal.findOne({ idempotencyKey }, null, session ? { session } : {});
      if (existing) {
        return {
          journal: existing,
          alreadyPosted: true,
        };
      }
    }

    // Invariant validation: calculate sum of debits and sum of credits in integer paise (minor units)
    let totalDebitPaise = 0;
    let totalCreditPaise = 0;

    for (const p of postings) {
      if (!Object.values(LedgerAccount).includes(p.account)) {
        throw new Error(`Invalid ledger account: "${p.account}"`);
      }

      // Money.toMinorUnits rejects sub-paisa amounts (>2 decimals), scientific notation, negative/zero, and overflow
      const amtPaise = Money.toMinorUnits(p.amount, `posting.${p.account}`);

      if (p.entryType === EntryType.DEBIT) {
        totalDebitPaise += amtPaise;
      } else if (p.entryType === EntryType.CREDIT) {
        totalCreditPaise += amtPaise;
      } else {
        throw new Error(`Invalid entryType "${p.entryType}". Must be DEBIT or CREDIT.`);
      }
    }

    if (totalDebitPaise !== totalCreditPaise) {
      const totalDebit = Money.fromMinorUnits(totalDebitPaise);
      const totalCredit = Money.fromMinorUnits(totalCreditPaise);
      throw new Error(
        `Ledger journal is unbalanced! Total Debits (₹${totalDebit}) != Total Credits (₹${totalCredit}). Difference: ₹${Math.abs(
          totalDebit - totalCredit
        )}`
      );
    }

    const journalId = `jnl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const totalAmount = Money.fromMinorUnits(totalDebitPaise);

    // Create journal header
    const [journal] = await LedgerJournal.create(
      [
        {
          journalId,
          referenceType,
          referenceId,
          idempotencyKey: idempotencyKey || null,
          description,
          currency,
          totalAmount,
          isBalanced: true,
          postingsCount: postings.length,
          postedAt: new Date(),
          metadata,
        },
      ],
      session ? { session } : {}
    );

    // Create posting lines
    const postingDocuments = postings.map((p, idx) => ({
      postingId: `pst_${journalId}_${idx + 1}`,
      journalId,
      journal: journal._id,
      account: p.account,
      entryType: p.entryType,
      amount: Money.fromMinorUnits(Money.toMinorUnits(p.amount, `posting.${p.account}`)),
      currency,
      partyType: p.partyType || "NONE",
      partyId: p.partyId ? String(p.partyId) : null,
      postedAt: journal.postedAt,
    }));

    await LedgerPosting.create(postingDocuments, session ? { session } : {});

    return {
      journal,
      alreadyPosted: false,
    };
  }

  /**
   * Compute authoritative account balance directly from postings.
   * For Liabilities/Equity/Revenue: Credit is positive, Debit is negative.
   * For Assets/Expenses: Debit is positive, Credit is negative.
   */
  async getAccountBalance(account, partyType = null, partyId = null) {
    const filter = { account };
    if (partyType) filter.partyType = partyType;
    if (partyId) filter.partyId = String(partyId);

    const postings = await LedgerPosting.find(filter).lean();
    let balance = 0;

    const isLiabilityOrEquityOrRevenue = [
      LedgerAccount.CUSTOMER_WALLET,
      LedgerAccount.CUSTOMER_FUNDS,
      LedgerAccount.CUSTOMER_PROMOTIONAL_CREDIT,
      LedgerAccount.SELLER_PAYABLE,
      LedgerAccount.SELLER_RESERVE,
      LedgerAccount.PAYOUT_PENDING,
      LedgerAccount.REFUND_LIABILITY,
      LedgerAccount.PLATFORM_COMMISSION_REVENUE,
      LedgerAccount.PLATFORM_REVENUE,
      LedgerAccount.PAYMENT_SURCHARGE_REVENUE,
      LedgerAccount.TAX_COLLECTED_TCS,
      LedgerAccount.TAX_COLLECTED_TDS,
      LedgerAccount.REFUND_SUSPENSE,
    ].includes(account);

    let balancePaise = 0;
    for (const p of postings) {
      const pPaise = Money.toMinorUnits(p.amount, "posting.amount", { allowZero: true });
      if (isLiabilityOrEquityOrRevenue) {
        balancePaise += p.entryType === EntryType.CREDIT ? pPaise : -pPaise;
      } else {
        balancePaise += p.entryType === EntryType.DEBIT ? pPaise : -pPaise;
      }
    }

    return Money.fromMinorUnits(balancePaise);
  }

  /**
   * Get all journal entries for admin / audit view.
   */
  async getAllJournals(query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (query.referenceType && query.referenceType !== "ALL") {
      filter.referenceType = query.referenceType;
    }

    const [journals, total] = await Promise.all([
      LedgerJournal.find(filter).sort({ postedAt: -1 }).skip(skip).limit(limit).lean(),
      LedgerJournal.countDocuments(filter),
    ]);

    // Attach postings to journals
    const journalIds = journals.map((j) => j.journalId);
    const postings = await LedgerPosting.find({ journalId: { $in: journalIds } }).lean();

    const postingsByJournal = postings.reduce((acc, p) => {
      acc[p.journalId] = acc[p.journalId] || [];
      acc[p.journalId].push(p);
      return acc;
    }, {});

    const enrichedJournals = journals.map((j) => ({
      ...j,
      postings: postingsByJournal[j.journalId] || [],
    }));

    return {
      journals: enrichedJournals,
      total,
      totalPages: Math.ceil(total / limit),
      page,
    };
  }
}

export const ledgerService = new LedgerService();
export default ledgerService;
