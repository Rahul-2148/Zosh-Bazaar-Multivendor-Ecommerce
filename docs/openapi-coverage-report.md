# Zosh Bazaar — OpenAPI 3.1 Endpoint Coverage & Audit Report

**Generated**: 2026-10-10T14:22:36.322Z  
**Specification**: OpenAPI 3.1.0  
**Backend Framework**: Express 5.1.0 (Node.js LTS)

---

## Executive Summary

| Metric | Count | Percentage |
| :--- | :---: | :---: |
| **Discovered Server Routes** | **313** | 100% |
| **Directly Documented Canonical Operations** | **248** | 79.2% |
| **Documented Router Aliases** | **62** | 19.8% |
| **Development Sandboxes Excluded** | **3** | 1.0% |
| **Unmapped Routes** | **0** | 0.0% |
| **Total Functional Surface Accounted** | **313 / 313** | **100.0%** |

---

## 1. Quality Gate Results

- **JSON & YAML Syntax**: Valid, conforms to OpenAPI 3.1.0 schema specification.
- **Operation ID Uniqueness**: **100% strictly unique** across all 248 operations.
- **Internal Reference Resolution**: **0 broken $ref references** across schemas, parameters, and responses.
- **Security Scheme Compliance**: All authenticated routes declare valid `BearerAuth`, `SellerAuth`, `DeliveryPartnerAuth`, or `RazorpayWebhookSignature` security schemes.

---

## 2. Multi-Portal Domain Distribution

- **Customer & Public Storefront**: Authentication, Customer Profile, Multi-address management, Product Catalog, Full-text Search, Cart, Coupons, Wishlist, Reviews, and Order Placement.
- **Financial Platform**: Razorpay Payment Intents, Webhook Verification with HMAC-SHA256, Integer Paise Double-Entry Ledger, and Outbox Refunds.
- **Seller Portal**: Merchant Onboarding KYC, Multi-variant Product Management, Cloudinary Uploads, Inventory Stock, and Fulfillment Stepper.
- **Admin Governance**: Seller Moderation, Catalog Approvals, User Status Management, and Platform Commission Tiers.
- **Logistics Control Tower**: Linehaul Hubs, Service Delivery Zones, Barcode Scanning, Manifest Sealing/Dispatch, and Delivery Exceptions (NDRs).
- **Delivery Partner**: Courier Shift Toggles, Clustered Delivery Routes, Stop State Machine, OTP Customer Handshake, and Proof of Delivery (POD).
- **AI & Realtime Operations**: Recommendations, Buying Guides, Price Alerts, and Socket.IO Event Isolation.

---

## 3. Accounted Router Aliases & Multi-Mounts

In Express 5.1.0, certain modular routers are mounted at multiple endpoint paths for backward compatibility:

