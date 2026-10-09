# ZOSH BAZAAR — PAYMENT PLATFORM MASTER SPECIFICATION

## Comprehensive Architecture, Money Standards, Release Plan & Operations Guide

**Version**: 1.0 (Consolidated Master Document)  
**Status**: CONDITIONAL RELEASE (Internal Core 100% Complete; Live External Rails Pending Credentials)  
**Test Suite**: **592 PASSED | 0 FAILED | 0 SKIPPED** (Across 16 Test Suites)  
**Frontends**: `client`, `admin`, `seller` (All 3 Builds Passing, 0 Errors)

---

## 1. Executive Summary & Business Flow

Zosh Bazaar is an e-commerce multi-vendor marketplace platform. It operates under standard Reserve Bank of India (RBI) Payment Aggregator & Marketplace directives:

- **No Proprietary Fund Pooling**: Customer payments are processed through licensed Payment Aggregators (Razorpay / Cashfree) or via a regulated Nodal/Escrow account with a Scheduled Commercial Bank.
- **Split Settlement**: Funds collected from customers are split between seller net payouts and platform commissions with exact tax withholding (1% TDS under Section 194-O, 1% TCS under GST).
- **Zero-PAN / CoFT Compliance**: Raw card numbers (PAN) and CVVs are strictly prohibited from database persistence and application logs.

```text
[ Customer Checkout ] ---> [ Licensed Payment Gateway (Razorpay/Cashfree) ]
                                      |
                     +----------------+----------------+
                     | (Escrow / Nodal Account)        |
                     v                                 v
          [ Seller Net Payout ]             [ Marketplace Commission ]
          (After TDS/TCS & Fees)            (Platform Revenue)
```

---

## 2. Canonical Monetary Storage & Arithmetic Standard

To eliminate binary floating-point drift while maintaining backward compatibility:

