import { emailDispatcher } from "../core/email.dispatcher.js";
import { providerFactory } from "../providers/provider.factory.js";
import { EmailDeliveryStatus } from "../core/email.types.js";
import { EMAIL_TEMPLATES } from "../templates/index.js";

export async function runIdempotencyTests() {
  console.log("🧪 [Test:Idempotency] Testing deduplication & idempotency enforcement...");
  let passed = 0;
  let failed = 0;

  // Use mock provider to avoid network requests
  providerFactory.setProvider("mock");

  const testKey = `test_order_confirm_${Date.now()}`;
  const testPayload = {
    template: EMAIL_TEMPLATES.CUSTOMER.ORDER_CONFIRMED,
    recipient: "test.customer@zoshbazaar.com",
    data: {
      orderId: "ZB-TEST-IDEMPOTENT-01",
      customerName: "Test Customer",
      total: 999,
      deliveryAddress: {
        addressLine1: "123 Test St",
        city: "Mumbai",
        state: "Maharashtra",
        postalCode: "400001",
      },
    },
    idempotencyKey: testKey,
  };

  try {
    // 1st dispatch: Should succeed and dispatch
    const result1 = await emailDispatcher.dispatchDirect(testPayload);
    if (result1.status !== EmailDeliveryStatus.SENT) {
      throw new Error(`First dispatch failed, expected SENT but got ${result1.status}`);
    }

    // 2nd dispatch with same idempotencyKey: Should be suppressed as DUPLICATE_IGNORED
    const result2 = await emailDispatcher.dispatchDirect(testPayload);
    if (result2.status !== EmailDeliveryStatus.DUPLICATE_IGNORED) {
      throw new Error(`Second dispatch was not deduplicated! Status: ${result2.status}`);
    }

    passed++;
    console.log("  ✓ Idempotency check: First call SENT, duplicate call safely IGNORED.");
  } catch (err) {
    failed++;
    console.error("  ❌ Idempotency test failed:", err.message);
  }

  console.log(`✅ [Test:Idempotency] Completed: ${passed} passed, ${failed} failed.`);
  return { passed, failed };
}
