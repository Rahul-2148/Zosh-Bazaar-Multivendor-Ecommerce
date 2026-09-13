/**
 * Zosh Bazaar Email Platform — Type Definitions & Enums
 */

export const EmailRecipientRole = Object.freeze({
  CUSTOMER: "CUSTOMER",
  SELLER: "SELLER",
  ADMIN: "ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
  LOGISTICS: "LOGISTICS",
  DELIVERY_PARTNER: "DELIVERY_PARTNER",
  SYSTEM: "SYSTEM",
});

export const EmailCategory = Object.freeze({
  TRANSACTIONAL: "TRANSACTIONAL",
  SECURITY: "SECURITY",
  OPERATIONAL: "OPERATIONAL",
  MARKETING: "MARKETING",
});

export const EmailPriority = Object.freeze({
  IMMEDIATE: "IMMEDIATE", // Sync or highest priority queue (e.g. OTP, security alert)
  HIGH: "HIGH",           // Order confirmations, payment alerts
  NORMAL: "NORMAL",       // Shipping updates, delivery reminders
  LOW: "LOW",             // Engagement, digests, review requests
});

export const EmailDeliveryStatus = Object.freeze({
  PENDING: "PENDING",
  QUEUED: "QUEUED",
  SENDING: "SENDING",
  SENT: "SENT",
  FAILED: "FAILED",
  RETRYING: "RETRYING",
  DEAD_LETTER: "DEAD_LETTER",
  DUPLICATE_IGNORED: "DUPLICATE_IGNORED",
  CANCELLED: "CANCELLED",
});

export const EmailProviderType = Object.freeze({
  NODEMAILER: "nodemailer",
  SMTP: "smtp",
  MOCK: "mock",
  RESEND: "resend",
  SES: "ses",
});
