/**
 * Zosh Bazaar Email Platform — Constants
 */

export const DEFAULT_RETRY_CONFIG = Object.freeze({
  maxAttempts: 3,
  initialDelayMs: 2000,
  maxDelayMs: 30000,
  backoffFactor: 2,
});

export const IDEMPOTENCY_DEFAULT_TTL_SECONDS = 86400; // 24 hours

export const SUPPORTED_LOCALES = Object.freeze(["en-IN", "hi-IN"]);
export const DEFAULT_LOCALE = "en-IN";

export const QUEUE_NAMES = Object.freeze({
  EMAIL_QUEUE: "email:queue",
  EMAIL_DEAD_LETTER: "email:dead_letter",
  EMAIL_PROCESSING: "email:processing",
});

export const EMAIL_LIMITS = Object.freeze({
  maxRecipients: 10,
  maxSubjectLength: 200,
  maxBodyLengthBytes: 2 * 1024 * 1024, // 2MB
  queueBatchSize: 10,
  workerPollIntervalMs: 500,
});
