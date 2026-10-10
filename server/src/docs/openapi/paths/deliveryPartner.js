/**
 * OpenAPI 3.1 Paths: Last-Mile Delivery Partner Mobile Operations
 */

export const deliveryPartnerPaths = {
  "/api/v1/delivery-partner/auth/login": {
    post: {
      tags: ["Delivery Partner Mobile App"],
      summary: "Delivery Courier Mobile Login",
      description: "Authenticates delivery agent by agent ID / email and PIN/password. Issues DeliveryPartnerAuth token.",
      operationId: "loginDeliveryPartner",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["agentId", "password"],
              properties: {
                agentId: { type: "string", example: "AGT-1002" },
                password: { type: "string", example: "Partner#123" },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Authenticated successfully.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  token: { type: "string", example: "eyJhbGciOi..." },
                  agent: { type: "object" },
                },
              },
            },
          },
        },
      },
    },
  },
  "/api/v1/delivery-partner/profile": {
    get: {
      tags: ["Delivery Partner Mobile App"],
      summary: "Get Delivery Partner Profile & Hub Assignment",
      operationId: "getDeliveryPartnerProfile",
      security: [{ DeliveryPartnerAuth: [] }],
      responses: {
        200: {
          description: "Profile and assigned hub info.",
          content: { "application/json": { schema: { type: "object" } } },
        },
      },
    },
  },
  "/api/v1/delivery-partner/shift": {
    patch: {
      tags: ["Delivery Partner Mobile App"],
      summary: "Start / End Courier Shift (Clock-In / Clock-Out)",
      description: "Toggles courier availability state (ON_DUTY / OFF_DUTY / ON_BREAK).",
      operationId: "updatePartnerShift",
      security: [{ DeliveryPartnerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["shiftStatus"],
              properties: { shiftStatus: { type: "string", enum: ["ON_DUTY", "OFF_DUTY", "ON_BREAK"] } },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Shift status updated.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } },
        },
      },
    },
  },
  "/api/v1/delivery-partner/route/active": {
    get: {
      tags: ["Delivery Partner Mobile App"],
      summary: "Get Assigned Active Delivery Run",
      description: "Returns stops sequence, customer addresses, phone numbers, parcel barcodes, and COD collection requirements for today's run.",
      operationId: "getActiveDeliveryRoute",
      security: [{ DeliveryPartnerAuth: [] }],
      responses: {
        200: {
          description: "Active delivery route with ordered stops.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/DeliveryRoute" } } },
        },
      },
    },
  },
  "/api/v1/delivery-partner/route/{routeId}/start": {
    post: {
      tags: ["Delivery Partner Mobile App"],
      summary: "Start Delivery Route Run",
      description: "Transitions assigned route to IN_PROGRESS and begins telemetry tracking.",
      operationId: "startDeliveryRouteRun",
      security: [{ DeliveryPartnerAuth: [] }],
      parameters: [{ name: "routeId", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        200: {
          description: "Route started.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } },
        },
      },
    },
  },
  "/api/v1/delivery-partner/route/{routeId}/stops/{stopId}/arrive": {
    post: {
      tags: ["Delivery Partner Mobile App"],
      summary: "Mark Arrival at Delivery Stop",
      description: "Notifies customer via SMS and Socket.IO that courier is outside.",
      operationId: "arriveAtDeliveryStop",
      security: [{ DeliveryPartnerAuth: [] }],
      parameters: [
        { name: "routeId", in: "path", required: true, schema: { type: "string" } },
        { name: "stopId", in: "path", required: true, schema: { type: "string" } },
      ],
      responses: {
        200: {
          description: "Arrival confirmed.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } },
        },
      },
    },
  },
  "/api/v1/delivery-partner/route/{routeId}/stops/{stopId}/otp": {
    post: {
      tags: ["Delivery Partner Mobile App"],
      summary: "Verify Customer Handover OTP",
      description: "Verifies the 4 or 6 digit secure delivery PIN shared by customer to complete doorstep delivery.",
      operationId: "verifyDeliveryStopOtp",
      security: [{ DeliveryPartnerAuth: [] }],
      parameters: [
        { name: "routeId", in: "path", required: true, schema: { type: "string" } },
        { name: "stopId", in: "path", required: true, schema: { type: "string" } },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["otp"],
              properties: { otp: { type: "string", example: "4921" } },
            },
          },
        },
      },
      responses: {
        200: {
          description: "OTP verified.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } },
        },
        400: {
          description: "Invalid delivery OTP.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorEnvelope" } } },
        },
      },
    },
  },
  "/api/v1/delivery-partner/route/{routeId}/stops/{stopId}/complete": {
    post: {
      tags: ["Delivery Partner Mobile App"],
      summary: "Complete Stop Delivery (Proof of Delivery)",
      description: "Finalizes delivery with recipient signature, POD photo URL, and updates order to DELIVERED.",
      operationId: "completeDeliveryStop",
      security: [{ DeliveryPartnerAuth: [] }],
      parameters: [
        { name: "routeId", in: "path", required: true, schema: { type: "string" } },
        { name: "stopId", in: "path", required: true, schema: { type: "string" } },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                podPhotoUrl: { type: "string" },
                signatureUrl: { type: "string" },
                deliveredTo: { type: "string", example: "Self" },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Delivery completed.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } },
        },
      },
    },
  },
  "/api/v1/delivery-partner/route/{routeId}/stops/{stopId}/fail": {
    post: {
      tags: ["Delivery Partner Mobile App"],
      summary: "Mark Stop Delivery Attempt Failed (NDR)",
      description: "Records failed delivery attempt (e.g. customer unavailable, premise locked) and schedules re-attempt.",
      operationId: "failDeliveryStop",
      security: [{ DeliveryPartnerAuth: [] }],
      parameters: [
        { name: "routeId", in: "path", required: true, schema: { type: "string" } },
        { name: "stopId", in: "path", required: true, schema: { type: "string" } },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["reason"],
              properties: {
                reason: { type: "string", enum: ["CUSTOMER_UNAVAILABLE", "PREMISE_LOCKED", "REJECTED_BY_CUSTOMER", "WRONG_ADDRESS"] },
                notes: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Failure logged.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } },
        },
      },
    },
  },
  "/api/v1/delivery-partner/location/ping": {
    post: {
      tags: ["Delivery Partner Mobile App"],
      summary: "Live GPS Telemetry Ping",
      description: "Submits courier's real-time coordinates, battery level, and speed for live map tracking in Control Tower.",
      operationId: "pingPartnerLocation",
      security: [{ DeliveryPartnerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["latitude", "longitude"],
              properties: {
                latitude: { type: "number", example: 12.9352 },
                longitude: { type: "number", example: 77.6245 },
                battery: { type: "integer", example: 85 },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Telemetry acknowledged.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } },
        },
      },
    },
  },
  "/api/v1/delivery-partner/earnings": {
    get: {
      tags: ["Delivery Partner Mobile App"],
      summary: "Courier Daily Earnings & Payout Breakdown",
      description: "Returns base pay, per-drop incentives, distance allowances, and tips for completed deliveries.",
      operationId: "getPartnerEarnings",
      security: [{ DeliveryPartnerAuth: [] }],
      responses: {
        200: {
          description: "Earnings breakdown.",
          content: { "application/json": { schema: { type: "object" } } },
        },
      },
    },
  },
  "/api/v1/delivery-partner/history": {
    get: {
      tags: ["Delivery Partner Mobile App"],
      summary: "Historical Completed Delivery Runs",
      operationId: "getPartnerHistory",
      security: [{ DeliveryPartnerAuth: [] }],
      responses: {
        200: {
          description: "Past delivery runs list.",
          content: { "application/json": { schema: { type: "array", items: { type: "object" } } } },
        },
      },
    },
  },
  "/api/v1/delivery-partner/route/{routeId}/stops/{stopId}/scan": {
    post: {
      tags: ["Delivery Partner Mobile App"],
      summary: "Scan Parcel Barcode at Stop Handover",
      description: "Validates package barcode against stop parcel manifest prior to OTP prompt.",
      operationId: "scanPackageAtStop",
      security: [{ DeliveryPartnerAuth: [] }],
      parameters: [
        { name: "routeId", in: "path", required: true, schema: { type: "string" } },
        { name: "stopId", in: "path", required: true, schema: { type: "string" } },
      ],
      requestBody: {
        required: true,
        content: { "application/json": { schema: { type: "object", required: ["barcode"], properties: { barcode: { type: "string" } } } } },
      },
      responses: {
        200: { description: "Package scan confirmed.", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } } },
      },
    },
  },
  "/api/v1/delivery-partner/route/{routeId}/stops/{stopId}/payment": {
    post: {
      tags: ["Delivery Partner Mobile App"],
      summary: "Collect Cash on Delivery (COD) Payment",
      description: "Records cash collected or dynamic UPI QR payment at customer doorstep.",
      operationId: "collectCodPaymentAtStop",
      security: [{ DeliveryPartnerAuth: [] }],
      parameters: [
        { name: "routeId", in: "path", required: true, schema: { type: "string" } },
        { name: "stopId", in: "path", required: true, schema: { type: "string" } },
      ],
      requestBody: {
        required: true,
        content: { "application/json": { schema: { type: "object", required: ["amountCollected", "mode"], properties: { amountCollected: { type: "number" }, mode: { type: "string", enum: ["CASH", "UPI_QR"] } } } } },
      },
      responses: {
        200: { description: "Payment collected.", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } } },
      },
    },
  },
  "/api/v1/delivery-partner/exceptions/report": {
    post: {
      tags: ["Delivery Partner Mobile App"],
      summary: "Courier On-Field Exception Incident Report",
      description: "Reports road accidents, vehicle breakdown, heavy rain delay, or unruly recipient.",
      operationId: "reportPartnerFieldException",
      security: [{ DeliveryPartnerAuth: [] }],
      requestBody: {
        required: true,
        content: { "application/json": { schema: { type: "object", required: ["incidentType", "description"], properties: { incidentType: { type: "string" }, description: { type: "string" } } } } },
      },
      responses: {
        201: { description: "Incident logged and control tower alerted.", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } } },
      },
    },
  },
};