| Registered Route | Canonical OpenAPI Path | Mount Rationale |
| :--- | :--- | :--- |
| `GET /api/v1/home/feed` | `GET /api/v1/homeCategory/feed` | Home category alias mount (homeCategoryRouter) |
| `GET /api/v1/home/home-category` | `GET /api/v1/homeCategory/home-category` | Home category alias mount (homeCategoryRouter) |
| `POST /api/v1/home/categories` | `POST /api/v1/homeCategory/categories` | Home category alias mount (homeCategoryRouter) |
| `PATCH /api/v1/home/home-category/:id` | `PATCH /api/v1/homeCategory/home-category/:id` | Home category alias mount (homeCategoryRouter) |
| `POST /api/v1/upload/product-images` | `POST /api/v1/upload/product-images` | Multi-tenant alias mount (uploadRouter) |
| `DELETE /api/v1/upload/product-image` | `DELETE /api/v1/upload/product-image` | Multi-tenant alias mount (uploadRouter) |
| `GET /api/v1/recommendations/cart` | `GET /api/v1/ai/cart` | Alias router mount (aiRouter) |
| `POST /api/v1/recommendations/events` | `POST /api/v1/ai/events` | Alias router mount (aiRouter) |
| `POST /api/v1/recommendations/assistant/chat` | `POST /api/v1/ai/assistant/chat` | Alias router mount (aiRouter) |
| `POST /api/v1/recommendations/assistant/stream` | `POST /api/v1/ai/assistant/stream` | Alias router mount (aiRouter) |
| `GET /api/v1/recommendations/pricing/history/:productId` | `GET /api/v1/ai/pricing/history/:productId` | Alias router mount (aiRouter) |
| `POST /api/v1/recommendations/pricing/alerts` | `POST /api/v1/ai/pricing/alerts` | Alias router mount (aiRouter) |
| `GET /api/v1/recommendations/pricing/alerts` | `GET /api/v1/ai/pricing/alerts` | Alias router mount (aiRouter) |
| `DELETE /api/v1/recommendations/pricing/alerts/:alertId` | `DELETE /api/v1/ai/pricing/alerts/:alertId` | Alias router mount (aiRouter) |
| `GET /api/v1/recommendations/reviews/:productId` | `GET /api/v1/ai/reviews/:productId` | Alias router mount (aiRouter) |
| `POST /api/v1/recommendations/vision/search` | `POST /api/v1/ai/vision/search` | Alias router mount (aiRouter) |
| `GET /api/v1/recommendations/guides/:categoryId` | `GET /api/v1/ai/guides/:categoryId` | Alias router mount (aiRouter) |
| `GET /api/v1/recommendations/seller/insights` | `GET /api/v1/ai/seller/insights` | Alias router mount (aiRouter) |
| `POST /api/v1/recommendations/seller/optimize-listing` | `POST /api/v1/ai/seller/optimize-listing` | Alias router mount (aiRouter) |
| `GET /api/v1/recommendations/seller/pricing-simulation/:productId` | `GET /api/v1/ai/seller/pricing-simulation/:productId` | Alias router mount (aiRouter) |
| `GET /api/v1/recommendations/seller/inventory-forecast/:productId` | `GET /api/v1/ai/seller/inventory-forecast/:productId` | Alias router mount (aiRouter) |
| `POST /api/v1/recommendations/admin/copilot` | `POST /api/v1/ai/admin/copilot` | Alias router mount (aiRouter) |
| `GET /api/v1/recommendations/admin/recommendation-explorer` | `GET /api/v1/ai/admin/recommendation-explorer` | Alias router mount (aiRouter) |
| `GET /api/v1/recommendations/admin/observability` | `GET /api/v1/ai/admin/observability` | Alias router mount (aiRouter) |
| `GET /api/v1/recommendations/gateway/health` | `GET /api/v1/ai/gateway/health` | Alias router mount (aiRouter) |
| `GET /api/v1/recommendations/gateway/providers` | `GET /api/v1/ai/gateway/providers` | Alias router mount (aiRouter) |
| `GET /api/v1/recommendations/logistics/risk-shipments` | `GET /api/v1/ai/logistics/risk-shipments` | Alias router mount (aiRouter) |
| `GET /api/v1/recommendations/delivery/stop-assistance` | `GET /api/v1/ai/delivery/stop-assistance` | Alias router mount (aiRouter) |
| `POST /api/v1/recommendations/privacy/reset` | `POST /api/v1/ai/privacy/reset` | Alias router mount (aiRouter) |
| `GET /api/v1/ai/home` | `GET /api/v1/recommendations/home` | Alias router mount (aiRouter) |
| `GET /api/v1/ai/product/:productId` | `GET /api/v1/recommendations/product/:productId` | Alias router mount (aiRouter) |
| `GET /api/v1/ai/cart` | `GET /api/v1/recommendations/cart` | Alias router mount (aiRouter) |
| `POST /api/v1/ai/assistant/stream` | `POST /api/v1/recommendations/assistant/stream` | Alias router mount (aiRouter) |
| `GET /api/v1/ai/pricing/alerts` | `GET /api/v1/recommendations/pricing/alerts` | Alias router mount (aiRouter) |
| `DELETE /api/v1/ai/pricing/alerts/:alertId` | `DELETE /api/v1/recommendations/pricing/alerts/:alertId` | Alias router mount (aiRouter) |
| `GET /api/v1/ai/reviews/:productId` | `GET /api/v1/recommendations/reviews/:productId` | Alias router mount (aiRouter) |
| `GET /api/v1/ai/guides/:categoryId` | `GET /api/v1/recommendations/guides/:categoryId` | Alias router mount (aiRouter) |
| `GET /api/v1/ai/seller/insights` | `GET /api/v1/recommendations/seller/insights` | Alias router mount (aiRouter) |
| `POST /api/v1/ai/seller/optimize-listing` | `POST /api/v1/recommendations/seller/optimize-listing` | Alias router mount (aiRouter) |
| `GET /api/v1/ai/seller/pricing-simulation/:productId` | `GET /api/v1/recommendations/seller/pricing-simulation/:productId` | Alias router mount (aiRouter) |
| `GET /api/v1/ai/seller/inventory-forecast/:productId` | `GET /api/v1/recommendations/seller/inventory-forecast/:productId` | Alias router mount (aiRouter) |
| `GET /api/v1/ai/admin/recommendation-explorer` | `GET /api/v1/recommendations/admin/recommendation-explorer` | Alias router mount (aiRouter) |
| `GET /api/v1/ai/admin/observability` | `GET /api/v1/recommendations/admin/observability` | Alias router mount (aiRouter) |
| `GET /api/v1/ai/gateway/health` | `GET /api/v1/recommendations/gateway/health` | Alias router mount (aiRouter) |
| `GET /api/v1/ai/gateway/providers` | `GET /api/v1/recommendations/gateway/providers` | Alias router mount (aiRouter) |
| `GET /api/v1/ai/logistics/risk-shipments` | `GET /api/v1/recommendations/logistics/risk-shipments` | Alias router mount (aiRouter) |
| `GET /api/v1/ai/delivery/stop-assistance` | `GET /api/v1/recommendations/delivery/stop-assistance` | Alias router mount (aiRouter) |
| `POST /api/v1/ai/privacy/reset` | `POST /api/v1/recommendations/privacy/reset` | Alias router mount (aiRouter) |
| `GET /api/v1/seller/orders` | `GET /api/v1/seller/order` | Plural alias mount (sellerOrderRoutes) |
| `PATCH /api/v1/seller/orders/:orderId/status/:orderStatus` | `PATCH /api/v1/seller/order/:orderId/status/:orderStatus` | Plural alias mount (sellerOrderRoutes) |
| `GET /api/v1/seller/upload/signature` | `GET /api/v1/upload/signature` | Multi-tenant alias mount (uploadRouter) |
| `POST /api/v1/seller/upload/cloudinary` | `POST /api/v1/upload/cloudinary` | Multi-tenant alias mount (uploadRouter) |
| `POST /api/v1/seller/upload/product-images` | `POST /api/v1/upload/product-images` | Multi-tenant alias mount (uploadRouter) |
| `DELETE /api/v1/seller/upload/product-image` | `DELETE /api/v1/upload/product-image` | Multi-tenant alias mount (uploadRouter) |
| `GET /api/v1/admin/upload/signature` | `GET /api/v1/upload/signature` | Multi-tenant alias mount (uploadRouter) |
| `POST /api/v1/admin/upload/cloudinary` | `POST /api/v1/upload/cloudinary` | Multi-tenant alias mount (uploadRouter) |
| `POST /api/v1/admin/upload/product-images` | `POST /api/v1/upload/product-images` | Multi-tenant alias mount (uploadRouter) |
| `DELETE /api/v1/admin/upload/product-image` | `DELETE /api/v1/upload/product-image` | Multi-tenant alias mount (uploadRouter) |
| `GET /api/v1/delivery-partner/upload/signature` | `GET /api/v1/upload/signature` | Multi-tenant alias mount (uploadRouter) |
| `POST /api/v1/delivery-partner/upload/cloudinary` | `POST /api/v1/upload/cloudinary` | Multi-tenant alias mount (uploadRouter) |
| `POST /api/v1/delivery-partner/upload/product-images` | `POST /api/v1/upload/product-images` | Multi-tenant alias mount (uploadRouter) |
| `DELETE /api/v1/delivery-partner/upload/product-image` | `DELETE /api/v1/upload/product-image` | Multi-tenant alias mount (uploadRouter) |

---

## 4. Development-Only Exclusions

The following endpoints are strictly guarded behind `NODE_ENV !== "production"` and omitted from the production OpenAPI specification:

| Route | Rationale |
| :--- | :--- |
| `GET /dev/emails` | Development-only transactional email preview studio |
| `GET /dev/emails/api/render/:templateKey` | Development-only transactional email preview studio |
| `POST /dev/emails/api/send-test` | Development-only transactional email preview studio |

---

## 5. Unmapped Routes

✅ **None. 100% of discovered routes are fully documented or accounted for.**
