const bootStartTime = Date.now();
import http from "http";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import compression from "compression";
import morgan from "morgan";
import connectDB from "./db/connectDB.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { initSocket } from "./realtime/socket.js";
import { getAllowedOrigins } from "./config/corsConfig.js";
dotenv.config({ quiet: true });

// importing domain modular routers
import path from "path";
import { fileURLToPath } from "url";
import customerRouter from "./modules/customer/customer.router.js";
import sellerRouter from "./modules/seller/seller.router.js";
import adminRouter from "./modules/admin/admin.router.js";
import logisticsRouter from "./modules/logistics/logistics.router.js";
import deliveryPartnerRouter from "./modules/deliveryPartner/deliveryPartner.router.js";
import { startDeletionWorker } from "./workers/deletionWorker.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Initialize real-time WebSocket hub
initSocket(server);

// middleware
app.use(
  cors({
    origin: getAllowedOrigins(),
    credentials: true,
  })
);
app.use(compression());
app.use(bodyParser.json());
app.use(morgan("dev"));

// Statically serve dedicated product uploads with cross-origin access
app.use(
  "/uploads",
  express.static(path.join(__dirname, "../uploads"), {
    maxAge: "7d",
    setHeaders: (res) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    },
  })
);

// ----------------------------------------------------
// ROLE-BASED DOMAIN MODULE ROUTERS
// ----------------------------------------------------

// 1. Customer & Discovery domain routes (Client Web: Port 5173)
app.use("/api/v1", customerRouter);

// 2. Vendor / Merchant domain routes (Seller Console: Port 5175)
app.use("/api/v1/seller", sellerRouter);

// 3. Platform Administration domain routes (Admin Console: Port 5176)
app.use("/api/v1/admin", adminRouter);

// 4. Logistics Control Tower domain routes (Logistics Hub: Port 5174)
app.use("/api/v1/logistics", logisticsRouter);

// 5. Last-Mile Delivery Partner domain routes (Partner App: Port 5177)
app.use("/api/v1/delivery-partner", deliveryPartnerRouter);

// default route
app.get("/", (req, res) => {
  res.send({ message: "Hello! Welcome to Zosh Bazaar Production Backend System!" });
});

// 404 catch-all for undefined routes
app.use((req, res) => {
  res.status(404).json({
    message: `Route ${req.method} ${req.originalUrl} not found`,
    error: true,
    success: false,
  });
});

// Centralized error handler (must be last middleware)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, async () => {
  await connectDB();
  startDeletionWorker();
  const duration = Date.now() - bootStartTime;
  console.log(`Server running on port ${PORT} [ready in ${duration}ms]`);
});
