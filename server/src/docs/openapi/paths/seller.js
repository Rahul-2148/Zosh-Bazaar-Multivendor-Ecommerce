/**
 * OpenAPI 3.1 Paths: Vendor / Merchant Portal, Catalog, Inventory & Orders
 */

const sellerSendOtpDoc = {
  post: {
    tags: ["Seller Authentication"],
    summary: "Deliver Seller Login OTP",
    description: "Sends one-time verification code to the merchant's registered business email.",
    operationId: "sendSellerOtp",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["email"],
            properties: { email: { type: "string", format: "email", example: "merchant@zoshbazaar.com" } },
          },
        },
      },
    },
    responses: {
      200: {
        description: "OTP dispatched to merchant.",
        content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } },
      },
    },
  },
};

const sellerVerifyOtpDoc = {
  post: {
    tags: ["Seller Authentication"],
    summary: "Verify Seller Login OTP",
    description: "Validates 6-digit code and issues a Bearer JWT session token for the merchant console.",
    operationId: "verifySellerOtp",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["email", "otp"],
            properties: {
              email: { type: "string", format: "email" },
              otp: { type: "string", pattern: "^\\d{6}$", example: "123456" },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Merchant authenticated.",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                message: { type: "string", example: "Login successful" },
                jwt: { type: "string", example: "eyJhbGciOi..." },
                role: { type: "string", example: "ROLE_SELLER" },
              },
            },
          },
        },
      },
    },
  },
};

