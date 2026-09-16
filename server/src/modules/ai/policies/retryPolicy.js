/**
 * ZOSH BAZAAR AI ECOSYSTEM 4.0 - RETRY POLICY
 * Exponential backoff with jitter for transient provider failures.
 */

import { AIErrorReason } from '../schemas/normalizedTypes.js';

export const RETRYABLE_ERRORS = new Set([
  AIErrorReason.RATE_LIMITED,
  AIErrorReason.TIMEOUT,
  AIErrorReason.NETWORK_ERROR,
  AIErrorReason.PROVIDER_OVERLOADED,
]);

export function isRetryableError(reason) {
  return RETRYABLE_ERRORS.has(reason);
}

export function calculateBackoffMs(attempt, baseMs = 300, maxMs = 3000) {
  // Exponential backoff: base * 2^attempt with +/- 25% random jitter
  const exp = Math.min(maxMs, baseMs * Math.pow(2, attempt));
  const jitter = exp * (0.75 + Math.random() * 0.5);
  return Math.round(jitter);
}

export async function withRetry(operation, options = {}) {
  const maxRetries = options.maxRetries ?? 2;
  const baseMs = options.baseMs ?? 300;
  const maxMs = options.maxMs ?? 3000;
  const onRetry = options.onRetry || null;

  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation(attempt);
    } catch (err) {
      lastError = err;
      const isRetryable = err.retryable || isRetryableError(err.reason);

      if (attempt < maxRetries && isRetryable) {
        const delay = calculateBackoffMs(attempt, baseMs, maxMs);
        if (onRetry) {
          onRetry({ attempt: attempt + 1, delay, error: err });
        }
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw err;
      }
    }
  }

  throw lastError;
}
