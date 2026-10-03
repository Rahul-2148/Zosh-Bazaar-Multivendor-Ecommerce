/**
 * Canonical Variant Signature Utility (Section 15)
 * Normalizes: key casing, whitespace, option ordering, and value representation.
 * Guarantees that "Color=Blue + Size=M" === "Size=M + Color=Blue".
 */
export const generateCanonicalVariantSignature = (attributes) => {
  if (!attributes) return "";

  let list = [];
  if (Array.isArray(attributes)) {
    list = attributes;
  } else if (typeof attributes === "object") {
    list = Object.entries(attributes).map(([key, value]) => ({ key, value }));
  }

  const normalized = list
    .filter((a) => a && (a.key || a.name) && a.value !== undefined && a.value !== null)
    .map((a) => {
      const key = String(a.key || a.name)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "_");
      const value = String(a.value).trim().toLowerCase();
      return { key, value };
    })
    .sort((a, b) => a.key.localeCompare(b.key));

  return normalized.map((a) => `${a.key}=${a.value}`).join("|");
};

export default generateCanonicalVariantSignature;
