export interface AdminUser {
  _id: string;
  fullName: string;
  email: string;
  mobile?: string;
  role: "ROLE_ADMIN" | "ROLE_CUSTOMER" | "ROLE_SELLER";
  createdAt?: string;
}

export interface DashboardSummary {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalSellers: number;
  pendingSellers: number;
  activeSellers: number;
  totalProducts: number;
  totalTransactions: number;
  recentOrders: OrderItem[];
  lowStockProducts: ProductItem[];
}

export interface CategoryAttribute {
  _id?: string;
  name: string;
  key: string;
  type: "SELECT" | "TEXT" | "NUMBER" | "MEASUREMENT" | "BOOLEAN";
  isVariant: boolean;
  options: string[];
  allowedUnits: string[];
  required: boolean;
}

export interface CategoryItem {
  _id: string;
  name: string;
  categoryId: string;
  description?: string;
  image?: string;
  parentCategory?: {
    _id: string;
    name: string;
    categoryId: string;
    level: number;
  } | null;
  level: number;
  attributes: CategoryAttribute[];
  isActive: boolean;
  createdAt?: string;
}

export interface CategoryTreeItem extends CategoryItem {
  children?: CategoryTreeItem[];
}

export interface BrandItem {
  _id: string;
  name: string;
  slug: string;
  logo: string;
  description?: string;
  website?: string;
  isActive: boolean;
  createdAt?: string;
}

export interface ProductVariant {
  _id?: string;
  sku: string;
  title: string;
  attributes: Array<{
    name: string;
    key: string;
    value: string | number;
    unit?: string;
  }>;
  mrpPrice: number;
  sellingPrice: number;
  discountPercent?: number;
  countInStock: number;
  reservedStock?: number;
  images: string[];
  weight?: { value: number; unit: string };
  dimensions?: { length: number; width: number; height: number; unit: string };
  barcode?: string;
  status: "ACTIVE" | "INACTIVE";
}

export interface ProductSpecification {
  name: string;
  key: string;
  value: string | number | boolean;
  unit?: string;
}

export interface ProductItem {
  _id: string;
  title: string;
  description?: string;
  sellingPrice: number;
  mrpPrice?: number;
  discountPercent?: number;
  countInStock: number;
  images: string[];
  brand?: string;
  hasVariants?: boolean;
  attributeDefinitions?: Array<{
    name: string;
    key: string;
    isVariant: boolean;
    options: string[];
  }>;
  variants?: ProductVariant[];
  specifications?: ProductSpecification[];
  measurement?: { value: number; unit: string };
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  ratings?: { average: number; count: number };
  seller?: {
    _id: string;
    sellerName: string;
  };
  category?: {
    _id: string;
    name: string;
    categoryId: string;
  };
  tags?: string[];
  createdAt?: string;
}

export interface SellerItem {
  _id: string;
  sellerName: string;
  email: string;
  mobile: string;
  accountStatus: "PENDING_VERIFICATION" | "ACTIVE" | "SUSPENDED" | "DEACTIVATED" | "BANNED";
  gstin?: string;
  role: string;
  businessDetails?: {
    businessName: string;
    businessEmail: string;
    businessMobile: string;
    businessAddress: string;
    logo?: string;
    banner?: string;
  };
  bankDetails?: {
    accountNumber: string;
    ifscCode: string;
    accountHolderName: string;
  };
  pickupAddress?: {
    address: string;
    city: string;
    state: string;
    pincode: number;
    locality?: string;
    mobile?: string;
  };
  createdAt?: string;
}

export interface OrderItem {
  _id: string;
  orderId?: string;
  user: {
    _id: string;
    fullName: string;
    email: string;
    mobile?: string;
  };
  seller: {
    _id: string;
    sellerName: string;
    email: string;
    businessDetails?: {
      businessName: string;
    };
  };
  orderItems: Array<{
    _id: string;
    product?: {
      _id: string;
      title: string;
      images: string[];
      sellingPrice: number;
      brand?: string;
    };
    productTitle?: string;
    productImage?: string;
    brand?: string;
    sku?: string;
    variantTitle?: string;
    selectedAttributes?: Array<{
      name: string;
      key: string;
      value: string | number;
      unit?: string;
    }>;
    quantity: number;
    sellingPrice: number;
    mrpPrice?: number;
  }>;
  shippingAddress?: {
    name: string;
    locality: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    mobile: string;
  };
  totalSellingPrice: number;
  totalMrpPrice?: number;
  totalItems: number;
  orderStatus:
    | "PENDING"
    | "CONFIRMED"
    | "PROCESSING"
    | "PACKED"
    | "SHIPPED"
    | "OUT_FOR_DELIVERY"
    | "DELIVERED"
    | "CANCELLED"
    | "RETURN_REQUESTED"
    | "RETURNED"
    | "REFUNDED"
    | "FAILED";
  paymentStatus: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  statusHistory?: Array<{
    status: string;
    timestamp: string;
    note?: string;
    updatedBy?: string;
  }>;
  orderDate: string;
  createdAt: string;
}

export interface CustomerItem {
  _id: string;
  fullName: string;
  email: string;
  mobile?: string;
  role: string;
  createdAt: string;
}

export interface ReviewItem {
  _id: string;
  user: {
    _id: string;
    fullName: string;
    email?: string;
  };
  product: {
    _id: string;
    title: string;
    images?: string[];
    brand?: string;
  };
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
  verifiedPurchase: boolean;
  status: "APPROVED" | "PENDING" | "REJECTED";
  createdAt: string;
}

export interface PlatformSettings {
  storeName: string;
  supportEmail: string;
  supportPhone: string;
  currencySymbol: string;
  currencyCode: string;
  shippingFee: number;
  freeShippingThreshold: number;
  taxRatePercent: number;
  announcementBanner: string;
}

export interface CouponItem {
  _id: string;
  code: string;
  discountPercentage: number;
  validityStartDate: string;
  validityEndDate: string;
  minimumOrderValue: number;
  isActive: boolean;
  createdAt?: string;
}

export interface DealItem {
  _id: string;
  discount: number;
  category: {
    _id: string;
    name: string;
    image: string;
    categoryId: string;
  };
  createdAt?: string;
}

export interface HomeCategoryItem {
  _id: string;
  name: string;
  image: string;
  categoryId: string;
  section: "GRID" | "SHOP_BY_CATEGORIES" | "ELECTRIC_CATEGORIES" | "DEALS";
}

export interface TransactionItem {
  _id: string;
  customer: {
    _id: string;
    fullName: string;
    email: string;
  };
  seller: {
    _id: string;
    sellerName: string;
    email: string;
  };
  order: {
    _id: string;
    totalSellingPrice: number;
    orderStatus: string;
  };
  date: string;
}
