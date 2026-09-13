/**
 * Account Lifecycle Configuration
 * All operationally sensitive values are configuration-driven.
 */
const accountLifecycleConfig = {
  // Grace period before final deletion (days)
  GRACE_PERIOD_DAYS: parseInt(process.env.DELETION_GRACE_PERIOD_DAYS) || 14,

  // Whether government ID verification is required for deletion
  REQUIRE_ID_VERIFICATION: process.env.REQUIRE_ID_VERIFICATION === "true",

  // Verification
  MAX_VERIFICATION_ATTEMPTS: parseInt(process.env.MAX_VERIFICATION_ATTEMPTS) || 5,
  VERIFICATION_SESSION_TTL: parseInt(process.env.VERIFICATION_SESSION_TTL) || 3600, // seconds
  VERIFICATION_COOLDOWN_SECONDS: 60,

  // Supported verification methods (only expose what's actually configured)
  SUPPORTED_VERIFICATION_METHODS: ["OTP"],

  // Rate limiting
  DELETION_REQUEST_RATE_LIMIT: parseInt(process.env.DELETION_RATE_LIMIT) || 3, // per hour
  DELETION_REQUEST_RATE_WINDOW: 3600, // seconds (1 hour)

  // OTP
  OTP_COOLDOWN_SECONDS: 60,
  OTP_TTL_SECONDS: 300, // 5 minutes

  // Deletion worker
  WORKER_INTERVAL_MS: parseInt(process.env.DELETION_WORKER_INTERVAL_MS) || 6 * 60 * 60 * 1000, // 6 hours
  WORKER_BATCH_SIZE: 10,

  // Data retention
  RETAIN_ORDER_DATA: true,
  RETAIN_PAYMENT_DATA: true,
  ANONYMIZE_REVIEWS: true,

  // Deactivation
  DEACTIVATION_REASONS: [
    "Taking a break from shopping",
    "Privacy concerns",
    "Too many notifications",
    "Found a better alternative",
    "Temporary break",
    "Other",
  ],

  // Deletion reasons
  DELETION_REASONS: [
    "No longer need the account",
    "Privacy and data concerns",
    "Too many emails/notifications",
    "Bad shopping experience",
    "Security concerns",
    "Duplicate account",
    "Other",
  ],

  // Feature flags
  ENABLE_DEACTIVATION: true,
  ENABLE_DELETION: true,
  ENABLE_CUSTOMER_CARE_FALLBACK: true,
};

export default accountLifecycleConfig;
