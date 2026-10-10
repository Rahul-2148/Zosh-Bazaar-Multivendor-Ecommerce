import crypto from "crypto";
import { Settlement } from "../models/settlement.model.js";
import { SettlementBatch, SettlementBatchStatus } from "../models/settlementBatch.model.js";
import { SellerBeneficiary, BeneficiaryStatus } from "../models/sellerBeneficiary.model.js";
import { SellerRiskHold, RiskHoldStatus, RiskHoldReason } from "../models/sellerRiskHold.model.js";
import { Order } from "../../../models/order.model.js";
import OrderStatus from "../../../domain/OrderStatus.js";
import PaymentStatus from "../../../domain/PaymentStatus.js";
import ledgerService from "./LedgerService.js";
import LedgerAccount, { EntryType } from "../domain/LedgerAccount.js";
import { sandboxPayoutAdapter } from "../adapters/payout/SandboxPayoutAdapter.js";
import { bankPayoutAdapter } from "../adapters/payout/BankPayoutAdapter.js";
import paymentOutboxService from "./PaymentOutboxService.js";
import Money from "../utils/Money.js";

/**
 * Seller Settlement Engine
 * Tracks gross sales, platform commissions, taxes (TCS/TDS), and net payable payouts.
 * Immutably snapshots fee parameters upon settlement batch generation.
 */
export class SettlementService {
  /**
   * Deterministic calculation of seller payout deductions.
   */
  calculateSellerSettlement({
    grossOrderAmount = 0,
    commissionRatePercent = 5.0,
    gatewayFeePercent = 2.0,
    tcsRatePercent = 1.0,
  }) {
    const grossPaise = Money.toMinorUnits(grossOrderAmount || 0, "grossOrderAmount", { allowZero: true });
    const platformFeePaise = Math.round(grossPaise * (commissionRatePercent / 100));
    const gatewayFeePaise = Math.round(grossPaise * (gatewayFeePercent / 100));
    const taxDeductionPaise = Math.round(grossPaise * (tcsRatePercent / 100));
    const netPayoutPaise = grossPaise - platformFeePaise - gatewayFeePaise - taxDeductionPaise;

    const gross = Money.fromMinorUnits(grossPaise);
    const platformFee = Money.fromMinorUnits(platformFeePaise);
    const gatewayFee = Money.fromMinorUnits(gatewayFeePaise);
    const taxDeduction = Money.fromMinorUnits(taxDeductionPaise);
    const netPayout = Money.fromMinorUnits(netPayoutPaise);

    return {
      grossAmount: gross,
      platformFee,
      gatewayFee,
      taxDeduction,
      netPayout,
      netAmount: netPayout,
    };
  }

  /**
   * Calculate commercial fee deductions for an order with snapshotted rates.
   */
  calculateOrderSettlement(
    order,
    feeSnapshot = { commissionRatePercent: 5.0, gatewayFeePercent: 2.0, tcsRatePercent: 1.0 }
  ) {
    const gross = Number(order.totalSellingPrice || 0);
    const platformFee =
      Math.round(gross * (feeSnapshot.commissionRatePercent / 100) * 100) / 100;
    const paymentFee =
      Math.round(gross * (feeSnapshot.gatewayFeePercent / 100) * 100) / 100;
    const taxDeduction =
      Math.round(gross * (feeSnapshot.tcsRatePercent / 100) * 100) / 100;
    const netAmount = Math.round((gross - platformFee - paymentFee - taxDeduction) * 100) / 100;

    return {
      order: order._id,
      grossAmount: gross,
      platformFee,
      paymentFee,
      taxDeduction,
      refundAdjustment: 0,
      netAmount,
    };
  }

