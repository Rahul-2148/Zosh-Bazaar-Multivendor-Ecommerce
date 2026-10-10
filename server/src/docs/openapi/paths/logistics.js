/**
 * OpenAPI 3.1 Paths: Logistics Control Tower, Fleet, Hubs & Fulfillment Network
 */

export const logisticsPaths = {
  "/api/v1/logistics/tracking/{trackingNumber}": {
    get: {
      tags: ["Logistics & Tracking"],
      summary: "Public Parcel Tracking by Tracking Number",
      description: "Returns customer-facing delivery milestones and live fulfillment status without authentication.",
      operationId: "getPublicTracking",
      parameters: [{ name: "trackingNumber", in: "path", required: true, schema: { type: "string" }, example: "ZB-TRK-7849102" }],
      responses: {
        200: {
          description: "Tracking history and current shipment state.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Shipment" } } },
        },
      },
    },
  },
  "/api/v1/logistics/serviceability": {
    get: {
      tags: ["Logistics & Tracking"],
      summary: "Check Pincode Serviceability & Delivery SLA",
      description: "Validates if destination postal code is serviceable, supported payment modes (COD / Prepaid), and estimated transit days.",
      operationId: "checkPincodeServiceability",
      parameters: [{ name: "pincode", in: "query", required: true, schema: { type: "string" }, example: "560001" }],
      responses: {
        200: {
          description: "Pincode serviceability details.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  serviceable: { type: "boolean", example: true },
                  codAvailable: { type: "boolean", example: true },
                  estimatedDays: { type: "integer", example: 2 },
                  hubCode: { type: "string", example: "HUB-BLR-01" },
                },
              },
            },
          },
        },
      },
    },
  },
  "/api/v1/logistics/overview": {
    get: {
      tags: ["Logistics Control Tower"],
      summary: "Control Tower Mission Control Overview",
      description: "Returns real-time KPIs: active shipments in transit, hub backlog, delivery success rate, and unresolved exceptions.",
      operationId: "getLogisticsOverview",
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: "Control tower metrics.",
          content: { "application/json": { schema: { type: "object" } } },
        },
      },
    },
  },
  "/api/v1/logistics/operations-board": {
    get: {
      tags: ["Logistics Control Tower"],
      summary: "Live Kanban Operations Board",
      description: "Aggregates parcels across states (Pending Dispatch, At Origin Hub, In Linehaul, Out for Delivery, Exceptions).",
      operationId: "getLogisticsOperationsBoard",
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: "Operations board state.",
          content: { "application/json": { schema: { type: "object" } } },
        },
      },
    },
  },
  "/api/v1/logistics/shipments": {
    get: {
      tags: ["Logistics Shipments"],
      summary: "List Shipments with Filtering",
      description: "Returns paginated parcels with filters for status, origin hub, destination hub, and assigned courier.",
      operationId: "getLogisticsShipments",
      security: [{ BearerAuth: [] }],
      parameters: [
        { name: "status", in: "query", required: false, schema: { type: "string" } },
        { $ref: "#/components/parameters/PageParam" },
        { $ref: "#/components/parameters/LimitParam" },
      ],
      responses: {
        200: {
          description: "Shipments list.",
          content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Shipment" } } } },
        },
      },
    },
  },
  "/api/v1/logistics/shipments/{id}": {
    get: {
      tags: ["Logistics Shipments"],
      summary: "Get Shipment Details by ID",
      operationId: "getLogisticsShipmentById",
      security: [{ BearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        200: {
          description: "Shipment details.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Shipment" } } },
        },
      },
    },
  },
  "/api/v1/logistics/shipments/create": {
    post: {
      tags: ["Logistics Shipments"],
      summary: "Create Logistics Shipment",
      description: "Registers a new parcel for linehaul or last-mile dispatch.",
      operationId: "createLogisticsShipment",
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: { "application/json": { schema: { $ref: "#/components/schemas/Shipment" } } },
      },
      responses: {
        201: {
          description: "Shipment created.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Shipment" } } },
        },
      },
    },
  },
  "/api/v1/logistics/shipments/{id}/transition": {
    patch: {
      tags: ["Logistics Shipments"],
      summary: "Transition Shipment Milestone Status",
      description: "Updates shipment state (e.g. IN_TRANSIT -> AT_HUB) and triggers customer notification.",
      operationId: "transitionShipmentStatus",
      security: [{ BearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["status"],
              properties: { status: { type: "string" }, notes: { type: "string" } },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Shipment transitioned.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Shipment" } } },
        },
      },
    },
  },
  "/api/v1/logistics/shipments/{id}/assign": {
    patch: {
      tags: ["Logistics Shipments"],
      summary: "Assign Delivery Partner to Shipment",
      description: "Dispatches parcel to a delivery courier and notifies agent via mobile app push.",
      operationId: "assignAgentToShipment",
      security: [{ BearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["agentId"],
              properties: { agentId: { type: "string", example: "AGT-1002" } },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Agent assigned.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Shipment" } } },
        },
      },
    },
  },
  "/api/v1/logistics/scan": {
    post: {
      tags: ["Logistics Operations"],
      summary: "Barcode / QR Package Scanner Ingest",
      description: "Processes rapid handheld barcode scan at hub arrival or vehicle loading.",
      operationId: "processPackageScan",
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["trackingNumber", "scanAction"],
              properties: {
                trackingNumber: { type: "string", example: "ZB-TRK-7849102" },
                scanAction: { type: "string", enum: ["INBOUND_RECEIVE", "OUTBOUND_DISPATCH", "BIN_SORT"] },
                hubCode: { type: "string", example: "HUB-BLR-01" },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Scan verified and parcel status updated.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } },
        },
      },
    },
  },
  "/api/v1/logistics/hubs": {
    get: {
      tags: ["Logistics Network"],
      summary: "List Logistics Hubs & Sortation Facilities",
      operationId: "getLogisticsHubs",
      security: [{ BearerAuth: [] }],
      responses: {
        200: { description: "Hubs list.", content: { "application/json": { schema: { type: "array", items: { type: "object" } } } } },
      },
    },
    post: {
      tags: ["Logistics Network"],
      summary: "Create Logistics Hub",
      operationId: "createLogisticsHub",
      security: [{ BearerAuth: [] }],
      requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
      responses: { 201: { description: "Hub created.", content: { "application/json": { schema: { type: "object" } } } } },
    },
  },
  "/api/v1/logistics/routes": {
    get: {
      tags: ["Logistics Fleet & Dispatch"],
      summary: "List Delivery Routes",
      operationId: "getLogisticsRoutes",
      security: [{ BearerAuth: [] }],
      responses: {
        200: { description: "Routes list.", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/DeliveryRoute" } } } } },
      },
    },
    post: {
      tags: ["Logistics Fleet & Dispatch"],
      summary: "Create Optimized Delivery Route",
      description: "Generates clustered multi-stop delivery run assigned to a delivery partner.",
      operationId: "createDeliveryRoute",
      security: [{ BearerAuth: [] }],
      requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/DeliveryRoute" } } } },
      responses: { 201: { description: "Route planned.", content: { "application/json": { schema: { $ref: "#/components/schemas/DeliveryRoute" } } } } },
    },
  },
  "/api/v1/logistics/exceptions": {
    get: {
      tags: ["Logistics Exceptions"],
      summary: "List Delivery Exceptions & NDRs",
      description: "Non-Delivery Reports (customer unavailable, incorrect address, door locked, damaged).",
      operationId: "getLogisticsExceptions",
      security: [{ BearerAuth: [] }],
      responses: {
        200: { description: "Exceptions list.", content: { "application/json": { schema: { type: "array", items: { type: "object" } } } } },
      },
    },
    post: {
      tags: ["Logistics Exceptions"],
      summary: "Report Logistics Exception",
      operationId: "createLogisticsException",
      security: [{ BearerAuth: [] }],
      requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
      responses: { 201: { description: "Exception logged.", content: { "application/json": { schema: { type: "object" } } } } },
    },
  },
  "/api/v1/logistics/exceptions/{id}": {
    patch: {
      tags: ["Logistics Exceptions"],
      summary: "Update Exception Status & Resolution",
      operationId: "updateExceptionStatus",
      security: [{ BearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
      responses: {
        200: {
          description: "Exception status updated.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } },
        },
      },
    },
  },
  "/api/v1/logistics/analytics": {
    get: {
      tags: ["Logistics Control Tower"],
      summary: "Logistics SLA & Network Analytics",
      description: "Aggregates on-time delivery rate, first-attempt delivery success, route density, and transit duration.",
      operationId: "getLogisticsAnalyticsData",
      security: [{ BearerAuth: [] }],
      responses: {
        200: { description: "Analytics data.", content: { "application/json": { schema: { type: "object" } } } },
      },
    },
  },
  "/api/v1/logistics/shipments/{id}/pod": {
    post: {
      tags: ["Logistics Shipments"],
      summary: "Record Proof of Delivery (Control Tower Override)",
      operationId: "recordLogisticsProofOfDelivery",
      security: [{ BearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
      responses: {
        200: {
          description: "POD recorded.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Shipment" } } },
        },
      },
    },
  },
  "/api/v1/logistics/shipments/{id}/attempt": {
    post: {
      tags: ["Logistics Shipments"],
      summary: "Record Delivery Attempt Milestone",
      operationId: "recordLogisticsDeliveryAttempt",
      security: [{ BearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
      responses: {
        200: {
          description: "Attempt logged.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Shipment" } } },
        },
      },
    },
  },
  "/api/v1/logistics/hubs/{id}": {
    get: {
      tags: ["Logistics Network"],
      summary: "Get Hub Details by ID",
      operationId: "getLogisticsHubById",
      security: [{ BearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        200: {
          description: "Hub details.",
          content: { "application/json": { schema: { type: "object" } } },
        },
      },
    },
    patch: {
      tags: ["Logistics Network"],
      summary: "Update Hub Configuration",
      operationId: "updateLogisticsHub",
      security: [{ BearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
      responses: {
        200: {
          description: "Hub updated.",
          content: { "application/json": { schema: { type: "object" } } },
        },
      },
    },
  },
  "/api/v1/logistics/zones": {
    get: {
      tags: ["Logistics Network"],
      summary: "List Service Delivery Zones",
      operationId: "getLogisticsZones",
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: "Zones list.",
          content: { "application/json": { schema: { type: "array", items: { type: "object" } } } },
        },
      },
    },
    post: {
      tags: ["Logistics Network"],
      summary: "Create Service Delivery Zone",
      operationId: "createLogisticsZone",
      security: [{ BearerAuth: [] }],
      requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
      responses: {
        201: {
          description: "Zone created.",
          content: { "application/json": { schema: { type: "object" } } },
        },
      },
    },
  },
  "/api/v1/logistics/manifests": {
    get: {
      tags: ["Logistics Network"],
      summary: "List Dispatch Manifests",
      operationId: "getLogisticsManifests",
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: "Manifests list.",
          content: { "application/json": { schema: { type: "array", items: { type: "object" } } } },
        },
      },
    },
    post: {
      tags: ["Logistics Network"],
      summary: "Create Dispatch Manifest",
      operationId: "createLogisticsManifest",
      security: [{ BearerAuth: [] }],
      requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
      responses: {
        201: {
          description: "Manifest created.",
          content: { "application/json": { schema: { type: "object" } } },
        },
      },
    },
  },
  "/api/v1/logistics/manifests/{id}/seal": {
    patch: {
      tags: ["Logistics Network"],
      summary: "Seal Manifest Before Loading",
      operationId: "sealLogisticsManifest",
      security: [{ BearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        200: {
          description: "Manifest sealed.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } },
        },
      },
    },
  },
  "/api/v1/logistics/manifests/{id}/dispatch": {
    patch: {
      tags: ["Logistics Network"],
      summary: "Dispatch Manifest on Linehaul Route",
      operationId: "dispatchLogisticsManifest",
      security: [{ BearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        200: {
          description: "Manifest dispatched.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } },
        },
      },
    },
  },
  "/api/v1/logistics/manifests/{id}/receive": {
    patch: {
      tags: ["Logistics Network"],
      summary: "Receive Manifest at Destination Hub",
      operationId: "receiveLogisticsManifest",
      security: [{ BearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        200: {
          description: "Manifest received and inbound scanned.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } },
        },
      },
    },
  },
  "/api/v1/logistics/agents": {
    get: {
      tags: ["Logistics Fleet & Dispatch"],
      summary: "List Delivery Agents & Couriers",
      operationId: "getLogisticsAgents",
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: "Agents list.",
          content: { "application/json": { schema: { type: "array", items: { type: "object" } } } },
        },
      },
    },
    post: {
      tags: ["Logistics Fleet & Dispatch"],
      summary: "Register Delivery Agent",
      operationId: "createLogisticsAgent",
      security: [{ BearerAuth: [] }],
      requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
      responses: {
        201: {
          description: "Agent registered.",
          content: { "application/json": { schema: { type: "object" } } },
        },
      },
    },
  },
  "/api/v1/logistics/agents/{id}": {
    get: {
      tags: ["Logistics Fleet & Dispatch"],
      summary: "Get Agent by ID",
      operationId: "getLogisticsAgentById",
      security: [{ BearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        200: {
          description: "Agent details.",
          content: { "application/json": { schema: { type: "object" } } },
        },
      },
    },
  },
  "/api/v1/logistics/agents/{id}/status": {
    patch: {
      tags: ["Logistics Fleet & Dispatch"],
      summary: "Update Agent Duty Status",
      operationId: "updateAgentDutyStatus",
      security: [{ BearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
      responses: {
        200: {
          description: "Status updated.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } },
        },
      },
    },
  },
  "/api/v1/logistics/agents/{id}/location": {
    patch: {
      tags: ["Logistics Fleet & Dispatch"],
      summary: "Update Agent Realtime Coordinates",
      operationId: "updateAgentCoordinates",
      security: [{ BearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
      responses: {
        200: {
          description: "Location saved.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } },
        },
      },
    },
  },
  "/api/v1/logistics/routes/{routeId}/stops/{stopId}": {
    patch: {
      tags: ["Logistics Fleet & Dispatch"],
      summary: "Update Route Stop Status (Control Tower)",
      operationId: "updateRouteStopControlTower",
      security: [{ BearerAuth: [] }],
      parameters: [
        { name: "routeId", in: "path", required: true, schema: { type: "string" } },
        { name: "stopId", in: "path", required: true, schema: { type: "string" } },
      ],
      requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
      responses: {
        200: {
          description: "Stop updated.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } },
        },
      },
    },
  },
};

