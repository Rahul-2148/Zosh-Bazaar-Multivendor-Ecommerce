/**
 * OpenAPI 3.1 Paths: Cart, Checkout, Orders, Wishlist, Coupons & Notifications
 */

export const ordersAndCartPaths = {
  "/api/v1/cart": {
    get: {
      tags: ["Cart & Checkout"],
      summary: "Get Customer Active Cart",
      description: "Returns cart items, dynamically recalculated prices, discounts, applied coupon, and tax estimates.",
      operationId: "getCustomerCart",
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: "Active shopping cart.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Cart" } } },
        },
      },
    },
  },
  "/api/v1/cart/add": {
    post: {
      tags: ["Cart & Checkout"],
      summary: "Add Product Item to Cart",
      description: "Adds a product variant or increments quantity in the customer's active shopping cart.",
      operationId: "addItemToCart",
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["productId"],
              properties: {
                productId: { type: "string", example: "65f2a1b9c9e77c0012a9bc30" },
                size: { type: "string", example: "M" },
                quantity: { type: "integer", minimum: 1, default: 1, example: 1 },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Item added to cart.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Cart" } } },
        },
      },
    },
  },
  "/api/v1/cart/item/{cartItemId}": {
    put: {
      tags: ["Cart & Checkout"],
      summary: "Update Cart Item Quantity",
      description: "Modifies the quantity of a specific cart item.",
      operationId: "updateCartItemQuantity",
      security: [{ BearerAuth: [] }],
      parameters: [{ name: "cartItemId", in: "path", required: true, schema: { type: "string" } }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["quantity"],
              properties: { quantity: { type: "integer", minimum: 1, example: 2 } },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Cart item updated.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Cart" } } },
        },
      },
    },
    delete: {
      tags: ["Cart & Checkout"],
      summary: "Remove Item from Cart",
      description: "Deletes a line item from the shopping cart.",
      operationId: "removeCartItem",
      security: [{ BearerAuth: [] }],
      parameters: [{ name: "cartItemId", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        200: {
          description: "Item removed.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } },
        },
      },
    },
  },
  "/api/v1/order/create": {
    post: {
      tags: ["Customer Orders"],
      summary: "Place New Order",
      description: "Converts cart items into order snapshot, reserves inventory atomically, and generates payment order. Supports idempotency key header.",
      operationId: "createCustomerOrder",
      security: [{ BearerAuth: [] }],
      parameters: [{ $ref: "#/components/parameters/IdempotencyKey" }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["shippingAddress", "paymentMethod"],
              properties: {
                shippingAddress: { $ref: "#/components/schemas/Address" },
                paymentMethod: {
                  type: "string",
                  enum: ["RAZORPAY", "CASHFREE", "WALLET", "COD"],
                  example: "RAZORPAY",
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: "Order placed successfully.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Order" } } },
        },
        400: {
          description: "Inventory exhausted or invalid pricing.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorEnvelope" } } },
        },
      },
    },
  },
  "/api/v1/order/user-order-history": {
    get: {
      tags: ["Customer Orders"],
      summary: "Get Customer Order History",
      description: "Returns past orders placed by the authenticated customer with fulfillment status.",
      operationId: "getCustomerOrderHistory",
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: "List of orders.",
          content: {
            "application/json": {
              schema: { type: "array", items: { $ref: "#/components/schemas/Order" } },
            },
          },
        },
      },
    },
  },
  "/api/v1/order/{orderId}": {
    get: {
      tags: ["Customer Orders"],
      summary: "Get Order Details by ID",
      description: "Retrieves complete order breakdown, shipment milestones, tracking number, and invoice details.",
      operationId: "getOrderById",
      security: [{ BearerAuth: [] }],
      parameters: [{ name: "orderId", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        200: {
          description: "Order details returned.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Order" } } },
        },
      },
    },
  },
  "/api/v1/order/{orderId}/cancel": {
    post: {
      tags: ["Customer Orders"],
      summary: "Cancel Unfulfilled Order",
      description: "Cancels an order in PENDING or CONFIRMED status and triggers refund if prepaid.",
      operationId: "cancelOrderPost",
      security: [{ BearerAuth: [] }],
      parameters: [{ name: "orderId", in: "path", required: true, schema: { type: "string" } }],
      requestBody: {
        required: false,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: { reason: { type: "string", example: "Ordered by mistake" } },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Order cancelled.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Order" } } },
        },
      },
    },
    put: {
      tags: ["Customer Orders"],
      summary: "Cancel Unfulfilled Order (PUT Alias)",
      operationId: "cancelOrderPut",
      security: [{ BearerAuth: [] }],
      parameters: [{ name: "orderId", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        200: {
          description: "Order cancelled.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Order" } } },
        },
      },
    },
  },
  "/api/v1/order/{orderId}/return": {
    post: {
      tags: ["Customer Orders"],
      summary: "Request Return on Delivered Order",
      description: "Initiates a return request within the 7-day return window. Creates a reverse pickup shipment task.",
      operationId: "requestOrderReturn",
      security: [{ BearerAuth: [] }],
      parameters: [{ name: "orderId", in: "path", required: true, schema: { type: "string" } }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["reason"],
              properties: {
                reason: { type: "string", example: "Size does not fit" },
                comments: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Return requested successfully.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Order" } } },
        },
      },
    },
  },
  "/api/v1/order/item/{orderItemId}": {
    get: {
      tags: ["Customer Orders"],
      summary: "Get Order Item Snapshot",
      description: "Returns immutable historical snapshot of purchased item at time of checkout.",
      operationId: "getOrderItemById",
      security: [{ BearerAuth: [] }],
      parameters: [{ name: "orderItemId", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        200: {
          description: "Order item snapshot.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/OrderItem" } } },
        },
      },
    },
  },
  "/api/v1/coupon/available": {
    get: {
      tags: ["Coupons & Promotions"],
      summary: "Get Available Coupons for Cart",
      description: "Lists valid promo codes matching user cart value.",
      operationId: "getAvailableCoupons",
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: "Available coupons.",
          content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Coupon" } } } },
        },
      },
    },
  },
  "/api/v1/coupon/apply": {
    post: {
      tags: ["Coupons & Promotions"],
      summary: "Apply Coupon Code to Cart",
      description: "Validates minimum order requirements and deducts discount.",
      operationId: "applyCouponCode",
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["code"],
              properties: { code: { type: "string", example: "DIWALI20" } },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Coupon applied to cart.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Cart" } } },
        },
      },
    },
  },
  "/api/v1/coupon/remove": {
    post: {
      tags: ["Coupons & Promotions"],
      summary: "Remove Applied Coupon from Cart",
      operationId: "removeCouponCode",
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: "Coupon removed.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Cart" } } },
        },
      },
    },
  },
  "/api/v1/wishlist": {
    get: {
      tags: ["Wishlist & Collections"],
      summary: "Get Customer Wishlist & Saved Collections",
      operationId: "getWishlistOverview",
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: "Wishlist overview.",
          content: { "application/json": { schema: { type: "object" } } },
        },
      },
    },
  },
  "/api/v1/wishlist/toggle/{productId}": {
    post: {
      tags: ["Wishlist & Collections"],
      summary: "Toggle Product in Default Wishlist",
      operationId: "toggleWishlistProduct",
      security: [{ BearerAuth: [] }],
      parameters: [{ name: "productId", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        200: {
          description: "Toggled state returned.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } },
        },
      },
    },
  },
  "/api/v1/notifications": {
    get: {
      tags: ["Notifications"],
      summary: "List Customer Notifications",
      description: "Retrieves order updates, price drops, delivery milestones, and marketing notifications.",
      operationId: "getUserNotifications",
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: "List of notifications.",
          content: { "application/json": { schema: { type: "array", items: { type: "object" } } } },
        },
      },
    },
  },
  "/api/v1/notifications/read-all": {
    patch: {
      tags: ["Notifications"],
      summary: "Mark All Notifications as Read",
      operationId: "markAllNotificationsRead",
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: "All notifications marked read.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } },
        },
      },
    },
  },
  "/api/v1/notifications/{id}/read": {
    patch: {
      tags: ["Notifications"],
      summary: "Mark Notification as Read",
      operationId: "markNotificationRead",
      security: [{ BearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        200: {
          description: "Notification marked read.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } },
        },
      },
    },
  },
  "/api/v1/notifications/{id}": {
    delete: {
      tags: ["Notifications"],
      summary: "Delete Notification",
      operationId: "deleteNotification",
      security: [{ BearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        200: {
          description: "Notification deleted.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } },
        },
      },
    },
  },
  "/api/v1/wishlist/shared/{shareToken}": {
    get: {
      tags: ["Wishlist & Collections"],
      summary: "View Shared Wishlist by Token",
      operationId: "getSharedWishlist",
      parameters: [{ name: "shareToken", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        200: {
          description: "Shared wishlist contents.",
          content: { "application/json": { schema: { type: "object" } } },
        },
      },
    },
  },
  "/api/v1/wishlist/save": {
    post: {
      tags: ["Wishlist & Collections"],
      summary: "Save Item to Wishlist",
      operationId: "saveItemToWishlist",
      security: [{ BearerAuth: [] }],
      requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
      responses: {
        200: {
          description: "Saved to wishlist.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } },
        },
      },
    },
  },
  "/api/v1/wishlist/product-status/{productId}": {
    get: {
      tags: ["Wishlist & Collections"],
      summary: "Check Product Wishlist Status",
      operationId: "checkProductWishlistStatus",
      security: [{ BearerAuth: [] }],
      parameters: [{ name: "productId", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        200: {
          description: "Product wishlist status.",
          content: { "application/json": { schema: { type: "object" } } },
        },
      },
    },
  },
  "/api/v1/wishlist/items/{id}": {
    delete: {
      tags: ["Wishlist & Collections"],
      summary: "Delete Item from Wishlist",
      operationId: "deleteWishlistItem",
      security: [{ BearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        200: {
          description: "Item removed.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } },
        },
      },
    },
  },
  "/api/v1/wishlist/remove-product/{productId}": {
    post: {
      tags: ["Wishlist & Collections"],
      summary: "Remove Product from Wishlist by ID",
      operationId: "removeProductFromWishlist",
      security: [{ BearerAuth: [] }],
      parameters: [{ name: "productId", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        200: {
          description: "Product removed.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } },
        },
      },
    },
  },
  "/api/v1/wishlist/collections": {
    post: {
      tags: ["Wishlist & Collections"],
      summary: "Create Wishlist Collection",
      operationId: "createWishlistCollection",
      security: [{ BearerAuth: [] }],
      requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
      responses: {
        201: {
          description: "Collection created.",
          content: { "application/json": { schema: { type: "object" } } },
        },
      },
    },
  },
  "/api/v1/wishlist/collections/{id}": {
    patch: {
      tags: ["Wishlist & Collections"],
      summary: "Update Wishlist Collection",
      operationId: "updateWishlistCollection",
      security: [{ BearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
      responses: {
        200: {
          description: "Collection updated.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } },
        },
      },
    },
    delete: {
      tags: ["Wishlist & Collections"],
      summary: "Delete Wishlist Collection",
      operationId: "deleteWishlistCollection",
      security: [{ BearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        200: {
          description: "Collection deleted.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } },
        },
      },
    },
  },
  "/api/v1/wishlist/collections/{id}/share": {
    post: {
      tags: ["Wishlist & Collections"],
      summary: "Generate Share Token for Wishlist Collection",
      operationId: "shareWishlistCollection",
      security: [{ BearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        200: {
          description: "Share token created.",
          content: { "application/json": { schema: { type: "object" } } },
        },
      },
    },
  },
  "/api/v1/wishlist/items/move": {
    post: {
      tags: ["Wishlist & Collections"],
      summary: "Move Item Between Collections",
      operationId: "moveWishlistItem",
      security: [{ BearerAuth: [] }],
      requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
      responses: {
        200: {
          description: "Item moved.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } },
        },
      },
    },
  },
  "/api/v1/wishlist/bulk-delete": {
    post: {
      tags: ["Wishlist & Collections"],
      summary: "Bulk Delete Wishlist Items",
      operationId: "bulkDeleteWishlistItems",
      security: [{ BearerAuth: [] }],
      requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
      responses: {
        200: {
          description: "Items deleted.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } },
        },
      },
    },
  },
  "/api/v1/wishlist/save-for-later": {
    post: {
      tags: ["Wishlist & Collections"],
      summary: "Save Cart Item For Later in Wishlist",
      operationId: "saveCartItemForLater",
      security: [{ BearerAuth: [] }],
      requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
      responses: {
        200: {
          description: "Moved to saved for later.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } },
        },
      },
    },
  },
  "/api/v1/wishlist/move-to-cart": {
    post: {
      tags: ["Wishlist & Collections"],
      summary: "Move Wishlist Item Directly to Cart",
      operationId: "moveWishlistItemToCart",
      security: [{ BearerAuth: [] }],
      requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
      responses: {
        200: {
          description: "Moved to cart.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } },
        },
      },
    },
  },
  "/api/v1/wishlist/sync-guest": {
    post: {
      tags: ["Wishlist & Collections"],
      summary: "Sync Local Guest Wishlist upon Login",
      operationId: "syncGuestWishlist",
      security: [{ BearerAuth: [] }],
      requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
      responses: {
        200: {
          description: "Wishlist merged.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } },
        },
      },
    },
  },
  "/api/v1/coupon/admin/all": {
    get: {
      tags: ["Coupons & Promotions"],
      summary: "Admin List All Coupons",
      operationId: "adminGetAllCoupons",
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: "List of all coupons.",
          content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Coupon" } } } },
        },
      },
    },
  },
  "/api/v1/coupon/admin/create": {
    post: {
      tags: ["Coupons & Promotions"],
      summary: "Admin Create Promotional Coupon",
      operationId: "adminCreateCoupon",
      security: [{ BearerAuth: [] }],
      requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/Coupon" } } } },
      responses: {
        201: {
          description: "Coupon created.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Coupon" } } },
        },
      },
    },
  },
  "/api/v1/coupon/admin/delete/{id}": {
    delete: {
      tags: ["Coupons & Promotions"],
      summary: "Admin Delete Coupon by ID",
      operationId: "adminDeleteCoupon",
      security: [{ BearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        200: {
          description: "Coupon deleted.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } },
        },
      },
    },
  },
};
