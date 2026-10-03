import multer from "multer";
import path from "path";

// Helper to sanitize slug
export const sanitizeSlug = (str = "") => {
  return (
    str
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "product"
  );
};

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

export const uploadMediaMemory = multer({
  storage: multer.memoryStorage(),
  fileFilter: mediaFileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB per file (accommodates short demo videos)
    files: 12, // Max 12 files at once
  },
});

// Deprecated alias pointing to in-memory storage (zero disk writes)
export const uploadProductImages = uploadMediaMemory;

export const uploadFlexibleMediaMemory = uploadMediaMemory.fields([
  { name: "images", maxCount: 12 },
  { name: "image", maxCount: 12 },
  { name: "file", maxCount: 12 },
  { name: "files", maxCount: 12 },
  { name: "photo", maxCount: 12 },
]);


