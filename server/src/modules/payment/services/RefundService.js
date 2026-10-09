import { Refund } from "../models/refund.model.js";
import { Order } from "../../../models/order.model.js";
import RefundStatus, { isValidRefundTransition } from "../domain/RefundStatus.js";
import walletService from "./WalletService.js";
import paymentRoutingService from "./PaymentRoutingService.js";
import { PaymentAttempt } from "../models/paymentAttempt.model.js";
import ledgerService from "./LedgerService.js";
import LedgerAccount, { EntryType } from "../domain/LedgerAccount.js";
import { emailEvents } from "../../email/index.js";
import { distributedLock } from "../utils/distributedLock.js";
import paymentOutboxService from "./PaymentOutboxService.js";
import Money from "../utils/Money.js";

/**
 * Idempotent Refund Processing Service
 * Supports wallet and original-method refunds, partial refunds, and double-entry reconciliation.
 */
class RefundService {
  /**
   * Request and execute a refund for an order.
   * Hardened: Strictly enforces cumulative refund ceiling <= captured order amount.
   */
  async createRefund({
    orderId,
    amount,
    reason = "Customer Return / Cancellation",
    destination = "WALLET",
    idempotencyKey = null,
    initiatedBy = "SYSTEM",
  }) {
    const { acquired, lockToken } = await distributedLock.acquire(`refund:order:${orderId}`, 15);
    if (!acquired) {
      throw new Error("A refund operation is currently processing for this order. Please retry in a moment.");
    }

    try {
      const order = await Order.findById(orderId).populate("user seller");
      if (!order) {
        throw new Error(`Order "${orderId}" not found for refund`);
      }

      // 1. Idempotency check before any state change
      if (idempotencyKey) {
        const existing = await Refund.findOne({ idempotencyKey });
        if (existing) {
          return { refund: existing, alreadyProcessed: true };
        }
      }

      // 2. Cumulative Refund Financial Invariant: sum(refunds) <= order.totalSellingPrice
      const existingRefunds = await Refund.find({
        order: order._id,
        status: { $in: [RefundStatus.REQUESTED, RefundStatus.PROCESSING, RefundStatus.COMPLETED] },
      });
      const orderTotalMinor = Money.toMinorUnits(order.totalSellingPrice, "order.totalSellingPrice");
      const totalPrevRefundedMinor = existingRefunds.reduce(
        (sum, r) => sum + Money.toMinorUnits(r.amount || 0, "existingRefund.amount", { allowZero: true }),
        0
      );
      const remainingRefundableMinor = Math.max(0, orderTotalMinor - totalPrevRefundedMinor);
      const requestedMinor = Money.toMinorUnits(amount, "refundAmount");

      if (requestedMinor <= 0 || requestedMinor > remainingRefundableMinor) {
        const remainingRefundable = Money.format(remainingRefundableMinor);
        const totalPrevRefunded = Money.format(totalPrevRefundedMinor);
        throw new Error(
          `Invalid refund amount ₹${amount}. Maximum remaining refundable balance is ₹${remainingRefundable} (Order total: ₹${order.totalSellingPrice}, Previously refunded: ₹${totalPrevRefunded}).`
        );
      }

      const roundAmount = Money.fromMinorUnits(requestedMinor);

      const refundId = `ref_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      const refund = await Refund.create({
        refundId,
        order: order._id,
        user: order.user?._id || order.user,
        amount: roundAmount,
        currency: "INR",
        reason,
        destination,
        status: RefundStatus.REQUESTED,
        idempotencyKey: idempotencyKey || null,
        statusHistory: [
          {
            fromStatus: null,
            toStatus: RefundStatus.REQUESTED,
            timestamp: new Date(),
            reason,
            source: initiatedBy,
          },
        ],
      });

      // Execute refund processing
      return await this.processRefund(refund, order);
    } finally {
      await distributedLock.release(`refund:order:${orderId}`, lockToken);
    }
  }

  /**
   * Process refund via wallet credit or gateway rail dispatch.
   */
  async processRefund(refund, order = null) {
    if (!order) {
      order = await Order.findById(refund.order).populate("user seller");
    }

    refund.status = RefundStatus.PROCESSING;
    refund.statusHistory.push({
      fromStatus: RefundStatus.REQUESTED,
      toStatus: RefundStatus.PROCESSING,
      timestamp: new Date(),
      reason: "Dispatching refund to target destination",
      source: "SYSTEM",
    });
    await refund.save();

    try {
      if (refund.destination === "WALLET") {
        // Instant wallet credit
        await walletService.creditRefund(
          refund.user,
          refund.amount,
          refund.refundId,
          refund.idempotencyKey
        );

        refund.status = RefundStatus.COMPLETED;
        refund.gatewayRefundId = `wal_rfnd_${refund.refundId}`;
      } else {
        // Original payment method: resolve adapter via paymentRoutingService
        let attemptDoc = null;
        if (order._id) {
          attemptDoc = await PaymentAttempt.findOne({
            $or: [{ intentId: order.orderId }, { "metadata.orderId": order._id.toString() }],
            status: { $in: ["CAPTURED", "SETTLED"] },
          });
        }

        let adapter = null;
        if (attemptDoc) {
          adapter = paymentRoutingService.getAdapterForAttempt(attemptDoc);
        } else {
          adapter = paymentRoutingService.resolveAdapter("RAZORPAY");
        }

        const adapterResult = await adapter.refund({ refund, attempt: attemptDoc || {}, order });

        refund.gatewayRefundId = adapterResult.gatewayRefundId;
        refund.status = RefundStatus.COMPLETED;

        // Post ledger entries for gateway refund:
        // DEBIT: REFUND_SUSPENSE
        // CREDIT: GATEWAY_CLEARING
        await ledgerService.postJournal({
          referenceType: "REFUND",
          referenceId: refund.refundId,
          idempotencyKey: `led_rfnd_${refund.refundId}`,
          description: `Gateway rail refund of ₹${refund.amount} for Order ${order._id}`,
          postings: [
            {
              account: LedgerAccount.REFUND_SUSPENSE,
              entryType: EntryType.DEBIT,
              amount: refund.amount,
              partyType: "PLATFORM",
              partyId: "REFUND_SUSPENSE",
            },
            {
              account: LedgerAccount.GATEWAY_CLEARING,
              entryType: EntryType.CREDIT,
              amount: refund.amount,
              partyType: "GATEWAY",
              partyId: refund.gatewayRefundId,
            },
          ],
        });
      }

      refund.statusHistory.push({
        fromStatus: RefundStatus.PROCESSING,
        toStatus: RefundStatus.COMPLETED,
        timestamp: new Date(),
        reason: "Refund settled successfully",
        source: "SYSTEM",
      });
      await refund.save();

      // Emit transactional email event
      try {
        emailEvents.emitDomainEvent("customer.refund.completed", {
          order,
          orderId: order.orderId || order._id.toString(),
          recipient: order.user?.email,
          customerName: order.user?.fullName,
          refundAmount: refund.amount,
          destination: refund.destination,
        });
      } catch (eErr) {
        console.warn("[RefundService] Email event warning:", eErr.message);
      }

      // Enqueue durable PaymentRefunded outbox event
      await paymentOutboxService
        .enqueueEvent({
          eventType: "PaymentRefunded",
          aggregateType: "Refund",
          aggregateId: refund.refundId,
          payload: {
            refund,
            orderId: order._id,
            user: order.user,
            amount: refund.amount,
          },
          idempotencyKey: `outbox_rfnd_${refund.refundId}`,
        })
        .catch(() => {});

      return { refund, alreadyProcessed: false };
    } catch (err) {
      refund.status = RefundStatus.FAILED;
      refund.failureReason = err.message;
      refund.statusHistory.push({
        fromStatus: RefundStatus.PROCESSING,
        toStatus: RefundStatus.FAILED,
        timestamp: new Date(),
        reason: err.message,
        source: "SYSTEM",
      });
      await refund.save();
      throw err;
    }
  }

  async getAllRefunds(query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (query.status && query.status !== "ALL") {
      filter.status = query.status;
    }

    const [refunds, total] = await Promise.all([
      Refund.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("order user")
        .lean(),
      Refund.countDocuments(filter),
    ]);

    return {
      refunds,
      total,
      totalPages: Math.ceil(total / limit),
      page,
    };
  }

  // --------------------------------------------------------------------------
  // PLATFORM 9.0 CHARGEBACK & DISPUTE LIFECYCLE
  // --------------------------------------------------------------------------

  async openChargeback({
    orderId,
    disputeReference,
    amount,
    reason = "Cardholder disputed transaction with issuing bank",
    openedBy = "GATEWAY_NOTIFICATION",
  }) {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error(`Order "${orderId}" not found for chargeback`);
    }

    const refundId = `cb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const chargebackMinor = Money.toMinorUnits(amount || order.totalSellingPrice, "chargebackAmount");
    const chargebackAmount = Money.fromMinorUnits(chargebackMinor);

    const disputeRecord = await Refund.create({
      refundId,
      order: order._id,
      user: order.user,
      amount: chargebackAmount,
      currency: "INR",
      reason: `Chargeback: ${reason} (Ref: ${disputeReference})`,
      destination: "ORIGINAL_PAYMENT_METHOD",
      status: RefundStatus.CHARGEBACK_OPEN,
      idempotencyKey: `cb_${disputeReference}`,
      statusHistory: [
        {
          fromStatus: null,
          toStatus: RefundStatus.CHARGEBACK_OPEN,
          timestamp: new Date(),
          reason,
          source: openedBy,
        },
      ],
    });

    return disputeRecord;
  }

  async submitChargebackEvidence({
    disputeReference,
    evidenceDocs = [],
    notes = "",
    submittedBy = "MERCHANT",
  }) {
    const disputeRecord = await Refund.findOne({ idempotencyKey: `cb_${disputeReference}` });
    if (!disputeRecord) {
      throw new Error(`Chargeback with reference "${disputeReference}" not found`);
    }

    const fromStatus = disputeRecord.status;
    disputeRecord.status = RefundStatus.SUBMITTED;
    disputeRecord.statusHistory.push({
      fromStatus,
      toStatus: RefundStatus.SUBMITTED,
      timestamp: new Date(),
      reason: notes || `Evidence submitted (${evidenceDocs.length} documents)`,
      source: submittedBy,
    });
    await disputeRecord.save();
    return disputeRecord;
  }

  async expireChargeback({
    disputeReference,
    reason = "Dispute arbitration window elapsed without representation",
    resolvedBy = "SYSTEM",
  }) {
    const disputeRecord = await Refund.findOne({ idempotencyKey: `cb_${disputeReference}` });
    if (!disputeRecord) {
      throw new Error(`Chargeback with reference "${disputeReference}" not found`);
    }

    const fromStatus = disputeRecord.status;
    disputeRecord.status = RefundStatus.EXPIRED;
    disputeRecord.statusHistory.push({
      fromStatus,
      toStatus: RefundStatus.EXPIRED,
      timestamp: new Date(),
      reason,
      source: resolvedBy,
    });
    await disputeRecord.save();
    return disputeRecord;
  }

  async resolveChargeback({
    disputeReference,
    outcome = "WON", // "WON" | "LOST"
    notes = "",
    resolvedBy = "SYSTEM",
    sellerId = null,
  }) {
    const disputeRecord = await Refund.findOne({ idempotencyKey: `cb_${disputeReference}` });
    if (!disputeRecord) {
      throw new Error(`Chargeback with reference "${disputeReference}" not found`);
    }

    const resolvable = [
      RefundStatus.CHARGEBACK_OPEN,
      RefundStatus.EVIDENCE_REQUIRED,
      RefundStatus.SUBMITTED,
    ];
    if (!resolvable.includes(disputeRecord.status)) {
      throw new Error(`Chargeback is already resolved with status ${disputeRecord.status}`);
    }

    const isWon = outcome.toUpperCase() === "WON";
    const nextStatus = isWon ? RefundStatus.CHARGEBACK_WON : RefundStatus.CHARGEBACK_LOST;
    const fromStatus = disputeRecord.status;

    disputeRecord.status = nextStatus;
    disputeRecord.statusHistory.push({
      fromStatus,
      toStatus: nextStatus,
      timestamp: new Date(),
      reason: notes || `Dispute ${isWon ? "won by merchant" : "lost to cardholder"}`,
      source: resolvedBy,
    });
    await disputeRecord.save();

    if (!isWon) {
      let effectiveSeller = sellerId;
      if (!effectiveSeller && disputeRecord.order) {
        const order = await Order.findById(disputeRecord.order).lean();
        effectiveSeller = order?.seller;
      }

      const postings = [
        {
          account: LedgerAccount.CHARGEBACK_DISPUTE,
          entryType: EntryType.DEBIT,
          amount: disputeRecord.amount,
          partyType: "SYSTEM",
          partyId: "DISPUTE_RESERVE",
        },
        {
          account: LedgerAccount.GATEWAY_CLEARING,
          entryType: EntryType.CREDIT,
          amount: disputeRecord.amount,
          partyType: "GATEWAY",
          partyId: "ACQUIRER",
        },
      ];

      if (effectiveSeller) {
        postings.push(
          {
            account: LedgerAccount.SELLER_RESERVE,
            entryType: EntryType.DEBIT,
            amount: disputeRecord.amount,
            partyType: "SELLER",
            partyId: String(effectiveSeller),
          },
          {
            account: LedgerAccount.CHARGEBACK_DISPUTE,
            entryType: EntryType.CREDIT,
            amount: disputeRecord.amount,
            partyType: "SYSTEM",
            partyId: "DISPUTE_RESERVE",
          }
        );
      }

      // Financial journal for lost chargeback:
      await ledgerService.postJournal({
        referenceType: "CHARGEBACK_LOST",
        referenceId: disputeRecord.refundId,
        idempotencyKey: `led_cb_lost_${disputeRecord.refundId}`,
        description: `Lost Chargeback for order ${disputeRecord.order} (Ref: ${disputeReference})`,
        postings,
      });
    }

    return disputeRecord;
  }
}

export const refundService = new RefundService();
export default refundService;
