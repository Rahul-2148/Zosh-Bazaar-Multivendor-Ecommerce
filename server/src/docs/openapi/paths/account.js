/**
 * OpenAPI 3.1 Paths: Customer Account Suite, Security, Sessions & Lifecycle
 */

export const accountPaths = {
  "/api/v1/account/overview": {
    get: {
      tags: ["Customer Account Suite"],
      summary: "Customer Account Dashboard Metrics",
      description: "Aggregates recent orders count, total spent, active wishlist count, and notification badges.",
      operationId: "getAccountOverview",
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: "Customer summary metrics retrieved.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  overview: {
                    type: "object",
                    properties: {
                      totalOrders: { type: "integer", example: 12 },
                      activeWishlist: { type: "integer", example: 5 },
                      savedAddresses: { type: "integer", example: 2 },
                      unreadNotifications: { type: "integer", example: 3 },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  "/api/v1/account/profile": {
    patch: {
      tags: ["Customer Account Suite"],
      summary: "Update Account Profile Details",
      operationId: "updateAccountProfile",
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: { "application/json": { schema: { type: "object", properties: { fullName: { type: "string" }, mobile: { type: "string" } } } } },
      },
      responses: {
        200: { description: "Profile updated.", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } } },
      },
    },
  },
  "/api/v1/account/change-password": {
    post: {
      tags: ["Customer Account Suite"],
      summary: "Change Account Password",
      operationId: "changeAccountPassword",
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: { "application/json": { schema: { type: "object", required: ["currentPassword", "newPassword"], properties: { currentPassword: { type: "string" }, newPassword: { type: "string" } } } } },
      },
      responses: {
        200: { description: "Password changed.", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } } },
      },
    },
  },
  "/api/v1/account/preferences": {
    get: {
      tags: ["Customer Account Suite"],
      summary: "Get Customer Communication & Shopping Preferences",
      description: "Retrieves currency display, newsletter opt-in, SMS alerts, and promotional push preferences.",
      operationId: "getAccountPreferences",
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: "Preferences returned.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  preferences: { type: "object" },
                },
              },
            },
          },
        },
      },
    },
    patch: {
      tags: ["Customer Account Suite"],
      summary: "Update Preferences",
      description: "Modifies notifications, language, or marketing consent flags.",
      operationId: "updateAccountPreferences",
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                emailNotifications: { type: "boolean" },
                smsAlerts: { type: "boolean" },
                whatsappUpdates: { type: "boolean" },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Preferences updated.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SuccessEnvelope" },
            },
          },
        },
      },
    },
  },
  "/api/v1/account/payment-methods": {
    get: {
      tags: ["Customer Account Suite"],
      summary: "List Saved Tokenized Cards / UPI VPIs",
      description: "Returns vault tokenized payment methods (PCI-DSS compliant, zero raw PAN).",
      operationId: "getAccountPaymentMethods",
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: "List of saved tokenized payment methods.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  paymentMethods: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        _id: { type: "string" },
                        type: { type: "string", enum: ["CARD", "UPI"], example: "UPI" },
                        vpa: { type: "string", example: "user@okaxis" },
                        cardLast4: { type: "string", example: "4321" },
                        cardNetwork: { type: "string", example: "VISA" },
                        isDefault: { type: "boolean", example: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    post: {
      tags: ["Customer Account Suite"],
      summary: "Save Tokenized Payment Instrument",
      description: "Stores provider-tokenized card reference or verified UPI VPA for faster checkout.",
      operationId: "addAccountPaymentMethod",
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["type"],
              properties: {
                type: { type: "string", enum: ["CARD", "UPI"] },
                vpa: { type: "string" },
                token: { type: "string" },
                cardLast4: { type: "string" },
                cardNetwork: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: "Payment method saved.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SuccessEnvelope" },
            },
          },
        },
      },
    },
  },
  "/api/v1/account/payment-methods/{id}": {
    delete: {
      tags: ["Customer Account Suite"],
      summary: "Remove Saved Payment Instrument",
      description: "Revokes tokenized card or VPA from the user account vault.",
      operationId: "deleteAccountPaymentMethod",
      security: [{ BearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        200: {
          description: "Instrument removed.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } },
        },
      },
    },
  },
  "/api/v1/account/payment-methods/{id}/default": {
    patch: {
      tags: ["Customer Account Suite"],
      summary: "Set Default Payment Instrument",
      description: "Sets the selected saved payment method as primary default for checkout.",
      operationId: "setDefaultAccountPaymentMethod",
      security: [{ BearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        200: {
          description: "Default payment method updated.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } },
        },
      },
    },
  },
  "/api/v1/account/transactions": {
    get: {
      tags: ["Customer Account Suite"],
      summary: "Customer Order Transaction History",
      description: "Lists past order financial charges, refund receipts, and wallet debits/credits.",
      operationId: "getAccountTransactions",
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: "List of financial transactions.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  transactions: { type: "array", items: { type: "object" } },
                },
              },
            },
          },
        },
      },
    },
  },
  "/api/v1/account/buy-again": {
    get: {
      tags: ["Customer Account Suite"],
      summary: "Buy Again Recommendations",
      description: "Returns frequently purchased or replenishable products previously delivered to customer.",
      operationId: "getBuyAgainProducts",
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: "List of previously purchased items.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  items: { type: "array", items: { $ref: "#/components/schemas/Product" } },
                },
              },
            },
          },
        },
      },
    },
  },
  "/api/v1/account/returns": {
    get: {
      tags: ["Customer Account Suite"],
      summary: "Customer Returns & Refund Status List",
      description: "Fetches active and completed return requests, reverse pickup tracking, and refund status.",
      operationId: "getAccountReturns",
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: "Return requests returned.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  returns: { type: "array", items: { type: "object" } },
                },
              },
            },
          },
        },
      },
    },
  },
  "/api/v1/account/data-export": {
    get: {
      tags: ["Customer Account Suite"],
      summary: "GDPR / DPDP Customer Personal Data Export",
      description: "Exports all personal profile data, addresses, orders, reviews, and session records as JSON.",
      operationId: "exportCustomerData",
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: "Complete sanitized personal data export.",
          content: {
            "application/json": {
              schema: { type: "object" },
            },
          },
        },
      },
    },
  },
  "/api/v1/account/lifecycle/config": {
    get: {
      tags: ["Account Lifecycle"],
      summary: "Account Lifecycle Configuration & Deletion Policy",
      description: "Returns allowable deletion reasons, cooling grace periods (e.g. 30 days), and deactivation terms.",
      operationId: "getLifecycleConfig",
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: "Lifecycle config options returned.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  reasons: { type: "array", items: { type: "string" } },
                  gracePeriodDays: { type: "integer", example: 30 },
                },
              },
            },
          },
        },
      },
    },
  },
  "/api/v1/account/deactivate": {
    post: {
      tags: ["Account Lifecycle"],
      summary: "Deactivate Customer Account (Reversible)",
      description: "Temporarily locks customer access while preserving order history and addresses. Can be undone via `/account/reactivate`.",
      operationId: "deactivateAccount",
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: "Account deactivated.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } },
        },
      },
    },
  },
  "/api/v1/account/reactivate": {
    post: {
      tags: ["Account Lifecycle"],
      summary: "Reactivate Deactivated Account",
      description: "Restores active customer status and shopping permissions.",
      operationId: "reactivateAccount",
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: "Account restored to ACTIVE status.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } },
        },
      },
    },
  },
  "/api/v1/account/deletion/request": {
    post: {
      tags: ["Account Lifecycle"],
      summary: "Initiate Multi-Step Account Deletion",
      description: "Validates eligibility (no pending orders or unresolved disputes) and initiates deletion workflow.",
      operationId: "requestAccountDeletion",
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["reason"],
              properties: {
                reason: { type: "string", example: "No longer using service" },
                feedback: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Deletion request created; requires OTP verification.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } },
        },
      },
    },
  },
  "/api/v1/account/deletion/send-otp": {
    post: {
      tags: ["Account Lifecycle"],
      summary: "Send Deletion Confirmation OTP",
      description: "Dispatches 6-digit confirmation code required to finalize scheduled deletion.",
      operationId: "sendDeletionOtp",
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: "Confirmation OTP sent.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } },
        },
      },
    },
  },
  "/api/v1/account/deletion/verify-otp": {
    post: {
      tags: ["Account Lifecycle"],
      summary: "Verify Deletion OTP",
      description: "Validates code before final confirmation step.",
      operationId: "verifyDeletionOtp",
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["otp"],
              properties: { otp: { type: "string", example: "654321" } },
            },
          },
        },
      },
      responses: {
        200: {
          description: "OTP validated.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } },
        },
      },
    },
  },
  "/api/v1/account/deletion/confirm": {
    post: {
      tags: ["Account Lifecycle"],
      summary: "Confirm Scheduled Deletion",
      description: "Transitions account status to DELETION_SCHEDULED with 30-day grace period.",
      operationId: "confirmAccountDeletion",
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: "Deletion scheduled.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } },
        },
      },
    },
  },
  "/api/v1/account/deletion/cancel": {
    post: {
      tags: ["Account Lifecycle"],
      summary: "Cancel Scheduled Deletion",
      description: "Revokes pending deletion request within the grace window.",
      operationId: "cancelAccountDeletion",
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: "Deletion request cancelled; account restored.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } },
        },
      },
    },
  },
  "/api/v1/account/deletion/status": {
    get: {
      tags: ["Account Lifecycle"],
      summary: "Get Current Deletion Request Status",
      description: "Returns scheduled purge date, step status, and grace window days remaining.",
      operationId: "getDeletionStatus",
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: "Status returned.",
          content: { "application/json": { schema: { type: "object" } } },
        },
      },
    },
  },
  "/api/v1/account/sessions": {
    get: {
      tags: ["Customer Sessions"],
      summary: "List Active Device Sessions",
      description: "Audits active JWT logins across browsers and mobile apps, including IP and last heartbeat.",
      operationId: "getAccountSessions",
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: "List of active device sessions.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  sessions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        _id: { type: "string" },
                        deviceType: { type: "string", example: "Desktop - Chrome" },
                        ipAddress: { type: "string", example: "103.21.244.0" },
                        lastActive: { type: "string", format: "date-time" },
                        isCurrent: { type: "boolean", example: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  "/api/v1/account/sessions/heartbeat": {
    post: {
      tags: ["Customer Sessions"],
      summary: "Telemetry Device Session Heartbeat",
      description: "Pings server with current client user agent and screen metrics to keep session alive.",
      operationId: "postSessionHeartbeat",
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: "Heartbeat acknowledged.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } },
        },
      },
    },
  },
  "/api/v1/account/sessions/{id}": {
    delete: {
      tags: ["Customer Sessions"],
      summary: "Revoke Specific Device Session",
      description: "Invalidates the selected session token, triggering instant logout on the remote client via Socket.IO.",
      operationId: "revokeSessionById",
      security: [{ BearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        200: {
          description: "Session revoked.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } },
        },
      },
    },
  },
  "/api/v1/account/sessions/revoke-others": {
    post: {
      tags: ["Customer Sessions"],
      summary: "Revoke All Other Device Sessions",
      description: "Terminates all other logged-in browser and mobile sessions except the current active client.",
      operationId: "revokeOtherSessions",
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: "All other sessions revoked.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } },
        },
      },
    },
  },
  "/api/v1/account/delete-account": {
    post: {
      tags: ["Customer Account Suite"],
      summary: "Initiate Account Deletion",
      description: "Submits account deletion request with grace period schedule.",
      operationId: "requestDirectAccountDeletion",
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: "Deletion initiated.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } },
        },
      },
    },
  },
  "/api/v1/account/deletion/support-request": {
    post: {
      tags: ["Customer Account Suite"],
      summary: "Account Deletion Support Escalation",
      operationId: "requestAccountDeletionSupport",
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: { "application/json": { schema: { type: "object", properties: { reason: { type: "string" } } } } },
      },
      responses: {
        200: {
          description: "Support request dispatched.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } },
        },
      },
    },
  },
};
