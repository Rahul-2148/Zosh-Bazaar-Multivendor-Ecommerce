import adminService from "../services/admin.service.js";
import productService from "../../customer/services/product.service.js";

class AdminController {
  async getDashboardSummary(req, res, next) {
    try {
      const summary = await adminService.getDashboardSummary();
      return res.status(200).json({
        message: "Dashboard summary fetched successfully",
        summary,
        success: true,
        error: false,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllOrders(req, res, next) {
    try {
      const result = await adminService.getAllOrders(req.query);
      return res.status(200).json({
        message: "All orders fetched successfully",
        ...result,
        success: true,
        error: false,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateOrderStatus(req, res, next) {
    try {
      const { orderId } = req.params;
      const { orderStatus, note } = req.body;
      const updatedOrder = await adminService.updateOrderStatusByAdmin(
        orderId,
        orderStatus,
        note
      );
      return res.status(200).json({
        message: "Order status updated successfully by admin",
        order: updatedOrder,
        success: true,
        error: false,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllCustomers(req, res, next) {
    try {
      const result = await adminService.getAllCustomers(req.query);
      return res.status(200).json({
        message: "All customers fetched successfully",
        ...result,
        success: true,
        error: false,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllTransactions(req, res, next) {
    try {
      const result = await adminService.getAllTransactions(req.query);
      return res.status(200).json({
        message: "All transactions fetched successfully",
        ...result,
        success: true,
        error: false,
      });
    } catch (error) {
      next(error);
    }
  }

  async getInventory(req, res, next) {
    try {
      const result = await adminService.getInventory(req.query);
      return res.status(200).json({
        message: "Inventory fetched successfully",
        ...result,
        success: true,
        error: false,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateStock(req, res, next) {
    try {
      const { productId } = req.params;
      const product = await adminService.updateStock(productId, req.body);
      return res.status(200).json({
        message: "Stock updated successfully",
        product,
        success: true,
        error: false,
      });
    } catch (error) {
      next(error);
    }
  }

  async createProduct(req, res, next) {
    try {
      const product = await productService.createProduct(req.body, {
        _id: req.body.seller || req.user._id,
      });
      return res.status(201).json({
        message: "Product created successfully by admin",
        product,
        success: true,
        error: false,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProduct(req, res, next) {
    try {
      const product = await productService.updateProduct(
        req.params.id,
        req.body,
        null // null sellerId permits admin update
      );
      return res.status(200).json({
        message: "Product updated successfully by admin",
        product,
        success: true,
        error: false,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteProduct(req, res, next) {
    try {
      const { id } = req.params;
      await adminService.deleteProductByAdmin(id);
      return res.status(200).json({
        message: "Product deleted successfully by admin",
        success: true,
        error: false,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AdminController();
