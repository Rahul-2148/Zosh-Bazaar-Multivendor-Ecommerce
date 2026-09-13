import express from "express";
import deliveryPartnerController from "../controllers/deliveryPartner.controller.js";
import deliveryPartnerAuthMiddleware from "../../../middlewares/deliveryPartnerAuthMiddleware.js";

const deliveryPartnerRouter = express.Router();

// 1. Authentication (Public)
deliveryPartnerRouter.post("/auth/login", deliveryPartnerController.login);

// Protected Delivery Partner Execution Endpoints
deliveryPartnerRouter.use(deliveryPartnerAuthMiddleware);

// 2. Profile & Shift Operations
deliveryPartnerRouter.get("/profile", deliveryPartnerController.getProfile);
deliveryPartnerRouter.patch("/shift", deliveryPartnerController.updateShift);

// 3. Active Route Execution
deliveryPartnerRouter.get("/route/active", deliveryPartnerController.getActiveRoute);
deliveryPartnerRouter.post("/route/:routeId/start", deliveryPartnerController.startRoute);

// 4. Stop Level Lifecycle
deliveryPartnerRouter.post("/route/:routeId/stops/:stopId/arrive", deliveryPartnerController.arriveAtStop);
deliveryPartnerRouter.post("/route/:routeId/stops/:stopId/scan", deliveryPartnerController.scanPackage);
deliveryPartnerRouter.post("/route/:routeId/stops/:stopId/otp", deliveryPartnerController.verifyOtp);
deliveryPartnerRouter.post("/route/:routeId/stops/:stopId/payment", deliveryPartnerController.collectPayment);
deliveryPartnerRouter.post("/route/:routeId/stops/:stopId/complete", deliveryPartnerController.completeDelivery);
deliveryPartnerRouter.post("/route/:routeId/stops/:stopId/fail", deliveryPartnerController.failDelivery);

// 5. Incident & Exception Reporting
deliveryPartnerRouter.post("/exceptions/report", deliveryPartnerController.reportException);

// 6. Live Telemetry
deliveryPartnerRouter.post("/location/ping", deliveryPartnerController.updateLocation);

// 7. Earnings & History
deliveryPartnerRouter.get("/earnings", deliveryPartnerController.getEarnings);
deliveryPartnerRouter.get("/history", deliveryPartnerController.getHistory);

export default deliveryPartnerRouter;
