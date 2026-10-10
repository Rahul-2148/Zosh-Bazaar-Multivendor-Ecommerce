/**
 * OpenAPI 3.1 Paths: AI Commerce Intelligence, Media Uploads & Email Studio
 */

export const aiAndUploadsPaths = {
  "/api/v1/recommendations/home": {
    get: {
      tags: ["AI Commerce & Recommendations"],
      summary: "Homepage Personalized Product Recommendations",
      description: "Generates collaborative-filtered and trending recommendations tailored to the browsing customer.",
      operationId: "getHomeRecommendations",
      responses: {
        200: {
          description: "Recommended products list.",
          content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Product" } } } },
        },
      },
    },
  },
  "/api/v1/recommendations/product/{productId}": {
    get: {
      tags: ["AI Commerce & Recommendations"],
      summary: "Similar & Frequently Bought Together Recommendations",
      operationId: "getProductRecommendations",
      parameters: [{ name: "productId", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        200: {
          description: "Related products.",
          content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Product" } } } },
        },
      },
    },
  },
  "/api/v1/ai/events": {
    post: {
      tags: ["AI Commerce & Recommendations"],
      summary: "Ingest Behavioral Clickstream Telemetry",
      description: "Records user interactions (PRODUCT_VIEW, ADD_TO_CART, SEARCH, DWELL) to train personalization models.",
      operationId: "ingestAiEvents",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["eventType"],
              properties: {
                eventType: { type: "string", enum: ["PRODUCT_VIEW", "ADD_TO_CART", "SEARCH", "PURCHASE"] },
                productId: { type: "string" },
                categoryId: { type: "string" },
                sessionId: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Event ingested.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } },
        },
      },
    },
  },
  "/api/v1/ai/assistant/chat": {
    post: {
      tags: ["AI Commerce & Recommendations"],
      summary: "Grounded Conversational Shopping Assistant",
      description: "Processes natural language customer shopping queries with catalog tool use and authoritative price protection.",
      operationId: "chatShoppingAssistant",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["message"],
              properties: {
                message: { type: "string", example: "Find me blue cotton shirts under ₹800" },
                conversationId: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Assistant response with product recommendations.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  reply: { type: "string" },
                  suggestedProducts: { type: "array", items: { $ref: "#/components/schemas/Product" } },
                },
              },
            },
          },
        },
      },
    },
  },
  "/api/v1/ai/pricing/history/{productId}": {
    get: {
      tags: ["AI Price Intelligence"],
      summary: "Historical Price Trend Chart",
      description: "Returns 90-day price history timeline with lowest recorded price.",
      operationId: "getPriceHistory",
      parameters: [{ name: "productId", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        200: {
          description: "Price history data.",
          content: { "application/json": { schema: { type: "object" } } },
        },
      },
    },
  },
  "/api/v1/ai/pricing/alerts": {
    post: {
      tags: ["AI Price Intelligence"],
      summary: "Create Price Drop Alert",
      description: "Subscribes customer to automated email/push notifications when product selling price drops below target.",
      operationId: "createPriceAlert",
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["productId", "targetPrice"],
              properties: {
                productId: { type: "string" },
                targetPrice: { type: "number", example: 499 },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: "Alert created.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } },
        },
      },
    },
  },
  "/api/v1/ai/vision/search": {
    post: {
      tags: ["AI Vision & Lens"],
      summary: "Visual Similarity Search (Zosh Lens)",
      description: "Performs visual similarity matching on uploaded image to find visually similar products in the catalog.",
      operationId: "visualSearchLens",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["imageUrl"],
              properties: { imageUrl: { type: "string", format: "uri" } },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Matching products list.",
          content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Product" } } } },
        },
      },
    },
  },
  "/api/v1/ai/admin/copilot": {
    post: {
      tags: ["AI Admin Copilot"],
      summary: "Admin Executive Copilot Query",
      description: "Answers administrative management questions on sales drops, anomalous seller behavior, or logistics bottlenecks.",
      operationId: "queryAdminCopilot",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["query"],
              properties: { query: { type: "string", example: "Why did sales drop in electronics yesterday?" } },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Executive analytical answer.",
          content: { "application/json": { schema: { type: "object" } } },
        },
      },
    },
  },
  "/api/v1/upload/signature": {
    get: {
      tags: ["Media & Uploads"],
      summary: "Generate Direct Cloudinary Signed Upload Token",
      description: "Returns timestamped HMAC signature for direct client-to-Cloudinary authenticated image upload.",
      operationId: "getCloudinarySignature",
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: "Signed upload parameters.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  signature: { type: "string" },
                  timestamp: { type: "integer" },
                  apiKey: { type: "string" },
                  cloudName: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
  },
  "/api/v1/upload/cloudinary": {
    post: {
      tags: ["Media & Uploads"],
      summary: "Upload Image Files (Server Stream)",
      description: "Accepts multipart/form-data images (up to 12 files, max 25MB each) and streams them to Cloudinary CDN.",
      operationId: "uploadFilesToCloudinary",
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              properties: {
                images: {
                  type: "array",
                  items: { type: "string", format: "binary" },
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Uploaded media URLs.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  urls: { type: "array", items: { type: "string", format: "uri" } },
                },
              },
            },
          },
        },
      },
    },
  },
  "/dev/emails/api/templates": {
    get: {
      tags: ["Developer Email Studio"],
      summary: "List All Registered Transactional Email Templates",
      description: "Returns metadata for all 172+ transactional email templates (Dev Mode Only).",
      operationId: "getEmailTemplatesList",
      responses: {
        200: {
          description: "Registered email templates.",
          content: { "application/json": { schema: { type: "object" } } },
        },
      },
    },
  },
};
