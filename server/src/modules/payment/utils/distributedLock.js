import { redisClient } from "../../../config/redis.service.js";

/**
 * Distributed Lock Utility
 * Protects concurrent operations (e.g. wallet debits, intent state transitions, stock updates)
 * Uses Redis SET NX EX with graceful fallback to in-memory lock if Redis is offline.
 */
class DistributedLock {
  constructor() {
    this.localLocks = new Map();
  }

  static async acquire(resourceKey, ttlMsOrSec = 10) {
    const ttlSec = ttlMsOrSec > 100 ? Math.ceil(ttlMsOrSec / 1000) : ttlMsOrSec;
    const res = await distributedLock.acquire(resourceKey, ttlSec);
    return res.acquired ? res.lockToken : null;
  }

  static async release(resourceKey, lockToken) {
    return await distributedLock.release(resourceKey, lockToken);
  }

  /**
   * Acquire a lock on a key.
   * @param {string} resourceKey - Unique identifier (e.g. `lock:wallet:userId`)
   * @param {number} ttlSeconds - Time-to-live in seconds (default: 10)
   * @returns {Promise<{ acquired: boolean, lockToken: string }>}
   */
  async acquire(resourceKey, ttlSeconds = 10) {
    const lockToken = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const fullKey = `lock:${resourceKey}`;

    if (redisClient.isConnected()) {
      try {
        const result = await redisClient.redis.set(
          fullKey,
          lockToken,
          "EX",
          ttlSeconds,
          "NX"
        );
        if (result === "OK") {
          return { acquired: true, lockToken };
        }
        return { acquired: false, lockToken: null };
      } catch (err) {
        console.warn("[DistributedLock] Redis set error, falling back to local lock:", err.message);
      }
    }

    // In-memory fallback
    const now = Date.now();
    const existing = this.localLocks.get(fullKey);
    if (existing && existing.expiresAt > now) {
      return { acquired: false, lockToken: null };
    }

    this.localLocks.set(fullKey, {
      lockToken,
      expiresAt: now + ttlSeconds * 1000,
    });
    return { acquired: true, lockToken };
  }

  /**
   * Release a previously acquired lock.
   * @param {string} resourceKey
   * @param {string} lockToken
   */
  async release(resourceKey, lockToken) {
    if (!lockToken) return false;
    const fullKey = `lock:${resourceKey}`;

    if (redisClient.isConnected()) {
      try {
        const luaScript = `
          if redis.call("get", KEYS[1]) == ARGV[1] then
            return redis.call("del", KEYS[1])
          else
            return 0
          end
        `;
        await redisClient.redis.eval(luaScript, 1, fullKey, lockToken);
        return true;
      } catch (err) {
        console.warn("[DistributedLock] Redis release error:", err.message);
      }
    }

    // In-memory fallback
    const existing = this.localLocks.get(fullKey);
    if (existing && existing.lockToken === lockToken) {
      this.localLocks.delete(fullKey);
      return true;
    }
    return false;
  }
}

export const distributedLock = new DistributedLock();
export { DistributedLock };
export default distributedLock;

