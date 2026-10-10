/**
 * Zosh Bazaar Developer Portal Content Database
 * Contains authoritative architectural guides, RBAC matrices, payment workflows,
 * socket realtime specs, and multi-portal operational playbooks.
 */

export const PORTAL_SECTIONS = [
  {
    id: "overview",
    title: "System Architecture & Overview",
    category: "Architecture & Setup",
    badge: "Core",
    content: `
# Zosh Bazaar Enterprise Architecture

Zosh Bazaar is an enterprise multi-vendor e-commerce platform built on a modular Node.js/Express backend powering 5 distinct frontend portals: Customer, Seller, Admin, Logistics Control Tower, and Delivery Partner.

\`\`\`
                                  +---------------------------------------+
                                  |            Client Portals             |
                                  | Customer | Seller | Admin | Logistics | Delivery
                                  +-------------------+-------------------+
                                                      |
                                             HTTPS / WebSocket
                                                      |
                                                      v
                                  +---------------------------------------+
                                  |         Express 5.1 Gateway           |
                                  | CORS | Rate Limit | Helmet | Auth RBAC|
                                  +-------------------+-------------------+
                                                      |
                      +-------------------------------+-------------------------------+
                      |                               |                               |
                      v                               v                               v
         +------------------------+      +------------------------+      +------------------------+
         |  Customer & Commerce   |      |   Seller & Inventory   |      |  Logistics & Dispatch  |
         |  - User Profiles       |      |   - Seller KYC         |      |  - Hubs & Zones        |
         |  - Cart & Checkout     |      |   - Multi-variant SKU  |      |  - Route Clustering    |
         |  - Razorpay Orders     |      |   - Stock Reservation  |      |  - Barcode Scanning    |
         +------------------------+      +------------------------+      +------------------------+
                      |                               |                               |
                      +-------------------------------+-------------------------------+
                                                      |
                                                      v
                                  +---------------------------------------+
                                  |       Core Invariant Services         |
                                  | - Double-Entry Financial Ledger (Paise)|
                                  | - Outbox Event Transaction Dispatcher |
                                  | - Socket.IO Isolated Tenant Hub       |
                                  +---------------------------------------+
                                                      |
                      +-------------------------------+-------------------------------+
                      |                               |                               |
                      v                               v                               v
         +------------------------+      +------------------------+      +------------------------+
         |     MongoDB Cluster    |      |      Redis Engine      |      |   External Gateways    |
         |  - Multi-tenant Docs   |      |  - Rate Limit Tokens   |      |  - Razorpay Payments   |
         |  - ACID Transactions   |      |  - Realtime Ephemeral  |      |  - Cloudinary CDN      |
         +------------------------+      +------------------------+      +------------------------+
\`\`\`

### Key Architectural Pillars
1. **Modular Domain Routers**: 5 core domain modules (\`customer\`, \`seller\`, \`admin\`, \`logistics\`, \`deliveryPartner\`) mounted cleanly with strictly scoped authentication barriers.
2. **Deterministic Monetary Accounting**: All financial numbers are calculated strictly in **integer paise** (₹1.00 = 100 paise) preventing IEEE-754 floating-point precision corruption.
3. **Double-Entry Ledger Integrity**: Every financial transaction records balancing debit and credit entries with strict zero-sum invariants before payout or order fulfillment.
4. **Idempotent Payment Webhooks**: Webhook events from Razorpay are verified using HMAC-SHA256 signatures and processed through an atomic outbox queue to prevent duplicate charges or double refunds.
5. **Real-time Event Isolation**: Socket.IO connections enforce token-based tenant room boundaries (\`customer_<id>\`, \`seller_<id>\`, \`agent_<id>\`, \`admin_room\`, \`logistics_control_tower\`).
    `
  },
  {
    id: "quickstart",
    title: "Quickstart & Local Environment",
    category: "Architecture & Setup",
    badge: "Setup",
    content: `
# Developer Setup & Quickstart Guide

### Prerequisites
- **Node.js**: v20.x or v22.x LTS (current workspace running Node.js v22.19.0)
- **MongoDB**: v6.0+ local daemon or MongoDB Atlas URI
- **npm**: v10.x+

### Repository Structure
\`\`\`
Multivendor_Ecommerce ZoshBazaar/
├── server/               # Express 5.1 Backend REST API & Realtime Hub
├── client/               # Customer React / Vite Web Application
├── seller/               # Seller Portal Web Application
├── admin/                # Admin Console Web Application
├── logistics/            # Logistics Control Tower Web Application
├── delivery-partner/     # Courier & Delivery Partner Mobile-First Web Application
└── docs/                 # OpenAPI 3.1 Specification & Quality Gate Reports
\`\`\`

### Environment Configuration (.env)
Create \`server/.env\` with the following variables:
\`\`\`ini
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/zosh_bazaar
JWT_SECRET=your_super_secret_jwt_key_minimum_32_chars
JWT_REFRESH_SECRET=your_super_secret_refresh_key
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
CLIENT_URL=http://localhost:3000
SELLER_URL=http://localhost:3001
ADMIN_URL=http://localhost:3002
LOGISTICS_URL=http://localhost:3003
DELIVERY_URL=http://localhost:3004
\`\`\`

### Booting the Development Stack
\`\`\`bash
# 1. Install dependencies
npm run install:all

# 2. Start the Express API server (port 5000)
cd server
npm run dev

# 3. Access documentation & tools
# Swagger UI:       http://localhost:5000/api-docs
# Developer Portal: http://localhost:5000/docs
# OpenAPI JSON:     http://localhost:5000/api-docs/openapi.json
# OpenAPI YAML:     http://localhost:5000/api-docs/openapi.yaml
# Email Studio:     http://localhost:5000/dev/emails
\`\`\`
    `
  },
  {
    id: "security-rbac",
    title: "Authentication & RBAC Matrix",
    category: "Security & Access",
    badge: "Security",
    content: `
# Authentication & Role-Based Access Control (RBAC)

Zosh Bazaar enforces multi-layered authorization across token layers, authentication middlewares, and domain resource ownership checkers.

### Authentication Mechanisms
- **Customer & Admin JWT**: Transmitted via \`Authorization: Bearer <token>\` header. Validated by \`authMiddleware\` and \`authenticateUser\`.
- **Seller JWT**: Validated by \`sellerAuthMiddleware\`. Extracts seller account ID and enforces store tenant boundaries.
- **Delivery Partner JWT**: Validated by \`deliveryPartnerAuthMiddleware\`. Verifies courier identity, license validity, and vehicle registration.
- **Razorpay Webhook HMAC**: Authenticated using cryptographic signature in \`X-Razorpay-Signature\` header computed against the raw request body.

### Role-Permission Matrix

| Resource Domain | Public / Guest | Customer (\`ROLE_CUSTOMER\`) | Seller (\`ROLE_SELLER\`) | Logistics Operator (\`ROLE_LOGISTICS\`) | Delivery Partner (\`ROLE_DELIVERY\`) | Admin (\`ROLE_ADMIN\`) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Catalog & Products** | Read Only | Read Only | Manage Own | Read Only | Read Only | Full Audit / Moderate |
| **Cart & Wishlist** | None | Own Items Only | None | None | None | None |
| **Orders & Checkout** | None | Create & View Own | View / Update Own Line Items | View Fulfillment State | View Assigned Stops | Full Visibility / Override |
| **Payments & Refunds** | None | Initiate & Pay Own | View Settlements | None | Record COD Collection | Trigger Manual Refunds / Ledger View |
| **Store & Inventory** | Read Public Profile | Read Public Profile | Full CRUD Own Store | Read Stock Levels | None | Suspend / Approve Store |
| **Hubs & Dispatch** | Check Pincode | Check Tracking | View Pickup Manifest | Full Network Control | View Assigned Manifest | Control Tower Oversight |
| **Route Stops & POD** | Tracking Status | View Live ETA | View Delivery Proof | Reassign Route | Update Stop / OTP Verification | Audit Delivery Trails |
| **System Settings** | None | None | None | None | None | Full Admin Configuration |

### Negative Security Constraints
1. **Cross-Tenant Isolation**: Sellers cannot read, modify, or cancel orders belonging to other sellers. Attempted violations return \`403 Forbidden\`.
2. **Order Tampering Prevention**: Customers cannot view or modify orders belonging to another user ID.
3. **Delivery Route Protection**: Delivery partners can only access the specific route stop assigned to their agent ID.
4. **Maker-Checker Balance Invariant**: Admin financial overrides require audit trail logging and cannot directly manipulate customer ledger accounts without an offsetting transaction.
    `
  },
  {
    id: "payments-ledger",
    title: "Financial Engine & Double-Entry Ledger",
    category: "Financial Engine",
    badge: "Financial",
    content: `
# Financial Architecture & Double-Entry Ledger

Zosh Bazaar processes financial operations with institutional-grade safeguards, combining Razorpay gateway integration, integer paise monetary arithmetic, and double-entry accounting.

### 1. Integer Paise Arithmetic
To eliminate floating-point rounding bugs common in currency arithmetic (\`0.1 + 0.2 !== 0.3\`), all monetary values throughout the database, business services, and APIs are expressed in **integer paise**:
- ₹1.00 = \`100\` paise
- ₹499.50 = \`49950\` paise
- ₹10,000.00 = \`1000000\` paise

### 2. Payment Lifecycle State Machine
\`\`\`
                 [ Customer Checkout ]
                           |
                           v
              [ POST /api/v1/payment/create ]
             (Generates Razorpay Order Intent)
                           |
            +--------------+--------------+
            |                             |
      Customer Pays                 Payment Fails / Abandoned
            |                             |
            v                             v
    [ Razorpay Gateway ]           [ Status: FAILED ]
            |                             |
            v                             v
  [ Webhook: payment.captured ]     Order Cancelled
   (HMAC-SHA256 Signature Verified)
            |
            v
  [ Double-Entry Ledger Entry ]
  - Debit: Gateway Clearing A/C
  - Credit: Customer Order Payable A/C
  - Credit: Marketplace Commission A/C
            |
            v
  [ Order Status: PLACED ]
  [ Stock Decremented ]
\`\`\`

### 3. Double-Entry Accounting Invariants
Every financial transaction posts balancing debits and credits in Indian Rupees (₹):
> **Core Balance Invariant (INR)**:
> **∑ Total Debits (₹) = ∑ Total Credits (₹)**

- **Customer Order**: Debit \`GATEWAY_RECEIVABLE\`, Credit \`SELLER_PAYABLE\`, Credit \`PLATFORM_COMMISSION\`.
- **Order Cancellation**: Debit \`SELLER_PAYABLE\`, Debit \`PLATFORM_COMMISSION\`, Credit \`GATEWAY_REFUND_PAYABLE\`.
- **Seller Settlement Payout**: Debit \`SELLER_PAYABLE\`, Credit \`BANK_DISBURSEMENT\`.

### 4. Idempotency & Webhook Verification
- Webhooks received at \`/api/v1/payment/webhook\` compute the expected signature:
  \`crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(rawBody).digest('hex')\`
- Duplicate event IDs from Razorpay are de-duplicated via atomic MongoDB upserts on \`webhookEventId\`.
    `
  },
  {
    id: "realtime-socket",
    title: "Socket.IO Real-time Architecture",
    category: "Real-time Hub",
    badge: "Realtime",
    content: `
# Socket.IO Real-Time Architecture & Event Directory

Zosh Bazaar incorporates an isolated real-time event hub powered by Socket.IO, delivering sub-second notifications for order updates, courier GPS pings, dispatch notifications, and control tower alerts.

### 1. Connection & Authentication Handshake
Clients connect to the root namespace with their JWT Bearer token:
\`\`\`javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
  auth: {
    token: "Bearer YOUR_JWT_ACCESS_TOKEN",
  },
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
});
\`\`\`

### 2. Tenant Room Boundary Isolation
Upon handshake authentication, clients are automatically assigned to isolated rooms based on their verified identity:
- **Customer Room**: \`customer_<userId>\`
- **Seller Room**: \`seller_<sellerId>\`
- **Delivery Agent Room**: \`agent_<agentId>\`
- **Control Tower Operations**: \`logistics_control_tower\`
- **Admin Cockpit**: \`admin_room\`

Clients cannot join or eavesdrop on rooms outside their cryptographic identity.

### 3. Complete Realtime Event Catalog

| Event Name | Direction | Authorized Roles | Description & Sample Payload |
| :--- | :---: | :---: | :--- |
| \`order:created\` | Server -> Client | Seller | Broadcast to \`seller_<sellerId>\` when a customer places an order. |
| \`order:status_updated\` | Server -> Client | Customer, Seller | Broadcast when fulfillment status transitions (\`CONFIRMED\`, \`SHIPPED\`, \`DELIVERED\`). |
| \`shipment:transitioned\` | Server -> Client | Logistics, Customer | Emitted when parcel scans update state (\`INBOUND_RECEIVE\`, \`OUT_FOR_DELIVERY\`). |
| \`delivery:location_ping\` | Client -> Server | Delivery Partner | Delivery agent broadcasts live GPS coordinate updates: \`{ lat: 12.9716, lng: 77.5946, routeId: "..." }\`. |
| \`delivery:agent_location\` | Server -> Client | Customer, Logistics | Real-time map broadcast of courier vehicle location. |
| \`delivery:otp_generated\` | Server -> Client | Customer | Dispatches one-time verification code to customer app upon courier arrival. |
| \`notification:push\` | Server -> Client | Any User | Instant in-app notification badge ping. |
    `
  },
  {
    id: "portal-customer",
    title: "Customer Application Guide",
    category: "Application Portals",
    badge: "client",
    content: `
# Customer Web Application (\`client\`)

The Customer Portal (\`client\`) provides an immersive, omnichannel storefront delivering lightning-fast product discovery, dynamic variant customization, synchronized bag management, multi-rail Razorpay checkout, live courier GPS tracking, and an integrated account management center. Built with React 19, TypeScript, TailwindCSS v4, Vite, and Redux Toolkit.

### Application Route Directory
| Route Path | View Component | Access Tier | Architectural Role & Capabilities |
| :--- | :--- | :--- | :--- |
| \`/\` | \`Home\` | Public Storefront | Curated hero carousels, category discovery reels, flash deals, and personalized product recommendations. |
| \`/products\` & \`/products/:categoryId\` | \`Products\` | Public Storefront | Faceted search catalog, brand filters, price sliders, discount thresholds, and rating filters. |
| \`/product-details/:productId\` | \`ProductDetails\` | Public Storefront | Dynamic variant selector (size, color, storage), real-time stock matrix, pincode delivery SLA, and verified UGC reviews. |
| \`/cart\` | \`Cart\` | Public / Hybrid | Server-synced shopping cart, line-item quantity modifiers, real-time inventory reservation, and subtotal breakdown. |
| \`/search\` | \`SearchResults\` | Public Storefront | Debounced full-text autocomplete search powered by \`/api/v1/product/search\`. |
| \`/wishlist\` | \`Wishlist\` | Authenticated | Saved product collections with optimistic toggle states and out-of-stock notification triggers. |
| \`/wishlist/shared/:shareToken\` | \`SharedCollectionView\` | Public View | Socially shareable customer wishlist collections. |
| \`/login\` & \`/signup\` | \`Auth\` | Guest Only | OTP phone authentication, email/password credentials, and secure JWT session creation. |
| \`/become-seller\` | \`BecomeSeller\` | Public Landing | Merchant acquisition funnel bridging customers to the seller onboarding suite. |
| \`/checkout\` & \`/checkout/address\` | \`Checkout\` | Customer Auth | Delivery address selector/creator, coupon redemption engine, and Razorpay modal payment launchpad. |
| \`/payment-success/:orderId\` | \`PaymentSuccess\` | Customer Auth | Payment confirmation, atomic transaction summary, and live tracking launchpad. |
| \`/orders\` & \`/order/:orderId\` | \`Order\` / \`OrderDetails\` | Customer Auth | 5-stage fulfillment stepper, live courier GPS beacon map, delivery OTP gate, and 1-click cancellation. |
| \`/account/*\` | \`Profile\` (Nested Hub) | Customer Auth | 15 specialized tabs: Overview, Orders, Returns, Buy Again, Recently Viewed, Addresses, Payments, Coupons, Notifications, Notification Preferences, Profile, Security, Sessions, Privacy, and AI Concierge. |

### End-to-End Operational Workflows
1. **Catalog Browsing & Semantic Faceted Search**:
   - Debounced input queries trigger \`/api/v1/product/search\` with token normalization.
   - Faceted filtering across 3-tier category taxonomy, brand arrays, price bounds, and rating thresholds.
   - Responsive pagination with cached query keys preventing repeated network requests.
2. **Product Details & Variant SKU Matrix**:
   - Client resolves exact SKU by matching active variant permutations (e.g., Color: Midnight Black + Size: XL).
   - Live delivery SLA estimation queried against \`/api/v1/logistics/pincode/:pincode\` verifying serviceability and COD eligibility.
3. **Persistent Server-Synchronized Cart**:
   - Redux Toolkit provides optimistic local state updates while synchronizing with \`/api/v1/cart\`.
   - Automatic stock reservation safeguards prevent checkout attempts on out-of-stock items.
4. **Checkout, Coupon Redemption & Razorpay Multi-Rail Payment**:
   - Customer selects or creates delivery address via \`/api/v1/account/addresses\`.
   - Coupon redemption against \`/api/v1/coupon/apply\` with real-time cart minimum validations.
   - Client calls \`/api/v1/payment/create-intent\` to initialize the payment attempt and generate a Razorpay order.
   - Razorpay checkout modal opens with support for UPI (Google Pay, PhonePe), Cards, Netbanking, and COD.
   - Upon success, client posts payment ID, order ID, and signature to \`/api/v1/payment/verify-signature\` for atomic ledger recording.
5. **Real-Time Fulfillment Stepper & GPS Courier Beacon**:
   - Visual 5-stage tracking stepper (\`PLACED\` -> \`CONFIRMED\` -> \`SHIPPED\` -> \`OUT_FOR_DELIVERY\` -> \`DELIVERED\`).
   - Socket.IO client listens to \`delivery:agent_location\` to project real-time courier vehicle coordinates on Leaflet/Mapbox maps.
   - 4-digit zero-trust OTP is displayed to the customer to facilitate secure delivery handover.
6. **Automated Cancellations & Post-Purchase UGC Reviews**:
   - 1-click order cancellation with automated refund dispatch to original payment rail.
   - Verified customer review submissions with star ratings and multi-photo upload to Cloudinary.
   - Conversational AI Shopping Concierge (\`/account/chat\`) providing personalized product advice and order support.

### Primary API Contracts Directory
| Method & Endpoint | Auth Role | Description & Primary Parameters |
| :--- | :--- | :--- |
| \`POST /api/v1/auth/login\` | Guest | Customer authentication returning JWT token. |
| \`GET /api/v1/product\` | Public | Paginated product catalog with category, brand, and price filters. |
| \`GET /api/v1/product/search\` | Public | Debounced text autocomplete and search. |
| \`GET /api/v1/cart\` & \`POST /api/v1/cart/add\` | Customer | Synchronize and append items to customer bag. |
| \`POST /api/v1/coupon/apply\` | Customer | Validate coupon code and calculate discount. |
| \`POST /api/v1/order/create\` | Customer | Create order with delivery address and line items. |
| \`POST /api/v1/payment/create-intent\` | Customer | Initialize payment intent with Razorpay. |
| \`POST /api/v1/payment/verify-signature\` | Customer | Verify Razorpay cryptographic signature. |
| \`GET /api/v1/order/my-orders\` | Customer | Retrieve past orders with status and item details. |
| \`POST /api/v1/review/create\` | Customer | Submit verified UGC review with photo assets. |

### Real-Time WebSockets & Telemetry Hub
| Event Name | Direction | Payload & Action |
| :--- | :--- | :--- |
| \`order:status_updated\` | Server -> Client | Notifies client of status transitions (\`CONFIRMED\`, \`SHIPPED\`, \`OUT_FOR_DELIVERY\`, \`DELIVERED\`). |
| \`delivery:agent_location\` | Server -> Client | Broadcasts \`{ lat, lng, speed, heading }\` to render live courier icon on tracking map. |
| \`delivery:otp_generated\` | Server -> Client | Dispatches 4-digit verification code to customer screen. |
| \`notification:push\` | Server -> Client | In-app notification badge ping for order updates and promo alerts. |
    `
  },
  {
    id: "portal-seller",
    title: "Seller Portal & Operations Guide",
    category: "Application Portals",
    badge: "seller",
    content: `
# Seller Portal & Operations (\`seller\`)

The Seller Portal (\`seller\`) empowers registered merchants to manage multi-channel commerce operations: onboarding and KYC compliance, catalog curation, inventory control, order fulfillment, shipping label generation, reverse logistics, and double-entry settlement finances. Built with React 19, TypeScript, TailwindCSS v4, Vite, and Redux Toolkit.

### Application Route Directory
| Route Path | View Component | Access Tier | Architectural Role & Capabilities |
| :--- | :--- | :--- | :--- |
| \`/login\` & \`/register\` | \`SellerLogin\` / \`SellerRegister\` | Guest Only | Merchant login and multi-step KYC onboarding (GSTIN, PAN, Bank IFSC, Pickup Address). |
| \`/\` | \`Dashboard\` | Merchant Auth | Executive dashboard: GMV counters, pending orders, critical stock alerts, fulfillment velocity metrics. |
| \`/ai\` & \`/ai-insights\` | \`AIInsightsCenter\` | Merchant Auth | Gemini-powered analytics: price elasticity suggestions, demand forecasts, and SEO catalog enhancements. |
| \`/products\` | \`ProductList\` | Merchant Auth | Merchant catalog directory: listing status, price, inventory levels, category filtering, and bulk status updates. |
| \`/products/new\` & \`/products/:id/edit\` | \`ProductEditor\` | Merchant Auth | Multi-image Cloudinary drag-and-drop uploader, 3-tier category selector, and variant matrix generator. |
| \`/inventory\` | \`InventoryCenter\` | Merchant Auth | Low-stock thresholds, SKU buffer alerts, and bulk quantity updates across warehouse locations. |
| \`/orders\` | \`OrderList\` | Merchant Auth | Order fulfillment Kanban board: order confirmation, printable AWB shipping labels, and dispatch manifest generator. |
| \`/returns\` | \`ReturnsCenter\` | Merchant Auth | Return request triage, customer dispute resolution, inspection recording, and refund approvals. |
| \`/finances\` | \`FinancesPage\` | Merchant Auth | Double-entry ledger statements: gross sales, platform commission deductions, TDS withholding, and net payout transfers. |
| \`/store\` | \`StoreProfile\` | Merchant Auth | Merchant profile configuration: store branding, pickup warehouse address, GSTIN/PAN info, and verified bank payout account. |

### End-to-End Operational Workflows
1. **Merchant Onboarding & KYC Regulatory Compliance**:
   - Merchant submits legal business details, 15-digit GSTIN, PAN, bank IFSC account, and pickup warehouse address with valid pincode.
   - Account enters \`PENDING\` state until Admin compliance team completes document verification.
2. **Product Catalog Creation & Dynamic Variant Matrix**:
   - Drag-and-drop image upload direct to Cloudinary with automatic CDN optimization.
   - Category taxonomy tree resolution (Level 1 Parent -> Level 2 Sub -> Level 3 Leaf).
   - SKU generator dynamically creates child variants with individual MRP, selling price, and warehouse stock units.
   - AI-assisted catalog enhancer (\`/api/v1/seller/ai/enhance-description\`) optimizes product copy and SEO metadata.
3. **Order Fulfillment, Shipping Label Generation & Dispatch**:
   - Merchant receives instant real-time notification via Socket.IO \`order:created\`.
   - Merchant confirms order, moving state to \`CONFIRMED\`.
   - Printable PDF Shipping Label (Air Waybill / AWB) generated with scannable barcode via \`/api/v1/seller/orders/:id/label\`.
   - Merchant generates dispatch manifest and hands parcel to logistics courier during pickup scan.
4. **Reverse Logistics & Return Dispute Triage**:
   - Inbound return requests received in \`/returns\` with customer-submitted reason codes and defect photos.
   - Merchant conducts physical inspection upon receipt and approves refund or escalates quality dispute to Admin arbitration.
5. **Financial Ledger Settlements & Bank Payouts**:
   - Real-time double-entry accounting records: Gross Sales credited to Merchant Payable, Platform Commission (e.g. 5-15%) debited, TDS withheld.
   - Periodic automated payout disbursements transferred directly to verified bank IFSC account.

### Primary API Contracts Directory
| Method & Endpoint | Auth Role | Description & Primary Parameters |
| :--- | :--- | :--- |
| \`POST /api/v1/seller/auth/register\` | Guest | Merchant registration with KYC business and tax details. |
| \`POST /api/v1/seller/auth/login\` | Guest | Merchant authentication returning Seller JWT token. |
| \`GET /api/v1/seller/dashboard/metrics\` | Seller | Real-time counters: GMV, pending orders, low stock count. |
| \`GET /api/v1/seller/product\` & \`POST /api/v1/seller/product\` | Seller | Fetch and create product listings with variant matrices. |
| \`PUT /api/v1/seller/inventory/update\` | Seller | Bulk update stock quantities and threshold warnings. |
| \`GET /api/v1/seller/order\` | Seller | Filter orders by fulfillment status (\`PENDING\`, \`CONFIRMED\`, \`SHIPPED\`). |
| \`PATCH /api/v1/seller/order/:id/status\` | Seller | Advance order state (\`CONFIRMED\`, \`READY_FOR_PICKUP\`). |
| \`GET /api/v1/seller/finance/settlements\` | Seller | Access ledger payout records, commission deductions, and net balance. |
| \`POST /api/v1/seller/ai/insights\` | Seller | Gemini AI price suggestions and inventory forecasts. |

### Real-Time WebSockets & Telemetry Hub
| Event Name | Direction | Payload & Action |
| :--- | :--- | :--- |
| \`order:created\` | Server -> Client | Real-time audio and visual alert when customer places an order. |
| \`order:cancelled\` | Server -> Client | Alert to immediately cease packing and cancel shipment. |
| \`shipment:transitioned\` | Server -> Client | Notification when logistics courier completes pickup scan. |
    `
  },
  {
    id: "portal-admin",
    title: "Admin Console & Governance Guide",
    category: "Application Portals",
    badge: "admin",
    content: `
# Admin Console & Governance (\`admin\`)

The Admin Console (\`admin\`) serves as the central mission control and platform governance hub for Zosh Bazaar. It provides platform operators with complete oversight of merchant KYC approvals, 3-tier catalog taxonomies, content moderation, double-entry financial ledger auditing, campaign merchandising, and system configuration. Built with React 19, TypeScript, TailwindCSS v4, Vite, and Redux Toolkit.

### Application Route Directory
| Route Path | View Component | Access Tier | Architectural Role & Capabilities |
| :--- | :--- | :--- | :--- |
| \`/login\` | \`AdminLogin\` | Guest Only | Privileged administrator authentication with role-based claim enforcement. |
| \`/\` | \`Dashboard\` | Admin Auth | Platform-wide KPI telemetry: Total Gross GMV, active users, merchant count, system health, revenue trajectory. |
| \`/ai\` | \`AdminAICenter\` | Admin Auth | Platform-level AI cockpit: anomaly detection, fraud analysis, high-risk merchant alerts, revenue forecasting. |
| \`/sellers\` | \`Sellers\` | Admin Auth | Merchant KYC verification table, tax document inspector, approval/rejection modal with reason codes. |
| \`/orders\` | \`Orders\` | Admin Auth | System-wide order auditor, fulfillment timeline inspector, manual order status overrides. |
| \`/products\` | \`Products\` | Admin Auth | Global catalog moderation table, policy takedown switches, verified quality badges. |
| \`/products/create\` & \`/products/:id/edit\` | \`ProductForm\` | Admin Auth | Administrative catalog authoring and intervention interface. |
| \`/categories\` | \`CategoryManager\` | Admin Auth | 3-tier taxonomy tree manager (Level 1 Parent, Level 2 Subcategory, Level 3 Leaf category). |
| \`/brands\` | \`Brands\` | Admin Auth | Brand registry directory, official brand badges, trademark ownership validation. |
| \`/inventory\` | \`InventoryManager\` | Admin Auth | Global multi-merchant warehouse stock inspector and out-of-stock risk monitor. |
| \`/reviews\` | \`ReviewModeration\` | Admin Auth | UGC review moderation: offensive language filter, spam report resolution, photo inspection. |
| \`/customers\` | \`Customers\` | Admin Auth | Customer directory, account status toggles (active/suspended), address book inspection. |
| \`/coupons\` | \`Coupons\` | Admin Auth | Campaign coupon creator: discount percentages, fixed amounts, minimum order cart criteria, usage caps. |
| \`/deals\` | \`Deals\` | Admin Auth | Flash sales, homepage spotlight deals, scheduled promotion countdowns. |
| \`/storefront-banners\` | \`HomeCategories\` | Admin Auth | Storefront homepage layout builder, hero banner carousel curation, category tile ordering. |
| \`/transactions\` | \`Transactions\` | Admin Auth | Double-entry ledger audit inspector, payment reconciliation, mismatch alerts, manual refund overrides. |
| \`/settings\` | \`PlatformSettings\` | Admin Auth | Platform commission percentages, tax parameters, maintenance mode toggle, service integrations. |

### End-to-End Governance Workflows
1. **Merchant KYC Verification & Regulatory Approval**:
   - Review submitted GSTIN tax documents, PAN cards, bank certificates, and warehouse pickup addresses.
   - Admin approves merchant (\`APPROVED\`), activating their storefront listings, or rejects (\`REJECTED\`) with specific regulatory reason codes.
2. **3-Tier Taxonomy & Brand Registry Management**:
   - Maintain clean category hierarchy (e.g. Fashion -> Men's Wear -> Casual Shirts) to ensure smooth customer filtering.
   - Verify brand trademark documentation and assign verified brand badges.
3. **Storefront Merchandising & Campaign Management**:
   - Curate homepage hero banners and deal carousels displayed on customer storefront (\`client\`).
   - Create platform-funded discount coupons with minimum cart thresholds and automated expiry triggers.
4. **Double-Entry Ledger Auditing & Dispute Arbitration**:
   - Inspect balanced debit/credit journal entries (\`/api/v1/admin/ledger/entries\`) verifying zero reconciliation leakage.
   - Arbitrate customer-seller disputes with authority to trigger manual bank refunds or withhold merchant settlement balances.

### Primary API Contracts Directory
| Method & Endpoint | Auth Role | Description & Primary Parameters |
| :--- | :--- | :--- |
| \`POST /api/v1/admin/auth/login\` | Guest | Privileged administrator session login. |
| \`GET /api/v1/admin/dashboard/stats\` | Admin | Macro platform analytics: Gross GMV, order volume, active merchants. |
| \`GET /api/v1/admin/sellers/pending\` | Admin | Retrieve pending merchant KYC applications. |
| \`PATCH /api/v1/admin/sellers/:id/approve\` | Admin | Approve or reject merchant with reason code. |
| \`GET /api/v1/admin/categories\` & \`POST /api/v1/admin/categories\` | Admin | CRUD operations for 3-tier taxonomy nodes. |
| \`GET /api/v1/admin/coupons\` & \`POST /api/v1/admin/coupons\` | Admin | Create promotional discount campaigns. |
| \`GET /api/v1/admin/ledger/audit\` | Admin | Inspect double-entry journal entries and reconciliation reports. |
| \`POST /api/v1/admin/refunds/override\` | Admin | Execute manual refund dispatch overriding automated logic. |
| \`PATCH /api/v1/admin/settings\` | Admin | Update commission tiers and platform operational variables. |

### Real-Time Monitoring & Telemetry
| Event Name | Direction | Payload & Action |
| :--- | :--- | :--- |
| \`system:alert\` | Server -> Client | Critical alerts for ledger reconciliation discrepancies or payment gateway anomalies. |
| \`admin:audit_trail\` | Internal | Immutable system logging recording every administrative change and override. |
    `
  },
  {
    id: "portal-logistics",
    title: "Logistics Control Tower Guide",
    category: "Application Portals",
    badge: "logistics",
    content: `
# Logistics Control Tower (\`logistics\`)

The Logistics Control Tower (\`logistics\`) orchestrates the physical supply chain: from first-mile merchant pickups to mid-mile linehaul sortation between mother hubs, and last-mile courier route clustering. It features an interactive GPS control tower map, hardware barcode scanning, automated route planner, and Non-Delivery Report (NDR) triage. Built with React 19, TypeScript, TailwindCSS v4, Vite, and Redux Toolkit.

### Application Route Directory
| Route Path | View Component | Access Tier | Architectural Role & Capabilities |
| :--- | :--- | :--- | :--- |
| \`/login\` | \`LogisticsLogin\` | Guest Only | Logistics operator authentication with dispatch management privileges. |
| \`/\` | \`ControlTowerOverview\` | Operator Auth | Hub throughput metrics, active linehaul manifests, pending parcel count, SLA breach risk alerts. |
| \`/operations\` | \`LiveOperationsBoard\` | Operator Auth | Real-time Kanban board sorting parcels across stages: Pickup, Inbound, Sortation, Outbound, Out-for-Delivery, Delivered. |
| \`/map\` | \`LiveMapControlTower\` | Operator Auth | Interactive geospatial map (Leaflet/Mapbox) rendering active courier vehicles, distribution hubs, and live GPS telemetry. |
| \`/shipments\` & \`/shipments/:id\` | \`ShipmentList\` / \`ShipmentDetail\` | Operator Auth | Shipment master registry: tracking timeline, AWB number, origin/destination hubs, assigned courier, delivery proofs. |
| \`/scanner\` | \`PackageScanner\` | Operator Auth | High-velocity barcode/QR scanner for inbound receiving, sortation binning, and outbound linehaul bagging. |
| \`/manifests\` | \`ManifestsHub\` | Operator Auth | Inbound and outbound linehaul vehicle manifests, vehicle seal numbers, driver assignment, trip dispatch. |
| \`/hubs\` | \`HubsManagement\` | Operator Auth | Mother distribution hubs, local delivery stations, facility capacity, manager contacts. |
| \`/zones\` | \`DeliveryZones\` | Operator Auth | Pincode serviceability matrix, transit SLAs in hours/days, Cash-on-Delivery coverage flags. |
| \`/agents\` | \`DeliveryAgentsList\` | Operator Auth | Courier fleet roster, duty statuses, active assigned loads, contact details. |
| \`/routes\` | \`RoutePlanner\` | Operator Auth | Dynamic route clustering engine grouping stops by geospatial proximity and courier vehicle capacity. |
| \`/exceptions\` | \`ExceptionsCenter\` | Operator Auth | Non-Delivery Reports (NDR) triage, customer unavailable resolutions, address correction, RTO execution. |
| \`/sla\` | \`SlaCommandCenter\` | Operator Auth | Delivery SLA tracking, breach risk indicators, performance benchmarking. |
| \`/returns\` | \`ReturnsHub\` | Operator Auth | Reverse logistics parcel tracking from customer doorstep back to merchant warehouse. |
| \`/analytics\` | \`LogisticsAnalytics\` | Operator Auth | First-mile and last-mile efficiency metrics, courier delivery velocity, delivery success rates. |

### End-to-End Logistics Workflows
1. **Hub Network & Pincode Serviceability Matrix**:
   - Configure network nodes: Mother Distribution Centers (MDCs) and Local Delivery Stations (LDSs).
   - Maintain the pincode serviceability matrix defining transit SLAs, air vs surface modes, and COD eligibility.
2. **High-Velocity Barcode Sortation & Scanning**:
   - Optical camera and hardware USB barcode scanning via \`/api/v1/logistics/scan\`.
   - Supported scan transitions: \`INBOUND_RECEIVE\` (arrived at hub), \`SORT_TO_BIN\` (routed to delivery station), \`BAG_DISPATCH\` (consolidated into vehicle manifest), \`LINEHAUL_RECEIVE\` (received at destination hub).
3. **Linehaul Trip Manifest Creation & Inter-Hub Movement**:
   - Consolidate individual parcels into trip manifests (\`/api/v1/logistics/manifests\`) with assigned vehicle registration and tamper-evident container seal numbers.
   - Track mid-mile truck transit across national logistics corridors.
4. **Dynamic Route Clustering & Courier Allocation**:
   - Algorithmic clustering groups out-for-delivery packages by geospatial radius and vehicle constraints into optimized runs (\`/api/v1/logistics/routes/cluster\`).
   - Assign clustered routes to active delivery couriers.
5. **Non-Delivery Report (NDR) & RTO Exception Resolution**:
   - When a delivery fails (customer unavailable, door locked, incorrect address), courier logs an exception triggering an NDR ticket in \`/exceptions\`.
   - Automated customer outreach (IVR / WhatsApp) collects reschedule preferences or updated landmarks.
   - If 3 delivery attempts are exhausted, the parcel is flagged for Return-to-Origin (\`RTO_INITIATED\`) and routed back to the merchant.

### Primary API Contracts Directory
| Method & Endpoint | Auth Role | Description & Primary Parameters |
| :--- | :--- | :--- |
| \`POST /api/v1/logistics/scan\` | Operator | High-speed barcode scanning triggering parcel state transitions. |
| \`GET /api/v1/logistics/shipments\` | Operator | Paginated shipment registry with status, hub, and courier filters. |
| \`POST /api/v1/logistics/manifests\` | Operator | Generate and seal inter-hub linehaul manifests. |
| \`POST /api/v1/logistics/routes/generate\` | Operator | Execute geospatial clustering to produce optimized courier delivery runs. |
| \`GET /api/v1/logistics/hubs\` & \`POST /api/v1/logistics/hubs\` | Operator | Manage distribution centers and local delivery stations. |
| \`PATCH /api/v1/logistics/exceptions/:id\` | Operator | Resolve NDR tickets (schedule re-attempt or trigger RTO). |
| \`GET /api/v1/logistics/telemetry/live-fleet\` | Operator | Retrieve real-time coordinates of active delivery fleet. |

### Real-Time Telemetry & Fleet Coordinates
| Event Name | Direction | Payload & Action |
| :--- | :--- | :--- |
| \`delivery:location_ping\` | Client -> Server | Ingests live courier GPS coordinates \`{ lat, lng, heading, speed }\`. |
| \`delivery:agent_location\` | Server -> Client | Broadcasts live courier locations to Control Tower operations map. |
| \`shipment:transitioned\` | Server -> Client | Pushes instantaneous parcel status changes to live operations Kanban board. |
    `
  },
  {
    id: "portal-delivery",
    title: "Delivery Partner Mobile Portal Guide",
    category: "Application Portals",
    badge: "delivery-partner",
    content: `
# Delivery Partner Courier Portal (\`delivery-partner\`)

The Delivery Partner Portal (\`delivery-partner\`) is a mobile-first Progressive Web App (PWA) tailored for on-the-ground couriers and delivery drivers navigating busy urban delivery routes. Designed for low latency, touch-optimized single-hand operation, offline resilience, and secure proof-of-delivery validation. Built with React 19, TypeScript, TailwindCSS v4, Vite, and Redux Toolkit.

### Application Route Directory
| Route Path | View Component | Access Tier | Architectural Role & Capabilities |
| :--- | :--- | :--- | :--- |
| \`/login\` | \`PartnerLogin\` | Guest Only | Courier authentication via mobile phone OTP or credentials. |
| \`/\` | \`ShiftDashboard\` | Courier Auth | One-tap duty toggle (\`ONLINE\`/\`OFFLINE\`), daily shift summary, loaded packages count, completed deliveries progress bar. |
| \`/route\` | \`RouteStopsList\` | Courier Auth | Sequential delivery stops HUD, ETA estimates, distance calculations, parcel type badges (Prepaid vs COD). |
| \`/stop/:stopId\` | \`ActiveDeliveryMode\` | Courier Auth | Active delivery cockpit: customer address, turn-by-turn navigation link, masked dialer, OTP verification gate, POD photo capture, digital signature canvas, COD cash collection. |
| \`/scanner\` | \`QuickPackageScanner\` | Courier Auth | Mobile camera-based parcel barcode scanner for morning hub parcel loading and doorstep verification. |
| \`/earnings\` | \`EarningsTransparency\` | Courier Auth | Daily delivered parcel incentives, base pay, tip breakdown, weekly payout transfer history. |
| \`/history\` | \`DeliveryHistory\` | Courier Auth | Archive of successfully delivered and returned packages with timestamps and proof documents. |
| \`/safety\` | \`SafetySupportHelp\` | Courier Auth | Emergency SOS button, 24/7 logistics helpline dialer, roadside accident assistance. |
| \`/profile\` | \`PartnerProfile\` | Courier Auth | Courier KYC details, vehicle registration, emergency contacts, rating score. |

### End-to-End Field Courier Workflows
1. **Shift Start & Hub Manifest Parcel Loading**:
   - Courier toggles Duty Status to \`ONLINE\` on \`/\`.
   - Courier uses \`/scanner\` to scan each physical package at the local delivery station, confirming load against their assigned manifest.
2. **Sequential Route Navigation & Customer Communication**:
   - Courier reviews the optimized delivery stop sequence in \`/route\`.
   - Selecting a stop opens \`ActiveDeliveryMode\` with 1-tap navigation opening Google Maps or Apple Maps.
   - 1-tap phone dialer connects via a privacy-preserving proxy number to call the customer without exposing personal numbers.
3. **Zero-Trust 4-Digit OTP Delivery Verification Gate**:
   - At the customer doorstep, courier requests the 4-digit verification OTP delivered to the customer's phone.
   - Courier submits the OTP via \`/api/v1/delivery-partner/stop/:id/verify-otp\`. Delivery handover cannot proceed without cryptographic OTP validation.
4. **Proof-of-Delivery (POD) Photo & Digital Signature**:
   - Device camera snaps a photo of the delivered parcel at the customer doorstep (uploaded to Cloudinary).
   - Customer provides digital signature directly on the HTML5 canvas signature pad.
5. **Cash-on-Delivery (COD) Collection & Ledger Entry**:
   - For COD parcels, the required cash amount is highlighted prominently in Indian Rupees (₹).
   - Courier logs cash received, instantaneously updating their physical cash custody ledger.
6. **Delivery Exception Handling (Customer Unavailable / Door Locked)**:
   - If customer is unreachable after mandatory 2 call attempts, courier selects failure reason (\`CUSTOMER_UNAVAILABLE\`, \`WRONG_ADDRESS\`, \`CUSTOMER_REFUSED\`).
   - The stop is rescheduled or flagged for NDR triage at the control tower.

### Primary API Contracts Directory
| Method & Endpoint | Auth Role | Description & Primary Parameters |
| :--- | :--- | :--- |
| \`POST /api/v1/delivery-partner/auth/login\` | Guest | Courier authentication with phone credentials. |
| \`PATCH /api/v1/delivery-partner/shift/toggle\` | Courier | Toggle courier duty state between \`ONLINE\` and \`OFFLINE\`. |
| \`GET /api/v1/delivery-partner/route/active\` | Courier | Retrieve today's assigned delivery route, stops, and packages. |
| \`POST /api/v1/delivery-partner/scan/load\` | Courier | Validate parcel barcode during morning hub loading. |
| \`POST /api/v1/delivery-partner/stop/:id/verify-otp\` | Courier | Cryptographically validate customer 4-digit handover OTP. |
| \`POST /api/v1/delivery-partner/stop/:id/complete\` | Courier | Complete delivery with POD image, digital signature, and COD amount. |
| \`POST /api/v1/delivery-partner/stop/:id/fail\` | Courier | Record delivery exception reason code. |
| \`POST /api/v1/delivery-partner/telemetry/ping\` | Courier | Stream background GPS coordinates. |
| \`GET /api/v1/delivery-partner/earnings\` | Courier | View daily commission payouts and performance bonuses. |

### Real-Time Telemetry & Geolocation Broadcasts
| Event Name | Direction | Payload & Action |
| :--- | :--- | :--- |
| \`delivery:location_ping\` | Client -> Server | Periodic GPS beacon broadcast (\`{ lat, lng, heading, speed, routeId }\`) sent to server. |
| \`delivery:otp_generated\` | Server -> Client | Notification received when OTP is dispatched to customer. |
| \`order:status_updated\` | Server -> Client | Confirmation broadcast when parcel transitions to \`DELIVERED\`. |
    `
  },
  {
    id: "error-handling",
    title: "Standard Error Envelopes & HTTP Codes",
    category: "Standards & Specifications",
    badge: "Standards",
    content: `
# Standard Response Envelopes & Error Handling

Zosh Bazaar APIs adhere to uniform response structures to ensure predictable client error handling and debugging.

### Standard Success Envelope
\`\`\`json
{
  "success": true,
  "message": "Operation completed successfully.",
  "data": { ... }
}
\`\`\`

### Standard Error Envelope
\`\`\`json
{
  "success": false,
  "error": true,
  "message": "Detailed human-readable error description.",
  "code": "RESOURCE_NOT_FOUND",
  "details": [
    { "field": "email", "issue": "Invalid email format" }
  ]
}
\`\`\`

### HTTP Status Code Conventions
- \`200 OK\`: Standard successful read or idempotent update.
- \`201 Created\`: Successful resource creation (Order, Product, Address).
- \`400 Bad Request\`: Malformed JSON, missing required fields, or validation constraint violations.
- \`401 Unauthorized\`: Missing, expired, or malformed JWT token.
- \`403 Forbidden\`: Authenticated user lacks permission to access the requested tenant resource.
- \`404 Not Found\`: Resource ID does not exist in the database.
- \`409 Conflict\`: State conflict (e.g., trying to cancel an already shipped order or duplicate email).
- \`422 Unprocessable Entity\`: Business rule invariant violated (e.g., insufficient stock or negative price).
- \`500 Internal Server Error\`: Unexpected server-side fault (automatically logged with stack trace in development).
    `
  }
];