  /**
   * Multi-Vendor Marketplace Order Settlement Attribution:
   * Splits an order with multiple vendors across distinct seller payables.
   */
  calculateMultiVendorSettlement(
    order,
    feeSnapshot = { commissionRatePercent: 5.0, gatewayFeePercent: 2.0, tcsRatePercent: 1.0 }
  ) {
    const items = order.orderItems || [];
    const sellerSplits = new Map();

    for (const item of items) {
      const sellerId = (item.seller?._id || item.seller || order.seller?._id || order.seller || "PLATFORM").toString();
      const itemGross = Number(item.sellingPrice || item.price || 0) * Number(item.quantity || 1);

      if (!sellerSplits.has(sellerId)) {
        sellerSplits.set(sellerId, {
          sellerId,
          grossAmount: 0,
          itemsCount: 0,
        });
      }

      const rec = sellerSplits.get(sellerId);
      rec.grossAmount += itemGross;
      rec.itemsCount += Number(item.quantity || 1);
    }

    const results = [];
    const commRate = feeSnapshot.commissionRatePercent ?? (feeSnapshot.platformFee && order.totalSellingPrice ? (feeSnapshot.platformFee / order.totalSellingPrice) * 100 : 5.0);
    const gwRate = feeSnapshot.gatewayFeePercent ?? (feeSnapshot.paymentProcessingFee && order.totalSellingPrice ? (feeSnapshot.paymentProcessingFee / order.totalSellingPrice) * 100 : 2.0);
    const tcsRate = feeSnapshot.tcsRatePercent ?? 0.0;

    for (const [sellerId, data] of sellerSplits.entries()) {
      const gross = data.grossAmount;
      const grossPaise = Math.round(Number(gross) * 100);
      const platformFeePaise = Math.round(grossPaise * (Number(commRate) / 100));
      const paymentFeePaise = Math.round(grossPaise * (Number(gwRate) / 100));
      const taxDeductionPaise = Math.round(grossPaise * (Number(tcsRate) / 100));
      const netPaise = grossPaise - platformFeePaise - paymentFeePaise - taxDeductionPaise;

      const platformFee = platformFeePaise / 100;
      const paymentFee = paymentFeePaise / 100;
      const taxDeduction = taxDeductionPaise / 100;
      const netAmount = netPaise / 100;

      results.push({
        orderId: order._id,
        sellerId,
        grossAmount: gross,
        platformFee,
        paymentFee,
        platformCommission: platformFee,
        paymentGatewayFee: paymentFee,
        taxDeduction,
        netPayable: netAmount,
        itemsCount: data.itemsCount,
      });
    }

    const totalGross = results.reduce((sum, r) => sum + r.grossAmount, 0);
    results.orderId = order._id;
    results.totalGross = totalGross;
    results.vendorSettlements = results;
    return results;
  }

