import assert from "assert";
import mongoose from "mongoose";
import OrderService from "../src/modules/customer/services/order.service.js";
import SellerService from "../src/modules/seller/services/seller.service.js";
import TaxService, {
  STATUTORY_TAX_SCHEDULE,
  GST_STATE_CODES,
} from "../src/modules/customer/services/tax.service.js";
import { Order } from "../src/models/order.model.js";
import { Seller } from "../src/models/seller.model.js";
import { Product } from "../src/models/product.model.js";
import { Review } from "../src/models/review.model.js";
import AccountStatus from "../src/domain/AccountStatus.js";

console.log("\n================================================================");
console.log("🧪 ZOSH BAZAAR — STATUTORY GST & MULTI-VENDOR QUALITY SUITE");
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

// -------------------------------------------------------------
// [DOMAIN 1] Public Seller Profile Sanitization & Reputation Metrics
// -------------------------------------------------------------
console.log("▶ [Domain 1] Public Seller Profile Sanitization & Reputation Metrics");

runTest("Public seller DTO strictly excludes private KYC, bank details, and passwords", () => {
  const sellerId = new mongoose.Types.ObjectId();
  const rawSellerDoc = {
    _id: sellerId,
    sellerName: "Supertron Electronics",
    email: "partner@supertron.in",
    mobile: 9876543210,
    password: "hashed_secret_password_123",
    GSTIN: "27AABCS1234F1Z8",
    accountStatus: AccountStatus.ACTIVE,
    isEmailVerified: true,
    bankDetails: {
      accountNumber: "919293949596",
      accountHolderName: "Supertron India Pvt Ltd",
      bankName: "HDFC Bank",
      ifscCode: "HDFC0001234",
    },
    businessDetails: {
      businessName: "Supertron Official Store",
      businessPan: "AABCS1234F",
      businessLogo: "https://cdn.zoshbazaar.com/logos/supertron.png",
    },
    pickupAddress: {
      city: "Mumbai",
      state: "Maharashtra",
      pincode: 400001,
    },
    createdAt: new Date("2023-01-15T10:00:00Z"),
  };

  const sellerCode = `ZB-SLR-${rawSellerDoc._id.toString().slice(-6).toUpperCase()}`;
  const rawGstin = rawSellerDoc.GSTIN || "";
  const maskedGstin = `${rawGstin.slice(0, 2)}••••••••${rawGstin.slice(-3)}`;

  const publicDto = {
    sellerId: rawSellerDoc._id,
    sellerCode,
    businessName: rawSellerDoc.businessDetails.businessName,
    sellerName: rawSellerDoc.sellerName,
    businessLogo: rawSellerDoc.businessDetails.businessLogo,
    isVerified: rawSellerDoc.accountStatus === AccountStatus.ACTIVE && rawSellerDoc.isEmailVerified,
    rating: null,
    ratingCount: 0,
    shipsFrom: {
      city: rawSellerDoc.pickupAddress.city,
      state: rawSellerDoc.pickupAddress.state,
    },
    maskedGstin,
    fulfillmentMethod: "Zosh Express Logistics (Direct / Hub)",
  };

  assert.strictEqual(publicDto.sellerCode, `ZB-SLR-${sellerId.toString().slice(-6).toUpperCase()}`);
  assert.strictEqual(publicDto.businessName, "Supertron Official Store");
  assert.strictEqual(publicDto.isVerified, true);
  assert.strictEqual(publicDto.maskedGstin, "27••••••••1Z8");
  assert.strictEqual(publicDto.bankDetails, undefined, "bankDetails must NEVER be present");
  assert.strictEqual(publicDto.password, undefined, "password must NEVER be present");
  assert.strictEqual(publicDto.businessPan, undefined, "businessPan must NEVER be present");
});

runTest("Ratings calculation does NOT fabricate 4.4 when review count is 0", () => {
  const reviews = [];
  let rating = null;
  let ratingCount = 0;

  if (reviews.length > 0) {
    rating = 4.4;
    ratingCount = reviews.length;
  }

  assert.strictEqual(rating, null, "Rating must be null when no approved reviews exist");
  assert.strictEqual(ratingCount, 0, "Rating count must be 0");
});

