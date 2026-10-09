import { POPULAR_BANKS, UPI_APPS } from "../domain/PaymentRail.js";
import walletService from "./WalletService.js";
import cardRailAdapter from "../adapters/CardRailAdapter.js";
import { User } from "../../../models/user.model.js";

/**
 * Server-Authoritative Payment Method Eligibility Engine
 * Evaluates payment options, restrictions, and badges dynamically based on order value,
 * risk scores, customer profile, and seller configurations.
 */
class PaymentEligibilityService {
  /**
   * Deterministic evaluation of payment method eligibility based on order thresholds.
   */
  getEligibleMethods({ orderAmount = 0, hasPhysicalGoods = true, userId = null }) {
    const isEmiEligible = orderAmount >= 2500;
    const isCodEligible = orderAmount <= 10000 && orderAmount > 0;
    return [
      {
        method: "UPI",
        rail: "UPI",
        title: "UPI (Google Pay, PhonePe, Paytm, QR)",
        available: true,
        reasonCode: null,
      },
      {
        method: "CARD",
        rail: "CARD",
        title: "Credit & Debit Cards",
        available: true,
        reasonCode: null,
      },
      {
        method: "COD",
        rail: "COD",
        title: "Cash on Delivery",
        available: isCodEligible,
        reasonCode: isCodEligible ? null : "ORDER_VALUE_LIMIT",
        displayMessage: isCodEligible ? null : "Cash on Delivery is unavailable for this order",
      },
      {
        method: "EMI",
        rail: "EMI",
        title: "EMI / Pay Later",
        available: isEmiEligible,
        reasonCode: isEmiEligible ? null : "MIN_AMOUNT_NOT_MET",
        displayMessage: isEmiEligible ? null : "EMI is only available for orders of ₹2,500 or higher",
      },
      {
        method: "NETBANKING",
        rail: "NETBANKING",
        title: "Net Banking",
        available: true,
        reasonCode: null,
      },
      {
        method: "WALLET",
        rail: "WALLET",
        title: "Zosh Wallet",
        available: true,
        reasonCode: null,
      },
    ];
  }

  /**
   * Determine available payment methods for a customer and checkout payload.
   * @param {Object} params
   * @param {string|Object} params.userId
   * @param {number} params.payableAmount
   * @param {Object} [params.shippingAddress]
   */
  async evaluateEligibility({ userId, payableAmount, shippingAddress = null }) {
    const user = await User.findById(userId).select("savedPaymentMethods email fullName mobile role").lean();
    const wallet = await walletService.getOrCreateWallet(userId);

    const methods = [];

    // 1. UPI
    methods.push({
      rail: "UPI",
      title: "UPI (Google Pay, PhonePe, Paytm, QR)",
      subtitle: "Instant payment with zero transaction fees",
      available: true,
      badge: "Fastest Checkout",
      popularApps: Object.values(UPI_APPS),
      qrSupported: true,
      savedVpas: (user?.savedPaymentMethods || []).filter((m) => m.type === "UPI"),
    });

    // 2. Saved & New Cards
    const savedCards = (user?.savedPaymentMethods || []).filter((m) => m.type === "CARD");
    methods.push({
      rail: "CARD",
      title: "Credit & Debit Cards",
      subtitle: "Visa, Mastercard, RuPay, Maestro & Amex",
      available: true,
      badge: "RBI Compliant Tokenization",
      savedCards,
      supportedNetworks: ["Visa", "Mastercard", "RuPay", "Amex"],
    });

    // 3. Zosh Wallet
    const walletBalance = Number(wallet.availableBalance) || 0;
    const isWalletSufficient = walletBalance >= payableAmount;
    const canSplit = walletBalance > 0 && walletBalance < payableAmount;

    methods.push({
      rail: "WALLET",
      title: "Zosh Wallet",
      subtitle: `Available Balance: ₹${walletBalance.toLocaleString("en-IN")}`,
      available: wallet.status === "ACTIVE",
      balance: walletBalance,
      isSufficient: isWalletSufficient,
      canSplit,
      badge: walletBalance > 0 ? "Instant 1-Click" : null,
      reasonCode: wallet.status !== "ACTIVE" ? "WALLET_FROZEN" : null,
      displayMessage:
        wallet.status !== "ACTIVE"
          ? "Your Zosh Wallet is temporarily suspended"
          : walletBalance === 0
          ? "Zero wallet balance. Add funds or pay via UPI/Card."
          : canSplit
          ? `Pay ₹${walletBalance} from Wallet + remaining ₹${payableAmount - walletBalance} via UPI/Card`
          : "Full order covered by wallet balance",
    });

    // 4. Net Banking
    methods.push({
      rail: "NETBANKING",
      title: "Net Banking",
      subtitle: "All major Indian retail and corporate banks supported",
      available: true,
      popularBanks: POPULAR_BANKS.filter((b) => b.popular),
      allBanks: POPULAR_BANKS,
    });

    // 5. EMI / Pay Later
    const isEmiEligible = payableAmount >= 3000;
    methods.push({
      rail: "EMI",
      title: "EMI / Pay Later",
      subtitle: isEmiEligible
        ? "No Cost & Low Cost EMI starting from ₹" + Math.round(payableAmount / 3) + "/mo"
        : "Available on orders above ₹3,000",
      available: isEmiEligible,
      reasonCode: !isEmiEligible ? "MIN_AMOUNT_NOT_MET" : null,
      displayMessage: !isEmiEligible ? "EMI is only eligible for orders of ₹3,000 or higher" : null,
      tenureOptions: isEmiEligible ? cardRailAdapter.calculateEmiOptions(payableAmount) : [],
    });

    // 6. Cash on Delivery (COD)
    // Rule: COD unavailable for orders > ₹10,000 to minimize return-to-origin (RTO) risk
    const codMaxLimit = 10000;
    const isCodEligible = payableAmount <= codMaxLimit && payableAmount > 0;

    methods.push({
      rail: "COD",
      title: "Cash on Delivery",
      subtitle: "Pay by cash or scan QR at your doorstep upon arrival",
      available: isCodEligible,
      reasonCode: !isCodEligible ? "ORDER_VALUE_LIMIT" : null,
      displayMessage: !isCodEligible
        ? `Cash on Delivery is unavailable for orders exceeding ₹${codMaxLimit.toLocaleString(
            "en-IN"
          )} due to logistics security regulations`
        : null,
    });

    return {
      payableAmount,
      methods,
      recommendedRail: walletBalance >= payableAmount ? "WALLET" : "UPI",
    };
  }
}

export const paymentEligibilityService = new PaymentEligibilityService();
export default paymentEligibilityService;