1. **Database Storage (MongoDB)**: All money fields store **Indian Rupees (INR) as Numbers formatted to exactly 2 decimal places** (e.g. `100.50`, `0.01`).
2. **In-Memory Arithmetic**: All calculations, fee deductions, ledger postings, and balance formulas execute strictly in **Integer Minor Units (Paise, where ₹1.00 = 100 paise)** via [`Money.js`](file:///c:/Users/Rahul%20Raj%20Modi/OneDrive/Desktop/Full%20stack%20Projects/Multivendor_Ecommerce%20ZoshBazaar/server/src/modules/payment/utils/Money.js).
3. **IEEE-754 Precision Tolerance**:
   - Genuine sub-paisa amounts (`10.005`, `"10.005"`, `50.055`, `0.001`), negative amounts, overflows (> ₹9.99 Cr), and scientific notation are **strictly rejected with HTTP 422 `MALFORMED_MONETARY_AMOUNT`**.
   - Binary representation artifacts from MongoDB `$inc` (e.g. `1.10 + 2.20 = 3.3000000000000003`) are safely parsed within $10^{-5}$ tolerance into exact integer paise (`330` paise).
4. **Conservation Invariants**:
   - **Double-Entry Ledger**: Every transaction posts balanced debits and credits: $\sum \text{Debits} \equiv \sum \text{Credits}$.
   - **Settlement Splits**: $\text{GrossPaise} \equiv \text{CommissionPaise} + \text{GatewayFeePaise} + \text{TaxPaise} + \text{NetPayoutPaise}$.
   - **Anti-Silent-Rounding**: Financial differences are never rounded or adjusted to zero automatically.

---

## 3. Provider Integration Status & External Rails

| Rail / Provider | Supported Capabilities | Status | Blocker / Next Action Required |
| :--- | :--- | :---: | :--- |
| **Razorpay PG** | Orders, Capture, Refunds, HMAC-SHA256 Webhooks | **Sandbox Verified** (`order_TlumXg0cA5rqrQ`) | Provision live keys (`RAZORPAY_KEY_ID` starting with `rzp_live_`) in production vault. |
| **Cashfree PG** | Order Sessions, Webhooks, Replay Guard | **Code Ready / Fail-Closed** | Missing `CASHFREE_APP_ID` & `CASHFREE_SECRET_KEY`. |
| **PayU PG** | Form Redirect, Dual SHA-512 Verification | **Code Ready / Fail-Closed** | Missing `PAYU_MERCHANT_KEY` & `PAYU_MERCHANT_SALT`. |
| **PhonePe PG** | Pay Page, UPI Intent, `X-VERIFY` Hashing | **Code Ready / Fail-Closed** | Missing `PHONEPE_MERCHANT_ID` & `PHONEPE_SALT_KEY`. |
| **Juspay** | HyperCheckout Orchestration, RSA Webhooks | **Code Ready / Fail-Closed** | Missing Juspay Merchant ID & RSA Private Key. |
| **Bank Payouts** | Multi-Vendor Batch Payouts, Nodal Clearing | **Code Ready / Fail-Closed** | Pending Corporate Nodal Account Agreement & mTLS certificates with partner bank. |
| **Bank SFTP** | MT940 / CSV 3-Way Match, SHA-256 Deduplication | **Code Ready / Fail-Closed** | Pending remote bank SFTP host, user, and SSH private key. |

---

## 4. Top 5 Release Blockers & Operational Next Actions

```text
1. [P0] Provision Live Razorpay Keys in Vault (RAZORPAY_KEY_ID starting with rzp_live_).
2. [P0] Execute Corporate Bank Nodal Account Tripartite Agreement & install mTLS certificates.
3. [P0] Obtain Written Legal Regulatory Opinion confirming marketplace compliance with RBI PA/PG rules.
4. [P0] Enforce Penny-Drop Bank Account Verification for 100% of seller settlement beneficiaries.
5. [P1] Instrument P0 Telemetry Alerting (ledger_unbalanced_journals_total > 0) & test Redis Kill Switch.
```

---

## 5. Controlled Launch Roadmap & Canary Protocol

1. **Stage 0 (Pre-Flight)**: 592 tests green; 3 frontend builds verified; database dry-run confirms zero sub-paisa records.
2. **Stage 1 (Zero-Traffic Fail-Closed Deploy)**: Production containers deployed with `NODE_ENV=production`; synthetic webhooks and dummy payouts blocked with HTTP 403.
3. **Stage 2 (Internal Canary Pilot — Documented Future Action)**:
   - *Do NOT execute until live keys and bank approvals are provisioned.*
   - Whitelisted test users only; single test vendor (`seller_canary_01`); max order value ₹100.00.
   - Verify live payment capture, atomic stock deduction, double-entry journal balance, ₹1.00 partial refund, and fee deduction conservation.
4. **Stage 3 (Phased Production Rollout)**: 5% traffic (1 hr) $\to$ 25% traffic (2 hrs) $\to$ 100% traffic live.

---

## 6. Security, Monitoring & Emergency Runbooks

### 6.1 Webhook Security & Idempotency

- **Raw Request Buffer**: HMAC signatures are verified against immutable `req.rawBody`. Missing raw buffer or signature mismatch rejects with HTTP 400.
- **Distributed Locking**: Redis Redlock locks `webhook:provider:eventId` to ensure zero duplicate mutations.
- **Terminal State Lock**: Terminal states (`FAILED`, `REFUNDED`) cannot be resurrected by delayed webhooks.

### 6.2 Maker-Checker Dual Control

- Reconciliation discrepancies marked `CRITICAL` require two distinct operator identities.
- If `operatorId === checkerId`, the API throws HTTP 403 `MAKER_CHECKER_CONFLICT`.

### 6.3 Emergency Kill Switch & Rollback

- **Per-Provider Disable**: Admin portal can toggle individual providers to `DISABLED`; traffic instantly reroutes to secondary rails.
- **Global Checkout Freeze**: Setting `PAYMENT_GLOBAL_KILL_SWITCH=true` in Redis displays a graceful checkout maintenance page without terminating in-flight orders.
- **Rollback Procedure**: In case of severe anomaly, trigger global kill switch, restore point-in-time MongoDB snapshot, and revert application container tags.
