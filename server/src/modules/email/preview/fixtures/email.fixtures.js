import { brandConfig } from "../../config/brand.config.js";

export const sampleCustomer = {
  name: "Priya Sharma",
  email: "priya.sharma@example.com",
  phone: "+91 98765 43210",
  memberSince: "January 2024",
};

export const sampleAddress = {
  name: "Priya Sharma",
  addressLine1: "Flat 402, Lotus Grand Residences",
  addressLine2: "14th Cross, Indiranagar",
  city: "Bengaluru",
  state: "Karnataka",
  postalCode: "560038",
  phone: "+91 98765 43210",
  type: "Home",
};

export const sampleOrderItems = [
  {
    title: "Sony WH-1000XM5 Wireless Noise-Cancelling Headphones",
    variant: "Midnight Black / Over-Ear",
    sku: "SONY-WH1000XM5-BLK",
    quantity: 1,
    unitPrice: 26990,
    price: 26990,
    originalPrice: 29990,
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&fit=crop",
    sellerName: "Apex Electronics Hub",
  },
  {
    title: "Spigen Rugged Armor Case for Sony WH-1000XM5",
    variant: "Matte Black",
    sku: "SPG-RUG-XM5-BLK",
    quantity: 1,
    unitPrice: 1499,
    price: 1499,
    originalPrice: 1999,
    imageUrl: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=200&fit=crop",
    sellerName: "Gadget Shield Official",
  },
  {
    title: "USB-C to USB-C Fast Charging Braided Cable (2m, 100W)",
    variant: "Space Grey / 2 Meters",
    sku: "CBL-100W-2M-GRY",
    quantity: 2,
    unitPrice: 499,
    price: 998,
    originalPrice: 799,
    imageUrl: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=200&fit=crop",
    sellerName: "PowerLink Tech",
  },
];

export const sampleOrder = {
  orderId: "ZB-892410-IN",
  orderDate: "14 Sep 2026, 09:30 AM",
  createdAt: "14 Sep 2026, 09:30 AM",
  status: "CONFIRMED",
  paymentMethod: "UPI (Google Pay)",
  paymentStatus: "PAID",
  items: sampleOrderItems,
  itemCount: 4,
  currency: "INR",
  subtotal: 29487,
  discount: 1500,
  couponCode: "FESTIVE1500",
  couponDiscount: 1500,
  shippingFee: 0,
  shippingCost: 0,
  tax: 2520,
  total: 30507,
  totalAmount: 30507,
  deliveryAddress: sampleAddress,
  estimatedDelivery: "Wednesday, 17 Sep 2026",
  carrier: "BlueDart Express",
  trackingNumber: "BD992817462IN",
  trackingUrl: "https://zoshbazaar.com/track/BD992817462IN",
  orderUrl: "https://zoshbazaar.com/account/orders/ZB-892410-IN",
  invoiceUrl: "https://zoshbazaar.com/account/orders/ZB-892410-IN/invoice",
  sellerGroups: [
    {
      sellerName: "Apex Electronics Hub",
      estimatedDispatch: "14 Sep 2026",
      items: [sampleOrderItems[0]],
    },
    {
      sellerName: "Gadget Shield Official",
      estimatedDispatch: "15 Sep 2026",
      items: [sampleOrderItems[1]],
    },
  ],
};

export const sampleSeller = {
  storeName: "Apex Electronics Hub",
  sellerName: "Rajesh Kulkarni",
  email: "rajesh.apex@example.com",
  phone: "+91 99887 76655",
  sellerId: "SEL-9042",
  dashboardUrl: "https://seller.zoshbazaar.com/dashboard",
  status: "ACTIVE",
  rating: 4.8,
  totalOrders: 1420,
  joinedDate: "12 August 2024",
};

export const sampleDeliveryPartner = {
  partnerName: "Vikram Chauhan",
  email: "vikram.courier@example.com",
  phone: "+91 91234 56789",
  partnerId: "DP-4821",
  zone: "Koramangala & Indiranagar Hub",
  hubName: "Central Bengaluru Sort Center",
  completedDeliveries: 840,
  rating: 4.9,
};

export const sampleAdmin = {
  adminName: "Sneha Mukherjee",
  email: "sneha.admin@zoshbazaar.com",
  role: "PLATFORM_SUPER_ADMIN",
  dashboardUrl: "https://admin.zoshbazaar.com",
};

