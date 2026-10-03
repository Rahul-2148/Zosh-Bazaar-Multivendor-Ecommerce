import express from "express";
import uploadController from "../controllers/upload.controller.js";
import { uploadProductImages, uploadMediaMemory } from "../../../middlewares/upload.middleware.js";

const uploadRouter = express.Router();

/**
 * Get Cloudinary secure upload signature
 * GET /api/v1/upload/signature
 */
uploadRouter.get("/signature", uploadController.getUploadSignature);

/**
 * Direct Cloudinary multi-media stream upload with structured metadata & folder organization
 * POST /api/v1/upload/cloudinary
 * Form field: "images" (multiple)
 */
uploadRouter.post(
  "/cloudinary",
  uploadMediaMemory.array("images", 12),
  uploadController.uploadToCloudinary
);

/**
 * Upload multiple product images to local disk (legacy/fallback)
 * Form field: "images" (multiple)
 * Body field (optional): "productSlug" or "title"
 */
uploadRouter.post(
  "/product-images",
  uploadProductImages.array("images", 10),
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
