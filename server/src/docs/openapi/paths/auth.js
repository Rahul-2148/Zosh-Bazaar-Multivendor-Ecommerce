/**
 * OpenAPI 3.1 Paths: Customer Authentication & OTP Verification
 */

const sendOtpDoc = {
  post: {
    tags: ["Customer Authentication"],
    summary: "Deliver Authentication OTP via Email",
    description: "Generates a 6-digit cryptographic verification code and dispatches it via transactional email. Implements 60-second cooldown per recipient.",
    operationId: "sendCustomerLoginOtp",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["email"],
            properties: {
              email: {
                type: "string",
                format: "email",
                example: "customer@example.com",
              },
              mode: {
                type: "string",
                enum: ["auto", "login", "signup"],
                default: "auto",
                example: "auto",
              },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "OTP successfully queued and dispatched to recipient.",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                message: { type: "string", example: "OTP sent successfully" },
                cooldownSeconds: { type: "integer", example: 60 },
                isNewUser: { type: "boolean", example: false },
                exists: { type: "boolean", example: true },
                otpSent: { type: "boolean", example: true },
                success: { type: "boolean", example: true },
                error: { type: "boolean", example: false },
              },
            },
          },
        },
      },
      400: {
        description: "Invalid email or request within cooldown window.",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                message: { type: "string", example: "Please wait 42 seconds before requesting another OTP" },
                cooldownRemaining: { type: "integer", example: 42 },
                error: { type: "boolean", example: true },
                success: { type: "boolean", example: false },
              },
            },
          },
        },
      },
    },
  },
};

const createSendOtpDoc = (opId, summary) => ({
  post: {
    ...sendOtpDoc.post,
    operationId: opId,
    summary: summary || sendOtpDoc.post.summary,
  },
});

export const authPaths = {
  "/api/v1/auth/sent/login-signup-otp": createSendOtpDoc("sendCustomerLoginOtp", "Deliver Authentication OTP via Email (Primary)"),
  "/api/v1/auth/send/login-signup-otp": createSendOtpDoc("sendCustomerLoginOtpSendVariant", "Deliver Authentication OTP via Email (Send Variant)"),
  "/api/v1/auth/send-otp": createSendOtpDoc("sendCustomerLoginOtpShort", "Deliver Authentication OTP (Short Path)"),
  "/api/v1/auth/resend-otp": createSendOtpDoc("resendCustomerLoginOtp", "Resend Authentication OTP"),
  "/api/v1/auth/otp-cooldown": {
    get: {
      tags: ["Customer Authentication"],
      summary: "Query OTP Resend Cooldown Window",
      description: "Returns remaining seconds before another OTP can be requested for this email address.",
      operationId: "getCustomerOtpCooldown",
      parameters: [
        {
          name: "email",
          in: "query",
          required: true,
          schema: { type: "string", format: "email" },
          example: "customer@example.com",
        },
      ],
      responses: {
        200: {
          description: "Cooldown metadata retrieved.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  cooldownRemaining: { type: "integer", example: 0 },
                  canResend: { type: "boolean", example: true },
                },
              },
            },
          },
        },
      },
    },
  },
  "/api/v1/auth/signup": {
    post: {
      tags: ["Customer Authentication"],
      summary: "Register New Customer Account",
      description: "Verifies the delivered OTP and registers a new customer profile. Returns a Bearer JWT session token.",
      operationId: "registerCustomer",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["email", "fullName", "otp"],
              properties: {
                email: { type: "string", format: "email", example: "priya.sharma@example.com" },
                fullName: { type: "string", example: "Priya Sharma" },
                otp: { type: "string", pattern: "^\\d{6}$", example: "123456" },
                mobile: { type: "string", example: "9876543210" },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Customer registered and session token issued.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: { type: "string", example: "User created successfully" },
                  jwt: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
                  role: { type: "string", example: "ROLE_CUSTOMER" },
                  success: { type: "boolean", example: true },
                  error: { type: "boolean", example: false },
                },
              },
            },
          },
        },
        400: {
          description: "Invalid OTP or user already exists.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorEnvelope" },
            },
          },
        },
      },
    },
  },
  "/api/v1/auth/signin": {
    post: {
      tags: ["Customer Authentication"],
      summary: "Authenticate Customer via OTP or Password",
      description: "Verifies OTP and signs a session JWT for existing customer accounts.",
      operationId: "signinCustomer",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["email"],
              properties: {
                email: { type: "string", format: "email", example: "priya.sharma@example.com" },
                otp: { type: "string", pattern: "^\\d{6}$", example: "123456" },
                password: { type: "string", example: "SecurePass#123" },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Login successful; Bearer token returned.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: { type: "string", example: "Login successful" },
                  jwt: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
                  role: { type: "string", example: "ROLE_CUSTOMER" },
                  isNewUser: { type: "boolean", example: false },
                  success: { type: "boolean", example: true },
                  error: { type: "boolean", example: false },
                },
              },
            },
          },
        },
        401: {
          description: "Invalid OTP or credentials.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorEnvelope" },
            },
          },
        },
      },
    },
  },
  "/api/v1/auth/signing": {
    post: {
      tags: ["Customer Authentication"],
      summary: "Customer Signin (Alias)",
      description: "Backward-compatible alias for `/api/v1/auth/signin`.",
      operationId: "signinCustomerAlias",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["email"],
              properties: {
                email: { type: "string", format: "email" },
                otp: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Login successful.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  jwt: { type: "string" },
                  role: { type: "string" },
                  success: { type: "boolean" },
                },
              },
            },
          },
        },
      },
    },
  },
};
