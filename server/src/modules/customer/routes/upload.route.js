import express from "express";
import uploadController from "../controllers/upload.controller.js";
import { uploadProductImages } from "../../../middlewares/upload.middleware.js";

const uploadRouter = express.Router();

/**
 * Upload multiple product images
 * Form field: "images" (multiple)
 * Body field (optional): "productSlug" or "title"
 */
uploadRouter.post(
  "/product-images",
  uploadProductImages.array("images", 10),
  uploadController.uploadProductImages
);

/**
 * Delete product image from disk
 */
uploadRouter.delete(
  "/product-image",
  uploadController.deleteProductImage
);

export default uploadRouter;