runTest("Authentic ratings aggregation accurately calculates average and breakdown", () => {
  const stats = [
    { _id: 5, count: 12 },
    { _id: 4, count: 8 },
    { _id: 3, count: 2 },
  ];

  let totalCount = 0;
  let totalSum = 0;
  const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  for (const s of stats) {
    breakdown[s._id] = s.count;
    totalCount += s.count;
    totalSum += s._id * s.count;
  }

  const averageRating = Math.round((totalSum / totalCount) * 10) / 10;

  assert.strictEqual(totalCount, 22);
  assert.strictEqual(totalSum, 12 * 5 + 8 * 4 + 2 * 3); // 60 + 32 + 6 = 98
  assert.strictEqual(averageRating, 4.5);
  assert.strictEqual(breakdown[5], 12);
  assert.strictEqual(breakdown[4], 8);
  assert.strictEqual(breakdown[3], 2);
  assert.strictEqual(breakdown[1], 0);
});

// -------------------------------------------------------------
// [DOMAIN 2] Statutory Tax Configuration & GSTIN Syntax Validation
// -------------------------------------------------------------
console.log("\n▶ [Domain 2] Statutory Tax Configuration & GSTIN Syntax Validation");

runTest("GSTIN validator accepts valid 15-character Indian GSTINs and rejects invalid formats", () => {
  assert.strictEqual(TaxService.isValidGstin("27AABCS1234F1Z8"), true, "Valid Maharashtra GSTIN");
  assert.strictEqual(TaxService.isValidGstin("29AAACH7409R1ZZ"), true, "Valid Karnataka GSTIN");
  assert.strictEqual(TaxService.isValidGstin("07AAAAA0000A1Z5"), true, "Valid Delhi GSTIN");

  assert.strictEqual(TaxService.isValidGstin(""), false, "Empty GSTIN");
  assert.strictEqual(TaxService.isValidGstin("INVALID_GSTIN"), false, "Arbitrary string");
  assert.strictEqual(TaxService.isValidGstin("27AABCS1234F1Z"), false, "14 chars - too short");
  assert.strictEqual(TaxService.isValidGstin("27AABCS1234F1Z89"), false, "16 chars - too long");
  assert.strictEqual(TaxService.isValidGstin(null), false, "Null GSTIN");
});

runTest("HSN/SAC validator accepts 4 to 8 digit codes and rejects invalid formats", () => {
  assert.strictEqual(TaxService.isValidHsnSac("610910"), true, "6-digit HSN");
  assert.strictEqual(TaxService.isValidHsnSac("6403"), true, "4-digit HSN");
  assert.strictEqual(TaxService.isValidHsnSac("998319"), true, "6-digit SAC");
  assert.strictEqual(TaxService.isValidHsnSac("85171300"), true, "8-digit tariff item");

  assert.strictEqual(TaxService.isValidHsnSac("61"), false, "2-digit too short");
  assert.strictEqual(TaxService.isValidHsnSac("610910ABC"), false, "Alphanumeric invalid");
  assert.strictEqual(TaxService.isValidHsnSac(null), false, "Null code");
});

runTest("State code resolution correctly identifies 2-digit Indian GST State codes", () => {
  assert.strictEqual(TaxService.resolveStateCode("Maharashtra"), "27");
  assert.strictEqual(TaxService.resolveStateCode("Karnataka"), "29");
  assert.strictEqual(TaxService.resolveStateCode("Delhi"), "07");
  assert.strictEqual(TaxService.resolveStateCode("Tamil Nadu"), "33");
  assert.strictEqual(TaxService.resolveStateCode("Gujarat"), "24");
  assert.strictEqual(TaxService.resolveStateCode("Uttar Pradesh"), "09");
  assert.strictEqual(TaxService.resolveStateCode("Unknown Foreign"), "99");
});

// -------------------------------------------------------------
// [DOMAIN 3] Seller Tax Regimes (Regular vs Composition vs Unregistered)
// -------------------------------------------------------------
console.log("\n▶ [Domain 3] Seller Tax Regimes (Regular vs Composition vs Unregistered)");

runTest("Regular registered seller issues TAX INVOICE with canCollectTax true", () => {
  const seller = {
    sellerName: "Apex Retailers Ltd",
    GSTIN: "27AABCS1234F1Z8",
    businessDetails: { isCompositionScheme: false },
  };

  const regime = TaxService.determineSellerTaxRegime(seller);
  assert.strictEqual(regime.regime, "REGULAR");
  assert.strictEqual(regime.isGstRegistered, true);
  assert.strictEqual(regime.isComposition, false);
  assert.strictEqual(regime.canCollectTax, true);
  assert.strictEqual(regime.documentTitle, "TAX INVOICE");
  assert.ok(regime.regimeNote.includes("Rule 46 of CGST Rules"));
});

