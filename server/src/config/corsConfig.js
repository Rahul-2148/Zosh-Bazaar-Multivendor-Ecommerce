/**
 * Dynamic CORS Origin Resolver
 * Reads allowed origins from ALLOWED_ORIGINS (comma-delimited), individual portal environment variables,
 * or defaults to standard local development ports.
 */
export const getAllowedOrigins = () => {
  if (process.env.ALLOWED_ORIGINS) {
    return process.env.ALLOWED_ORIGINS.split(",")
      .map((origin) => origin.trim().replace(/\/+$/, ""))
      .filter(Boolean);
  }

  const origins = [
    process.env.CLIENT_URL || "http://localhost:5173",
    process.env.LOGISTICS_URL || "http://localhost:5174",
    process.env.SELLER_URL || "http://localhost:5175",
    process.env.ADMIN_URL || "http://localhost:5176",
    process.env.DELIVERY_PARTNER_URL || "http://localhost:5177",
  ].map((url) => url.replace(/\/+$/, ""));

  // In development, ensure localhost and 127.0.0.1 variants are supported
  if (process.env.NODE_ENV !== "production") {
    const localDefaults = [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "http://localhost:5176",
      "http://localhost:5177",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:5174",
      "http://127.0.0.1:5175",
      "http://127.0.0.1:5176",
      "http://127.0.0.1:5177",
    ];
    for (const d of localDefaults) {
      if (!origins.includes(d)) {
        origins.push(d);
      }
    }
  }

  return origins;
};
