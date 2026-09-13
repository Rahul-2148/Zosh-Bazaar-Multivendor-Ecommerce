import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_ROOT = path.resolve(__dirname, "../../../../uploads");

class UploadController {
  /**
   * Upload multiple product images into uploads/products/:slug/
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
          url: absoluteUrl,
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
   * Delete an uploaded image file from disk
   * DELETE /api/v1/upload/product-image
   */
  async deleteProductImage(req, res, next) {
    try {
      const { relativePath, productSlug, filename } = req.body;
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

      return res.status(404).json({
        success: false,
        error: true,
        message: "Image file not found on disk",
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new UploadController();
