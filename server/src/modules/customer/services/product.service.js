import mongoose from "mongoose";
import { Category } from "../../../models/category.model.js";
import { Product, sanitizeProductSlug } from "../../../models/product.model.js";
import { calculateDiscountPercentage } from "../../../utils/calculateDiscountPercentage.js";
import {
  emitProductCreated,
  emitProductUpdated,
  emitStockUpdated,
} from "../../../realtime/socket.js";
import wishlistWatcherService from "./wishlistWatcher.service.js";

class ProductService {
  async createProduct(data, seller) {
    try {
      let categoryId = data.category;

      // Handle legacy category1 / category2 / category3 if passed
      if (!categoryId && data.category3) {
        let cat = await Category.findOne({ categoryId: data.category3 });
        if (!cat) {
          cat = await Category.create({
            categoryId: data.category3,
            name: data.category3,
            level: 3,
          });
        }
        categoryId = cat._id;
      } else if (!categoryId && (data.category1 || data.category2)) {
        const catSlug = data.category2 || data.category1;
        let cat = await Category.findOne({ categoryId: catSlug });
        if (!cat) {
          cat = await Category.create({
            categoryId: catSlug,
            name: catSlug,
            level: data.category2 ? 2 : 1,
          });
        }
        categoryId = cat._id;
      }

      if (!categoryId) {
        throw new Error("Category is required");
      }

      const hasVariants = Boolean(
        data.hasVariants && Array.isArray(data.variants) && data.variants.length > 0
      );

      let variants = [];
      let mrpPrice = Number(data.mrpPrice) || 0;
      let sellingPrice = Number(data.sellingPrice) || 0;
      let countInStock = Number(data.countInStock) || 0;

      if (hasVariants) {
        variants = data.variants.map((v, index) => {
          const vMrp = Number(v.mrpPrice) || mrpPrice;
          const vSelling = Number(v.sellingPrice) || sellingPrice;
          const vStock = Number(v.countInStock) || 0;
          const vDiscount = calculateDiscountPercentage(vMrp, vSelling);
          const vSku =
            v.sku && v.sku.trim()
              ? v.sku.trim()
              : `${(data.title || "PROD").slice(0, 4).toUpperCase()}-${Date.now().toString(36)}-${index + 1}`;

          return {
            sku: vSku,
            title: v.title || "",
            attributes: Array.isArray(v.attributes)
              ? v.attributes.map((a) => ({
                  name: a.name || a.key || "Attribute",
                  key:
                    a.key ||
                    (a.name
                      ? a.name.toLowerCase().replace(/[^a-z0-9]/g, "_")
                      : "attr"),
                  value: a.value,
                  unit: a.unit || "",
                }))
              : [],
            mrpPrice: vMrp,
            sellingPrice: vSelling,
            discountPercent: vDiscount,
            countInStock: vStock,
            reservedStock: Number(v.reservedStock) || 0,
            images: Array.isArray(v.images) ? v.images : [],
            weight: v.weight,
            dimensions: v.dimensions,
            barcode: v.barcode || "",
            status: v.status || "ACTIVE",
          };
        });

        // Compute product-level summary prices from variants
        const activeVariants = variants.filter((v) => v.status === "ACTIVE");
        const listToUse = activeVariants.length > 0 ? activeVariants : variants;
        sellingPrice = Math.min(...listToUse.map((v) => v.sellingPrice));
        const matchedVariant = listToUse.find((v) => v.sellingPrice === sellingPrice);
        mrpPrice = matchedVariant ? matchedVariant.mrpPrice : listToUse[0].mrpPrice;
        countInStock = listToUse.reduce((sum, v) => sum + v.countInStock, 0);
      }

      const discountPercent = calculateDiscountPercentage(mrpPrice, sellingPrice);
      const generatedSlug = data.slug || sanitizeProductSlug(data.title);

      const product = new Product({
        title: data.title,
        slug: generatedSlug,
        sku: data.sku || `${(data.brand || "ZB").toUpperCase().slice(0, 4)}-${Date.now().toString(36).toUpperCase()}`,
        description: data.description,
        highlights: Array.isArray(data.highlights) ? data.highlights : [],
        brand: data.brand || "Generic",
        category: categoryId,
        seller: seller._id || seller,
        hasVariants,
        attributeDefinitions: Array.isArray(data.attributeDefinitions)
          ? data.attributeDefinitions
          : [],
        variants,
        specifications: Array.isArray(data.specifications)
          ? data.specifications
          : [],
        warranty: data.warranty || {
          summary: "1 Year Manufacturer Warranty",
          durationMonths: 12,
          type: "MANUFACTURER",
        },
        returnPolicy: data.returnPolicy || {
          returnable: true,
          windowDays: 7,
          policyType: "REPLACEMENT_ONLY",
        },
        shippingDetails: data.shippingDetails || {
          weightKg: 0.5,
          dimensionsCm: { length: 15, width: 10, height: 5 },
          freeShipping: true,
          estimatedDeliveryDays: 3,
        },
        measurement: data.measurement,
        mrpPrice,
        sellingPrice,
        discountPercent,
        countInStock,
        lowStockThreshold: data.lowStockThreshold || 5,
        inStock: countInStock > 0,
        images: Array.isArray(data.images) ? data.images : [],
        status: data.status || "PUBLISHED",
        tags: Array.isArray(data.tags) ? data.tags : [],
        // Legacy compatibility
        color: data.color || "",
        size: data.size || "",
        ram: data.ram || "",
        weight: typeof data.weight === "string" ? data.weight : "",
        capacity: data.capacity || "",
      });

      const savedProduct = await product.save();
      emitProductCreated(savedProduct);
      return savedProduct;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async updateProduct(productId, data, sellerId = null) {
    try {
      const product = await Product.findById(productId);
      if (!product) throw new Error("Product not found");

      if (sellerId && product.seller.toString() !== sellerId.toString()) {
        throw new Error("Unauthorized to update this product");
      }

      const oldProductData = {
        sellingPrice: product.sellingPrice,
        mrpPrice: product.mrpPrice,
        countInStock: product.countInStock,
      };

      if (data.title) {
        product.title = data.title;
        if (!data.slug) product.slug = sanitizeProductSlug(data.title);
      }
      if (data.slug) product.slug = sanitizeProductSlug(data.slug);
      if (data.sku) product.sku = data.sku;
      if (data.description) product.description = data.description;
      if (data.highlights) product.highlights = data.highlights;
      if (data.brand) product.brand = data.brand;
      if (data.category) product.category = data.category;
      if (data.status) product.status = data.status;
      if (data.images) product.images = data.images;
      if (data.tags) product.tags = data.tags;
      if (data.specifications) product.specifications = data.specifications;
      if (data.warranty) product.warranty = data.warranty;
      if (data.returnPolicy) product.returnPolicy = data.returnPolicy;
      if (data.shippingDetails) product.shippingDetails = data.shippingDetails;
      if (data.measurement) product.measurement = data.measurement;
      if (data.attributeDefinitions) product.attributeDefinitions = data.attributeDefinitions;

      if (data.hasVariants !== undefined) product.hasVariants = data.hasVariants;

      if (product.hasVariants && Array.isArray(data.variants)) {
        product.variants = data.variants.map((v, index) => {
          const vMrp = Number(v.mrpPrice) || product.mrpPrice;
          const vSelling = Number(v.sellingPrice) || product.sellingPrice;
          const vStock = Number(v.countInStock) || 0;
          return {
            ...v,
            sku: v.sku || `${product.title.slice(0, 4).toUpperCase()}-${index + 1}`,
            attributes: Array.isArray(v.attributes)
              ? v.attributes.map((a) => ({
                  name: a.name || a.key || "Attribute",
                  key:
                    a.key ||
                    (a.name
                      ? a.name.toLowerCase().replace(/[^a-z0-9]/g, "_")
                      : "attr"),
                  value: a.value,
                  unit: a.unit || "",
                }))
              : [],
            mrpPrice: vMrp,
            sellingPrice: vSelling,
            discountPercent: calculateDiscountPercentage(vMrp, vSelling),
            countInStock: vStock,
          };
        });

        const activeVariants = product.variants.filter((v) => v.status === "ACTIVE");
        const listToUse = activeVariants.length > 0 ? activeVariants : product.variants;
        product.sellingPrice = Math.min(...listToUse.map((v) => v.sellingPrice));
        const matched = listToUse.find((v) => v.sellingPrice === product.sellingPrice);
        product.mrpPrice = matched ? matched.mrpPrice : listToUse[0].mrpPrice;
        product.discountPercent = calculateDiscountPercentage(product.mrpPrice, product.sellingPrice);
        product.countInStock = listToUse.reduce((sum, v) => sum + v.countInStock, 0);
      } else {
        if (data.mrpPrice !== undefined) product.mrpPrice = Number(data.mrpPrice);
        if (data.sellingPrice !== undefined) product.sellingPrice = Number(data.sellingPrice);
        if (data.countInStock !== undefined) product.countInStock = Number(data.countInStock);
        product.discountPercent = calculateDiscountPercentage(product.mrpPrice, product.sellingPrice);
      }

      product.inStock = product.countInStock > 0;
      const saved = await product.save();

      emitProductUpdated(saved);
      emitStockUpdated({
        productId: saved._id,
        countInStock: saved.countInStock,
        inStock: saved.inStock,
      });

      // Asynchronously trigger price-drop and back-in-stock alerts for saved shoppers
      wishlistWatcherService
        .checkProductUpdates(saved._id, oldProductData, saved)
        .catch((err) => {
          console.error("[ProductService] Wishlist watcher failed:", err.message);
        });

      return saved;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async findProductById(identifier) {
    try {
      const isObjectId = mongoose.isValidObjectId(identifier);
      const query = isObjectId ? { _id: identifier } : { slug: identifier };

      let product = await Product.findOne(query)
        .populate("category")
        .populate("seller", "sellerName email businessDetails mobile");

      if (!product && !isObjectId) {
        // Fallback search by title
        product = await Product.findOne({ title: new RegExp(`^${identifier}$`, "i") })
          .populate("category")
          .populate("seller", "sellerName email businessDetails mobile");
      }

      if (!product) throw new Error("Product not found");
      return product;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getAllProducts(req = {}) {
    try {
      const filterQuery = {};

      // Filter by Status (Default only published for customer browse)
      if (req.status) {
        filterQuery.status = req.status;
      } else if (!req.adminView) {
        filterQuery.status = "PUBLISHED";
      }

      // Category filter (supports hierarchy)
      if (req.category) {
        let cat = null;
        if (req.category.match(/^[0-9a-fA-F]{24}$/)) {
          cat = await Category.findById(req.category);
        }
        if (!cat) {
          cat = await Category.findOne({ categoryId: req.category });
        }

        if (cat) {
          // If level 1 or 2, find all descendant categories
          if (cat.level < 3) {
            const children = await Category.find({ parentCategory: cat._id });
            const childIds = children.map((c) => c._id);
            if (cat.level === 1) {
              const grandchildren = await Category.find({ parentCategory: { $in: childIds } });
              const grandChildIds = grandchildren.map((c) => c._id);
              filterQuery.category = { $in: [cat._id, ...childIds, ...grandChildIds] };
            } else {
              filterQuery.category = { $in: [cat._id, ...childIds] };
            }
          } else {
            filterQuery.category = cat._id;
          }
        } else {
          return { content: [], totalPages: 0, totalElements: 0 };
        }
      }

      // Brand filter (supports comma-separated list)
      if (req.brand) {
        const brands = req.brand.split(",").map((b) => b.trim());
        filterQuery.brand = { $in: brands.map((b) => new RegExp(`^${b}$`, "i")) };
      }

      // Price range
      if (req.minPrice !== undefined || req.maxPrice !== undefined) {
        filterQuery.sellingPrice = {};
        if (req.minPrice !== undefined) filterQuery.sellingPrice.$gte = Number(req.minPrice);
        if (req.maxPrice !== undefined) filterQuery.sellingPrice.$lte = Number(req.maxPrice);
      }

      // Discount filter
      if (req.minDiscount) {
        filterQuery.discountPercent = { $gte: Number(req.minDiscount) };
      }

      // In-stock only
      if (req.inStock === "true" || req.inStock === true) {
        filterQuery.countInStock = { $gt: 0 };
      }

      // Dynamic Variant & Specification Attribute filtering
      // e.g. ram=8GB, storage=256GB, color=Black
      const reservedKeys = [
        "category",
        "brand",
        "minPrice",
        "maxPrice",
        "minDiscount",
        "inStock",
        "search",
        "q",
        "sort",
        "pageNumber",
        "pageSize",
        "status",
        "adminView",
      ];

      const attributeFilters = [];
      for (const [key, value] of Object.entries(req)) {
        if (!reservedKeys.includes(key) && value) {
          const values = String(value).split(",").map((v) => v.trim());
          attributeFilters.push({
            $or: [
              {
                "variants.attributes": {
                  $elemMatch: {
                    key: key.toLowerCase(),
                    value: { $in: values },
                  },
                },
              },
              {
                specifications: {
                  $elemMatch: {
                    key: key.toLowerCase(),
                    value: { $in: values },
                  },
                },
              },
              // Legacy field fallback
              { [key]: { $in: values } },
            ],
          });
        }
      }

      if (attributeFilters.length > 0) {
        filterQuery.$and = attributeFilters;
      }

      // Search keyword
      const searchQuery = req.search || req.q;
      if (searchQuery) {
        const searchRegex = new RegExp(searchQuery, "i");
        filterQuery.$or = [
          { title: searchRegex },
          { brand: searchRegex },
          { description: searchRegex },
          { tags: searchRegex },
        ];
      }

      // Sorting
      let sortQuery = { createdAt: -1 };
      if (req.sort === "price_low_to_high") {
        sortQuery = { sellingPrice: 1 };
      } else if (req.sort === "price_high_to_low") {
        sortQuery = { sellingPrice: -1 };
      } else if (req.sort === "discount_high_to_low") {
        sortQuery = { discountPercent: -1 };
      } else if (req.sort === "discount_low_to_high") {
        sortQuery = { discountPercent: 1 };
      } else if (req.sort === "rating") {
        sortQuery = { "ratings.average": -1 };
      } else if (req.sort === "newest") {
        sortQuery = { createdAt: -1 };
      }

      const pageSize = Math.max(1, parseInt(req.pageSize, 10) || 12);
      const pageNumber = Math.max(0, parseInt(req.pageNumber, 10) || 0);

      const [products, totalElements] = await Promise.all([
        Product.find(filterQuery)
          .sort(sortQuery)
          .skip(pageNumber * pageSize)
          .limit(pageSize)
          .populate("category", "name categoryId level")
          .populate("seller", "sellerName businessDetails"),
        Product.countDocuments(filterQuery),
      ]);

      const totalPages = Math.max(1, Math.ceil(totalElements / pageSize));

      return {
        content: products,
        totalPages,
        totalElements,
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getProductsBySellerId(sellerId) {
    return await Product.find({ seller: sellerId })
      .populate("category", "name categoryId")
      .sort({ createdAt: -1 });
  }

  async deleteProduct(productId, sellerId = null) {
    const filter = { _id: productId };
    if (sellerId) filter.seller = sellerId;

    const product = await Product.findOneAndDelete(filter);
    if (!product) throw new Error("Product not found or not authorized");
    return product;
  }

  async deleteMultipleProducts(productIds, sellerId = null) {
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return { deletedCount: 0 };
    }
    const filter = { _id: { $in: productIds } };
    if (sellerId) filter.seller = sellerId;

    const result = await Product.deleteMany(filter);
    return { deletedCount: result.deletedCount || 0 };
  }

  async bulkUpdateStatus(productIds, status, sellerId = null) {
    if (!["PUBLISHED", "DRAFT", "ARCHIVED"].includes(status)) {
      throw new Error(`Invalid status "${status}". Allowed: PUBLISHED, DRAFT, ARCHIVED`);
    }
    const filter = { _id: { $in: productIds } };
    if (sellerId) filter.seller = sellerId;

    const result = await Product.updateMany(filter, { $set: { status } });
    return result.modifiedCount;
  }

  async bulkUpdateStock(updates, sellerId = null) {
    let modifiedCount = 0;
    for (const item of updates) {
      const filter = { _id: item.productId };
      if (sellerId) filter.seller = sellerId;

      const product = await Product.findOne(filter);
      if (!product) continue;

      if (item.variants && Array.isArray(item.variants) && product.variants?.length > 0) {
        item.variants.forEach((vu) => {
          const targetVariant = product.variants.id(vu.variantId);
          if (targetVariant && vu.countInStock !== undefined) {
            targetVariant.countInStock = Number(vu.countInStock);
          }
        });
        product.countInStock = product.variants.reduce((acc, v) => acc + (v.countInStock || 0), 0);
      } else if (item.countInStock !== undefined) {
        product.countInStock = Number(item.countInStock);
      }

      await product.save();
      modifiedCount++;
    }
    return modifiedCount;
  }

  async getCategoryFilters(categoryId, _query = {}) {
    try {
      const matchStage = { status: "PUBLISHED" };
      let matchedCategory = null;
      let breadcrumbs = [];

      if (categoryId && categoryId !== "all") {
        let cat = null;
        if (categoryId.match(/^[0-9a-fA-F]{24}$/)) {
          cat = await Category.findById(categoryId).populate("parentCategory");
        }
        if (!cat) {
          cat = await Category.findOne({ categoryId }).populate("parentCategory");
        }

        if (cat) {
          matchedCategory = cat;

          // Build breadcrumbs
          const trail = [];
          let cur = cat;
          while (cur) {
            trail.unshift({
              name: cur.name,
              categoryId: cur.categoryId,
              level: cur.level,
            });
            if (cur.parentCategory) {
              if (cur.parentCategory.name) {
                cur = cur.parentCategory;
              } else {
                cur = await Category.findById(cur.parentCategory);
              }
            } else {
              cur = null;
            }
          }
          breadcrumbs = trail;

          // Descendants
          if (cat.level < 3) {
            const children = await Category.find({ parentCategory: cat._id });
            const childIds = children.map((c) => c._id);
            if (cat.level === 1) {
              const grandchildren = await Category.find({ parentCategory: { $in: childIds } });
              const grandChildIds = grandchildren.map((c) => c._id);
              matchStage.category = { $in: [cat._id, ...childIds, ...grandChildIds] };
            } else {
              matchStage.category = { $in: [cat._id, ...childIds] };
            }
          } else {
            matchStage.category = cat._id;
          }
        }
      }

      // 1. Aggregate Brands
      const brandAggregation = await Product.aggregate([
        { $match: matchStage },
        { $group: { _id: "$brand", count: { $sum: 1 } } },
        { $match: { _id: { $nin: [null, ""] } } },
        { $sort: { count: -1, _id: 1 } },

        { $limit: 30 },
      ]);

      const brands = brandAggregation.map((b) => ({
        name: b._id,
        value: b._id,
        count: b.count,
      }));

      // 2. Aggregate Min & Max Prices
      const priceStats = await Product.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            minPrice: { $min: "$sellingPrice" },
            maxPrice: { $max: "$sellingPrice" },
            totalCount: { $sum: 1 },
            inStockCount: {
              $sum: { $cond: [{ $gt: ["$countInStock", 0] }, 1, 0] },
            },
          },
        },
      ]);

      const minPrice = priceStats[0]?.minPrice || 0;
      const maxPrice = priceStats[0]?.maxPrice || 100000;
      const totalCount = priceStats[0]?.totalCount || 0;
      const inStockCount = priceStats[0]?.inStockCount || 0;

      // 3. Dynamic Variant Attributes & Specifications
      const variantAttrs = await Product.aggregate([
        { $match: matchStage },
        { $unwind: "$variants" },
        { $unwind: "$variants.attributes" },
        {
          $group: {
            _id: {
              key: "$variants.attributes.key",
              name: "$variants.attributes.name",
              value: "$variants.attributes.value",
            },
            count: { $sum: 1 },
          },
        },
      ]);

      const specAttrs = await Product.aggregate([
        { $match: matchStage },
        { $unwind: "$specifications" },
        {
          $group: {
            _id: {
              key: "$specifications.key",
              name: "$specifications.name",
              value: "$specifications.value",
            },
            count: { $sum: 1 },
          },
        },
      ]);

      // Combine attributes map
      const attributeMap = {};

      // Seed attributes from category definitions if available
      if (matchedCategory?.attributes?.length > 0) {
        matchedCategory.attributes.forEach((attr) => {
          attributeMap[attr.key] = {
            key: attr.key,
            name: attr.name,
            type: attr.type || "SELECT",
            options: (attr.options || []).map((opt) => ({
              value: opt,
              count: 0,
            })),
          };
        });
      }

      const mergeAttr = (item) => {
        const key = item._id.key?.toLowerCase();
        const name = item._id.name || key;
        const val = String(item._id.value).trim();
        if (!key || !val || val === "undefined" || val === "null") return;

        if (!attributeMap[key]) {
          attributeMap[key] = {
            key,
            name,
            type: "SELECT",
            options: [],
          };
        }

        const existingOpt = attributeMap[key].options.find(
          (o) => o.value.toLowerCase() === val.toLowerCase()
        );
        if (existingOpt) {
          existingOpt.count += item.count;
        } else {
          attributeMap[key].options.push({
            value: val,
            count: item.count,
          });
        }
      };

      variantAttrs.forEach(mergeAttr);
      specAttrs.forEach(mergeAttr);

      // Sort options by count descending
      const dynamicAttributes = Object.values(attributeMap)
        .filter((attr) => attr.options.length > 0)
        .map((attr) => ({
          ...attr,
          options: attr.options.sort((a, b) => b.count - a.count),
        }));

      // 4. Standard Discount Buckets
      const discountBuckets = [
        { label: "10% or more", value: "10" },
        { label: "20% or more", value: "20" },
        { label: "30% or more", value: "30" },
        { label: "40% or more", value: "40" },
        { label: "50% or more", value: "50" },
      ];

      return {
        category: matchedCategory
          ? {
              _id: matchedCategory._id,
              name: matchedCategory.name,
              categoryId: matchedCategory.categoryId,
              level: matchedCategory.level,
              description: matchedCategory.description,
            }
          : null,
        breadcrumbs,
        totalCount,
        inStockCount,
        minPrice,
        maxPrice,
        brands,
        dynamicAttributes,
        discountBuckets,
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }
}

export default new ProductService();