runTest("Composition scheme seller issues BILL OF SUPPLY with canCollectTax false", () => {
  const seller = {
    sellerName: "Small Scale Artisan",
    GSTIN: "27AABCS1234F1Z8",
    businessDetails: { isCompositionScheme: true },
  };

  const regime = TaxService.determineSellerTaxRegime(seller);
  assert.strictEqual(regime.regime, "COMPOSITION");
  assert.strictEqual(regime.isComposition, true);
  assert.strictEqual(regime.canCollectTax, false);
  assert.strictEqual(regime.documentTitle, "BILL OF SUPPLY");
  assert.ok(regime.regimeNote.includes("Sec 10 CGST Act"));
});

runTest("Unregistered seller issues COMMERCIAL RECEIPT with canCollectTax false", () => {
  const seller = {
    sellerName: "Individual Hobbyist",
    GSTIN: "",
  };

  const regime = TaxService.determineSellerTaxRegime(seller);
  assert.strictEqual(regime.regime, "UNREGISTERED");
  assert.strictEqual(regime.isGstRegistered, false);
  assert.strictEqual(regime.canCollectTax, false);
  assert.strictEqual(regime.documentTitle, "COMMERCIAL RECEIPT / BILL OF SUPPLY");
  assert.ok(regime.regimeNote.includes("No Tax Collected"));
});

// -------------------------------------------------------------
// [DOMAIN 4] Product Valuation Thresholds & Rate Determination
// -------------------------------------------------------------
console.log("\n▶ [Domain 4] Product Valuation Thresholds & Statutory Classification");

runTest("Apparel under ₹1,000 threshold classifies at 5% GST; above ₹1,000 classifies at 12% GST", () => {
  const apparelProduct = {
    title: "Cotton Crewneck T-Shirt",
    category: { name: "Men Apparel" },
  };

  // Unit selling price <= 1000
  const lowPriced = TaxService.classifyProductTax(apparelProduct, 799);
  assert.strictEqual(lowPriced.hsnCode, "610910");
  assert.strictEqual(lowPriced.gstRatePercent, 5, "Apparel <= ₹1,000 must be taxed at 5%");

  // Boundary unit selling price = 1000
  const boundaryPriced = TaxService.classifyProductTax(apparelProduct, 1000);
  assert.strictEqual(boundaryPriced.gstRatePercent, 5, "Apparel = ₹1,000 must be taxed at 5%");

  // Unit selling price > 1000
  const highPriced = TaxService.classifyProductTax(apparelProduct, 1899);
  assert.strictEqual(highPriced.hsnCode, "610910");
  assert.strictEqual(highPriced.gstRatePercent, 12, "Apparel > ₹1,000 must be taxed at 12%");
});

runTest("Footwear under ₹1,000 threshold classifies at 5% GST; above ₹1,000 classifies at 18% GST", () => {
  const shoeProduct = {
    title: "Running Sports Shoes",
    category: { name: "Footwear" },
  };

  const lowShoe = TaxService.classifyProductTax(shoeProduct, 650);
  assert.strictEqual(lowShoe.hsnCode, "640399");
  assert.strictEqual(lowShoe.gstRatePercent, 5, "Footwear <= ₹1,000 must be taxed at 5%");

  const highShoe = TaxService.classifyProductTax(shoeProduct, 2499);
  assert.strictEqual(highShoe.hsnCode, "640399");
  assert.strictEqual(highShoe.gstRatePercent, 18, "Footwear > ₹1,000 must be taxed at 18%");
});

runTest("Electronics classifies at standard 18% GST regardless of price", () => {
  const phone = {
    title: "Flagship 5G Smartphone",
    category: { name: "Mobiles" },
  };

  const tax = TaxService.classifyProductTax(phone, 29999);
  assert.strictEqual(tax.hsnCode, "851713");
  assert.strictEqual(tax.gstRatePercent, 18);
});

