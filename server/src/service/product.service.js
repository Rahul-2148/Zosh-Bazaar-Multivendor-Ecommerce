import { Category } from "../models/category.model.js";
import { Product } from "../models/product.model.js";
import { calculateDiscountPercentage } from "../utils/calculateDiscountPercentage.js";

class ProductService {
  // singleton class for product service
  async createProduct(req, seller) {
    try {
      const discountPercent = calculateDiscountPercentage(
        req.mrpPrice,
        req.sellingPrice
      );

      const category1 = await this.createOrGetCategory(req.category1, 1, null);
      const category2 = await this.createOrGetCategory(
        req.category2,
        2,
        category1._id
      );
      const category3 = await this.createOrGetCategory(
        req.category3,
        3,
        category2._id
      );

      const product = await Product.create({
        title: req.title,
        description: req.description,
        brand: req.brand,
        mrpPrice: req.mrpPrice,
        sellingPrice: req.sellingPrice,
        discountPercent: discountPercent,
        countInStock: req.countInStock,
        color: req.color,
        images: req.images,
        size: req.size,
        ram: req.ram,
        weight: req.weight,
        capacity: req.capacity,
        seller: seller._id,
        category: category3._id,
      });

      await product.save();
      return product;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async createOrGetCategory(categoryId, level, parentId = null) {
    let category = await Category.findOne({ categoryId });

    if (!category) {
      category = await Category.create({
        categoryId,
        name: categoryId, // assuming category name is same as category ID
        level,
        parentCategory: parentId,
      });
      await category.save();
    }

    return category;
  }

  async deleteProduct(productId, sellerId) {
    try {
      const product = await Product.findOneAndDelete({
        _id: productId,
        seller: sellerId,
      });

      if (!product) {
        throw new Error("Product not found or not authorized");
      }

      return { message: "Product deleted successfully" };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async updateProduct(productId, updatedProductData) {
    try {
      const product = await Product.findByIdAndDelete(
        productId,
        updatedProductData,
        { new: true }
      );
      return product;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async findProductById(productId) {
    try {
      const product = await Product.findById(productId).populate("category");

      if (!product) {
        throw new Error("Product not found");
      }
      return product;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async searchProduct(query) {
    try {
      const products = await Product.aggregate([
        {
          $lookup: {
            from: "categories", // 👈 this must match your actual MongoDB collection name (usually "categories")
            localField: "category",
            foreignField: "_id",
            as: "categoryDetails",
          },
        },
        {
          $unwind: "$categoryDetails",
        },
        {
          $match: {
            $or: [
              { title: { $regex: query, $options: "i" } },
              { description: { $regex: query, $options: "i" } },
              { brand: { $regex: query, $options: "i" } },
              { color: { $regex: query, $options: "i" } },
              { size: { $regex: query, $options: "i" } },
              { ram: { $regex: query, $options: "i" } },
              { weight: { $regex: query, $options: "i" } },
              { capacity: { $regex: query, $options: "i" } },
              { "categoryDetails.name": { $regex: query, $options: "i" } }, // 👈 category name search
            ],
          },
        },
      ]);

      return products;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getProductsBySellerId(sellerId) {
    try {
      const products = await Product.find({ seller: sellerId }).populate("category");
      return products;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getAllProducts(req) {
    try {
      const filterQuery = {};

      if (req.category) {
        const category = await Category.findOne({ categoryId: req.category });

        if (!category) {
          return {
            content: [],
            totalPages: 0,
            totalElements: 0,
          };
        }
        filterQuery.category = category._id.toString();
      }

      if (req.color) {
        filterQuery.color = req.color;
      }

      if (req.minPrice && req.maxPrice) {
        filterQuery.sellingPrice = {
          $gte: req.minPrice,
          $lte: req.maxPrice,
        };
      }

      if (req.minDiscount) {
        filterQuery.discountPercent = {
          $gte: req.minDiscount,
        };
      }

      if (req.size) {
        filterQuery.size = req.size;
      }

      let sortQuery = {};

      if (req.sort === "price_low_to_high") {
        sortQuery = { sellingPrice: 1 };
      } else if (req.sort === "price_high_to_low") {
        sortQuery = { sellingPrice: -1 };
      } else if (req.sort === "discount_high_to_low") {
        sortQuery = { discountPercent: -1 };
      } else if (req.sort === "discount_low_to_high") {
        sortQuery = { discountPercent: 1 };
      }

      const products = await Product.find(filterQuery)
        .sort(sortQuery)
        .skip(req.pageNumber * 10)
        .limit(10)
        .populate({ path: "seller" });

      const totalElements = await Product.countDocuments(filterQuery);
      const totalPages = Math.ceil(totalElements / 10);

      const response = {
        content: products,
        totalPages: totalPages,
        totalElements: totalElements,
      };

      return response;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async deleteMultipleProducts(productIds, sellerId) {
    try {
      const deletedProducts = await Product.deleteMany({
        _id: { $in: productIds },
        seller: sellerId,
      });
      return deletedProducts.deletedCount;
    } catch (error) {
      throw new Error(error.message);
    }
  }
}

export default new ProductService(); // singleton instance of the class (object)
