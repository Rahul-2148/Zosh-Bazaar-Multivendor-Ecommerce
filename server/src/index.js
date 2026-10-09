const bootStartTime = Date.now();
import "./config/env.js";
import http from "http";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import compression from "compression";
import morgan from "morgan";
import connectDB from "./db/connectDB.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { initSocket } from "./realtime/socket.js";
import { getAllowedOrigins } from "./config/corsConfig.js";

// importing domain modular routers
import path from "path";
import { fileURLToPath } from "url";
import customerRouter from "./modules/customer/customer.router.js";
import sellerRouter from "./modules/seller/seller.router.js";
import adminRouter from "./modules/admin/admin.router.js";
import logisticsRouter from "./modules/logistics/logistics.router.js";
import deliveryPartnerRouter from "./modules/deliveryPartner/deliveryPartner.router.js";
import { startDeletionWorker } from "./workers/deletionWorker.js";
import emailPreviewRouter from "./modules/email/preview/email-preview.router.js";
import { startEmailWorker } from "./modules/email/index.js";
import paymentOutboxService from "./modules/payment/services/PaymentOutboxService.js";

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
app.use(
  bodyParser.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
    limit: "10mb",
  })
);
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));
app.use(morgan("dev"));

// ----------------------------------------------------
// OBSERVABILITY & HEALTH MONITORING (Section 50)
// ----------------------------------------------------
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "UP",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: "zosh-bazaar-backend",
  });
});

app.get("/ready", (req, res) => {
  const isDbReady = connectDB && mongoose.connection.readyState === 1;
  if (!isDbReady) {
    return res.status(503).json({
      status: "DEGRADED",
      database: "DISCONNECTED",
      timestamp: new Date().toISOString(),
    });
  }
  return res.status(200).json({
    status: "READY",
    database: "CONNECTED",
    timestamp: new Date().toISOString(),
  });
});

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

// 6. Transactional Email Preview Studio (Development Mode Only)
if (process.env.NODE_ENV !== "production") {
  app.use("/dev/emails", emailPreviewRouter);
}

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

server.listen(PORT, () => {
  const duration = Date.now() - bootStartTime;
  console.log(`🚀 [Server] Online & listening on port ${PORT} [ready in ${duration}ms]`);
  if (process.env.NODE_ENV !== "production") {
    console.log(`🎨 [Email Studio] Preview available at http://localhost:${PORT}/dev/emails`);
  }
  console.log("🔌 [MongoDB] Connecting to database cluster...");
});

// Non-blocking database connection & worker startup
connectDB()
  .then(() => {
    startDeletionWorker();
    startEmailWorker();
    paymentOutboxService.startOutboxWorker(5000);
    console.log("⚡ [Services] Database connected, workers & payment outbox operational.");
  })
  .catch((err) => {
    console.error("❌ [Services] Database startup failure:", err.message);
  });

// ----------------------------------------------------
// GRACEFUL SHUTDOWN (Section 51)
// ----------------------------------------------------
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 [Server] Received ${signal}. Initiating graceful shutdown...`);
  try {
    server.close(() => {
      console.log("🔒 [Server] Closed HTTP incoming connections.");
    });
    const io = (await import("./realtime/socket.js")).getIO();
    if (io) {
      io.close(() => {
        console.log("🔌 [Socket.IO] Real-time engine closed.");
      });
    }
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close(false);
      console.log("📦 [MongoDB] Database connection closed.");
    }
    console.log("✅ [Server] Graceful shutdown complete. Exiting process.");
    process.exit(0);
  } catch (err) {
    console.error("❌ [Server] Error during graceful shutdown:", err);
    process.exit(1);
  }
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
