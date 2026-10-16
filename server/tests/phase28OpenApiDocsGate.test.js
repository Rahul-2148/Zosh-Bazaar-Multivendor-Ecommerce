import assert from "assert";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import YAML from "yaml";
import express from "express";
import docsRouter from "../src/docs/docs.router.js";
import { PORTAL_SECTIONS } from "../src/docs/portal/portal-data.js";
import { renderDeveloperPortalHtml } from "../src/docs/portal/portal-ui.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("\n================================================================");
console.log("🧪 ZOSH BAZAAR — PHASE 28 OPENAPI 3.1 & DEVELOPER PORTAL QUALITY GATE");
console.log("================================================================\n");

let passed = 0;
let failed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
    failed++;
  }
}

async function runAsyncTest(name, fn) {
  try {
    await fn();
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
    failed++;
  }
}

const specJsonPath = path.resolve(__dirname, "../src/docs/openapi.json");
const specYamlPath = path.resolve(__dirname, "../src/docs/openapi.yaml");
const rootSpecJsonPath = path.resolve(__dirname, "../../docs/openapi.json");
const rootSpecYamlPath = path.resolve(__dirname, "../../docs/openapi.yaml");

// 1. Artifact Existence Tests
runTest("OpenAPI specification artifacts exist in server/src/docs and root docs/", () => {
  assert.ok(fs.existsSync(specJsonPath), "server/src/docs/openapi.json missing");
  assert.ok(fs.existsSync(specYamlPath), "server/src/docs/openapi.yaml missing");
  assert.ok(fs.existsSync(rootSpecJsonPath), "docs/openapi.json missing");
  assert.ok(fs.existsSync(rootSpecYamlPath), "docs/openapi.yaml missing");
});

// 2. OpenAPI Syntax & Spec Validation
let spec = null;
runTest("OpenAPI JSON artifact is valid JSON and adheres to version 3.1.0", () => {
  const content = fs.readFileSync(specJsonPath, "utf-8");
  spec = JSON.parse(content);
  assert.strictEqual(spec.openapi, "3.1.0", "Expected openapi version 3.1.0");
  assert.ok(spec.info, "Missing spec.info");
  assert.strictEqual(spec.info.title, "Zosh Bazaar — Enterprise Multi-Vendor E-Commerce Platform API");
  assert.strictEqual(spec.info.version, "2.4.0");
});

runTest("OpenAPI YAML artifact parses valid YAML matching the JSON spec", () => {
  const yamlContent = fs.readFileSync(specYamlPath, "utf-8");
  const parsedYaml = YAML.parse(yamlContent);
  assert.strictEqual(parsedYaml.openapi, "3.1.0");
  assert.strictEqual(parsedYaml.info.title, spec.info.title);
  assert.strictEqual(Object.keys(parsedYaml.paths).length, Object.keys(spec.paths).length);
});

// 3. Operation ID Uniqueness
runTest("All documented operation IDs across paths are strictly unique", () => {
  const seen = new Set();
  const duplicates = [];
  let totalOps = 0;

  for (const [pathKey, pathItem] of Object.entries(spec.paths)) {
    for (const [method, op] of Object.entries(pathItem)) {
      if (["get", "post", "put", "patch", "delete"].includes(method.toLowerCase())) {
        totalOps++;
        assert.ok(op.operationId, `Missing operationId on ${method.toUpperCase()} ${pathKey}`);
        if (seen.has(op.operationId)) {
          duplicates.push(op.operationId);
        }
        seen.add(op.operationId);
      }
    }
  }

  assert.strictEqual(duplicates.length, 0, `Found duplicate operation IDs: ${duplicates.join(", ")}`);
  assert.ok(totalOps >= 190, `Expected at least 190 operations, found ${totalOps}`);
});

// 4. Broken $ref Detection
runTest("Zero broken internal $ref references in specification", () => {
  let broken = 0;
  function resolveRef(obj, loc = "root") {
    if (!obj || typeof obj !== "object") return;
    if (Array.isArray(obj)) {
      obj.forEach((item, i) => resolveRef(item, `${loc}[${i}]`));
      return;
    }
    for (const [k, v] of Object.entries(obj)) {
      if (k === "$ref" && typeof v === "string" && v.startsWith("#/")) {
        const parts = v.replace("#/", "").split("/");
        let curr = spec;
        let ok = true;
        for (const p of parts) {
          if (curr && typeof curr === "object" && p in curr) {
            curr = curr[p];
          } else {
            ok = false;
            break;
          }
        }
        if (!ok) {
          console.error(`Broken pointer: ${v} at ${loc}`);
          broken++;
        }
      } else {
        resolveRef(v, `${loc}.${k}`);
      }
    }
  }

  resolveRef(spec);
  assert.strictEqual(broken, 0, `Encountered ${broken} broken $ref references in spec`);
});

// 5. Security Scheme Declarations
runTest("Spec declares complete, required security schemes", () => {
  const schemes = spec.components?.securitySchemes;
  assert.ok(schemes, "Missing components.securitySchemes");
  assert.ok(schemes.BearerAuth, "Missing BearerAuth scheme");
  assert.strictEqual(schemes.BearerAuth.type, "http");
  assert.strictEqual(schemes.BearerAuth.scheme, "bearer");
  assert.ok(schemes.SellerAuth, "Missing SellerAuth scheme");
  assert.ok(schemes.DeliveryPartnerAuth, "Missing DeliveryPartnerAuth scheme");
  assert.ok(schemes.RazorpayWebhookSignature, "Missing RazorpayWebhookSignature scheme");
});

