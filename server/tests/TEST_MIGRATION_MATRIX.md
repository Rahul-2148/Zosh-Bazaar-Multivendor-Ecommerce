# ZOSH BAZAAR — COMPREHENSIVE TEST MIGRATION MATRIX & AUDIT BASELINE

> **Status**: Tracked Migration Blueprint & Coverage Gap Audit
> **Date**: October 16, 2026
> **Active Baseline Head**: `fc46e31e15dd05265e7994e0ebaecc58d524ca99` (Restored 19 Phase Test Suites)
> **Target Consolidation**: 4 Permanent Domain Suites (`marketplace.test.js`, `payment.test.js`, `orders.test.js`, `docs.test.js`)

---

## 1. Executive Summary & Restored Baseline

Following the audit directive, the premature test consolidation (which compressed 709 test assertions into 133 tests without a formal migration matrix) was cleanly reverted in commit `fc46e31`. The obsolete scratch script `server/test_delivery_partner_flow.mjs` containing hardcoded credentials was removed.

### Restored Baseline Test Execution (All 19 Files Passing)
Execution command: `npm --prefix server test` (executed in root/server with environment variables active).

| # | Test File Name | Tests Passed | Test Type & Primary Verification Focus |
|:---|:---|:---:|:---|
| 1 | `phase13Hardening.test.js` | **30** | HMAC webhook signature, payment state machine, canonical variant signature, media hierarchy, illustrative stock concurrency, room isolation. |
| 2 | `phase14Audit.test.js` | **82** | Socket.IO room isolation & event classification, duplicate webhook idempotency, illustrative inventory concurrency, seller tenant isolation, AI commerce security, immutable order item snapshots, order FSM. |
| 3 | `phase14_2MediaAudit.test.js` | **36** | Cloudinary authentication enforcement (401), multi-tenant namespace scoping (seller/admin/agent/customer), MIME type whitelist, 410 on local upload, static security scan. |
| 4 | `phase15PaymentPlatform.test.js` | **66** | Payment rails (UPI/CARD/NETBANKING/COD/WALLET), PaymentIntent/Attempt FSM, DistributedLock, IdempotencyManager, settlement calculation, customer wallet operations. |
| 5 | `phase16ProductionHardening.test.js` | **86** | 24 Failure injection scenarios (double checkout, idempotency conflict, stock exhaustion, payment timeout, duplicate webhook, wallet mutex, refund ceiling, payout UTR, reconciliation). |
| 6 | `phase17PaymentRailPlatform.test.js` | **48** | Rail adapters: UPI VPA validation, Card tokenization & Luhn check, NetBanking bank code mapping, COD limits & OTP, rail failover policy. |
| 7 | `phase18PaymentPlatform5.test.js` | **66** | Multi-rail orchestrator routing strategies, split payment (wallet + rail = total), double-entry ledger integration for splits. |
| 8 | `phase19PaymentPlatform6.test.js` | **11** | Live & sandbox Razorpay order creation and fetch, signature verification, missing credentials fail-closed diagnostics. |
| 9 | `phase20PaymentPlatform7.test.js` | **27** | Provider registry (Razorpay, Cashfree, PayU, PhonePe, Juspay), provider availability checks, timeout & 5xx gateway fallback. |
| 10 | `phase21PaymentPlatform8Certification.test.js` | **16** | PaymentProviderCertificationRunner: intent creation, payment verification, refund initiation, webhook handling across registered providers. |
| 11 | `phase22PaymentPlatform9.test.js` | **35** | Financial ledger chart of accounts (LedgerAccount enum), double-entry balance equality, chargeback/dispute lifecycle FSM, payout batch provider locking. |
| 12 | `phase23PaymentPlatform10.test.js` | **19** | Production fail-closed when live keys are unconfigured, Cashfree/PayU/PhonePe/Juspay adapter readiness checks. |
| 13 | `phase24PaymentPlatform11.test.js` | **22** | Email notification triggers, prepaid order shipping lock (paymentStatus === CAPTURED), COD cash collection logging, refund on cancellation. |
| 14 | `phase25PaymentPlatform12ReleaseGate.test.js` | **27** | Negative regression: webhook amount mismatch (10.10 vs 10.11), synthetic prod webhook block, unknown attempt rejection, currency mismatch, provider mismatch, unpaid prepaid ship lock, unverified beneficiary rejection, maker-checker self-approval conflict, provider failover block, exact paisa refund ceiling, ledger debit=credit equality, payout provider locking, ambiguous timeout recovery. |
| 15 | `phase26PaymentPlatform12_1Audit.test.js` | **21** | Sub-paisa fractional amount rejection (10.005, '50.055', 0.001), scientific notation rejection, negative/overflow rejection, ledger minor-unit conservation. |
| 16 | `phase27PaymentPlatform12_3Audit.test.js` | **21** | Monetary boundary values, IEEE-754 precision tolerance vs string injection, database document persistence (Wallet, Intent, Refund, Ledger, Batch), reconciliation discrepancy quarantine. |
| 17 | `phase28OpenApiDocsGate.test.js` | **10** | OpenAPI 3.1 specification validation (JSON/YAML parity, unique operationIds, zero broken `$ref`s, security schemes, Developer Portal UI). |
| 18 | `phase29SellerDetailsAndTaxInvoice.test.js` | **24** | Public seller profile DTO sanitization, authentic rating aggregation, GSTIN validation, HSN/SAC classification, seller tax regimes (Regular/Composition/Unregistered), statutory tax thresholds (Apparel/Footwear/Electronics/Books), place of supply (CGST+SGST vs IGST), invoice tenant isolation. |
| 19 | `phase30FullMarketplaceExperience.test.js` | **68** | Multi-seller buy box, multi-product comparison, price history & alerts, community Q&A moderation, crash-safe guest cart merge with atomic concurrency and frontend retry contract, optimistic concurrency versioning. |
| **Total** | **19 Suites** | **709** | **Complete Green Baseline (0 Failures)** |

