/**
 * ZOSH BAZAAR — PHASE 14.2
 * CLOUDINARY ARCHITECTURE HARDENING & MEDIA AUTHORIZATION CLEANUP AUDIT
 *
 * Test Matrix:
 * 1. Authentication Enforcement (Unauthenticated rejected with 401)
 * 2. Multi-Tenant Namespace Ownership & Role-Based Isolation (Seller, Admin, Agent, Customer)
 * 3. File Filter & Security (Image/Video whitelist vs. Malicious/Unsupported format rejection)
 * 4. API Response Contract Normalization (data, media, secure_url compatibility)
 * 5. Repository-Wide Codebase Architecture Scan:
 *    - Absence of unsigned presets (VITE_CLOUDINARY_UPLOAD_PRESET, upload_preset, api.cloudinary.com)
 *    - Absence of CLOUDINARY_API_SECRET in frontend source/env
 *    - Preservation of ephemeral VisualSearchLensModal inference
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import uploadController from "../src/modules/customer/controllers/upload.controller.js";
import { mediaFileFilter } from "../src/middlewares/upload.middleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "../..");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

console.log("\n================================================================================");
console.log("🚀 STARTING PHASE 14.2 MEDIA ARCHITECTURE HARDENING AUDIT");
console.log("================================================================================\n");

// ------------------------------------------------------------------------------
// 1. AUTHENTICATION ENFORCEMENT
import { Writable } from "node:stream";
import { v2 as cloudinary } from "cloudinary";

// ------------------------------------------------------------------------------
// 1. AUTHENTICATION ENFORCEMENT
// ------------------------------------------------------------------------------
console.log("📦 [Suite 1] Authentication Enforcement on Upload Endpoints");

const mockUnauthenticatedReq = {
  user: null,
  seller: null,
  agent: null,
  files: [{ buffer: Buffer.from("fake-image"), originalname: "test.jpg", mimetype: "image/jpeg" }],
  body: { productId: "prod123" },
};

let capturedStatus = null;
let capturedJson = null;

const mockRes = {
  status: (code) => {
    capturedStatus = code;
    return {
      json: (data) => {
        capturedJson = data;
        return data;
      },
    };
  },
};

// 1.1 Unauthenticated uploadToCloudinary
await uploadController.uploadToCloudinary(mockUnauthenticatedReq, mockRes, () => {});
assert(capturedStatus === 401, "uploadToCloudinary rejects unauthenticated caller with 401");
assert(capturedJson?.error === true && capturedJson?.message?.includes("Authentication required"), "Returns clean authentication error message");

// 1.2 Unauthenticated getUploadSignature
capturedStatus = null;
capturedJson = null;
await uploadController.getUploadSignature(mockUnauthenticatedReq, mockRes, () => {});
assert(capturedStatus === 401, "getUploadSignature rejects unauthenticated caller with 401");

// 1.3 Unauthenticated deleteProductImage
capturedStatus = null;
capturedJson = null;
await uploadController.deleteProductImage(mockUnauthenticatedReq, mockRes, () => {});
assert(capturedStatus === 401, "deleteProductImage rejects unauthenticated caller with 401");

// ------------------------------------------------------------------------------
// 2. NAMESPACE ISOLATION, 100% CLOUDINARY ENFORCEMENT & ZERO DISK WRITES
// ------------------------------------------------------------------------------
console.log("\n📦 [Suite 2] Multi-Tenant Namespace Ownership & 100% Cloudinary Enforcement");

// 2.1 Verify unconfigured Cloudinary returns 503 with zero disk write fallback
delete process.env.CLOUDINARY_CLOUD_NAME;
delete process.env.CLOUDINARY_API_KEY;
delete process.env.CLOUDINARY_API_SECRET;

const mockSellerReq = {
  seller: { _id: "seller_abc_123", sellerName: "Urban Attire" },
  user: null,
  agent: null,
  files: [{ buffer: Buffer.from("image-bytes"), originalname: "shirt.png", mimetype: "image/png" }],
  body: {
    productId: "prod_999",
    folderType: "catalog",
    // Attacker tries to inject an unauthorized folder
    folder: "admin/top_secret",
  },
  get: () => "localhost:5000",
  protocol: "http",
};

capturedStatus = null;
capturedJson = null;
await uploadController.uploadToCloudinary(mockSellerReq, mockRes, () => {});
assert(capturedStatus === 503, "Unconfigured Cloudinary returns HTTP 503 Service Unavailable");
assert(
  capturedJson?.code === "CLOUDINARY_NOT_CONFIGURED",
  "Returns CLOUDINARY_NOT_CONFIGURED error code with zero local disk writes"
);

// 2.2 Configure test credentials and mock Cloudinary in-memory upload stream
process.env.CLOUDINARY_CLOUD_NAME = "test_cloud_zosh";
process.env.CLOUDINARY_API_KEY = "test_key_12345";
process.env.CLOUDINARY_API_SECRET = "test_secret_67890";

cloudinary.uploader.upload_stream = (options, callback) => {
  const stream = new Writable({
    write(chunk, encoding, next) {
      next();
    },
    final(next) {
      callback(null, {
        secure_url: `https://res.cloudinary.com/test_cloud_zosh/${options.resource_type || "image"}/upload/${options.folder}/test_asset.jpg`,
        url: `http://res.cloudinary.com/test_cloud_zosh/${options.resource_type || "image"}/upload/${options.folder}/test_asset.jpg`,
        public_id: `${options.folder}/test_asset`,
        format: "jpg",
        resource_type: options.resource_type || "image",
        width: 800,
        height: 600,
        bytes: 12345,
      });
      next();
    },
  });
  return stream;
};

cloudinary.uploader.destroy = async (publicId, options) => ({ result: "ok" });

let sampleUploadResponse = null;

// 2.3 Seller namespace derivation
capturedStatus = null;
capturedJson = null;
await uploadController.uploadToCloudinary(mockSellerReq, mockRes, () => {});
sampleUploadResponse = capturedJson;
assert(capturedStatus === 200, "Seller upload succeeds under controlled namespace");
assert(
  capturedJson?.folder === "zosh-bazaar/sellers/seller_abc_123/products/prod-999/catalog",
  "Seller folder namespace is server-derived and strictly jailed to seller ID and product ID"
);
assert(!capturedJson?.folder.includes("admin"), "Seller cannot inject admin namespace via client-supplied folder param");

// 2.4 Admin namespace derivation
const mockAdminReq = {
  user: { _id: "admin_user_001", role: "ADMIN", fullName: "Platform Admin" },
  seller: null,
  agent: null,
  files: [{ buffer: Buffer.from("banner-bytes"), originalname: "banner.webp", mimetype: "image/webp" }],
  body: { folderType: "hero-banners" },
  get: () => "localhost:5000",
  protocol: "http",
};

capturedStatus = null;
capturedJson = null;
await uploadController.uploadToCloudinary(mockAdminReq, mockRes, () => {});
assert(
  capturedJson?.folder === "zosh-bazaar/admin/hero-banners",
  "Admin upload is securely placed under zosh-bazaar/admin namespace"
);

// 2.5 Delivery Partner POD namespace derivation
const mockAgentReq = {
  agent: { _id: "agent_obj_555", agentId: "AGT-DEL-007" },
  user: null,
  seller: null,
  files: [{ buffer: Buffer.from("pod-bytes"), originalname: "handover.jpg", mimetype: "image/jpeg" }],
  body: { folderType: "arbitrary-folder" },
  get: () => "localhost:5000",
  protocol: "http",
};

capturedStatus = null;
capturedJson = null;
await uploadController.uploadToCloudinary(mockAgentReq, mockRes, () => {});
assert(
  capturedJson?.folder === "zosh-bazaar/delivery/agt-del-007/pod",
  "Delivery Partner POD upload is authoritatively mapped to zosh-bazaar/delivery/<agentId>/pod"
);

// 2.6 Customer namespace derivation
const mockCustomerReq = {
  user: { _id: "customer_xyz_789", role: "CUSTOMER" },
  seller: null,
  agent: null,
  files: [{ buffer: Buffer.from("review-bytes"), originalname: "review1.jpg", mimetype: "image/jpeg" }],
  body: { folderType: "reviews" },
  get: () => "localhost:5000",
  protocol: "http",
};

capturedStatus = null;
capturedJson = null;
await uploadController.uploadToCloudinary(mockCustomerReq, mockRes, () => {});
assert(
  capturedJson?.folder === "zosh-bazaar/customers/customer_xyz_789/reviews",
  "Customer upload is authoritatively scoped to zosh-bazaar/customers/<userId>/reviews"
);

// 2.7 Verify legacy disk upload endpoint is disabled with 410 Gone
capturedStatus = null;
capturedJson = null;
await uploadController.uploadProductImages(mockSellerReq, mockRes, () => {});
assert(capturedStatus === 410, "Legacy local disk uploadProductImages endpoint returns 410 Gone");
assert(capturedJson?.code === "LOCAL_UPLOAD_DISABLED", "Returns LOCAL_UPLOAD_DISABLED rejection code");

// 2.8 Verify Cloudinary asset deletion by publicId
capturedStatus = null;
capturedJson = null;
await uploadController.deleteProductImage(
  {
    seller: { _id: "seller_abc_123" },
    body: { publicId: "zosh-bazaar/sellers/seller_abc_123/products/prod-999/catalog/test_asset" },
  },
  mockRes,
  () => {}
);
assert(capturedStatus === 200, "Authenticated Cloudinary asset deletion succeeds with 200");
assert(capturedJson?.message?.includes("deleted successfully"), "Returns success message on asset deletion");

// ------------------------------------------------------------------------------
// 3. MIME TYPE & RESOURCE TYPE VALIDATION
// ------------------------------------------------------------------------------
console.log("\n📦 [Suite 3] MIME Validation & Resource Type Whitelist");

const testFileFilter = (filename, mimetype) => {
  return new Promise((resolve) => {
    const file = { originalname: filename, mimetype };
    mediaFileFilter({}, file, (err, accepted) => {
      resolve({ err, accepted, resourceType: file.detectedResourceType });
    });
  });
};

const validImageTest = await testFileFilter("product.jpg", "image/jpeg");
assert(validImageTest.accepted === true && validImageTest.resourceType === "image", "Valid JPEG image accepted with resourceType 'image'");

const validPngTest = await testFileFilter("graphic.png", "image/png");
assert(validPngTest.accepted === true && validPngTest.resourceType === "image", "Valid PNG image accepted with resourceType 'image'");

const validWebpTest = await testFileFilter("shoes.webp", "image/webp");
assert(validWebpTest.accepted === true && validWebpTest.resourceType === "image", "Valid WEBP image accepted with resourceType 'image'");

const validVideoTest = await testFileFilter("demo.mp4", "video/mp4");
assert(validVideoTest.accepted === true && validVideoTest.resourceType === "video", "Valid MP4 video accepted with resourceType 'video'");

const validWebmTest = await testFileFilter("preview.webm", "video/webm");
assert(validWebmTest.accepted === true && validWebmTest.resourceType === "video", "Valid WEBM video accepted with resourceType 'video'");

const exeTest = await testFileFilter("malware.exe", "application/x-msdownload");
assert(exeTest.accepted === false && exeTest.err instanceof Error, "Executable .exe rejected with error");

const scriptTest = await testFileFilter("exploit.sh", "text/x-shellscript");
assert(scriptTest.accepted === false && scriptTest.err instanceof Error, "Shell script .sh rejected with error");

const pdfTest = await testFileFilter("document.pdf", "application/pdf");
assert(pdfTest.accepted === false && pdfTest.err instanceof Error, "Unpermitted document format .pdf rejected for media upload");

// ------------------------------------------------------------------------------
// 4. API RESPONSE CONTRACT NORMALIZATION
// ------------------------------------------------------------------------------
console.log("\n📦 [Suite 4] Normalized Response Contract Across Portals");

assert(Array.isArray(sampleUploadResponse?.data), "Response includes standardized 'data' array");
assert(Array.isArray(sampleUploadResponse?.media), "Response includes standardized 'media' array");
assert(typeof sampleUploadResponse?.secure_url === "string", "Response includes top-level 'secure_url' for legacy compatibility");
assert(typeof sampleUploadResponse?.url === "string", "Response includes top-level 'url' for legacy compatibility");
assert(typeof sampleUploadResponse?.public_id === "string", "Response includes top-level 'public_id'");
assert(Array.isArray(sampleUploadResponse?.images), "Response includes legacy 'images' URL list");

const uploadsDir = path.join(__dirname, "../uploads");
const hasAnyNewDiskWrites =
  fs.existsSync(uploadsDir) &&
  fs.readdirSync(uploadsDir).filter((f) => f !== "products" && f !== ".gitkeep").length > 0;
assert(!hasAnyNewDiskWrites, "Zero files or garbage folders were written to local disk during media operations");

// ------------------------------------------------------------------------------
// 5. REPOSITORY-WIDE SECURITY SCAN
// ------------------------------------------------------------------------------
console.log("\n📦 [Suite 5] Repository-Wide Static Security & Cleanup Verification");

function scanDirectory(dir, filterExts = [".ts", ".tsx", ".js", ".jsx", ".env.example", ".md"]) {
  let files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "node_modules" && entry.name !== ".git" && entry.name !== "dist" && entry.name !== "build") {
        files = files.concat(scanDirectory(fullPath, filterExts));
      }
    } else if (filterExts.some((ext) => entry.name.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  return files;
}

const allSourceFiles = scanDirectory(REPO_ROOT).filter(
  (f) => !f.endsWith("phase14_2MediaAudit.test.js")
);

const TARGET_PRESET_TOKEN = ["VITE", "CLOUDINARY", "UPLOAD", "PRESET"].join("_");
const TARGET_API_URL = ["api", "cloudinary", "com/v1_1"].join(".");

let unsignedPresetFound = 0;
let apiCloudinaryDirectFound = 0;
let secretInFrontendFound = 0;

for (const filePath of allSourceFiles) {
  const content = fs.readFileSync(filePath, "utf-8");
  const relPath = path.relative(REPO_ROOT, filePath).replace(/\\/g, "/");

  // Check 1: VITE_CLOUDINARY_UPLOAD_PRESET
  if (content.includes(TARGET_PRESET_TOKEN)) {
    console.error(`  ❌ Found ${TARGET_PRESET_TOKEN} in ${relPath}`);
    unsignedPresetFound++;
  }

  // Check 2: api.cloudinary.com/v1_1 direct upload in portals
  if (
    (relPath.startsWith("client/") ||
      relPath.startsWith("seller/") ||
      relPath.startsWith("admin/") ||
      relPath.startsWith("delivery-partner/")) &&
    content.includes(TARGET_API_URL)
  ) {
    console.error(`  ❌ Found direct api.cloudinary.com upload in ${relPath}`);
    apiCloudinaryDirectFound++;
  }

  // Check 3: CLOUDINARY_API_SECRET in frontend portals
  if (
    (relPath.startsWith("client/") ||
      relPath.startsWith("seller/") ||
      relPath.startsWith("admin/") ||
      relPath.startsWith("delivery-partner/")) &&
    content.includes("CLOUDINARY_API_SECRET")
  ) {
    console.error(`  ❌ Found CLOUDINARY_API_SECRET in frontend ${relPath}`);
    secretInFrontendFound++;
  }
}

assert(unsignedPresetFound === 0, "No occurrences of VITE_CLOUDINARY_UPLOAD_PRESET in any file");
assert(apiCloudinaryDirectFound === 0, "No client/seller/admin/partner code contains direct api.cloudinary.com upload");
assert(secretInFrontendFound === 0, "CLOUDINARY_API_SECRET is completely absent from all frontend portals");

// 5.4 Check Visual Search Lens preservation
const visualSearchPath = path.join(
  REPO_ROOT,
  "client/src/customer/components/AI/VisualSearchLensModal.tsx"
);
const visualSearchContent = fs.readFileSync(visualSearchPath, "utf-8");
assert(
  visualSearchContent.includes("FileReader") && visualSearchContent.includes("readAsDataURL"),
  "VisualSearchLensModal preserves ephemeral FileReader.readAsDataURL for AI vector search inference"
);
assert(
  visualSearchContent.includes("aiCommerceService.visualSearch"),
  "Visual Search routes ephemeral image data to AI inference, not persistent marketplace storage"
);

// ------------------------------------------------------------------------------
// CLEANUP TEST ARTIFACTS
// ------------------------------------------------------------------------------
const testUploadDirs = [
  path.join(__dirname, "../uploads/sellers"),
  path.join(__dirname, "../uploads/admin"),
  path.join(__dirname, "../uploads/delivery"),
  path.join(__dirname, "../uploads/customers"),
];

for (const dir of testUploadDirs) {
  try {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  } catch {}
}

// ------------------------------------------------------------------------------
// SUMMARY
// ------------------------------------------------------------------------------
console.log("\n================================================================================");
console.log(`AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log("================================================================================");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
