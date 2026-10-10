/**
 * ZOSH BAZAAR — OPENAPI 3.1 REUSABLE COMPONENTS
 * Authoritative schemas, security schemes, headers, parameters, and responses.
 */

export const securitySchemes = {
  BearerAuth: {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
    description: "Standard JSON Web Token passed in `Authorization: Bearer <token>`. Used by Customer and Platform Admin identities.",
  },
  SellerAuth: {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
    description: "Seller session token issued via `/api/v1/seller/verify/otp`. Grants access to merchant catalog, orders, and settlements.",
  },
  DeliveryPartnerAuth: {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
    description: "Delivery Agent session token issued via `/api/v1/delivery-partner/auth/login`. Grants access to shift and active route stops.",
  },
  RazorpayWebhookSignature: {
    type: "apiKey",
    in: "header",
    name: "x-razorpay-signature",
    description: "HMAC-SHA256 signature calculated over raw payload buffer using webhook secret.",
  },
  IdempotencyHeader: {
    type: "apiKey",
    in: "header",
    name: "Idempotency-Key",
    description: "Unique UUID v4 to prevent duplicate state mutations during network retries.",
  },
};

export const commonParameters = {
  IdempotencyKey: {
    name: "Idempotency-Key",
    in: "header",
    required: false,
    schema: {
      type: "string",
      format: "uuid",
      example: "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    },
    description: "Client-generated unique transaction UUID to guarantee idempotent write execution.",
  },
  PageParam: {
    name: "page",
    in: "query",
    required: false,
    schema: {
      type: "integer",
      minimum: 1,
      default: 1,
    },
    description: "1-based page index for pagination.",
  },
  LimitParam: {
    name: "limit",
    in: "query",
    required: false,
    schema: {
      type: "integer",
      minimum: 1,
      maximum: 100,
      default: 20,
    },
    description: "Maximum number of items to return per page.",
  },
  SearchParam: {
    name: "search",
    in: "query",
    required: false,
    schema: {
      type: "string",
      example: "running shoes",
    },
    description: "Text search filter query.",
  },
};

export const schemas = {
  Money: {
    type: "object",
    required: ["amount", "currency", "paise"],
    properties: {
      amount: {
        type: "number",
        format: "double",
        example: 1299.0,
        description: "Indian Rupee (INR) amount formatted to 2 decimal places.",
      },
      currency: {
        type: "string",
        example: "INR",
        default: "INR",
      },
      paise: {
        type: "integer",
        example: 129900,
        description: "Authoritative integer minor units (1 INR = 100 paise) preventing floating point drift.",
      },
    },
  },
  ErrorEnvelope: {
    type: "object",
    required: ["error", "success", "message"],
    properties: {
      success: {
        type: "boolean",
        example: false,
      },
      error: {
        type: "boolean",
        example: true,
      },
      code: {
        type: "string",
        example: "VALIDATION_FAILED",
        description: "Machine-readable standard error code enum.",
      },
      message: {
        type: "string",
        example: "The provided input payload is malformed or missing required fields.",
      },
      details: {
        type: "array",
        items: {
          type: "object",
        },
        description: "Specific field-level validation errors.",
      },
    },
  },
  SuccessEnvelope: {
    type: "object",
    required: ["success", "message"],
    properties: {
      success: {
        type: "boolean",
        example: true,
      },
      message: {
        type: "string",
        example: "Operation completed successfully.",
      },
      data: {
        type: "object",
        description: "Response data payload.",
      },
    },
  },
  Address: {
    type: "object",
    required: ["name", "mobile", "pinCode", "address", "city", "state"],
    properties: {
      _id: {
        type: "string",
        example: "65f2a1b9c9e77c0012a9bc41",
      },
      name: {
        type: "string",
        example: "Rahul Raj",
      },
      mobile: {
        type: "string",
        pattern: "^[6-9]\\d{9}$",
        example: "9876543210",
      },
      pinCode: {
        type: "string",
        pattern: "^\\d{6}$",
        example: "560001",
      },
      address: {
        type: "string",
        example: "Flat 402, Sunshine Heights, 12th Main Road",
      },
      city: {
        type: "string",
        example: "Bengaluru",
      },
      state: {
        type: "string",
        example: "Karnataka",
      },
      locality: {
        type: "string",
        example: "Indiranagar",
      },
      landmark: {
        type: "string",
        example: "Near Metro Station",
      },
      isDefault: {
        type: "boolean",
        default: false,
      },
    },
  },
  User: {
    type: "object",
    properties: {
      _id: {
        type: "string",
        example: "65f2a1b9c9e77c0012a9bc10",
      },
      fullName: {
        type: "string",
        example: "Priya Sharma",
      },
      email: {
        type: "string",
        format: "email",
        example: "priya.sharma@example.com",
      },
      mobile: {
        type: "string",
        example: "9876543210",
      },
      role: {
        type: "string",
        enum: ["ROLE_CUSTOMER", "ROLE_ADMIN", "ROLE_SELLER"],
        example: "ROLE_CUSTOMER",
      },
      accountStatus: {
        type: "string",
        enum: ["ACTIVE", "DEACTIVATED", "DELETION_REQUESTED", "DELETED"],
        example: "ACTIVE",
      },
      addresses: {
        type: "array",
        items: {
          $ref: "#/components/schemas/Address",
        },
      },
      createdAt: {
        type: "string",
        format: "date-time",
      },
    },
  },
  Seller: {
    type: "object",
    properties: {
      _id: {
        type: "string",
        example: "65f2a1b9c9e77c0012a9bc20",
      },
      sellerName: {
        type: "string",
        example: "Zosh Fashion Private Limited",
      },
      email: {
        type: "string",
        format: "email",
        example: "merchant@zoshbazaar.com",
      },
      mobile: {
        type: "string",
        example: "9876501234",
      },
      GSTIN: {
        type: "string",
        example: "29ABCDE1234F1Z5",
      },
      businessDetails: {
        type: "object",
        properties: {
          businessName: { type: "string", example: "Zosh Fashion" },
          businessAddress: { type: "string", example: "Plot 42, HSR Layout" },
          businessEmail: { type: "string", example: "billing@zoshfashion.com" },
        },
      },
      bankDetails: {
        type: "object",
        properties: {
          accountNumber: { type: "string", example: "987654321098" },
          ifscCode: { type: "string", example: "HDFC0001234" },
          accountHolderName: { type: "string", example: "Zosh Fashion Pvt Ltd" },
        },
      },
      accountStatus: {
        type: "string",
        enum: ["PENDING_VERIFICATION", "ACTIVE", "SUSPENDED", "BANNED", "CLOSED"],
        example: "ACTIVE",
      },
    },
  },
  ProductVariant: {
    type: "object",
    required: ["sku", "sellingPrice", "countInStock"],
    properties: {
      _id: { type: "string", example: "65f2a1b9c9e77c0012a9bc33" },
      sku: { type: "string", example: "ZB-TSHIRT-BLU-M" },
      color: { type: "string", example: "Navy Blue" },
      size: { type: "string", example: "M" },
      mrpPrice: { type: "number", example: 999 },
      sellingPrice: { type: "number", example: 499 },
      countInStock: { type: "integer", example: 45 },
      images: {
        type: "array",
        items: { type: "string", format: "uri" },
      },
    },
  },
  Product: {
    type: "object",
    required: ["title", "description", "mrpPrice", "sellingPrice", "category"],
    properties: {
      _id: { type: "string", example: "65f2a1b9c9e77c0012a9bc30" },
      title: { type: "string", example: "Men Slim Fit Cotton Casual Shirt" },
      description: { type: "string", example: "100% breathable organic cotton slim fit casual shirt." },
      mrpPrice: { type: "number", example: 1499 },
      sellingPrice: { type: "number", example: 699 },
      discountPercent: { type: "integer", example: 53 },
      quantity: { type: "integer", example: 120 },
      color: { type: "string", example: "Sky Blue" },
      images: {
        type: "array",
        items: { type: "string", format: "uri" },
      },
      category: {
        type: "string",
        example: "men_clothing",
      },
      seller: {
        $ref: "#/components/schemas/Seller",
      },
      variants: {
        type: "array",
        items: { $ref: "#/components/schemas/ProductVariant" },
      },
      numRatings: { type: "integer", example: 42 },
      ratings: { type: "number", example: 4.6 },
      status: {
        type: "string",
        enum: ["DRAFT", "ACTIVE", "ARCHIVED"],
        example: "ACTIVE",
      },
      createdAt: { type: "string", format: "date-time" },
    },
  },
  CartItem: {
    type: "object",
    properties: {
      _id: { type: "string", example: "65f2a1b9c9e77c0012a9bc51" },
      product: { $ref: "#/components/schemas/Product" },
      size: { type: "string", example: "L" },
      quantity: { type: "integer", example: 2 },
      mrpPrice: { type: "number", example: 1499 },
      sellingPrice: { type: "number", example: 699 },
    },
  },
  Cart: {
    type: "object",
    properties: {
      _id: { type: "string", example: "65f2a1b9c9e77c0012a9bc50" },
      user: { type: "string", example: "65f2a1b9c9e77c0012a9bc10" },
      cartItems: {
        type: "array",
        items: { $ref: "#/components/schemas/CartItem" },
      },
      totalMrpPrice: { type: "number", example: 2998 },
      totalSellingPrice: { type: "number", example: 1398 },
      discount: { type: "number", example: 1600 },
      couponCode: { type: "string", nullable: true, example: "FESTIVE10" },
    },
  },
  OrderItem: {
    type: "object",
    properties: {
      _id: { type: "string", example: "65f2a1b9c9e77c0012a9bc62" },
      product: { $ref: "#/components/schemas/Product" },
      size: { type: "string", example: "M" },
      quantity: { type: "integer", example: 1 },
      mrpPrice: { type: "number", example: 1499 },
      sellingPrice: { type: "number", example: 699 },
      seller: { type: "string", example: "65f2a1b9c9e77c0012a9bc20" },
    },
  },
  Order: {
    type: "object",
    properties: {
      _id: { type: "string", example: "65f2a1b9c9e77c0012a9bc60" },
      orderId: { type: "string", example: "ZB-ORD-202610-8910" },
      user: { $ref: "#/components/schemas/User" },
      seller: { type: "string", example: "65f2a1b9c9e77c0012a9bc20" },
      orderItems: {
        type: "array",
        items: { $ref: "#/components/schemas/OrderItem" },
      },
      shippingAddress: { $ref: "#/components/schemas/Address" },
      paymentDetails: {
        type: "object",
        properties: {
          paymentStatus: {
            type: "string",
            enum: ["PENDING", "PROCESSING", "COMPLETED", "FAILED"],
            example: "COMPLETED",
          },
          paymentMethod: {
            type: "string",
            enum: ["RAZORPAY", "CASHFREE", "WALLET", "COD"],
            example: "RAZORPAY",
          },
          paymentId: { type: "string", example: "pay_Nw8uY1k92Xlz0a" },
        },
      },
      totalAmount: { type: "number", example: 699 },
      orderStatus: {
        type: "string",
        enum: ["PENDING", "PLACED", "CONFIRMED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "RETURN_REQUESTED", "RETURNED"],
        example: "CONFIRMED",
      },
      createdAt: { type: "string", format: "date-time" },
    },
  },
  PaymentIntent: {
    type: "object",
    required: ["intentId", "amountPaise", "currency", "status"],
    properties: {
      intentId: { type: "string", example: "pi_zb_8910abcd" },
      orderId: { type: "string", example: "ZB-ORD-202610-8910" },
      amountPaise: { type: "integer", example: 69900 },
      amountINR: { type: "number", example: 699.0 },
      currency: { type: "string", example: "INR" },
      status: {
        type: "string",
        enum: ["CREATED", "PROCESSING", "REQUIRES_ACTION", "SUCCEEDED", "FAILED", "CANCELLED"],
        example: "CREATED",
      },
      clientSecret: { type: "string", example: "sec_live_928190abcd" },
      preferredRail: {
        type: "string",
        enum: ["RAZORPAY", "CASHFREE", "JUSPAY", "WALLET", "COD"],
        example: "RAZORPAY",
      },
      providerOrderId: { type: "string", example: "order_TlumXg0cA5rqrQ" },
      expiresAt: { type: "string", format: "date-time" },
    },
  },
  Shipment: {
    type: "object",
    properties: {
      _id: { type: "string", example: "65f2a1b9c9e77c0012a9bc70" },
      trackingNumber: { type: "string", example: "ZB-TRK-7849102" },
      orderId: { type: "string", example: "ZB-ORD-202610-8910" },
      status: {
        type: "string",
        enum: ["ORDER_PLACED", "PICKED_UP", "IN_TRANSIT", "AT_HUB", "OUT_FOR_DELIVERY", "DELIVERED", "FAILED_ATTEMPT", "RETURNED_TO_ORIGIN"],
        example: "IN_TRANSIT",
      },
      originHub: { type: "string", example: "HUB-BLR-01" },
      destinationHub: { type: "string", example: "HUB-DEL-02" },
      assignedAgent: { type: "string", example: "AGT-1002" },
      recipientName: { type: "string", example: "Rahul Raj" },
      recipientPhone: { type: "string", example: "9876543210" },
      estimatedDeliveryDate: { type: "string", format: "date" },
    },
  },
  DeliveryRoute: {
    type: "object",
    properties: {
      _id: { type: "string", example: "65f2a1b9c9e77c0012a9bc80" },
      routeId: { type: "string", example: "RT-BLR-SOUTH-04" },
      agentId: { type: "string", example: "AGT-1002" },
      hubId: { type: "string", example: "HUB-BLR-01" },
      status: {
        type: "string",
        enum: ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
        example: "IN_PROGRESS",
      },
      stops: {
        type: "array",
        items: {
          type: "object",
          properties: {
            stopId: { type: "string", example: "STP-01" },
            sequence: { type: "integer", example: 1 },
            type: { type: "string", enum: ["DELIVERY", "PICKUP", "RETURN"], example: "DELIVERY" },
            status: { type: "string", enum: ["PENDING", "ARRIVED", "COMPLETED", "FAILED"], example: "COMPLETED" },
            shipmentId: { type: "string", example: "ZB-TRK-7849102" },
            address: { $ref: "#/components/schemas/Address" },
            otpRequired: { type: "boolean", example: true },
            codAmount: { type: "number", example: 0 },
          },
        },
      },
    },
  },
  Review: {
    type: "object",
    properties: {
      _id: { type: "string", example: "65f2a1b9c9e77c0012a9bc90" },
      user: { $ref: "#/components/schemas/User" },
      product: { type: "string", example: "65f2a1b9c9e77c0012a9bc30" },
      reviewText: { type: "string", example: "Fabric quality is phenomenal. Perfect slim fit stitching." },
      rating: { type: "number", minimum: 1, maximum: 5, example: 5 },
      productImages: {
        type: "array",
        items: { type: "string", format: "uri" },
      },
      status: {
        type: "string",
        enum: ["PENDING", "APPROVED", "REJECTED"],
        example: "APPROVED",
      },
      createdAt: { type: "string", format: "date-time" },
    },
  },
  Coupon: {
    type: "object",
    properties: {
      _id: { type: "string", example: "65f2a1b9c9e77c0012a9bc95" },
      code: { type: "string", example: "DIWALI20" },
      discountPercentage: { type: "number", example: 20 },
      validityStartDate: { type: "string", format: "date" },
      validityEndDate: { type: "string", format: "date" },
      minimumOrderValue: { type: "number", example: 999 },
      isActive: { type: "boolean", example: true },
    },
  },
  LedgerTransaction: {
    type: "object",
    properties: {
      _id: { type: "string", example: "65f2a1b9c9e77c0012a9bc99" },
      transactionNumber: { type: "string", example: "TXN-202610-0012" },
      journalId: { type: "string", example: "JRN-89012" },
      type: { type: "string", enum: ["ORDER_PAYOUT", "REFUND_REVERSAL", "PLATFORM_FEE", "DISPUTE_RESERVE"], example: "ORDER_PAYOUT" },
      amountPaise: { type: "integer", example: 45000 },
      balancePaise: { type: "integer", example: 125000 },
      debitCredit: { type: "string", enum: ["DEBIT", "CREDIT"], example: "CREDIT" },
      description: { type: "string", example: "Net order proceeds after marketplace commission" },
      status: { type: "string", enum: ["POSTED", "PENDING", "SETTLED"], example: "POSTED" },
      createdAt: { type: "string", format: "date-time" },
    },
  },
};
