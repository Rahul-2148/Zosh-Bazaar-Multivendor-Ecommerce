import crypto from "crypto";
import IdempotencyKey from "../models/idempotencyKey.model.js";

/**
 * P1 — Idempotency Middleware for Financial & Critical Mutations (Section 36)
 * Supports Idempotency-Key or X-Idempotency-Key headers.
 * Safely replays cached responses on duplicates and blocks in-flight conflicts.
 */
export const requireIdempotency = (options = {}) => {
  return async (req, res, next) => {
    const rawKey =
      req.headers["idempotency-key"] ||
      req.headers["x-idempotency-key"] ||
      req.query?.idempotencyKey;

    // If no key supplied and not strictly enforced by route option, proceed normally
    if (!rawKey) {
      if (options.required) {
        return res.status(400).json({
          success: false,
          error: true,
          code: "IDEMPOTENCY_KEY_REQUIRED",
          message: "Idempotency-Key header is required for this operation",
        });
      }
      return next();
    }

    const key = String(rawKey).trim();
    const endpoint = req.originalUrl || req.url;
    const method = req.method;
    const userId = req.user?._id || null;

    const requestHash = crypto
      .createHash("sha256")
      .update(JSON.stringify(req.body || {}))
      .digest("hex");

    try {
      // Check existing record
      const existing = await IdempotencyKey.findOne({ key });

      if (existing) {
        if (existing.status === "COMPLETED") {
          res.setHeader("X-Idempotent-Replay", "true");
          return res.status(existing.responseStatus || 200).json(existing.responseBody);
        }

        if (existing.status === "PENDING") {
          return res.status(409).json({
            success: false,
            error: true,
            code: "IDEMPOTENCY_CONFLICT",
            message: "A mutation with this Idempotency-Key is currently in progress. Please wait.",
          });
        }
      }

      // Reserve the idempotency lock
      const record = new IdempotencyKey({
        key,
        userId,
        method,
        endpoint,
        requestHash,
        status: "PENDING",
      });
      await record.save();

      // Intercept response methods to cache authoritative result
      const originalJson = res.json.bind(res);
      const originalSend = res.send.bind(res);

      res.json = function (body) {
        IdempotencyKey.findOneAndUpdate(
          { key },
          {
            status: res.statusCode < 400 ? "COMPLETED" : "FAILED",
            responseStatus: res.statusCode,
            responseBody: body,
          }
        ).catch((err) => {
          console.warn("[Idempotency] Response caching note:", err.message);
        });
        return originalJson(body);
      };

      res.send = function (body) {
        if (typeof body === "string") {
          try {
            const parsed = JSON.parse(body);
            IdempotencyKey.findOneAndUpdate(
              { key },
              {
                status: res.statusCode < 400 ? "COMPLETED" : "FAILED",
                responseStatus: res.statusCode,
                responseBody: parsed,
              }
            ).catch(() => {});
          } catch {
            // Non-JSON response
          }
        }
        return originalSend(body);
      };

      next();
    } catch (err) {
      // In case another thread created the unique key in the race window
      if (err.code === 11000) {
        return res.status(409).json({
          success: false,
          error: true,
          code: "IDEMPOTENCY_CONFLICT",
          message: "A mutation with this Idempotency-Key is currently in progress.",
        });
      }
      console.warn("[Idempotency Middleware] Fallback to bypass:", err.message);
      next();
    }
  };
};

export default requireIdempotency;
