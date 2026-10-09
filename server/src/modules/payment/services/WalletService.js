import { Wallet } from "../models/wallet.model.js";
import { WalletReservation } from "../models/walletReservation.model.js";
import { distributedLock } from "../utils/distributedLock.js";
import ledgerService from "./LedgerService.js";
import LedgerAccount, { EntryType } from "../domain/LedgerAccount.js";
import Money from "../utils/Money.js";

/**
 * Ledger-Backed Customer Wallet Service
 * Enforces financial truth through double-entry accounting.
 * Protects concurrent balance mutations using distributed locking & atomic checks.
 */
class WalletService {
  async getOrCreateWallet(userId) {
    let wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      const walletId = `wal_${userId.toString().slice(-6)}_${Date.now().toString(36)}`;
      wallet = await Wallet.create({
        walletId,
        user: userId,
        availableBalance: 0,
        reservedBalance: 0,
        promotionalBalance: 0,
        refundBalance: 0,
        status: "ACTIVE",
      });
    }
    return wallet;
  }

  /**
   * Top-up wallet balance (backed by external gateway payment).
   */
  async topupWallet(userId, amount, sourceReference, idempotencyKey = null) {
    const minorUnits = Money.toMinorUnits(amount, "topupAmount");
    const validAmount = Money.fromMinorUnits(minorUnits);

    const { acquired, lockToken } = await distributedLock.acquire(`wallet:${userId}`, 10);
    if (!acquired) {
      throw new Error("Wallet is currently busy processing another transaction. Please retry.");
    }

    try {
      const wallet = await this.getOrCreateWallet(userId);
      if (wallet.status !== "ACTIVE") {
        throw new Error(`Wallet is ${wallet.status}. Operations forbidden.`);
      }

      // 1. Post double-entry journal:
      // DEBIT: GATEWAY_CLEARING (Asset)
      // CREDIT: CUSTOMER_WALLET (Liability)
      await ledgerService.postJournal({
        referenceType: "WALLET_TOPUP",
        referenceId: sourceReference || wallet.walletId,
        idempotencyKey,
        description: `Customer top-up of ₹${validAmount} via ${sourceReference || "gateway"}`,
        postings: [
          {
            account: LedgerAccount.GATEWAY_CLEARING,
            entryType: EntryType.DEBIT,
            amount: validAmount,
            partyType: "GATEWAY",
            partyId: sourceReference,
          },
          {
            account: LedgerAccount.CUSTOMER_WALLET,
            entryType: EntryType.CREDIT,
            amount: validAmount,
            partyType: "CUSTOMER",
            partyId: userId.toString(),
          },
        ],
      });

      // 2. Atomically increment available balance
      const updatedWallet = await Wallet.findByIdAndUpdate(
        wallet._id,
        {
          $inc: { availableBalance: validAmount, version: 1 },
        },
        { new: true }
      );

      return updatedWallet;
    } finally {
      await distributedLock.release(`wallet:${userId}`, lockToken);
    }
  }

  /**
   * Reserve wallet funds during in-flight split checkout.
   * Atomically transfers from availableBalance -> reservedBalance.
   * Tracks individual reservation state machine (RESERVED).
   */
  async reserveFunds(userId, amount, intentId) {
    if (!amount || amount <= 0) return true;
    const minorUnits = Money.toMinorUnits(amount, "reservationAmount");
    const validAmount = Money.fromMinorUnits(minorUnits);

    const { acquired, lockToken } = await distributedLock.acquire(`wallet:${userId}`, 10);
    if (!acquired) {
      throw new Error("Unable to acquire wallet lock for reservation. Please retry.");
    }

    try {
      const wallet = await this.getOrCreateWallet(userId);
      if (wallet.status !== "ACTIVE") {
        throw new Error(`Wallet is ${wallet.status}. Cannot reserve funds.`);
      }

      // 1. Check existing reservation to prevent double-reservation
      if (intentId) {
        const existingRes = await WalletReservation.findOne({ wallet: wallet._id, intentId });
        if (existingRes) {
          if (existingRes.status === "RESERVED") {
            return wallet; // Idempotent: already reserved
          }
          if (existingRes.status === "COMMITTED") {
            throw new Error(`Reservation for intent ${intentId} is already committed.`);
          }
        }
      }

      if (wallet.availableBalance < validAmount) {
        throw new Error(
          `Insufficient wallet balance. Available: ₹${wallet.availableBalance}, Requested: ₹${validAmount}`
        );
      }

      // Atomic deduction from available and addition to reserved
      const updated = await Wallet.findOneAndUpdate(
        {
          _id: wallet._id,
          availableBalance: { $gte: validAmount },
        },
        {
          $inc: {
            availableBalance: -validAmount,
            reservedBalance: validAmount,
            version: 1,
          },
        },
        { new: true }
      );

      if (!updated) {
        throw new Error("Concurrent wallet update conflict. Insufficient available balance.");
      }

      // Record reservation document
      if (intentId) {
        const reservationId = `wres_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        await WalletReservation.findOneAndUpdate(
          { wallet: wallet._id, intentId },
          {
            reservationId,
            wallet: wallet._id,
            user: userId,
            intentId,
            amount: validAmount,
            status: "RESERVED",
            statusHistory: [
              {
                fromStatus: null,
                toStatus: "RESERVED",
                timestamp: new Date(),
                reason: "Funds reserved for checkout intent",
                source: "WALLET_SERVICE",
              },
            ],
          },
          { upsert: true, new: true }
        );
      }

      return updated;
    } finally {
      await distributedLock.release(`wallet:${userId}`, lockToken);
    }
  }

  /**
   * Release reserved funds if downstream checkout / payment fails or expires.
   * Atomically transfers from reservedBalance -> availableBalance.
   * Prevents double-release or release after commit.
   */
  async releaseReservation(userId, amount, intentId) {
    if (!amount || amount <= 0) return true;
    const minorUnits = Money.toMinorUnits(amount, "releaseAmount");
    const validAmount = Money.fromMinorUnits(minorUnits);

    const { acquired, lockToken } = await distributedLock.acquire(`wallet:${userId}`, 10);
    if (!acquired) {
      throw new Error("Unable to acquire wallet lock for release.");
    }

    try {
      const wallet = await this.getOrCreateWallet(userId);

      // Check reservation lifecycle state
      if (intentId) {
        const reservation = await WalletReservation.findOne({ wallet: wallet._id, intentId });
        if (reservation) {
          if (reservation.status === "RELEASED") {
            return wallet; // Idempotent: already released, do NOT release again!
          }
          if (reservation.status === "COMMITTED") {
            throw new Error(`Cannot release reservation ${intentId}: already COMMITTED.`);
          }
          reservation.status = "RELEASED";
          reservation.releasedAt = new Date();
          reservation.statusHistory.push({
            fromStatus: "RESERVED",
            toStatus: "RELEASED",
            timestamp: new Date(),
            reason: "Checkout failed/expired, funds released back to available balance",
            source: "WALLET_SERVICE",
          });
          await reservation.save();
        }
      }

      const updated = await Wallet.findOneAndUpdate(
        {
          _id: wallet._id,
          reservedBalance: { $gte: validAmount },
        },
        {
          $inc: {
            reservedBalance: -validAmount,
            availableBalance: validAmount,
            version: 1,
          },
        },
        { new: true }
      );

      return updated || wallet;
    } finally {
      await distributedLock.release(`wallet:${userId}`, lockToken);
    }
  }

  /**
   * Finalize wallet debit upon authoritative payment success.
   * Decrements reservedBalance and posts double-entry journal.
   * Prevents double-commit or commit after release.
   */
  async commitDebit(userId, amount, intentId, idempotencyKey = null) {
    if (!amount || amount <= 0) return true;
    const minorUnits = Money.toMinorUnits(amount, "commitAmount");
    const validAmount = Money.fromMinorUnits(minorUnits);

    const { acquired, lockToken } = await distributedLock.acquire(`wallet:${userId}`, 10);
    if (!acquired) {
      throw new Error("Unable to acquire wallet lock for commit debit.");
    }

    try {
      const wallet = await this.getOrCreateWallet(userId);

      // Check reservation lifecycle state
      if (intentId) {
        const reservation = await WalletReservation.findOne({ wallet: wallet._id, intentId });
        if (reservation) {
          if (reservation.status === "COMMITTED") {
            return wallet; // Idempotent: already committed, do NOT debit again!
          }
          if (reservation.status === "RELEASED") {
            throw new Error(`Cannot commit reservation ${intentId}: already RELEASED.`);
          }
          reservation.status = "COMMITTED";
          reservation.committedAt = new Date();
          reservation.statusHistory.push({
            fromStatus: "RESERVED",
            toStatus: "COMMITTED",
            timestamp: new Date(),
            reason: "Payment captured successfully, funds debited",
            source: "WALLET_SERVICE",
          });
          await reservation.save();
        }
      }

      // 1. Post double-entry journal:
      // DEBIT: CUSTOMER_WALLET (Liability drops)
      // CREDIT: GATEWAY_CLEARING / SELLER_PAYABLE
      await ledgerService.postJournal({
        referenceType: "WALLET_PURCHASE",
        referenceId: intentId,
        idempotencyKey: idempotencyKey || `wal_commit_${intentId}`,
        description: `Wallet payment of ₹${validAmount} for Intent ${intentId}`,
        postings: [
          {
            account: LedgerAccount.CUSTOMER_WALLET,
            entryType: EntryType.DEBIT,
            amount: validAmount,
            partyType: "CUSTOMER",
            partyId: userId.toString(),
          },
          {
            account: LedgerAccount.GATEWAY_CLEARING,
            entryType: EntryType.CREDIT,
            amount: validAmount,
            partyType: "PLATFORM",
            partyId: "ZOSH_CLEARING",
          },
        ],
      });

      // 2. Decrement reserved balance
      const updated = await Wallet.findOneAndUpdate(
        {
          _id: wallet._id,
          reservedBalance: { $gte: validAmount },
        },
        {
          $inc: {
            reservedBalance: -validAmount,
            version: 1,
          },
        },
        { new: true }
      );

      return updated || wallet;
    } finally {
      await distributedLock.release(`wallet:${userId}`, lockToken);
    }
  }

  /**
   * Credit customer wallet upon approved return/refund.
   */
  async creditRefund(userId, amount, refundId, idempotencyKey = null) {
    if (!amount || amount <= 0) return null;
    const minorUnits = Money.toMinorUnits(amount, "refundCreditAmount");
    const validAmount = Money.fromMinorUnits(minorUnits);

    const { acquired, lockToken } = await distributedLock.acquire(`wallet:${userId}`, 10);
    if (!acquired) {
      throw new Error("Unable to acquire wallet lock for refund credit.");
    }

    try {
      const wallet = await this.getOrCreateWallet(userId);

      // Post double-entry journal:
      // DEBIT: REFUND_SUSPENSE
      // CREDIT: CUSTOMER_WALLET
      await ledgerService.postJournal({
        referenceType: "REFUND",
        referenceId: refundId,
        idempotencyKey: idempotencyKey || `wal_rfnd_${refundId}`,
        description: `Refund credit of ₹${validAmount} to customer wallet`,
        postings: [
          {
            account: LedgerAccount.REFUND_SUSPENSE,
            entryType: EntryType.DEBIT,
            amount: validAmount,
            partyType: "PLATFORM",
            partyId: "REFUND_SUSPENSE",
          },
          {
            account: LedgerAccount.CUSTOMER_WALLET,
            entryType: EntryType.CREDIT,
            amount: validAmount,
            partyType: "CUSTOMER",
            partyId: userId.toString(),
          },
        ],
      });

      const updated = await Wallet.findByIdAndUpdate(
        wallet._id,
        {
          $inc: {
            availableBalance: validAmount,
            refundBalance: validAmount,
            version: 1,
          },
        },
        { new: true }
      );

      return updated;
    } finally {
      await distributedLock.release(`wallet:${userId}`, lockToken);
    }
  }
}

export const walletService = new WalletService();
export default walletService;
