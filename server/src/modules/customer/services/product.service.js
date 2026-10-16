import mongoose from "mongoose";
import { Category } from "../../../models/category.model.js";
import { Product, sanitizeProductSlug, resolveMediaHierarchy } from "../../../models/product.model.js";
import { Review } from "../../../models/review.model.js";
import { Seller } from "../../../models/seller.model.js";
import { PriceHistory } from "../../../models/priceHistory.model.js";
import { SavedItem } from "../../../models/savedItem.model.js";
import { Collection } from "../../../models/collection.model.js";
import { ProductQuestion } from "../../../models/productQuestion.model.js";
import { Order } from "../../../models/order.model.js";
import { calculateDiscountPercentage } from "../../../utils/calculateDiscountPercentage.js";
import {
  emitProductCreated,
  emitProductUpdated,
  emitStockUpdated,
} from "../../../realtime/socket.js";
import wishlistWatcherService from "./wishlistWatcher.service.js";

const canQueryModel = (model, method) => {
  if (!model || typeof model[method] !== "function") return false;
  if (mongoose.connection && mongoose.connection.readyState === 1) return true;
  return model[method] !== mongoose.Model[method];
};


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
        const seenSignatures = new Set();
        variants = data.variants.map((v, index) => {
          const vMrp = Number(v.mrpPrice) || mrpPrice;
          const vSelling = Number(v.sellingPrice) || sellingPrice;
          const vStock = Number(v.countInStock) || 0;
          const vDiscount = calculateDiscountPercentage(vMrp, vSelling);
          const vSku =
            v.sku && v.sku.trim()
              ? v.sku.trim().toUpperCase()
              : `${(data.title || "PROD").slice(0, 4).toUpperCase()}-${Date.now().toString(36)}-${index + 1}`.toUpperCase();

          const normalizedAttrs = Array.isArray(v.attributes)
            ? v.attributes.map((a) => ({
                name: a.name || a.key || "Attribute",
                key: (a.key || (a.name ? a.name.toLowerCase().replace(/[^a-z0-9]/g, "_") : "attr")).toLowerCase().trim(),
                value: String(a.value || "").trim(),
                unit: a.unit || "",
              }))
            : [];

          // Duplicate variant configuration prevention
          const signature = normalizedAttrs
            .map((a) => `${a.key}:${a.value.toLowerCase()}`)
            .sort()
            .join("|");

          if (signature) {
            if (seenSignatures.has(signature)) {
              throw new Error(`Duplicate variant configuration detected: ${signature.replace(/\|/g, ", ")}`);
            }
            seenSignatures.add(signature);
          }

          return {
            sku: vSku,
            title: v.title || "",
            attributes: normalizedAttrs,
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

      // Process Option-Level Media Groups
      const mediaGroups = Array.isArray(data.mediaGroups)
        ? data.mediaGroups.map((mg) => ({
            groupId: mg.groupId || new mongoose.Types.ObjectId().toString(),
            optionKey: (mg.optionKey || "color").toLowerCase().trim(),
            optionValue: (mg.optionValue || "").trim(),
            name: mg.name || `${mg.optionValue} Media Group`,
            images: Array.isArray(mg.images) ? mg.images : [],
          }))
        : [];

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
        mediaGroups,
        specifications: Array.isArray(data.specifications)
          ? data.specifications
          : [],
        warranty: data.warranty || null,
        returnPolicy: data.returnPolicy || null,
        shippingDetails: data.shippingDetails || null,
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

      let session = null;
      let isTransactionActive = false;
      try {
        if (typeof mongoose.startSession === "function" && mongoose.connection?.readyState === 1) {
          session = await mongoose.startSession();
          if (session && typeof session.startTransaction === "function") {
            try {
              session.startTransaction();
              isTransactionActive = true;
            } catch {
              isTransactionActive = false;
            }
          }
        }
      } catch {
        session = null;
        isTransactionActive = false;
      }

      let savedProduct = null;
      const createdHistoryIds = [];

      try {
        savedProduct = await product.save(isTransactionActive ? { session } : {});

        // Persist authentic initial price history event
        const basePayload = {
          product: savedProduct._id,
          variantId: null,
          variantSku: null,
          sellingPrice: savedProduct.sellingPrice,
          mrpPrice: savedProduct.mrpPrice,
          discountPercent: savedProduct.discountPercent,
          source: "INITIAL_SNAPSHOT",
          timestamp: new Date(),
        };
        const baseSnapshot = isTransactionActive
          ? (await PriceHistory.create([basePayload], { session }))[0]
          : await PriceHistory.create(basePayload);
        if (baseSnapshot && baseSnapshot._id) createdHistoryIds.push(baseSnapshot._id);

        if (savedProduct.hasVariants && Array.isArray(savedProduct.variants)) {
          for (const v of savedProduct.variants) {
            const varPayload = {
              product: savedProduct._id,
              variantId: v._id || null,
              variantSku: v.sku || null,
              sellingPrice: v.sellingPrice,
              mrpPrice: v.mrpPrice,
              discountPercent: v.discountPercent,
              source: "INITIAL_SNAPSHOT",
              timestamp: new Date(),
            };
            const varSnapshot = isTransactionActive
              ? (await PriceHistory.create([varPayload], { session }))[0]
              : await PriceHistory.create(varPayload);
            if (varSnapshot && varSnapshot._id) createdHistoryIds.push(varSnapshot._id);
          }
        }

        if (isTransactionActive) {
          await session.commitTransaction();
        }
      } catch (mutationErr) {
        if (isTransactionActive) {
          try {
            await session.abortTransaction();
          } catch {}
          throw mutationErr;
        }

        let cleanupProductErr = null;
        let cleanupHistoryErr = null;

        if (savedProduct && savedProduct._id) {
          try {
            await Product.findByIdAndDelete(savedProduct._id);
          } catch (pDelErr) {
            cleanupProductErr = pDelErr;
            console.error("[ProductService] Failed to clean up orphaned product after snapshot failure:", pDelErr.message);
          }
        }
        if (createdHistoryIds.length > 0) {
          try {
            await PriceHistory.deleteMany({ _id: { $in: createdHistoryIds } });
          } catch (hDelErr) {
            cleanupHistoryErr = hDelErr;
            console.error("[ProductService] Failed to clean up orphaned price snapshots after snapshot failure:", hDelErr.message);
          }
        }

        if (cleanupProductErr || cleanupHistoryErr) {
          const details = [
            cleanupProductErr ? `product deletion failed: ${cleanupProductErr.message}` : null,
            cleanupHistoryErr ? `snapshot deletion failed: ${cleanupHistoryErr.message}` : null,
          ].filter(Boolean).join("; ");
          throw new Error(
            `Failed to create product with initial price snapshot (${mutationErr.message}) and compensation cleanup failed: ${details}`
          );
        }
        throw new Error(`Failed to create product with initial price snapshot: ${mutationErr.message}`);
      } finally {
        if (session) {
          try {
            await session.endSession();
          } catch {}
        }
      }

      emitProductCreated(savedProduct);
      return savedProduct;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async updateProduct(productId, data, sellerId = null) {
    let session = null;
    let isTransactionActive = false;
    try {
      if (typeof mongoose.startSession === "function" && mongoose.connection?.readyState === 1) {
        session = await mongoose.startSession();
        if (session && typeof session.startTransaction === "function") {
          try {
            session.startTransaction();
            isTransactionActive = true;
          } catch {
            isTransactionActive = false;
          }
        }
      }
    } catch {
      session = null;
      isTransactionActive = false;
    }

    try {
      const product = await Product.findById(
        productId,
        null,
        isTransactionActive ? { session } : {}
      );
      if (!product) throw new Error("Product not found");

      if (sellerId && product.seller.toString() !== sellerId.toString()) {
        throw new Error("Unauthorized to update this product");
      }

      // Snapshot complete product state before applying changes
      const oldProductData = {
        title: product.title,
        slug: product.slug,
        sku: product.sku,
        description: product.description,
        highlights: Array.isArray(product.highlights) ? [...product.highlights] : [],
        brand: product.brand,
        category: product.category,
        status: product.status,
        images: Array.isArray(product.images) ? [...product.images] : [],
        tags: Array.isArray(product.tags) ? [...product.tags] : [],
        specifications: Array.isArray(product.specifications) ? JSON.parse(JSON.stringify(product.specifications)) : [],
        warranty: product.warranty ? JSON.parse(JSON.stringify(product.warranty)) : null,
        returnPolicy: product.returnPolicy ? JSON.parse(JSON.stringify(product.returnPolicy)) : null,
        shippingDetails: product.shippingDetails ? JSON.parse(JSON.stringify(product.shippingDetails)) : null,
        measurement: product.measurement ? JSON.parse(JSON.stringify(product.measurement)) : null,
        attributeDefinitions: Array.isArray(product.attributeDefinitions) ? JSON.parse(JSON.stringify(product.attributeDefinitions)) : [],
        mediaGroups: Array.isArray(product.mediaGroups) ? JSON.parse(JSON.stringify(product.mediaGroups)) : [],
        hasVariants: product.hasVariants,
        variants: Array.isArray(product.variants) ? JSON.parse(JSON.stringify(product.variants)) : [],
        sellingPrice: product.sellingPrice,
        mrpPrice: product.mrpPrice,
        discountPercent: product.discountPercent,
        countInStock: product.countInStock,
        inStock: product.inStock,
        lowStockThreshold: product.lowStockThreshold,
      };
      const oldVariants = (product.variants || []).map((v) => ({
        _id: v._id ? v._id.toString() : null,
        sku: v.sku,
        sellingPrice: v.sellingPrice,
        mrpPrice: v.mrpPrice,
      }));

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
      if (data.warranty !== undefined) product.warranty = data.warranty;
      if (data.returnPolicy !== undefined) product.returnPolicy = data.returnPolicy;
      if (data.shippingDetails !== undefined) product.shippingDetails = data.shippingDetails;
      if (data.measurement !== undefined) product.measurement = data.measurement;
      if (data.attributeDefinitions !== undefined) product.attributeDefinitions = data.attributeDefinitions;

      if (Array.isArray(data.mediaGroups)) {
        product.mediaGroups = data.mediaGroups.map((mg) => ({
          groupId: mg.groupId || new mongoose.Types.ObjectId().toString(),
          optionKey: (mg.optionKey || "color").toLowerCase().trim(),
          optionValue: (mg.optionValue || "").trim(),
          name: mg.name || `${mg.optionValue} Media Group`,
          images: Array.isArray(mg.images) ? mg.images : [],
        }));
      }

      if (data.hasVariants !== undefined) product.hasVariants = data.hasVariants;

      if (product.hasVariants && Array.isArray(data.variants)) {
        const seenSignatures = new Set();
        product.variants = data.variants.map((v, index) => {
          const vMrp = Number(v.mrpPrice) || product.mrpPrice;
          const vSelling = Number(v.sellingPrice) || product.sellingPrice;
          const vStock = Number(v.countInStock) || 0;
          const vSku = v.sku && v.sku.trim()
            ? v.sku.trim().toUpperCase()
            : `${product.title.slice(0, 4).toUpperCase()}-${index + 1}`.toUpperCase();

          const normalizedAttrs = Array.isArray(v.attributes)
            ? v.attributes.map((a) => ({
                name: a.name || a.key || "Attribute",
                key: (a.key || (a.name ? a.name.toLowerCase().replace(/[^a-z0-9]/g, "_") : "attr")).toLowerCase().trim(),
                value: String(a.value || "").trim(),
                unit: a.unit || "",
              }))
            : [];

          const signature = normalizedAttrs
            .map((a) => `${a.key}:${a.value.toLowerCase()}`)
            .sort()
            .join("|");

          if (signature) {
            if (seenSignatures.has(signature)) {
              throw new Error(`Duplicate variant configuration detected: ${signature.replace(/\|/g, ", ")}`);
            }
            seenSignatures.add(signature);
          }

          return {
            ...v,
            sku: vSku,
            attributes: normalizedAttrs,
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
      const saved = await product.save(isTransactionActive ? { session } : {});

      // Record authentic PriceHistory change event if selling price or MRP changed
      const createdHistoryIds = [];
      try {
        const snapPayloads = [];
        if (
          oldProductData.sellingPrice !== saved.sellingPrice ||
          oldProductData.mrpPrice !== saved.mrpPrice
        ) {
          snapPayloads.push({
            product: saved._id,
            variantId: null,
            variantSku: null,
            sellingPrice: saved.sellingPrice,
            mrpPrice: saved.mrpPrice,
            discountPercent: saved.discountPercent,
            source: sellerId ? "SELLER_UPDATE" : "ADMIN_OVERRIDE",
            timestamp: new Date(),
          });
        }

        if (saved.hasVariants && Array.isArray(saved.variants)) {
          for (const v of saved.variants) {
            const oldV = oldVariants.find(
              (ov) => (ov._id && v._id && ov._id === v._id.toString()) || (ov.sku && ov.sku === v.sku)
            );
            if (!oldV || oldV.sellingPrice !== v.sellingPrice || oldV.mrpPrice !== v.mrpPrice) {
              snapPayloads.push({
                product: saved._id,
                variantId: v._id || null,
                variantSku: v.sku || null,
                sellingPrice: v.sellingPrice,
                mrpPrice: v.mrpPrice,
                discountPercent: v.discountPercent,
                source: sellerId ? "SELLER_UPDATE" : "ADMIN_OVERRIDE",
                timestamp: new Date(),
              });
            }
          }
        }

        for (const sp of snapPayloads) {
          const snap = isTransactionActive
            ? (await PriceHistory.create([sp], { session }))[0]
            : await PriceHistory.create(sp);
          if (snap && snap._id) createdHistoryIds.push(snap._id);
        }

        if (isTransactionActive) {
          await session.commitTransaction();
        }
      } catch (histErr) {
        if (isTransactionActive) {
          try {
            await session.abortTransaction();
          } catch {}
          throw histErr;
        }
        // Rollback product mutation to restore consistency completely
        // Prevent stale rollback from overwriting concurrent legitimate product updates via atomic conditional write
        const rollbackPayload = {
          title: oldProductData.title,
          slug: oldProductData.slug,
          sku: oldProductData.sku,
          description: oldProductData.description,
          highlights: oldProductData.highlights,
          brand: oldProductData.brand,
          category: oldProductData.category,
          status: oldProductData.status,
          images: oldProductData.images,
          tags: oldProductData.tags,
          specifications: oldProductData.specifications,
          warranty: oldProductData.warranty,
          returnPolicy: oldProductData.returnPolicy,
          shippingDetails: oldProductData.shippingDetails,
          measurement: oldProductData.measurement,
          attributeDefinitions: oldProductData.attributeDefinitions,
          mediaGroups: oldProductData.mediaGroups,
          hasVariants: oldProductData.hasVariants,
          variants: oldProductData.variants,
          sellingPrice: oldProductData.sellingPrice,
          mrpPrice: oldProductData.mrpPrice,
          discountPercent: oldProductData.discountPercent,
          countInStock: oldProductData.countInStock,
          inStock: oldProductData.inStock,
          lowStockThreshold: oldProductData.lowStockThreshold,
        };

        const expectedVersion = saved.__v;
        if (canQueryModel(Product, "findOneAndUpdate") && product._id) {
          try {
            const rollbackDoc = await Product.findOneAndUpdate(
              { _id: product._id, __v: expectedVersion },
              { $set: rollbackPayload, $inc: { __v: 1 } },
              { new: true }
            );

            if (!rollbackDoc) {
              // Version mismatch: Another concurrent update committed to this product!
              console.warn(
                `[ProductService] Stale rollback prevented for product ${product._id}: current DB version moved beyond expected version (${expectedVersion}).`
              );
            }
          } catch (rollbackSaveErr) {
            throw new Error(
              `Price history audit record failed (${histErr.message}) and product rollback failed: ${rollbackSaveErr.message}`
            );
          }
        } else {
          // Fallback when findOneAndUpdate is not queryable (e.g. basic mocks)
          let concurrentOverwritePrevented = false;
          try {
            if (canQueryModel(Product, "findById") && product._id) {
              const currentDbProduct = await Product.findById(product._id);
              if (
                currentDbProduct &&
                currentDbProduct.__v !== undefined &&
                product.__v !== undefined &&
                currentDbProduct.__v > product.__v
              ) {
                concurrentOverwritePrevented = true;
                console.warn(
                  `[ProductService] Stale rollback prevented for product ${product._id}: current DB version (${currentDbProduct.__v}) is newer than rollback baseline (${product.__v}).`
                );
              }
            }
          } catch {}

          if (!concurrentOverwritePrevented) {
            Object.assign(product, rollbackPayload);
            try {
              await product.save();
            } catch (rollbackSaveErr) {
              throw new Error(
                `Price history audit record failed (${histErr.message}) and product rollback failed: ${rollbackSaveErr.message}`
              );
            }
          }
        }

        let historyCleanupErr = null;
        if (createdHistoryIds.length > 0) {
          try {
            await PriceHistory.deleteMany({ _id: { $in: createdHistoryIds } });
          } catch (delErr) {
            historyCleanupErr = delErr;
            console.error("[ProductService] Inconsistent history snapshot cleanup failed:", delErr.message);
          }
        }

        if (historyCleanupErr) {
          throw new Error(
            `Price history audit record failed (${histErr.message}) and snapshot cleanup failed (${historyCleanupErr.message}). Inconsistent state requires administrative attention.`
          );
        }
        throw new Error(`Price history audit record failed: ${histErr.message}`);
      }

      // DO NOT emit realtime events before price mutation and required audit snapshots have committed!
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
    } finally {
      if (session) {
        try {
          await session.endSession();
        } catch {}
      }
    }
  }

  /**
   * Dedicated Authoritative Variant Resolution Engine
   * Resolves exact SKU, pricing, inventory, media hierarchy, matrix, and seller offer.
   */
  async resolveProductVariant(identifier, query = {}) {
    try {
      const isObjectId = mongoose.isValidObjectId(identifier);
      const dbQuery = isObjectId ? { _id: identifier } : { slug: identifier };

      let product = await Product.findOne(dbQuery)
        .populate("category")
        .populate("seller", "sellerName email businessDetails mobile");

      if (!product && !isObjectId) {
        product = await Product.findOne({ title: new RegExp(`^${identifier}$`, "i") })
          .populate("category")
          .populate("seller", "sellerName email businessDetails mobile");
      }

      if (!product) throw new Error("Product not found");

      // Single-SKU product resolution
      if (!product.hasVariants || !Array.isArray(product.variants) || product.variants.length === 0) {
        const inStock = (product.countInStock || 0) > 0 && product.status === "PUBLISHED";
        const gallery = resolveMediaHierarchy(product, null, {});

        return {
          product: {
            _id: product._id,
            title: product.title,
            slug: product.slug,
            sku: product.sku,
            brand: product.brand,
            category: product.category,
            hasVariants: false,
            warranty: product.warranty,
            returnPolicy: product.returnPolicy,
            shippingDetails: product.shippingDetails,
            specifications: product.specifications,
          },
          variant: null,
          sellerOffer: {
            sellerId: product.seller?._id || product.seller,
            sellerName: product.seller?.sellerName || "Zosh Partner",
            businessDetails: product.seller?.businessDetails || null,
          },
          pricing: {
            mrpPrice: product.mrpPrice,
            sellingPrice: product.sellingPrice,
            discountPercent: product.discountPercent,
            savings: Math.max(0, product.mrpPrice - product.sellingPrice),
            displayPrice: `₹${product.sellingPrice.toLocaleString("en-IN")}`,
            minPrice: product.sellingPrice,
            maxPrice: product.sellingPrice,
            isRange: false,
          },
          inventory: {
            countInStock: product.countInStock,
            inStock,
            status: !inStock
              ? "OUT_OF_STOCK"
              : product.countInStock <= (product.lowStockThreshold || 5)
              ? "LOW_STOCK"
              : "IN_STOCK",
            lowStockThreshold: product.lowStockThreshold || 5,
          },
          media: {
            heroImage: gallery[0] || "",
            gallery,
            totalImages: gallery.length,
            matchedOptionGroup: false,
          },
          combinationMatrix: {
            attributeKeys: [],
            validCombinations: [],
            availableOptionsByAttribute: {},
          },
          delivery: {
            estimatedDays: product.shippingDetails?.estimatedDeliveryDays || 3,
            freeShipping: Boolean(product.shippingDetails?.freeShipping),
          },
          promotions: {
            availableOffers: [],
          },
        };
      }

      // Multi-Variant Resolution:
      // 1. Build authoritative combination matrix of all valid configurations
      const validCombinations = [];
      const availableOptionsByAttribute = {};

      product.variants.forEach((v) => {
        if (v.status !== "INACTIVE") {
          const attrRecord = {};
          (v.attributes || []).forEach((a) => {
            if (a && a.key && a.value) {
              const cleanKey = a.key.toLowerCase().trim();
              const cleanVal = String(a.value).trim();
              attrRecord[cleanKey] = cleanVal;
              if (!availableOptionsByAttribute[cleanKey]) {
                availableOptionsByAttribute[cleanKey] = new Set();
              }
              availableOptionsByAttribute[cleanKey].add(cleanVal);
            }
          });

          validCombinations.push({
            variantId: v._id,
            sku: v.sku,
            title: v.title,
            attributes: attrRecord,
            mrpPrice: v.mrpPrice,
            sellingPrice: v.sellingPrice,
            discountPercent: v.discountPercent,
            countInStock: v.countInStock,
            inStock: v.countInStock > 0 && v.status === "ACTIVE",
            status: v.status,
            images: v.images || [],
          });
        }
      });

      const formattedOptionsByAttr = {};
      Object.entries(availableOptionsByAttribute).forEach(([k, set]) => {
        formattedOptionsByAttr[k] = Array.from(set);
      });

      // 2. Extract requested parameters
      const requestedVariantId = query.variantId || "";
      const requestedSku = query.sku ? query.sku.trim().toUpperCase() : "";

      const requestedAttrs = {};
      const reservedQueryKeys = ["variantId", "sku", "adminView", "fields"];
      Object.entries(query).forEach(([k, v]) => {
        if (!reservedQueryKeys.includes(k) && v) {
          requestedAttrs[k.toLowerCase().trim()] = String(v).trim();
        }
      });

      // 3. Find matching variant
      let matchedVariant = null;

      if (requestedVariantId) {
        matchedVariant = product.variants.id(requestedVariantId);
      }

      if (!matchedVariant && requestedSku) {
        matchedVariant = product.variants.find((v) => (v.sku || "").toUpperCase() === requestedSku);
      }

      if (!matchedVariant && Object.keys(requestedAttrs).length > 0) {
        matchedVariant = product.variants.find((v) => {
          if (v.status === "INACTIVE" || !Array.isArray(v.attributes)) return false;
          return Object.entries(requestedAttrs).every(([reqKey, reqVal]) => {
            const attr = v.attributes.find((a) => (a.key || "").toLowerCase() === reqKey);
            return attr && String(attr.value).trim().toLowerCase() === reqVal.toLowerCase();
          });
        });

        // Cascading Fallback: If exact combo not found (e.g. Blue XL nonexistent),
        // try to match primary attribute (like color) first, then pick first active combination
        if (!matchedVariant && requestedAttrs.color) {
          matchedVariant = product.variants.find((v) => {
            if (v.status === "INACTIVE") return false;
            const attr = (v.attributes || []).find((a) => (a.key || "").toLowerCase() === "color");
            return attr && String(attr.value).trim().toLowerCase() === requestedAttrs.color.toLowerCase();
          });
        }
      }

      if (!matchedVariant) {
        matchedVariant = product.variants.find((v) => v.status === "ACTIVE") || product.variants[0];
      }

      // 4. Resolve authoritative pricing & price range
      const activeVariants = product.variants.filter((v) => v.status === "ACTIVE");
      const listToUse = activeVariants.length > 0 ? activeVariants : product.variants;
      const prices = listToUse.map((v) => v.sellingPrice);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);

      const effectiveMrp = matchedVariant ? matchedVariant.mrpPrice : product.mrpPrice;
      const effectiveSelling = matchedVariant ? matchedVariant.sellingPrice : product.sellingPrice;
      const effectiveDiscount = calculateDiscountPercentage(effectiveMrp, effectiveSelling);
      const effectiveSavings = Math.max(0, effectiveMrp - effectiveSelling);
      const effectiveStock = matchedVariant ? matchedVariant.countInStock : product.countInStock;
      const isOutOfStock = effectiveStock <= 0 || matchedVariant?.status === "INACTIVE";

      // 5. Authoritative Media Resolution
      const gallery = resolveMediaHierarchy(product, matchedVariant, requestedAttrs);

      return {
        product: {
          _id: product._id,
          title: product.title,
          slug: product.slug,
          sku: product.sku,
          brand: product.brand,
          category: product.category,
          hasVariants: true,
          attributeDefinitions: product.attributeDefinitions,
          mediaGroups: product.mediaGroups,
          warranty: product.warranty,
          returnPolicy: product.returnPolicy,
          shippingDetails: product.shippingDetails,
          specifications: product.specifications,
        },
        variant: matchedVariant
          ? {
              _id: matchedVariant._id,
              sku: matchedVariant.sku,
              title: matchedVariant.title,
              attributes: matchedVariant.attributes,
              mrpPrice: matchedVariant.mrpPrice,
              sellingPrice: matchedVariant.sellingPrice,
              discountPercent: matchedVariant.discountPercent,
              countInStock: matchedVariant.countInStock,
              status: matchedVariant.status,
              images: matchedVariant.images || [],
            }
          : null,
        sellerOffer: {
          sellerId: product.seller?._id || product.seller,
          sellerName: product.seller?.sellerName || "Zosh Partner",
          businessDetails: product.seller?.businessDetails || null,
        },
        pricing: {
          mrpPrice: effectiveMrp,
          sellingPrice: effectiveSelling,
          discountPercent: effectiveDiscount,
          savings: effectiveSavings,
          displayPrice: `₹${effectiveSelling.toLocaleString("en-IN")}`,
          minPrice,
          maxPrice,
          isRange: minPrice !== maxPrice,
          rangeDisplay:
            minPrice === maxPrice
              ? `₹${minPrice.toLocaleString("en-IN")}`
              : `₹${minPrice.toLocaleString("en-IN")} – ₹${maxPrice.toLocaleString("en-IN")}`,
        },
        inventory: {
          countInStock: effectiveStock,
          inStock: !isOutOfStock,
          status: isOutOfStock
            ? "OUT_OF_STOCK"
            : effectiveStock <= (product.lowStockThreshold || 5)
            ? "LOW_STOCK"
            : "IN_STOCK",
          lowStockThreshold: product.lowStockThreshold || 5,
        },
        media: {
          heroImage: gallery[0] || "",
          gallery,
          totalImages: gallery.length,
          matchedOptionGroup: Boolean(product.mediaGroups?.length),
        },
        combinationMatrix: {
          attributeKeys: Object.keys(formattedOptionsByAttr),
          validCombinations,
          availableOptionsByAttribute: formattedOptionsByAttr,
        },
        delivery: {
          estimatedDays: product.shippingDetails?.estimatedDeliveryDays || 3,
          freeShipping: Boolean(product.shippingDetails?.freeShipping),
        },
        promotions: {
          availableOffers: [],
        },
      };
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
        .populate("seller", "sellerName email businessDetails mobile accountStatus isEmailVerified createdAt");

      if (!product && !isObjectId) {
        // Fallback search by title
        product = await Product.findOne({ title: new RegExp(`^${identifier}$`, "i") })
          .populate("category")
          .populate("seller", "sellerName email businessDetails mobile accountStatus isEmailVerified createdAt");
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
      if ((req.minPrice !== undefined && req.minPrice !== "") || (req.maxPrice !== undefined && req.maxPrice !== "")) {
        filterQuery.sellingPrice = {};
        if (req.minPrice !== undefined && req.minPrice !== "") filterQuery.sellingPrice.$gte = Number(req.minPrice);
        if (req.maxPrice !== undefined && req.maxPrice !== "") filterQuery.sellingPrice.$lte = Number(req.maxPrice);
      }

      // Discount filter
      if (req.minDiscount) {
        filterQuery.discountPercent = { $gte: Number(req.minDiscount) };
      }

      // In-stock only
      if (req.inStock === "true" || req.inStock === true) {
        filterQuery.countInStock = { $gt: 0 };
      }

      // Customer Rating filter (e.g. 4★ & above)
      if (req.rating || req.minRating) {
        const ratingVal = Number(req.rating || req.minRating);
        if (!isNaN(ratingVal) && ratingVal > 0) {
          filterQuery["ratings.average"] = { $gte: ratingVal };
        }
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
        "rating",
        "minRating",
        "search",
        "q",
        "query",
        "sort",
        "pageNumber",
        "pageSize",
        "status",
        "adminView",
        "synonyms",
        "exact",
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
      const searchQuery = req.search || req.q || req.query;
      if (searchQuery) {
        const cleanQuery = String(searchQuery).trim();
        const tokens = cleanQuery
          .split(/\s+/)
          .filter((t) => t.length > 1)
          .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

        const orConditions = [
          { title: new RegExp(cleanQuery, "i") },
          { brand: new RegExp(cleanQuery, "i") },
          { description: new RegExp(cleanQuery, "i") },
          { tags: new RegExp(cleanQuery, "i") },
        ];

        // Match individual tokens if multiple words
        if (tokens.length > 1) {
          for (const token of tokens) {
            const tokenRegex = new RegExp(token, "i");
            orConditions.push(
              { title: tokenRegex },
              { brand: tokenRegex },
              { tags: tokenRegex }
            );
          }
        }

        // Match synonyms if provided by Search Intelligence
        if (Array.isArray(req.synonyms) && req.synonyms.length > 0) {
          for (const syn of req.synonyms) {
            const cleanSyn = String(syn).trim();
            if (cleanSyn && cleanSyn.toLowerCase() !== cleanQuery.toLowerCase()) {
              const synRegex = new RegExp(cleanSyn, "i");
              orConditions.push(
                { title: synRegex },
                { brand: synRegex },
                { description: synRegex },
                { tags: synRegex }
              );
            }
          }
        }

        filterQuery.$or = orConditions;
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

  /**
   * Retrieves genuine competing offers from other marketplace sellers for the same canonical product.
   * Matches by canonicalId, barcode, or matching brand and normalized title.
   * Never fabricates synthetic offers or mixes visually unrelated items.
   */
  async getOtherSellerOffers(productId, options = {}) {
    try {
      const isObjectId = mongoose.isValidObjectId(productId);
      const query = isObjectId ? { _id: productId } : { slug: productId };
      const currentProduct = await Product.findOne(query).populate("seller");

      if (!currentProduct) {
        throw new Error("Product not found");
      }

      const currentSellerId = (currentProduct.seller?._id || currentProduct.seller)?.toString();

      // Authoritative canonical matching criteria:
      // Must have canonicalId, canonicalSku, or barcode.
      // If none of those exist, require BOTH non-empty brand AND exact full title match (case-insensitive).
      // Loose title-prefix matching is strictly eliminated.
      const canonicalMatchCriteria = [];

      if (currentProduct.canonicalId && currentProduct.canonicalId.trim()) {
        canonicalMatchCriteria.push({ canonicalId: currentProduct.canonicalId.trim() });
      }

      if (currentProduct.canonicalSku && currentProduct.canonicalSku.trim()) {
        canonicalMatchCriteria.push({ canonicalSku: currentProduct.canonicalSku.trim().toUpperCase() });
      }

      if (currentProduct.barcode && currentProduct.barcode.trim()) {
        canonicalMatchCriteria.push({ barcode: currentProduct.barcode.trim() });
      }

      // If no barcode/canonical identifiers, require exact case-insensitive brand AND exact title match
      if (canonicalMatchCriteria.length === 0 && currentProduct.brand && currentProduct.title) {
        const cleanBrand = currentProduct.brand.trim();
        const cleanTitle = currentProduct.title.trim();
        if (cleanBrand.length >= 2 && cleanTitle.length >= 5) {
          canonicalMatchCriteria.push({
            brand: new RegExp(`^${cleanBrand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
            title: new RegExp(`^${cleanTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
          });
        }
      }

      // If canonical identity is ambiguous, withhold competing offers completely
      if (canonicalMatchCriteria.length === 0) {
        return {
          currentProductId: currentProduct._id,
          currentSellerId,
          totalOtherOffers: 0,
          offers: [],
        };
      }

      const matchQuery = {
        _id: { $ne: currentProduct._id },
        seller: { $ne: currentSellerId },
        status: "PUBLISHED",
        countInStock: { $gt: 0 },
        inStock: true,
        $or: canonicalMatchCriteria,
      };

      const competingProducts = await Product.find(matchQuery)
        .populate("seller", "sellerName email businessDetails pickupAddress accountStatus isEmailVerified")
        .sort({ sellingPrice: 1 })
        .limit(10);

      // Pre-aggregate review ratings for all competing sellers in a single batch query (O(1) instead of N+1)
      const sellerRatingMap = new Map();
      if (competingProducts.length > 0) {
        try {
          const sellerIds = [
            ...new Set(
              competingProducts
                .map((p) => p.seller?._id?.toString())
                .filter(Boolean)
            ),
          ];
          if (sellerIds.length > 0) {
            const sellerProds = await Product.find(
              { seller: { $in: sellerIds } },
              "_id seller"
            );
            const prodIds = sellerProds.map((p) => p._id);
            const prodToSeller = new Map(
              sellerProds.map((p) => [p._id.toString(), p.seller.toString()])
            );

            const reviewStats = await Review.aggregate([
              { $match: { product: { $in: prodIds } } },
              {
                $group: {
                  _id: "$product",
                  avgRating: { $avg: "$rating" },
                  ratingSum: { $sum: "$rating" },
                  count: { $sum: 1 },
                },
              },
            ]);

            for (const r of reviewStats) {
              const count = r.count || r.totalCount || 0;
              const ratingSum =
                r.ratingSum !== undefined
                  ? r.ratingSum
                  : r.avgRating
                  ? r.avgRating * count
                  : 0;
              const sId = r._id
                ? prodToSeller.get(r._id.toString())
                : sellerIds.length === 1
                ? sellerIds[0]
                : null;
              if (sId) {
                const cur = sellerRatingMap.get(sId) || { ratingSum: 0, count: 0 };
                cur.ratingSum += ratingSum;
                cur.count += count;
                sellerRatingMap.set(sId, cur);
              }
            }
          }
        } catch {
          // If review aggregation fails, seller ratings default gracefully to null
        }
      }

      // Resolve selected variant from options if specified
      let selectedVariant = null;
      if (options?.variantId && Array.isArray(currentProduct.variants)) {
        selectedVariant = currentProduct.variants.find(
          (v) => (v._id && v._id.toString() === options.variantId.toString()) || v.sku === options.variantId
        );
      } else if (options?.variantSku && Array.isArray(currentProduct.variants)) {
        selectedVariant = currentProduct.variants.find((v) => v.sku === options.variantSku);
      }

      const getAttr = (prod, varDoc, keyName) => {
        const normKey = keyName.toLowerCase().replace(/[-_ ]/g, "");
        if (varDoc && Array.isArray(varDoc.attributes)) {
          const found = varDoc.attributes.find(
            (a) => (a.key || a.name || "").toLowerCase().replace(/[-_ ]/g, "") === normKey
          );
          if (found && found.value != null && String(found.value).trim() !== "") {
            return String(found.value).trim();
          }
        }
        if (prod && prod[keyName] != null && String(prod[keyName]).trim() !== "") {
          return String(prod[keyName]).trim();
        }
        if (prod && Array.isArray(prod.attributes)) {
          const found = prod.attributes.find(
            (a) => (a.key || a.name || "").toLowerCase().replace(/[-_ ]/g, "") === normKey
          );
          if (found && found.value != null && String(found.value).trim() !== "") {
            return String(found.value).trim();
          }
        }
        if (prod && Array.isArray(prod.specifications)) {
          const found = prod.specifications.find(
            (s) => (s.key || s.name || "").toLowerCase().replace(/[-_ ]/g, "") === normKey
          );
          if (found && found.value != null && String(found.value).trim() !== "") {
            return String(found.value).trim();
          }
        }
        return null;
      };

      const targetColor = options?.color || getAttr(currentProduct, selectedVariant, "color");
      const targetSize = options?.size || getAttr(currentProduct, selectedVariant, "size");
      const targetRam = options?.ram || getAttr(currentProduct, selectedVariant, "ram");
      const targetCapacity = options?.capacity || getAttr(currentProduct, selectedVariant, "capacity") || getAttr(currentProduct, selectedVariant, "storage");
      const targetModel = options?.model || getAttr(currentProduct, selectedVariant, "model");
      const targetGeneration = options?.generation || getAttr(currentProduct, selectedVariant, "generation");
      const targetPackQuantity = options?.packQuantity || getAttr(currentProduct, selectedVariant, "packQuantity") || getAttr(currentProduct, selectedVariant, "pack_quantity");

      const offers = [];
      for (const prod of competingProducts) {
        const sellerDoc = prod.seller;
        // Strictly reject inactive, unverified or unpopulated sellers
        if (!sellerDoc || sellerDoc.accountStatus !== "ACTIVE") continue;

        // Ensure variant/model attribute compatibility
        // If the selected product variant has a known color, size, RAM, capacity/storage, model, generation or pack quantity,
        // do not accept an offer with missing or unverifiable corresponding variant data as a confirmed match.
        let offerSellingPrice = prod.sellingPrice;
        let offerMrpPrice = prod.mrpPrice;
        let offerDiscountPercent = prod.discountPercent;
        let offerStock = prod.countInStock;
        let offerSku = prod.sku;

        if (prod.hasVariants && Array.isArray(prod.variants) && prod.variants.length > 0) {
          // If competing product has variants, find the matching variant
          const matchedVariant = prod.variants.find((v) => {
            if (v.status !== "ACTIVE" || v.countInStock <= 0) return false;
            const vColor = getAttr(prod, v, "color");
            const vSize = getAttr(prod, v, "size");
            const vRam = getAttr(prod, v, "ram");
            const vCap = getAttr(prod, v, "capacity") || getAttr(prod, v, "storage");
            const vModel = getAttr(prod, v, "model");
            const vGen = getAttr(prod, v, "generation");
            const vPack = getAttr(prod, v, "packQuantity") || getAttr(prod, v, "pack_quantity");

            if (targetColor && (!vColor || vColor.toLowerCase() !== targetColor.toLowerCase())) return false;
            if (targetSize && (!vSize || vSize.toLowerCase() !== targetSize.toLowerCase())) return false;
            if (targetRam && (!vRam || vRam.toLowerCase() !== targetRam.toLowerCase())) return false;
            if (targetCapacity && (!vCap || vCap.toLowerCase() !== targetCapacity.toLowerCase())) return false;
            if (targetModel && (!vModel || vModel.toLowerCase() !== targetModel.toLowerCase())) return false;
            if (targetGeneration && (!vGen || vGen.toLowerCase() !== targetGeneration.toLowerCase())) return false;
            if (targetPackQuantity && (!vPack || vPack.toLowerCase() !== targetPackQuantity.toLowerCase())) return false;
            return true;
          });

          if (!matchedVariant) {
            // No matching variant found in competing product
            continue;
          }
          offerSellingPrice = matchedVariant.sellingPrice;
          offerMrpPrice = matchedVariant.mrpPrice;
          offerDiscountPercent = matchedVariant.discountPercent;
          offerStock = matchedVariant.countInStock;
          offerSku = matchedVariant.sku || prod.sku;
        } else {
          // Standalone product: check attributes directly
          const prodColor = getAttr(prod, null, "color");
          const prodSize = getAttr(prod, null, "size");
          const prodRam = getAttr(prod, null, "ram");
          const prodCap = getAttr(prod, null, "capacity") || getAttr(prod, null, "storage");
          const prodModel = getAttr(prod, null, "model");
          const prodGen = getAttr(prod, null, "generation");
          const prodPack = getAttr(prod, null, "packQuantity") || getAttr(prod, null, "pack_quantity");

          if (targetColor && (!prodColor || prodColor.toLowerCase() !== targetColor.toLowerCase())) {
            continue;
          }
          if (targetSize && (!prodSize || prodSize.toLowerCase() !== targetSize.toLowerCase())) {
            continue;
          }
          if (targetRam && (!prodRam || prodRam.toLowerCase() !== targetRam.toLowerCase())) {
            continue;
          }
          if (targetCapacity && (!prodCap || prodCap.toLowerCase() !== targetCapacity.toLowerCase())) {
            continue;
          }
          if (targetModel && (!prodModel || prodModel.toLowerCase() !== targetModel.toLowerCase())) {
            continue;
          }
          if (targetGeneration && (!prodGen || prodGen.toLowerCase() !== targetGeneration.toLowerCase())) {
            continue;
          }
          if (targetPackQuantity && (!prodPack || prodPack.toLowerCase() !== targetPackQuantity.toLowerCase())) {
            continue;
          }
        }

        const stats = sellerRatingMap.get(sellerDoc._id.toString());
        const sellerRating = stats && stats.count > 0 ? Math.round((stats.ratingSum / stats.count) * 10) / 10 : null;
        const sellerRatingCount = stats ? stats.count : 0;

        const isVerified =
          sellerDoc.accountStatus === "ACTIVE" && Boolean(sellerDoc.isEmailVerified);
        const sellerCode = `ZB-SLR-${sellerDoc._id.toString().slice(-6).toUpperCase()}`;

        offers.push({
          productId: prod._id,
          title: prod.title,
          slug: prod.slug,
          sku: offerSku,
          seller: {
            sellerId: sellerDoc._id,
            sellerCode,
            sellerName: sellerDoc.sellerName,
            businessName: sellerDoc.businessDetails?.businessName || sellerDoc.sellerName,
            businessLogo: sellerDoc.businessDetails?.businessLogo || "",
            isVerified,
            rating: sellerRating,
            ratingCount: sellerRatingCount,
            shipsFromCity: sellerDoc.pickupAddress?.city || null,
            shipsFromState: sellerDoc.pickupAddress?.state || null,
            fulfillmentMethod: sellerDoc.businessDetails?.fulfillmentType || null,
          },
          fulfillmentMethod: sellerDoc.businessDetails?.fulfillmentType || null,
          pricing: {
            mrpPrice: offerMrpPrice,
            sellingPrice: offerSellingPrice,
            discountPercent: offerDiscountPercent,
            savingsVsCurrentOffer: Math.max(0, currentProduct.sellingPrice - offerSellingPrice),
            isCheaper: offerSellingPrice < currentProduct.sellingPrice,
          },
          inventory: {
            countInStock: offerStock,
            inStock: offerStock > 0,
            status: offerStock <= 0 ? "OUT_OF_STOCK" : offerStock <= 5 ? "LOW_STOCK" : "IN_STOCK",
          },
          shippingDetails: {
            estimatedDeliveryDays: prod.shippingDetails?.estimatedDeliveryDays || null,
            freeShipping: prod.shippingDetails?.freeShipping === true,
          },
          returnPolicy: prod.returnPolicy
            ? {
                returnable:
                  typeof prod.returnPolicy.returnable === "boolean"
                    ? prod.returnPolicy.returnable
                    : null,
                windowDays:
                  typeof prod.returnPolicy.windowDays === "number"
                    ? prod.returnPolicy.windowDays
                    : null,
                policyType: prod.returnPolicy.policyType || null,
              }
            : null,
          warranty: prod.warranty || null,
        });
      }

      return {
        currentProductId: currentProduct._id,
        currentSellerId,
        totalOtherOffers: offers.length,
        offers,
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Retrieves authoritative price history checkpoints and statistics for a product.
   */
  async getProductPriceHistory(productId, options = {}) {
    try {
      const isObjectId = mongoose.isValidObjectId(productId);
      const query = isObjectId ? { _id: productId } : { slug: productId };
      const product = await Product.findOne(query);

      if (!product) {
        throw new Error("Product not found");
      }

      // Determine requested variant if any
      let resolvedVariant = null;
      let requestedVariantId = options?.variantId || null;
      let requestedVariantSku = options?.variantSku || null;

      if (requestedVariantId && Array.isArray(product.variants)) {
        resolvedVariant = product.variants.find(
          (v) => (v._id && v._id.toString() === requestedVariantId.toString()) || v.sku === requestedVariantId
        );
      } else if (requestedVariantSku && Array.isArray(product.variants)) {
        resolvedVariant = product.variants.find((v) => v.sku === requestedVariantSku);
      }

      // If variant was explicitly requested but cannot be found, reject clearly
      if ((requestedVariantId || requestedVariantSku) && !resolvedVariant) {
        throw new Error("Specified variant not found for this product");
      }

      let currentSellingPrice = resolvedVariant ? resolvedVariant.sellingPrice : product.sellingPrice;
      let currentMrpPrice = resolvedVariant ? resolvedVariant.mrpPrice : product.mrpPrice;

      // Base-product history queries must exclude variant-specific snapshots.
      // Variant queries must use the exact selected variant's actual ObjectId! Never query using raw SKU string.
      const historyQuery = { product: product._id };
      if (resolvedVariant) {
        historyQuery.variantId = resolvedVariant._id;
      } else {
        // Exclude variant-specific snapshots when querying base product
        historyQuery.variantId = null;
      }

      let historyPoints = await PriceHistory.find(historyQuery)
        .sort({ timestamp: -1 })
        .limit(30);

      // Return chronologically for the chart
      historyPoints.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      const hasSufficientHistory = historyPoints.length >= 2;

      const historyFormatted = historyPoints.map((h) => ({
        date: new Date(h.timestamp).toISOString().split("T")[0],
        price: h.sellingPrice,
        mrp: h.mrpPrice,
        discountPercent: h.discountPercent || calculateDiscountPercentage(h.mrpPrice, h.sellingPrice),
      }));

      if (!hasSufficientHistory) {
        return {
          productId: product._id,
          variantId: resolvedVariant?._id ? resolvedVariant._id.toString() : null,
          variantSku: resolvedVariant?.sku || null,
          currentPrice: currentSellingPrice,
          mrpPrice: currentMrpPrice,
          currentMrp: currentMrpPrice,
          lowestPrice: null,
          highestPrice: null,
          averagePrice: null,
          isAtLowestPrice: false,
          savingsVsHighest: 0,
          priceDropPercentage: 0,
          hasSufficientHistory: false,
          history: historyFormatted,
        };
      }

      const allPrices = historyPoints.map((h) => Number(h.sellingPrice) || currentSellingPrice);
      const lowestPrice = Math.min(...allPrices);
      const highestPrice = Math.max(...allPrices);
      const averagePrice = Math.round(allPrices.reduce((a, b) => a + b, 0) / allPrices.length);

      return {
        productId: product._id,
        variantId: resolvedVariant?._id ? resolvedVariant._id.toString() : null,
        variantSku: resolvedVariant?.sku || null,
        currentPrice: currentSellingPrice,
        mrpPrice: currentMrpPrice,
        currentMrp: currentMrpPrice,
        lowestPrice,
        highestPrice,
        averagePrice,
        isAtLowestPrice: currentSellingPrice <= lowestPrice,
        savingsVsHighest: Math.max(0, highestPrice - currentSellingPrice),
        priceDropPercentage:
          highestPrice > 0
            ? Math.round(((highestPrice - currentSellingPrice) / highestPrice) * 100)
            : 0,
        hasSufficientHistory: true,
        history: historyFormatted,
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Compares 2-4 products side-by-side using authoritative catalog attributes.
   */
  async compareProducts(productIds = []) {
    try {
      if (!Array.isArray(productIds) || productIds.length < 2) {
        const error = new Error("At least 2 products are required for comparison");
        error.statusCode = 400;
        throw error;
      }

      const validIds = productIds
        .filter((id) => mongoose.isValidObjectId(id))
        .map((id) => new mongoose.Types.ObjectId(id));

      if (validIds.length < 2) {
        const error = new Error("At least 2 valid product IDs are required for comparison");
        error.statusCode = 400;
        throw error;
      }

      const products = await Product.find({ _id: { $in: validIds } })
        .populate("seller", "sellerName businessDetails rating")
        .populate("category", "name categoryId");

      if (products.length < 2) {
        const error = new Error("At least 2 matching products could be found in catalog");
        error.statusCode = 404;
        throw error;
      }

      // Collect all distinct specification names
      const allSpecNames = new Set();
      products.forEach((p) => {
        (p.specifications || []).forEach((s) => {
          if (s.name && s.name.trim()) allSpecNames.add(s.name.trim());
        });
      });

      // Build unified side-by-side spec matrix rows
      const matrix = Array.from(allSpecNames).map((specName) => {
        const row = { specName, values: {} };
        products.forEach((p) => {
          const match = (p.specifications || []).find(
            (s) => (s.name || "").toLowerCase() === specName.toLowerCase()
          );
          row.values[p._id.toString()] = match
            ? `${match.value}${match.unit ? " " + match.unit : ""}`
            : "—";
        });
        return row;
      });

      // Build section-grouped specifications matrix
      const specSections = new Map();
      products.forEach((p) => {
        (p.specifications || []).forEach((s) => {
          const sec = s.section || "General";
          if (!specSections.has(sec)) specSections.set(sec, new Set());
          specSections.get(sec).add(s.name.trim());
        });
      });

      const specificationsMatrix = [];
      for (const [sectionName, keysSet] of specSections.entries()) {
        const rows = [];
        for (const specKey of keysSet) {
          const values = {};
          products.forEach((p) => {
            const spec = (p.specifications || []).find(
              (s) => (s.section || "General") === sectionName && s.name === specKey
            );
            values[p._id.toString()] = spec ? `${spec.value}${spec.unit ? " " + spec.unit : ""}` : "—";
          });
          rows.push({ name: specKey, specName: specKey, values });
        }
        specificationsMatrix.push({ section: sectionName, rows });
      }

      const sellingPrices = products.map((p) => ({ id: p._id.toString(), price: p.sellingPrice }));
      const lowestPriceObj = [...sellingPrices].sort((a, b) => a.price - b.price)[0];
      const highestRatingObj = [...products].sort((a, b) => (b.ratings?.average || 0) - (a.ratings?.average || 0))[0];

      const formattedProducts = products.map((p) => ({
        _id: p._id,
        title: p.title,
        slug: p.slug,
        brand: p.brand,
        images: p.images,
        image: Array.isArray(p.images) && p.images.length > 0
          ? (typeof p.images[0] === "string" ? p.images[0] : p.images[0].url || "")
          : "",
        pricing: {
          mrpPrice: p.mrpPrice,
          sellingPrice: p.sellingPrice,
          discountPercent: p.discountPercent,
          savings: Math.max(0, p.mrpPrice - p.sellingPrice),
        },
        inventory: {
          inStock: p.countInStock > 0,
          countInStock: p.countInStock,
        },
        ratings: p.ratings,
        shippingDetails: p.shippingDetails,
        warranty: p.warranty,
        returnPolicy: p.returnPolicy,
        seller: {
          sellerId: p.seller?._id,
          sellerName: p.seller?.sellerName,
          businessName: p.seller?.businessDetails?.businessName || p.seller?.sellerName,
          rating: p.seller?.rating || null,
        },
      }));

      return {
        products: formattedProducts,
        specMatrix: matrix,
        specificationsMatrix,
        recommendationHighlights: {
          lowestPriceProductId: lowestPriceObj?.id,
          highestRatedProductId: highestRatingObj?._id?.toString(),
        },
      };
    } catch (error) {
      if (error.statusCode) throw error;
      const err = new Error(error.message);
      err.statusCode = error.statusCode || 500;
      throw err;
    }
  }

  /**
   * Subscribes customer to price drop and restock alerts.
   */
  async subscribePriceAlert(userId, productId, alertData = {}) {
    try {
      const product = await Product.findById(productId);
      if (!product) throw new Error("Product not found");

      let defaultCollection = await Collection.findOne({ user: userId, isDefault: true });
      if (!defaultCollection) {
        defaultCollection = await Collection.create({
          user: userId,
          name: "My Wishlist",
          isDefault: true,
          isPublic: false,
        });
      }

      if (
        alertData.targetPrice !== undefined &&
        Number(alertData.targetPrice) >= product.sellingPrice
      ) {
        const error = new Error(
          `Target price (₹${alertData.targetPrice}) must be lower than current selling price (₹${product.sellingPrice})`
        );
        error.statusCode = 400;
        throw error;
      }

      const targetPrice = Number(alertData.targetPrice) || Math.round(product.sellingPrice * 0.95);
      const notifyOnPriceDrop = alertData.notifyOnPriceDrop !== false;
      const notifyOnBackInStock = alertData.notifyOnBackInStock !== false;

      let saved = await SavedItem.findOne({ user: userId, product: product._id });
      if (saved) {
        saved.targetPrice = targetPrice;
        saved.notifyOnPriceDrop = notifyOnPriceDrop;
        saved.notifyOnBackInStock = notifyOnBackInStock;
        await saved.save();
      } else {
        saved = await SavedItem.create({
          user: userId,
          collectionId: defaultCollection._id,
          product: product._id,
          savedPrice: product.sellingPrice,
          savedMrp: product.mrpPrice,
          targetPrice,
          notifyOnPriceDrop,
          notifyOnBackInStock,
          snapshot: {
            title: product.title,
            image: product.images?.[0] || "",
            brand: product.brand,
          },
        });
      }

      return {
        message: "Price drop alert configured successfully",
        targetPrice,
        currentPrice: product.sellingPrice,
        notifyOnPriceDrop,
        notifyOnBackInStock,
      };
    } catch (error) {
      if (error.statusCode) throw error;
      const err = new Error(error.message);
      err.statusCode = error.statusCode || 500;
      throw err;
    }
  }

  /**
   * Retrieves verified questions and answers for a product.
   * Never fabricates synthetic Q&A content; returns honest empty state if zero approved questions exist.
   */
  async getProductQuestions(productId) {
    try {
      const isObjectId = mongoose.isValidObjectId(productId);
      const query = isObjectId ? { _id: productId } : { slug: productId };
      const product = await Product.findOne(query);

      if (!product) throw new Error("Product not found");

      const questions = await ProductQuestion.find({
        product: product._id,
        isApproved: true,
        moderationStatus: "APPROVED",
      })
        .sort({ createdAt: -1 })
        .limit(30);

      return {
        productId: product._id,
        totalQuestions: questions.length,
        questions,
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Submits a customer question for a product.
   * Sets question to PENDING moderation by default; prevents duplicate and abusive submissions.
   */
  async askProductQuestion(userId, productId, questionText, userName = "Valued Customer") {
    try {
      if (!questionText || questionText.trim().length < 6) {
        const error = new Error("Question text must be at least 6 characters");
        error.statusCode = 400;
        throw error;
      }

      const product = await Product.findById(productId);
      if (!product) throw new Error("Product not found");

      // Anti-abuse rate limiting: check recent submissions in last 10 minutes
      const recentCount = await ProductQuestion.countDocuments({
        user: userId,
        createdAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) },
      });
      if (recentCount >= 5) {
        const error = new Error("Submission limit reached. Please wait a few minutes before submitting another question.");
        error.statusCode = 429;
        throw error;
      }

      // Prevent duplicate submissions of the identical question
      const existingSame = await ProductQuestion.findOne({
        product: product._id,
        user: userId,
        question: questionText.trim(),
      });
      if (existingSame) {
        const error = new Error("You have already submitted this question for review.");
        error.statusCode = 409;
        throw error;
      }

      const question = await ProductQuestion.create({
        product: product._id,
        user: userId,
        userName: userName || "Community Member",
        question: questionText.trim(),
        answers: [],
        upvotes: 0,
        upvotedBy: [],
        moderationStatus: "PENDING",
        isApproved: false,
      });

      return question;
    } catch (error) {
      if (error.statusCode) throw error;
      const err = new Error(error.message);
      err.statusCode = error.statusCode || 500;
      throw err;
    }
  }

  /**
   * Toggles upvote on a product question or specific answer without allowing duplicates.
   */
  async upvoteProductQuestion(userId, questionId, answerId = null) {
    try {
      const q = await ProductQuestion.findById(questionId);
      if (!q) {
        const error = new Error("Question not found");
        error.statusCode = 404;
        throw error;
      }

      if (answerId) {
        const ans = q.answers.id(answerId);
        if (!ans) {
          const error = new Error("Answer not found");
          error.statusCode = 404;
          throw error;
        }

        const upvotedIndex = (ans.upvotedBy || []).findIndex(
          (u) => u.toString() === userId.toString()
        );
        if (upvotedIndex > -1) {
          ans.upvotedBy.splice(upvotedIndex, 1);
        } else {
          ans.upvotedBy = ans.upvotedBy || [];
          ans.upvotedBy.push(userId);
        }
        ans.upvotes = ans.upvotedBy.length;
      } else {
        const upvotedIndex = (q.upvotedBy || []).findIndex(
          (u) => u.toString() === userId.toString()
        );
        if (upvotedIndex > -1) {
          q.upvotedBy.splice(upvotedIndex, 1);
        } else {
          q.upvotedBy = q.upvotedBy || [];
          q.upvotedBy.push(userId);
        }
        q.upvotes = q.upvotedBy.length;
      }

      await q.save();
      return q;
    } catch (error) {
      if (error.statusCode) throw error;
      const err = new Error(error.message);
      err.statusCode = error.statusCode || 500;
      throw err;
    }
  }

  /**
   * Adds an authenticated seller or verified buyer answer to an existing question.
   */
  async answerProductQuestion(user, questionId, { answer, authorRole }) {
    try {
      if (!answer || answer.trim().length < 3) {
        const error = new Error("Answer text must be at least 3 characters");
        error.statusCode = 400;
        throw error;
      }

      const q = await ProductQuestion.findById(questionId).populate("product");
      if (!q) {
        const error = new Error("Question not found");
        error.statusCode = 404;
        throw error;
      }

      const productSellerId = (q.product?.seller?._id || q.product?.seller)?.toString();
      const currentUserId = (user._id || user).toString();
      const isProductOwner = productSellerId && productSellerId === currentUserId;
      const isAdmin = user.role === "ROLE_ADMIN";

      // If user attempts to answer as SELLER but does not own the product
      if (authorRole === "SELLER" && !isProductOwner && !isAdmin) {
        const error = new Error("Forbidden: Sellers may only answer questions for products they own.");
        error.statusCode = 403;
        throw error;
      }

      // Check account status if product owner seller
      if (isProductOwner) {
        const sellerDoc = await Seller.findById(user._id);
        if (sellerDoc && sellerDoc.accountStatus !== "ACTIVE") {
          const error = new Error("Forbidden: Inactive seller account cannot post answers.");
          error.statusCode = 403;
          throw error;
        }
      }

      // Determine genuine role: never trust user-supplied claims
      let effectiveRole = "COMMUNITY";
      let authorName = user.fullName || "Community Member";

      if (isProductOwner) {
        effectiveRole = "SELLER";
        authorName = user.sellerName || user.businessDetails?.businessName || user.fullName || "Verified Merchant";
      } else if (isAdmin) {
        effectiveRole = "ADMIN";
        authorName = "Zosh Support";
      } else {
        // Check if verified buyer by checking delivered/completed orders
        const verifiedPurchase = await Order.findOne({
          user: user._id,
          "orderItems.product": q.product?._id || q.product,
          orderStatus: { $in: ["DELIVERED", "CONFIRMED", "SHIPPED", "PLACED"] },
        });

        if (verifiedPurchase) {
          effectiveRole = "VERIFIED_BUYER";
          authorName = user.fullName || "Verified Buyer";
        }
      }

      q.answers.push({
        user: user._id,
        authorName,
        authorRole: effectiveRole,
        isSellerAnswer: effectiveRole === "SELLER",
        isVerifiedBuyer: effectiveRole === "VERIFIED_BUYER",
        answer: answer.trim(),
        upvotes: 0,
        upvotedBy: [],
      });

      await q.save();
      return q;
    } catch (error) {
      if (error.statusCode) throw error;
      const err = new Error(error.message);
      err.statusCode = error.statusCode || 500;
      throw err;
    }
  }
}

export default new ProductService();