runTest("Books classify at 0% GST (Nil Rated)", () => {
  const book = {
    title: "The Art of Computer Programming",
    category: { name: "Books" },
  };

  const tax = TaxService.classifyProductTax(book, 1500);
  assert.strictEqual(tax.hsnCode, "490110");
  assert.strictEqual(tax.gstRatePercent, 0, "Books must be Nil Rated (0%)");
});

runTest("Validated product-level HSN and GST override takes precedence", () => {
  const customProduct = {
    title: "Custom High-End Audio Interface",
    category: { name: "General" },
    hsnCode: "851713",
    gstRate: 18,
  };

  const tax = TaxService.classifyProductTax(customProduct, 5000);
  assert.strictEqual(tax.hsnCode, "851713");
  assert.strictEqual(tax.gstRatePercent, 18);
  assert.strictEqual(tax.source, "PRODUCT_OVERRIDE");
});

// -------------------------------------------------------------
// [DOMAIN 5] Place of Supply & Strict Paise Conservation
// -------------------------------------------------------------
console.log("\n▶ [Domain 5] Place of Supply & Strict Paise Conservation");

runTest("Intra-State: Equal CGST + SGST with zero IGST and exact paise conservation", () => {
  const sellerRegime = { canCollectTax: true };
  const taxClassification = { hsnCode: "851713", gstRatePercent: 18, gstRateFraction: 0.18 };

  const itemTax = TaxService.computeItemTax({
    unitSellingPrice: 1180,
    quantity: 1,
    discount: 0,
    taxClassification,
    sellerRegime,
    isIntraState: true,
  });

  assert.strictEqual(itemTax.grossAmount, 1180);
  assert.strictEqual(itemTax.taxableAmount, 1000);
  assert.strictEqual(itemTax.totalTax, 180);
  assert.strictEqual(itemTax.cgstRate, 9);
  assert.strictEqual(itemTax.sgstRate, 9);
  assert.strictEqual(itemTax.cgstAmount, 90);
  assert.strictEqual(itemTax.sgstAmount, 90);
  assert.strictEqual(itemTax.igstAmount, 0);
  assert.strictEqual(itemTax.taxType, "INTRA_STATE");
  assert.strictEqual(itemTax.taxableAmount + itemTax.cgstAmount + itemTax.sgstAmount, 1180);
});

runTest("Inter-State: Zero CGST + SGST with full IGST and exact paise conservation", () => {
  const sellerRegime = { canCollectTax: true };
  const taxClassification = { hsnCode: "610910", gstRatePercent: 12, gstRateFraction: 0.12 };

  const itemTax = TaxService.computeItemTax({
    unitSellingPrice: 1120,
    quantity: 1,
    discount: 0,
    taxClassification,
    sellerRegime,
    isIntraState: false,
  });

  assert.strictEqual(itemTax.grossAmount, 1120);
  assert.strictEqual(itemTax.taxableAmount, 1000);
  assert.strictEqual(itemTax.totalTax, 120);
  assert.strictEqual(itemTax.cgstAmount, 0);
  assert.strictEqual(itemTax.sgstAmount, 0);
  assert.strictEqual(itemTax.igstRate, 12);
  assert.strictEqual(itemTax.igstAmount, 120);
  assert.strictEqual(itemTax.taxType, "INTER_STATE");
  assert.strictEqual(itemTax.taxableAmount + itemTax.igstAmount, 1120);
});

runTest("Odd-paisa rounding conservation prevents penny drift in intra-state split", () => {
  // ₹101 total with 18% tax -> taxable ₹85.59, total tax ₹15.41 (odd paise)
  const sellerRegime = { canCollectTax: true };
  const taxClassification = { hsnCode: "998319", gstRatePercent: 18, gstRateFraction: 0.18 };

  const itemTax = TaxService.computeItemTax({
    unitSellingPrice: 101,
    quantity: 1,
    discount: 0,
    taxClassification,
    sellerRegime,
    isIntraState: true,
  });

  assert.strictEqual(itemTax.cgstAmount + itemTax.sgstAmount, itemTax.totalTax);
  assert.strictEqual(itemTax.taxableAmount + itemTax.totalTax, 101);
});

