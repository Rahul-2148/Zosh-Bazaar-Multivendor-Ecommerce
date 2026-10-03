import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import {
  isCloudinaryConfigured,
  generateUploadSignature,
  uploadBufferToCloudinary,
  deleteFromCloudinary,
} from "../../../config/cloudinary.js";
import { sanitizeSlug } from "../../../middlewares/upload.middleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_ROOT = path.resolve(__dirname, "../../../../uploads");

class UploadController {
  /**
   * Get Cloudinary upload signature & credentials for secure direct browser-to-Cloudinary upload
   * GET /api/v1/upload/signature
   */
  async getUploadSignature(req, res, next) {
    try {
      if (!isCloudinaryConfigured()) {
        return res.status(200).json({
          success: false,
          error: false,
          configured: false,
          message: "Cloudinary credentials not configured on server. Use direct server upload endpoint.",
        });
      }

      const { productId, folderType = "catalog", optionKey, optionValue, variantId } = req.query;

      // Deterministic folder organization matching enterprise marketplace standard:
      // zosh-bazaar/products/{productId}/catalog/
      // zosh-bazaar/products/{productId}/options/{color-blue}/
      // zosh-bazaar/products/{productId}/variants/{variantId}/
      const cleanProdId = sanitizeSlug(productId || "draft");
      let folderPath = `zosh-bazaar/products/${cleanProdId}/${folderType}`;

      if (folderType === "options" && optionKey && optionValue) {
        const cleanOpt = sanitizeSlug(`${optionKey}-${optionValue}`);
        folderPath = `zosh-bazaar/products/${cleanProdId}/options/${cleanOpt}`;
      } else if (folderType === "variants" && variantId) {
        const cleanVar = sanitizeSlug(variantId);
        folderPath = `zosh-bazaar/products/${cleanProdId}/variants/${cleanVar}`;
      }

      const signingParams = {
        folder: folderPath,
      };

      const signed = generateUploadSignature(signingParams);

      return res.status(200).json({
        success: true,
        error: false,
        configured: true,
        signature: signed.signature,
        timestamp: signed.timestamp,
        apiKey: signed.apiKey,
        cloudName: signed.cloudName,
        folder: folderPath,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Authoritative server-side multi-image upload into Cloudinary or resilient disk storage
   * POST /api/v1/upload/cloudinary
   */
  async uploadToCloudinary(req, res, next) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          error: true,
          message: "No image files were uploaded. Please attach at least 1 image.",
        });
      }

      const {
        productId,
        productSlug,
        folderType = "catalog",
        optionKey = "",
        optionValue = "",
        variantId = "",
      } = req.body;

      const cleanProdId = sanitizeSlug(productId || productSlug || "general");
      let folderPath = `zosh-bazaar/products/${cleanProdId}/${folderType}`;

      if (folderType === "options" && optionKey && optionValue) {
        const cleanOpt = sanitizeSlug(`${optionKey}-${optionValue}`);
        folderPath = `zosh-bazaar/products/${cleanProdId}/options/${cleanOpt}`;
      } else if (folderType === "variants" && variantId) {
        const cleanVar = sanitizeSlug(variantId);
        folderPath = `zosh-bazaar/products/${cleanProdId}/variants/${cleanVar}`;
      }

      const results = [];

      if (isCloudinaryConfigured()) {
        // Genuine Cloudinary upload with full metadata
        for (let i = 0; i < req.files.length; i++) {
          const file = req.files[i];
          const uploadResult = await uploadBufferToCloudinary(file.buffer, {
            folder: folderPath,
            resourceType: "image",
            tags: ["zosh-bazaar", cleanProdId, folderType].filter(Boolean),
          });

          results.push({
            mediaId: `med_${Date.now()}_${i}`,
            url: uploadResult.secureUrl,
            secureUrl: uploadResult.secureUrl,
            publicId: uploadResult.publicId,
            resourceType: uploadResult.resourceType || "image",
            format: uploadResult.format,
            width: uploadResult.width,
            height: uploadResult.height,
            bytes: uploadResult.bytes,
            originalName: file.originalname,
            isPrimary: i === 0,
            sortOrder: i,
            folder: folderPath,
            optionKey: optionKey || undefined,
            optionValue: optionValue || undefined,
            variantId: variantId || undefined,
          });
        }
      } else {
        // Resilient disk fallback: write memory buffer to uploads/products/:cleanProdId/
        const targetDir = path.join(UPLOADS_ROOT, "products", cleanProdId);
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }

        const host = req.get("host");
        const protocol = req.protocol || "http";
        const baseUrl = `${protocol}://${host}`;

        for (let i = 0; i < req.files.length; i++) {
          const file = req.files[i];
          const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
          const base = path
            .basename(file.originalname, ext)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .slice(0, 30);
          const filename = `${base}-${Date.now()}-${i}${ext}`;
          const filePath = path.join(targetDir, filename);

          fs.writeFileSync(filePath, file.buffer);

          const relativePath = `/uploads/products/${cleanProdId}/${filename}`;
          const absoluteUrl = `${baseUrl}${relativePath}`;

          results.push({
            mediaId: `med_${Date.now()}_${i}`,
            url: absoluteUrl,
            secureUrl: absoluteUrl,
            relativePath,
            filename,
            publicId: `local:${cleanProdId}/${filename}`,
            resourceType: "image",
            format: ext.replace(".", ""),
            bytes: file.size,
            originalName: file.originalname,
            isPrimary: i === 0,
            sortOrder: i,
            folder: folderPath,
            optionKey: optionKey || undefined,
            optionValue: optionValue || undefined,
            variantId: variantId || undefined,
          });
        }
      }