  /**
   * Create a settlement batch for a seller's delivered and captured orders.
   * Freezes feeSnapshot so historical settlement values cannot mutate.
   */
  async generateSellerSettlement(sellerId, customFeeRates = {}) {
    const eligibleOrders = await Order.find({
      seller: sellerId,
      orderStatus: OrderStatus.DELIVERED,
      paymentStatus: PaymentStatus.CAPTURED,
    }).lean();

    if (eligibleOrders.length === 0) {
      return { message: "No eligible delivered orders for settlement", settlement: null };
    }

    const feeSnapshot = {
      commissionRatePercent: customFeeRates.commissionRatePercent ?? 5.0,
      gatewayFeePercent: customFeeRates.gatewayFeePercent ?? 2.0,
      tcsRatePercent: customFeeRates.tcsRatePercent ?? 1.0,
      calculatedAt: new Date(),
    };

    const calculatedOrders = eligibleOrders.map((ord) =>
      this.calculateOrderSettlement(ord, feeSnapshot)
    );
    const grossAmount = calculatedOrders.reduce((sum, o) => sum + o.grossAmount, 0);
    const platformFees = calculatedOrders.reduce((sum, o) => sum + o.platformFee, 0);
    const paymentFees = calculatedOrders.reduce((sum, o) => sum + o.paymentFee, 0);
    const taxDeductions = calculatedOrders.reduce((sum, o) => sum + o.taxDeduction, 0);
    const totalDeductions = platformFees + paymentFees + taxDeductions;
    const netPayable = grossAmount - totalDeductions;

    const settlementId = `stl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const settlement = await Settlement.create({
      settlementId,
      seller: sellerId,
      orders: calculatedOrders,
      grossAmount,
      totalDeductions,
      netPayable,
      feeSnapshot,
      status: "READY",
    });

    // Enqueue SettlementCreated outbox event
    await paymentOutboxService
      .enqueueEvent({
        eventType: "SettlementCreated",
        aggregateType: "Settlement",
        aggregateId: settlementId,
        payload: { settlementId, sellerId, netPayable },
        idempotencyKey: `outbox_stl_created_${settlementId}`,
      })
      .catch(() => {});

    return { message: "Settlement batch created", settlement };
  }

  /**
   * Submit settlement to payout rail adapter.
   */
  async executePayout(settlementId, payoutAdapter = sandboxPayoutAdapter) {
    const settlement = await Settlement.findOne({ settlementId });
    if (!settlement) {
      throw new Error(`Settlement "${settlementId}" not found`);
    }

    settlement.status = "PROCESSING";
    await settlement.save();

    const payoutResult = await payoutAdapter.createPayout({
      sellerId: settlement.seller,
      amount: settlement.netPayable,
      currency: settlement.currency,
      referenceId: settlement.settlementId,
    });

    settlement.payoutReference = payoutResult.payoutReference;
    settlement.utrNumber = payoutResult.utr || null;
    settlement.status = payoutResult.status === "SUBMITTED" ? "SUBMITTED" : "PENDING";
    await settlement.save();

    return settlement;
  }

  /**
   * Mark settlement payout completed with bank UTR number and record double-entry journal.
   * Invariant: Never mark SETTLED without authoritative UTR confirmation.
   */
  async markSettled(settlementId, utrNumber = null, options = {}) {
    const isProduction =
      options.isProduction ||
      process.env.NODE_ENV === "production" ||
      process.env.PAYMENT_ENV === "production";

    const authoritativeUtr = utrNumber;
    if (
      isProduction &&
      authoritativeUtr &&
      (authoritativeUtr.startsWith("SBX_") ||
        authoritativeUtr.toUpperCase().includes("FAKE") ||
        authoritativeUtr.toUpperCase().includes("MOCK") ||
        authoritativeUtr.toUpperCase().includes("SYNTHETIC"))
    ) {
      const err = new Error(
        `Cannot mark settlement "${settlementId}" SETTLED using synthetic or fake UTR ("${authoritativeUtr}") in production`
      );
      err.code = "INVALID_PRODUCTION_UTR";
      err.statusCode = 422;
      throw err;
    }

    if (!authoritativeUtr && !options.allowStoredUtr) {
      throw new Error(
        `Cannot mark settlement "${settlementId}" SETTLED without authoritative bank UTR confirmation`
      );
    }

    const settlement = await Settlement.findOne({ settlementId });
    if (!settlement) {
      throw new Error(`Settlement "${settlementId}" not found`);
    }

    const finalUtr = authoritativeUtr || settlement.utrNumber;
    if (!finalUtr) {
      throw new Error(
        `Cannot mark settlement "${settlementId}" SETTLED without authoritative bank UTR confirmation`
      );
    }

    settlement.status = "SETTLED";
    settlement.utrNumber = finalUtr;
    settlement.settledAt = new Date();
    await settlement.save();

    // Double-entry journal for vendor payout:
    // DEBIT: SELLER_PAYABLE (Liability drops)
    // CREDIT: BANK_ESCROW (Asset drops)
    await ledgerService.postJournal({
      referenceType: "SELLER_SETTLEMENT",
      referenceId: settlement.settlementId,
      idempotencyKey: `led_stl_${settlement.settlementId}`,
      description: `Vendor payout of ₹${settlement.netPayable} (UTR: ${settlement.utrNumber})`,
      postings: [
        {
          account: LedgerAccount.SELLER_PAYABLE,
          entryType: EntryType.DEBIT,
          amount: settlement.netPayable,
          partyType: "SELLER",
          partyId: settlement.seller.toString(),
        },
        {
          account: LedgerAccount.BANK_ESCROW,
          entryType: EntryType.CREDIT,
          amount: settlement.netPayable,
          partyType: "BANK",
          partyId: "PRIMARY_ESCROW",
        },
      ],
    });

    // Enqueue SettlementCompleted outbox event
    await paymentOutboxService
      .enqueueEvent({
        eventType: "SettlementCompleted",
        aggregateType: "Settlement",
        aggregateId: settlementId,
        payload: {
          settlementId,
          sellerId: settlement.seller,
          netPayable: settlement.netPayable,
          utrNumber: settlement.utrNumber,
        },
        idempotencyKey: `outbox_stl_settled_${settlementId}`,
      })
      .catch(() => {});

    return settlement;
  }

  async recordPayout({ settlementId, utr, options = {} }) {
    return this.markSettled(settlementId, utr, options);
  }

  async getAllSettlements(query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (query.status && query.status !== "ALL") {
      filter.status = query.status;
    }

    const [settlements, total] = await Promise.all([
      Settlement.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("seller", "sellerName email businessDetails")
        .lean(),
      Settlement.countDocuments(filter),
    ]);

    return {
      settlements,
      total,
      totalPages: Math.ceil(total / limit),
      page,
    };
  }

  // --------------------------------------------------------------------------
  // PLATFORM 9.0 BENEFICIARY MANAGEMENT
  // --------------------------------------------------------------------------

  async registerSellerBeneficiary({
    sellerId,
    accountHolderName,
    bankName,
    accountNumber,
    ifscCode,
    accountType = "CURRENT",
    isPrimary = true,
  }) {
    if (!accountNumber || accountNumber.length < 6) {
      throw new Error("Invalid bank account number");
    }
    if (!ifscCode || ifscCode.length !== 11) {
      throw new Error("Invalid IFSC code (must be 11 characters)");
    }

    const last4 = String(accountNumber).slice(-4);
    const accountNumberMasked = `••••••••${last4}`;
    const accountNumberToken = crypto
      .createHash("sha256")
      .update(String(accountNumber))
      .digest("hex");

    const beneficiaryId = `ben_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    if (isPrimary) {
      await SellerBeneficiary.updateMany({ seller: sellerId }, { isPrimary: false });
    }

    const beneficiary = await SellerBeneficiary.create({
      beneficiaryId,
      seller: sellerId,
      accountHolderName,
      bankName,
      accountNumberMasked,
      accountNumberToken,
      ifscCode: ifscCode.toUpperCase(),
      accountType,
      isPrimary,
      status: BeneficiaryStatus.CREATED,
      payoutEligible: false,
    });

    return beneficiary;
  }