---

## 2. Test Classification Taxonomy

To prevent misleading claims (such as claiming a JavaScript variable simulation represents database concurrency), all tests in the consolidated architecture are strictly classified into three categories:

1. **[UNIT] Pure Unit / In-Memory Logic**:
   - Tests pure functions, regexes, math conversions, or isolated state machines with zero database or network dependencies.
   - Example: `Money.toMinorUnits(10.10) === 1010`, `isValidOrderTransition(...)`, `TaxService.isValidGstin(...)`.
2. **[SERVICE_MOCK] Mocked Service Behavior**:
   - Tests service-layer business rules, guards, and orchestrations using mocked Mongoose model methods (`findOne`, `save`, `findByIdAndUpdate`) to verify fail-closed logic without requiring an active database daemon.
   - Example: `PaymentWebhookService.processWebhook` rejecting amount mismatch via mocked `PaymentAttempt.findOne`.
3. **[DB_INTEGRATION] Real Database Integration**:
   - Tests run against an isolated MongoDB instance (such as local `mongodb://127.0.0.1:27017/zosh-bazaar-test-isolated`) performing real atomic queries (`findOneAndUpdate` with `$gte` stock condition, `$inc` decrements, or multi-document sessions).
   - **Never connects to or mutates production Atlas clusters.**

---

## 3. Detailed Migration Matrix: Phase Suites to 4 Domain Suites

### Domain Suite 1: `server/tests/marketplace.test.js`
**Target Scope**: Product catalog, multi-seller buy box, offers, comparison, price history, Q&A moderation, guest cart merge, seller profile sanitization, GST calculation, invoices, and Cloudinary media security.
**Execution Command**: `npm run test:marketplace` (`node tests/marketplace.test.js`)

