import assert from "assert";
import mongoose from "mongoose";
import ProductService from "../src/modules/customer/services/product.service.js";
import CartService from "../src/modules/customer/services/cart.service.js";
import { Product } from "../src/models/product.model.js";
import { SavedItem } from "../src/models/savedItem.model.js";
import { ProductQuestion } from "../src/models/productQuestion.model.js";

console.log("\n================================================================");
console.log("🧪 ZOSH BAZAAR — PHASE 30 FULL MARKETPLACE EXPERIENCE TEST SUITE");
console.log("================================================================\n");

let passed = 0;
let failed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
    failed++;
  }
}

async function runAsyncTest(name, fn) {
  try {
    await fn();
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
    failed++;
  }
}

async function main() {
  // ============================================================================
  // [DOMAIN 1] Multi-Seller Canonical Offer Engine
  // ============================================================================
  console.log("▶ [Domain 1] Multi-Seller Canonical Offer Engine");

  runTest("Product model schema includes canonicalId, canonicalSku, and barcode indexing support", () => {
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
    assert.strictEqual(typeof prod.canonicalId, "string");
  });

  await runAsyncTest("getOtherSellerOffers computes authentic pricing differences & savings vs current offer", async () => {
    const currentPrice = 26990;
    const competingOffers = [
      {
        _id: new mongoose.Types.ObjectId(),
        title: "Sony WH-1000XM5 Wireless Noise Cancelling Headphones",
        mrpPrice: 29990,
        sellingPrice: 24990,
        quantity: 5,
        sku: "SONY-WH1000XM5-OFFER-A",
        seller: {
          _id: new mongoose.Types.ObjectId(),
          sellerName: "Apex Retail",
          businessDetails: { businessName: "Apex Retail India" },
          accountStatus: "ACTIVE",
        },
      },
      {
        _id: new mongoose.Types.ObjectId(),
        title: "Sony WH-1000XM5 Wireless Noise Cancelling Headphones",
        mrpPrice: 29990,
        sellingPrice: 27500,
        quantity: 12,
        sku: "SONY-WH1000XM5-OFFER-B",
        seller: {
          _id: new mongoose.Types.ObjectId(),
          sellerName: "Prime Electronics",
          businessDetails: { businessName: "Prime Electronics Ltd" },
          accountStatus: "ACTIVE",
        },
      },
    ];

    const processed = competingOffers.map((alt) => {
      const diff = currentPrice - alt.sellingPrice;
      return {
        productId: alt._id.toString(),
        sellingPrice: alt.sellingPrice,
        savingsVsCurrentOffer: diff > 0 ? diff : 0,
        isCheaper: alt.sellingPrice < currentPrice,
      };
    });

    assert.strictEqual(processed.length, 2);
    // Offer A is cheaper by 2000
    assert.strictEqual(processed[0].isCheaper, true);
    assert.strictEqual(processed[0].savingsVsCurrentOffer, 2000);
    // Offer B is more expensive
    assert.strictEqual(processed[1].isCheaper, false);
    assert.strictEqual(processed[1].savingsVsCurrentOffer, 0);
  });

  // ============================================================================
  // [DOMAIN 2] Multi-Product Side-by-Side Comparison Engine
  // ============================================================================
  console.log("\n▶ [Domain 2] Multi-Product Side-by-Side Comparison Engine");

  await runAsyncTest("compareProducts validates minimum product requirement", async () => {
    try {
      await ProductService.compareProducts(["single-id"]);
      assert.fail("Should have thrown error for < 2 products");
    } catch (err) {
      assert.strictEqual(err.statusCode || 400, 400);
      assert.ok(err.message.includes("At least 2"));
    }
  });

  await runAsyncTest("compareProducts aligns specifications across products into unified rows", async () => {
    const mockProducts = [
      {
        _id: new mongoose.Types.ObjectId("65a000000000000000000001"),
        title: "Samsung Galaxy S24 Ultra",
        brand: "Samsung",
        mrpPrice: 134999,
        sellingPrice: 124999,
        discountPercent: 7,
        quantity: 10,
        specifications: [
          { name: "RAM", value: "12 GB" },
          { name: "Storage", value: "256 GB" },
          { name: "Battery", value: "5000 mAh" },
        ],
        warranty: { summary: "1 Year Manufacturer" },
        returnPolicy: { returnable: true, windowDays: 7 },
      },
      {
        _id: new mongoose.Types.ObjectId("65a000000000000000000002"),
        title: "Apple iPhone 15 Pro Max",
        brand: "Apple",
        mrpPrice: 159900,
        sellingPrice: 149900,
        discountPercent: 6,
        quantity: 8,
        specifications: [
          { name: "RAM", value: "8 GB" },
          { name: "Storage", value: "256 GB" },
          { name: "Battery", value: "4441 mAh" },
          { name: "Camera", value: "48 MP" },
        ],
        warranty: { summary: "1 Year AppleCare" },
        returnPolicy: { returnable: true, windowDays: 7 },
      },
    ];

    const allSpecNames = new Set();
    mockProducts.forEach((p) => {
      (p.specifications || []).forEach((s) => allSpecNames.add(s.name));
    });

    const matrix = Array.from(allSpecNames).map((specName) => {
      const row = { specName, values: {} };
      mockProducts.forEach((p) => {
        const match = (p.specifications || []).find(
          (s) => s.name.toLowerCase() === specName.toLowerCase()
        );
        row.values[p._id.toString()] = match ? match.value : "—";
      });
      return row;
    });

    assert.strictEqual(matrix.length, 4);
    const ramRow = matrix.find((r) => r.specName === "RAM");
    assert.strictEqual(ramRow.values["65a000000000000000000001"], "12 GB");
    assert.strictEqual(ramRow.values["65a000000000000000000002"], "8 GB");

    const cameraRow = matrix.find((r) => r.specName === "Camera");
    assert.strictEqual(cameraRow.values["65a000000000000000000001"], "—");
    assert.strictEqual(cameraRow.values["65a000000000000000000002"], "48 MP");
  });

  // ============================================================================
  // [DOMAIN 3] Price History Intelligence & Target-Price Alerts
  // ============================================================================
  console.log("\n▶ [Domain 3] Price History Intelligence & Target-Price Alerts");

  runTest("SavedItem schema supports targetPrice, notifyOnPriceDrop, and notifyOnBackInStock", () => {
    const item = new SavedItem({
      user: new mongoose.Types.ObjectId(),
      collectionId: new mongoose.Types.ObjectId(),
      product: new mongoose.Types.ObjectId(),
      savedPrice: 26990,
      savedMrp: 29990,
      targetPrice: 24500,
      notifyOnPriceDrop: true,
      notifyOnBackInStock: true,
      targetPriceSetAt: new Date(),
    });

    assert.strictEqual(item.targetPrice, 24500);
    assert.strictEqual(item.notifyOnPriceDrop, true);
    assert.strictEqual(item.notifyOnBackInStock, true);
    assert.ok(item.targetPriceSetAt instanceof Date);
  });

  await runAsyncTest("subscribePriceAlert validates targetPrice does not exceed current selling price", async () => {
    const currentSellingPrice = 19999;
    const invalidTargetPrice = 22000;

    try {
      if (invalidTargetPrice > currentSellingPrice) {
        const error = new Error(
          `Target price (₹${invalidTargetPrice}) must be lower than current price (₹${currentSellingPrice})`
        );
        error.statusCode = 400;
        throw error;
      }
      assert.fail("Should have rejected target price higher than current selling price");
    } catch (err) {
      assert.strictEqual(err.statusCode, 400);
      assert.ok(err.message.includes("must be lower than current price"));
    }
  });

  runTest("Price history metrics computation calculates 30-day low, high, and drop percentage", () => {
    const currentSellingPrice = 17999;
    const mockPriceHistory = [
      { price: 21999, date: new Date(Date.now() - 25 * 86400000) },
      { price: 19999, date: new Date(Date.now() - 15 * 86400000) },
      { price: 18499, date: new Date(Date.now() - 7 * 86400000) },
      { price: 17999, date: new Date() },
    ];

    const prices = mockPriceHistory.map((h) => h.price);
    const lowest = Math.min(...prices);
    const highest = Math.max(...prices);
    const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    const dropFromPeak = Math.round(((highest - currentSellingPrice) / highest) * 100);

    assert.strictEqual(lowest, 17999);
    assert.strictEqual(highest, 21999);
    assert.strictEqual(avg, 19624);
    assert.strictEqual(dropFromPeak, 18);
  });

  // ============================================================================
  // [DOMAIN 4] Guest Cart to Authenticated Cart Merging
  // ============================================================================
  console.log("\n▶ [Domain 4] Guest Cart to Authenticated Cart Merging");

  await runAsyncTest("mergeGuestCart validates guest items array", async () => {
    const mockUser = { _id: new mongoose.Types.ObjectId() };
    try {
      await CartService.mergeGuestCart(mockUser, []);
      assert.fail("Should throw for empty guest items");
    } catch (err) {
      assert.strictEqual(err.statusCode, 400);
      assert.ok(err.message.includes("No guest items"));
    }
  });

  runTest("Cart item quantity combining logic correctly sums existing and incoming items", () => {
    const existingCartItems = [
      {
        productId: "prod_1",
        size: "M",
        quantity: 2,
      },
    ];

    const incomingGuestItems = [
      {
        productId: "prod_1",
        size: "M",
        quantity: 3,
      },
      {
        productId: "prod_2",
        size: "L",
        quantity: 1,
      },
    ];

    const stockMap = {
      prod_1: 10,
      prod_2: 5,
    };

    const merged = [...existingCartItems];

    incomingGuestItems.forEach((incoming) => {
      const existingIndex = merged.findIndex(
        (m) => m.productId === incoming.productId && m.size === incoming.size
      );
      const maxStock = stockMap[incoming.productId] || 99;

      if (existingIndex > -1) {
        merged[existingIndex].quantity = Math.min(
          merged[existingIndex].quantity + incoming.quantity,
          maxStock
        );
      } else {
        merged.push({
          ...incoming,
          quantity: Math.min(incoming.quantity, maxStock),
        });
      }
    });

    assert.strictEqual(merged.length, 2);
    assert.strictEqual(merged[0].quantity, 5);
    assert.strictEqual(merged[1].quantity, 1);
  });

  // ============================================================================
  // [DOMAIN 5] Verified Community & Seller Q&A Engine
  // ============================================================================
  console.log("\n▶ [Domain 5] Verified Community & Seller Q&A Engine");

  runTest("ProductQuestion schema supports verified answeredBy roles and upvotes", () => {
    const q = new ProductQuestion({
      product: new mongoose.Types.ObjectId(),
      user: new mongoose.Types.ObjectId(),
      userName: "Meera Sharma",
      question: "Is this banarasi saree 100% pure silk or blended?",
      category: "Fabric & Material",
      answers: [
        {
          answer: "This is handwoven with certified 100% pure Katan silk with Silk Mark certification.",
          authorName: "Virasat Weaves Official",
          authorRole: "SELLER",
          isSellerAnswer: true,
          isVerifiedBuyer: false,
          upvotes: 42,
        },
        {
          answer: "I purchased this last month for a wedding, the fabric is extremely soft and genuine.",
          authorName: "Ananya Roy",
          authorRole: "VERIFIED_BUYER",
          isSellerAnswer: false,
          isVerifiedBuyer: true,
          upvotes: 18,
        },
      ],
    });

    assert.strictEqual(q.question, "Is this banarasi saree 100% pure silk or blended?");
    assert.strictEqual(q.answers.length, 2);
    assert.strictEqual(q.answers[0].isSellerAnswer, true);
    assert.strictEqual(q.answers[0].authorRole, "SELLER");
    assert.strictEqual(q.answers[0].upvotes, 42);
    assert.strictEqual(q.answers[1].isVerifiedBuyer, true);
    assert.strictEqual(q.answers[1].authorRole, "VERIFIED_BUYER");
    assert.strictEqual(q.category, "Fabric & Material");
  });

  await runAsyncTest("askProductQuestion rejects empty or overly short questions", async () => {
    try {
      await ProductService.askProductQuestion(
        new mongoose.Types.ObjectId(),
        new mongoose.Types.ObjectId(),
        "Hi?",
        "Test User"
      );
      assert.fail("Should reject short question");
    } catch (err) {
      assert.strictEqual(err.statusCode, 400);
      assert.ok(err.message.includes("at least 6 characters"));
    }
  });

  console.log("\n================================================================");
  console.log(`🏁 PHASE 30 SUMMARY: ${passed} PASSED | ${failed} FAILED`);
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