  async verifySellerBeneficiary({ beneficiaryId, verificationRef = null, isSuccessful = true }) {
    const beneficiary = await SellerBeneficiary.findOne({ beneficiaryId });
    if (!beneficiary) {
      throw new Error(`Beneficiary "${beneficiaryId}" not found`);
    }

    if (isSuccessful) {
      beneficiary.status = BeneficiaryStatus.VERIFIED;
      beneficiary.payoutEligible = true;
      beneficiary.verificationRef = verificationRef || `vrf_${Date.now()}`;
      beneficiary.verifiedAt = new Date();
    } else {
      beneficiary.status = BeneficiaryStatus.SUSPENDED;
      beneficiary.payoutEligible = false;
    }

    await beneficiary.save();
    return beneficiary;
  }

  async getSellerBeneficiaries(sellerId) {
    return await SellerBeneficiary.find({ seller: sellerId }).sort({ isPrimary: -1, createdAt: -1 }).lean();
  }

  // --------------------------------------------------------------------------
  // PLATFORM 9.0 SELLER RISK HOLDS & ROLLING RESERVES
  // --------------------------------------------------------------------------

  async createSellerRiskHold({
    sellerId,
    amount,
    currency = "INR",
    reason = RiskHoldReason.ROLLING_RESERVE,
    notes = "",
    expiresAt = null,
    placedBy = null,
    sourceReference = null,
  }) {
    const holdPaise = Money.toMinorUnits(amount, "riskHoldAmount");
    const holdAmount = Money.fromMinorUnits(holdPaise);

    const holdId = `hld_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const hold = await SellerRiskHold.create({
      holdId,
      seller: sellerId,
      amount: holdAmount,
      currency,
      reason,
      status: RiskHoldStatus.ACTIVE,
      notes,
      expiresAt,
      placedBy,
      sourceReference,
    });

    // Double-entry journal:
    // Move liability from SELLER_PAYABLE to SELLER_RESERVE
    await ledgerService.postJournal({
      referenceType: "SELLER_RESERVE_HOLD",
      referenceId: holdId,
      idempotencyKey: `led_hold_${holdId}`,
      description: `Risk Hold ₹${holdAmount} placed on seller (${reason})`,
      postings: [
        {
          account: LedgerAccount.SELLER_PAYABLE,
          entryType: EntryType.DEBIT,
          amount: holdAmount,
          partyType: "SELLER",
          partyId: String(sellerId),
        },
        {
          account: LedgerAccount.SELLER_RESERVE,
          entryType: EntryType.CREDIT,
          amount: holdAmount,
          partyType: "SELLER",
          partyId: String(sellerId),
        },
      ],
    });

    return hold;
  }

  async releaseSellerRiskHold({ holdId, releasedBy = null }) {
    const hold = await SellerRiskHold.findOne({ holdId });
    if (!hold) {
      throw new Error(`Risk hold "${holdId}" not found`);
    }
    if (hold.status !== RiskHoldStatus.ACTIVE) {
      throw new Error(`Risk hold "${holdId}" is already ${hold.status}`);
    }

    hold.status = RiskHoldStatus.RELEASED;
    hold.releasedAt = new Date();
    if (releasedBy) hold.releasedBy = releasedBy;
    await hold.save();

    // Reversing journal:
    // Move liability from SELLER_RESERVE back to SELLER_PAYABLE
    await ledgerService.postJournal({
      referenceType: "SELLER_RESERVE_RELEASE",
      referenceId: holdId,
      idempotencyKey: `led_rel_${holdId}`,
      description: `Risk Hold ₹${hold.amount} released for seller`,
      postings: [
        {
          account: LedgerAccount.SELLER_RESERVE,
          entryType: EntryType.DEBIT,
          amount: hold.amount,
          partyType: "SELLER",
          partyId: String(hold.seller),
        },
        {
          account: LedgerAccount.SELLER_PAYABLE,
          entryType: EntryType.CREDIT,
          amount: hold.amount,
          partyType: "SELLER",
          partyId: String(hold.seller),
        },
      ],
    });

    return hold;
  }

  async getSellerRiskHolds(sellerId) {
    return await SellerRiskHold.find({ seller: sellerId }).sort({ createdAt: -1 }).lean();
  }

  // --------------------------------------------------------------------------
  // PLATFORM 9.0 SETTLEMENT BATCH LIFECYCLE
  // --------------------------------------------------------------------------

  async generateSettlementBatch(sellerId, options = {}) {
    const returnWindowDays = options.returnWindowDays ?? 7;
    const settlementDelayDays = options.settlementDelayDays ?? 2;
    const minPayoutThreshold = options.minPayoutThreshold ?? 100;
    const reservePercent = options.reservePercent ?? 0.0;
    const cutoffDate = new Date(Date.now() - returnWindowDays * 24 * 60 * 60 * 1000);

    const eligibleOrders = await Order.find({
      seller: sellerId,
      orderStatus: OrderStatus.DELIVERED,
      paymentStatus: PaymentStatus.CAPTURED,
      updatedAt: { $lte: options.skipReturnWindowCheck ? new Date() : cutoffDate },
    }).lean();

    if (eligibleOrders.length === 0) {
      return { message: "No eligible delivered orders meeting return window policy", batch: null };
    }

    const feeSnapshot = {
      commissionRatePercent: options.commissionRatePercent ?? 5.0,
      gatewayFeePercent: options.gatewayFeePercent ?? 2.0,
      tcsRatePercent: options.tcsRatePercent ?? 1.0,
      reservePercent,
      calculatedAt: new Date(),
    };

    let totalGross = 0;
    let totalPlatformFees = 0;
    let totalGatewayFees = 0;
    let totalTcs = 0;
    const calculatedOrderRecords = [];

    for (const ord of eligibleOrders) {
      const gross = Number(ord.totalSellingPrice || 0);
      const platformFee = Math.round(gross * (feeSnapshot.commissionRatePercent / 100) * 100) / 100;
      const gatewayFee = Math.round(gross * (feeSnapshot.gatewayFeePercent / 100) * 100) / 100;
      const taxDeduction = Math.round(gross * (feeSnapshot.tcsRatePercent / 100) * 100) / 100;
      const net = Math.round((gross - platformFee - gatewayFee - taxDeduction) * 100) / 100;

      totalGross += gross;
      totalPlatformFees += platformFee;
      totalGatewayFees += gatewayFee;
      totalTcs += taxDeduction;

      calculatedOrderRecords.push({
        orderId: ord._id,
        grossAmount: gross,
        platformFee,
        gatewayFee,
        taxDeduction,
        refundAdjustment: 0,
        reserveHold: 0,
        netPayable: net,
      });
    }

    const totalDeductions = totalPlatformFees + totalGatewayFees + totalTcs;
    const reserveHeld = Math.round(totalGross * (reservePercent / 100) * 100) / 100;
    const netPayable = Math.round((totalGross - totalDeductions - reserveHeld) * 100) / 100;

    if (netPayable < minPayoutThreshold && !options.forceGenerate) {
      return {
        message: `Calculated net payable (₹${netPayable}) is below minimum payout threshold (₹${minPayoutThreshold})`,
        batch: null,
      };
    }

    // Lookup verified primary beneficiary
    const beneficiary = await SellerBeneficiary.findOne({
      seller: sellerId,
      isPrimary: true,
      status: BeneficiaryStatus.VERIFIED,
    });

    const batchId = `sbt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const idempotencyKey = `batch_${sellerId}_${batchId}`;

    const batch = await SettlementBatch.create({
      batchId,
      seller: sellerId,
      periodStart: eligibleOrders[0]?.createdAt || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      periodEnd: new Date(),
      orders: calculatedOrderRecords,
      grossAmount: totalGross,
      platformFees: totalPlatformFees,
      gatewayFees: totalGatewayFees,
      taxDeductions: totalTcs,
      refundAdjustments: 0,
      reserveHeld,
      netPayable,
      feeSnapshot,
      eligibilityPolicy: {
        returnWindowDays,
        settlementDelayDays,
        minPayoutThreshold,
        requireDeliveryConfirmation: true,
      },
      status: SettlementBatchStatus.CALCULATED,
      beneficiary: beneficiary?._id || null,
      idempotencyKey,
    });

    return { message: "Settlement batch calculated", batch };
  }