| Original File | Original Scenario / Test Name | Destination File | Replacement Test Name | Status | Classification |
|:---|:---|:---|:---|:---:|:---:|
| `phase30` | `ProductService.getOtherSellerOffers() rejects candidate with mismatched model, generation, storage, or packQuantity` | `marketplace.test.js` | Same | **Preserved** | `[SERVICE_MOCK]` |
| `phase30` | `ProductService.getOtherSellerOffers() returns null for unconfigured returnPolicy` | `marketplace.test.js` | Same | **Preserved** | `[SERVICE_MOCK]` |
| `phase30` | `ProductService.compareProducts() enforces minimum of 2 valid products & aligns specs` | `marketplace.test.js` | Same | **Preserved** | `[SERVICE_MOCK]` |
| `phase30` | `ProductService.getProductPriceHistory() returns zero fabricated points when empty` | `marketplace.test.js` | Same | **Preserved** | `[SERVICE_MOCK]` |
| `phase30` | `ProductService.getProductPriceHistory() queries variantId and returns variant-specific history` | `marketplace.test.js` | Same | **Preserved** | `[SERVICE_MOCK]` |
| `phase30` | `ProductService.updateProduct() persists authentic PriceHistory snapshot on price change` | `marketplace.test.js` | Same | **Preserved** | `[SERVICE_MOCK]` |
| `phase30` | `ProductService.updateProduct() rollback-save failure throws descriptive error` | `marketplace.test.js` | Same | **Preserved** | `[SERVICE_MOCK]` |
| `phase30` | `ProductService.updateProduct() concurrent update prevents stale rollback via CAS versioning` | `marketplace.test.js` | Same | **Preserved** | `[SERVICE_MOCK]` |
| `phase30` | `ProductService.askProductQuestion() enforces character minimum & pending moderation status` | `marketplace.test.js` | Same | **Preserved** | `[SERVICE_MOCK]` |
| `phase30` | `ProductService.answerProductQuestion() rejects non-owner seller & authenticates verified buyer` | `marketplace.test.js` | Same | **Preserved** | `[SERVICE_MOCK]` |
| `phase30` | `AdminService.getQuestionModerationQueue() sanitizes customer author details` | `marketplace.test.js` | Same | **Preserved** | `[SERVICE_MOCK]` |
| `phase30` | `CartService.mergeGuestCart() combines quantities safely without exceeding stock` | `marketplace.test.js` | Same | **Preserved** | `[SERVICE_MOCK]` |
| `phase30` | `CartService.mergeGuestCart() is idempotent and prevents duplicate additions on retry` | `marketplace.test.js` | Same | **Preserved** | `[SERVICE_MOCK]` |
| `phase30` | `CartService.mergeGuestCart() concurrent identical requests: active IN_PROGRESS throws 409 Conflict` | `marketplace.test.js` | Same | **Preserved** | `[SERVICE_MOCK]` |
| `phase30` | `CartService.mergeGuestCart() crash recovery of partial stock-capped application preserves remaining quantity` | `marketplace.test.js` | Same | **Preserved** | `[SERVICE_MOCK]` |
| `phase30` | `CartService.mergeGuestCart() partial-stock retry with actual frontend contract preserves remaining units` | `marketplace.test.js` | Same | **Preserved** | `[SERVICE_MOCK]` |
| `phase29` | `Public seller DTO strictly excludes private KYC, bank details, passwords, and private PAN` | `marketplace.test.js` | Same | **Preserved** | `[UNIT]` |
| `phase29` | `Ratings calculation does NOT fabricate 4.4 when review count is 0` | `marketplace.test.js` | Same | **Preserved** | `[UNIT]` |
| `phase29` | `GSTIN validator accepts valid 15-character Indian GSTINs and rejects invalid formats` | `marketplace.test.js` | Same | **Preserved** | `[UNIT]` |
| `phase29` | `HSN/SAC validator accepts 4 to 8 digit codes and rejects invalid formats` | `marketplace.test.js` | Same | **Preserved** | `[UNIT]` |
| `phase29` | `Seller Tax Regimes: Regular (Tax Invoice) vs Composition (Bill of Supply) vs Unregistered (Receipt)` | `marketplace.test.js` | Same | **Preserved** | `[UNIT]` |
| `phase29` | `Product Valuation Thresholds (Apparel/Footwear thresholds 5% vs 12%/18%, Electronics 18%, Books 0%)` | `marketplace.test.js` | Same | **Preserved** | `[UNIT]` |
| `phase29` | `Place of Supply: Intra-state (CGST+SGST) vs Inter-state (IGST) with exact paise conservation` | `marketplace.test.js` | Same | **Preserved** | `[UNIT]` |
| `phase29` | `Seller invoice view filters line items strictly to their own vendor package` | `marketplace.test.js` | Same | **Preserved** | `[SERVICE_MOCK]` |
| `phase14_2` | `uploadToCloudinary rejects unauthenticated caller with HTTP 401 AUTHENTICATION_REQUIRED` | `marketplace.test.js` | Same | **Preserved** | `[SERVICE_MOCK]` |
| `phase14_2` | `Unconfigured Cloudinary returns HTTP 503 CLOUDINARY_NOT_CONFIGURED with zero local disk writes` | `marketplace.test.js` | Same | **Preserved** | `[SERVICE_MOCK]` |
| `phase14_2` | `Seller upload is strictly jailed to server-derived sellerId and productId namespace` | `marketplace.test.js` | Same | **Preserved** | `[SERVICE_MOCK]` |
| `phase14_2` | `Legacy local disk uploadProductImages endpoint returns HTTP 410 Gone` | `marketplace.test.js` | Same | **Preserved** | `[SERVICE_MOCK]` |
| `phase14_2` | `mediaFileFilter accepts whitelisted image/video MIME types and rejects executables (.exe, .sh, .pdf)` | `marketplace.test.js` | Same | **Preserved** | `[UNIT]` |
| `phase14_2` | `Repository-wide scan: Absence of unsigned upload presets and CLOUDINARY_API_SECRET in frontend` | `marketplace.test.js` | Same | **Preserved** | `[UNIT]` |
| `phase13` | `Canonical Variant Identity Normalization: Case-insensitive, key-sorted signature generation` | `marketplace.test.js` | Same | **Preserved** | `[UNIT]` |
| `phase13` | `Media Fallback Hierarchy: Exact variant media -> Option media group -> Product default media` | `marketplace.test.js` | Same | **Preserved** | `[UNIT]` |

