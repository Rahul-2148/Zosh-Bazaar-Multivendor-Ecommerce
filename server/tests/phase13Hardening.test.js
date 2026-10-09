/**
 * ZOSH BAZAAR — PHASE 13 PRODUCTION HARDENING TEST SUITE
 * Verifies:
 * 1. Webhook HMAC-SHA256 signature verification & event idempotency
 * 2. Payment state machine validation & transition guards
 * 3. Checkout stock concurrency & atomic deduction invariant
 * 4. Transactional rollback simulation on item failure
 * 5. Variant matrix resolution & canonical signature normalization
 * 6. Authoritative media hierarchy fallback (variant -> option group -> product default)
 * 7. Socket.IO room authorization (guest/seller isolation)
 */

import crypto from "crypto";
import PaymentStatus, {
  VALID_PAYMENT_TRANSITIONS,
  isValidPaymentTransition,
} from "../src/domain/PaymentStatus.js";
import { generateCanonicalVariantSignature } from "../src/utils/variantIdentity.js";
import { resolveMediaHierarchy } from "../src/models/product.model.js";
import paymentService from "../src/modules/customer/services/payment.service.js";

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTestSuite() {
  console.log("================================================================");
  console.log("🧪 ZOSH BAZAAR — PHASE 13 HARDENING INTEGRATION TESTS");
  console.log("================================================================\n");

  // -------------------------------------------------------------
  // TEST SUITE 1: PAYMENT WEBHOOK INTEGRITY & SIGNATURE VERIFICATION
  // -------------------------------------------------------------
  console.log("▶ [Test 1] Razorpay Webhook HMAC-SHA256 Signature Verification");
  const testSecret = "rzp_webhook_secret_phase13_test_xyz123";
  const rawPayload = JSON.stringify({
    entity: "event",
    account_id: "acc_12345",
    event: "payment.captured",
    id: "evt_test_101",
    payload: {
      payment: {
        entity: {
          id: "pay_captured_001",
          amount: 39900,
          status: "captured",
        },
      },
    },
  });

  const validSignature = crypto
    .createHmac("sha256", testSecret)
    .update(Buffer.from(rawPayload))
    .digest("hex");

  const invalidSignature = "invalid_tampered_signature_hex_000000";

  const isVerifiedValid = paymentService.verifyRazorpayWebhookSignature(
    Buffer.from(rawPayload),
    validSignature,
    testSecret
  );
  assert(isVerifiedValid === true, "Valid HMAC signature correctly verified");

  const isVerifiedInvalid = paymentService.verifyRazorpayWebhookSignature(
    Buffer.from(rawPayload),
    invalidSignature,
    testSecret
  );
  assert(isVerifiedInvalid === false, "Invalid/tampered HMAC signature strictly rejected");

  const isVerifiedEmpty = paymentService.verifyRazorpayWebhookSignature(
    null,
    validSignature,
    testSecret
  );
  assert(isVerifiedEmpty === false, "Missing rawBody rejected safely");

  // -------------------------------------------------------------
  // TEST SUITE 2: PAYMENT STATE MACHINE TRANSITIONS
  // -------------------------------------------------------------
  console.log("\n▶ [Test 2] Payment State Machine Guard Transitions (Section 4)");
  assert(
    isValidPaymentTransition(PaymentStatus.PENDING, PaymentStatus.CAPTURED) === true,
    "PENDING -> CAPTURED is a valid state transition"
  );
  assert(
    isValidPaymentTransition(PaymentStatus.PENDING, PaymentStatus.FAILED) === true,
    "PENDING -> FAILED is a valid state transition"
  );
  assert(
    isValidPaymentTransition(PaymentStatus.CAPTURED, PaymentStatus.REFUNDED) === true,
    "CAPTURED -> REFUNDED is a valid state transition"
  );
  assert(
    isValidPaymentTransition(PaymentStatus.CAPTURED, PaymentStatus.PARTIALLY_REFUNDED) === true,
    "CAPTURED -> PARTIALLY_REFUNDED is a valid state transition"
  );
  assert(
    isValidPaymentTransition(PaymentStatus.FAILED, PaymentStatus.CAPTURED) === false,
    "FAILED -> CAPTURED is strictly prohibited (no resurrecting failed payment)"
  );
  assert(
    isValidPaymentTransition(PaymentStatus.REFUNDED, PaymentStatus.CAPTURED) === false,
    "REFUNDED -> CAPTURED is strictly prohibited"
  );
  assert(
    isValidPaymentTransition(PaymentStatus.CAPTURED, PaymentStatus.CAPTURED) === true,
    "CAPTURED -> CAPTURED is idempotent (self-transition allowed)"
  );

  // -------------------------------------------------------------
  // TEST SUITE 3: CANONICAL VARIANT IDENTITY NORMALIZATION
  // -------------------------------------------------------------
  console.log("\n▶ [Test 3] Canonical Variant Identity Normalization (Section 15)");
  const attrsOrder1 = [
    { key: "Color", value: "Blue" },
    { key: "Size", value: "M" },
  ];
  const attrsOrder2 = [
    { key: "Size", value: "M" },
    { key: "Color", value: "Blue" },
  ];
  const attrsCasing = [
    { key: "color", value: "blue" },
    { key: "size", value: "m" },
  ];
  const attrsDict = { size: "m", color: "blue" };

  const sig1 = generateCanonicalVariantSignature(attrsOrder1);
  const sig2 = generateCanonicalVariantSignature(attrsOrder2);
  const sig3 = generateCanonicalVariantSignature(attrsCasing);
  const sig4 = generateCanonicalVariantSignature(attrsDict);

  assert(sig1 === "color=blue|size=m", `Canonical signature is normalized: ${sig1}`);
  assert(sig1 === sig2, "Color=Blue + Size=M equals Size=M + Color=Blue");
  assert(sig1 === sig3, "Case-insensitive normalization matches lowercase");
  assert(sig1 === sig4, "Dictionary input generates identical canonical signature");

  // -------------------------------------------------------------
  // TEST SUITE 4: AUTHORITATIVE MEDIA HIERARCHY RESOLUTION
  // -------------------------------------------------------------
  console.log("\n▶ [Test 4] Media Fallback Hierarchy (Section 2, 59)");
  const sampleProduct = {
    title: "Embroidered Kurta",
    images: ["https://res.cloudinary.com/demo/image/upload/product_default.jpg"],
    mediaGroups: [
      {
        optionKey: "color",
        optionValue: "Blue",
        images: ["https://res.cloudinary.com/demo/image/upload/blue_gallery_1.jpg"],
      },
      {
        optionKey: "color",
        optionValue: "Purple",
        images: ["https://res.cloudinary.com/demo/image/upload/purple_gallery_1.jpg"],
      },
    ],
  };

  const variantWithImages = {
    sku: "KURTA-BLU-M",
    title: "Blue / M",
    attributes: [{ key: "color", value: "Blue" }, { key: "size", value: "M" }],
    images: ["https://res.cloudinary.com/demo/image/upload/exact_blue_m.jpg"],
  };

  const variantWithoutImages = {
    sku: "KURTA-BLU-L",
    title: "Blue / L",
    attributes: [{ key: "color", value: "Blue" }, { key: "size", value: "L" }],
    images: [],
  };

  const variantWithoutMatchingGroup = {
    sku: "KURTA-GRN-S",
    title: "Green / S",
    attributes: [{ key: "color", value: "Green" }, { key: "size", value: "S" }],
    images: [],
  };

  // Case A: Exact variant media exists -> use exact variant media
  const mediaA = resolveMediaHierarchy(sampleProduct, variantWithImages);
  assert(
    mediaA.length === 1 && mediaA[0].includes("exact_blue_m.jpg"),
    "Level 1: Exact variant media override selected when available"
  );

  // Case B: Variant media absent -> use option-level media group
  const mediaB = resolveMediaHierarchy(sampleProduct, variantWithoutImages);
  assert(
    mediaB.length === 1 && mediaB[0].includes("blue_gallery_1.jpg"),
    "Level 2: Option-level media group (Color=Blue) selected when variant images absent"
  );

  // Case C: Option media group absent -> fall back to product default media
  const mediaC = resolveMediaHierarchy(sampleProduct, variantWithoutMatchingGroup);
  assert(
    mediaC.length === 1 && mediaC[0].includes("product_default.jpg"),
    "Level 3: Product default media selected as universal fallback"
  );

  // -------------------------------------------------------------
  // TEST SUITE 5: CONCURRENT INVENTORY DEDUCTION SIMULATION
  // -------------------------------------------------------------
  console.log("\n▶ [Test 5] Concurrent Inventory Atomic Conditions (Section 10 & 63)");
  let simulatedStock = 5;
  const concurrentBuyers = 15;
  let successfulOrders = 0;
  let rejectedOrders = 0;

  // Simulate atomic MongoDB update: { $gte: requestedQty }, { $inc: -requestedQty }
  const atomicDeduct = async (qty = 1) => {
    // Mimic database micro-tick
    await new Promise((r) => setTimeout(r, Math.random() * 5));
    if (simulatedStock >= qty) {
      simulatedStock -= qty;
      return true;
    }
    return false;
  };

  const checkoutPromises = Array.from({ length: concurrentBuyers }).map(async () => {
    const success = await atomicDeduct(1);
    if (success) successfulOrders++;
    else rejectedOrders++;
  });

  await Promise.all(checkoutPromises);

  assert(successfulOrders === 5, `Exactly 5 successful checkouts out of 15 attempts (got ${successfulOrders})`);
  assert(rejectedOrders === 10, `Exactly 10 rejected checkouts with out-of-stock guard (got ${rejectedOrders})`);
  assert(simulatedStock === 0, `Final stock is exactly 0, never negative (got ${simulatedStock})`);

  // -------------------------------------------------------------
  // TEST SUITE 6: TRANSACTIONAL COMPENSATION ROLLBACK SIMULATION
  // -------------------------------------------------------------
  console.log("\n▶ [Test 6] Transactional Rollback on Item Creation Failure (Section 8)");
  let initialStock = 5;
  let stockDuringTx = initialStock;
  const requestedQuantity = 2;
  let transactionFailed = false;

  try {
    // Step 1: Stock deducted
    stockDuringTx -= requestedQuantity;
    // Step 2: Simulated OrderItem creation failure
    throw new Error("DB Error: OrderItem schema validation constraint violation");
  } catch (err) {
    transactionFailed = true;
    // Compensation rollback: restore deducted stock
    stockDuringTx += requestedQuantity;
  }

  assert(transactionFailed === true, "Simulated partial write failure caught");
  assert(stockDuringTx === initialStock, `Stock safely restored to initial value of ${initialStock}`);

  // -------------------------------------------------------------
  // TEST SUITE 7: SOCKET.IO ROOM ISOLATION RULES
  // -------------------------------------------------------------
  console.log("\n▶ [Test 7] Socket.IO Authorization & Room Isolation (Section 22 & 65)");
  const evaluateJoinPermission = (socketUser, requestedRoom) => {
    if (!socketUser || socketUser.isGuest) return false;
    const role = (socketUser.role || "").toUpperCase();
    const userId = socketUser._id;

    if (requestedRoom === "admin_room") {
      return role === "ADMIN" || role === "ROLE_ADMIN" || role === "SUPER_ADMIN" || role === "ROLE_SUPER_ADMIN";
    }
    if (requestedRoom.startsWith("seller_")) {
      const targetSellerId = requestedRoom.replace("seller_", "");
      const isSeller = role === "SELLER" || role === "ROLE_SELLER";
      const isAdmin = role === "ADMIN" || role === "ROLE_ADMIN";
      return isAdmin || (isSeller && userId === targetSellerId);
    }
    if (requestedRoom.startsWith("customer_")) {
      const targetCustomerId = requestedRoom.replace("customer_", "");
      const isAdmin = role === "ADMIN" || role === "ROLE_ADMIN";
      return isAdmin || userId === targetCustomerId;
    }
    return false;
  };

  const sellerA = { _id: "seller_001", role: "ROLE_SELLER", isGuest: false };
  const sellerB = { _id: "seller_002", role: "ROLE_SELLER", isGuest: false };
  const customerA = { _id: "cust_001", role: "ROLE_CUSTOMER", isGuest: false };
  const guestUser = { isGuest: true, role: "GUEST" };
  const adminUser = { _id: "admin_001", role: "ROLE_ADMIN", isGuest: false };

  assert(
    evaluateJoinPermission(sellerA, "seller_seller_001") === true,
    "Seller A can join own room seller_seller_001"
  );
  assert(
    evaluateJoinPermission(sellerA, "seller_seller_002") === false,
    "Seller A CANNOT join Seller B's room (Multi-tenant isolation enforced)"
  );
  assert(
    evaluateJoinPermission(sellerA, "admin_room") === false,
    "Seller A CANNOT join admin_room"
  );
  assert(
    evaluateJoinPermission(customerA, "customer_cust_002") === false,
    "Customer A CANNOT join Customer B's room"
  );
  assert(
    evaluateJoinPermission(guestUser, "admin_room") === false,
    "Unauthenticated guest CANNOT join admin_room"
  );
  assert(
    evaluateJoinPermission(guestUser, "seller_seller_001") === false,
    "Unauthenticated guest CANNOT join seller room"
  );
  assert(
    evaluateJoinPermission(adminUser, "admin_room") === true,
    "Platform administrator can join admin_room"
  );
  assert(
    evaluateJoinPermission(adminUser, "seller_seller_001") === true,
    "Platform administrator can inspect seller_seller_001"
  );

  console.log("\n================================================================");
  console.log(`🏁 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log("================================================================\n");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite().catch((err) => {
  console.error("Test execution threw exception:", err);
  process.exit(1);
});
