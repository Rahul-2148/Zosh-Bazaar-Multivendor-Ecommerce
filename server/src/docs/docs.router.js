import express from "express";
import swaggerUi from "swagger-ui-express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PORTAL_SECTIONS } from "./portal/portal-data.js";
import { renderDeveloperPortalHtml } from "./portal/portal-ui.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Load pre-compiled OpenAPI 3.1 specifications
const specJsonPath = path.resolve(__dirname, "./openapi.json");
const specYamlPath = path.resolve(__dirname, "./openapi.yaml");

let openApiSpec = {};
if (fs.existsSync(specJsonPath)) {
  openApiSpec = JSON.parse(fs.readFileSync(specJsonPath, "utf-8"));
}

// 1. Raw OpenAPI JSON & YAML Specification Endpoints
router.get("/api-docs/openapi.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.sendFile(specJsonPath);
});

router.get("/api-docs/openapi.yaml", (req, res) => {
  res.setHeader("Content-Type", "text/yaml; charset=utf-8");
  res.sendFile(specYamlPath);
});

// 2. Swagger UI Options & Custom Theming
const customCss = `
  .swagger-ui .topbar { display: none; }
  .swagger-ui { font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; }
  .swagger-ui .info { margin: 24px 0; }
  .swagger-ui .info .title { font-size: 28px; font-weight: 800; color: #0f172a; }
  .swagger-ui .scheme-container { background: #f8fafc; padding: 16px 0; box-shadow: none; border-bottom: 1px solid #e2e8f0; }
  .swagger-ui .opblock.opblock-get { border-color: #10b981; background: rgba(16, 185, 129, 0.05); }
  .swagger-ui .opblock.opblock-post { border-color: #3b82f6; background: rgba(59, 130, 246, 0.05); }
  .swagger-ui .opblock.opblock-patch { border-color: #f59e0b; background: rgba(245, 158, 11, 0.05); }
  .swagger-ui .opblock.opblock-delete { border-color: #ef4444; background: rgba(239, 68, 68, 0.05); }
`;

const swaggerUiOptions = {
  explorer: true,
  customSiteTitle: "Zosh Bazaar API Documentation (OpenAPI 3.1)",
  customCss,
  customCssUrl: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap",
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: true,
    docExpansion: "none",
  },
};

// 3. Mount Swagger UI on /api-docs
router.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiSpec, swaggerUiOptions));

// 4. Developer Portal on /docs
router.get("/docs", (req, res) => {
  const html = renderDeveloperPortalHtml({
    sections: PORTAL_SECTIONS,
    openApiSpec,
  });
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});

export default router;
