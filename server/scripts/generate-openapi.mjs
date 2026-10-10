import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import YAML from "yaml";
import { getOpenApiSpec } from "../src/docs/openapi/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🔨 [OpenAPI Generator] Compiling specification...");

const spec = getOpenApiSpec();

// Deterministic formatting
const jsonContent = JSON.stringify(spec, null, 2);
const yamlContent = YAML.stringify(spec, { indent: 2 });

// Target file locations
const serverDocsDir = path.resolve(__dirname, "../src/docs");
const rootDocsDir = path.resolve(__dirname, "../../docs");

if (!fs.existsSync(serverDocsDir)) {
  fs.mkdirSync(serverDocsDir, { recursive: true });
}
if (!fs.existsSync(rootDocsDir)) {
  fs.mkdirSync(rootDocsDir, { recursive: true });
}

// Write to server/src/docs/
fs.writeFileSync(path.join(serverDocsDir, "openapi.json"), jsonContent);
fs.writeFileSync(path.join(serverDocsDir, "openapi.yaml"), yamlContent);

// Write to root docs/
fs.writeFileSync(path.join(rootDocsDir, "openapi.json"), jsonContent);
fs.writeFileSync(path.join(rootDocsDir, "openapi.yaml"), yamlContent);

const pathCount = Object.keys(spec.paths).length;
let opCount = 0;
for (const p of Object.values(spec.paths)) {
  for (const m of ["get", "post", "put", "patch", "delete"]) {
    if (p[m]) opCount++;
  }
}

console.log(`✅ [OpenAPI Generator] Successfully generated:`);
console.log(`   - ${pathCount} unique path items`);
console.log(`   - ${opCount} documented operations`);
console.log(`   - Saved to server/src/docs/openapi.json & openapi.yaml`);
console.log(`   - Saved to docs/openapi.json & openapi.yaml`);
