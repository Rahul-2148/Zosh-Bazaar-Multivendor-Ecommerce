/**
 * Zosh Bazaar — Local Uploads Garbage Collector Utility
 * Cleans up temporary, orphaned, and test mock files from server/uploads/
 * while preserving directory structure and .gitkeep files.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_ROOT = path.resolve(__dirname, "../../uploads");

function cleanDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) return 0;

  let removedCount = 0;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    // Protect permanent seeded demo products
    const isSeedProductDir =
      dirPath.includes("uploads\\products\\") || dirPath.includes("uploads/products/");

    if (entry.isDirectory()) {
      removedCount += cleanDirectory(fullPath);
      // Remove empty directory if not top-level root or seeded products
      if (fullPath !== UPLOADS_ROOT && !isSeedProductDir) {
        try {
          const remaining = fs.readdirSync(fullPath);
          if (remaining.length === 0) {
            fs.rmdirSync(fullPath);
          }
        } catch {}
      }
    } else if (entry.name !== ".gitkeep") {
      // In seed product folders, protect static demo SVGs
      if (isSeedProductDir && (entry.name.endsWith(".svg") || !entry.name.match(/\d{10,}/))) {
        continue;
      }
      try {
        fs.unlinkSync(fullPath);
        removedCount++;
      } catch (err) {
        console.warn(`[CleanUploads] Could not delete ${entry.name}:`, err.message);
      }
    }
  }

  return removedCount;
}

console.log("==================================================");
console.log("🧹 CLEANING LOCAL DEVELOPMENT UPLOADS DIRECTORY");
console.log("==================================================");
console.log("Target Directory:", UPLOADS_ROOT);

const deletedFiles = cleanDirectory(UPLOADS_ROOT);
console.log(`✓ Purged ${deletedFiles} orphaned/local files from storage.`);
console.log("✓ Uploads directory is clean and ready for development.");
console.log("==================================================\n");
