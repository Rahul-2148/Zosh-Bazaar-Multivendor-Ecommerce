import { Coupon } from "../../../models/coupon.model.js";
import paymentOffersService from "./PaymentOffersService.js";

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
        : totalItemSellingPrice >= 500 || totalItemSellingPrice === 0
        ? 0
        : 40;
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
   */
  async computePricing({
    cartItems = [],
    couponCode = null,
    offerCode = null,
    rail = null,
    bankCode = null,
    cardNetwork = null,
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

    // 3. Delivery & Handling Fees
    // Free delivery above ₹499
    const deliveryFee = sellingPriceTotal >= 499 || sellingPriceTotal === 0 ? 0 : 40;
    const packagingFee = sellingPriceTotal > 0 ? 9 : 0;

    const finalPayable = Math.max(
      0,
      sellingPriceTotal - couponDiscount - offerDiscount + deliveryFee + packagingFee
    );

    return {
      mrpTotal,
      sellingPriceTotal,
      productDiscount,
      couponCode: validCouponCode,
      couponDiscount,
      offerCode: validOfferCode,
      offerDiscount,
      deliveryFee,
      packagingFee,
      finalPayable,
      totalSavings: mrpTotal - (finalPayable - deliveryFee - packagingFee),
    };
  }
}

export const paymentPricingService = new PaymentPricingService();
export default paymentPricingService;
