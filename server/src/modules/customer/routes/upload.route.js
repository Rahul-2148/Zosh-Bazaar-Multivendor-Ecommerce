import express from "express";
import uploadController from "../controllers/upload.controller.js";
import { uploadProductImages, uploadFlexibleMediaMemory } from "../../../middlewares/upload.middleware.js";
import { mediaUploadLimiter } from "../../../middlewares/rateLimiter.middleware.js";

const uploadRouter = express.Router();

/**
 * Get Cloudinary secure upload signature
 * GET /api/v1/upload/signature
 */
uploadRouter.get("/signature", uploadController.getUploadSignature);

/**
 * Authoritative Cloudinary multi-media stream upload with structured metadata & folder organization
 * POST /api/v1/upload/cloudinary
 * Form fields supported: "images", "image", "file", "files", "photo" (up to 12 files, max 25MB each)
 */
uploadRouter.post(
  "/cloudinary",
  mediaUploadLimiter,
  uploadFlexibleMediaMemory,
  uploadController.uploadToCloudinary
);

/**
 * Upload multiple product images (legacy disk endpoint - disabled, returns 410)
 */
uploadRouter.post(
  "/product-images",
  uploadController.uploadProductImages
);

/**
 * Delete product image from Cloudinary or disk
 */
uploadRouter.delete(
  "/product-image",
  uploadController.deleteProductImage
);

export default uploadRouter;
