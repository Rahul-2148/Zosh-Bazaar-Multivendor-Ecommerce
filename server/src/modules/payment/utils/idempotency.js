import crypto from "crypto";
import mongoose from "mongoose";
import { IdempotencyKey } from "../../../models/idempotencyKey.model.js";
import { redisClient } from "../../../config/redis.service.js";

/**
 * Idempotency Helper for Financial & Money-Moving Operations
 * Ensures that identical requests with the same key produce the identical cached result.
 */
export class IdempotencyManager {
  static hashPayload(payload) {
    return crypto
      .createHash("sha256")
      .update(typeof payload === "string" ? payload : JSON.stringify(payload || {}))
      .digest("hex");
  }

  static generateRequestHash(payload) {
    return this.hashPayload(payload);
  }

  /**
   * Check if an operation has already been executed.
   * @param {string} key - Client-provided Idempotency-Key
   * @param {string} endpoint - API route or operation name
   * @param {any} payload - Request payload to verify against tampering
   */
  static async getExistingResult(key, endpoint, payload = {}) {
    if (!key) return null;
    const requestHash = this.hashPayload(payload);

    // 1. Fast Redis check
    const cached = await redisClient.get(`idempotency:${key}`);
    if (cached) {
      if (cached.requestHash && cached.requestHash !== requestHash) {
        const error = new Error("Idempotency key reused with different request payload");
        error.statusCode = 409;
        error.code = "IDEMPOTENCY_KEY_REUSE";
        throw error;
      }
      return cached;
    }

    // 2. Durable MongoDB check (if MongoDB connection is ready)
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      const record = await IdempotencyKey.findOne({ key, endpoint });
      if (record) {
        if (record.requestHash && record.requestHash !== requestHash) {
          const error = new Error("Idempotency key reused with different request payload");
          error.statusCode = 409;
          error.code = "IDEMPOTENCY_KEY_REUSE";
          throw error;
        }
        if (record.status === "COMPLETED") {
          return {
            status: record.responseStatus,
            data: record.responseBody,
          };
        }
      }
    }

    return null;
  }

  /**
   * Record the authoritative result for an idempotency key.
   */
  static async recordResult(key, endpoint, method, payload, statusCode, responseBody, userId = null) {
    if (!key) return;
    const requestHash = this.hashPayload(payload);

    // Write to Redis (1 hour TTL)
    await redisClient.set(
      `idempotency:${key}`,
      {
        status: statusCode,
        data: responseBody,
        requestHash,
      },
      3600
    );

    // Write to MongoDB (24 hour TTL) if MongoDB is connected
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      await IdempotencyKey.findOneAndUpdate(
        { key },
        {
          key,
          userId: userId || null,
          method: method || "POST",
          endpoint,
          requestHash,
          responseStatus: statusCode,
          responseBody,
          status: "COMPLETED",
        },
        { upsert: true, new: true }
      );
    }
  }
}

export default IdempotencyManager;