  async executeBatchPayout(batchId, adapter = bankPayoutAdapter, _options = {}) {
    const batch = await SettlementBatch.findOne({ batchId }).populate("beneficiary");
    if (!batch) {
      throw new Error(`SettlementBatch "${batchId}" not found`);
    }

    if (batch.status === SettlementBatchStatus.PAID) {
      return { message: "Batch already paid", batch };
    }

    const ben = batch.beneficiary;
    if (
      !ben ||
      (ben.status && ben.status !== "VERIFIED") ||
      ben.payoutEligible === false ||
      !ben.accountNumberMasked ||
      !ben.ifscCode
    ) {
      batch.status = SettlementBatchStatus.REVIEW_REQUIRED;
      batch.holdReason = "UNVERIFIED_OR_MISSING_BENEFICIARY";
      await batch.save();
      const err = new Error(
        `Cannot execute payout for SettlementBatch "${batchId}": Beneficiary is missing, unverified, or ineligible`
      );
      err.code = "BENEFICIARY_NOT_VERIFIED";
      err.statusCode = 422;
      throw err;
    }

    const adapterName = adapter.name || "BANK_PAYOUT_ADAPTER";
    if (batch.payoutProvider && batch.payoutProvider !== adapterName) {
      const err = new Error(
        `Cannot execute payout with adapter "${adapterName}": Batch is locked to provider "${batch.payoutProvider}"`
      );
      err.code = "PAYOUT_PROVIDER_MISMATCH";
      err.statusCode = 409;
      throw err;
    }
    batch.payoutProvider = adapterName;

    // Explicit Lifecycle: SUBMITTING
    batch.status = SettlementBatchStatus.SUBMITTING;
    await batch.save();

    try {
      const payoutResult = await adapter.createPayout({
        sellerId: batch.seller,
        amount: batch.netPayable,
        currency: batch.currency,
        beneficiaryReference: batch.beneficiary?.beneficiaryId || null,
        bankAccountMasked: batch.beneficiary.accountNumberMasked,
        ifsc: batch.beneficiary.ifscCode,
        referenceId: batch.batchId,
        idempotencyKey: batch.idempotencyKey,
      });

      if (payoutResult.status === "BLOCKED_BY_CREDENTIALS") {
        batch.status = SettlementBatchStatus.FAILED;
        batch.holdReason = "BLOCKED_BY_BANK_API_ACCESS";
        await batch.save();
        return {
          message: "Payout execution blocked by missing bank credentials",
          status: "BLOCKED_BY_CREDENTIALS",
          batch,
        };
      }

      batch.payoutReference = payoutResult.payoutReference;
      batch.utrNumber = payoutResult.utr || null;
      batch.status =
        payoutResult.status === "SUBMITTED"
          ? SettlementBatchStatus.SUBMITTED
          : SettlementBatchStatus.PROCESSING;
      batch.submittedAt = new Date();
      await batch.save();

      return { message: "Payout instruction submitted", batch };
    } catch (networkErr) {
      // Ambiguous Response Recovery Invariant:
      // When network drops or times out after submission, NEVER retry createPayout blindly!
      // Mark STATUS_CHECK_REQUIRED for authoritative status poll.
      batch.status = SettlementBatchStatus.STATUS_CHECK_REQUIRED;
      batch.holdReason = `AMBIGUOUS_TIMEOUT: ${networkErr.message}`;
      await batch.save();

      return {
        message: "Payout request timed out or was ambiguous. Marked STATUS_CHECK_REQUIRED.",
        status: SettlementBatchStatus.STATUS_CHECK_REQUIRED,
        batch,
        error: networkErr.message,
      };
    }
  }