/**
 * Fixture repository mapped by template category.
 */
export const defaultCategoryFixtures = {
  auth: {
    name: sampleCustomer.name,
    email: sampleCustomer.email,
    otp: "649102",
    expiresInMinutes: 10,
    validityMinutes: 10,
    purpose: "Login Authentication",
    device: "Chrome 128 on macOS Sequoia",
    location: "Bengaluru, Karnataka, India",
    ipAddress: "157.48.192.34",
    time: "14 Sep 2026, 09:30 AM",
    verificationUrl: "https://zoshbazaar.com/auth/verify?token=v_abc123xyz",
    resetUrl: "https://zoshbazaar.com/auth/reset-password?token=rst_789456",
    actionUrl: "https://zoshbazaar.com/auth/verify",
    retentionDays: 30,
    cancellationDeadline: "14 Oct 2026, 11:59 PM",
  },
  order: {
    customerName: sampleCustomer.name,
    customer: sampleCustomer,
    order: sampleOrder,
    items: sampleOrderItems,
    orderId: sampleOrder.orderId,
    orderDate: sampleOrder.orderDate,
    deliveryAddress: sampleAddress,
    shippingAddress: sampleAddress,
    total: sampleOrder.total,
    subtotal: sampleOrder.subtotal,
    discount: sampleOrder.discount,
    tax: sampleOrder.tax,
    shippingFee: 0,
    totalAmount: sampleOrder.total,
    paymentMethod: sampleOrder.paymentMethod,
    estimatedDelivery: sampleOrder.estimatedDelivery,
    carrier: sampleOrder.carrier,
    trackingNumber: sampleOrder.trackingNumber,
    trackingUrl: sampleOrder.trackingUrl,
    orderUrl: sampleOrder.orderUrl,
    invoiceUrl: sampleOrder.invoiceUrl,
    cancellationReason: "Requested by customer due to delivery date clash",
    refundAmount: 30507,
    timelineStep: "SHIPPED",
  },
  payment: {
    customerName: sampleCustomer.name,
    orderId: sampleOrder.orderId,
    amount: sampleOrder.total,
    paymentMethod: "UPI (Google Pay)",
    transactionId: "TXN_UPI_99482017462",
    timestamp: "14 Sep 2026, 09:30 AM",
    failureReason: "Payment processing timeout at issuing bank",
    retryUrl: "https://zoshbazaar.com/checkout/retry?order=ZB-892410-IN",
    refundId: "REF_8492019",
    refundAmount: 26990,
    refundMethod: "Original Payment Source (Bank Account ending in 4102)",
    estimatedDays: "2-4 business days",
  },
  return: {
    customerName: sampleCustomer.name,
    orderId: sampleOrder.orderId,
    itemTitle: "Sony WH-1000XM5 Wireless Noise-Cancelling Headphones",
    returnId: "RET-77491",
    returnReason: "Ordered wrong color variant",
    pickupDate: "Tuesday, 16 Sep 2026 (10:00 AM - 01:00 PM)",
    pickupAddress: sampleAddress,
    refundAmount: 26990,
    status: "PICKUP_SCHEDULED",
    resolution: "REFUND_TO_SOURCE",
  },
  engagement: {
    customerName: sampleCustomer.name,
    productTitle: "Sony WH-1000XM5 Wireless Noise-Cancelling Headphones",
    productImage: sampleOrderItems[0].imageUrl,
    productUrl: "https://zoshbazaar.com/products/sony-wh1000xm5",
    currentPrice: 24990,
    previousPrice: 26990,
    savings: 2000,
    reviewUrl: "https://zoshbazaar.com/reviews/new?product=SONY-WH1000XM5-BLK",
  },
  seller: {
    sellerName: sampleSeller.sellerName,
    storeName: sampleSeller.storeName,
    sellerId: sampleSeller.sellerId,
    dashboardUrl: sampleSeller.dashboardUrl,
    orderId: sampleOrder.orderId,
    items: [sampleOrderItems[0]],
    actionRequired: "Confirm & Pack order before dispatch deadline",
    dispatchDeadline: "15 Sep 2026, 04:00 PM",
    sku: "SONY-WH1000XM5-BLK",
    productTitle: "Sony WH-1000XM5 Wireless Noise-Cancelling Headphones",
    currentStock: 3,
    threshold: 10,
    payoutId: "PAYOUT_SEP_2026_01",
    payoutAmount: 184520,
    bankAccount: "HDFC Bank (A/C ending in 8831)",
    payoutDate: "15 Sep 2026",
    slaBreachRate: "1.2%",
    cancellationRate: "0.8%",
  },
  admin: {
    adminName: sampleAdmin.adminName,
    severity: "HIGH",
    incidentId: "INC-88912",
    affectedModule: "Payment Gateway Service (Razorpay UPI)",
    status: "INVESTIGATING",
    impact: "18% failure rate spike on UPI payments in the last 15 minutes",
    recommendedAction: "Verify webhook listeners and failover to Cashfree backup route",
    timestamp: "14 Sep 2026, 09:32 AM",
    dashboardUrl: "https://admin.zoshbazaar.com/incidents/INC-88912",
    sellerName: sampleSeller.storeName,
    sellerId: sampleSeller.sellerId,
    orderId: sampleOrder.orderId,
  },
  logistics: {
    shipmentId: "SHP-491028",
    orderId: sampleOrder.orderId,
    originHub: "Bhiwandi Fulfillment Hub, Mumbai",
    destinationHub: "Indiranagar Hub, Bengaluru",
    carrier: "BlueDart Express",
    status: "IN_TRANSIT",
    eta: "17 Sep 2026, 02:00 PM",
    exceptionReason: "Flight cargo rescheduling due to adverse weather at BOM",
    resolution: "Rerouted via secondary air courier connection",
    escalationUrl: "https://logistics.zoshbazaar.com/shipments/SHP-491028",
  },
  deliveryPartner: {
    partnerName: sampleDeliveryPartner.partnerName,
    partnerId: sampleDeliveryPartner.partnerId,
    hubName: sampleDeliveryPartner.hubName,
    assignedShipmentId: "SHP-491028",
    orderId: sampleOrder.orderId,
    customerName: sampleCustomer.name,
    customerPhone: "+91 98765 43210",
    deliveryAddress: sampleAddress,
    deliveryWindow: "Today, 11:00 AM - 01:00 PM",
    packageCount: 1,
    payoutAmount: 4850,
    payoutPeriod: "Week 37 (07 Sep - 13 Sep 2026)",
    incentiveAmount: 650,
    totalDeliveries: 94,
  },
  system: {
    serviceName: "Redis Cache Cluster (Order Lock)",
    environment: "Production (ap-south-1)",
    alertLevel: "CRITICAL",
    timestamp: "14 Sep 2026, 09:30:15 UTC",
    metrics: "Memory utilization exceeded 92% threshold",
    digestTitle: "Zosh Bazaar Platform Daily Operational Digest",
    period: "Sunday, 13 September 2026",
    totalOrdersToday: 4821,
    gmvToday: "₹ 1,42,85,900",
    deliveredOrders: 4210,
    returnRate: "2.1%",
  },
};

