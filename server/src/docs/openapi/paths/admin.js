/**
 * OpenAPI 3.1 Paths: Platform Administration & Operations Console
 */

export const adminPaths = {
  "/api/v1/admin/analytics/summary": {
    get: {
      tags: ["Platform Administration"],
      summary: "Executive Platform Analytics Summary",
      description: "Aggregates marketplace GMV, total order count, active merchant count, registered customers, and low stock alarms.",
      operationId: "getAdminAnalyticsSummary",
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: "Platform summary metrics.",
          content: { "application/json": { schema: { type: "object" } } },
        },
      },
    },
  },
  "/api/v1/admin/orders": {
    get: {
      tags: ["Platform Administration"],
      summary: "List All Marketplace Orders",
      description: "Returns paginated list of all customer orders across all sellers with filtering by orderStatus and date range.",
      operationId: "getAdminAllOrders",
      security: [{ BearerAuth: [] }],
      parameters: [
        { name: "orderStatus", in: "query", required: false, schema: { type: "string" } },
        { $ref: "#/components/parameters/PageParam" },
        { $ref: "#/components/parameters/LimitParam" },
      ],
      responses: {
        200: {
          description: "List of orders.",
          content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Order" } } } },
        },
      },
    },
  },
  "/api/v1/admin/orders/{orderId}/status": {
    patch: {
      tags: ["Platform Administration"],
      summary: "Override Order Status (Admin)",
      description: "Privileged status transition override with audit logging.",
      operationId: "overrideOrderStatusAdmin",
      security: [{ BearerAuth: [] }],
      parameters: [{ name: "orderId", in: "path", required: true, schema: { type: "string" } }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["orderStatus"],
              properties: { orderStatus: { type: "string" } },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Order status updated.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Order" } } },
        },
      },
    },
  },
  "/api/v1/admin/customers": {
    get: {
      tags: ["Platform Administration"],
      summary: "List All Registered Customers",
      description: "Returns all customer user records with account status and order counts.",
      operationId: "getAdminAllCustomers",
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: "Customers list.",
          content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/User" } } } },
        },
      },
    },
  },
  "/api/v1/admin/transactions": {
    get: {
      tags: ["Platform Administration"],
      summary: "Platform Global Transactions Audit",
      description: "Full audit trail of customer charges, refunds, fee deductions, and vendor settlements.",
      operationId: "getAdminAllTransactions",
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: "Transactions audit list.",
          content: { "application/json": { schema: { type: "array", items: { type: "object" } } } },
        },
      },
    },
  },
  "/api/v1/admin/product": {
    post: {
      tags: ["Platform Administration"],
      summary: "Create Marketplace Product (Admin)",
      operationId: "createProductAdmin",
      security: [{ BearerAuth: [] }],
      requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/Product" } } } },
      responses: {
        201: { description: "Product created.", content: { "application/json": { schema: { $ref: "#/components/schemas/Product" } } } },
      },
    },
  },
  "/api/v1/admin/product/{id}": {
    patch: {
      tags: ["Platform Administration"],
      summary: "Update Product (Admin Moderation)",
      operationId: "updateProductAdmin",
      security: [{ BearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
      responses: { 200: { description: "Product updated.", content: { "application/json": { schema: { $ref: "#/components/schemas/Product" } } } } },
    },
    delete: {
      tags: ["Platform Administration"],
      summary: "Delete Product (Admin Moderation)",
      operationId: "deleteProductAdmin",
      security: [{ BearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: { 200: { description: "Product deleted.", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } } } },
    },
  },
  "/api/v1/admin/inventory": {
    get: {
      tags: ["Platform Administration"],
      summary: "Marketplace Global Inventory Overview",
      description: "Returns stock levels across all vendor products and highlights out-of-stock items.",
      operationId: "getAdminInventory",
      security: [{ BearerAuth: [] }],
      responses: {
        200: { description: "Inventory items.", content: { "application/json": { schema: { type: "array", items: { type: "object" } } } } },
      },
    },
  },
  "/api/v1/admin/inventory/{productId}": {
    patch: {
      tags: ["Platform Administration"],
      summary: "Adjust Product Stock Level",
      operationId: "updateStockAdmin",
      security: [{ BearerAuth: [] }],
      parameters: [{ name: "productId", in: "path", required: true, schema: { type: "string" } }],
      requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["quantity"], properties: { quantity: { type: "integer" } } } } } },
      responses: { 200: { description: "Stock updated.", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } } } },
    },
  },
  "/api/v1/admin/seller/{id}/status/{accountStatus}": {
    patch: {
      tags: ["Platform Administration"],
      summary: "Moderate Seller Account Status",
      description: "Approves (ACTIVE), suspends (SUSPENDED), or bans (BANNED) a vendor account.",
      operationId: "moderateSellerStatus",
      security: [{ BearerAuth: [] }],
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string" } },
        { name: "accountStatus", in: "path", required: true, schema: { type: "string", enum: ["ACTIVE", "SUSPENDED", "BANNED", "DEACTIVATED"] } },
      ],
      responses: {
        200: { description: "Seller account status updated.", content: { "application/json": { schema: { $ref: "#/components/schemas/Seller" } } } },
      },
    },
  },
  "/api/v1/admin/deal": {
    get: {
      tags: ["Promotions & Deals"],
      summary: "Get All Promotional Deals",
      operationId: "getAllDeals",
      responses: { 200: { description: "List of deals.", content: { "application/json": { schema: { type: "array", items: { type: "object" } } } } } },
    },
  },
  "/api/v1/admin/deal/create": {
    post: {
      tags: ["Promotions & Deals"],
      summary: "Create Promotional Deal (Admin)",
      operationId: "createDeal",
      security: [{ BearerAuth: [] }],
      requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
      responses: { 201: { description: "Deal created.", content: { "application/json": { schema: { type: "object" } } } } },
    },
  },
  "/api/v1/admin/deal/{id}": {
    put: {
      tags: ["Promotions & Deals"],
      summary: "Update Promotional Deal (Admin)",
      operationId: "updateDealAdmin",
      security: [{ BearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
      responses: { 200: { description: "Deal updated.", content: { "application/json": { schema: { type: "object" } } } } },
    },
    delete: {
      tags: ["Promotions & Deals"],
      summary: "Delete Promotional Deal (Admin)",
      operationId: "deleteDealAdmin",
      security: [{ BearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: { 200: { description: "Deal deleted.", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } } } },
    },
  },
  "/api/v1/settings": {
    get: {
      tags: ["Platform Settings"],
      summary: "Get Marketplace Platform Configuration",
      description: "Returns platform currency, base delivery fee, free delivery threshold, and support contacts.",
      operationId: "getPlatformSettings",
      responses: {
        200: {
          description: "Platform settings.",
          content: { "application/json": { schema: { type: "object" } } },
        },
      },
    },
    patch: {
      tags: ["Platform Settings"],
      summary: "Update Marketplace Settings (Admin Only)",
      operationId: "updatePlatformSettings",
      security: [{ BearerAuth: [] }],
      requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
      responses: {
        200: { description: "Settings updated.", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } } },
      },
    },
  },
};