      return res.status(200).json({
        success: true,
        error: false,
        message: `Successfully processed ${results.length} media assets into ${folderPath}`,
        folder: folderPath,
        media: results,
        // Legacy array of URLs for backward compatibility
        images: results.map((m) => m.secureUrl || m.url),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload multiple product images into uploads/products/:slug/ (legacy disk upload)
   * POST /api/v1/upload/product-images
   */
  async uploadProductImages(req, res, next) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          error: true,
          message: "No image files were uploaded. Please attach at least 1 image.",
        });
      }

      const slug = req.resolvedSlug || "general";
      const host = req.get("host");
      const protocol = req.protocol || "http";
      const baseUrl = `${protocol}://${host}`;

      const uploadedFiles = req.files.map((file, index) => {
        const relativePath = `/uploads/products/${slug}/${file.filename}`;
        const absoluteUrl = `${baseUrl}${relativePath}`;

        return {
          mediaId: `med_${Date.now()}_${index}`,
          url: absoluteUrl,
          secureUrl: absoluteUrl,
          relativePath,
          filename: file.filename,
          originalName: file.originalname,
          size: file.size,
          mimeType: file.mimetype,
          isPrimary: index === 0,
          order: index,
        };
      });

      return res.status(200).json({
        success: true,
        error: false,
        message: `Successfully uploaded ${uploadedFiles.length} product images to dedicated folder: products/${slug}`,
        productSlug: slug,
        folder: `uploads/products/${slug}`,
        images: uploadedFiles,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete an uploaded image file from Cloudinary or local disk
   * DELETE /api/v1/upload/product-image
   */
  async deleteProductImage(req, res, next) {
    try {
      const { publicId, relativePath, productSlug, filename } = req.body;

      // Cloudinary deletion if publicId is provided and not local:
      if (publicId && !publicId.startsWith("local:") && isCloudinaryConfigured()) {
        const deleted = await deleteFromCloudinary(publicId);
        return res.status(200).json({
          success: true,
          error: false,
          message: deleted ? "Cloudinary media deleted successfully" : "Cloudinary asset deletion skipped or not found",
        });
      }

      // Local disk deletion
      let targetFile = null;
      if (relativePath) {
        const cleanRel = relativePath.replace(/^\//, "");
        targetFile = path.resolve(UPLOADS_ROOT, "..", cleanRel);
      } else if (productSlug && filename) {
        targetFile = path.join(UPLOADS_ROOT, "products", productSlug, filename);
      }

      if (targetFile && fs.existsSync(targetFile)) {
        fs.unlinkSync(targetFile);
        return res.status(200).json({
          success: true,
          error: false,
          message: "Product image removed from disk successfully",
        });
      }

      return res.status(200).json({
        success: true,
        error: false,
        message: "Image reference deregistered",
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new UploadController();
