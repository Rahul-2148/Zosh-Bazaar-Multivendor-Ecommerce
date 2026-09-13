export interface Seller {
  _id: string;
  sellerName: string;
  email: string;
  mobile?: string;
  role?: string;
  businessDetails?: {
    businessName?: string;
    businessEmail?: string;
    businessMobile?: string;
    businessAddress?: string;
    logo?: string;
    banner?: string;
  };
  bankDetails?: any;
  pickupAddress?: any;
  GSTIN?: string;
  accountStatus?: string;
  rating?: number;
  reviewsCount?: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}
