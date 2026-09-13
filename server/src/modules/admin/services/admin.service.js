import { Order } from "../../../models/order.model.js";
import { User } from "../../../models/user.model.js";
import { Seller } from "../../../models/seller.model.js";
import { Product } from "../../../models/product.model.js";
import Transaction from "../../../models/transaction.model.js";
import OrderService from "../../customer/services/order.service.js";

class AdminService {
  async getDashboardSummary() {
    const [
      totalOrders,
      totalCustomers,
      totalSellers,
      pendingSellers,
      activeSellers,
      totalProducts,
      recentOrders,
      lowStockProducts,
      transactions,
    ] = await Promise.all([
      Order.countDocuments(),
      User.countDocuments({ role: "ROLE_CUSTOMER" }),
      Seller.countDocuments(),
      Seller.countDocuments({ accountStatus: "PENDING_VERIFICATION" }),
      Seller.countDocuments({ accountStatus: "ACTIVE" }),
      Product.countDocuments(),
      Order.find()
        .sort({ createdAt: -1 })
        .limit(8)
        .populate("user", "fullName email mobile")
        .populate("seller", "sellerName email")
        .populate({
          path: "orderItems",
          populate: { path: "product", select: "title images sellingPrice brand" },
        }),
      Product.find({ countInStock: { $lte: 10 } })
        .limit(6)
        .populate("seller", "sellerName")
        .select("title sellingPrice countInStock images seller hasVariants variants"),
      Transaction.find().select("order customer seller date amount"),
    ]);

    // Calculate total revenue from all orders
    const allOrders = await Order.find({ paymentStatus: "COMPLETED" }).select(
      "totalSellingPrice"
    );
    const totalRevenue = allOrders.reduce(
      (sum, ord) => sum + (ord.totalSellingPrice || 0),
      0
    );

    return {
      totalRevenue,
      totalOrders,
      totalCustomers,
      totalSellers,
      pendingSellers,
      activeSellers,
      totalProducts,
      recentOrders,
      lowStockProducts,
      totalTransactions: transactions.length,
    };
  }

  async getAllOrders(query = {}) {
    return await OrderService.getAllOrdersForAdmin(query);
  }

  async updateOrderStatusByAdmin(orderId, nextStatus, note) {
    return await OrderService.updateOrderStatus(
      orderId,
      nextStatus,
      "ADMIN",
      note || "Updated by platform administrator"
    );
  }

  async getAllCustomers(query = {}) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const [customers, totalCustomers] = await Promise.all([
      User.find({ role: "ROLE_CUSTOMER" })
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments({ role: "ROLE_CUSTOMER" }),
    ]);

    return {
      customers,
      totalCustomers,
      totalPages: Math.ceil(totalCustomers / limit),
      currentPage: page,
    };
  }

  async getAllTransactions(query = {}) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const [transactions, totalTransactions] = await Promise.all([
      Transaction.find()
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .populate("customer", "fullName email mobile")
        .populate("seller", "sellerName email")
        .populate("order", "orderId totalSellingPrice orderStatus"),
      Transaction.countDocuments(),
    ]);

    return {
      transactions,
      totalTransactions,
      totalPages: Math.ceil(totalTransactions / limit),
      currentPage: page,
    };
  }

  async getInventory(query = {}) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (query.lowStock === "true") {
      filter.countInStock = { $lte: 10 };
    }

    const [products, totalProducts] = await Promise.all([
      Product.find(filter)
        .populate("seller", "sellerName email")
        .populate("category", "name")
        .select("title brand countInStock sellingPrice mrpPrice images hasVariants variants seller category")
        .skip(skip)
        .limit(limit)
        .sort({ countInStock: 1 }),
      Product.countDocuments(filter),
    ]);

    return {
      items: products,
      totalProducts,
      totalPages: Math.ceil(totalProducts / limit),
      currentPage: page,
    };
  }

  async updateStock(productId, { countInStock, variantId }) {
    const product = await Product.findById(productId);
    if (!product) throw new Error("Product not found");

    if (variantId && product.hasVariants) {
      const variant = product.variants.id(variantId);
      if (!variant) throw new Error("Variant not found");
      variant.countInStock = Number(countInStock);
      product.countInStock = product.variants.reduce((sum, v) => sum + v.countInStock, 0);
    } else {
      product.countInStock = Number(countInStock);
    }

    await product.save();
    return product;
  }

  async deleteProductByAdmin(productId) {
    const deleted = await Product.findByIdAndDelete(productId);
    if (!deleted) throw new Error("Product not found");
    return deleted;
  }
}

export default new AdminService();
