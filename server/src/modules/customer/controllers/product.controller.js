import productService from "../services/product.service.js";

class ProductController {
  async getProductBySellerId(req, res, next) {
    try {
      const seller = req.seller;
      const products = await productService.getProductsBySellerId(seller._id);
      return res.status(200).json({
        message: "Seller products fetched successfully",
        products,
        error: false,
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }

  async createProduct(req, res, next) {
    try {
      const seller = req.seller;
      const product = await productService.createProduct(req.body, seller);
      return res.status(201).json({
        message: "Product created successfully",
        product,
        error: false,
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProduct(req, res, next) {
    try {
      const seller = req.seller;
      const product = await productService.updateProduct(
        req.params.productId || req.params.id,
        req.body,
        seller ? seller._id : null
      );
      return res.status(200).json({
        message: "Product updated successfully",
        product,
        error: false,
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteProduct(req, res, next) {
    try {
      const seller = req.seller;
      await productService.deleteProduct(
        req.params.productId || req.params.id,
        seller ? seller._id : null
      );
      return res.status(200).json({
        message: "Product deleted successfully",
        error: false,
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteMultipleProducts(req, res, next) {
    try {
      const seller = req.seller;
      const { productIds } = req.body;
      const result = await productService.deleteMultipleProducts(
        productIds,
        seller ? seller._id : null
      );
      return res.status(200).json({
        message: `${result.deletedCount} products deleted successfully`,
        ...result,
        error: false,
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }

  async bulkUpdateStatus(req, res, next) {
    try {
      const seller = req.seller;
      const { productIds, status } = req.body;
      const result = await productService.bulkUpdateStatus(
        productIds,
        status,
        seller ? seller._id : null
      );
      return res.status(200).json({
        message: "Products status updated successfully",
        ...result,
        error: false,
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProductById(req, res, next) {
    try {
      const product = await productService.findProductById(req.params.productId);
      return res.status(200).json({
        product,
        error: false,
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSearchSuggestions(req, res, next) {
    try {
      const query = (req.query.q || "").trim();
      if (!query || query.length < 1) {
        return res.status(200).json({ success: true, products: [], brands: [], categories: [] });
      }

      const { Product } = await import("../../../models/product.model.js");
      const { Category } = await import("../../../models/category.model.js");

      const regex = new RegExp(query, "i");

      const [products, categories, matchedBrands] = await Promise.all([
        Product.find({
          status: "PUBLISHED",
          $or: [{ title: regex }, { brand: regex }, { tags: regex }],
        })
          .select("title brand sellingPrice mrpPrice images category ratings")
          .populate("category", "name categoryId")
          .limit(6)
          .lean(),
        Category.find({ name: regex })
          .select("name categoryId level")
          .limit(4)
          .lean(),
        Product.distinct("brand", {
          status: "PUBLISHED",
          brand: regex,
        }),
      ]);

      return res.status(200).json({
        success: true,
        error: false,
        products,
        categories,
        brands: matchedBrands.slice(0, 4),
      });
    } catch (error) {
      next(error);
    }
  }

  async searchProduct(req, res, next) {
    try {
      const query = req.query.q || req.query.search;
      if (!query) {
        return res.status(400).json({ message: "Search query is required." });
      }
      const result = await productService.getAllProducts({ search: query, ...req.query });
      return res.status(200).json({
        products: result.content,
        content: result.content,
        totalPages: result.totalPages,
        totalElements: result.totalElements,
        error: false,
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllProducts(req, res, next) {
    try {
      const result = await productService.getAllProducts(req.query);
      return res.status(200).json({
        products: result,
        content: result.content,
        totalPages: result.totalPages,
        totalElements: result.totalElements,
        error: false,
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCategoryFilters(req, res, next) {
    try {
      const categoryId = req.query.category || req.query.categoryId || "all";
      const filters = await productService.getCategoryFilters(categoryId, req.query);
      return res.status(200).json({
        success: true,
        error: false,
        ...filters,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ProductController();

