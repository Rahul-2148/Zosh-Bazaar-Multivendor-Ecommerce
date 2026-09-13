import { enIN } from "./en-IN/messages.js";
import { hiIN } from "./hi-IN/messages.js";

const dictionaries = {
  "en-IN": enIN,
  "en": enIN,
  "hi-IN": hiIN,
  "hi": hiIN,
};

export function getLocale(localeName = "en-IN") {
  return dictionaries[localeName] || dictionaries["en-IN"];
}

/**
 * Interpolates variables into template string: e.g. "Hello {name}"
 */
export function interpolate(templateStr, params = {}) {
  if (!templateStr || typeof templateStr !== "string") return "";
  return templateStr.replace(/\{([\w.]+)\}/g, (_, path) => {
    const value = path.split(".").reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : null), params);
    return value !== null && value !== undefined ? String(value) : "";
  });
}
