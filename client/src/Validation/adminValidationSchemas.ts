import * as Yup from "Yup";

export const CouponFormValidationSchema = Yup.object().shape({
  // shape is used to validate the shape of the object
  code: Yup.string().required("Coupon Code is required"),
  discountPercentage: Yup.number().required("Discount percentage is required"),
  validityStartDate: Yup.date().required("Validity start date is required"),
  validityEndDate: Yup.date().required("Validity end date is required"),
  minimumOrderValue: Yup.number().required("Minimum order value is required"),
});

export const CreateDealFormValidationSchema = Yup.object().shape({
  discount: Yup.number().required("Discount is required"),
  category: Yup.string().required("Category is required"),
});
