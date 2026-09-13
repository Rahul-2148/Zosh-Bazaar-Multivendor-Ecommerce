import { allTemplates } from "../templates/index.js";
import { TemplateNotFoundError } from "./email.errors.js";

class EmailRegistry {
  constructor() {
    this.templates = new Map();
    this.registerAll(allTemplates);
  }

  register(templateKey, templateDef) {
    if (!templateKey || !templateDef) return;
    this.templates.set(templateKey, {
      version: "v1",
      ...templateDef,
      templateKey,
    });
  }

  registerAll(templatesMap) {
    for (const [key, def] of Object.entries(templatesMap)) {
      this.register(key, def);
    }
  }

  get(templateKey) {
    if (!templateKey) {
      throw new TemplateNotFoundError("Undefined template key");
    }

    // Direct key lookup
    if (this.templates.has(templateKey)) {
      return this.templates.get(templateKey);
    }

    // Strip version suffix if present e.g. customer.order.confirmed.v1 -> customer.order.confirmed
    const baseKey = templateKey.replace(/\.v\d+$/, "");
    if (this.templates.has(baseKey)) {
      return this.templates.get(baseKey);
    }

    throw new TemplateNotFoundError(templateKey);
  }

  has(templateKey) {
    if (!templateKey) return false;
    const baseKey = templateKey.replace(/\.v\d+$/, "");
    return this.templates.has(templateKey) || this.templates.has(baseKey);
  }

  getAll() {
    return Array.from(this.templates.values());
  }

  getCount() {
    return this.templates.size;
  }
}

export const emailRegistry = new EmailRegistry();
export default emailRegistry;