  /**
   * Authoritative Ambiguous Payout Recovery
   * Safely queries provider status to determine whether bank transfer was executed.
   */
  async recoverAmbiguousPayout(batchId, adapter = bankPayoutAdapter) {
    const batch = await SettlementBatch.findOne({ batchId }).populate("beneficiary");
    if (!batch) {
      throw new Error(`SettlementBatch "${batchId}" not found for recovery`);
    }

    if (batch.status === SettlementBatchStatus.PAID) {
      return { status: "ALREADY_PAID", batch };
    }

    try {
      const statusResult = await adapter.getPayoutStatus({
        payoutReference: batch.payoutReference,
        externalReference: batch.batchId,
      });

      if (statusResult.status === "SUCCESS" && statusResult.utr) {
        return await this.markBatchSettled(batchId, statusResult.utr);
      } else if (statusResult.status === "PROCESSING") {
        batch.status = SettlementBatchStatus.PROCESSING;
        batch.holdReason = null;
        await batch.save();
        return batch;
      } else if (statusResult.status === "FAILED") {
        batch.status = SettlementBatchStatus.FAILED;
        batch.holdReason = statusResult.failureReason || "Bank declined payout transfer";
        await batch.save();
        return batch;
      } else if (statusResult.status === "NOT_FOUND") {
        // Provider confirmed no payout was created: Safe to mark failed so it can be re-attempted
        batch.status = SettlementBatchStatus.FAILED;
        batch.holdReason = "VERIFIED_UNSUBMITTED_BY_BANK";
        await batch.save();
        return batch;
      }

      // If status query is still UNKNOWN or blocked by credentials:
      return {
        status: SettlementBatchStatus.STATUS_CHECK_REQUIRED,
        batch,
        message: "Payout status query returned ambiguous status; retaining recovery lock.",
      };
    } catch (pollErr) {
      return {
        status: SettlementBatchStatus.STATUS_CHECK_REQUIRED,
        batch,
        message: `Recovery inquiry failed: ${pollErr.message}`,
      };
    }
  }

