import { emailRegistry } from "./email.registry.js";
import { TemplateRenderError } from "./email.errors.js";
import { getLocale, interpolate } from "../localization/index.js";

class EmailRenderer {
  /**
   * Renders a template to complete HTML and plain-text.
   */
  async render({ template, data = {}, locale = "en-IN" }) {
    const templateDef = typeof template === "string" ? emailRegistry.get(template) : template;
    const localeConfig = getLocale(locale);

    try {
      // 1. Evaluate Subject
      let subject = "Zosh Bazaar Notification";
      if (typeof templateDef.subject === "function") {
        subject = templateDef.subject(data, localeConfig);
      } else if (typeof templateDef.subject === "string") {
        subject = interpolate(templateDef.subject, data);
      }

      // 2. Evaluate Preheader
      let preheader = "";
      if (typeof templateDef.preheader === "function") {
        preheader = templateDef.preheader(data, localeConfig);
      } else if (typeof templateDef.preheader === "string") {
        preheader = interpolate(templateDef.preheader, data);
      }

      // 3. Render HTML
      const html = await templateDef.render(data, { locale: localeConfig, preheader, subject });

      // 4. Generate Plain Text alternative
      const text = this.generatePlainText(html);

      return {
        subject,
        preheader,
        html,
        text,
        category: templateDef.category,
        recipientRole: templateDef.recipientRole,
        priority: templateDef.priority,
      };
    } catch (error) {
      console.error(`[EmailRenderer] Error rendering template "${templateDef?.templateKey}":`, error);
      throw new TemplateRenderError(templateDef?.templateKey || "unknown", error);
    }
  }

  /**
   * Converts HTML markup to clean, formatted plain text.
   */
  generatePlainText(html = "") {
    return html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1[^>]*>(.*?)<\/a>/gi, "$3 ($2)")
      .replace(/<br\s*[/]?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<\/tr>/gi, "\n")
      .replace(/<\/td>/gi, "  ")
      .replace(/<\/div>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/\n\s+\n/g, "\n\n")
      .replace(/[ \t]+/g, " ")
      .trim();
  }
}

export const emailRenderer = new EmailRenderer();
export default emailRenderer;