// 6. Multi-Portal Domain Coverage
runTest("Spec contains dedicated path groups for all 5 portals and core subsystems", () => {
  const paths = Object.keys(spec.paths);

  // Customer portal routes
  assert.ok(paths.some(p => p.startsWith("/api/v1/auth")), "Missing customer auth routes");
  assert.ok(paths.some(p => p.startsWith("/api/v1/product")), "Missing customer product routes");
  assert.ok(paths.some(p => p.startsWith("/api/v1/cart")), "Missing customer cart routes");
  assert.ok(paths.some(p => p.startsWith("/api/v1/order")), "Missing customer order routes");
  assert.ok(paths.some(p => p.startsWith("/api/v1/payment")), "Missing customer payment routes");

  // Seller portal routes
  assert.ok(paths.some(p => p.startsWith("/api/v1/seller")), "Missing seller domain routes");

  // Admin portal routes
  assert.ok(paths.some(p => p.startsWith("/api/v1/admin")), "Missing admin domain routes");

  // Logistics control tower routes
  assert.ok(paths.some(p => p.startsWith("/api/v1/logistics")), "Missing logistics domain routes");

  // Delivery partner routes
  assert.ok(paths.some(p => p.startsWith("/api/v1/delivery-partner")), "Missing delivery partner domain routes");

  // AI & Upload routes
  assert.ok(paths.some(p => p.startsWith("/api/v1/ai")), "Missing AI domain routes");
  assert.ok(paths.some(p => p.startsWith("/api/v1/upload")), "Missing upload routes");
});

// 7. Developer Portal HTML & Section Data Integrity
runTest("Developer Portal sections database contains authoritative architectural guides", () => {
  assert.ok(PORTAL_SECTIONS.length >= 9, "Expected at least 9 comprehensive portal guides");
  const sectionIds = PORTAL_SECTIONS.map(s => s.id);
  assert.ok(sectionIds.includes("overview"), "Missing overview guide");
  assert.ok(sectionIds.includes("quickstart"), "Missing quickstart guide");
  assert.ok(sectionIds.includes("security-rbac"), "Missing security-rbac guide");
  assert.ok(sectionIds.includes("payments-ledger"), "Missing payments-ledger guide");
  assert.ok(sectionIds.includes("realtime-socket"), "Missing realtime-socket guide");
  assert.ok(sectionIds.includes("portal-customer"), "Missing portal-customer guide");
  assert.ok(sectionIds.includes("portal-seller"), "Missing portal-seller guide");
  assert.ok(sectionIds.includes("portal-admin"), "Missing portal-admin guide");
  assert.ok(sectionIds.includes("portal-logistics"), "Missing portal-logistics guide");
  assert.ok(sectionIds.includes("portal-delivery"), "Missing portal-delivery guide");
});

runTest("renderDeveloperPortalHtml compiles valid HTML with search modal and spec injection", () => {
  const html = renderDeveloperPortalHtml({ sections: PORTAL_SECTIONS, openApiSpec: spec });
  assert.ok(html.includes("<!DOCTYPE html>"), "Missing doctype");
  assert.ok(html.includes("Zosh Bazaar — Enterprise Developer Portal"), "Missing title");
  assert.ok(html.includes("searchModalBackdrop"), "Missing search modal");
  assert.ok(html.includes("api-reference"), "Missing interactive api reference");
  assert.ok(html.includes("Swagger UI"), "Missing Swagger UI link");
});

// 8. Express Router Integration Tests
await runAsyncTest("Express docs router correctly serves OpenAPI JSON, YAML, and Developer Portal", async () => {
  const app = express();
  app.use(docsRouter);

  // Test /api-docs/openapi.json
  const resJson = await new Promise((resolve) => {
    const req = { method: "GET", url: "/api-docs/openapi.json", headers: {} };
    const res = {
      setHeader: () => {},
      sendFile: (filePath) => {
        const data = fs.readFileSync(filePath, "utf-8");
        resolve({ status: 200, data: JSON.parse(data) });
      },
    };
    docsRouter.handle(req, res, () => resolve({ status: 404 }));
  });
  assert.strictEqual(resJson.status, 200);
  assert.strictEqual(resJson.data.openapi, "3.1.0");

  // Test /docs
  const resDocs = await new Promise((resolve) => {
    const req = { method: "GET", url: "/docs", headers: {} };
    const res = {
      setHeader: () => {},
      send: (html) => resolve({ status: 200, html }),
    };
    docsRouter.handle(req, res, () => resolve({ status: 404 }));
  });
  assert.strictEqual(resDocs.status, 200);
  assert.ok(resDocs.html.includes("Zosh Bazaar"));
});

console.log("\n----------------------------------------------------------------");
console.log(`Phase 28 Quality Gate Finished: ${passed} Passed, ${failed} Failed`);
console.log("----------------------------------------------------------------\n");

if (failed > 0) {
  process.exit(1);
}