---

### Domain Suite 2: `server/tests/payment.test.js`
**Target Scope**: Money arithmetic, precision, bounds, state machines, webhook security, multi-rail adapters, double-entry ledger, wallet, refunds, settlements, and reconciliation.
**Execution Command**: `npm run test:payment` (`node tests/payment.test.js`)

| Original File | Original Scenario / Test Name | Destination File | Replacement Test Name | Status | Classification |
|:---|:---|:---|:---|:---:|:---:|
| `phase27` | `₹0.01 converts to exactly 1 paisa (both numeric and string)` | `payment.test.js` | Same | **Preserved** | `[UNIT]` |
| `phase27` | `₹10.10 converts to exactly 1010 paise (both numeric and string)` | `payment.test.js` | Same | **Preserved** | `[UNIT]` |
| `phase27` | `₹50.05 converts to exactly 5005 paise (both numeric and string)` | `payment.test.js` | Same | **Preserved** | `[UNIT]` |
| `phase27` | `₹100.10 converts to exactly 10010 paise (both numeric and string)` | `payment.test.js` | Same | **Preserved** | `[UNIT]` |
| `phase27` | `Configured Maximum ₹99,999,999.99 converts to exactly 9,999,999,999 paise` | `payment.test.js` | Same | **Preserved** | `[UNIT]` |
| `phase27` | `Strictly rejects sub-paisa amounts (10.005, 50.055, 0.001, '10.005')` | `payment.test.js` | Same | **Preserved** | `[UNIT]` |
| `phase27` | `Strictly rejects negative and zero amounts (when allowZero is false)` | `payment.test.js` | Same | **Preserved** | `[UNIT]` |
| `phase27` | `Strictly rejects overflow beyond MAX_MONETARY_AMOUNT` | `payment.test.js` | Same | **Preserved** | `[UNIT]` |
| `phase27` | `Strictly rejects scientific notation ('1e-4', '1e5', '1.05e2')` | `payment.test.js` | Same | **Preserved** | `[UNIT]` |
| `phase27` | `IEEE-754 binary floating addition (1.10 + 2.20) validates safely to 330 paise` | `payment.test.js` | Same | **Preserved** | `[UNIT]` |
| `phase27` | `Adversarial string literal '3.3000000000000003' is strictly rejected as malformed` | `payment.test.js` | Same | **Preserved** | `[UNIT]` |
| `phase27` | `Money.add and Money.subtract operate with exact integer paise precision` | `payment.test.js` | Same | **Preserved** | `[UNIT]` |
| `phase25` | `Negative: Webhook rejects minor-unit amount mismatch (e.g., 10.10 vs 10.11)` | `payment.test.js` | Same | **Preserved** | `[SERVICE_MOCK]` |
| `phase25` | `Negative: Synthetic MOCK/SANDBOX webhook is rejected in production mode` | `payment.test.js` | Same | **Preserved** | `[SERVICE_MOCK]` |
| `phase25` | `Negative: Webhook referencing non-existent payment attempt is rejected` | `payment.test.js` | Same | **Preserved** | `[SERVICE_MOCK]` |
| `phase25` | `Negative: Webhook rejects currency mismatch (e.g., attempt INR vs webhook USD)` | `payment.test.js` | Same | **Preserved** | `[SERVICE_MOCK]` |
| `phase25` | `Negative: Webhook rejects provider mismatch (attempt CASHFREE vs webhook via RAZORPAY)` | `payment.test.js` | Same | **Preserved** | `[SERVICE_MOCK]` |
| `phase14` | `Razorpay Webhook HMAC Signature & Idempotent Duplicate Event Processing` | `payment.test.js` | Same | **Preserved** | `[SERVICE_MOCK]` |
| `phase16` | `Double checkout click & same idempotency key returns cached response` | `payment.test.js` | Same | **Preserved** | `[SERVICE_MOCK]` |
| `phase16` | `Same idempotency key with different payload rejected with HTTP 409 Conflict` | `payment.test.js` | Same | **Preserved** | `[SERVICE_MOCK]` |
| `phase16` | `Payment timeout handling preserves safe TIMEOUT state without premature capture` | `payment.test.js` | Same | **Preserved** | `[SERVICE_MOCK]` |
| `phase23` | `RazorpayAdapter fails closed when live keys are unconfigured in production` | `payment.test.js` | Same | **Preserved** | `[SERVICE_MOCK]` |
| `phase25` | `Provider failover blocked while prior attempt is active` | `payment.test.js` | Same | **Preserved** | `[SERVICE_MOCK]` |
| `phase21` | `PaymentProviderCertificationRunner validates intent, verification, and refund per provider` | `payment.test.js` | Same | **Preserved** | `[SERVICE_MOCK]` |
| `phase20` | `Multi-provider adapter registry tests (Cashfree, PayU, PhonePe, Juspay)` | `payment.test.js` | Same | **Preserved** | `[SERVICE_MOCK]` |
| `phase25` | `Exact remaining balance refund succeeds down to the paisa (100.10 = 50.05 + 50.05)` | `payment.test.js` | Same | **Preserved** | `[SERVICE_MOCK]` |
| `phase25` | `Over-refund by even 1 paisa beyond remaining balance is strictly blocked` | `payment.test.js` | Same | **Preserved** | `[SERVICE_MOCK]` |
| `phase22` | `Dispute & chargeback state transitions (DISPUTE_OPEN, UNDER_REVIEW, WON, LOST)` | `payment.test.js` | Same | **Preserved** | `[UNIT]` |
| `phase25` | `Lost chargeback resolution debits SELLER_RESERVE to balance platform dispute account` | `payment.test.js` | Same | **Preserved** | `[SERVICE_MOCK]` |
| `phase25` | `Maker-checker prevents same operator self-approving critical discrepancy` | `payment.test.js` | Same | **Preserved** | `[SERVICE_MOCK]` |
| `phase25` | `Payout execution rejects dummy or unverified beneficiary` | `payment.test.js` | Same | **Preserved** | `[SERVICE_MOCK]` |
| `phase25` | `SettlementBatch locks payout provider to prevent cross-rail retry` | `payment.test.js` | Same | **Preserved** | `[SERVICE_MOCK]` |
| `phase25` | `Payout in production environment blocks synthetic or fake UTR settlement` | `payment.test.js` | Same | **Preserved** | `[SERVICE_MOCK]` |
| `phase25` | `Ambiguous payout timeout recovers to STATUS_CHECK_REQUIRED (no blind retry)` | `payment.test.js` | Same | **Preserved** | `[SERVICE_MOCK]` |
| `phase18` | `Multi-vendor settlement split identity guarantees zero leakage (Gross = Comm + GW + Tax + Net)` | `payment.test.js` | Same | **Preserved** | `[UNIT]` |
| `phase25` | `Ledger: Journal posting enforces strict debit-credit balance equality` | `payment.test.js` | Same | **Preserved** | `[SERVICE_MOCK]` |
| `phase25` | `Ledger: Duplicate journal posting returns existing entry idempotently` | `payment.test.js` | Same | **Preserved** | `[SERVICE_MOCK]` |
| `phase25` | `Reconciliation: BankStatementSftpAdapter durable deduplication prevents re-ingestion` | `payment.test.js` | Same | **Preserved** | `[UNIT]` |
| `phase27` | `Reconciliation: Flags unexplained difference without auto-rounding` | `payment.test.js` | Same | **Preserved** | `[UNIT]` |
| `phase24` | `Prepaid orders must not ship before confirmed payment; COD follows distinct delivery rules` | `payment.test.js` | Same | **Preserved** | `[SERVICE_MOCK]` |

