import { emailRegistry } from "../core/email.registry.js";
import { emailRenderer } from "../core/email.renderer.js";
import { getFixtureForTemplate } from "../preview/fixtures/email.fixtures.js";

export async function runRenderTests() {
  console.log("🧪 [Test:Render] Testing rendering of all registered email templates...");
  const templates = emailRegistry.getAll();
  let passed = 0;
  let failed = 0;
  const failures = [];

  for (const template of templates) {
    try {
      const fixture = getFixtureForTemplate(template.templateKey);
      const result = await emailRenderer.render({
        template,
        data: fixture,
        locale: "en-IN",
      });

      // Assertions
      if (!result.html || typeof result.html !== "string" || !result.html.includes("<html")) {
        throw new Error("Rendered HTML is missing or invalid <html> tag");
      }
      if (!result.subject || typeof result.subject !== "string") {
        throw new Error("Rendered subject is missing or invalid");
      }
      if (!result.text || typeof result.text !== "string") {
        throw new Error("Rendered text version is missing");
      }
      if (!result.preheader || typeof result.preheader !== "string") {
        throw new Error("Rendered preheader is missing");
      }

      passed++;
    } catch (err) {
      failed++;
      failures.push({
        templateKey: template.templateKey,
        error: err.message,
      });
      console.error(`  ❌ Failed: ${template.templateKey} -> ${err.message}`);
    }
  }

  console.log(`✅ [Test:Render] Completed: ${passed} passed, ${failed} failed out of ${templates.length} templates.`);
  return { passed, failed, failures, total: templates.length };
}
