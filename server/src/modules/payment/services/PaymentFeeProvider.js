/**
 * Payment Fee Provider & Fee Abstraction Engine (Phase 19)
 * Calculates provider-specific interchange, platform commissions, gateway fees, and statutory taxes.
 * Removes hardcoded assumptions and snapshots historical fee values.
 */
export class PaymentFeeProvider {
  constructor() {
    this.feeRules = {
      DEFAULT: { gatewayFeeRate: 0.02, commissionRate: 0.05, taxRate: 0.01 },
      UPI: { gatewayFeeRate: 0.0, commissionRate: 0.05, taxRate: 0.01 }, // NPCI zero-MDR on P2M UPI
      CARD: { gatewayFeeRate: 0.02, commissionRate: 0.05, taxRate: 0.01 },
      NETBANKING: { gatewayFeeRate: 0.018, commissionRate: 0.05, taxRate: 0.01 },
      WALLET: { gatewayFeeRate: 0.0, commissionRate: 0.05, taxRate: 0.01 }, // Internal closed-loop wallet
      COD: { gatewayFeeRate: 0.0, commissionRate: 0.05, taxRate: 0.01 },
    };
  }

  /**
   * Calculate exact financial fee breakdown for an order amount and rail.
   */
  calculateFee({
    amount,
    rail = "UPI",
    provider = "RAZORPAY",
    sellerCommissionOverride = null,
  }) {
    const gross = Number(amount || 0);
    const rule = this.feeRules[rail.toUpperCase()] || this.feeRules.DEFAULT;

    const commissionRate =
      sellerCommissionOverride !== null
        ? Number(sellerCommissionOverride)
        : rule.commissionRate;
    const gatewayFeeRate = rule.gatewayFeeRate;
    const taxRate = rule.taxRate;

    const commissionAmount = Math.round(gross * commissionRate);
    const gatewayFeeAmount = Math.round(gross * gatewayFeeRate);
    const taxAmount = Math.round(gross * taxRate);
    const totalDeductions = commissionAmount + gatewayFeeAmount + taxAmount;
    const netPayable = Math.max(0, gross - totalDeductions);

    return {
      grossAmount: gross,
      rail: rail.toUpperCase(),
      provider: provider.toUpperCase(),
      feeSnapshot: {
        commissionRate,
        commissionAmount,
        gatewayFeeRate,
        gatewayFeeAmount,
        taxRate,
        taxAmount,
        totalDeductions,
        calculatedAt: new Date(),
      },
      netPayable,
    };
  }

  /**
   * Estimate fee for presentation and verification.
   */
  estimateFee(arg1, arg2) {
    if (typeof arg1 === "object") {
      const gross = Number(arg1.amount || 0);
      const rail = (arg1.rail || arg1.method || "UPI").toUpperCase();
      const rule = this.feeRules[rail] || this.feeRules.DEFAULT;
      const gatewayFee = Math.round(gross * rule.gatewayFeeRate);
      const gst = Math.round(gatewayFee * 0.18);
      const totalDeduction = gatewayFee + gst;
      return {
        amount: gross,
        rail,
        gatewayFee,
        gst,
        totalDeduction,
      };
    }
    return this.calculateFee({ amount: arg1, rail: arg2 });
  }

  /**
   * Snapshot fee breakdown for immutable persistence.
   */
  snapshotFees({ amount, method = "UPI", provider = "RAZORPAY", rail }) {
    const feeRes = this.calculateFee({ amount, rail: rail || method, provider });
    return {
      estimatedGatewayFee: feeRes.feeSnapshot.gatewayFeeAmount,
      commissionAmount: feeRes.feeSnapshot.commissionAmount,
      taxAmount: feeRes.feeSnapshot.taxAmount,
      totalDeductions: feeRes.feeSnapshot.totalDeductions,
      feeSnapshot: feeRes.feeSnapshot,
    };
  }

  /**
   * Calculate refund adjustment to vendor settlement.
   */
  refundFee({ refundAmount, originalGross, originalFeeSnapshot }) {
    const refund = Number(refundAmount || 0);
    if (!originalFeeSnapshot || originalGross <= 0) {
      return { refundAdjustment: refund, commissionAdjustment: 0 };
    }

    const ratio = refund / originalGross;
    const commissionAdjustment = Math.round(
      (originalFeeSnapshot.commissionAmount || 0) * ratio
    );
    const refundAdjustment = refund - commissionAdjustment;

    return {
      refundAmount: refund,
      commissionAdjustment,
      refundAdjustment,
    };
  }
}

export const paymentFeeProvider = new PaymentFeeProvider();
export default paymentFeeProvider;
