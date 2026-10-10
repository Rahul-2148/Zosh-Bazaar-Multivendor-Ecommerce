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
Every financial transaction posts balancing debits and credits:
$$\\sum \\text{Debits} = \\sum \\text{Credits}$$
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

The Customer Portal provides a modern, responsive e-commerce experience across desktop, tablet, and mobile browsers.

### Key Workflows
1. **Catalog Browsing & Search**:
   - Filter by categories, brands, price ranges, ratings, and discounts.
   - Text search with debounced autocomplete powered by \`/api/v1/product/search\`.
2. **Product Details & Variants**:
   - Dynamic variant picker (size, color, RAM/storage).
   - Real-time stock status, seller rating, and estimated delivery SLA by pincode.
3. **Cart & Wishlist Synchronization**:
   - Persistent server-synced cart (\`/api/v1/cart\`).
   - Wishlist toggle with optimistic UI updates.
4. **Checkout & Razorpay Payment**:
   - Multi-address selector (\`/api/v1/account/addresses\`).
   - Coupon code validation (\`/api/v1/coupon/apply\`).
   - Payment intent creation -> Razorpay Modal checkout -> Signature verification -> Confirmation page.
5. **Order Tracking & Management**:
   - Visual tracking stepper (\`PLACED\` -> \`CONFIRMED\` -> \`SHIPPED\` -> \`OUT_FOR_DELIVERY\` -> \`DELIVERED\`).
   - One-click order cancellation with automated refund initiation.
   - Customer review submission with multi-image Cloudinary upload.
    `
  },
  {
    id: "portal-seller",
    title: "Seller Portal & Operations Guide",
    category: "Application Portals",
    badge: "seller",
    content: `
# Seller Portal & Operations (\`seller\`)

The Seller Portal enables merchants to onboard their store, curate product catalogs, manage inventory, process customer orders, and track earnings.

### Key Workflows
1. **Seller Registration & KYC**:
   - Multi-step onboarding: Business details, GSTIN, PAN, bank account IFSC, and pickup warehouse address.
   - Account status starts in \`PENDING\` until Admin review.
2. **Product & Catalog Management**:
   - Multi-image drag-and-drop upload to Cloudinary.
   - Variant matrix builder: SKU generation, MRP, selling price, and stock levels.
3. **Order Fulfillment Pipeline**:
   - Filter orders by status: \`PENDING\`, \`CONFIRMED\`, \`SHIPPED\`, \`DELIVERED\`, \`CANCELLED\`.
   - Download shipping labels and generate dispatch manifests for logistics pickup.
4. **Financial Settlements & Analytics**:
   - Real-time revenue chart, total units sold, and return rates.
   - Settlement statements showing gross sales, marketplace commission deductions, and net payout disbursements.
    `
  },
  {
    id: "portal-admin",
    title: "Admin Console & Governance Guide",
    category: "Application Portals",
    badge: "admin",
    content: `
# Admin Console & Governance (\`admin\`)

The Admin Portal provides platform operators with centralized governance over users, sellers, catalogs, financial reconciliation, and system parameters.

### Key Workflows
1. **Seller Onboarding & KYC Moderation**:
   - Review submitted merchant applications, verify GSTIN/tax documents, and approve or reject with reason codes.
2. **Catalog Moderation**:
   - Flag inappropriate product listings, suspend violating sellers, and manage global category hierarchies.
3. **Financial Cockpit & Ledger Inspection**:
   - Double-entry ledger audit inspector, reconciliation mismatch alerts, and manual refund dispatch overrides.
4. **Platform Settings & Home Page Curation**:
   - Configure home screen banner carousels, featured deals, flash sales, and platform commission tiers.
    `
  },
  {
    id: "portal-logistics",
    title: "Logistics Control Tower Guide",
    category: "Application Portals",
    badge: "logistics",
    content: `
# Logistics Control Tower (\`logistics\`)

The Logistics Control Tower manages mid-mile linehaul movements, sortation hubs, pincode serviceability, and delivery exception resolution.

### Key Workflows
1. **Network Hubs & Serviceability Zones**:
   - Manage distribution centers and local delivery hubs.
   - Configure serviceable pincodes, standard transit SLAs, and COD eligibility.
2. **Manifests & Linehaul Dispatch**:
   - Aggregate parcels into dispatch manifests.
   - Inbound and outbound barcode scanner (\`/api/v1/logistics/scan\`) for high-velocity sortation.
3. **Automated Route Generation**:
   - Intelligent clustering of pending deliveries into optimized courier runs.
4. **Non-Delivery Reports (NDR) & Exceptions**:
   - Triage failed delivery attempts (customer unavailable, door locked, address not found).
   - Authorize re-attempts, return-to-origin (RTO), or address corrections.
    `
  },
  {
    id: "portal-delivery",
    title: "Delivery Partner Mobile Portal Guide",
    category: "Application Portals",
    badge: "delivery-partner",
    content: `
# Delivery Partner Courier Portal (\`delivery-partner\`)

A mobile-first web app tailored for on-the-ground couriers and delivery drivers navigating busy urban delivery routes.

### Key Workflows
1. **Shift Management**:
   - One-tap Duty Toggle (\`ONLINE\` / \`OFFLINE\`).
   - View assigned daily delivery run and total parcels loaded.
2. **Stop-by-Stop Navigation**:
   - Turn-by-turn customer address details with one-tap dialer for masked phone calls.
   - Live GPS beacon broadcasting agent coordinates to the customer tracking page.
3. **Secure Delivery Completion**:
   - Customer OTP verification to prevent parcel misplacement.
   - Proof-of-delivery (POD) photo capture and customer digital signature.
   - Cash-on-Delivery (COD) cash collection logging.
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
