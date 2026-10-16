import { Coupon } from "../../../models/coupon.model.js";
import { PlatformSettings } from "../../../models/settings.model.js";
import paymentOffersService from "./PaymentOffersService.js";

const DEFAULT_FREE_SHIPPING_THRESHOLD = 999;
const DEFAULT_SHIPPING_FEE = 79;

/**
 * Server-Authoritative Pricing Engine
 * Recomputes all commercial line items against live catalog data.
 * Client-submitted payment amounts are NEVER trusted.
 */
class PaymentPricingService {
  /**
   * Deterministic synchronous authoritative calculation for pricing snapshots & audits.
   */
  calculateAuthoritativePrice({
    items = [],
    cartItems = [],
    couponDiscount = 0,
    paymentOfferDiscount = 0,
    deliveryFee = null,
    packagingFee = 19,
    freeShippingThreshold = DEFAULT_FREE_SHIPPING_THRESHOLD,
    standardDeliveryFee = DEFAULT_SHIPPING_FEE,
  }) {
    const itemList = items.length ? items : cartItems;
    let totalMrp = 0;
    let totalItemSellingPrice = 0;

    for (const item of itemList) {
      const qty = Number(item.quantity) || 1;
      const mrp = Number(item.mrpPrice || item.product?.mrpPrice || item.sellingPrice || 0);
      const sp = Number(item.sellingPrice || item.product?.sellingPrice || mrp);

      totalMrp += mrp * qty;
      totalItemSellingPrice += sp * qty;
    }

    const productDiscount = Math.max(0, totalMrp - totalItemSellingPrice);
    const resolvedDeliveryFee =
      deliveryFee !== null
        ? deliveryFee
        : totalItemSellingPrice >= freeShippingThreshold || totalItemSellingPrice === 0
        ? 0
        : standardDeliveryFee;
    const resolvedPackagingFee = totalItemSellingPrice > 0 ? packagingFee : 0;

    const payableAmount = Math.max(
      0,
      totalItemSellingPrice - couponDiscount - paymentOfferDiscount + resolvedDeliveryFee + resolvedPackagingFee
    );

    return {
      totalMrp,
      mrpTotal: totalMrp,
      totalItemSellingPrice,
      sellingPriceTotal: totalItemSellingPrice,
      productDiscount,
      couponDiscount,
      paymentOfferDiscount,
      offerDiscount: paymentOfferDiscount,
      deliveryFee: resolvedDeliveryFee,
      packagingFee: resolvedPackagingFee,
      payableAmount,
      finalPayable: payableAmount,
      totalSavings: totalMrp - (payableAmount - resolvedDeliveryFee - resolvedPackagingFee),
    };
  }

  /**
   * Compute authoritative pricing snapshot for checkout.
   * @param {Object} params
   * @param {Array<any>} params.cartItems - Cart items or orders
   * @param {string} [params.couponCode] - Applied coupon code
   * @param {string} [params.offerCode] - Applied payment method / bank offer code
   * @param {string} [params.rail] - Selected payment rail (UPI, CARD, etc.)
   * @param {string} [params.bankCode] - Selected bank code
   * @param {string} [params.cardNetwork] - Selected card network
   * @param {number|null} [params.deliveryFee] - Explicit delivery fee override if determined
   * @param {number} [params.packagingFee] - Explicit packaging fee (defaults to 0 matching cart)
   */
  async computePricing({
    cartItems = [],
    couponCode = null,
    offerCode = null,
    rail = null,
    bankCode = null,
    cardNetwork = null,
    deliveryFee = null,
    packagingFee = 0,
  }) {
    let mrpTotal = 0;
    let sellingPriceTotal = 0;

    for (const item of cartItems) {
      const qty = Number(item.quantity) || 1;
      const mrp = Number(item.mrpPrice || item.product?.mrpPrice || item.sellingPrice || 0);
      const sp = Number(item.sellingPrice || item.product?.sellingPrice || mrp);

      mrpTotal += mrp * qty;
      sellingPriceTotal += sp * qty;
    }

    const productDiscount = Math.max(0, mrpTotal - sellingPriceTotal);

    // 1. Coupon Evaluation
    let couponDiscount = 0;
    let validCouponCode = null;

    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.trim().toUpperCase(),
        isActive: true,
        validityStartDate: { $lte: new Date() },
        validityEndDate: { $gte: new Date() },
        minimumOrderValue: { $lte: sellingPriceTotal },
      });

      if (coupon) {
        couponDiscount = Math.round((sellingPriceTotal * coupon.discountPercentage) / 100);
        validCouponCode = coupon.code;
      }
    }

    const subtotalAfterCoupon = Math.max(0, sellingPriceTotal - couponDiscount);

    // 2. Payment Method / Bank Offer Evaluation
    let offerDiscount = 0;
    let validOfferCode = null;

    if (offerCode) {
      const offerResult = await paymentOffersService.evaluateOffer({
        offerCode,
        cartTotal: subtotalAfterCoupon,
        rail,
        bankCode,
        cardNetwork,
      });

      if (offerResult.valid) {
        offerDiscount = offerResult.discount;
        validOfferCode = offerResult.offer.code;
      }
    }

    // 3. Delivery Fee from Authoritative PlatformSettings
    let freeShippingThreshold = DEFAULT_FREE_SHIPPING_THRESHOLD;
    let standardDeliveryFee = DEFAULT_SHIPPING_FEE;
    try {
      if (PlatformSettings && typeof PlatformSettings.findOne === "function") {
        const platformSettings = await PlatformSettings.findOne().lean();
        if (platformSettings) {
          if (typeof platformSettings.freeShippingThreshold === "number") {
            freeShippingThreshold = platformSettings.freeShippingThreshold;
          }
          if (typeof platformSettings.shippingFee === "number") {
            standardDeliveryFee = platformSettings.shippingFee;
          }
        }
      }
    } catch {
      // Fallback safely to declared defaults if settings store is unavailable
    }

    const resolvedDeliveryFee =
      deliveryFee !== null
        ? deliveryFee
        : sellingPriceTotal >= freeShippingThreshold || sellingPriceTotal === 0
        ? 0
        : standardDeliveryFee;

    // Align with authoritative cart rules: omit packaging fee unless explicitly configured
    const resolvedPackagingFee = Number(packagingFee) || 0;

    const finalPayable = Math.max(
      0,
      sellingPriceTotal - couponDiscount - offerDiscount + resolvedDeliveryFee + resolvedPackagingFee
    );

    return {
      mrpTotal,
      sellingPriceTotal,
      productDiscount,
      couponCode: validCouponCode,
      couponDiscount,
      offerCode: validOfferCode,
      offerDiscount,
      deliveryFee: resolvedDeliveryFee,
      packagingFee: resolvedPackagingFee,
      finalPayable,
      totalSavings: mrpTotal - (finalPayable - resolvedDeliveryFee - resolvedPackagingFee),
    };
  }
}

export const paymentPricingService = new PaymentPricingService();
export default paymentPricingService;
