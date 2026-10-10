import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Load environment config first
import "../src/config/env.js";
import emailPreviewRouter from "../src/modules/email/preview/email-preview.router.js";

import authRouter from "../src/modules/customer/routes/auth.route.js";
import userRouter from "../src/modules/customer/routes/user.route.js";
import accountRouter from "../src/modules/customer/routes/account.route.js";
import categoryRouter from "../src/modules/customer/routes/category.route.js";
import brandRouter from "../src/modules/customer/routes/brand.route.js";
import productRouter from "../src/modules/customer/routes/product.route.js";
import reviewRouter from "../src/modules/customer/routes/review.route.js";
import settingsRouter from "../src/modules/admin/routes/settings.route.js";
import cartRouter from "../src/modules/customer/routes/cart.route.js";
import orderRouter from "../src/modules/customer/routes/order.route.js";
import paymentRouter from "../src/modules/payment/routes/payment.route.js";
import homeCategoryRouter from "../src/modules/customer/routes/homeCategory.route.js";
import transactionRouter from "../src/modules/customer/routes/transaction.route.js";
import wishlistRouter from "../src/modules/customer/routes/wishlist.route.js";
import couponRouter from "../src/modules/customer/routes/coupon.route.js";
import notificationRouter from "../src/modules/customer/routes/notification.route.js";
import uploadRouter from "../src/modules/customer/routes/upload.route.js";
import aiRouter from "../src/modules/ai/ai.router.js";

import sellerSubRouter from "../src/modules/seller/routes/seller.route.js";
import sellerProductRouter from "../src/modules/seller/routes/sellerProduct.route.js";
import sellerOrderRouter from "../src/modules/seller/routes/sellerOrder.route.js";
import sellerReportRouter from "../src/modules/seller/routes/sellerReport.route.js";

import adminSubRouter from "../src/modules/admin/routes/admin.route.js";
import dealRouter from "../src/modules/admin/routes/deal.route.js";

import logisticsSubRouter from "../src/modules/logistics/routes/logistics.route.js";
import deliveryPartnerSubRouter from "../src/modules/deliveryPartner/routes/deliveryPartner.route.js";

function extractFromRouter(router, prefix) {
  const routes = [];
  const stack = router.stack || [];
  for (const layer of stack) {
    if (layer.route) {
      const p = layer.route.path;
      const methods = Object.keys(layer.route.methods).map(m => m.toUpperCase());
      const full = (prefix + (p === "/" ? "" : p)).replace(/\/+/g, "/") || "/";
      const middlewares = layer.route.stack.map(s => s.name || "anonymous");
      for (const m of methods) {
        routes.push({ method: m, path: full, middlewares });
      }
    }
  }
  return routes;
}

const allDiscovered = [
  { method: "GET", path: "/health", middlewares: ["anonymous"] },
  { method: "GET", path: "/ready", middlewares: ["anonymous"] },
  { method: "GET", path: "/", middlewares: ["anonymous"] },

  // Customer subrouters
  ...extractFromRouter(authRouter, "/api/v1/auth"),
  ...extractFromRouter(userRouter, "/api/v1/user"),
  ...extractFromRouter(accountRouter, "/api/v1/account"),
  ...extractFromRouter(categoryRouter, "/api/v1/category"),
  ...extractFromRouter(brandRouter, "/api/v1/brand"),
  ...extractFromRouter(productRouter, "/api/v1/product"),
  ...extractFromRouter(reviewRouter, "/api/v1/review"),
  ...extractFromRouter(settingsRouter, "/api/v1/settings"),
  ...extractFromRouter(cartRouter, "/api/v1/cart"),
  ...extractFromRouter(orderRouter, "/api/v1/order"),
  ...extractFromRouter(paymentRouter, "/api/v1/payment"),
  ...extractFromRouter(homeCategoryRouter, "/api/v1/homeCategory"),
  ...extractFromRouter(homeCategoryRouter, "/api/v1/home"),
  ...extractFromRouter(transactionRouter, "/api/v1/transactions"),
  ...extractFromRouter(transactionRouter, "/api/v1/transaction"),
  ...extractFromRouter(wishlistRouter, "/api/v1/wishlist"),
  ...extractFromRouter(couponRouter, "/api/v1/coupon"),
  ...extractFromRouter(notificationRouter, "/api/v1/notifications"),
  ...extractFromRouter(uploadRouter, "/api/v1/upload"),
  ...extractFromRouter(aiRouter, "/api/v1/recommendations"),
  ...extractFromRouter(aiRouter, "/api/v1/ai"),

  // Seller subrouters
  ...extractFromRouter(sellerProductRouter, "/api/v1/seller/product"),
  ...extractFromRouter(sellerOrderRouter, "/api/v1/seller/order"),
  ...extractFromRouter(sellerOrderRouter, "/api/v1/seller/orders"),
  ...extractFromRouter(sellerReportRouter, "/api/v1/seller/report"),
  ...extractFromRouter(uploadRouter, "/api/v1/seller/upload"),
  ...extractFromRouter(sellerSubRouter, "/api/v1/seller"),

  // Admin subrouters
  ...extractFromRouter(dealRouter, "/api/v1/admin/deal"),
  ...extractFromRouter(uploadRouter, "/api/v1/admin/upload"),
  ...extractFromRouter(adminSubRouter, "/api/v1/admin"),

  // Logistics
  ...extractFromRouter(logisticsSubRouter, "/api/v1/logistics"),

  // Delivery Partner
  ...extractFromRouter(uploadRouter, "/api/v1/delivery-partner/upload"),
  ...extractFromRouter(deliveryPartnerSubRouter, "/api/v1/delivery-partner"),

  // Dev emails
  ...extractFromRouter(emailPreviewRouter, "/dev/emails"),
];

