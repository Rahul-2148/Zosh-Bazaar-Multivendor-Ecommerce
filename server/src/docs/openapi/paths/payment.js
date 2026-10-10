/**
 * OpenAPI 3.1 Paths: Unified Payment Platform, Banking Rails, Ledger & Financial Ops
 */

export const paymentPaths = {
  "/api/v1/payment/checkout/initiate": {
    post: {
      tags: ["Payments & Checkout"],
      summary: "Initiate Native Checkout & Create PaymentIntent",
      description: "Calculates server-authoritative cart pricing in minor units (paise), creates a PaymentIntent, and selects optimal gateway rail.",
      operationId: "initiateCheckoutPayment",
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["orderId"],
              properties: {
                orderId: { type: "string", example: "ZB-ORD-202610-8910" },
                preferredRail: { type: "string", enum: ["RAZORPAY", "CASHFREE", "JUSPAY", "WALLET", "COD"], example: "RAZORPAY" },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "PaymentIntent created.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/PaymentIntent" } } },
        },
      },
    },
  },
  "/api/v1/payment/checkout/attempt": {
    post: {
      tags: ["Payments & Checkout"],
      summary: "Submit Payment Attempt",
      description: "Dispatches payment attempt for UPI, Card, NetBanking, Wallet, or COD against an active PaymentIntent.",
      operationId: "submitPaymentAttempt",
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["intentId", "method"],
              properties: {
                intentId: { type: "string", example: "pi_zb_8910abcd" },
                method: { type: "string", enum: ["UPI_INTENT", "UPI_COLLECT", "CARD", "NETBANKING", "WALLET", "COD"] },
                instrumentDetails: { type: "object" },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Payment attempt dispatched.",
          content: { "application/json": { schema: { type: "object" } } },
        },
      },
    },
  },
  "/api/v1/payment/eligibility": {
    get: {
      tags: ["Payments & Checkout"],
      summary: "Get Payment Method Eligibility",
      description: "Returns server-authoritative eligibility for COD, Wallet balance, EMI thresholds, and saved cards.",
      operationId: "getPaymentEligibility",
      security: [{ BearerAuth: [] }],
      parameters: [{ name: "orderId", in: "query", required: false, schema: { type: "string" } }],
      responses: {
        200: {
          description: "Eligible payment rails.",
          content: { "application/json": { schema: { type: "object" } } },
        },
      },
    },
  },
  "/api/v1/payment/methods": {
    get: {
      tags: ["Payments & Checkout"],
      summary: "Get Available Payment Rails & Bank Outages",
      description: "Returns real-time gateway rail availability, supported UPI apps, and active bank maintenance outages.",
      operationId: "getAvailablePaymentMethods",
      responses: {
        200: {
          description: "Payment methods metadata.",
          content: { "application/json": { schema: { type: "object" } } },
        },
      },
    },
  },
  "/api/v1/payment/emi/calculate": {
    post: {
      tags: ["Payments & Checkout"],
      summary: "Server-Authoritative EMI Calculator",
      description: "Calculates exact monthly installments, bank interest, processing fees, and cashback across tenures (3, 6, 9, 12 months).",
      operationId: "calculateEmi",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["amountPaise", "bankCode"],
              properties: {
                amountPaise: { type: "integer", example: 1200000 },
                bankCode: { type: "string", example: "HDFC" },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "EMI plans breakdown.",
          content: { "application/json": { schema: { type: "object" } } },
        },
      },
    },
  },
  "/api/v1/payment/intent/{intentId}": {
    get: {
      tags: ["Payments & Checkout"],
      summary: "Poll PaymentIntent Status",
      description: "Returns authoritative status of a PaymentIntent (CREATED, PROCESSING, SUCCEEDED, FAILED).",
      operationId: "getPaymentIntentStatus",
      security: [{ BearerAuth: [] }],
      parameters: [{ name: "intentId", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        200: {
          description: "PaymentIntent status object.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/PaymentIntent" } } },
        },
      },
    },
  },
  "/api/v1/payment/checkout/attempt/{attemptId}/status": {
    get: {
      tags: ["Payments & Checkout"],
      summary: "Get Authoritative Attempt Status & Recovery",
      operationId: "getPaymentAttemptStatus",
      security: [{ BearerAuth: [] }],
      parameters: [{ name: "attemptId", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        200: {
          description: "Attempt status details.",
          content: { "application/json": { schema: { type: "object" } } },
        },
      },
    },
  },
  "/api/v1/payment/wallet": {
    get: {
      tags: ["Wallet & Refunds"],
      summary: "Get Customer Wallet Balance",
      description: "Returns minor unit balance (paise) and recent credits/debits from the customer wallet.",
      operationId: "getCustomerWallet",
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: "Wallet balance object.",
          content: { "application/json": { schema: { type: "object" } } },
        },
      },
    },
  },
  "/api/v1/payment/wallet/topup": {
    post: {
      tags: ["Wallet & Refunds"],
      summary: "Top-up Customer Wallet",
      description: "Generates a payment order to load money into the user's closed-loop marketplace wallet.",
      operationId: "topupCustomerWallet",
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["amountPaise"],
              properties: { amountPaise: { type: "integer", example: 50000 } },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Topup payment order initiated.",
          content: { "application/json": { schema: { type: "object" } } },
        },
      },
    },
  },
  "/api/v1/payment/refund": {
    post: {
      tags: ["Wallet & Refunds"],
      summary: "Request Refund for Cancelled Order",
      description: "Initiates payment gateway or wallet refund according to double-entry ledger rules.",
      operationId: "requestPaymentRefund",
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["orderId"],
              properties: {
                orderId: { type: "string", example: "ZB-ORD-202610-8910" },
                reason: { type: "string", example: "Customer requested cancellation" },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Refund initiated.",
          content: { "application/json": { schema: { type: "object" } } },
        },
      },
    },
  },
  "/api/v1/payment/webhook/{provider}": {
    post: {
      tags: ["Payment Webhooks"],
      summary: "Universal Gateway Webhook Ingress",
      description: "Secure webhook receiver for Razorpay, Cashfree, and Juspay. Verifies HMAC-SHA256 signature over raw payload buffer and enforces Redis distributed deduplication lock.",
      operationId: "handlePaymentWebhook",
      parameters: [{ name: "provider", in: "path", required: true, schema: { type: "string", enum: ["razorpay", "cashfree", "juspay", "sandbox"] } }],
      requestBody: {
        required: true,
        content: { "application/json": { schema: { type: "object" } } },
      },
      responses: {
        200: {
          description: "Webhook processed or duplicate safely acknowledged.",
          content: { "application/json": { schema: { type: "object", properties: { status: { type: "string", example: "ok" } } } } },
        },
        400: {
          description: "Signature verification failed or missing raw buffer.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorEnvelope" } } },
        },
      },
    },
  },
  "/api/v1/payment/admin/dashboard": {
    get: {
      tags: ["Admin Financial Operations"],
      summary: "Admin Financial & Payment Metrics",
      description: "Aggregates GMV, gateway fees, commissions, refund volume, and outbox failure rates.",
      operationId: "getAdminPaymentDashboard",
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: "Financial metrics summary.",
          content: { "application/json": { schema: { type: "object" } } },
        },
      },
    },
  },
  "/api/v1/payment/admin/ledger": {
    get: {
      tags: ["Admin Financial Operations"],
      summary: "Admin Double-Entry Ledger Explorer",
      description: "Audits balanced double-entry accounting journals where debits equal credits.",
      operationId: "getAdminLedger",
      security: [{ BearerAuth: [] }],
      parameters: [
        { name: "accountType", in: "query", required: false, schema: { type: "string" } },
        { $ref: "#/components/parameters/PageParam" },
        { $ref: "#/components/parameters/LimitParam" },
      ],
      responses: {
        200: {
          description: "Ledger journals list.",
          content: { "application/json": { schema: { type: "object" } } },
        },
      },
    },
  },
  "/api/v1/payment/admin/reconciliation/run": {
    post: {
      tags: ["Admin Financial Operations"],
      summary: "Run Automated Financial Reconciliation Audit",
      description: "Runs batch reconciliation matching internal payment orders against gateway captured records.",
      operationId: "runFinancialReconciliation",
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: "Reconciliation report generated.",
          content: { "application/json": { schema: { type: "object" } } },
        },
      },
    },
  },
  "/api/v1/payment/admin/settlement-batches/generate": {
    post: {
      tags: ["Admin Financial Operations"],
      summary: "Generate Seller Settlement Batch",
      description: "Aggregates mature seller orders post-return-window, deducts 1% TDS/TCS and platform commission, and generates bank payout batch.",
      operationId: "generateSettlementBatch",
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["sellerId"],
              properties: { sellerId: { type: "string" } },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Settlement batch created.",
          content: { "application/json": { schema: { type: "object" } } },
        },
      },
    },
  },
  "/api/v1/payment/admin/providers": {
    get: {
      tags: ["Admin Financial Operations"],
      summary: "Admin Provider Registry & Health Control Plane",
      description: "Returns status, weights, and failover health for all configured payment gateways.",
      operationId: "getAdminPaymentProviders",
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: "Provider health matrix.",
          content: { "application/json": { schema: { type: "object" } } },
        },
      },
    },
  },
  "/api/v1/payment/admin/disputes/chargeback": {
    post: {
      tags: ["Admin Financial Operations"],
      summary: "Open Chargeback Dispute",
      description: "Logs customer or issuing bank chargeback dispute and locks dispute reserve from seller balance.",
      operationId: "openChargebackDispute",
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: { "application/json": { schema: { type: "object", required: ["paymentId", "amountPaise"] } } },
      },
      responses: {
        201: {
          description: "Dispute opened.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } },
        },
      },
    },
  },
  "/api/v1/payment/{paymentId}": {
    get: {
      tags: ["Payments & Checkout"],
      summary: "Get Payment Details by ID",
      operationId: "getPaymentById",
      security: [{ BearerAuth: [] }],
      parameters: [{ name: "paymentId", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        200: {
          description: "Payment details.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/PaymentIntent" } } },
        },
      },
    },
  },
  "/api/v1/payment/admin/intents": {
    get: {
      tags: ["Admin Financial Operations"],
      summary: "Admin List All Payment Intents",
      operationId: "adminListPaymentIntents",
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: "Payment intents list.",
          content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/PaymentIntent" } } } },
        },
      },
    },
  },
  "/api/v1/payment/admin/refunds": {
    get: {
      tags: ["Admin Financial Operations"],
      summary: "Admin List All Refunds",
      operationId: "adminListRefunds",
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: "Refunds list.",
          content: { "application/json": { schema: { type: "array", items: { type: "object" } } } },
        },
      },
    },
  },
  "/api/v1/payment/admin/attempts": {
    get: {
      tags: ["Admin Financial Operations"],
      summary: "Admin List Gateway Payment Attempts",
      operationId: "adminListPaymentAttempts",
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: "Attempts list.",
          content: { "application/json": { schema: { type: "array", items: { type: "object" } } } },
        },
      },
    },
  },
  "/api/v1/payment/admin/outbox": {
    get: {
      tags: ["Admin Financial Operations"],
      summary: "Admin Inspect Payment Outbox Events",
      operationId: "adminListPaymentOutbox",
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: "Outbox events list.",
          content: { "application/json": { schema: { type: "array", items: { type: "object" } } } },
        },
      },
    },
  },
  "/api/v1/payment/admin/settlements": {
    get: {
      tags: ["Admin Financial Operations"],
      summary: "Admin List Seller Settlements",
      operationId: "adminListSettlements",
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: "Settlements list.",
          content: { "application/json": { schema: { type: "array", items: { type: "object" } } } },
        },
      },
    },
  },
  "/api/v1/payment/admin/providers/{providerKey}": {
    put: {
      tags: ["Admin Financial Operations"],
      summary: "Admin Update Payment Provider Configuration",
      operationId: "adminUpdateProviderConfig",
      security: [{ BearerAuth: [] }],
      parameters: [{ name: "providerKey", in: "path", required: true, schema: { type: "string" } }],
      requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
      responses: {
        200: {
          description: "Provider updated.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } },
        },
      },
    },
  },
  "/api/v1/payment/juspay/session": {
    post: {
      tags: ["Payments & Checkout"],
      summary: "Initiate Juspay HyperCheckout Session",
      operationId: "createJuspaySession",
      security: [{ BearerAuth: [] }],
      requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
      responses: {
        200: {
          description: "Juspay session payload.",
          content: { "application/json": { schema: { type: "object" } } },
        },
      },
    },
  },
  "/api/v1/payment/juspay/orders/{orderId}/status": {
    get: {
      tags: ["Payments & Checkout"],
      summary: "Get Juspay Order Status",
      operationId: "getJuspayOrderStatus",
      security: [{ BearerAuth: [] }],
      parameters: [{ name: "orderId", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        200: {
          description: "Juspay order status.",
          content: { "application/json": { schema: { type: "object" } } },
        },
      },
    },
  },
  "/api/v1/payment/admin/settlement-batches": {
    get: {
      tags: ["Admin Financial Operations"],
      summary: "Admin List Settlement Batches",
      operationId: "adminListSettlementBatches",
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: "Settlement batches list.",
          content: { "application/json": { schema: { type: "array", items: { type: "object" } } } },
        },
      },
    },
  },
  "/api/v1/payment/admin/settlement-batches/{batchId}/payout": {
    post: {
      tags: ["Admin Financial Operations"],
      summary: "Admin Execute Batch Payout Disbursement",
      operationId: "adminExecuteBatchPayout",
      security: [{ BearerAuth: [] }],
      parameters: [{ name: "batchId", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        200: {
          description: "Payout disbursed.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } },
        },
      },
    },
  },
  "/api/v1/payment/admin/settlement-batches/{batchId}/settle": {
    post: {
      tags: ["Admin Financial Operations"],
      summary: "Admin Mark Batch Settled",
      operationId: "adminMarkBatchSettled",
      security: [{ BearerAuth: [] }],
      parameters: [{ name: "batchId", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        200: {
          description: "Batch settled.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } },
        },
      },
    },
  },
  "/api/v1/payment/admin/seller-holds/{sellerId}": {
    get: {
      tags: ["Admin Financial Operations"],
      summary: "Get Active Seller Payout Holds",
      operationId: "adminGetSellerHolds",
      security: [{ BearerAuth: [] }],
      parameters: [{ name: "sellerId", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        200: {
          description: "Seller holds.",
          content: { "application/json": { schema: { type: "array", items: { type: "object" } } } },
        },
      },
    },
  },
  "/api/v1/payment/admin/seller-holds": {
    post: {
      tags: ["Admin Financial Operations"],
      summary: "Place Dispute / Risk Hold on Seller",
      operationId: "adminCreateSellerHold",
      security: [{ BearerAuth: [] }],
      requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
      responses: {
        201: {
          description: "Hold created.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } },
        },
      },
    },
  },
  "/api/v1/payment/admin/seller-holds/{holdId}/release": {
    post: {
      tags: ["Admin Financial Operations"],
      summary: "Release Seller Hold",
      operationId: "adminReleaseSellerHold",
      security: [{ BearerAuth: [] }],
      parameters: [{ name: "holdId", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        200: {
          description: "Hold released.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } },
        },
      },
    },
  },
  "/api/v1/payment/admin/beneficiaries/{sellerId}": {
    get: {
      tags: ["Admin Financial Operations"],
      summary: "Get Seller Bank Beneficiary Record",
      operationId: "adminGetSellerBeneficiary",
      security: [{ BearerAuth: [] }],
      parameters: [{ name: "sellerId", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        200: {
          description: "Beneficiary record.",
          content: { "application/json": { schema: { type: "object" } } },
        },
      },
    },
  },
  "/api/v1/payment/admin/beneficiaries/{beneficiaryId}/verify": {
    post: {
      tags: ["Admin Financial Operations"],
      summary: "Verify Seller Bank Account Penny Drop",
      operationId: "adminVerifyBeneficiary",
      security: [{ BearerAuth: [] }],
      parameters: [{ name: "beneficiaryId", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        200: {
          description: "Beneficiary verified.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } },
        },
      },
    },
  },
  "/api/v1/payment/admin/reconciliation/three-way": {
    post: {
      tags: ["Admin Financial Operations"],
      summary: "Run Three-Way Payment Reconciliation",
      description: "Reconciles Gateway reports vs Bank settlement advice vs Internal double-entry ledger journals.",
      operationId: "adminRunThreeWayReconciliation",
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: "Reconciliation run outcome.",
          content: { "application/json": { schema: { type: "object" } } },
        },
      },
    },
  },
  "/api/v1/payment/admin/reconciliation/{reconciliationId}/resolve": {
    post: {
      tags: ["Admin Financial Operations"],
      summary: "Resolve Reconciliation Discrepancy",
      operationId: "adminResolveReconciliation",
      security: [{ BearerAuth: [] }],
      parameters: [{ name: "reconciliationId", in: "path", required: true, schema: { type: "string" } }],
      requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
      responses: {
        200: {
          description: "Discrepancy resolved.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } },
        },
      },
    },
  },
  "/api/v1/payment/admin/disputes/chargeback/{disputeReference}/resolve": {
    post: {
      tags: ["Admin Financial Operations"],
      summary: "Resolve Chargeback Dispute",
      operationId: "adminResolveChargeback",
      security: [{ BearerAuth: [] }],
      parameters: [{ name: "disputeReference", in: "path", required: true, schema: { type: "string" } }],
      requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
      responses: {
        200: {
          description: "Chargeback resolved.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } },
        },
      },
    },
  },
  "/api/v1/transaction/seller": {
    get: {
      tags: ["Seller Financials & Payouts"],
      summary: "Seller Transaction Ledger History",
      description: "Returns seller journal debit and credit entries.",
      operationId: "getSellerTransactionLedger",
      security: [{ SellerAuth: [] }],
      responses: {
        200: {
          description: "Seller transactions.",
          content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/LedgerTransaction" } } } },
        },
      },
    },
  },
};