export const sellerPaths = {
  "/api/v1/seller/sent/login-otp": {
    post: {
      ...sellerSendOtpDoc.post,
      operationId: "sendSellerOtpSentPath",
      summary: "Deliver Seller Login OTP (Sent Path)",
    },
  },
  "/api/v1/seller/login/otp": {
    post: {
      ...sellerSendOtpDoc.post,
      operationId: "sendSellerOtpDirectPath",
      summary: "Deliver Seller Login OTP (Direct Path)",
    },
  },
  "/api/v1/seller/verify/login-otp": {
    post: {
      ...sellerVerifyOtpDoc.post,
      operationId: "verifySellerLoginOtpFull",
      summary: "Verify Seller Login OTP (Login-OTP Path)",
    },
  },
  "/api/v1/seller/verify/otp": {
    post: {
      ...sellerVerifyOtpDoc.post,
      operationId: "verifySellerOtpDirect",
      summary: "Verify Seller Login OTP (Direct Path)",
    },
  },
  "/api/v1/seller/create": {
    post: {
      tags: ["Seller Authentication"],
      summary: "Register / Onboard New Merchant",
      description: "Registers a new seller shop profile with GSTIN, business details, and bank account for settlements.",
      operationId: "createSellerAccount",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["sellerName", "email", "mobile", "GSTIN", "businessDetails", "bankDetails"],
              properties: {
                sellerName: { type: "string", example: "Zosh Fashion" },
                email: { type: "string", format: "email", example: "merchant@zoshbazaar.com" },
                mobile: { type: "string", example: "9876501234" },
                GSTIN: { type: "string", example: "29ABCDE1234F1Z5" },
                businessDetails: { type: "object" },
                bankDetails: { type: "object" },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: "Seller registered; account set to PENDING_VERIFICATION.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Seller" } } },
        },
      },
    },
  },
  "/api/v1/seller/profile": {
    get: {
      tags: ["Seller Profile & Shop"],
      summary: "Get Authenticated Merchant Profile",
      description: "Returns shop details, verification status, contact info, and bank configurations.",
      operationId: "getSellerProfile",
      security: [{ SellerAuth: [] }],
      responses: {
        200: {
          description: "Seller profile object.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Seller" } } },
        },
      },
    },
  },
  "/api/v1/seller": {
    patch: {
      tags: ["Seller Profile & Shop"],
      summary: "Update Merchant Shop Details",
      description: "Modifies business address, store description, or bank details.",
      operationId: "updateSellerProfile",
      security: [{ SellerAuth: [] }],
      requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
      responses: {
        200: {
          description: "Profile updated.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Seller" } } },
        },
      },
    },
  },
  "/api/v1/seller/{id}": {
    get: {
      tags: ["Seller Profile & Shop"],
      summary: "Public Storefront Seller Information",
      description: "Returns public storefront information for display on product details page.",
      operationId: "getPublicSellerById",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        200: {
          description: "Public seller details.",
          content: { "application/json": { schema: { type: "object" } } },
        },
      },
    },
    delete: {
      tags: ["Seller Profile & Shop"],
      summary: "Delete Seller Account (Admin Only)",
      operationId: "deleteSellerAdmin",
      security: [{ BearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        200: { description: "Seller deleted.", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } } },
      },
    },
  },
  "/api/v1/seller/product": {
    get: {
      tags: ["Seller Catalog & Products"],
      summary: "List Products Owned by Merchant",
      description: "Returns all catalog listings created by the authenticated seller.",
      operationId: "getSellerProducts",
      security: [{ SellerAuth: [] }],
      responses: {
        200: {
          description: "List of merchant products.",
          content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Product" } } } },
        },
      },
    },
  },
  "/api/v1/seller/product/create": {
    post: {
      tags: ["Seller Catalog & Products"],
      summary: "Create New Product Listing",
      description: "Creates a product listing with variants, pricing, inventory count, and media. Requires ACTIVE seller status.",
      operationId: "createSellerProduct",
      security: [{ SellerAuth: [] }],
      requestBody: {
        required: true,
        content: { "application/json": { schema: { $ref: "#/components/schemas/Product" } } },
      },
      responses: {
        201: {
          description: "Product created.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Product" } } },
        },
      },
    },
  },
  "/api/v1/seller/product/{productId}": {
    patch: {
      tags: ["Seller Catalog & Products"],
      summary: "Update Product Listing",
      description: "Modifies price, description, variants, or images. Strictly validates multi-tenant ownership.",
      operationId: "updateSellerProduct",
      security: [{ SellerAuth: [] }],
      parameters: [{ name: "productId", in: "path", required: true, schema: { type: "string" } }],
      requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
      responses: {
        200: {
          description: "Product updated.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Product" } } },
        },
      },
    },
    delete: {
      tags: ["Seller Catalog & Products"],
      summary: "Delete Product Listing",
      description: "Deletes a product listing owned by the seller.",
      operationId: "deleteSellerProduct",
      security: [{ SellerAuth: [] }],
      parameters: [{ name: "productId", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        200: {
          description: "Product deleted.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } },
        },
      },
    },
  },
  "/api/v1/seller/order": {
    get: {
      tags: ["Seller Orders"],
      summary: "Get Orders for Seller Fulfillment",
      description: "Lists orders containing items sold by the authenticated merchant.",
      operationId: "getSellerOrders",
      security: [{ SellerAuth: [] }],
      responses: {
        200: {
          description: "List of orders.",
          content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Order" } } } },
        },
      },
    },
  },
  "/api/v1/seller/order/{orderId}/status/{orderStatus}": {
    patch: {
      tags: ["Seller Orders"],
      summary: "Update Fulfillment Status by Seller",
      description: "Transitions order status (e.g. to CONFIRMED or SHIPPED) and emits realtime updates to customer room.",
      operationId: "updateSellerOrderStatus",
      security: [{ SellerAuth: [] }],
      parameters: [
        { name: "orderId", in: "path", required: true, schema: { type: "string" } },
        { name: "orderStatus", in: "path", required: true, schema: { type: "string", enum: ["CONFIRMED", "SHIPPED", "CANCELLED"] } },
      ],
      responses: {
        200: {
          description: "Order status transitioned.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Order" } } },
        },
      },
    },
  },
  "/api/v1/transactions/seller": {
    get: {
      tags: ["Seller Analytics & Reports"],
      summary: "Get Seller Settlement Transactions",
      description: "Audits individual order disbursements, commissions, and bank payout references for this seller.",
      operationId: "getSellerTransactions",
      security: [{ SellerAuth: [] }],
      responses: {
        200: {
          description: "Seller transactions.",
          content: { "application/json": { schema: { type: "array", items: { type: "object" } } } },
        },
      },
    },
  },
  "/api/v1/seller/all-sellers": {
    get: {
      tags: ["Seller Profile & Shop"],
      summary: "List All Marketplace Sellers (Admin Only)",
      operationId: "getAllSellersAdmin",
      security: [{ BearerAuth: [] }],
      responses: {
        200: { description: "All sellers.", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Seller" } } } } },
      },
    },
  },
  "/api/v1/seller/product/{productId}/resolve-variant": {
    get: {
      tags: ["Seller Catalog & Products"],
      summary: "Resolve Product Variant for Seller",
      operationId: "resolveVariantSeller",
      parameters: [{ name: "productId", in: "path", required: true, schema: { type: "string" } }],
      responses: { 200: { description: "Variant details.", content: { "application/json": { schema: { type: "object" } } } } },
    },
  },
  "/api/v1/seller/product/delete-multiple": {
    post: {
      tags: ["Seller Catalog & Products"],
      summary: "Bulk Delete Product Listings",
      operationId: "deleteMultipleProductsSeller",
      security: [{ SellerAuth: [] }],
      requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["productIds"], properties: { productIds: { type: "array", items: { type: "string" } } } } } } },
      responses: { 200: { description: "Products deleted.", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } } } },
    },
  },
  "/api/v1/seller/product/bulk-status": {
    patch: {
      tags: ["Seller Catalog & Products"],
      summary: "Bulk Update Product Active Status",
      operationId: "bulkUpdateStatusSeller",
      security: [{ SellerAuth: [] }],
      requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["productIds", "status"] } } } },
      responses: { 200: { description: "Statuses updated.", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } } } },
    },
  },
  "/api/v1/seller/report": {
    get: {
      tags: ["Seller Analytics & Reports"],
      summary: "Get Seller Financial & Sales Performance Report",
      description: "Aggregates total gross sales, commission deductions, net earnings, and delivered units.",
      operationId: "getSellerReport",
      security: [{ SellerAuth: [] }],
      responses: {
        200: {
          description: "Seller report.",
          content: { "application/json": { schema: { type: "object" } } },
        },
      },
    },
    patch: {
      tags: ["Seller Analytics & Reports"],
      summary: "Admin Reconciliation Adjustment to Seller Report",
      description: "Restricted to Platform Admin for manual dispute reconciliation.",
      operationId: "updateSellerReportAdmin",
      security: [{ BearerAuth: [] }],
      requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
      responses: { 200: { description: "Report adjusted.", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } } } },
    },
  },
};