// Deduplicate
const uniqueMap = new Map();
for (const r of allDiscovered) {
  let p = r.path.replace(/\/+/g, "/");
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  const key = `${r.method} ${p}`;
  if (!uniqueMap.has(key)) {
    uniqueMap.set(key, { ...r, path: p });
  }
}

const allRoutes = Array.from(uniqueMap.values());
console.log(`Discovered ${allRoutes.length} unique API routes!`);

const categories = {
  health: allRoutes.filter(r => r.path === "/" || r.path === "/health" || r.path === "/ready"),
  auth: allRoutes.filter(r => r.path.startsWith("/api/v1/auth")),
  user: allRoutes.filter(r => r.path.startsWith("/api/v1/user")),
  account: allRoutes.filter(r => r.path.startsWith("/api/v1/account")),
  product: allRoutes.filter(r => r.path.startsWith("/api/v1/product")),
  category: allRoutes.filter(r => r.path.startsWith("/api/v1/category")),
  brand: allRoutes.filter(r => r.path.startsWith("/api/v1/brand")),
  cart: allRoutes.filter(r => r.path.startsWith("/api/v1/cart")),
  order: allRoutes.filter(r => r.path.startsWith("/api/v1/order")),
  payment: allRoutes.filter(r => r.path.startsWith("/api/v1/payment") && !r.path.startsWith("/api/v1/payment/admin")),
  paymentAdmin: allRoutes.filter(r => r.path.startsWith("/api/v1/payment/admin")),
  wishlist: allRoutes.filter(r => r.path.startsWith("/api/v1/wishlist")),
  coupon: allRoutes.filter(r => r.path.startsWith("/api/v1/coupon")),
  review: allRoutes.filter(r => r.path.startsWith("/api/v1/review")),
  notification: allRoutes.filter(r => r.path.startsWith("/api/v1/notifications")),
  home: allRoutes.filter(r => r.path.startsWith("/api/v1/home") || r.path.startsWith("/api/v1/homeCategory")),
  upload: allRoutes.filter(r => r.path.includes("/upload")),
  ai: allRoutes.filter(r => r.path.startsWith("/api/v1/ai") || r.path.startsWith("/api/v1/recommendations")),
  seller: allRoutes.filter(r => r.path.startsWith("/api/v1/seller")),
  admin: allRoutes.filter(r => r.path.startsWith("/api/v1/admin")),
  logistics: allRoutes.filter(r => r.path.startsWith("/api/v1/logistics")),
  deliveryPartner: allRoutes.filter(r => r.path.startsWith("/api/v1/delivery-partner")),
  devEmails: allRoutes.filter(r => r.path.startsWith("/dev/emails")),
};

console.log("\n--- Domain Summary ---");
let sum = 0;
for (const [k, v] of Object.entries(categories)) {
  console.log(`${k.padEnd(16)}: ${v.length} endpoints`);
  sum += v.length;
}

const outputPath = path.resolve("../scripts/routes-inventory.json");
fs.writeFileSync(
  outputPath,
  JSON.stringify(allRoutes, null, 2)
);
console.log(`\nSaved inventory to ${outputPath}`);

