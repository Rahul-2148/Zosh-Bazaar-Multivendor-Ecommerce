import { runRenderTests } from "./render.test.js";
import { runIdempotencyTests } from "./idempotency.test.js";
import { runRetryTests } from "./retry.test.js";

async function main() {
  console.log("============================================================");
  console.log("ZOSH BAZAAR — EMAIL PLATFORM AUTOMATED TEST SUITE");
  console.log("============================================================\n");

  const startTime = Date.now();

  const retryResults = await runRetryTests();
  console.log("");
  const idempotencyResults = await runIdempotencyTests();
  console.log("");
  const renderResults = await runRenderTests();

  const totalPassed = retryResults.passed + idempotencyResults.passed + renderResults.passed;
  const totalFailed = retryResults.failed + idempotencyResults.failed + renderResults.failed;
  const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log("\n============================================================");
  console.log(`TEST SUMMARY (${elapsedSeconds}s)`);
  console.log("============================================================");
  console.log(`✓ Total Tests Passed: ${totalPassed}`);
  console.log(`❌ Total Tests Failed: ${totalFailed}`);

  if (renderResults.failures.length > 0) {
    console.log("\nFailures Detail:");
    for (const f of renderResults.failures) {
      console.log(`  - ${f.templateKey}: ${f.error}`);
    }
  }

  console.log("============================================================");

  if (totalFailed > 0) {
    process.exit(1);
  } else {
    console.log("🎉 ALL TESTS PASSED SUCCESSFULLY!");
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("Test runner crashed:", err);
  process.exit(1);
});