---

### Domain Suite 3: `server/tests/orders.test.js`
**Target Scope**: Order state machine, real database atomic stock deduction, multi-tenant isolation, immutable snapshots, Socket.IO room security, and AI commerce security.
**Execution Command**: `npm run test:orders` (`node tests/orders.test.js`)

| Original File | Original Scenario / Test Name | Destination File | Replacement Test Name | Status | Classification |
|:---|:---|:---|:---|:---:|:---:|
| `phase14` | `Order state machine transition guards (Valid, Invalid, Terminal, Self)` | `orders.test.js` | Same | **Preserved** | `[UNIT]` |
| `phase14` | `Seller A authorized to update own order, strictly blocked from Seller B's order` | `orders.test.js` | Same | **Preserved** | `[UNIT]` |
| `phase14` | `Seller A authorized to mutate own product, strictly blocked from Seller B's product` | `orders.test.js` | Same | **Preserved** | `[UNIT]` |
| `phase14` | `Historical order item snapshot retains checkout price & details after vendor catalog mutation` | `orders.test.js` | Same | **Preserved** | `[UNIT]` |
| `phase14` | `Socket.IO Private Room Isolation: Guest blocked, Customer/Seller/Agent isolation, Admin supervision` | `orders.test.js` | Same | **Preserved** | `[UNIT]` |
| `phase14` | `Realtime event classification: PUBLIC vs SELLER/ADMIN/CUSTOMER/LOGISTICS/AGENT PRIVATE` | `orders.test.js` | Same | **Preserved** | `[UNIT]` |
| `phase14` | `AI commerce security: Guest blocked with AUTH_REQUIRED, order scoped to userId, price stripped` | `orders.test.js` | Same | **Preserved** | `[UNIT]` |
| `phase13/14` | *Illustrative in-memory variable `simulatedStock` deduction (5 & 10)* | `orders.test.js` | `Illustrative Logic: Pure JavaScript variable decrement simulation` | **Accurately Labeled** | `[UNIT]` (Labeled purely as illustrative logic) |
| `phase13` | *Illustrative local variable stock rollback in catch block* | `orders.test.js` | `Illustrative Logic: Local variable compensation simulation` | **Accurately Labeled** | `[UNIT]` (Labeled purely as illustrative logic) |
| **NEW** | *Real MongoDB atomic inventory deduction under concurrent checkout* | `orders.test.js` | `OrderService.createOrder() atomic stock deduction via Product.findOneAndUpdate({ countInStock: { $gte: qty } })` | **Strengthened** | `[DB_INTEGRATION]` (Real database atomic query on isolated test db) |
| **NEW** | *Real compensation rollback restoring deducted stock on order item failure* | `orders.test.js` | `OrderService.createOrder() transactional compensation rollback restores deducted catalog stock on item failure` | **Strengthened** | `[DB_INTEGRATION]` (Real database write and rollback verification) |

