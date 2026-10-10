import express from "express";
import path from "path";
import { fileURLToPath } from "url";

// Load environment config first
import "../server/src/config/env.js";

import customerRouter from "../server/src/modules/customer/customer.router.js";
import sellerRouter from "../server/src/modules/seller/seller.router.js";
import adminRouter from "../server/src/modules/admin/admin.router.js";
import logisticsRouter from "../server/src/modules/logistics/logistics.router.js";
import deliveryPartnerRouter from "../server/src/modules/deliveryPartner/deliveryPartner.router.js";
import emailPreviewRouter from "../server/src/modules/email/preview/email-preview.router.js";

const app = express();

// Mirror server/src/index.js mounting
app.get("/health", (req, res) => {});
app.get("/ready", (req, res) => {});
app.get("/", (req, res) => {});

app.use("/api/v1", customerRouter);
app.use("/api/v1/seller", sellerRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/logistics", logisticsRouter);
app.use("/api/v1/delivery-partner", deliveryPartnerRouter);
app.use("/dev/emails", emailPreviewRouter);

function split(thing) {
  if (typeof thing === "string") {
    return thing;
  } else if (thing.fast_slash) {
    return "";
  } else {
    var match = thing
      .toString()
      .replace("\\/?", "")
      .replace("(?=\\/|$)", "$")
      .match(/^\/\^((?:\\[.*+?^${}()|[\]\\\/]|[^.*+?^${}()|[\]\\\/])*)\$\//);
    return match
      ? match[1].replace(/\\(.)/g, "$1")
      : thing.toString().replace(/^\/\^/, "").replace(/\/\?\(?=\\\/\|\$\)\//, "").replace(/\$\//, "");
  }
}

function getRoutes(stack, prefix = "") {
  let routes = [];

  for (const layer of stack) {
    if (layer.route) {
      const pathPart = layer.route.path;
      const methods = Object.keys(layer.route.methods).map((m) => m.toUpperCase());
      const fullPath = (prefix + (pathPart === "/" ? "" : pathPart)) || "/";
      
      const middlewares = layer.route.stack.map((s) => s.name || "anonymous");
      for (const method of methods) {
        routes.push({
          method,
          path: fullPath,
          middlewares,
        });
      }
    } else if (layer.name === "router" && layer.handle.stack) {
      let routerPrefix = "";
      if (layer.regexp) {
        const str = layer.regexp.source;
        // Clean express regexp for router prefix
        const match = str
          .replace("^\\", "")
          .replace("\\/?(?=\\/|$)", "")
          .replace("(?=\\/|$)", "")
          .replace(/\\\//g, "/");
        routerPrefix = match.replace(/^\^/, "").replace(/\$$/, "");
        if (routerPrefix.startsWith("/")) {
          // clean
        } else {
          routerPrefix = "/" + routerPrefix;
        }
        // Normalize express route params like (?:\\/([^\\/]+?))
        routerPrefix = routerPrefix.replace(/\(\?:\\\/([^\\/]+?)\)/g, "/:$1");
      }
      const combined = (prefix + (routerPrefix === "/" ? "" : routerPrefix)).replace(/\/+/g, "/");
      routes = routes.concat(getRoutes(layer.handle.stack, combined));
    }
  }

  return routes;
}

const discovered = getRoutes(app._router.stack);

// Deduplicate routes by method + path
const uniqueMap = new Map();
for (const r of discovered) {
  // Normalize double slashes and trailing slashes
  let p = r.path.replace(/\/+/g, "/");
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  const key = `${r.method} ${p}`;
  if (!uniqueMap.has(key)) {
    uniqueMap.set(key, { ...r, path: p });
  }
}

const allRoutes = Array.from(uniqueMap.values());
console.log(`Discovered ${allRoutes.length} unique API routes!`);

// Group by category/domain
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
for (const [k, v] of Object.entries(categories)) {
  console.log(`${k}: ${v.length} endpoints`);
}

// Print JSON report to stdout or file
import fs from "fs";
fs.writeFileSync(
  path.resolve("scripts/routes-inventory.json"),
  JSON.stringify(allRoutes, null, 2)
);
console.log("\nSaved inventory to scripts/routes-inventory.json");
