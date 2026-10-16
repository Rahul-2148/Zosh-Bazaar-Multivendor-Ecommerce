import { PaymentOffer } from "../models/paymentOffer.model.js";

export const KNOWN_DEFAULT_DEMO_CODES = [
  "HDFC_INSTANT_10",
  "ICICI_NETBANK_100",
  "UPI_CASHBACK_50",
  "RUPAY_FESTIVE_15",
];

/**
 * Payment Offers & Instant Discount Engine
 * Evaluates payment-method specific promotions, bank discounts, and cashback rules.
 */
class PaymentOffersService {
  /**
   * Explicit development/test-only seeding utility.
   * Hard production guard prevents synthetic bank/UPI offers in production environments.
   */
  async seedDevelopmentDemoOffers() {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Synthetic payment offer seeding is strictly prohibited in production.");
    }
    const count = await PaymentOffer.countDocuments();
    if (count > 0) return;

    // Default development/demo offers for local test suites only
    const defaultOffers = [
      {
        code: "HDFC_INSTANT_10",
        title: "10% Instant Discount on HDFC Bank Cards",
        description: "Get 10% off up to ₹500 on orders above ₹1,999",
        discountType: "PERCENTAGE",
        discountValue: 10,
        maxDiscount: 500,
        minOrderValue: 1999,
        applicableRail: "CARD",
        applicableBanks: ["HDFC"],
        applicableCardNetworks: ["VISA", "MASTERCARD"],
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: true,
        isDevelopmentOnly: true,
        isDemo: true,
      },
      {
        code: "ICICI_NETBANK_100",
        title: "₹100 Flat Off via ICICI Net Banking",
        description: "Save ₹100 instantly on payments above ₹999 using ICICI Net Banking",
        discountType: "FLAT",
        discountValue: 100,
        maxDiscount: 100,
        minOrderValue: 999,
        applicableRail: "NETBANKING",
        applicableBanks: ["ICICI"],
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: true,
        isDevelopmentOnly: true,
        isDemo: true,
      },
      {
        code: "UPI_CASHBACK_50",
        title: "Flat ₹50 Instant Discount with Any UPI App",
        description: "Pay using Google Pay, PhonePe, Paytm, or BHIM and save ₹50 on ₹499+",
        discountType: "FLAT",
        discountValue: 50,
        maxDiscount: 50,
        minOrderValue: 499,
        applicableRail: "UPI",
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: true,
        isDevelopmentOnly: true,
        isDemo: true,
      },
      {
        code: "RUPAY_FESTIVE_15",
        title: "15% Off with RuPay Platinum & Select Debit Cards",
        description: "Exclusive 15% discount up to ₹350 on all RuPay cards",
        discountType: "PERCENTAGE",
        discountValue: 15,
        maxDiscount: 350,
        minOrderValue: 1499,
        applicableRail: "CARD",
        applicableCardNetworks: ["RUPAY"],
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: true,
        isDevelopmentOnly: true,
        isDemo: true,
      },
    ];

