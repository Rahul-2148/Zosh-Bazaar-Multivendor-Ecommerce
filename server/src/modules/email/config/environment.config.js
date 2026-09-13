/**
 * Zosh Bazaar Email Platform — Environment Switches & Helpers
 */

export const environmentConfig = Object.freeze({
  isProduction: process.env.NODE_ENV === "production",
  isDevelopment: process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test",
  isTest: process.env.NODE_ENV === "test",
  allowDevPreview: process.env.NODE_ENV !== "production",
});
