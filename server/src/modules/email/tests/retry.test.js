import { isRetryableError, calculateBackoffDelay } from "../queue/email.retry.js";
import { TransientEmailError, PermanentEmailError } from "../core/email.errors.js";

export async function runRetryTests() {
  console.log("🧪 [Test:Retry] Testing retry classification & exponential backoff...");
  let passed = 0;
  let failed = 0;

  try {
    // 1. Transient error is retryable
    const transientErr = new TransientEmailError("Connection reset by peer");
    if (!isRetryableError(transientErr, 1, 3)) {
      throw new Error("TransientEmailError was marked as non-retryable");
    }
    passed++;

    // 2. Permanent error is not retryable
    const permanentErr = new PermanentEmailError("Invalid email address syntax");
    if (isRetryableError(permanentErr, 1, 3)) {
      throw new Error("PermanentEmailError was marked as retryable");
    }
    passed++;

    // 3. Exceeded max attempts is not retryable
    if (isRetryableError(transientErr, 3, 3)) {
      throw new Error("Exceeded attempts was marked as retryable");
    }
    passed++;

    // 4. Backoff delay increases with attempts
    const delay1 = calculateBackoffDelay(1);
    const delay2 = calculateBackoffDelay(2);
    const delay3 = calculateBackoffDelay(3);

    if (delay2 <= delay1 || delay3 <= delay2) {
      throw new Error(`Backoff delays must increase monotonically. Got: d1=${delay1}, d2=${delay2}, d3=${delay3}`);
    }
    passed++;

    console.log("  ✓ Error classification and exponential backoff calculations verified.");
  } catch (err) {
    failed++;
    console.error("  ❌ Retry test failed:", err.message);
  }

  console.log(`✅ [Test:Retry] Completed: ${passed} passed, ${failed} failed.`);
  return { passed, failed };
}
