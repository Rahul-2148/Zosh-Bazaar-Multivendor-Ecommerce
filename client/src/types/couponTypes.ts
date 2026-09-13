export interface ICoupon {
  _id: string;
  code: string;
  discountPercentage: number;
  validityStartDate: string;
  validityEndDate: string;
  minimumOrderValue: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}