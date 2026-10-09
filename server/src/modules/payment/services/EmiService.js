import { POPULAR_BANKS } from "../domain/PaymentRail.js";

/**
 * Server-Authoritative EMI Engine & Capability Model (Phase 11)
 * Computes standard, low-cost, and no-cost EMI plans with exact monthly installments,
 * reducing balance interest, and bank processing fees.
 * Frontend calculations are NEVER trusted.
 */
export class EmiService {
  constructor() {
    this.minEmiOrderAmount = 3000;
    this.eligibleBanks = [
      { code: "HDFC", name: "HDFC Bank", annualInterestRate: 14.0, processingFee: 199 },
      { code: "ICICI", name: "ICICI Bank", annualInterestRate: 13.5, processingFee: 199 },
      { code: "SBIN", name: "State Bank of India", annualInterestRate: 14.5, processingFee: 99 },
      { code: "UTIB", name: "Axis Bank", annualInterestRate: 14.0, processingFee: 199 },
      { code: "KKBK", name: "Kotak Mahindra Bank", annualInterestRate: 15.0, processingFee: 199 },
    ];
  }

  /**
   * Check if an order amount qualifies for EMI.
   */
  isEligible(amount) {
    return Number(amount || 0) >= this.minEmiOrderAmount;
  }

  /**
   * Standard Equated Monthly Installment (EMI) Formula on Reducing Balance:
   * E = P * r * (1 + r)^n / ((1 + r)^n - 1)
   */
  computeInstallment(principal, annualRatePercent, months) {
    if (months <= 0) return principal;
    if (annualRatePercent === 0) return Math.round(principal / months);

    const monthlyRate = annualRatePercent / (12 * 100);
    const compound = Math.pow(1 + monthlyRate, months);
    const installment = Math.round((principal * monthlyRate * compound) / (compound - 1));
    return installment;
  }

  /**
   * Calculate a specific EMI plan for an order.
   */
  calculatePlan({
    amount,
    bankCode = "HDFC",
    tenureMonths = 3,
    cardType = "CREDIT",
    isNoCost = false,
  }) {
    const principal = Number(amount || 0);
    if (!this.isEligible(principal)) {
      throw new Error(
        `Order amount ₹${principal} is below minimum EMI threshold of ₹${this.minEmiOrderAmount}`
      );
    }

    const bank =
      this.eligibleBanks.find((b) => b.code === bankCode) || this.eligibleBanks[0];
    const annualRate = isNoCost ? 0 : bank.annualInterestRate;
    const months = [3, 6, 9, 12, 18, 24].includes(Number(tenureMonths))
      ? Number(tenureMonths)
      : 3;

    const monthlyInstallment = this.computeInstallment(principal, annualRate, months);
    const grossRepayment = monthlyInstallment * months;
    const totalInterest = Math.max(0, grossRepayment - principal);
    const processingFee = isNoCost ? 0 : bank.processingFee;
    const instantDiscount = isNoCost ? totalInterest : 0; // Merchant subvention for no-cost EMI
    const totalPayable = principal + totalInterest + processingFee - instantDiscount;

    return {
      bankCode: bank.code,
      bankName: bank.name,
      cardType,
      tenureMonths: months,
      annualInterestRate: annualRate,
      monthlyInstallment,
      principal,
      totalInterest,
      processingFee,
      instantDiscount,
      totalPayable,
      isNoCost: Boolean(isNoCost),
    };
  }

  /**
   * Generate all available EMI plans for an order amount across eligible banks.
   */
  getAllPlans(amount) {
    const principal = Number(amount || 0);
    if (!this.isEligible(principal)) {
      return [];
    }

    const plans = [];
    const tenures = [3, 6, 9, 12];

    for (const bank of this.eligibleBanks) {
      for (const months of tenures) {
        plans.push(
          this.calculatePlan({
            amount: principal,
            bankCode: bank.code,
            tenureMonths: months,
            isNoCost: months === 3, // 3-month no cost promotional plan
          })
        );
      }
    }

    return plans;
  }

  /**
   * Check eligibility returning structured decision object.
   */
  checkEligibility({ amount }) {
    const principal = Number(amount || 0);
    const eligible = this.isEligible(principal);
    return {
      eligible,
      minOrderAmount: this.minEmiOrderAmount,
      reasonCode: eligible ? null : "ORDER_VALUE_TOO_LOW",
      message: eligible ? null : `Order value must be at least ₹${this.minEmiOrderAmount} for EMI`,
    };
  }

  /**
   * Return list of banks eligible for EMI.
   */
  getEligibleBanks() {
    return this.eligibleBanks;
  }

  /**
   * Return available plans for amount.
   */
  getAvailablePlans(amount) {
    return this.getAllPlans(amount);
  }

  /**
   * Server-authoritative EMI calculation.
   */
  calculateEmi({ amount, bankCode = "HDFC", tenureMonths = 6, subventionType = "NONE" }) {
    const isNoCost = subventionType === "NO_COST_SUBVENTION" || subventionType === "NO_COST";
    const plan = this.calculatePlan({
      amount,
      bankCode,
      tenureMonths,
      isNoCost,
    });
    return {
      monthlyInstallment: plan.monthlyInstallment,
      totalRepayment: plan.principal + plan.totalInterest,
      totalPayable: plan.totalPayable,
      interestAmount: plan.totalInterest,
      instantDiscount: plan.instantDiscount,
      processingFee: plan.processingFee,
      tenureMonths: plan.tenureMonths,
      bankCode: plan.bankCode,
      bankName: plan.bankName,
    };
  }
}

export const emiService = new EmiService();
export default emiService;
