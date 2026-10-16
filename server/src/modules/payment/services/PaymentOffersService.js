import { PaymentOffer } from "../models/paymentOffer.model.js";

/**
 * Payment Offers & Instant Discount Engine
 * Evaluates payment-method specific promotions, bank discounts, and cashback rules.
 */
class PaymentOffersService {
  async seedDefaultOffersIfEmpty() {
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
        isActive: true,
        isDevelopmentOnly: true,
        isDemo: true,
      },
    ];

    await PaymentOffer.insertMany(defaultOffers);
  }

  /**
   * Get all active offers applicable to a checkout cart total and rail.
   * Public GET / read operations do not seed or mutate promotional data.
   */
  async getActiveOffers({
    cartTotal = 0,
    rail = null,
    bankCode = null,
    cardNetwork = null,
    includeDemo = false,
  } = {}) {
    const query = {
      isActive: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
    };

    if (!includeDemo) {
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
   */
  async evaluateOffer({
    offerCode,
    cartTotal,
    rail,
    bankCode,
    cardNetwork,
    allowDemo = false,
  }) {
    if (!offerCode) return { valid: false, discount: 0, offer: null };

    const offerQuery = {
      code: offerCode.toUpperCase(),
      isActive: true,
    };

    if (!allowDemo) {
      offerQuery.isDevelopmentOnly = { $ne: true };
      offerQuery.isDemo = { $ne: true };
    }

    const offer = await PaymentOffer.findOne(offerQuery);

    if (!offer) {
      return { valid: false, discount: 0, reason: "Invalid or expired payment offer code" };
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
