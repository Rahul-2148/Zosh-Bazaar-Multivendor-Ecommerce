import express from "express";
import logisticsController from "../controllers/logistics.controller.js";
import authMiddleware from "../../../middlewares/authMiddleware.js";
import { logisticsOnly } from "../../../middlewares/rbac.middleware.js";

const logisticsRouter = express.Router();

// 1. Public Endpoints (Customer parcel tracking & Pincode serviceability check)
logisticsRouter.get("/tracking/:trackingNumber", logisticsController.getCustomerTracking);
logisticsRouter.get("/serviceability", logisticsController.checkServiceability);

// Logistics Operational Middleware Guard
const logisticsAuth = [authMiddleware, logisticsOnly];

// 2. Overview & Operational Analytics (Control Tower)
logisticsRouter.get("/overview", ...logisticsAuth, logisticsController.getOverview);
logisticsRouter.get("/operations-board", ...logisticsAuth, logisticsController.getOperationsBoard);
logisticsRouter.get("/analytics", ...logisticsAuth, logisticsController.getAnalytics);

// 3. Shipments Management
logisticsRouter.get("/shipments", ...logisticsAuth, logisticsController.getShipments);
logisticsRouter.get("/shipments/:id", ...logisticsAuth, logisticsController.getShipmentById);
logisticsRouter.post("/shipments/create", ...logisticsAuth, logisticsController.createShipment);
logisticsRouter.patch("/shipments/:id/transition", ...logisticsAuth, logisticsController.transitionStatus);
logisticsRouter.patch("/shipments/:id/assign", ...logisticsAuth, logisticsController.assignAgent);
logisticsRouter.post("/shipments/:id/pod", ...logisticsAuth, logisticsController.recordProofOfDelivery);
logisticsRouter.post("/shipments/:id/attempt", ...logisticsAuth, logisticsController.recordDeliveryAttempt);

// 4. Hubs & Facilities
logisticsRouter.get("/hubs", ...logisticsAuth, logisticsController.getHubs);
logisticsRouter.get("/hubs/:id", ...logisticsAuth, logisticsController.getHubById);
logisticsRouter.post("/hubs", ...logisticsAuth, logisticsController.createHub);
logisticsRouter.patch("/hubs/:id", ...logisticsAuth, logisticsController.updateHub);

// 5. Zones Management
logisticsRouter.get("/zones", ...logisticsAuth, logisticsController.getZones);
logisticsRouter.post("/zones", ...logisticsAuth, logisticsController.createZone);

// 6. Manifests & Dispatch
logisticsRouter.get("/manifests", ...logisticsAuth, logisticsController.getManifests);
logisticsRouter.post("/manifests", ...logisticsAuth, logisticsController.createManifest);
logisticsRouter.patch("/manifests/:id/seal", ...logisticsAuth, logisticsController.sealManifest);
logisticsRouter.patch("/manifests/:id/dispatch", ...logisticsAuth, logisticsController.dispatchManifest);
logisticsRouter.patch("/manifests/:id/receive", ...logisticsAuth, logisticsController.receiveManifest);

// 7. Package Scanner
logisticsRouter.post("/scan", ...logisticsAuth, logisticsController.processScan);

// 8. Fleet & Delivery Agents
logisticsRouter.get("/agents", ...logisticsAuth, logisticsController.getAgents);
logisticsRouter.get("/agents/:id", ...logisticsAuth, logisticsController.getAgentById);
logisticsRouter.post("/agents", ...logisticsAuth, logisticsController.createAgent);
logisticsRouter.patch("/agents/:id/status", ...logisticsAuth, logisticsController.updateAgentStatus);
logisticsRouter.patch("/agents/:id/location", ...logisticsAuth, logisticsController.updateAgentLocation);

// 9. Delivery Routes
logisticsRouter.get("/routes", ...logisticsAuth, logisticsController.getRoutes);
logisticsRouter.post("/routes", ...logisticsAuth, logisticsController.createRoute);
logisticsRouter.patch("/routes/:routeId/stops/:stopId", ...logisticsAuth, logisticsController.updateRouteStop);

// 10. Exceptions
logisticsRouter.get("/exceptions", ...logisticsAuth, logisticsController.getExceptions);
logisticsRouter.post("/exceptions", ...logisticsAuth, logisticsController.createException);
logisticsRouter.patch("/exceptions/:id", ...logisticsAuth, logisticsController.updateExceptionStatus);

export default logisticsRouter;
