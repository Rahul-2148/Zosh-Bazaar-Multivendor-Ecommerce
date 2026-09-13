/**
 * Zosh Bazaar Email Platform — Runtime Environment Configuration
 */

export const emailConfig = Object.freeze({
  provider: process.env.EMAIL_PROVIDER || (process.env.EMAIL_ADDRESS ? "nodemailer" : "mock"),
  
  // SMTP / Nodemailer configuration
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === "true" || process.env.EMAIL_PORT === "465",
  user: process.env.EMAIL_USER || process.env.EMAIL_ADDRESS || "",
  password: process.env.EMAIL_PASSWORD || "",
  
  // Identity defaults
  fromName: process.env.EMAIL_FROM_NAME || "Zosh Bazaar",
  fromAddress: process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_ADDRESS || "no-reply@zoshbazaar.com",
  replyTo: process.env.EMAIL_REPLY_TO || "support@zoshbazaar.com",
  baseUrl: process.env.SERVER_URL || "http://localhost:5000",
  
  // Rate limits & timeouts
  connectionTimeoutMs: Number(process.env.EMAIL_CONN_TIMEOUT_MS) || 10000,
  greetingTimeoutMs: Number(process.env.EMAIL_GREETING_TIMEOUT_MS) || 5000,
  socketTimeoutMs: Number(process.env.EMAIL_SOCKET_TIMEOUT_MS) || 15000,
  pool: process.env.EMAIL_POOL !== "false",
  maxConnections: Number(process.env.EMAIL_MAX_CONNECTIONS) || 5,
  maxMessages: Number(process.env.EMAIL_MAX_MESSAGES) || 100,

  // Feature Flags
  asyncSendingEnabled: process.env.EMAIL_ASYNC_ENABLED !== "false",
  auditLoggingEnabled: process.env.EMAIL_AUDIT_LOGGING_ENABLED !== "false",
  sandboxMode: process.env.EMAIL_SANDBOX_MODE === "true",
  previewEnabled: process.env.NODE_ENV !== "production",
});