  async markBatchSettled(batchId, utrNumber, options = {}) {
    const isProduction =
      options.isProduction ||
      process.env.NODE_ENV === "production" ||
      process.env.PAYMENT_ENV === "production";

    if (
      isProduction &&
      utrNumber &&
      (utrNumber.startsWith("SBX_") ||
        utrNumber.toUpperCase().includes("FAKE") ||
        utrNumber.toUpperCase().includes("MOCK") ||
        utrNumber.toUpperCase().includes("SYNTHETIC"))
    ) {
      const err = new Error(
        `Cannot mark SettlementBatch "${batchId}" PAID using synthetic UTR ("${utrNumber}") in production`
      );
      err.code = "INVALID_PRODUCTION_UTR";
      err.statusCode = 422;
      throw err;
    }

    if (!utrNumber && !options.allowStoredUtr) {
      throw new Error(`Cannot mark SettlementBatch "${batchId}" settled without authoritative bank UTR`);
    }

    const batch = await SettlementBatch.findOne({ batchId });
    if (!batch) {
      throw new Error(`SettlementBatch "${batchId}" not found`);
    }

    if (batch.status === SettlementBatchStatus.PAID) {
      return batch; // Idempotent return: do not post duplicate journal
    }

    if (
      batch.status === SettlementBatchStatus.DRAFT ||
      batch.status === SettlementBatchStatus.CALCULATED
    ) {
      const err = new Error(
        `Cannot mark unapproved SettlementBatch "${batchId}" as PAID without approval or payout submission (current status: "${batch.status}")`
      );
      err.code = "INVALID_BATCH_STATUS_TRANSITION";
      err.statusCode = 422;
      throw err;
    }

    const finalUtr = utrNumber || batch.utrNumber;
    if (!finalUtr) {
      throw new Error(`Cannot mark SettlementBatch "${batchId}" settled without authoritative bank UTR`);
    }

    batch.status = SettlementBatchStatus.PAID;
    batch.utrNumber = finalUtr;
    batch.completedAt = new Date();
    await batch.save();

    // Double-entry ledger journal for batch payout
    await ledgerService.postJournal({
      referenceType: "SELLER_BATCH_SETTLEMENT",
      referenceId: batch.batchId,
      idempotencyKey: `led_sbt_${batch.batchId}`,
      description: `SettlementBatch ${batch.batchId} paid (UTR: ${finalUtr})`,
      postings: [
        {
          account: LedgerAccount.SELLER_PAYABLE,
          entryType: EntryType.DEBIT,
          amount: batch.netPayable,
          partyType: "SELLER",
          partyId: String(batch.seller),
        },
        {
          account: LedgerAccount.BANK_ESCROW,
          entryType: EntryType.CREDIT,
          amount: batch.netPayable,
          partyType: "BANK",
          partyId: "PRIMARY_ESCROW",
        },
      ],
    });

    return batch;
  }
}

export const settlementService = new SettlementService();
export default settlementService;
