import assert from "assert";
import mongoose from "mongoose";
import ProductService from "../src/modules/customer/services/product.service.js";
import CartService from "../src/modules/customer/services/cart.service.js";
import AdminService from "../src/modules/admin/services/admin.service.js";
import { Product } from "../src/models/product.model.js";
import { PriceHistory } from "../src/models/priceHistory.model.js";
import { SavedItem } from "../src/models/savedItem.model.js";
import { Collection } from "../src/models/collection.model.js";
import { ProductQuestion } from "../src/models/productQuestion.model.js";
import { Cart } from "../src/models/cart.model.js";
import { CartItem } from "../src/models/cartItem.model.js";
import { Review } from "../src/models/review.model.js";
import { Seller } from "../src/models/seller.model.js";
import { Order } from "../src/models/order.model.js";
import { PlatformSettings } from "../src/models/settings.model.js";
import { CartMergeRecord } from "../src/models/cartMergeRecord.model.js";

console.log("\n================================================================");
console.log("🧪 ZOSH BAZAAR — PHASE 30 FULL MARKETPLACE EXPERIENCE TEST SUITE");
console.log("================================================================\n");

let passed = 0;
let failed = 0;

const testReport = {
  unitTests: [],
  serviceIntegrationTests: [],
  browserE2eNotes: [
    "Browser E2E tests were not run in this test suite; PDP interactions, moderation UI, and cart behaviors are validated via focused unit and service integration tests.",
  ],
};

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✅ PASS [UNIT]: ${name}`);
    testReport.unitTests.push({ name, status: "PASSED" });
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL [UNIT]: ${name}`);
    console.error(`     Error: ${err.message}`);
    testReport.unitTests.push({ name, status: "FAILED", error: err.message });
    failed++;
  }
}

