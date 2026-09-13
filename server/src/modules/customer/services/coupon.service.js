import { Coupon } from "../../../models/coupon.model.js";
import { Cart } from "../../../models/cart.model.js";
import CartService from "./cart.service.js";

class CouponService {
  async createCoupon(couponData) {
    const existingCoupon = await Coupon.findOne({
      code: couponData.code.toUpperCase(),
    });
    if (existingCoupon) {
      throw new Error("Coupon code already exists");
    }

    const newCoupon = new Coupon({
      code: couponData.code.toUpperCase(),
      discountPercentage: couponData.discountPercentage || couponData.discount,
      validityStartDate: new Date(couponData.validityStartDate || Date.now()),
      validityEndDate: new Date(couponData.validityEndDate),
      minimumOrderValue: couponData.minimumOrderValue || 0,
    });

    return await newCoupon.save();
  }

  async getAllCoupons() {
    return await Coupon.find().sort({ createdAt: -1 });
  }

  async getCouponById(id) {
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      throw new Error("Coupon not found");
    }
    return coupon;
  }

  async deleteCoupon(id) {
    const deletedCoupon = await Coupon.findByIdAndDelete(id);
    if (!deletedCoupon) {
      throw new Error("Coupon not found");
    }
    return deletedCoupon;
  }

  async applyCoupon(code, user) {
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon) {
      throw new Error("Invalid coupon code");
    }

    const now = new Date();
    if (coupon.validityStartDate && now < new Date(coupon.validityStartDate)) {
      throw new Error("Coupon is not valid yet");
    }

    if (coupon.validityEndDate && now > new Date(coupon.validityEndDate)) {
      throw new Error("Coupon has expired");
    }

    const cart = await CartService.findUserCart(user);

    if (cart.totalSellingPrice < coupon.minimumOrderValue) {
      throw new Error(
        `Minimum order value to apply this coupon is ₹${coupon.minimumOrderValue}`
      );
    }

    const discountAmount = Math.round(
      (cart.totalSellingPrice * coupon.discountPercentage) / 100
    );

    await Cart.findByIdAndUpdate(
      cart._id,
      {
        couponCode: coupon.code,
        couponPrice: discountAmount,
        totalSellingPrice: cart.totalSellingPrice - discountAmount,
      },
      { new: true }
    );

    const refreshedCart = await CartService.findUserCart(user);

    return {
      coupon: {
        code: coupon.code,
        discount: coupon.discountPercentage,
        validityStartDate: coupon.validityStartDate,
        validityEndDate: coupon.validityEndDate,
        minimumOrderValue: coupon.minimumOrderValue,
      },
      cart: refreshedCart,
      message: `Coupon '${coupon.code}' applied! You saved ₹${discountAmount}`,
    };
  }
}

export default new CouponService();
