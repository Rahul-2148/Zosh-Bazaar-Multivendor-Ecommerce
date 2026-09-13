import { redisClient } from "../config/redis.service.js";

/**
 * Rate limiter middleware using Redis (with in-memory fallback).
 * Configurable per-route rate limits.
 */
export const createRateLimiter = ({ windowSeconds = 3600, maxRequests = 3, keyPrefix = "rl" }) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?._id?.toString();
      if (!userId) return next(); // Skip if no authenticated user

      const key = `${keyPrefix}:${userId}`;
      const current = await redisClient.get(key);
      const count = current ? parseInt(current, 10) : 0;

      if (count >= maxRequests) {
        const ttl = await redisClient.ttl(key);
        return res.status(429).json({
          success: false,
          error: true,
          code: "RATE_LIMITED",
          message: `Too many requests. Please try again in ${Math.max(1, ttl)} seconds.`,
          retryAfter: Math.max(1, ttl),
        });
      }

      await redisClient.set(key, String(count + 1), windowSeconds);
      next();
    } catch (err) {
      // Rate limiting should never block the request on failure
      console.error("[RateLimiter] Error:", err.message);
      next();
    }
  };
};

/**
 * Pre-built rate limiters for account lifecycle endpoints
 */
export const deletionRequestLimiter = createRateLimiter({
  windowSeconds: 3600,
  maxRequests: 3,
  keyPrefix: "rl_deletion",
});

export const verificationOtpLimiter = createRateLimiter({
  windowSeconds: 300,
  maxRequests: 5,
  keyPrefix: "rl_verify_otp",
});

export const supportRequestLimiter = createRateLimiter({
  windowSeconds: 3600,
  maxRequests: 2,
  keyPrefix: "rl_support_del",
});