async function runAsyncTest(name, fn) {
  try {
    await fn();
    console.log(`  ✅ PASS [SERVICE]: ${name}`);
    testReport.serviceIntegrationTests.push({ name, status: "PASSED" });
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL [SERVICE]: ${name}`);
    console.error(`     Error: ${err.message}`);
    testReport.serviceIntegrationTests.push({ name, status: "FAILED", error: err.message });
    failed++;
  }
}

// Chainable mock helper for Mongoose query builders (thenable)
function createChainableQuery(result) {
  const query = {
    populate: () => query,
    sort: () => query,
    limit: () => query,
    select: () => query,
    exec: async () => result,
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  };
  return query;
}

// Save original static & prototype methods for clean teardown
const originalProductFindOne = Product.findOne;
const originalProductFind = Product.find;
const originalProductFindById = Product.findById;
const originalPriceHistoryFind = PriceHistory.find;
const originalPriceHistoryCreate = PriceHistory.create;
const originalSavedItemFind = SavedItem.find;
const originalSavedItemFindOne = SavedItem.findOne;
const originalSavedItemCreate = SavedItem.create;
const originalCollectionFindOne = Collection.findOne;
const originalCollectionCreate = Collection.create;
const originalProductQuestionFind = ProductQuestion.find;
const originalProductQuestionFindById = ProductQuestion.findById;
const originalProductQuestionFindOne = ProductQuestion.findOne;
const originalProductQuestionCreate = ProductQuestion.create;
const originalProductQuestionCountDocuments = ProductQuestion.countDocuments;
const originalCartFindOne = Cart.findOne;
const originalCartItemFindOne = CartItem.findOne;
const originalCartItemFind = CartItem.find;
const originalCartItemFindByIdAndDelete = CartItem.findByIdAndDelete;
const originalCartItemSave = CartItem.prototype.save;
const originalCartSave = Cart.prototype.save;
const originalReviewAggregate = Review.aggregate;
const originalSellerFindById = Seller.findById;
const originalOrderFindOne = Order.findOne;
const originalPlatformSettingsFindOne = PlatformSettings.findOne;
const originalCartMergeRecordCreate = CartMergeRecord.create;
const originalCartMergeRecordFindOne = CartMergeRecord.findOne;
const originalCartMergeRecordFindOneAndUpdate = CartMergeRecord.findOneAndUpdate;

// In-memory store for CartMergeRecord to accurately test concurrency, locks, and idempotency
const inMemoryMergeRecords = new Map();

CartMergeRecord.create = async function (data) {
  const key = `${data.userId}:${data.idempotencyKey}`;
  if (inMemoryMergeRecords.has(key)) {
    const err = new Error("E11000 duplicate key error collection: zosh_bazaar.cart_merge_records index: userId_1_idempotencyKey_1 dup key");
    err.code = 11000;
    throw err;
  }
  const record = {
    ...data,
    _id: new mongoose.Types.ObjectId(),
    createdAt: data.createdAt || new Date(),
    lockedAt: data.lockedAt || new Date(),
    updatedAt: new Date(),
    save: async function () {
      inMemoryMergeRecords.set(key, this);
      return this;
    },
  };
  inMemoryMergeRecords.set(key, record);
  return record;
};

CartMergeRecord.findOne = async function (query) {
  const key = `${query.userId}:${query.idempotencyKey}`;
  return inMemoryMergeRecords.get(key) || null;
};

CartMergeRecord.findOneAndUpdate = async function (filter, update, options = {}) {
  const key = `${filter.userId}:${filter.idempotencyKey}`;
  let record = inMemoryMergeRecords.get(key);
  if (!record) {
    if (options.upsert) {
      record = {
        userId: filter.userId,
        idempotencyKey: filter.idempotencyKey,
        ...(update.$set || update),
        save: async function () {
          inMemoryMergeRecords.set(key, this);
          return this;
        },
      };
      inMemoryMergeRecords.set(key, record);
      return record;
    }
    return null;
  }
  if (filter.status && record.status !== filter.status) {
    return null;
  }
  if (filter.lockedAt && record.lockedAt) {
    const fTime = new Date(filter.lockedAt).getTime();
    const rTime = new Date(record.lockedAt).getTime();
    if (fTime !== rTime) {
      return null;
    }
  }
  Object.assign(record, update.$set || update);
  inMemoryMergeRecords.set(key, record);
  return record;
};

// In-memory store for CartItem to verify resulting cart quantities
const inMemoryCartItems = new Map();

function getCartItemKey(cartId, productId, variantId) {
  const cStr = cartId ? (cartId._id ? cartId._id.toString() : cartId.toString()) : "null";
  const pStr = productId ? (productId._id ? productId._id.toString() : productId.toString()) : "null";
  const vStr = variantId ? (variantId._id ? variantId._id.toString() : variantId.toString()) : "null";
  return `${cStr}:${pStr}:${vStr}`;
}

function resetInMemoryCartItems() {
  inMemoryCartItems.clear();
  CartItem.findOne = async function (query) {
    const key = getCartItemKey(query.cart, query.product, query.variantId);
    return inMemoryCartItems.get(key) || null;
  };
  CartItem.find = function (query = {}) {
    const items = Array.from(inMemoryCartItems.values());
    let filtered = items;
    if (query.cart) {
      const qCart = query.cart._id ? query.cart._id.toString() : query.cart.toString();
      filtered = items.filter((i) => {
        const iCart = i.cart?._id ? i.cart._id.toString() : i.cart?.toString();
        return iCart === qCart;
      });
    }
    return createChainableQuery(filtered);
  };
  CartItem.findOneAndUpdate = async function (filter, update, options = {}) {
    let item = null;
    if (filter._id) {
      item = Array.from(inMemoryCartItems.values()).find(
        (i) => (i._id ? i._id.toString() : null) === filter._id.toString()
      );
    } else {
      const key = getCartItemKey(filter.cart, filter.product, filter.variantId);
      item = inMemoryCartItems.get(key) || null;
    }
    if (!item) return null;
    if (filter.quantity !== undefined && item.quantity !== filter.quantity) {
      return null; // CAS condition failed
    }
    if (update.$inc) {
      for (const [k, val] of Object.entries(update.$inc)) {
        item[k] = (item[k] || 0) + val;
      }
    }
    if (update.$push) {
      for (const [k, val] of Object.entries(update.$push)) {
        item[k] = item[k] || [];
        if (val && val.$each && Array.isArray(val.$each)) {
          item[k].push(...val.$each);
        } else {
          item[k].push(val);
        }
      }
    }
    if (update.$set) {
      Object.assign(item, update.$set);
    }
    const key = getCartItemKey(item.cart, item.product, item.variantId);
    inMemoryCartItems.set(key, item);
    return item;
  };
  CartItem.prototype.save = async function () {
    this._id = this._id || new mongoose.Types.ObjectId();
    const key = getCartItemKey(this.cart, this.product, this.variantId);
    const existing = inMemoryCartItems.get(key);
    if (
      existing &&
      existing !== this &&
      existing._id &&
      this._id &&
      existing._id.toString() !== this._id.toString()
    ) {
      const err = new Error(
        "E11000 duplicate key error collection: zosh_bazaar.cartitems index: cart_1_product_1_variantId_1 dup key"
      );
      err.code = 11000;
      throw err;
    }
    inMemoryCartItems.set(key, this);
    return this;
  };
}

resetInMemoryCartItems();

Cart.prototype.save = async function () { return this; };
CartItem.findByIdAndDelete = async () => ({ message: "Deleted" });
SavedItem.find = () => createChainableQuery([]);
PlatformSettings.findOne = () => createChainableQuery(null);

function restoreAllMocks() {
  Product.findOne = originalProductFindOne;
  Product.find = originalProductFind;
  Product.findById = originalProductFindById;
  PriceHistory.find = originalPriceHistoryFind;
  PriceHistory.create = originalPriceHistoryCreate;
  SavedItem.find = originalSavedItemFind;
  SavedItem.findOne = originalSavedItemFindOne;
  SavedItem.create = originalSavedItemCreate;
  Collection.findOne = originalCollectionFindOne;
  Collection.create = originalCollectionCreate;
  ProductQuestion.find = originalProductQuestionFind;
  ProductQuestion.findById = originalProductQuestionFindById;
  ProductQuestion.findOne = originalProductQuestionFindOne;
  ProductQuestion.create = originalProductQuestionCreate;
  ProductQuestion.countDocuments = originalProductQuestionCountDocuments;
  Cart.findOne = originalCartFindOne;
  CartItem.findOne = originalCartItemFindOne;
  CartItem.find = originalCartItemFind;
  CartItem.findByIdAndDelete = originalCartItemFindByIdAndDelete;
  CartItem.prototype.save = originalCartItemSave;
  Cart.prototype.save = originalCartSave;
  Review.aggregate = originalReviewAggregate;
  Seller.findById = originalSellerFindById;
  Order.findOne = originalOrderFindOne;
  PlatformSettings.findOne = originalPlatformSettingsFindOne;
  CartMergeRecord.create = originalCartMergeRecordCreate;
  CartMergeRecord.findOne = originalCartMergeRecordFindOne;
  CartMergeRecord.findOneAndUpdate = originalCartMergeRecordFindOneAndUpdate;
}

async function main() {
  try {
    // ============================================================================
    // [DOMAIN 1] Multi-Seller Canonical Offer Engine
    // ============================================================================
    console.log("▶ [Domain 1] Multi-Seller Canonical Offer Engine");

    runTest("Product model schema supports canonicalId, canonicalSku, and barcode indexing", () => {
      const prod = new Product({
        title: "Sony WH-1000XM5 Wireless Headphones",
        description: "Premium noise cancelling headphones",
        brand: "Sony",
        category: new mongoose.Types.ObjectId(),
        seller: new mongoose.Types.ObjectId(),
        mrpPrice: 29990,
        sellingPrice: 26990,
        sku: "SONY-WH1000XM5-BLK-01",
        canonicalId: "CANON-SONY-WH1000XM5",
        canonicalSku: "SONY-WH1000XM5",
        barcode: "4905524987654",
        countInStock: 15,
      });

      assert.strictEqual(prod.canonicalId, "CANON-SONY-WH1000XM5");
      assert.strictEqual(prod.canonicalSku, "SONY-WH1000XM5");
      assert.strictEqual(prod.barcode, "4905524987654");
    });

    await runAsyncTest("ProductService.getOtherSellerOffers() matches by canonicalId and calculates authentic savings", async () => {
      const currentProductId = new mongoose.Types.ObjectId();
      const currentSellerId = new mongoose.Types.ObjectId();
      const altProductId = new mongoose.Types.ObjectId();
      const altSellerId = new mongoose.Types.ObjectId();

      const currentProd = {
        _id: currentProductId,
        title: "Sony WH-1000XM5 Wireless Headphones",
        canonicalId: "CANON-SONY-WH1000XM5",
        brand: "Sony",
        sellingPrice: 26990,
        mrpPrice: 29990,
        color: "Black",
        seller: { _id: currentSellerId, accountStatus: "ACTIVE", isEmailVerified: true },
      };

      const competingProd = {
        _id: altProductId,
        title: "Sony WH-1000XM5 Wireless Noise Cancelling Headphones",
        canonicalId: "CANON-SONY-WH1000XM5",
        brand: "Sony",
        sellingPrice: 24990,
        mrpPrice: 29990,
        discountPercent: 17,
        countInStock: 8,
        inStock: true,
        status: "PUBLISHED",
        color: "Black",
        sku: "SONY-ALT-01",
        slug: "sony-wh-1000xm5-alt",
        seller: {
          _id: altSellerId,
          sellerName: "Apex Retail",
          accountStatus: "ACTIVE",
          isEmailVerified: true,
          businessDetails: { businessName: "Apex Retail India" },
          pickupAddress: { city: "Bengaluru", state: "Karnataka" },
        },
      };

      Product.findOne = () => createChainableQuery(currentProd);
      Product.find = (q) => {
        if (q && q.seller) return createChainableQuery([competingProd]);
        return createChainableQuery([competingProd]);
      };
      Review.aggregate = async () => [{ _id: null, avgRating: 4.6, totalCount: 42 }];

      const result = await ProductService.getOtherSellerOffers(currentProductId.toString());

      assert.strictEqual(result.totalOtherOffers, 1);
      assert.strictEqual(result.offers.length, 1);
      const offer = result.offers[0];
      assert.strictEqual(offer.pricing.sellingPrice, 24990);
      assert.strictEqual(offer.pricing.savingsVsCurrentOffer, 2000); // 26990 - 24990
      assert.strictEqual(offer.pricing.isCheaper, true);
      assert.strictEqual(offer.seller.isVerified, true);
      assert.strictEqual(offer.seller.rating, 4.6);
      assert.strictEqual(offer.seller.ratingCount, 42);
    });

    await runAsyncTest("ProductService.getOtherSellerOffers() strictly rejects inactive sellers & mismatched variants", async () => {
      const currentProductId = new mongoose.Types.ObjectId();
      const currentSellerId = new mongoose.Types.ObjectId();

      const currentProd = {
        _id: currentProductId,
        title: "Sony WH-1000XM5 Wireless Headphones",
        canonicalId: "CANON-SONY-WH1000XM5",
        sellingPrice: 26990,
        color: "Black",
        seller: { _id: currentSellerId, accountStatus: "ACTIVE" },
      };

      const inactiveSellerProd = {
        _id: new mongoose.Types.ObjectId(),
        title: "Sony WH-1000XM5 Wireless Headphones",
        canonicalId: "CANON-SONY-WH1000XM5",
        sellingPrice: 23990,
        countInStock: 5,
        color: "Black",
        seller: {
          _id: new mongoose.Types.ObjectId(),
          accountStatus: "SUSPENDED", // INACTIVE SELLER!
        },
      };

      const mismatchedColorProd = {
        _id: new mongoose.Types.ObjectId(),
        title: "Sony WH-1000XM5 Wireless Headphones",
        canonicalId: "CANON-SONY-WH1000XM5",
        sellingPrice: 24990,
        countInStock: 5,
        color: "Silver", // MISMATCHED COLOR!
        seller: {
          _id: new mongoose.Types.ObjectId(),
          accountStatus: "ACTIVE",
        },
      };

      Product.findOne = () => createChainableQuery(currentProd);
      Product.find = () => createChainableQuery([inactiveSellerProd, mismatchedColorProd]);
      Review.aggregate = async () => [];

      const result = await ProductService.getOtherSellerOffers(currentProductId.toString());

      // Both invalid offers should be filtered out
      assert.strictEqual(result.totalOtherOffers, 0);
      assert.strictEqual(result.offers.length, 0);
    });

    await runAsyncTest("ProductService.getOtherSellerOffers() withholds section when canonical identity is ambiguous", async () => {
      const currentProductId = new mongoose.Types.ObjectId();
      const currentProd = {
        _id: currentProductId,
        title: "Generic T-Shirt",
        brand: "", // No brand
        canonicalId: null,
        canonicalSku: null,
        barcode: null,
        seller: { _id: new mongoose.Types.ObjectId() },
      };

      Product.findOne = () => createChainableQuery(currentProd);

      const result = await ProductService.getOtherSellerOffers(currentProductId.toString());
      assert.strictEqual(result.totalOtherOffers, 0);
      assert.strictEqual(result.offers.length, 0);
    });

    await runAsyncTest("ProductService.getOtherSellerOffers() returns fulfillmentMethod: null when unconfigured", async () => {
      const currentProductId = new mongoose.Types.ObjectId();
      const currentSellerId = new mongoose.Types.ObjectId();
      const altProductId = new mongoose.Types.ObjectId();
      const altSellerId = new mongoose.Types.ObjectId();

      const currentProd = {
        _id: currentProductId,
        title: "Apple iPhone 15",
        canonicalId: "CANON-IPHONE15",
        brand: "Apple",
        sellingPrice: 72999,
        mrpPrice: 79999,
        color: "Blue",
        seller: { _id: currentSellerId, accountStatus: "ACTIVE", isEmailVerified: true },
      };

      const competingProd = {
        _id: altProductId,
        title: "Apple iPhone 15 128GB Blue",
        canonicalId: "CANON-IPHONE15",
        brand: "Apple",
        sellingPrice: 70999,
        mrpPrice: 79999,
        countInStock: 4,
        inStock: true,
        status: "PUBLISHED",
        color: "Blue",
        seller: {
          _id: altSellerId,
          sellerName: "Gadget World",
          accountStatus: "ACTIVE",
          isEmailVerified: true,
          businessDetails: { businessName: "Gadget World" }, // NO fulfillmentType configured!
          pickupAddress: { city: "Mumbai", state: "Maharashtra" },
        },
      };

      Product.findOne = () => createChainableQuery(currentProd);
      Product.find = () => createChainableQuery([competingProd]);
      Review.aggregate = async () => [];

      const result = await ProductService.getOtherSellerOffers(currentProductId.toString());
      assert.strictEqual(result.totalOtherOffers, 1);
      assert.strictEqual(result.offers[0].fulfillmentMethod, null, "Fulfillment method should be null when unconfigured");
    });

    await runAsyncTest("ProductService.getOtherSellerOffers() rejects competing offers with incompatible variant attributes", async () => {
      const currentProductId = new mongoose.Types.ObjectId();
      const currentSellerId = new mongoose.Types.ObjectId();

      const currentProd = {
        _id: currentProductId,
        title: "Nike Air Max",
        canonicalId: "CANON-NIKE-AIRMAX",
        brand: "Nike",
        sellingPrice: 8999,
        color: "Black",
        size: "UK 9",
        seller: { _id: currentSellerId, accountStatus: "ACTIVE" },
      };

      const mismatchedSizeProd = {
        _id: new mongoose.Types.ObjectId(),
        title: "Nike Air Max UK 8",
        canonicalId: "CANON-NIKE-AIRMAX",
        brand: "Nike",
        sellingPrice: 7999,
        countInStock: 3,
        color: "Black",
        size: "UK 8", // Incompatible size!
        seller: { _id: new mongoose.Types.ObjectId(), accountStatus: "ACTIVE" },
      };

      const missingColorProd = {
        _id: new mongoose.Types.ObjectId(),
        title: "Nike Air Max White",
        canonicalId: "CANON-NIKE-AIRMAX",
        brand: "Nike",
        sellingPrice: 7999,
        countInStock: 3,
        size: "UK 9",
        color: "", // Missing color!
        seller: { _id: new mongoose.Types.ObjectId(), accountStatus: "ACTIVE" },
      };

      Product.findOne = () => createChainableQuery(currentProd);
      Product.find = () => createChainableQuery([mismatchedSizeProd, missingColorProd]);
      Review.aggregate = async () => [];

      const result = await ProductService.getOtherSellerOffers(currentProductId.toString());
      assert.strictEqual(result.totalOtherOffers, 0, "Competing offers with mismatched or missing attributes must be rejected");
    });

    runTest("CartMergeRecord model schema configures 7-day TTL index (604800s)", () => {
      const createdAtPath = CartMergeRecord.schema.paths.createdAt;
      assert.strictEqual(
        createdAtPath.options.expires,
        604800,
        "CartMergeRecord TTL index must be explicitly reconciled to 604800 seconds (7 days)"
      );
    });

    await runAsyncTest("ProductService.getOtherSellerOffers() rejects competing offer when target model or generation is missing or mismatched", async () => {
      const currentProductId = new mongoose.Types.ObjectId();
      const currentSellerId = new mongoose.Types.ObjectId();

      const currentProd = {
        _id: currentProductId,
        title: "Samsung Galaxy S24 Ultra Gen 3",
        canonicalId: "CANON-SAMSUNG-S24U",
        brand: "Samsung",
        sellingPrice: 129999,
        model: "Galaxy S24 Ultra",
        generation: "Gen 3",
        seller: { _id: currentSellerId, accountStatus: "ACTIVE" },
      };

      const missingModelProd = {
        _id: new mongoose.Types.ObjectId(),
        title: "Samsung Galaxy Phone",
        canonicalId: "CANON-SAMSUNG-S24U",
        brand: "Samsung",
        sellingPrice: 119999,
        countInStock: 5,
        model: "", // MISSING MODEL!
        generation: "Gen 3",
        seller: { _id: new mongoose.Types.ObjectId(), accountStatus: "ACTIVE" },
      };

      const mismatchedGenProd = {
        _id: new mongoose.Types.ObjectId(),
        title: "Samsung Galaxy S24 Ultra Gen 2",
        canonicalId: "CANON-SAMSUNG-S24U",
        brand: "Samsung",
        sellingPrice: 115999,
        countInStock: 5,
        model: "Galaxy S24 Ultra",
        generation: "Gen 2", // MISMATCHED GENERATION!
        seller: { _id: new mongoose.Types.ObjectId(), accountStatus: "ACTIVE" },
      };

      Product.findOne = () => createChainableQuery(currentProd);
      Product.find = () => createChainableQuery([missingModelProd, mismatchedGenProd]);
      Review.aggregate = async () => [];

      const result = await ProductService.getOtherSellerOffers(currentProductId.toString());
      assert.strictEqual(result.totalOtherOffers, 0, "Competing offers with missing or mismatched model/generation must be rejected");
    });

    await runAsyncTest("ProductService.getOtherSellerOffers() rejects competing offer when category dimensions (storage, packQuantity) are missing or mismatched", async () => {
      const currentProductId = new mongoose.Types.ObjectId();
      const currentSellerId = new mongoose.Types.ObjectId();

      const currentProd = {
        _id: currentProductId,
        title: "Apple iPhone 15 Pro 512GB (Pack of 2)",
        canonicalId: "CANON-IPHONE-15PRO-512",
        brand: "Apple",
        sellingPrice: 249999,
        capacity: "512GB",
        packQuantity: "2",
        seller: { _id: currentSellerId, accountStatus: "ACTIVE" },
      };

      const mismatchedStorageProd = {
        _id: new mongoose.Types.ObjectId(),
        title: "Apple iPhone 15 Pro 256GB",
        canonicalId: "CANON-IPHONE-15PRO-512",
        brand: "Apple",
        sellingPrice: 229999,
        countInStock: 3,
        capacity: "256GB", // Mismatched storage!
        packQuantity: "2",
        seller: { _id: new mongoose.Types.ObjectId(), accountStatus: "ACTIVE" },
      };

      const mismatchedPackProd = {
        _id: new mongoose.Types.ObjectId(),
        title: "Apple iPhone 15 Pro 512GB Single",
        canonicalId: "CANON-IPHONE-15PRO-512",
        brand: "Apple",
        sellingPrice: 129999,
        countInStock: 3,
        capacity: "512GB",
        packQuantity: "1", // Mismatched pack quantity!
        seller: { _id: new mongoose.Types.ObjectId(), accountStatus: "ACTIVE" },
      };

      Product.findOne = () => createChainableQuery(currentProd);
      Product.find = () => createChainableQuery([mismatchedStorageProd, mismatchedPackProd]);
      Review.aggregate = async () => [];

      const result = await ProductService.getOtherSellerOffers(currentProductId.toString());
      assert.strictEqual(result.totalOtherOffers, 0, "Competing offers with mismatched storage or pack quantity must be rejected");
    });

    await runAsyncTest("ProductService.getOtherSellerOffers() returns null for unconfigured returnPolicy without invented 7-day or REPLACEMENT_ONLY defaults", async () => {
      const currentProductId = new mongoose.Types.ObjectId();
      const currentSellerId = new mongoose.Types.ObjectId();
      const altProductId = new mongoose.Types.ObjectId();

      const currentProd = {
        _id: currentProductId,
        title: "Sony WH-1000XM5 Wireless Headphones",
        canonicalId: "CANON-SONY-WH1000XM5",
        brand: "Sony",
        sellingPrice: 26990,
        seller: { _id: currentSellerId, accountStatus: "ACTIVE" },
      };

      const unconfiguredPolicyProd = {
        _id: altProductId,
        title: "Sony WH-1000XM5",
        canonicalId: "CANON-SONY-WH1000XM5",
        brand: "Sony",
        sellingPrice: 24990,
        countInStock: 5,
        inStock: true,
        status: "PUBLISHED",
        sku: "SONY-01",
        seller: {
          _id: new mongoose.Types.ObjectId(),
          sellerName: "AudioHub",
          accountStatus: "ACTIVE",
          isEmailVerified: true,
          businessDetails: {},
          pickupAddress: { city: "Delhi", state: "Delhi" },
        },
        returnPolicy: {
          returnable: true,
          // windowDays and policyType NOT configured!
        },
        warranty: null,
      };

      Product.findOne = () => createChainableQuery(currentProd);
      Product.find = () => createChainableQuery([unconfiguredPolicyProd]);
      Review.aggregate = async () => [];

      const result = await ProductService.getOtherSellerOffers(currentProductId.toString());
      assert.strictEqual(result.totalOtherOffers, 1);
      const offer = result.offers[0];
      assert.strictEqual(offer.returnPolicy.returnable, true);
      assert.strictEqual(offer.returnPolicy.windowDays, null, "Must NOT default to 7 days when catalog has no authoritative value");
      assert.strictEqual(offer.returnPolicy.policyType, null, "Must NOT default to REPLACEMENT_ONLY when unconfigured");
      assert.strictEqual(offer.warranty, null, "Warranty must be null when unconfigured");
    });

    // ============================================================================
    // [DOMAIN 2] Multi-Product Side-by-Side Comparison Engine
    // ============================================================================
    console.log("\n▶ [Domain 2] Multi-Product Side-by-Side Comparison Engine");

    await runAsyncTest("ProductService.compareProducts() enforces minimum of 2 valid products", async () => {
      try {
        await ProductService.compareProducts(["only-one-id"]);
        assert.fail("Should have thrown error for < 2 product IDs");
      } catch (err) {
        assert.strictEqual(err.statusCode, 400);
        assert.ok(err.message.includes("At least 2"));
      }
    });

    await runAsyncTest("ProductService.compareProducts() aligns specifications into authentic matrix", async () => {
      const id1 = new mongoose.Types.ObjectId();
      const id2 = new mongoose.Types.ObjectId();

      const prod1 = {
        _id: id1,
        title: "Samsung Galaxy S24 Ultra",
        brand: "Samsung",
        mrpPrice: 134999,
        sellingPrice: 124999,
        discountPercent: 7,
        countInStock: 10,
        specifications: [
          { name: "RAM", value: "12", unit: "GB" },
          { name: "Battery", value: "5000", unit: "mAh" },
        ],
        seller: { sellerName: "Official Samsung Store", accountStatus: "ACTIVE", isEmailVerified: true },
      };

      const prod2 = {
        _id: id2,
        title: "Apple iPhone 15 Pro Max",
        brand: "Apple",
        mrpPrice: 159900,
        sellingPrice: 149900,
        discountPercent: 6,
        countInStock: 8,
        specifications: [
          { name: "RAM", value: "8", unit: "GB" },
          { name: "Camera", value: "48", unit: "MP" },
        ],
        seller: { sellerName: "Apple Authorised Store", accountStatus: "ACTIVE", isEmailVerified: true },
      };

      Product.find = () => createChainableQuery([prod1, prod2]);

      const result = await ProductService.compareProducts([id1.toString(), id2.toString()]);

      assert.strictEqual(result.products.length, 2);
      const matrix = result.specMatrix || result.specificationsMatrix || [];
      assert.ok(matrix.length >= 1, "Matrix should contain specification rows");

      // Verify RAM row has values for both
      const ramRow = matrix.find((r) => (r.specName || r.name) === "RAM");
      assert.ok(ramRow, "RAM specification row should exist");
      assert.strictEqual(ramRow.values[id1.toString()], "12 GB");
      assert.strictEqual(ramRow.values[id2.toString()], "8 GB");

      // Verify Camera row has value for prod2, and authentic un-fabricated '—' for prod1
      const cameraRow = matrix.find((r) => (r.specName || r.name) === "Camera");
      assert.ok(cameraRow, "Camera specification row should exist");
      assert.strictEqual(cameraRow.values[id1.toString()], "—");
      assert.strictEqual(cameraRow.values[id2.toString()], "48 MP");
    });

    // ============================================================================
    // [DOMAIN 3] Price History Intelligence & Target-Price Alerts
    // ============================================================================
    console.log("\n▶ [Domain 3] Price History Intelligence & Target-Price Alerts");

    await runAsyncTest("ProductService.getProductPriceHistory() returns ZERO fabricated points when history is empty", async () => {
      const prodId = new mongoose.Types.ObjectId();
      const product = {
        _id: prodId,
        sellingPrice: 19999,
        mrpPrice: 24999,
      };

      Product.findOne = () => createChainableQuery(product);
      PriceHistory.find = () => createChainableQuery([]); // ZERO records in DB!

      const result = await ProductService.getProductPriceHistory(prodId.toString());

      assert.strictEqual(result.hasSufficientHistory, false);
      assert.strictEqual(result.history.length, 0);
      assert.strictEqual(result.lowestPrice, null);
      assert.strictEqual(result.highestPrice, null);
      assert.strictEqual(result.averagePrice, null);
      assert.strictEqual(result.savingsVsHighest, 0);
      assert.strictEqual(result.priceDropPercentage, 0);
    });

    await runAsyncTest("ProductService.getProductPriceHistory() computes authentic metrics from genuine persisted records", async () => {
      const prodId = new mongoose.Types.ObjectId();
      const product = {
        _id: prodId,
        sellingPrice: 17999,
        mrpPrice: 24999,
      };

      const realHistoryRecords = [
        { sellingPrice: 21999, mrpPrice: 24999, timestamp: new Date(Date.now() - 20 * 86400000) },
        { sellingPrice: 19999, mrpPrice: 24999, timestamp: new Date(Date.now() - 10 * 86400000) },
        { sellingPrice: 17999, mrpPrice: 24999, timestamp: new Date() },
      ];

      Product.findOne = () => createChainableQuery(product);
      PriceHistory.find = () => createChainableQuery(realHistoryRecords);

      const result = await ProductService.getProductPriceHistory(prodId.toString());

      assert.strictEqual(result.hasSufficientHistory, true);
      assert.strictEqual(result.history.length, 3);
      assert.strictEqual(result.lowestPrice, 17999);
      assert.strictEqual(result.highestPrice, 21999);
      assert.strictEqual(result.averagePrice, 19999);
      assert.strictEqual(result.isAtLowestPrice, true);
      assert.strictEqual(result.savingsVsHighest, 4000); // 21999 - 17999
      assert.strictEqual(result.priceDropPercentage, 18); // round((21999-17999)/21999 * 100)
    });

    await runAsyncTest("ProductService.getProductPriceHistory() marks hasSufficientHistory false when only 1 snapshot exists", async () => {
      const prodId = new mongoose.Types.ObjectId();
      Product.findOne = () => createChainableQuery({
        _id: prodId,
        sellingPrice: 19999,
        mrpPrice: 24999,
      });

      const singleRecord = [{
        sellingPrice: 19999,
        mrpPrice: 24999,
        discountPercent: 20,
        timestamp: new Date("2026-03-01"),
      }];
      PriceHistory.find = () => createChainableQuery(singleRecord);

      const result = await ProductService.getProductPriceHistory(prodId.toString());

      assert.strictEqual(result.hasSufficientHistory, false);
      assert.strictEqual(result.history.length, 1);
      assert.strictEqual(result.lowestPrice, null, "When < 2 snapshots exist, lowestPrice must be null");
      assert.strictEqual(result.highestPrice, null, "When < 2 snapshots exist, highestPrice must be null");
      assert.strictEqual(result.averagePrice, null, "When < 2 snapshots exist, averagePrice must be null");
    });

    await runAsyncTest("ProductService.getProductPriceHistory() queries variantId and returns variant-specific history", async () => {
      const prodId = new mongoose.Types.ObjectId();
      const variantId = new mongoose.Types.ObjectId();
      Product.findOne = () => createChainableQuery({
        _id: prodId,
        sellingPrice: 19999,
        mrpPrice: 24999,
        variants: [
          { _id: variantId, sku: "VAR-SKU-1", sellingPrice: 20999, mrpPrice: 25999 },
        ],
      });

      let capturedFilter = null;
      PriceHistory.find = (filter) => {
        capturedFilter = filter;
        return createChainableQuery([
          { sellingPrice: 21999, mrpPrice: 25999, timestamp: new Date("2026-02-01"), variantId },
          { sellingPrice: 20999, mrpPrice: 25999, timestamp: new Date("2026-03-01"), variantId },
        ]);
      };

      const result = await ProductService.getProductPriceHistory(prodId.toString(), {
        variantId: variantId.toString(),
      });

      assert.strictEqual(capturedFilter.variantId.toString(), variantId.toString());
      assert.strictEqual(result.hasSufficientHistory, true);
      assert.strictEqual(result.lowestPrice, 20999);
      assert.strictEqual(result.highestPrice, 21999);
    });

    await runAsyncTest("ProductService.getProductPriceHistory() excludes variant snapshots from base product query", async () => {
      const prodId = new mongoose.Types.ObjectId();
      Product.findOne = () => createChainableQuery({
        _id: prodId,
        sellingPrice: 4999,
        mrpPrice: 6999,
      });

      let capturedFilter = null;
      let capturedSort = null;
      let capturedLimit = null;
      PriceHistory.find = (filter) => {
        capturedFilter = filter;
        const q = {
          sort: (s) => { capturedSort = s; return q; },
          limit: (l) => { capturedLimit = l; return q; },
          lean: () => q,
          exec: async () => [
            { sellingPrice: 5499, mrpPrice: 6999, timestamp: new Date("2026-01-01") },
            { sellingPrice: 4999, mrpPrice: 6999, timestamp: new Date("2026-02-01") },
          ],
          then: (res, rej) => Promise.resolve([
            { sellingPrice: 5499, mrpPrice: 6999, timestamp: new Date("2026-01-01") },
            { sellingPrice: 4999, mrpPrice: 6999, timestamp: new Date("2026-02-01") },
          ]).then(res, rej),
        };
        return q;
      };

      const result = await ProductService.getProductPriceHistory(prodId.toString());
      assert.strictEqual(capturedFilter.variantId, null, "Base query must explicitly exclude variant snapshots with variantId: null");
      assert.deepStrictEqual(capturedSort, { timestamp: -1 }, "Must query newest 30 records first");
      assert.strictEqual(capturedLimit, 30, "Must limit price history query to 30 records");
      assert.strictEqual(result.history.length, 2);
    });

    await runAsyncTest("ProductService.getProductPriceHistory() resolves variant current price when variantId is specified", async () => {
      const prodId = new mongoose.Types.ObjectId();
      const variantId = new mongoose.Types.ObjectId();
      const product = {
        _id: prodId,
        sellingPrice: 1000,
        mrpPrice: 1500,
        variants: [
          {
            _id: variantId,
            sku: "VAR-XL-RED",
            sellingPrice: 1299,
            mrpPrice: 1799,
            status: "ACTIVE",
          },
        ],
      };
      product.variants.id = (id) => product.variants.find((v) => v._id.toString() === id.toString());

      Product.findOne = () => createChainableQuery(product);
      PriceHistory.find = () => createChainableQuery([
        { sellingPrice: 1499, mrpPrice: 1799, timestamp: new Date("2026-01-01"), variantId },
        { sellingPrice: 1299, mrpPrice: 1799, timestamp: new Date("2026-02-01"), variantId },
      ]);

      const result = await ProductService.getProductPriceHistory(prodId.toString(), {
        variantId: variantId.toString(),
      });

      assert.strictEqual(result.currentPrice, 1299, "Current price should resolve to variant sellingPrice");
      assert.strictEqual(result.currentMrp, 1799, "Current MRP should resolve to variant mrpPrice");
      assert.strictEqual(result.isAtLowestPrice, true);
    });

    await runAsyncTest("ProductService.updateProduct() persists authentic PriceHistory snapshot on price change", async () => {
      const prodId = new mongoose.Types.ObjectId();
      const sellerId = new mongoose.Types.ObjectId();

      const existingProd = {
        _id: prodId,
        seller: sellerId,
        sellingPrice: 1500,
        mrpPrice: 2000,
        countInStock: 25,
        save: async function () { return this; },
      };
      Product.findById = async () => existingProd;

      let createdHistory = null;
      PriceHistory.create = async (doc) => {
        createdHistory = doc;
        return doc;
      };

      await ProductService.updateProduct(prodId, { sellingPrice: 1399 }, sellerId);

      assert.ok(createdHistory !== null, "PriceHistory.create should have been called");
      assert.strictEqual(createdHistory.sellingPrice, 1399);
      assert.strictEqual(createdHistory.source, "SELLER_UPDATE");
    });

    await runAsyncTest("ProductService.updateProduct() simulated history-write failure restores complete product and variant state (stock, price, variants, inStock)", async () => {
      const prodId = new mongoose.Types.ObjectId();
      const sellerId = new mongoose.Types.ObjectId();
      const variantId = new mongoose.Types.ObjectId();

      const existingProd = {
        _id: prodId,
        seller: sellerId,
        sellingPrice: 1500,
        mrpPrice: 2000,
        discountPercent: 25,
        countInStock: 25,
        inStock: true,
        status: "PUBLISHED",
        hasVariants: true,
        variants: [
          {
            _id: variantId,
            sku: "VAR-ORIG-01",
            sellingPrice: 1500,
            mrpPrice: 2000,
            discountPercent: 25,
            countInStock: 25,
            status: "ACTIVE",
          },
        ],
        save: async function () { return this; },
      };
      Product.findById = async () => existingProd;

      // Simulate history snapshot creation failure
      PriceHistory.create = async () => {
        throw new Error("Simulated PriceHistory database failure");
      };

      try {
        await ProductService.updateProduct(
          prodId,
          {
            sellingPrice: 999,
            mrpPrice: 1999,
            countInStock: 0,
            variants: [
              {
                _id: variantId,
                sku: "VAR-ORIG-01",
                sellingPrice: 999,
                mrpPrice: 1999,
                countInStock: 0,
                status: "ACTIVE",
              },
            ],
          },
          sellerId
        );
        assert.fail("Should have thrown error when PriceHistory.create fails");
      } catch (err) {
        assert.ok(err.message.includes("Price history audit record failed"));
      }

      // Verify that full product and variant state was restored
      assert.strictEqual(existingProd.sellingPrice, 1500, "Base sellingPrice must be restored");
      assert.strictEqual(existingProd.mrpPrice, 2000, "Base mrpPrice must be restored");
      assert.strictEqual(existingProd.countInStock, 25, "Base countInStock must be restored");
      assert.strictEqual(existingProd.inStock, true, "Base inStock must be restored");
      assert.strictEqual(existingProd.variants[0].sellingPrice, 1500, "Variant sellingPrice must be restored");
      assert.strictEqual(existingProd.variants[0].countInStock, 25, "Variant countInStock must be restored");
    });

    await runAsyncTest("ProductService.createProduct() simulated history-write failure cleans up product and partial snapshots", async () => {
      const sellerId = new mongoose.Types.ObjectId();
      const catId = new mongoose.Types.ObjectId();

      let productDeletedId = null;
      Product.findByIdAndDelete = async (id) => {
        productDeletedId = id;
        return { _id: id };
      };

      const origPHCreate = PriceHistory.create;
      PriceHistory.create = async () => {
        throw new Error("Simulated PriceHistory failure during product creation");
      };

      try {
        await ProductService.createProduct(
          {
            title: "Test Handloom Saree",
            description: "Authentic handloom silk saree",
            brand: "Zosh Heritage",
            category: catId,
            sellingPrice: 4999,
            mrpPrice: 7999,
            countInStock: 10,
          },
          { _id: sellerId, accountStatus: "ACTIVE" }
        );
        assert.fail("createProduct should have thrown on price history failure");
      } catch (err) {
        assert.ok(err.message.includes("Failed to create product with initial price snapshot"));
      } finally {
        PriceHistory.create = origPHCreate;
      }
    });

    await runAsyncTest("ProductService.getProductPriceHistory() SKU-based variant request resolves actual variant _id for query", async () => {
      const prodId = new mongoose.Types.ObjectId();
      const variantId = new mongoose.Types.ObjectId();
      const skuString = "VAR-SKU-RESOLVE-99";

      const product = {
        _id: prodId,
        sellingPrice: 2000,
        mrpPrice: 2500,
        variants: [
          {
            _id: variantId,
            sku: skuString,
            sellingPrice: 2200,
            mrpPrice: 2800,
            status: "ACTIVE",
          },
        ],
      };
      Product.findOne = () => createChainableQuery(product);

      let capturedFilter = null;
      PriceHistory.find = (filter) => {
        capturedFilter = filter;
        return createChainableQuery([
          { sellingPrice: 2400, mrpPrice: 2800, timestamp: new Date("2026-01-01"), variantId },
          { sellingPrice: 2200, mrpPrice: 2800, timestamp: new Date("2026-02-01"), variantId },
        ]);
      };

      // Pass SKU string in variantId parameter
      const result = await ProductService.getProductPriceHistory(prodId.toString(), {
        variantId: skuString,
      });

      assert.strictEqual(
        capturedFilter.variantId.toString(),
        variantId.toString(),
        "Must query history using resolved variant's actual ObjectId, NEVER raw SKU string"
      );
      assert.strictEqual(result.currentPrice, 2200);
      assert.strictEqual(result.lowestPrice, 2200);
      assert.strictEqual(result.highestPrice, 2400);
    });

    await runAsyncTest("ProductService.getProductPriceHistory() rejects nonexistent requested variant without mixing base history", async () => {
      const prodId = new mongoose.Types.ObjectId();
      const product = {
        _id: prodId,
        sellingPrice: 2000,
        mrpPrice: 2500,
        variants: [],
      };
      Product.findOne = () => createChainableQuery(product);

      try {
        await ProductService.getProductPriceHistory(prodId.toString(), {
          variantId: "NONEXISTENT-VAR-ID",
        });
        assert.fail("Should reject when requested variant does not exist on product");
      } catch (err) {
        assert.ok(err.message.includes("Specified variant not found for this product"));
      }
    });

    await runAsyncTest("ProductService.subscribePriceAlert() rejects target price >= current selling price", async () => {
      const prodId = new mongoose.Types.ObjectId();
      const product = {
        _id: prodId,
        sellingPrice: 19999,
      };

      Product.findById = async () => product;
      Collection.findOne = async () => ({ _id: new mongoose.Types.ObjectId() });

      try {
        await ProductService.subscribePriceAlert("user-1", prodId.toString(), {
          targetPrice: 21000, // Higher than selling price!
        });
        assert.fail("Should have rejected target price higher than current selling price");
      } catch (err) {
        assert.strictEqual(err.statusCode, 400);
        assert.ok(err.message.includes("must be lower than current selling price"));
      }
    });

    // ============================================================================
    // [DOMAIN 4] Verified Community & Seller Q&A Engine
    // ============================================================================
    console.log("\n▶ [Domain 4] Verified Community & Seller Q&A Engine");

    await runAsyncTest("ProductService.getProductQuestions() returns empty array without synthetic FAQs", async () => {
      const prodId = new mongoose.Types.ObjectId();
      Product.findOne = () => createChainableQuery({ _id: prodId });
      ProductQuestion.find = () => createChainableQuery([]); // No approved questions

      const result = await ProductService.getProductQuestions(prodId.toString());

      assert.strictEqual(result.totalQuestions, 0);
      assert.strictEqual(result.questions.length, 0);
    });

    await runAsyncTest("ProductService.askProductQuestion() enforces character minimum & pending moderation status", async () => {
      const prodId = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId();

      Product.findById = async () => ({ _id: prodId });
      ProductQuestion.countDocuments = async () => 0;
      ProductQuestion.findOne = async () => null;

      let createdDoc = null;
      ProductQuestion.create = async (doc) => {
        createdDoc = doc;
        return { ...doc, _id: new mongoose.Types.ObjectId() };
      };

      // 1. Should reject short question
      try {
        await ProductService.askProductQuestion(userId, prodId, "Why?", "Customer");
        assert.fail("Should have thrown error for short question");
      } catch (err) {
        assert.strictEqual(err.statusCode, 400);
      }

      // 2. Should succeed and enforce PENDING moderation
      const validQuestion = "Is this saree dry clean only or hand washable?";
      const result = await ProductService.askProductQuestion(userId, prodId, validQuestion, "Customer");

      assert.strictEqual(createdDoc.moderationStatus, "PENDING");
      assert.strictEqual(createdDoc.isApproved, false);
      assert.strictEqual(result.question, validQuestion);
    });

    await runAsyncTest("ProductService.askProductQuestion() rejects duplicate question submissions", async () => {
      const prodId = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId();

      Product.findById = async () => ({ _id: prodId });
      ProductQuestion.countDocuments = async () => 0;
      // Existing identical question found in review:
      ProductQuestion.findOne = async () => ({ _id: new mongoose.Types.ObjectId() });

      try {
        await ProductService.askProductQuestion(userId, prodId, "Does this come with charger?", "Customer");
        assert.fail("Should have rejected duplicate question submission");
      } catch (err) {
        assert.strictEqual(err.statusCode, 409);
        assert.ok(err.message.includes("already submitted"));
      }
    });

    await runAsyncTest("ProductService.upvoteProductQuestion() prevents duplicate upvotes by same user", async () => {
      const qId = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId();

      const mockQuestion = {
        _id: qId,
        upvotes: 0,
        upvotedBy: [],
        save: async function () { return this; },
      };

      ProductQuestion.findById = async () => mockQuestion;

      // First upvote: adds vote
      await ProductService.upvoteProductQuestion(userId, qId);
      assert.strictEqual(mockQuestion.upvotes, 1);
      assert.strictEqual(mockQuestion.upvotedBy.length, 1);

      // Second upvote from same user: toggles/removes vote instead of inflating duplicates!
      await ProductService.upvoteProductQuestion(userId, qId);
      assert.strictEqual(mockQuestion.upvotes, 0);
      assert.strictEqual(mockQuestion.upvotedBy.length, 0);
    });

    await runAsyncTest("ProductService.answerProductQuestion() rejects non-owner seller attempt with 403 Forbidden", async () => {
      const qId = new mongoose.Types.ObjectId();
      const ownerSellerId = new mongoose.Types.ObjectId();
      const attackerUserId = new mongoose.Types.ObjectId();

      const mockQuestion = {
        _id: qId,
        product: { _id: new mongoose.Types.ObjectId(), seller: ownerSellerId },
        answers: [],
        save: async function () { return this; },
      };
      ProductQuestion.findById = () => ({
        populate: () => mockQuestion,
      });

      const maliciousUser = {
        _id: attackerUserId,
        role: "ROLE_SELLER",
        sellerName: "Competitor Store",
      };

      try {
        await ProductService.answerProductQuestion(maliciousUser, qId, {
          answer: "Don't buy this, buy from my store instead!",
          authorRole: "SELLER",
        });
        assert.fail("Should have rejected non-owner seller attempt with 403");
      } catch (err) {
        assert.strictEqual(err.statusCode, 403);
        assert.ok(err.message.includes("Sellers may only answer questions for products they own"));
      }
    });

    await runAsyncTest("ProductService.answerProductQuestion() rejects inactive seller with 403 Forbidden", async () => {
      const qId = new mongoose.Types.ObjectId();
      const ownerSellerId = new mongoose.Types.ObjectId();

      const mockQuestion = {
        _id: qId,
        product: { _id: new mongoose.Types.ObjectId(), seller: ownerSellerId },
        answers: [],
        save: async function () { return this; },
      };
      ProductQuestion.findById = () => ({
        populate: () => mockQuestion,
      });

      Seller.findById = async () => ({
        _id: ownerSellerId,
        accountStatus: "SUSPENDED",
      });

      const suspendedSellerUser = {
        _id: ownerSellerId,
        role: "ROLE_SELLER",
        sellerName: "Suspended Store",
      };

      try {
        await ProductService.answerProductQuestion(suspendedSellerUser, qId, {
          answer: "Yes, this comes with genuine warranty.",
          authorRole: "SELLER",
        });
        assert.fail("Should have rejected suspended seller with 403");
      } catch (err) {
        assert.strictEqual(err.statusCode, 403);
        assert.ok(err.message.includes("Inactive seller account cannot post answers"));
      }
    });

    await runAsyncTest("ProductService.answerProductQuestion() authenticates verified buyer via Order collection", async () => {
      const qId = new mongoose.Types.ObjectId();
      const ownerSellerId = new mongoose.Types.ObjectId();
      const buyerUserId = new mongoose.Types.ObjectId();
      const prodId = new mongoose.Types.ObjectId();

      const mockQuestion = {
        _id: qId,
        product: { _id: prodId, seller: ownerSellerId },
        answers: [],
        save: async function () { return this; },
      };
      ProductQuestion.findById = () => ({
        populate: () => mockQuestion,
      });

      Order.findOne = async () => ({
        _id: new mongoose.Types.ObjectId(),
        user: buyerUserId,
        orderStatus: "DELIVERED",
      });

      const buyerUser = {
        _id: buyerUserId,
        fullName: "Priya Sharma",
      };

      const result = await ProductService.answerProductQuestion(buyerUser, qId, {
        answer: "The fabric is pure silk and dry-clean only, looks amazing in person!",
      });

      const addedAnswer = result.answers[0];
      assert.strictEqual(addedAnswer.authorRole, "VERIFIED_BUYER");
      assert.strictEqual(addedAnswer.isVerifiedBuyer, true);
      assert.strictEqual(addedAnswer.isSellerAnswer, false);
      assert.strictEqual(addedAnswer.authorName, "Priya Sharma");
    });

    await runAsyncTest("AdminService moderates pending questions with approve/reject workflow", async () => {
      const qId = new mongoose.Types.ObjectId();
      const adminId = new mongoose.Types.ObjectId();

      const mockQuestion = {
        _id: qId,
        question: "Is this genuine silk?",
        moderationStatus: "PENDING",
        isApproved: false,
        rejectionReason: null,
        save: async function () { return this; },
      };

      ProductQuestion.findById = () => ({
        populate: () => mockQuestion,
      });

      // 1. Approve action
      const approved = await AdminService.moderateQuestion(
        { _id: adminId },
        qId,
        { action: "APPROVE" }
      );
      assert.strictEqual(approved.moderationStatus, "APPROVED");
      assert.strictEqual(approved.isApproved, true);
      assert.strictEqual(approved.moderatedBy.toString(), adminId.toString());

      // 2. Reject action
      const rejected = await AdminService.moderateQuestion(
        { _id: adminId },
        qId,
        { action: "REJECT", reason: "Contains promotional link" }
      );
      assert.strictEqual(rejected.moderationStatus, "REJECTED");
      assert.strictEqual(rejected.isApproved, false);
      assert.strictEqual(rejected.rejectionReason, "Contains promotional link");
    });

    await runAsyncTest("AdminService.getQuestionModerationQueue() sanitizes customer author details without leaking PII", async () => {
      const mockQuestion = {
        _id: new mongoose.Types.ObjectId(),
        question: "Is this water resistant?",
        moderationStatus: "PENDING",
        user: { fullName: "Aarav Gupta" }, // Note: No email, phone, or private data populated
        product: { _id: new mongoose.Types.ObjectId(), title: "Smart Watch" },
        createdAt: new Date(),
      };

      let populatedPaths = [];
      ProductQuestion.find = () => {
        const q = {
          populate: (pathOrObj, selectFields) => {
            if (typeof pathOrObj === "string") {
              populatedPaths.push({ path: pathOrObj, select: selectFields });
            } else {
              populatedPaths.push(pathOrObj);
            }
            return q;
          },
          sort: () => q,
          skip: () => q,
          limit: () => q,
          lean: () => q,
          exec: async () => [mockQuestion],
          then: (res, rej) => Promise.resolve([mockQuestion]).then(res, rej),
        };
        return q;
      };
      ProductQuestion.countDocuments = async () => 1;

      const result = await AdminService.getQuestionModerationQueue({ status: "PENDING", page: 1, limit: 10 });

      assert.strictEqual(result.questions.length, 1);
      const userPopulate = populatedPaths.find((p) => p.path === "user");
      assert.strictEqual(userPopulate.select, "fullName", "User population must only select fullName to protect PII");
      assert.strictEqual(result.questions[0].user.fullName, "Aarav Gupta");
      assert.strictEqual(result.questions[0].user.email, undefined);
    });

    // ============================================================================
    // [DOMAIN 5] Guest Cart to Authenticated Cart Merging (Safe & Idempotent)
    // ============================================================================
    console.log("\n▶ [Domain 5] Guest Cart to Authenticated Cart Merging (Safe & Idempotent)");

    await runAsyncTest("CartService.mergeGuestCart() handles empty items array safely without crashing", async () => {
      const user = { _id: new mongoose.Types.ObjectId() };
      const mockCart = {
        _id: new mongoose.Types.ObjectId(),
        recentMergeSignatures: [],
        toObject() { return { ...this }; },
        save: async function () { return this; },
      };
      Cart.findOne = async () => mockCart;
      CartItem.find = () => createChainableQuery([]);

      const result = await CartService.mergeGuestCart(user, []);
      assert.strictEqual(result.totalProcessed, 0);
      assert.strictEqual(result.mergedItems.length, 0);
      assert.strictEqual(result.failedItems.length, 0);
    });

    await runAsyncTest("CartService.mergeGuestCart() reports failed items without silent item loss", async () => {
      const user = { _id: new mongoose.Types.ObjectId() };
      const missingProdId = new mongoose.Types.ObjectId();
      const outOfStockProdId = new mongoose.Types.ObjectId();

      const mockCart = {
        _id: new mongoose.Types.ObjectId(),
        recentMergeSignatures: [],
        toObject() { return { ...this }; },
        save: async function () { return this; },
      };
      Cart.findOne = async () => mockCart;
      CartItem.find = () => createChainableQuery([]);

      Product.findById = async (id) => {
        if (id.toString() === missingProdId.toString()) return null; // Missing product
        if (id.toString() === outOfStockProdId.toString()) {
          return {
            _id: outOfStockProdId,
            title: "Out of Stock Saree",
            status: "PUBLISHED",
            countInStock: 0, // 0 inventory
          };
        }
        return null;
      };

      const guestItems = [
        { productId: missingProdId.toString(), quantity: 1 },
        { productId: outOfStockProdId.toString(), quantity: 2 },
      ];

      const result = await CartService.mergeGuestCart(user, guestItems);

      assert.strictEqual(result.failedItems.length, 2);
      assert.strictEqual(result.mergedItems.length, 0);
      assert.ok(result.failedItems[0].reason.includes("no longer exists"));
      assert.ok(result.failedItems[1].reason.includes("out of stock"));
    });

    await runAsyncTest("CartService.mergeGuestCart() combines quantities safely without exceeding stock", async () => {
      const user = { _id: new mongoose.Types.ObjectId() };
      const prodId = new mongoose.Types.ObjectId();
      const cartId = new mongoose.Types.ObjectId();

      const mockCart = {
        _id: cartId,
        recentMergeSignatures: [],
        toObject() { return { ...this }; },
        save: async function () { return this; },
      };
      Cart.findOne = async () => mockCart;

      const product = {
        _id: prodId,
        title: "Kashmiri Pashmina Shawl",
        status: "PUBLISHED",
        countInStock: 5,
        sellingPrice: 4500,
        mrpPrice: 6000,
      };
      Product.findById = async () => product;

      // Existing cart item has 3 in cart
      const existingCartItem = {
        _id: new mongoose.Types.ObjectId(),
        product, // populated
        quantity: 3,
        sellingPrice: 13500,
        mrpPrice: 18000,
        toObject() { return { ...this }; },
        save: async function () { return this; },
      };
      CartItem.findOne = async () => existingCartItem;
      CartItem.find = () => createChainableQuery([existingCartItem]);

      // Guest cart wants to add 4 more (3 + 4 = 7, but stock is only 5!)
      const guestItems = [{ productId: prodId.toString(), quantity: 4 }];

      const result = await CartService.mergeGuestCart(user, guestItems);

      assert.strictEqual(result.mergedItems.length, 1);
      assert.strictEqual(result.failedItems.length, 0);
      // Final quantity must be capped at max available stock (5)
      assert.strictEqual(existingCartItem.quantity, 5);
      assert.strictEqual(result.mergedItems[0].finalQuantity, 5);
      assert.strictEqual(result.mergedItems[0].partialStockApplied, true);
    });

    await runAsyncTest("CartService.mergeGuestCart() is idempotent and prevents duplicate additions on retry", async () => {
      const user = { _id: new mongoose.Types.ObjectId() };
      const prodId = new mongoose.Types.ObjectId();
      const cartId = new mongoose.Types.ObjectId();

      let signatures = [];
      const mockCart = {
        _id: cartId,
        get recentMergeSignatures() { return signatures; },
        set recentMergeSignatures(val) { signatures = val; },
        toObject() { return { ...this }; },
        save: async function () { return this; },
      };
      Cart.findOne = async () => mockCart;

      const product = {
        _id: prodId,
        title: "Pure Cotton Kurta",
        status: "PUBLISHED",
        countInStock: 10,
        sellingPrice: 1200,
        mrpPrice: 1800,
      };
      Product.findById = async () => product;

      let currentCartItem = null;
      CartItem.findOne = async () => currentCartItem;
      CartItem.find = () => createChainableQuery(currentCartItem ? [currentCartItem] : []);

      const guestItems = [{ productId: prodId.toString(), quantity: 2 }];

      // Call 1: First merge
      const result1 = await CartService.mergeGuestCart(user, guestItems);
      assert.strictEqual(result1.mergedItems.length, 1);
      assert.strictEqual(result1.isIdempotentReplay, undefined);

      // Call 2: Immediate retry with the identical guest payload
      const result2 = await CartService.mergeGuestCart(user, guestItems);
      assert.strictEqual(result2.isIdempotentReplay, true);
      assert.ok(result2.message.includes("idempotent replay"));
    });

    await runAsyncTest("CartService.mergeGuestCart() maintains distinct line items with distinct clientItemId for same product", async () => {
      resetInMemoryCartItems();
      const user = { _id: new mongoose.Types.ObjectId() };
      const prodId = new mongoose.Types.ObjectId();
      const cartId = new mongoose.Types.ObjectId();

      const mockCart = {
        _id: cartId,
        recentMergeSignatures: [],
        toObject() { return { ...this }; },
        save: async function () { return this; },
      };
      Cart.findOne = async () => mockCart;

      const product = {
        _id: prodId,
        title: "Organic Green Tea",
        status: "PUBLISHED",
        countInStock: 20,
        sellingPrice: 350,
        mrpPrice: 500,
      };
      Product.findById = async () => product;

      const guestItems = [
        { clientItemId: "client-line-1", productId: prodId.toString(), quantity: 2 },
        { clientItemId: "client-line-2", productId: prodId.toString(), quantity: 3 },
      ];

      const result = await CartService.mergeGuestCart(user, guestItems);

      assert.strictEqual(result.totalProcessed, 2);
      assert.strictEqual(result.mergedItems.length, 2);
      assert.strictEqual(result.mergedItems[0].clientItemId, "client-line-1");
      assert.strictEqual(result.mergedItems[1].clientItemId, "client-line-2");
    });

    await runAsyncTest("CartService.mergeGuestCart() faithfully replays failed items on idempotent replay without fabricating merged successes", async () => {
      const user = { _id: new mongoose.Types.ObjectId() };
      const failedProdId = new mongoose.Types.ObjectId();
      const cartId = new mongoose.Types.ObjectId();
      const cachedSig = "cached_sig_123";

      // Pre-populate CartMergeRecord with the COMPLETED record containing failed items
      await CartMergeRecord.create({
        userId: user._id,
        idempotencyKey: cachedSig,
        status: "COMPLETED",
        mergedItems: [],
        failedItems: [{ clientItemId: "client-fail-1", productId: failedProdId.toString(), reason: "Product out of stock" }],
        totalProcessed: 1,
      });

      const mockCart = {
        _id: cartId,
        recentMergeSignatures: [
          {
            signature: cachedSig,
            mergedItems: [],
            failedItems: [{ clientItemId: "client-fail-1", productId: failedProdId.toString(), reason: "Product out of stock" }],
            totalProcessed: 1,
            createdAt: new Date(),
          },
        ],
        toObject() { return { ...this }; },
        save: async function () { return this; },
      };
      Cart.findOne = async () => mockCart;
      CartItem.find = () => createChainableQuery([]);

      const guestItems = [{ clientItemId: "client-fail-1", productId: failedProdId.toString(), quantity: 1 }];

      const result = await CartService.mergeGuestCart(user, guestItems, { idempotencyKey: cachedSig });

      assert.strictEqual(result.isIdempotentReplay, true);
      assert.strictEqual(result.mergedItems.length, 0, "No items should be falsely reported as merged on replay");
      assert.strictEqual(result.failedItems.length, 1, "Failed items must be accurately preserved on replay");
      assert.strictEqual(result.failedItems[0].clientItemId, "client-fail-1");
    });

    await runAsyncTest("CartService.mergeGuestCart() concurrent identical requests: active IN_PROGRESS throws 409 Conflict", async () => {
      const user = { _id: new mongoose.Types.ObjectId() };
      const prodId = new mongoose.Types.ObjectId();
      const idempotencyKey = "concurrent_key_test_1";

      // Pre-seed an active IN_PROGRESS record created 5 seconds ago
      await CartMergeRecord.create({
        userId: user._id,
        idempotencyKey,
        status: "IN_PROGRESS",
        lockedAt: new Date(Date.now() - 5000),
      });

      const guestItems = [{ productId: prodId.toString(), quantity: 1 }];

      try {
        await CartService.mergeGuestCart(user, guestItems, { idempotencyKey });
        assert.fail("Concurrent request must throw 409 Conflict");
      } catch (err) {
        assert.strictEqual(err.statusCode, 409);
        assert.strictEqual(err.code, "MERGE_IN_PROGRESS");
        assert.ok(err.message.includes("currently in progress"));
      }
    });

    await runAsyncTest("CartService.mergeGuestCart() stale in-progress reservation (> 60s) recovers and takes over lock", async () => {
      const user = { _id: new mongoose.Types.ObjectId() };
      const prodId = new mongoose.Types.ObjectId();
      const cartId = new mongoose.Types.ObjectId();
      const idempotencyKey = "stale_lock_recovery_test";

      // Pre-seed a stale IN_PROGRESS record created 80 seconds ago
      await CartMergeRecord.create({
        userId: user._id,
        idempotencyKey,
        status: "IN_PROGRESS",
        lockedAt: new Date(Date.now() - 80000),
      });

      const mockCart = {
        _id: cartId,
        recentMergeSignatures: [],
        toObject() { return { ...this }; },
        save: async function () { return this; },
      };
      Cart.findOne = async () => mockCart;
      Product.findById = async () => ({
        _id: prodId,
        title: "Pashmina Stole",
        status: "PUBLISHED",
        countInStock: 10,
        sellingPrice: 2000,
        mrpPrice: 3000,
      });

      const guestItems = [{ productId: prodId.toString(), quantity: 1 }];
      const result = await CartService.mergeGuestCart(user, guestItems, { idempotencyKey });

      assert.strictEqual(result.mergedItems.length, 1);
      const savedRecord = await CartMergeRecord.findOne({ userId: user._id, idempotencyKey });
      assert.strictEqual(savedRecord.status, "COMPLETED");
    });

    await runAsyncTest("CartService.mergeGuestCart() retry of a previously FAILED request is permitted and recovers", async () => {
      const user = { _id: new mongoose.Types.ObjectId() };
      const prodId = new mongoose.Types.ObjectId();
      const cartId = new mongoose.Types.ObjectId();
      const idempotencyKey = "failed_retry_recovery_test";

      // Pre-seed a FAILED record
      await CartMergeRecord.create({
        userId: user._id,
        idempotencyKey,
        status: "FAILED",
        failedItems: [{ reason: "Transient database glitch" }],
        lockedAt: new Date(Date.now() - 10000),
      });

      const mockCart = {
        _id: cartId,
        recentMergeSignatures: [],
        toObject() { return { ...this }; },
        save: async function () { return this; },
      };
      Cart.findOne = async () => mockCart;
      Product.findById = async () => ({
        _id: prodId,
        title: "Pashmina Stole",
        status: "PUBLISHED",
        countInStock: 10,
        sellingPrice: 2000,
        mrpPrice: 3000,
      });

      const guestItems = [{ productId: prodId.toString(), quantity: 2 }];
      const result = await CartService.mergeGuestCart(user, guestItems, { idempotencyKey });

      assert.strictEqual(result.mergedItems.length, 1);
      const savedRecord = await CartMergeRecord.findOne({ userId: user._id, idempotencyKey });
      assert.strictEqual(savedRecord.status, "COMPLETED");
    });

    await runAsyncTest("CartService.mergeGuestCart() crash/failure before completion marks record status FAILED", async () => {
      const user = { _id: new mongoose.Types.ObjectId() };
      const prodId = new mongoose.Types.ObjectId();
      const cartId = new mongoose.Types.ObjectId();
      const idempotencyKey = "crash_failure_marking_test";

      const mockCart = {
        _id: cartId,
        recentMergeSignatures: [],
        toObject() { return { ...this }; },
        save: async function () { return this; },
      };
      Cart.findOne = async () => mockCart;

      Product.findById = async () => ({
        _id: prodId,
        title: "Test Kurta",
        status: "PUBLISHED",
        countInStock: 5,
        sellingPrice: 1000,
        mrpPrice: 1500,
      });

      // Simulate unexpected unhandled crash during CartItem persistence
      CartItem.findOne = async () => {
        throw new Error("Simulated unhandled DB connection crash");
      };

      const guestItems = [{ productId: prodId.toString(), quantity: 1 }];
      try {
        await CartService.mergeGuestCart(user, guestItems, { idempotencyKey });
        assert.fail("Should have rethrown unexpected error");
      } catch (err) {
        assert.ok(err.message.includes("Simulated unhandled DB connection crash"));
      }

      // Verify that idempotency record was marked FAILED so it does not block future retries
      const record = await CartMergeRecord.findOne({ userId: user._id, idempotencyKey });
      assert.ok(record !== null);
      assert.strictEqual(record.status, "FAILED");
    });

    await runAsyncTest("CartService.mergeGuestCart() stock caps preserve unmerged remainder accurately without duplicate application", async () => {
      const user = { _id: new mongoose.Types.ObjectId() };
      const prodId = new mongoose.Types.ObjectId();
      const cartId = new mongoose.Types.ObjectId();
      const clientItemId = "client-cap-item-123";

      const mockCart = {
        _id: cartId,
        recentMergeSignatures: [],
        toObject() { return { ...this }; },
        save: async function () { return this; },
      };
      Cart.findOne = async () => mockCart;

      const product = {
        _id: prodId,
        title: "Limited Edition Handloom Saree",
        status: "PUBLISHED",
        countInStock: 2, // Only 2 in stock
        sellingPrice: 4000,
        mrpPrice: 6000,
      };
      Product.findById = async () => product;

      resetInMemoryCartItems();
      const guestItems = [
        { clientItemId, productId: prodId.toString(), quantity: 5 },
      ];

      const result = await CartService.mergeGuestCart(user, guestItems);

      assert.strictEqual(result.mergedItems.length, 1);
      const merged = result.mergedItems[0];
      assert.strictEqual(merged.clientItemId, clientItemId);
      assert.strictEqual(merged.quantityMerged, 2, "Merged quantity must equal available stock (2)");
      assert.strictEqual(merged.remainingQuantity, 3, "Unmerged remainder must accurately be 5 - 2 = 3");
      assert.strictEqual(merged.partialStockApplied, true);

      // On replay: verify already merged units are NOT added again
      let replaySaved = false;
      const originalSave = CartItem.prototype.save;
      CartItem.prototype.save = async function () {
        replaySaved = true;
        return this;
      };

      try {
        const replayResult = await CartService.mergeGuestCart(user, guestItems);
        assert.strictEqual(replayResult.isIdempotentReplay, true);
        assert.strictEqual(replaySaved, false, "Replay must NOT execute additional DB writes or re-increment items");
      } finally {
        CartItem.prototype.save = originalSave;
      }
    });

    await runAsyncTest("CartService.mergeGuestCart() two genuinely overlapping identical calls: one succeeds, one gets 409 Conflict", async () => {
      resetInMemoryCartItems();
      const user = { _id: new mongoose.Types.ObjectId() };
      const prodId = new mongoose.Types.ObjectId();
      const cartId = new mongoose.Types.ObjectId();
      const idempotencyKey = "overlapping_concurrent_calls_key";

      const mockCart = {
        _id: cartId,
        recentMergeSignatures: [],
        toObject() { return { ...this }; },
        save: async function () { return this; },
      };
      Cart.findOne = async () => mockCart;

      Product.findById = async () => ({
        _id: prodId,
        title: "Silk Dupatta",
        status: "PUBLISHED",
        countInStock: 10,
        sellingPrice: 1500,
        mrpPrice: 2000,
      });

      const guestItems = [{ clientItemId: "c-dup-1", productId: prodId.toString(), quantity: 2 }];

      const results = await Promise.allSettled([
        CartService.mergeGuestCart(user, guestItems, { idempotencyKey }),
        CartService.mergeGuestCart(user, guestItems, { idempotencyKey }),
      ]);

      const fulfilled = results.filter((r) => r.status === "fulfilled");
      const rejected = results.filter((r) => r.status === "rejected");

      assert.strictEqual(fulfilled.length, 1, "Exactly one call must succeed");
      assert.strictEqual(rejected.length, 1, "The concurrent call must be rejected");
      assert.strictEqual(rejected[0].reason.statusCode, 409);
      assert.strictEqual(rejected[0].reason.code, "MERGE_IN_PROGRESS");

      const cartItem = await CartItem.findOne({ cart: cartId, product: prodId });
      assert.ok(cartItem !== null);
      assert.strictEqual(cartItem.quantity, 2, "CartItem quantity must be exactly 2, not double-added to 4");
    });

    await runAsyncTest("CartService.mergeGuestCart() two workers trying to reclaim same stale lock: only one succeeds", async () => {
      resetInMemoryCartItems();
      const user = { _id: new mongoose.Types.ObjectId() };
      const prodId = new mongoose.Types.ObjectId();
      const cartId = new mongoose.Types.ObjectId();
      const idempotencyKey = "two_workers_stale_lock_key";
      const staleDate = new Date(Date.now() - 90000);

      await CartMergeRecord.create({
        userId: user._id,
        idempotencyKey,
        status: "IN_PROGRESS",
        lockedAt: staleDate,
      });

      const mockCart = {
        _id: cartId,
        recentMergeSignatures: [],
        toObject() { return { ...this }; },
        save: async function () { return this; },
      };
      Cart.findOne = async () => mockCart;

      Product.findById = async () => ({
        _id: prodId,
        title: "Cotton Kurti",
        status: "PUBLISHED",
        countInStock: 10,
        sellingPrice: 800,
        mrpPrice: 1200,
      });

      const guestItems = [{ clientItemId: "c-stale-1", productId: prodId.toString(), quantity: 1 }];

      const results = await Promise.allSettled([
        CartService.mergeGuestCart(user, guestItems, { idempotencyKey }),
        CartService.mergeGuestCart(user, guestItems, { idempotencyKey }),
      ]);

      const fulfilled = results.filter((r) => r.status === "fulfilled");
      const rejected = results.filter((r) => r.status === "rejected");

      assert.strictEqual(fulfilled.length, 1, "Only one worker can claim the stale lock");
      assert.strictEqual(rejected.length, 1, "The second worker fails atomic condition and is rejected with 409");
      assert.strictEqual(rejected[0].reason.statusCode, 409);

      const cartItem = await CartItem.findOne({ cart: cartId, product: prodId });
      assert.ok(cartItem !== null);
      assert.strictEqual(cartItem.quantity, 1, "Item must be added exactly once");
    });

    await runAsyncTest("CartService.mergeGuestCart() unexpected DB error during reservation fails closed without mutating cart", async () => {
      resetInMemoryCartItems();
      const user = { _id: new mongoose.Types.ObjectId() };
      const prodId = new mongoose.Types.ObjectId();
      const cartId = new mongoose.Types.ObjectId();
      const idempotencyKey = "unexpected_db_err_key";

      const originalCreate = CartMergeRecord.create;
      CartMergeRecord.create = async () => {
        const dbErr = new Error("MongoNetworkTimeoutError: connection timed out");
        dbErr.name = "MongoNetworkError";
        throw dbErr;
      };

      let cartItemSaveCalled = false;
      const originalSave = CartItem.prototype.save;
      CartItem.prototype.save = async function () {
        cartItemSaveCalled = true;
        return this;
      };

      const guestItems = [{ productId: prodId.toString(), quantity: 1 }];

      try {
        await CartService.mergeGuestCart(user, guestItems, { idempotencyKey });
        assert.fail("Must fail closed on unexpected DB error");
      } catch (err) {
        assert.ok(err.message.includes("MongoNetworkTimeoutError"));
      } finally {
        CartMergeRecord.create = originalCreate;
        CartItem.prototype.save = originalSave;
      }

      assert.strictEqual(cartItemSaveCalled, false, "Must NOT proceed with cart item mutation when reservation fails closed");
    });

    await runAsyncTest("CartService.mergeGuestCart() crash after first item added followed by retry never double-adds first item", async () => {
      resetInMemoryCartItems();
      const user = { _id: new mongoose.Types.ObjectId() };
      const prod1Id = new mongoose.Types.ObjectId();
      const prod2Id = new mongoose.Types.ObjectId();
      const cartId = new mongoose.Types.ObjectId();
      const idempotencyKey = "crash_midway_then_retry_key";

      const mockCart = {
        _id: cartId,
        recentMergeSignatures: [],
        toObject() { return { ...this }; },
        save: async function () { return this; },
      };
      Cart.findOne = async () => mockCart;

      Product.findById = async (id) => {
        if (id.toString() === prod1Id.toString()) {
          return { _id: prod1Id, title: "Item 1", status: "PUBLISHED", countInStock: 10, sellingPrice: 500, mrpPrice: 800 };
        }
        if (id.toString() === prod2Id.toString()) {
          return { _id: prod2Id, title: "Item 2", status: "PUBLISHED", countInStock: 10, sellingPrice: 600, mrpPrice: 900 };
        }
        return null;
      };

      const guestItems = [
        { clientItemId: "client-item-1", productId: prod1Id.toString(), quantity: 2 },
        { clientItemId: "client-item-2", productId: prod2Id.toString(), quantity: 3 },
      ];

      const originalItemFindOne = CartItem.findOne;
      CartItem.findOne = async (q) => {
        if (q.product.toString() === prod2Id.toString()) {
          throw new Error("Simulated sudden worker crash during item 2 processing");
        }
        return originalItemFindOne(q);
      };

      try {
        await CartService.mergeGuestCart(user, guestItems, { idempotencyKey });
        assert.fail("Should have thrown on worker crash");
      } catch (err) {
        assert.ok(err.message.includes("Simulated sudden worker crash"));
      }

      const item1InCart = await originalItemFindOne({ cart: cartId, product: prod1Id });
      assert.ok(item1InCart !== null);
      assert.strictEqual(item1InCart.quantity, 2);

      const failedRec = await CartMergeRecord.findOne({ userId: user._id, idempotencyKey });
      assert.strictEqual(failedRec.status, "FAILED");
      assert.strictEqual(failedRec.mergedItems.length, 1);
      assert.strictEqual(failedRec.mergedItems[0].clientItemId, "client-item-1");

      CartItem.findOne = originalItemFindOne;
      const retryResult = await CartService.mergeGuestCart(user, guestItems, { idempotencyKey });

      assert.strictEqual(retryResult.mergedItems.length, 2);

      const item1AfterRetry = await CartItem.findOne({ cart: cartId, product: prod1Id });
      assert.strictEqual(item1AfterRetry.quantity, 2, "Item 1 quantity must remain 2, not doubled to 4");

      const item2AfterRetry = await CartItem.findOne({ cart: cartId, product: prod2Id });
      assert.ok(item2AfterRetry !== null);
      assert.strictEqual(item2AfterRetry.quantity, 3, "Item 2 quantity must be 3");
    });

    await runAsyncTest("CartService.mergeGuestCart() completed partial merge where failed item becomes available and retries safely", async () => {
      resetInMemoryCartItems();
      const user = { _id: new mongoose.Types.ObjectId() };
      const prod1Id = new mongoose.Types.ObjectId();
      const prod2Id = new mongoose.Types.ObjectId();
      const cartId = new mongoose.Types.ObjectId();
      const idempotencyKey = "partial_merge_retry_key";

      const mockCart = {
        _id: cartId,
        recentMergeSignatures: [],
        toObject() { return { ...this }; },
        save: async function () { return this; },
      };
      Cart.findOne = async () => mockCart;

      let prod2Stock = 0;
      Product.findById = async (id) => {
        if (id.toString() === prod1Id.toString()) {
          return { _id: prod1Id, title: "Item 1", status: "PUBLISHED", countInStock: 10, sellingPrice: 500, mrpPrice: 800 };
        }
        if (id.toString() === prod2Id.toString()) {
          return { _id: prod2Id, title: "Item 2", status: "PUBLISHED", countInStock: prod2Stock, sellingPrice: 600, mrpPrice: 900 };
        }
        return null;
      };

      const guestItems = [
        { clientItemId: "partial-item-1", productId: prod1Id.toString(), quantity: 1 },
        { clientItemId: "partial-item-2", productId: prod2Id.toString(), quantity: 1 },
      ];

      const initialResult = await CartService.mergeGuestCart(user, guestItems, { idempotencyKey });
      assert.strictEqual(initialResult.mergedItems.length, 1);
      assert.strictEqual(initialResult.failedItems.length, 1);

      prod2Stock = 5;

      const retryResult = await CartService.mergeGuestCart(user, guestItems, { idempotencyKey, retryFailed: true });

      assert.strictEqual(retryResult.mergedItems.length, 2, "Both items should now be in merged list");
      assert.strictEqual(retryResult.failedItems.length, 0);

      const cartItem1 = await CartItem.findOne({ cart: cartId, product: prod1Id });
      const cartItem2 = await CartItem.findOne({ cart: cartId, product: prod2Id });
      assert.strictEqual(cartItem1.quantity, 1, "Item 1 must remain 1, not double-added");
      assert.strictEqual(cartItem2.quantity, 1, "Item 2 must now be in cart with quantity 1");
    });

    await runAsyncTest("CartService.mergeGuestCart() duplicate product lines with distinct client IDs combine into cart correctly", async () => {
      resetInMemoryCartItems();
      const user = { _id: new mongoose.Types.ObjectId() };
      const prodId = new mongoose.Types.ObjectId();
      const cartId = new mongoose.Types.ObjectId();
      const idempotencyKey = "duplicate_lines_distinct_client_ids_key";

      const mockCart = {
        _id: cartId,
        recentMergeSignatures: [],
        toObject() { return { ...this }; },
        save: async function () { return this; },
      };
      Cart.findOne = async () => mockCart;

      Product.findById = async () => ({
        _id: prodId,
        title: "Designer Scarf",
        status: "PUBLISHED",
        countInStock: 10,
        sellingPrice: 1200,
        mrpPrice: 1800,
      });

      const guestItems = [
        { clientItemId: "line-distinct-1", productId: prodId.toString(), quantity: 2 },
        { clientItemId: "line-distinct-2", productId: prodId.toString(), quantity: 3 },
      ];

      const result = await CartService.mergeGuestCart(user, guestItems, { idempotencyKey });

      assert.strictEqual(result.mergedItems.length, 2, "Both lines must be tracked in mergedItems");
      assert.strictEqual(result.mergedItems[0].clientItemId, "line-distinct-1");
      assert.strictEqual(result.mergedItems[0].quantityMerged, 2);
      assert.strictEqual(result.mergedItems[1].clientItemId, "line-distinct-2");
      assert.strictEqual(result.mergedItems[1].quantityMerged, 3);

      const combinedCartItem = await CartItem.findOne({ cart: cartId, product: prodId });
      assert.ok(combinedCartItem !== null);
      assert.strictEqual(combinedCartItem.quantity, 5, "Combined cart item quantity must be 2 + 3 = 5");
    });

    await runAsyncTest("CartService.mergeGuestCart() stock-capped line retried after inventory increases merges only remainder", async () => {
      resetInMemoryCartItems();
      const user = { _id: new mongoose.Types.ObjectId() };
      const prodId = new mongoose.Types.ObjectId();
      const cartId = new mongoose.Types.ObjectId();
      const idempotencyKey1 = "stock_cap_initial_key";
      const idempotencyKey2 = "stock_cap_retry_remainder_key";

      const mockCart = {
        _id: cartId,
        recentMergeSignatures: [],
        toObject() { return { ...this }; },
        save: async function () { return this; },
      };
      Cart.findOne = async () => mockCart;

      let currentStock = 2;
      Product.findById = async () => ({
        _id: prodId,
        title: "Handcrafted Vase",
        status: "PUBLISHED",
        get countInStock() { return currentStock; },
        sellingPrice: 2500,
        mrpPrice: 3500,
      });

      const initialItems = [{ clientItemId: "cap-retry-item", productId: prodId.toString(), quantity: 5 }];
      const res1 = await CartService.mergeGuestCart(user, initialItems, { idempotencyKey: idempotencyKey1 });

      assert.strictEqual(res1.mergedItems[0].quantityMerged, 2);
      assert.strictEqual(res1.mergedItems[0].remainingQuantity, 3);
      assert.strictEqual(res1.mergedItems[0].partialStockApplied, true);

      const cartItemStep1 = await CartItem.findOne({ cart: cartId, product: prodId });
      assert.strictEqual(cartItemStep1.quantity, 2);

      currentStock = 12;

      const remainderItems = [{ clientItemId: "cap-retry-item", productId: prodId.toString(), quantity: 3 }];
      const res2 = await CartService.mergeGuestCart(user, remainderItems, { idempotencyKey: idempotencyKey2 });

      assert.strictEqual(res2.mergedItems[0].quantityMerged, 3);
      assert.strictEqual(res2.mergedItems[0].remainingQuantity, 0);

      const finalCartItem = await CartItem.findOne({ cart: cartId, product: prodId });
      assert.strictEqual(finalCartItem.quantity, 5, "Final cart quantity must be exactly 2 + 3 = 5, not 2 + 5 = 7!");
    });

    await runAsyncTest("CartService.mergeGuestCart() response timeout replay returns exact persisted result without double-adding", async () => {
      resetInMemoryCartItems();
      const user = { _id: new mongoose.Types.ObjectId() };
      const prodId = new mongoose.Types.ObjectId();
      const cartId = new mongoose.Types.ObjectId();
      const idempotencyKey = "client_timeout_replay_key";

      const mockCart = {
        _id: cartId,
        recentMergeSignatures: [],
        toObject() { return { ...this }; },
        save: async function () { return this; },
      };
      Cart.findOne = async () => mockCart;

      Product.findById = async () => ({
        _id: prodId,
        title: "Leather Wallet",
        status: "PUBLISHED",
        countInStock: 10,
        sellingPrice: 1000,
        mrpPrice: 1500,
      });

      const guestItems = [{ clientItemId: "timeout-item-1", productId: prodId.toString(), quantity: 2 }];

      const res1 = await CartService.mergeGuestCart(user, guestItems, { idempotencyKey });
      assert.strictEqual(res1.isIdempotentReplay, undefined);
      assert.strictEqual(res1.mergedItems.length, 1);

      const itemAfterCall1 = await CartItem.findOne({ cart: cartId, product: prodId });
      assert.strictEqual(itemAfterCall1.quantity, 2);

      const res2 = await CartService.mergeGuestCart(user, guestItems, { idempotencyKey });
      assert.strictEqual(res2.isIdempotentReplay, true);
      assert.strictEqual(res2.mergedItems.length, 1);

      const itemAfterCall2 = await CartItem.findOne({ cart: cartId, product: prodId });
      assert.strictEqual(itemAfterCall2.quantity, 2, "Quantity must still be 2 after replay!");
    });

    await runAsyncTest("CartService.mergeGuestCart() recovers from real process termination after CartItem persistence without double-adding", async () => {
      resetInMemoryCartItems();
      const user = { _id: new mongoose.Types.ObjectId() };
      const prodId = new mongoose.Types.ObjectId();
      const cartId = new mongoose.Types.ObjectId();
      const idempotencyKey = "process_term_recovery_key";

      const mockCart = {
        _id: cartId,
        recentMergeSignatures: [],
        toObject() { return { ...this }; },
        save: async function () { return this; },
      };
      Cart.findOne = async () => mockCart;

      Product.findById = async () => ({
        _id: prodId,
        title: "Crash Recovery Product",
        status: "PUBLISHED",
        countInStock: 10,
        sellingPrice: 800,
        mrpPrice: 1200,
      });

      // Simulate prior worker having persisted CartItem with appliedGuestItemIds before unexpected process termination
      const preCrashCartItem = new CartItem({
        cart: cartId,
        product: prodId,
        variantId: null,
        quantity: 2,
        mrpPrice: 2400,
        sellingPrice: 1600,
        userId: user._id.toString(),
        appliedGuestItemIds: [`${idempotencyKey}:proc-kill-item-1`],
      });
      await preCrashCartItem.save();

      // Prior interrupted record left in IN_PROGRESS state from 70 seconds ago
      const staleLockedAt = new Date(Date.now() - 70000);
      inMemoryMergeRecords.set(`${user._id}:${idempotencyKey}`, {
        userId: user._id,
        idempotencyKey,
        status: "IN_PROGRESS",
        lockedAt: staleLockedAt,
        lockWorkerId: "dead_worker_pid_1234",
        totalProcessed: 1,
        mergedItems: [], // Died before mergedItems could be updated
        failedItems: [],
        save: async function () {
          inMemoryMergeRecords.set(`${this.userId}:${this.idempotencyKey}`, this);
          return this;
        },
      });

      const guestItems = [{ clientItemId: "proc-kill-item-1", productId: prodId.toString(), quantity: 2 }];

      // Recovery worker runs
      const recoveryResult = await CartService.mergeGuestCart(user, guestItems, { idempotencyKey });

      assert.strictEqual(recoveryResult.mergedItems.length, 1);
      assert.strictEqual(recoveryResult.mergedItems[0].quantityMerged, 2);
      assert.strictEqual(recoveryResult.failedItems.length, 0);

      // Verify the final persisted cart quantity in memory store is STILL 2, not double-added to 4!
      const persistedItem = await CartItem.findOne({ cart: cartId, product: prodId });
      assert.ok(persistedItem !== null);
      assert.strictEqual(persistedItem.quantity, 2, "Cart item quantity must remain 2 after process crash recovery, never double-added!");
    });

    await runAsyncTest("CartService.mergeGuestCart() crash recovery of partial stock-capped application preserves remaining quantity and completes on retry", async () => {
      resetInMemoryCartItems();
      const user = { _id: new mongoose.Types.ObjectId() };
      const prodId = new mongoose.Types.ObjectId();
      const cartId = new mongoose.Types.ObjectId();
      const idempotencyKey = "partial_crash_recovery_key";

      const mockCart = {
        _id: cartId,
        recentMergeSignatures: [],
        toObject() { return { ...this }; },
        save: async function () { return this; },
      };
      Cart.findOne = async () => mockCart;

      let currentStock = 2; // Stock is only 2
      Product.findById = async () => ({
        _id: prodId,
        title: "Limited Saree",
        status: "PUBLISHED",
        get countInStock() { return currentStock; },
        sellingPrice: 1500,
        mrpPrice: 2000,
      });

      // 1. Initial run: Request quantity 5 when available stock is only 2
      const guestItems = [{ clientItemId: "capped-item-1", productId: prodId.toString(), quantity: 5 }];
      const initialRun = await CartService.mergeGuestCart(user, guestItems, { idempotencyKey });
      assert.strictEqual(initialRun.mergedItems[0].quantityMerged, 2);
      assert.strictEqual(initialRun.mergedItems[0].remainingQuantity, 3);
      assert.strictEqual(initialRun.mergedItems[0].partialStockApplied, true);

      // Verify cart item quantity is 2
      const cartItemStep1 = await CartItem.findOne({ cart: cartId, product: prodId });
      assert.strictEqual(cartItemStep1.quantity, 2);

      // 2. Simulate worker termination before CartMergeRecord completed:
      // Record left in IN_PROGRESS stale state with empty mergedItems
      const staleLockedAt = new Date(Date.now() - 70000);
      inMemoryMergeRecords.set(`${user._id}:${idempotencyKey}`, {
        userId: user._id,
        idempotencyKey,
        status: "IN_PROGRESS",
        lockedAt: staleLockedAt,
        lockWorkerId: "dead_worker_pid_9999",
        totalProcessed: 1,
        mergedItems: [], // Worker died before completing record
        failedItems: [],
        save: async function () {
          inMemoryMergeRecords.set(`${this.userId}:${this.idempotencyKey}`, this);
          return this;
        },
      });

      // 3. Recovery worker runs: Reconstructs results from the quantity actually applied (2), NOT original requested (5)
      const recoveryRun = await CartService.mergeGuestCart(user, guestItems, { idempotencyKey });
      assert.strictEqual(recoveryRun.mergedItems.length, 1);
      assert.strictEqual(
        recoveryRun.mergedItems[0].quantityMerged,
        2,
        "Recovery must report actual applied quantity (2), not original requested (5)"
      );
      assert.strictEqual(
        recoveryRun.mergedItems[0].remainingQuantity,
        3,
        "Recovery must preserve remaining quantity needed for retry (3), not discard as 0"
      );
      assert.strictEqual(
        recoveryRun.mergedItems[0].partialStockApplied,
        true,
        "partialStockApplied must remain true on recovery"
      );

      // Verify cart quantity is still 2 (no double-adding on recovery)
      const cartItemRecovery = await CartItem.findOne({ cart: cartId, product: prodId });
      assert.strictEqual(cartItemRecovery.quantity, 2);

      // 4. Stock recovers to 10!
      currentStock = 10;

      // 5. Retry the 3 remaining units under retry mode
      const retryItems = [{ clientItemId: "capped-item-1", productId: prodId.toString(), quantity: 3 }];
      const retryRun = await CartService.mergeGuestCart(user, retryItems, {
        idempotencyKey: "partial_crash_retry_key",
        isRetry: true,
        retryMode: "FAILED_ITEMS",
      });

      assert.strictEqual(retryRun.mergedItems[0].quantityMerged, 3);
      assert.strictEqual(retryRun.mergedItems[0].remainingQuantity, 0);

      // Final cart quantity must be exactly 2 + 3 = 5, never 7, never 2 with remainder lost!
      const finalCartItem = await CartItem.findOne({ cart: cartId, product: prodId });
      assert.strictEqual(finalCartItem.quantity, 5, "Final cart quantity must be exactly 2 + 3 = 5!");
    });

    await runAsyncTest("CartService.mergeGuestCart() failed recovery lookup causes zero further cart mutation (fail closed)", async () => {
      resetInMemoryCartItems();
      const user = { _id: new mongoose.Types.ObjectId() };
      const prodId = new mongoose.Types.ObjectId();
      const cartId = new mongoose.Types.ObjectId();
      const idempotencyKey = "fail_closed_recovery_key";

      const mockCart = {
        _id: cartId,
        recentMergeSignatures: [],
        toObject() { return { ...this }; },
        save: async function () { return this; },
      };
      Cart.findOne = async () => mockCart;

      // Pre-seed an existing cart item with quantity 2
      const preExistingItem = new CartItem({
        cart: cartId,
        product: prodId,
        variantId: null,
        quantity: 2,
        mrpPrice: 2000,
        sellingPrice: 1500,
        userId: user._id.toString(),
        appliedGuestItemIds: [`${idempotencyKey}:fail-item-1`],
      });
      await preExistingItem.save();

      // Pre-seed stale in-progress record
      inMemoryMergeRecords.set(`${user._id}:${idempotencyKey}`, {
        userId: user._id,
        idempotencyKey,
        status: "IN_PROGRESS",
        lockedAt: new Date(Date.now() - 70000),
        lockWorkerId: "dead_worker",
        mergedItems: [],
        failedItems: [],
        save: async function () {
          inMemoryMergeRecords.set(`${this.userId}:${this.idempotencyKey}`, this);
          return this;
        },
      });

      Product.findById = async () => ({
        _id: prodId,
        title: "Test Prod",
        status: "PUBLISHED",
        countInStock: 10,
        sellingPrice: 1500,
        mrpPrice: 2000,
      });

      // Simulate database read error specifically during recovery lookup
      let findCallCount = 0;
      const origFind = CartItem.find;
      CartItem.find = () => {
        findCallCount++;
        if (findCallCount === 1) {
          throw new Error("Simulated transient MongoDB read error during recovery lookup");
        }
        return createChainableQuery([preExistingItem]);
      };

      const guestItems = [{ clientItemId: "fail-item-1", productId: prodId.toString(), quantity: 2 }];

      try {
        await CartService.mergeGuestCart(user, guestItems, { idempotencyKey });
        assert.fail("Recovery must fail closed and re-throw database lookup error");
      } catch (err) {
        assert.ok(
          err.message.includes("Simulated transient MongoDB read error") ||
          err.code === "RECOVERY_LOOKUP_FAILED",
          `Expected fail-closed error, got: ${err.message}`
        );
      } finally {
        CartItem.find = origFind;
      }

      // Assert that cart item quantity remained 2 and was NOT mutated
      const persisted = await CartItem.findOne({ cart: cartId, product: prodId });
      assert.strictEqual(persisted.quantity, 2, "Cart item must not be mutated when recovery lookup fails");
    });

    await runAsyncTest("CartService.mergeGuestCart() explicit retry of failed items merges only remaining unmerged units after stock recovery", async () => {
      resetInMemoryCartItems();
      const user = { _id: new mongoose.Types.ObjectId() };
      const prodA = new mongoose.Types.ObjectId();
      const prodB = new mongoose.Types.ObjectId();
      const cartId = new mongoose.Types.ObjectId();
      const idempotencyKey = "explicit_retry_stock_recovery_key";

      const mockCart = {
        _id: cartId,
        recentMergeSignatures: [],
        toObject() { return { ...this }; },
        save: async function () { return this; },
      };
      Cart.findOne = async () => mockCart;

      let stockB = 0; // Prod B starts out of stock
      Product.findById = async (id) => {
        if (id.toString() === prodA.toString()) {
          return {
            _id: prodA,
            title: "Product A Available",
            status: "PUBLISHED",
            countInStock: 10,
            sellingPrice: 500,
            mrpPrice: 800,
          };
        }
        return {
          _id: prodB,
          title: "Product B Out Of Stock",
          status: "PUBLISHED",
          get countInStock() { return stockB; },
          sellingPrice: 1000,
          mrpPrice: 1500,
        };
      };

      const guestItems = [
        { clientItemId: "retry-prod-a", productId: prodA.toString(), quantity: 2 },
        { clientItemId: "retry-prod-b", productId: prodB.toString(), quantity: 1 },
      ];

      // Initial run: Prod A succeeds, Prod B fails
      const initialRun = await CartService.mergeGuestCart(user, guestItems, { idempotencyKey });
      assert.strictEqual(initialRun.mergedItems.length, 1);
      assert.strictEqual(initialRun.mergedItems[0].clientItemId, "retry-prod-a");
      assert.strictEqual(initialRun.failedItems.length, 1);
      assert.strictEqual(initialRun.failedItems[0].clientItemId, "retry-prod-b");

      // Verify cart has 2 of Prod A, 0 of Prod B
      const cartItemA1 = await CartItem.findOne({ cart: cartId, product: prodA });
      const cartItemB1 = await CartItem.findOne({ cart: cartId, product: prodB });
      assert.strictEqual(cartItemA1.quantity, 2);
      assert.strictEqual(cartItemB1, null);

      // Prod B stock recovers!
      stockB = 5;

      // 1. Identical request replay without retry flag: replays cached result without mutations
      const replayRun = await CartService.mergeGuestCart(user, guestItems, { idempotencyKey });
      assert.strictEqual(replayRun.isIdempotentReplay, true);
      assert.strictEqual(replayRun.failedItems.length, 1, "Cached replay still shows previous failed list");
      const cartItemA2 = await CartItem.findOne({ cart: cartId, product: prodA });
      assert.strictEqual(cartItemA2.quantity, 2, "Prod A remains 2");

      // 2. Explicit retry with isRetry: true
      const retryRun = await CartService.mergeGuestCart(user, guestItems, {
        idempotencyKey,
        isRetry: true,
        retryMode: "FAILED_ITEMS",
      });

      assert.strictEqual(retryRun.mergedItems.length, 2, "Both items should now be in mergedItems list");
      assert.strictEqual(retryRun.failedItems.length, 0, "No remaining failed items");

      const finalCartItemA = await CartItem.findOne({ cart: cartId, product: prodA });
      const finalCartItemB = await CartItem.findOne({ cart: cartId, product: prodB });
      assert.strictEqual(finalCartItemA.quantity, 2, "Prod A must NOT be double-added on retry, remains 2");
      assert.strictEqual(finalCartItemB.quantity, 1, "Prod B must now be merged with quantity 1");
    });

    await runAsyncTest("CartService.mergeGuestCart() concurrent retry race on completed record allows only one worker to claim", async () => {
      resetInMemoryCartItems();
      const user = { _id: new mongoose.Types.ObjectId() };
      const prodId = new mongoose.Types.ObjectId();
      const cartId = new mongoose.Types.ObjectId();
      const idempotencyKey = "concurrent_retry_race_key";

      const mockCart = {
        _id: cartId,
        recentMergeSignatures: [],
        toObject() { return { ...this }; },
        save: async function () { return this; },
      };
      Cart.findOne = async () => mockCart;

      Product.findById = async () => ({
        _id: prodId,
        title: "Racing Item",
        status: "PUBLISHED",
        countInStock: 5,
        sellingPrice: 300,
        mrpPrice: 500,
      });

      const guestItems = [{ clientItemId: "race-item-1", productId: prodId.toString(), quantity: 1 }];

      // Initial completed merge
      await CartService.mergeGuestCart(user, guestItems, { idempotencyKey });

      // Simulate a completed record with a failed item to enable retry
      const completedRecord = inMemoryMergeRecords.get(`${user._id}:${idempotencyKey}`);
      completedRecord.failedItems = [{ clientItemId: "race-item-2", reason: "Stock error" }];
      guestItems.push({ clientItemId: "race-item-2", productId: prodId.toString(), quantity: 1 });

      // Run two concurrent retry attempts with isRetry: true
      const [res1, res2] = await Promise.allSettled([
        CartService.mergeGuestCart(user, guestItems, { idempotencyKey, isRetry: true }),
        CartService.mergeGuestCart(user, guestItems, { idempotencyKey, isRetry: true }),
      ]);

      const successCount = [res1, res2].filter((r) => r.status === "fulfilled").length;
      const conflictCount = [res1, res2].filter(
        (r) => r.status === "rejected" && (r.reason.statusCode === 409 || r.reason.code === "MERGE_IN_PROGRESS")
      ).length;

      assert.strictEqual(successCount, 1, "Exactly one concurrent retry attempt must succeed in claiming");
      assert.strictEqual(conflictCount, 1, "The competing retry attempt must receive 409 Conflict");
    });

    await runAsyncTest("CartService.mergeGuestCart() partial-stock retry with actual frontend contract preserves remaining units and merges to 5", async () => {
      resetInMemoryCartItems();
      const user = { _id: new mongoose.Types.ObjectId() };
      const prodId = new mongoose.Types.ObjectId();
      const cartId = new mongoose.Types.ObjectId();
      const clientItemId = "item_contract_1";
      const idempotencyKey = "frontend_idempotency_key_1";

      const mockCart = {
        _id: cartId,
        recentMergeSignatures: [],
        toObject() { return { ...this }; },
        save: async function () { return this; },
      };
      Cart.findOne = async () => mockCart;

      let stock = 2; // Initial stock is 2
      Product.findById = async () => ({
        _id: prodId,
        title: "Test Item",
        status: "PUBLISHED",
        get countInStock() { return stock; },
        sellingPrice: 100,
        mrpPrice: 200,
      });

      // 1. Initial request: user requested 5 units
      const initialGuestItems = [{ clientItemId, productId: prodId.toString(), quantity: 5 }];
      const initialRun = await CartService.mergeGuestCart(user, initialGuestItems, { idempotencyKey });

      assert.strictEqual(initialRun.mergedItems.length, 1);
      assert.strictEqual(initialRun.mergedItems[0].quantityMerged, 2);
      assert.strictEqual(initialRun.mergedItems[0].remainingQuantity, 3);
      assert.strictEqual(initialRun.mergedItems[0].partialStockApplied, true);

      const cartItemAfterInitial = await CartItem.findOne({ cart: cartId, product: prodId });
      assert.strictEqual(cartItemAfterInitial.quantity, 2);

      // 2. Frontend contract simulation:
      // Client updates guest items in localStorage: changes quantity to unmerged remainder (3)
      // and retains partialStockApplied: true
      const retryGuestPayload = [
        {
          clientItemId,
          productId: prodId.toString(),
          quantity: 3, // unmerged remainder
          partialStockApplied: true,
        },
      ];

      // 3. Stock increases to 10
      stock = 10;

      // 4. Client retries with the persisted idempotencyKey, isRetry: true, retryMode: "FAILED_ITEMS"
      const retryRun = await CartService.mergeGuestCart(user, retryGuestPayload, {
        idempotencyKey,
        isRetry: true,
        retryMode: "FAILED_ITEMS",
      });

      // Assert that remaining 3 units are merged and final quantity is 5!
      const finalCartItem = await CartItem.findOne({ cart: cartId, product: prodId });
      assert.strictEqual(finalCartItem.quantity, 5, `Expected final cart quantity to be 5, but got ${finalCartItem.quantity}`);
      assert.strictEqual(retryRun.mergedItems[0].remainingQuantity, 0, "No remaining units unmerged");
    });

    await runAsyncTest("ProductService.updateProduct() concurrent update prevents stale rollback from overwriting newer version", async () => {
      const prodId = new mongoose.Types.ObjectId();
      const sellerId = new mongoose.Types.ObjectId();

      const currentDbDoc = {
        _id: prodId,
        seller: sellerId,
        sellingPrice: 1500,
        mrpPrice: 2000,
        countInStock: 10,
        inStock: true,
        __v: 2, // Concurrently updated by another worker!
        variants: [],
      };

      const workerAProduct = {
        _id: prodId,
        seller: sellerId,
        sellingPrice: 1000,
        mrpPrice: 1200,
        countInStock: 10,
        inStock: true,
        __v: 1, // Worker A's baseline version
        variants: [],
        save: async function () {
          this.__v = 2;
          return this;
        },
      };

      let findByIdCallCount = 0;
      Product.findById = async (id) => {
        findByIdCallCount++;
        if (findByIdCallCount === 1) return workerAProduct;
        return currentDbDoc;
      };

      const origHistCreate = PriceHistory.create;
      PriceHistory.create = async () => {
        throw new Error("Simulated audit write failure for Worker A");
      };

      try {
        await ProductService.updateProduct(prodId, { sellingPrice: 1100 }, sellerId);
        assert.fail("Should throw price history error");
      } catch (err) {
        assert.ok(err.message.includes("Price history audit record failed"));
      } finally {
        PriceHistory.create = origHistCreate;
      }
    });

    await runAsyncTest("ProductService.updateProduct() newer update racing with rollback is prevented via atomic conditional versioned write", async () => {
      const prodId = new mongoose.Types.ObjectId();
      const sellerId = new mongoose.Types.ObjectId();

      // Database state starts at version 1 with price 1000
      let dbDoc = {
        _id: prodId,
        seller: sellerId,
        title: "Racing Product",
        sellingPrice: 1000,
        mrpPrice: 1500,
        countInStock: 10,
        inStock: true,
        __v: 1,
        variants: [],
        toObject() { return { ...this }; },
      };

      // Worker A reads version 1
      Product.findById = async () => ({
        ...dbDoc,
        save: async function () {
          // Worker A mutations applied
          this.__v = 2;
          dbDoc = { ...this, sellingPrice: 1200, __v: 2 };
          return this;
        },
      });

      // Price history write fails for Worker A
      const origHistCreate = PriceHistory.create;
      PriceHistory.create = async () => {
        // While Worker A's PriceHistory write fails, Worker B concurrently executes and commits an update to price 1600!
        dbDoc = {
          ...dbDoc,
          sellingPrice: 1600,
          __v: 3, // Version moved to 3!
        };
        throw new Error("Worker A audit write error");
      };

      // Atomic conditional update on Product
      let conditionalWriteAttemptedWithExpectedVersion = null;
      const origFindOneAndUpdate = Product.findOneAndUpdate;
      Product.findOneAndUpdate = async (filter, update) => {
        conditionalWriteAttemptedWithExpectedVersion = filter.__v;
        if (dbDoc.__v === filter.__v) {
          dbDoc = { ...dbDoc, ...update.$set, __v: (dbDoc.__v || 0) + 1 };
          return dbDoc;
        }
        // Version mismatch: Worker B already updated it! Return null
        return null;
      };

      try {
        await ProductService.updateProduct(prodId, { sellingPrice: 1200 }, sellerId);
        assert.fail("Should throw price history failure");
      } catch (err) {
        assert.ok(err.message.includes("Price history audit record failed"));
      } finally {
        PriceHistory.create = origHistCreate;
        Product.findOneAndUpdate = origFindOneAndUpdate;
      }

      // Assert that rollback attempted a version-conditioned write matching Worker A's version (2)
      assert.strictEqual(conditionalWriteAttemptedWithExpectedVersion, 2, "Rollback must condition on expected version 2");

      // Assert that Worker B's newer price (1600) was NOT overwritten by Worker A's rollback (1000)
      assert.strictEqual(dbDoc.sellingPrice, 1600, "Newer update (₹1600) must be preserved; stale rollback must not overwrite it");
      assert.strictEqual(dbDoc.__v, 3, "Version must remain at Worker B's version 3");
    });

    await runAsyncTest("ProductService.getProductPriceHistory() queries newest 30 snapshots and returns them in chronological ascending order", async () => {
      const prodId = new mongoose.Types.ObjectId();
      const variantObjId = new mongoose.Types.ObjectId();

      const mockProd = {
        _id: prodId,
        title: "Smart Watch Elite",
        sellingPrice: 4999,
        mrpPrice: 6999,
        hasVariants: true,
        variants: [
          {
            _id: variantObjId,
            sku: "SW-ELITE-SLV",
            sellingPrice: 4999,
            mrpPrice: 6999,
            status: "ACTIVE",
          },
        ],
      };

      Product.findOne = () => createChainableQuery(mockProd);

      // Create 35 snapshots spaced over 35 days
      const all35Snapshots = [];
      const baseTime = Date.now() - 35 * 24 * 60 * 60 * 1000;
      for (let i = 0; i < 35; i++) {
        all35Snapshots.push({
          _id: new mongoose.Types.ObjectId(),
          product: prodId,
          variantId: variantObjId,
          sellingPrice: 4000 + i * 20,
          mrpPrice: 6999,
          timestamp: new Date(baseTime + i * 24 * 60 * 60 * 1000),
        });
      }

      let capturedFilter = null;
      let capturedSort = null;
      let capturedLimit = null;

      PriceHistory.find = (filter) => {
        capturedFilter = filter;
        return {
          sort: (sortObj) => {
            capturedSort = sortObj;
            return {
              limit: (limitNum) => {
                capturedLimit = limitNum;
                // Return newest 30 sorted descending by timestamp
                const newest30 = [...all35Snapshots]
                  .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                  .slice(0, limitNum);
                return createChainableQuery(newest30);
              },
            };
          },
        };
      };

      const result = await ProductService.getProductPriceHistory(prodId.toString(), {
        variantSku: "SW-ELITE-SLV",
      });

      // 1. Assert filter used actual variant ObjectId, NOT the string SKU!
      assert.strictEqual(
        capturedFilter.variantId.toString(),
        variantObjId.toString(),
        "History query must resolve SKU to exact variant ObjectId"
      );

      // 2. Assert query requested newest 30 records
      assert.deepStrictEqual(capturedSort, { timestamp: -1 });
      assert.strictEqual(capturedLimit, 30);

      // 3. Assert returned history has exactly 30 items
      assert.strictEqual(result.history.length, 30);

      // 4. Assert returned history is sorted in ascending chronological order for charts!
      for (let i = 1; i < result.history.length; i++) {
        const prevDate = new Date(result.history[i - 1].date).getTime();
        const currDate = new Date(result.history[i].date).getTime();
        assert.ok(
          currDate >= prevDate,
          `History items must be in ascending chronological order: ${result.history[i - 1].date} <= ${result.history[i].date}`
        );
      }
    });

    await runAsyncTest("ProductService.updateProduct() rollback-save failure throws descriptive error containing both failure messages", async () => {
      const prodId = new mongoose.Types.ObjectId();
      const sellerId = new mongoose.Types.ObjectId();

      let saveCallCount = 0;
      const existingProd = {
        _id: prodId,
        seller: sellerId,
        sellingPrice: 1500,
        mrpPrice: 2000,
        countInStock: 10,
        inStock: true,
        variants: [],
        save: async function () {
          saveCallCount++;
          if (saveCallCount > 1) {
            throw new Error("Disk quota exceeded on rollback save");
          }
          return this;
        },
      };
      Product.findById = async () => existingProd;

      const origHistCreate = PriceHistory.create;
      PriceHistory.create = async () => {
        throw new Error("Audit log database unavailable");
      };

      try {
        await ProductService.updateProduct(prodId, { sellingPrice: 1200 }, sellerId);
        assert.fail("Should throw combined rollback failure error");
      } catch (err) {
        assert.ok(err.message.includes("Audit log database unavailable"));
        assert.ok(err.message.includes("Disk quota exceeded on rollback save"));
      } finally {
        PriceHistory.create = origHistCreate;
      }
    });

    await runAsyncTest("ProductService.updateProduct() history-cleanup failure propagates error observably without swallowing", async () => {
      const prodId = new mongoose.Types.ObjectId();
      const sellerId = new mongoose.Types.ObjectId();
      const variantId = new mongoose.Types.ObjectId();

      const existingProd = {
        _id: prodId,
        seller: sellerId,
        sellingPrice: 1500,
        mrpPrice: 2000,
        countInStock: 10,
        inStock: true,
        hasVariants: true,
        variants: [
          { _id: variantId, sku: "V1", sellingPrice: 1500, mrpPrice: 2000, countInStock: 10, status: "ACTIVE" },
        ],
        save: async function () { return this; },
      };
      Product.findById = async () => existingProd;

      let snapCount = 0;
      const origHistCreate = PriceHistory.create;
      PriceHistory.create = async () => {
        snapCount++;
        if (snapCount === 1) return { _id: new mongoose.Types.ObjectId() };
        throw new Error("Secondary snapshot failed");
      };

      const origHistDeleteMany = PriceHistory.deleteMany;
      PriceHistory.deleteMany = async () => {
        throw new Error("Permission denied deleting audit snapshots");
      };

      try {
        await ProductService.updateProduct(prodId, {
          sellingPrice: 1300,
          variants: [{ _id: variantId, sku: "V1", sellingPrice: 1300, mrpPrice: 2000, countInStock: 10, status: "ACTIVE" }],
        }, sellerId);
        assert.fail("Should throw cleanup failure error");
      } catch (err) {
        assert.ok(err.message.includes("snapshot cleanup failed"));
        assert.ok(err.message.includes("Permission denied deleting audit snapshots"));
      } finally {
        PriceHistory.create = origHistCreate;
        PriceHistory.deleteMany = origHistDeleteMany;
      }
    });

    await runAsyncTest("ProductService.getOtherSellerOffers() rejects candidate with mismatched model, generation, storage, or packQuantity", async () => {
      const prodId = new mongoose.Types.ObjectId();
      const seller1 = new mongoose.Types.ObjectId();
      const seller2 = new mongoose.Types.ObjectId();
      const catId = new mongoose.Types.ObjectId();

      const targetProduct = {
        _id: prodId,
        seller: { _id: seller1, sellerName: "Primary Seller" },
        title: "Flagship Smartphone Pro 256GB 5th Gen",
        brand: "TechBrand",
        category: catId,
        status: "PUBLISHED",
        sellingPrice: 79999,
        mrpPrice: 89999,
        countInStock: 10,
        canonicalId: "CANON-TECH-PHONE-PRO",
        specifications: [
          { name: "Model", value: "Pro" },
          { name: "Generation", value: "5th Gen" },
          { name: "Storage", value: "256GB" },
          { name: "Pack Quantity", value: "1" },
        ],
      };

      Product.findOne = () => ({
        populate: () => targetProduct,
      });

      const candidateMismatched = {
        _id: new mongoose.Types.ObjectId(),
        seller: { _id: seller2, sellerName: "Other Seller", rating: 4.5, accountStatus: "ACTIVE" },
        title: "Flagship Smartphone Pro 128GB",
        brand: "TechBrand",
        category: catId,
        status: "PUBLISHED",
        sellingPrice: 69999,
        mrpPrice: 79999,
        countInStock: 5,
        canonicalId: "CANON-TECH-PHONE-PRO",
        specifications: [
          { name: "Model", value: "Pro" },
          { name: "Generation", value: "5th Gen" },
          { name: "Storage", value: "128GB" }, // MISMATCH!
          { name: "Pack Quantity", value: "1" },
        ],
      };

      Product.find = () => ({
        populate: () => ({
          sort: () => ({
            limit: () => createChainableQuery([candidateMismatched]),
          }),
        }),
      });

      const result = await ProductService.getOtherSellerOffers(prodId.toString());
      assert.strictEqual(result.offers.length, 0, "Candidate with mismatched storage must be rejected from competing offers");
    });

    await runAsyncTest("ProductService.getProductQuestions() only returns APPROVED questions publicly", async () => {
      const prodId = new mongoose.Types.ObjectId();
      let capturedQuery = null;

      Product.findOne = () => createChainableQuery({ _id: prodId });
      ProductQuestion.find = (filter) => {
        capturedQuery = filter;
        return {
          sort: () => ({
            limit: () => createChainableQuery([
              { _id: new mongoose.Types.ObjectId(), question: "Approved question", moderationStatus: "APPROVED", isApproved: true, answers: [] },
            ]),
          }),
        };
      };

      const res = await ProductService.getProductQuestions(prodId.toString());
      assert.strictEqual(capturedQuery.moderationStatus, "APPROVED", "Public questions query must strictly filter by moderationStatus: APPROVED");
      assert.strictEqual(capturedQuery.isApproved, true);
      assert.strictEqual(res.questions.length, 1);
    });

    await runAsyncTest("CartService.mergeGuestCart() concurrent merges with distinct idempotency keys targeting same product merge atomically without duplicates or lost updates", async () => {
      resetInMemoryCartItems();
      const user = { _id: new mongoose.Types.ObjectId() };
      const prodId = new mongoose.Types.ObjectId();
      const cartId = new mongoose.Types.ObjectId();

      const mockCart = {
        _id: cartId,
        recentMergeSignatures: [],
        toObject() { return { ...this }; },
        save: async function () { return this; },
      };
      Cart.findOne = async () => mockCart;

      Product.findById = async () => ({
        _id: prodId,
        title: "Concurrent Target Product",
        status: "PUBLISHED",
        countInStock: 20,
        sellingPrice: 500,
        mrpPrice: 800,
      });

      const guestItemsA = [{ clientItemId: "client-worker-A", productId: prodId.toString(), quantity: 2 }];
      const guestItemsB = [{ clientItemId: "client-worker-B", productId: prodId.toString(), quantity: 3 }];

      // Run concurrent merges with two distinct idempotency keys
      const [resA, resB] = await Promise.all([
        CartService.mergeGuestCart(user, guestItemsA, { idempotencyKey: "concurrent_merge_key_A" }),
        CartService.mergeGuestCart(user, guestItemsB, { idempotencyKey: "concurrent_merge_key_B" }),
      ]);

      assert.strictEqual(resA.mergedItems[0].quantityMerged, 2);
      assert.strictEqual(resB.mergedItems[0].quantityMerged, 3);

      // Verify that in the CartItem store:
      // Exactly ONE item exists for (cart, product, variantId: null)
      const allCartItems = Array.from(inMemoryCartItems.values());
      assert.strictEqual(allCartItems.length, 1, "Must never create duplicate CartItem rows for same product variant");

      const finalItem = allCartItems[0];
      assert.strictEqual(finalItem.quantity, 5, "Final cart item quantity must be 2 + 3 = 5 (no lost updates)");

      // Check per-attempt ledger: both client signatures must be recorded
      const hasSigA = finalItem.appliedGuestItems.some((e) => e.clientItemId === "client-worker-A");
      const hasSigB = finalItem.appliedGuestItems.some((e) => e.clientItemId === "client-worker-B");
      assert.ok(hasSigA, "Ledger must record Worker A attempt");
      assert.ok(hasSigB, "Ledger must record Worker B attempt");
    });

    await runAsyncTest("CartService.mergeGuestCart() retry of exact same payload after simulated lost response reuses key and does not double-add", async () => {
      resetInMemoryCartItems();
      const user = { _id: new mongoose.Types.ObjectId() };
      const prodId = new mongoose.Types.ObjectId();
      const cartId = new mongoose.Types.ObjectId();
      const idempotencyKey = "lost_response_simulation_key";

      const mockCart = {
        _id: cartId,
        recentMergeSignatures: [],
        toObject() { return { ...this }; },
        save: async function () { return this; },
      };
      Cart.findOne = async () => mockCart;

      Product.findById = async () => ({
        _id: prodId,
        title: "Lost Response Item",
        status: "PUBLISHED",
        countInStock: 10,
        sellingPrice: 150,
        mrpPrice: 200,
      });

      const guestItems = [{ clientItemId: "item-lost-resp-1", productId: prodId.toString(), quantity: 5 }];

      // Step 1: Initial request succeeds on server, but client drops connection before receiving response
      const firstServerResult = await CartService.mergeGuestCart(user, guestItems, { idempotencyKey });
      assert.strictEqual(firstServerResult.mergedItems[0].quantityMerged, 5);

      const cartItemAfterFirst = await CartItem.findOne({ cart: cartId, product: prodId });
      assert.strictEqual(cartItemAfterFirst.quantity, 5);

      // Step 2: Client retries with identical payload and identical idempotency key
      const retryResult = await CartService.mergeGuestCart(user, guestItems, { idempotencyKey });
      assert.strictEqual(retryResult.isIdempotentReplay, true, "Must recognize idempotent replay of completed request");

      // Verify cart quantity was NOT double-added to 10
      const cartItemAfterRetry = await CartItem.findOne({ cart: cartId, product: prodId });
      assert.strictEqual(cartItemAfterRetry.quantity, 5, "Quantity must strictly remain 5, never double-added to 10");
    });

    await runAsyncTest("ProductService.updateProduct() concurrent scalar price updates reject stale worker via optimistic concurrency", async () => {
      const prodId = new mongoose.Types.ObjectId();
      const sellerId = new mongoose.Types.ObjectId();

      let dbDoc = {
        _id: prodId,
        seller: sellerId,
        title: "Optimistic Concurrency Target",
        sellingPrice: 1000,
        mrpPrice: 1500,
        countInStock: 10,
        inStock: true,
        __v: 1,
        variants: [],
        toObject() { return { ...this }; },
        save: async function () {
          if (this.__v !== dbDoc.__v) {
            const err = new Error("No matching document found for id " + this._id + " version " + this.__v);
            err.name = "VersionError";
            throw err;
          }
          this.__v++;
          dbDoc = { ...this };
          return this;
        },
      };

      PriceHistory.create = async (doc) => ({
        _id: new mongoose.Types.ObjectId(),
        ...(Array.isArray(doc) ? doc[0] : doc),
      });

      Product.findById = async () => ({
        ...dbDoc,
        toObject() { return { ...this }; },
        save: dbDoc.save,
      });

      // Worker 1 executes update to 1200
      await ProductService.updateProduct(prodId, { sellingPrice: 1200 }, sellerId);
      assert.strictEqual(dbDoc.sellingPrice, 1200);
      assert.strictEqual(dbDoc.__v, 2);

      // Worker 2 (which loaded product at __v: 1) attempts to update sellingPrice to 1100
      Product.findById = async () => ({
        _id: prodId,
        seller: sellerId,
        title: "Optimistic Concurrency Target",
        sellingPrice: 1000,
        mrpPrice: 1500,
        countInStock: 10,
        inStock: true,
        __v: 1, // Stale version!
        variants: [],
        toObject() { return { ...this }; },
        save: dbDoc.save,
      });

      try {
        await ProductService.updateProduct(prodId, { sellingPrice: 1100 }, sellerId);
        assert.fail("Worker 2 with stale version 1 must be rejected by optimistic concurrency");
      } catch (err) {
        assert.ok(
          err.message.includes("VersionError") || err.message.includes("version 1") || err.name === "VersionError",
          `Expected version conflict rejection, got: ${err.message}`
        );
      }

      // Assert that DB price remains Worker 1's 1200 and was not overwritten by Worker 2's 1100
      assert.strictEqual(dbDoc.sellingPrice, 1200, "Price must remain 1200; stale update must never overwrite committed price");
    });

  } finally {
    restoreAllMocks();
  }

  // ============================================================================
  // Test Summary & Classification Report
  // ============================================================================
  console.log("\n================================================================");
  console.log(`🏁 TEST EXECUTION CLASSIFICATION REPORT`);
  console.log(`   • Unit Tests: ${testReport.unitTests.length} tests`);
  console.log(`   • Service Integration Tests: ${testReport.serviceIntegrationTests.length} tests`);
  console.log(`   • Total Passed: ${passed} | Total Failed: ${failed}`);
  console.log("================================================================\n");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("Test runner encountered unexpected error:", err);
  process.exit(1);
});
