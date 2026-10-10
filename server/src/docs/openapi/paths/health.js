/**
 * OpenAPI 3.1 Paths: Operational & Health Monitoring
 */
export const healthPaths = {
  "/health": {
    get: {
      tags: ["Operational"],
      summary: "Service Health & Liveness Probe",
      description: "Returns process uptime, current timestamp, and microservice status. Used by container orchestrators for liveness checking.",
      operationId: "getHealthStatus",
      responses: {
        200: {
          description: "Service is healthy and responding to requests.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", example: "UP" },
                  uptime: { type: "number", example: 124.5 },
                  timestamp: { type: "string", format: "date-time" },
                  service: { type: "string", example: "zosh-bazaar-backend" },
                },
              },
            },
          },
        },
      },
    },
  },
  "/ready": {
    get: {
      tags: ["Operational"],
      summary: "Database & Subsystem Readiness Probe",
      description: "Checks MongoDB connection state (readyState === 1) and core internal service connectivity before routing traffic.",
      operationId: "getReadinessStatus",
      responses: {
        200: {
          description: "Database cluster is connected and operational.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", example: "READY" },
                  database: { type: "string", example: "CONNECTED" },
                  timestamp: { type: "string", format: "date-time" },
                },
              },
            },
          },
        },
        503: {
          description: "Database cluster is disconnected or degraded.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", example: "DEGRADED" },
                  database: { type: "string", example: "DISCONNECTED" },
                  timestamp: { type: "string", format: "date-time" },
                },
              },
            },
          },
        },
      },
    },
  },
  "/": {
    get: {
      tags: ["Operational"],
      summary: "Root Welcome Endpoint",
      description: "Returns greeting message confirming that Zosh Bazaar production backend is online.",
      operationId: "getRootWelcome",
      responses: {
        200: {
          description: "Welcome message returned.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: { type: "string", example: "Hello! Welcome to Zosh Bazaar Production Backend System!" },
                },
              },
            },
          },
        },
      },
    },
  },
};