---

### Domain Suite 4: `server/tests/docs.test.js`
**Target Scope**: OpenAPI 3.1 specification validity, YAML/JSON parity, schema integrity, and Developer Portal router.
**Execution Command**: `npm run test:docs` (`node tests/docs.test.js`)

| Original File | Original Scenario / Test Name | Destination File | Replacement Test Name | Status | Classification |
|:---|:---|:---|:---|:---:|:---:|
| `phase28` | `OpenAPI specification artifacts exist in server/src/docs and root docs/` | `docs.test.js` | Same | **Preserved** | `[UNIT]` |
| `phase28` | `OpenAPI JSON artifact is valid JSON and adheres to version 3.1.0` | `docs.test.js` | Same | **Preserved** | `[UNIT]` |
| `phase28` | `OpenAPI YAML artifact parses valid YAML matching the JSON spec` | `docs.test.js` | Same | **Preserved** | `[UNIT]` |
| `phase28` | `All documented operation IDs across paths are strictly unique` | `docs.test.js` | Same | **Preserved** | `[UNIT]` |
| `phase28` | `Zero broken internal $ref references in specification` | `docs.test.js` | Same | **Preserved** | `[UNIT]` |
| `phase28` | `Spec declares complete, required security schemes` | `docs.test.js` | Same | **Preserved** | `[UNIT]` |
| `phase28` | `Spec contains dedicated path groups for all 5 portals and core subsystems` | `docs.test.js` | Same | **Preserved** | `[UNIT]` |
| `phase28` | `Developer Portal sections database contains authoritative architectural guides` | `docs.test.js` | Same | **Preserved** | `[UNIT]` |
| `phase28` | `renderDeveloperPortalHtml compiles valid HTML with search modal and spec injection` | `docs.test.js` | Same | **Preserved** | `[UNIT]` |
| `phase28` | `Express docs router correctly serves OpenAPI JSON, YAML, and Developer Portal` | `docs.test.js` | Same | **Preserved** | `[SERVICE_MOCK]` |

