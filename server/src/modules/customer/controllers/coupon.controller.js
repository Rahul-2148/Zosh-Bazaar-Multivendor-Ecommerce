import couponService from "../services/coupon.service.js";

class CouponController {
  async createCoupon(req, res, next) {
    try {
      const coupon = await couponService.createCoupon(req.body);
      return res.status(201).json({
        coupon: {
          _id: coupon._id,
          couponCode: coupon.code,
          discount: coupon.discountPercentage,
          validityStartDate: coupon.validityStartDate,
          validityEndDate: coupon.validityEndDate,
          minimumOrderValue: coupon.minimumOrderValue,
        },
        message: "Coupon created successfully",
        error: false,
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllCoupons(req, res, next) {
    try {
      const coupons = await couponService.getAllCoupons();
      const formattedCoupons = coupons.map((c) => ({
        _id: c._id,
        couponCode: c.code,
        discount: c.discountPercentage,
        validityStartDate: c.validityStartDate,
        validityEndDate: c.validityEndDate,
        minimumOrderValue: c.minimumOrderValue,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      }));

      return res.status(200).json({
        coupons: formattedCoupons,
        error: false,
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteCoupon(req, res, next) {
    try {
      const { id } = req.params;
      const deleted = await couponService.deleteCoupon(id);
      return res.status(200).json({
        message: "Coupon deleted successfully",
        deletedCoupon: deleted,
        error: false,
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }

  async applyCoupon(req, res, next) {
    try {
      const { code } = req.body;
      const user = req.user;
      const result = await couponService.applyCoupon(code, user);
      return res.status(200).json({
        ...result,
        error: false,
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAvailableCoupons(req, res, next) {
    try {
      const now = new Date();
      const coupons = await couponService.getAllCoupons();
      const available = coupons
        .filter((c) => c.isActive && new Date(c.validityEndDate) >= now)
        .map((c) => ({
          _id: c._id,
          code: c.code,
          discountPercentage: c.discountPercentage,
          validityStartDate: c.validityStartDate,
          validityEndDate: c.validityEndDate,
          minimumOrderValue: c.minimumOrderValue,
        }));

      return res.status(200).json({
        coupons: available,
        error: false,
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new CouponController();