    await PaymentOffer.insertMany(defaultOffers);
  }

  /**
   * Safe migration helper for tagging existing legacy unflagged demo offers.
   * Can be executed via an admin/migration script; never called automatically on read paths.
   */
  async tagLegacyDemoOffers() {
    return await PaymentOffer.updateMany(
      {
        code: { $in: KNOWN_DEFAULT_DEMO_CODES },
        $or: [
          { isDevelopmentOnly: { $exists: false } },
          { isDemo: { $exists: false } },
          { isDevelopmentOnly: false },
          { isDemo: false },
        ],
      },
      {
        $set: {
          isDevelopmentOnly: true,
          isDemo: true,
        },
      }
    );
  }

  /**
   * Get all active offers applicable to a checkout cart total and rail.
   * Public GET / read operations do not seed or mutate promotional data.
   * Excludes known demo offers even if legacy documents lack isDevelopmentOnly/isDemo.
   */
  async getActiveOffers({
    cartTotal = 0,
    rail = null,
    bankCode = null,
    cardNetwork = null,
    includeDemo = false,
  } = {}) {
    // In production, demo offers are never permitted under any circumstances
    const safeIncludeDemo =
      process.env.NODE_ENV === "production" ? false : Boolean(includeDemo);

    const now = new Date();
    const query = {
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    };

    if (!safeIncludeDemo) {
      // Explicitly exclude known default demo codes to protect legacy documents missing flags
      query.code = { $nin: KNOWN_DEFAULT_DEMO_CODES };
      query.isDevelopmentOnly = { $ne: true };
      query.isDemo = { $ne: true };
    }

    if (cartTotal > 0) {
      query.minOrderValue = { $lte: cartTotal };
    }

    if (rail && rail !== "ALL") {
      query.$or = [{ applicableRail: "ALL" }, { applicableRail: rail }];
    }

    const offers = await PaymentOffer.find(query).lean();

    return offers.filter((offer) => {
      if (!safeIncludeDemo) {
        if (KNOWN_DEFAULT_DEMO_CODES.includes(offer.code)) return false;
        if (offer.isDevelopmentOnly === true || offer.isDemo === true) return false;
      }
      if (bankCode && offer.applicableBanks?.length > 0) {
        if (!offer.applicableBanks.includes(bankCode.toUpperCase())) return false;
      }
      if (cardNetwork && offer.applicableCardNetworks?.length > 0) {
        if (!offer.applicableCardNetworks.includes(cardNetwork.toUpperCase())) return false;
      }
      return true;
    });
  }

  /**
   * Authoritatively validate and compute offer discount.
   * Enforces isActive, date validity (startDate <= now <= endDate), minOrderValue,
   * payment rail, bank, card network, and demo protection.
   */
  async evaluateOffer({
    offerCode,
    cartTotal,
    rail,
    bankCode,
    cardNetwork,
    allowDemo = false,
  }) {
    if (!offerCode || typeof offerCode !== "string") {
      return { valid: false, discount: 0, reason: "Payment offer code is required" };
    }

    const normalizedCode = offerCode.trim().toUpperCase();

    // In production, demo offer redemption is strictly forbidden under any circumstances
    const safeAllowDemo =
      process.env.NODE_ENV === "production" ? false : Boolean(allowDemo);

    // Reject demo codes immediately if demo redemption is not permitted
    if (!safeAllowDemo && KNOWN_DEFAULT_DEMO_CODES.includes(normalizedCode)) {
      return { valid: false, discount: 0, reason: "Demo payment offer cannot be redeemed" };
    }

    const offer = await PaymentOffer.findOne({ code: normalizedCode });

    if (!offer || !offer.isActive) {
      return { valid: false, discount: 0, reason: "Invalid or inactive payment offer code" };
    }

    if (!safeAllowDemo && (offer.isDevelopmentOnly === true || offer.isDemo === true || KNOWN_DEFAULT_DEMO_CODES.includes(offer.code))) {
      return { valid: false, discount: 0, reason: "Demo payment offer cannot be redeemed" };
    }

    // Require valid, present start and end dates and enforce startDate <= now <= endDate
    if (!offer.startDate) {
      return { valid: false, discount: 0, reason: "Payment offer start date is missing" };
    }
    if (!offer.endDate) {
      return { valid: false, discount: 0, reason: "Payment offer end date is missing" };
    }

    const startDate = new Date(offer.startDate);
    const endDate = new Date(offer.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return { valid: false, discount: 0, reason: "Payment offer has invalid validity dates" };
    }

    const now = new Date();
    if (startDate > now) {
      return { valid: false, discount: 0, reason: "Payment offer has not started yet" };
    }
    if (endDate < now) {
      return { valid: false, discount: 0, reason: "Payment offer has expired" };
    }

    if (cartTotal < offer.minOrderValue) {
      return {
        valid: false,
        discount: 0,
        reason: `Offer requires minimum order value of ₹${offer.minOrderValue}`,
      };
    }

    if (offer.applicableRail !== "ALL" && rail && offer.applicableRail !== rail) {
      return {
        valid: false,
        discount: 0,
        reason: `Offer is only applicable for ${offer.applicableRail} payments`,
      };
    }

    if (bankCode && offer.applicableBanks?.length > 0) {
      if (!offer.applicableBanks.includes(bankCode.toUpperCase())) {
        return { valid: false, discount: 0, reason: `Offer not valid for bank ${bankCode}` };
      }
    }

    if (cardNetwork && offer.applicableCardNetworks?.length > 0) {
      if (!offer.applicableCardNetworks.includes(cardNetwork.toUpperCase())) {
        return { valid: false, discount: 0, reason: `Offer not valid for card network ${cardNetwork}` };
      }
    }

    let discount = 0;
    if (offer.discountType === "PERCENTAGE") {
      discount = Math.round((cartTotal * offer.discountValue) / 100);
      if (offer.maxDiscount && discount > offer.maxDiscount) {
        discount = offer.maxDiscount;
      }
    } else {
      discount = offer.discountValue;
    }

    // Ensure discount does not exceed cart total
    discount = Math.min(discount, cartTotal);

    return {
      valid: true,
      discount,
      offer: {
        code: offer.code,
        title: offer.title,
        description: offer.description,
      },
    };
  }
}

export const paymentOffersService = new PaymentOffersService();
export default paymentOffersService;
