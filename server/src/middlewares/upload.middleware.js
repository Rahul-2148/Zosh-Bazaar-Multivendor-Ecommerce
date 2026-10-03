import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_ROOT = path.resolve(__dirname, "../../uploads");

// Helper to sanitize slug
export const sanitizeSlug = (str = "") => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "product";
};

// Storage engine that dynamically routes files to uploads/products/:slug/
const productStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      const rawSlug = req.body.productSlug || req.body.title || req.query.productSlug || "general";
      const slug = sanitizeSlug(rawSlug);
      req.resolvedSlug = slug;

      const targetDir = path.join(UPLOADS_ROOT, "products", slug);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      cb(null, targetDir);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path
      .basename(file.originalname, ext)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 30);
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    cb(null, `${base}-${uniqueSuffix}${ext}`);
  },
});

// Strict file filter for marketplace media (images and demonstration videos)
export const mediaFileFilter = (req, file, cb) => {
  const allowedImageExts = /jpeg|jpg|png|webp|avif|svg/;
  const allowedVideoExts = /mp4|webm|mov/;
  const ext = path.extname(file.originalname).toLowerCase().replace(".", "");
  const mime = (file.mimetype || "").toLowerCase();

  const isImage = allowedImageExts.test(ext) && (mime.startsWith("image/") || mime === "image/svg+xml");
  const isVideo = allowedVideoExts.test(ext) && (mime.startsWith("video/") || mime === "video/mp4" || mime === "video/webm" || mime === "video/quicktime");

  if (isImage || isVideo) {
    file.detectedResourceType = isVideo ? "video" : "image";
    cb(null, true);
  } else {
    cb(
      new Error(
        "Unsupported file format. Only verified images (JPG, PNG, WEBP, AVIF, SVG) and videos (MP4, WEBM) are permitted."
      ),
      false
    );
  }
};

export const uploadProductImages = multer({
  storage: productStorage,
  fileFilter: mediaFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 10, // Max 10 images at once
  },
});

export const uploadMediaMemory = multer({
  storage: multer.memoryStorage(),
  fileFilter: mediaFileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB per file (accommodates short demo videos)
    files: 12, // Max 12 files at once
  },
});

export const uploadFlexibleMediaMemory = uploadMediaMemory.fields([
  { name: "images", maxCount: 12 },
  { name: "image", maxCount: 12 },
  { name: "file", maxCount: 12 },
  { name: "files", maxCount: 12 },
  { name: "photo", maxCount: 12 },
]);


