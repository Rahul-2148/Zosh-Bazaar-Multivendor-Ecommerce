import { DEFAULT_RETRY_CONFIG } from "../core/email.constants.js";
import { TransientEmailError } from "../core/email.errors.js";

/**
 * Calculates exponential backoff delay with jitter.
 */
export function calculateBackoffDelay(
  attempt,
  config = DEFAULT_RETRY_CONFIG
) {
  const { initialDelayMs, maxDelayMs, backoffFactor } = config;
  const rawDelay = initialDelayMs * Math.pow(backoffFactor, Math.max(0, attempt - 1));
  // Add 10-20% jitter to prevent thundering herd
  const jitter = Math.random() * 0.2 * rawDelay;
  return Math.min(maxDelayMs, Math.round(rawDelay + jitter));
}

/**
 * Checks if an error should trigger a retry or fail permanently.
 */
export function isRetryableError(error, currentAttempt, maxAttempts = DEFAULT_RETRY_CONFIG.maxAttempts) {
  if (currentAttempt >= maxAttempts) {
    return false;
  }

  // Explicit transient errors
  if (error instanceof TransientEmailError || error.isTransient) {
    return true;
  }

  // Common network or transient messages
  const msg = (error.message || "").toLowerCase();
  const transientKeywords = [
    "timeout",
    "etimedout",
    "econnreset",
    "econnrefused",
    "rate limit",
    "too many requests",
    "temporary",
    "unavailable",
    "421",
    "451",
    "452",
  ];

  return transientKeywords.some((keyword) => msg.includes(keyword));
}
