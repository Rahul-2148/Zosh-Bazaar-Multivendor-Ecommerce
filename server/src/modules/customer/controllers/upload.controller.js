import {
  isCloudinaryConfigured,
  generateUploadSignature,
  uploadBufferToCloudinary,
  deleteFromCloudinary,
} from "../../../config/cloudinary.js";
import { sanitizeSlug } from "../../../middlewares/upload.middleware.js";

class UploadController {
  /**
   * Get Cloudinary upload signature & credentials for secure direct browser-to-Cloudinary upload
   * GET /api/v1/upload/signature
   */
  async getUploadSignature(req, res, next) {
    try {
      const user = req.user;
      const seller = req.seller;
      const agent = req.agent;

      if (!user && !seller && !agent) {
        return res.status(401).json({
          success: false,
          error: true,
          message: "Authentication required to generate upload signature.",
        });
      }

      if (!isCloudinaryConfigured()) {
        return res.status(200).json({
          success: false,
          error: false,
          configured: false,
          message: "Cloudinary credentials not configured on server. Use direct server upload endpoint.",
        });
      }

      const { productId, folderType = "catalog", folder, optionKey, optionValue, variantId } = req.query;
      const rawSubfolder = folderType || folder || "catalog";
      const cleanSubfolder = sanitizeSlug(rawSubfolder) || "catalog";

      // Server-enforced folder namespace isolation
      let folderPath = "zosh-bazaar/general";

      if (seller || user?.role === "SELLER") {
        const sellerId = (seller?._id || user?._id).toString();
        const cleanProdId = sanitizeSlug(productId || "draft");
        if (cleanSubfolder === "options" && optionKey && optionValue) {
          const cleanOpt = sanitizeSlug(`${optionKey}-${optionValue}`);
          folderPath = `zosh-bazaar/sellers/${sellerId}/products/${cleanProdId}/options/${cleanOpt}`;
        } else if (cleanSubfolder === "variants" && variantId) {
          const cleanVar = sanitizeSlug(variantId);
          folderPath = `zosh-bazaar/sellers/${sellerId}/products/${cleanProdId}/variants/${cleanVar}`;
        } else {
          folderPath = `zosh-bazaar/sellers/${sellerId}/products/${cleanProdId}/${cleanSubfolder}`;
        }
      } else if (user?.role === "ADMIN") {
        folderPath = `zosh-bazaar/admin/${cleanSubfolder}`;
      } else if (agent) {
        const agentId = sanitizeSlug(agent.agentId || agent._id.toString());
        folderPath = `zosh-bazaar/delivery/${agentId}/pod`;
      } else if (user) {
        const userId = user._id.toString();
        folderPath = `zosh-bazaar/customers/${userId}/${cleanSubfolder}`;
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
   * Authoritative server-side multi-media upload into Cloudinary or resilient disk storage
   * POST /api/v1/upload/cloudinary
   */
  async uploadToCloudinary(req, res, next) {
    try {
      const user = req.user;
      const seller = req.seller;
      const agent = req.agent;

      if (!user && !seller && !agent) {
        return res.status(401).json({
          success: false,
          error: true,
          message: "Authentication required to upload media assets.",
        });
      }

      // Collect files across all potential upload fields (single, array, or multi-field)
      let filesToProcess = [];
      if (Array.isArray(req.files)) {
        filesToProcess = req.files;
      } else if (req.files && typeof req.files === "object") {
        filesToProcess = Object.values(req.files).flat();
      } else if (req.file) {
        filesToProcess = [req.file];
      }

      if (!filesToProcess || filesToProcess.length === 0) {
        return res.status(400).json({
          success: false,
          error: true,
          message: "No media files were uploaded. Please attach at least 1 image or video.",
        });
      }

      const {
        productId,
        productSlug,
        folderType,
        folder,
        optionKey = "",
        optionValue = "",
        variantId = "",
      } = req.body;

      const rawSubfolder = folderType || folder || "general";
      const cleanSubfolder = sanitizeSlug(rawSubfolder) || "general";

      // Server-enforced folder namespace isolation
      let folderPath = "zosh-bazaar/general";

      if (seller || user?.role === "SELLER") {
        const sellerId = (seller?._id || user?._id).toString();
        const cleanProdId = sanitizeSlug(productId || productSlug || "general");
        if (cleanSubfolder === "options" && optionKey && optionValue) {
          const cleanOpt = sanitizeSlug(`${optionKey}-${optionValue}`);
          folderPath = `zosh-bazaar/sellers/${sellerId}/products/${cleanProdId}/options/${cleanOpt}`;
        } else if (cleanSubfolder === "variants" && variantId) {
          const cleanVar = sanitizeSlug(variantId);
          folderPath = `zosh-bazaar/sellers/${sellerId}/products/${cleanProdId}/variants/${cleanVar}`;
        } else {
          folderPath = `zosh-bazaar/sellers/${sellerId}/products/${cleanProdId}/${cleanSubfolder}`;
        }
      } else if (user?.role === "ADMIN") {
        folderPath = `zosh-bazaar/admin/${cleanSubfolder}`;
      } else if (agent) {
        const agentId = sanitizeSlug(agent.agentId || agent._id.toString());
        folderPath = `zosh-bazaar/delivery/${agentId}/pod`;
      } else if (user) {
        const userId = user._id.toString();
        folderPath = `zosh-bazaar/customers/${userId}/${cleanSubfolder}`;
      }

      const results = [];

      if (!isCloudinaryConfigured()) {
        return res.status(503).json({
          success: false,
          error: true,
          code: "CLOUDINARY_NOT_CONFIGURED",
          message:
            "Cloud storage service is unavailable. Please configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in server/.env.",
        });
      }

      // Authoritative Cloudinary memory stream upload with full metadata
      for (let i = 0; i < filesToProcess.length; i++) {
        const file = filesToProcess[i];
        const resourceType =
          file.detectedResourceType ||
          (file.mimetype?.toLowerCase().startsWith("video/") ? "video" : "image");

        const uploadResult = await uploadBufferToCloudinary(file.buffer, {
          folder: folderPath,
          resourceType,
          tags: ["zosh-bazaar", cleanSubfolder].filter(Boolean),
        });

        results.push({
          mediaId: `med_${Date.now()}_${i}`,
          url: uploadResult.secureUrl,
          secureUrl: uploadResult.secureUrl,
          publicId: uploadResult.publicId,
          resourceType: uploadResult.resourceType || resourceType,
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

      return res.status(200).json({
        success: true,
        error: false,
        message: `Successfully processed ${results.length} media asset(s)`,
        folder: folderPath,
        data: results,
        media: results,
        secure_url: results[0]?.secureUrl || results[0]?.url,
        url: results[0]?.secureUrl || results[0]?.url,
        public_id: results[0]?.publicId,
        format: results[0]?.format,
        resource_type: results[0]?.resourceType,
        images: results.map((m) => m.secureUrl || m.url),
      });
    } catch (error) {
      console.error("[UploadController] Upload failed:", error.message || error);
      res.status(500).json({
        success: false,
        error: true,
        message: "Media upload failed. Please try again.",
      });
    }
  }

  /**
   * Upload multiple product images (legacy disk upload - deprecated and disabled)
   * POST /api/v1/upload/product-images
   */
  async uploadProductImages(req, res, next) {
    return res.status(410).json({
      success: false,
      error: true,
      code: "LOCAL_UPLOAD_DISABLED",
      message:
        "Direct local disk uploads are disabled. All media must be uploaded via Cloudinary using /api/v1/upload/cloudinary.",
    });
  }

  /**
   * Delete an uploaded image file from Cloudinary
   * DELETE /api/v1/upload/product-image
   */
  async deleteProductImage(req, res, next) {
    try {
      const user = req.user;
      const seller = req.seller;
      const agent = req.agent;

      if (!user && !seller && !agent) {
        return res.status(401).json({
          success: false,
          error: true,
          message: "Authentication required to delete media assets.",
        });
      }

      const { publicId } = req.body;

      if (!publicId) {
        return res.status(400).json({
          success: false,
          error: true,
          message: "publicId is required to delete Cloudinary media asset.",
        });
      }

      if (!isCloudinaryConfigured()) {
        return res.status(503).json({
          success: false,
          error: true,
          code: "CLOUDINARY_NOT_CONFIGURED",
          message: "Cloud storage service is unavailable. Please configure Cloudinary credentials.",
        });
      }

      const deleted = await deleteFromCloudinary(publicId);
      return res.status(200).json({
        success: true,
        error: false,
        message: deleted
          ? "Cloudinary media deleted successfully"
          : "Cloudinary asset deletion skipped or not found",
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new UploadController();
