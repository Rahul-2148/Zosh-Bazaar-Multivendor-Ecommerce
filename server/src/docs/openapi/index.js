/**
 * ZOSH BAZAAR — OPENAPI 3.1 SPECIFICATION COMPILER
 * Complete, maintainable, modular specification for all backend services.
 */

import { securitySchemes, commonParameters, schemas } from "./components.js";
import { healthPaths } from "./paths/health.js";
import { authPaths } from "./paths/auth.js";
import { userPaths } from "./paths/user.js";
import { accountPaths } from "./paths/account.js";
import { catalogPaths } from "./paths/catalog.js";
import { ordersAndCartPaths } from "./paths/ordersAndCart.js";
import { paymentPaths } from "./paths/payment.js";
import { sellerPaths } from "./paths/seller.js";
import { adminPaths } from "./paths/admin.js";
import { logisticsPaths } from "./paths/logistics.js";
import { deliveryPartnerPaths } from "./paths/deliveryPartner.js";
import { aiAndUploadsPaths } from "./paths/aiAndUploads.js";

export const getOpenApiSpec = () => {
  return {
    openapi: "3.1.0",
    info: {
      title: "Zosh Bazaar — Enterprise Multi-Vendor E-Commerce Platform API",
      version: "2.4.0",
      description: `
# Zosh Bazaar Enterprise API Documentation

Welcome to the official developer documentation for the **Zosh Bazaar Multi-Vendor E-Commerce Platform**.
This API powers our multi-portal ecosystem spanning Customer Web Storefront, Vendor/Seller Console, Platform Administration, Logistics Control Tower, and Last-Mile Delivery Partner Mobile operations.

### Key Architecture & Compliance Principles
- **Monetary Arithmetic**: All financial calculations are executed strictly in integer minor units (Paise, where ₹1.00 = 100 paise) to prevent floating-point inaccuracies.
- **Double-Entry Accounting**: High-precision financial ledger tracks debit and credit journals across settlement batches and escrow balances.
- **Role-Based Access Control (RBAC)**: Cryptographically verified JWT authentication for Customer, Seller, Admin, Logistics Operator, and Delivery Partner roles.
- **Realtime WebSocket Hub**: Dedicated Socket.IO private rooms with strict tenant isolation.
      `.trim(),
      contact: {
        name: "Zosh Bazaar Platform Architecture Team",
        url: "https://github.com/Rahul-2148/Zosh-Bazaar-Multivendor-Ecommerce",
        email: "architecture@zoshbazaar.dev",
      },
      license: {
        name: "Proprietary / Enterprise",
      },
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Local Development Server",
      },
      {
        url: "https://api.zoshbazaar.com",
        description: "Production Gateway (Canary Fail-Closed)",
      },
    ],
    tags: [
      { name: "Operational", description: "Microservice health, liveness, and readiness probes" },
      { name: "Customer Authentication", description: "Customer OTP registration, sign-in, and session management" },
      { name: "Customer Profile", description: "Customer identity, profile management, and contact records" },
      { name: "Customer Addresses", description: "Shipping address book, default addresses, and geocoding" },
      { name: "Customer Account Suite", description: "Account overview, saved payment methods, preferences, and data export" },
      { name: "Account Lifecycle", description: "Temporary deactivation, reactivations, and scheduled permanent account deletion" },
      { name: "Customer Sessions", description: "Device session tracking, telemetry heartbeats, and remote session revocation" },
      { name: "Catalog & Products", description: "Product catalog browsing, full-text search, filter facets, and variant resolution" },
      { name: "Categories & Taxonomy", description: "Multi-level department hierarchies and catalog taxonomies" },
      { name: "Brands", description: "Brand registries and catalog affiliations" },
      { name: "Reviews & Ratings", description: "Verified customer reviews, ratings breakdown, and moderation" },
      { name: "Storefront Feed", description: "Curated marketplace homepage feed and dynamic banners" },
      { name: "Cart & Checkout", description: "Persistent customer shopping cart, line item mutations, and totals" },
      { name: "Customer Orders", description: "Order creation, order tracking, cancellations, and return requests" },
      { name: "Coupons & Promotions", description: "Promotional discount codes, cart validation, and coupon management" },
      { name: "Wishlist & Collections", description: "Saved items, custom collections, and sharing tokens" },
      { name: "Notifications", description: "Transactional and marketing notifications" },
      { name: "Payments & Checkout", description: "Server-authoritative payment intents, rail selection, and attempt execution" },
      { name: "Wallet & Refunds", description: "Customer closed-loop wallet and order refunds" },
      { name: "Payment Webhooks", description: "HMAC-SHA256 verified webhook receivers for payment aggregators" },
      { name: "Admin Financial Operations", description: "Double-entry ledger, reconciliation, settlement batches, and dispute handling" },
      { name: "Seller Authentication", description: "Merchant registration, GSTIN verification, and OTP authentication" },
      { name: "Seller Profile & Shop", description: "Merchant store profile, bank settings, and contact information" },
      { name: "Seller Catalog & Products", description: "Merchant product catalog, variant matrix, and pricing management" },
      { name: "Seller Orders", description: "Vendor order fulfillment, packing status, and courier dispatch" },
      { name: "Seller Analytics & Reports", description: "Merchant sales performance, commissions, and payout statements" },
      { name: "Platform Administration", description: "Executive platform analytics, user moderation, and system settings" },
      { name: "Promotions & Deals", description: "Featured deals and homepage flash sales" },
      { name: "Platform Settings", description: "Global shipping fees, tax rates, and marketplace configuration" },
      { name: "Logistics & Tracking", description: "Public parcel tracking and pincode serviceability checks" },
      { name: "Logistics Control Tower", description: "Fulfillment operations overview, live Kanban board, and analytics" },
      { name: "Logistics Shipments", description: "Parcel creation, milestone transitions, and courier assignments" },
      { name: "Logistics Operations", description: "Barcode scanning, sortation, and linehaul dispatch" },
      { name: "Logistics Network", description: "Hub facilities, service zones, and route planning" },
      { name: "Logistics Fleet & Dispatch", description: "Delivery agent registry, shifts, and run assignments" },
      { name: "Logistics Exceptions", description: "Non-delivery reports (NDR) and triage" },
      { name: "Delivery Partner Mobile App", description: "Courier login, shift management, stop lifecycles, and OTP handovers" },
      { name: "AI Commerce & Recommendations", description: "Algorithmic recommendations, clickstream telemetry, and shopping assistant" },
      { name: "AI Price Intelligence", description: "Price history trends and automated price drop alerts" },
      { name: "AI Vision & Lens", description: "Visual similarity search and visual catalog discovery" },
      { name: "AI Admin Copilot", description: "Executive natural language management query assistant" },
      { name: "Media & Uploads", description: "Cloudinary signed uploads and multipart stream handling" },
      { name: "Developer Email Studio", description: "Transactional email template previews and testing (Dev mode only)" },
    ],
    paths: {
      ...healthPaths,
      ...authPaths,
      ...userPaths,
      ...accountPaths,
      ...catalogPaths,
      ...ordersAndCartPaths,
      ...paymentPaths,
      ...sellerPaths,
      ...adminPaths,
      ...logisticsPaths,
      ...deliveryPartnerPaths,
      ...aiAndUploadsPaths,
    },
    components: {
      securitySchemes,
      parameters: commonParameters,
      schemas,
    },
  };
};

export default getOpenApiSpec;
