// client/src/types/adminTypes/adminCouponTypes.ts

// Coupon entity type
export interface ICoupon {
    _id: string;
    couponCode: string;
    discount: number;
    validityStartDate: Date;
    validityEndDate: Date;
    minimumOrderValue: number;
    // isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    __v: number;
}

// Redux state type
export interface AdminCouponState {
    coupons: ICoupon[];
    loading: boolean;
    error: string | null;
    message: string | null;
}

// Api response types
export interface FetchCouponsResponse {
    error: boolean;
    success: boolean;
    message?: string;
    coupons: ICoupon[];
}

export interface CreateCouponResponse {
    error: boolean;
    success: boolean;
    message?: string;
    coupon: ICoupon;
}

export interface UpdateCouponResponse {
    error: boolean;
    success: boolean;
    message?: string;
    coupon: ICoupon;
}

export interface DeleteCouponResponse {
    error: boolean;
    success: boolean;
    message: string;
    deletedCoupon: ICoupon;
}