/**
 * Resolves fixture payload for any template key.
 */
export function getFixtureForTemplate(templateKey) {
  const [role, category] = templateKey.split(".");

  let fixture = {};

  if (role === "customer") {
    if (category === "auth") fixture = defaultCategoryFixtures.auth;
    else if (category === "order") fixture = defaultCategoryFixtures.order;
    else if (category === "payment") fixture = defaultCategoryFixtures.payment;
    else if (category === "return") fixture = defaultCategoryFixtures.return;
    else if (category === "engagement") fixture = defaultCategoryFixtures.engagement;
    else fixture = defaultCategoryFixtures.order;
  } else if (role === "seller") {
    fixture = {
      ...defaultCategoryFixtures.seller,
      ...defaultCategoryFixtures.order,
    };
  } else if (role === "admin") {
    fixture = {
      ...defaultCategoryFixtures.admin,
      ...defaultCategoryFixtures.order,
    };
  } else if (role === "logistics") {
    fixture = {
      ...defaultCategoryFixtures.logistics,
      ...defaultCategoryFixtures.order,
    };
  } else if (role === "deliveryPartner") {
    fixture = {
      ...defaultCategoryFixtures.deliveryPartner,
      ...defaultCategoryFixtures.order,
    };
  } else if (role === "system") {
    fixture = {
      ...defaultCategoryFixtures.system,
    };
  } else {
    fixture = {
      ...defaultCategoryFixtures.order,
    };
  }

  return {
    ...fixture,
    brand: brandConfig,
  };
}