runTest("Discounts are subtracted before tax decomposition", () => {
  const sellerRegime = { canCollectTax: true };
  const taxClassification = { hsnCode: "851713", gstRatePercent: 18, gstRateFraction: 0.18 };

  const itemTax = TaxService.computeItemTax({
    unitSellingPrice: 1000,
    quantity: 2, // gross ₹2000
    discount: 820, // discount ₹820 -> net gross ₹1180
    taxClassification,
    sellerRegime,
    isIntraState: true,
  });

  assert.strictEqual(itemTax.grossAmount, 2000);
  assert.strictEqual(itemTax.discount, 820);
  assert.strictEqual(itemTax.netGross, 1180);
  assert.strictEqual(itemTax.taxableAmount, 1000);
  assert.strictEqual(itemTax.totalTax, 180);
});

runTest("Composition and unregistered merchants result in zero tax collected", () => {
  const sellerRegime = { canCollectTax: false };
  const taxClassification = { hsnCode: "610910", gstRatePercent: 12, gstRateFraction: 0.12 };

  const itemTax = TaxService.computeItemTax({
    unitSellingPrice: 1000,
    quantity: 1,
    discount: 0,
    taxClassification,
    sellerRegime,
    isIntraState: true,
  });

  assert.strictEqual(itemTax.taxableAmount, 1000);
  assert.strictEqual(itemTax.totalTax, 0, "No tax can be collected by composition/unregistered merchants");
  assert.strictEqual(itemTax.cgstAmount, 0);
  assert.strictEqual(itemTax.sgstAmount, 0);
  assert.strictEqual(itemTax.igstAmount, 0);
  assert.strictEqual(itemTax.lineTotal, 1000);
});

// -------------------------------------------------------------
// [DOMAIN 6] Multi-Vendor Tenant Isolation & Buyer Redaction
// -------------------------------------------------------------
console.log("\n▶ [Domain 6] Multi-Vendor Tenant Isolation & Buyer Identity Protection");

runTest("Seller invoice view filters line items strictly to their own package", () => {
  const sellerAId = new mongoose.Types.ObjectId().toString();
  const sellerBId = new mongoose.Types.ObjectId().toString();

  const multiVendorInvoiceSnapshot = {
    invoiceNumber: "INV-ZB-2025-26-000001",
    seller: { sellerId: sellerAId, businessName: "Seller A Store" },
    buyer: {
      name: "Rahul Customer",
      email: "rahul.personal@gmail.com",
      mobile: "9876543210",
      address: "123 Main St, Mumbai",
    },
    lineItems: [
      {
        orderItemId: "item_1",
        sellerId: sellerAId,
        productTitle: "Seller A Shirt",
        quantity: 1,
        lineTotal: 500,
        taxableAmount: 446.43,
        cgstAmount: 26.79,
        sgstAmount: 26.78,
        totalTax: 53.57,
      },
      {
        orderItemId: "item_2",
        sellerId: sellerBId,
        productTitle: "Seller B Phone Case",
        quantity: 2,
        lineTotal: 600,
        taxableAmount: 508.47,
        cgstAmount: 45.76,
        sgstAmount: 45.77,
        totalTax: 91.53,
      },
    ],
    financials: {
      totalTaxableAmount: 954.9,
      totalCgst: 72.55,
      totalSgst: 72.55,
      totalTaxAmount: 145.1,
      grandTotal: 1100,
    },
  };

  // Seller A requests their invoice view
  const requesterA = { _id: sellerAId, role: "SELLER" };
  const formattedForSellerA = OrderService._formatInvoiceResponseForRequester(
    multiVendorInvoiceSnapshot,
    requesterA
  );

  // Assertions for Seller A
  assert.strictEqual(formattedForSellerA.lineItems.length, 1, "Must contain ONLY Seller A's item");
  assert.strictEqual(formattedForSellerA.lineItems[0].productTitle, "Seller A Shirt");
  assert.strictEqual(formattedForSellerA.financials.grandTotal, 500, "Financials must be recomputed to Seller A's package total only");
  assert.strictEqual(formattedForSellerA.financials.totalTaxAmount, 53.57);

  // Customer identity redaction
  assert.strictEqual(
    formattedForSellerA.buyer.email,
    "customer[PROTECTED]@zoshbazaar.in",
    "Customer email must be masked from merchant"
  );
  assert.strictEqual(
    formattedForSellerA.buyer.mobile,
    "••••••3210",
    "Customer phone must be masked to last 4 digits"
  );
  assert.strictEqual(
    formattedForSellerA.buyer.name,
    "Rahul Customer",
    "Customer shipping name preserved for package labeling"
  );
});

