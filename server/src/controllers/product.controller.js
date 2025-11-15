import productService from "../service/product.service.js";
import Yup from "yup";

class sellerProductController {
  // class
  async getProductBySellerId(req, res) {
    try {
      const seller = await req.seller;

      const products = await productService.getProductsBySellerId(seller._id);

      return res.status(200).json({
        message: "Products fetched successfully",
        products: products,
        error: false,
        success: true,
      });
    } catch (error) {
      return res
        .status(error instanceof Error ? 404 : 500)
        .json({ message: error.message });
    }
  }

  async createProduct(req, res) {
    try {
      const seller = await req.seller;

      const product = await productService.createProduct(req.body, seller);

      return res.status(201).json({
        message: "Product created successfully",
        product: product,
        error: false,
        success: true,
      });
    } catch (error) {
      if (error instanceof Yup.ValidationError) {
        return res.status(400).json({
          error: "Validation error",
          errors: error.errors,
          count: error.errors.length,
          success: false,
          error: true,
        });
      }
      return res.status(500).json({ message: error.message });
    }
  }

  async deleteProduct(req, res) {
    try {
      const product = await productService.deleteProduct(req.params.productId);
      return res.status(200).json({
        message: "Product deleted successfully",
        error: false,
        success: true,
        product: product,
      });
    } catch (error) {
      return res
        .status(error instanceof Error ? 404 : 500)
        .json({ message: error.message });
    }
  }

  async updateProduct(req, res) {
    try {
      const product = await productService.updateProduct(
        req.params.productId,
        req.body
      );
      return res.status(200).json({
        message: "Product updated successfully",
        product: product,
        error: false,
        success: true,
      });
    } catch (error) {
      return res
        .status(error instanceof Error ? 404 : 500)
        .json({ message: error.message });
    }
  }

  async deleteMultipleProducts(req, res) {
    try {
      const deletedProducts = await productService.deleteMultipleProducts(
        req.body.productIds,
        req.seller._id
      );
      return res.status(200).json({
        message: "Products deleted successfully",
        deletedProducts: deletedProducts,
        error: false,
        success: true,
      });
    } catch (error) {
      return res
        .status(error instanceof Error ? 404 : 500)
        .json({ message: error.message });
    }
  }

  // customer specific controller (get product by id)
  async getProductById(req, res) {
    try {
      const product = await productService.findProductById(
        req.params.productId
      );

      return res.status(200).json({
        product: product,
        error: false,
        success: true,
      });
    } catch (error) {
      return res
        .status(error instanceof Error ? 404 : 500)
        .json({ message: error.message });
    }
  }

  // customer specific controller (search product)
  async searchProduct(req, res) {
    try {
      const query = req.query.q;

      if (!query) {
        return res.status(400).json({ message: "Search query is required." });
      }

      const products = await productService.searchProduct(query);

      return res.status(200).json({
        products: products,
        error: false,
        success: true,
      });
    } catch (error) {
      return res
        .status(error instanceof Error ? 404 : 500)
        .json({ message: error.message });
    }
  }

  // customer specific controller (get all products)
  async getAllProducts(req, res) {
    try {
      const products = await productService.getAllProducts(req.query);

      return res.status(200).json({
        products: products,
        error: false,
        success: true,
      });
    } catch (error) {
      return res
        .status(error instanceof Error ? 404 : 500)
        .json({ message: error.message });
    }
  }
}

export default new sellerProductController(); // object