---

## 4. Addressing Priority 3: Genuine Database Concurrency vs Illustrative Logic

In older test files (`phase13Hardening.test.js` lines 216-244, `phase14Audit.test.js` lines 176-213), tests labeled as "concurrency" actually executed:
```javascript
// ILLUSTRATIVE VARIABLE SIMULATION (NOT DATABASE CONCURRENCY):
let simulatedStock = 10;
const atomicDeduct = async (qty = 1) => {
  if (simulatedStock >= qty) {
    simulatedStock -= qty;
    return true;
  }
  return false;
};
```
While this verified that asynchronous promises serialize correctly when guarded by an in-memory boolean check, it did **not** exercise MongoDB's atomic operator (`Product.findOneAndUpdate({ _id, countInStock: { $gte: qty } }, { $inc: { countInStock: -qty } })`) or the compensation rollback in [`OrderService.createOrder`](file:///c:/Users/Rahul%20Raj%20Modi/OneDrive/Desktop/Full%20stack%20Projects/Multivendor_Ecommerce%20ZoshBazaar/server/src/modules/customer/services/order.service.js#L190-L245).

### Real Database Integration Architecture for `orders.test.js`
To eliminate misleading assertions without risking production or shared data:
1. **Isolated Disposable Database**: The integration test connects exclusively to an isolated local URI (`mongodb://127.0.0.1:27017/zosh-bazaar-test-orders-isolation`). It is strictly forbidden from connecting to MongoDB Atlas or production instances.
2. **Setup and Teardown**: Creates temporary test products with `countInStock: 10`, fires 50 concurrent checkout invocations directly invoking `Product.findOneAndUpdate` with the exact query criteria from `OrderService.js`, and verifies that exactly 10 succeed and remaining reject.
3. **Graceful Conditional Fallback**: If local MongoDB is unavailable (e.g. in minimal CI environments), the real database suite safely skips integration tests while clearly logging the skip reason, ensuring unit tests still execute cleanly.

---

## 5. Verification Commands & Quality Checklist

Before completing any test file consolidation, the following commands must be executed and reported with zero errors:

```bash
# 1. Full server test suite execution
npm --prefix server test

# 2. Typecheck verification across all 5 portals
npm run typecheck:all

# 3. Production client and admin builds
npm run build:client
npm run build:admin

# 4. Zero-error linter check across all 6 subprojects
npm run lint:all

# 5. Git diff clean format check
git diff --check
```