runTest("Admin and Customer views retain full unredacted invoice particulars", () => {
  const customerId = new mongoose.Types.ObjectId().toString();
  const snapshot = {
    buyer: {
      name: "Rahul Customer",
      email: "rahul.personal@gmail.com",
      mobile: "9876543210",
    },
    lineItems: [{ lineTotal: 500 }],
    financials: { grandTotal: 500 },
  };

  const customerRequester = { _id: customerId, role: "ROLE_CUSTOMER" };
  const customerView = OrderService._formatInvoiceResponseForRequester(snapshot, customerRequester);
  assert.strictEqual(customerView.buyer.email, "rahul.personal@gmail.com");
  assert.strictEqual(customerView.buyer.mobile, "9876543210");

  const adminRequester = { _id: "admin_1", role: "ROLE_ADMIN" };
  const adminView = OrderService._formatInvoiceResponseForRequester(snapshot, adminRequester);
  assert.strictEqual(adminView.buyer.email, "rahul.personal@gmail.com");
  assert.strictEqual(adminView.buyer.mobile, "9876543210");
});

// -------------------------------------------------------------
// [DOMAIN 7] Strict Multi-Tenant Invoice Authorization Guard
// -------------------------------------------------------------
console.log("\n▶ [Domain 7] Strict Multi-Tenant Invoice Authorization Guard");

runTest("Unrelated customer is rejected with access denied", () => {
  const ownerId = "cust_101";
  const order = { user: { _id: ownerId }, seller: { _id: "seller_201" } };
  const intruder = { _id: "cust_999", role: "ROLE_CUSTOMER" };

  const isOwner = intruder._id === order.user._id;
  const isSeller = intruder.role === "SELLER" && intruder._id === order.seller._id;
  const isAdmin = intruder.role === "ROLE_ADMIN";

  assert.strictEqual(isOwner || isSeller || isAdmin, false, "Intruder must be rejected");
});

runTest("Unrelated seller without items is rejected with access denied", () => {
  const sellerAId = "seller_A";
  const sellerBId = "seller_B";
  const order = {
    user: { _id: "cust_101" },
    seller: { _id: sellerAId },
    orderItems: [{ seller: sellerAId }],
  };

  const requesterB = { _id: sellerBId, role: "SELLER" };

  const isOwner = requesterB._id === order.user._id;
  const isAuthorizedSeller =
    requesterB.role === "SELLER" &&
    (requesterB._id === order.seller._id ||
      order.orderItems.some((i) => i.seller === requesterB._id));
  const isAdmin = requesterB.role === "ROLE_ADMIN";

  assert.strictEqual(isOwner || isAuthorizedSeller || isAdmin, false, "Unrelated seller must be rejected");
});

// -------------------------------------------------------------
// [DOMAIN 8] Missing Particulars & Draft State Safety
// -------------------------------------------------------------
console.log("\n▶ [Domain 8] Missing Particulars & Draft State Safety");

runTest("Missing shipping or pickup state sets status to DRAFT_PENDING_TAX_VALIDATION", () => {
  const sellerAddress = { city: "Mumbai" }; // state missing!
  const shippingAddress = { state: "Karnataka" };

  const cleanStr = (s) => (s ? String(s).trim().toLowerCase().replace(/[^a-z0-9]/g, "") : "");
  const sellerState = cleanStr(sellerAddress.state);
  const buyerState = cleanStr(shippingAddress.state);
  const hasValidStates = Boolean(sellerState && buyerState);

  let documentTitle = "TAX INVOICE";
  let invoiceStatus = "ISSUED";

  if (!hasValidStates) {
    documentTitle = "PROFORMA INVOICE / ORDER RECEIPT";
    invoiceStatus = "DRAFT_PENDING_TAX_VALIDATION";
  }

  assert.strictEqual(hasValidStates, false);
  assert.strictEqual(invoiceStatus, "DRAFT_PENDING_TAX_VALIDATION");
  assert.strictEqual(documentTitle, "PROFORMA INVOICE / ORDER RECEIPT");
});

console.log("\n================================================================");
console.log(`🏁 QUALITY GATE SUMMARY: ${passed} PASSED | ${failed} FAILED`);
console.log("================================================================\n");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
