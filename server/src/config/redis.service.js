import Redis from "ioredis";

class RedisService {
  constructor() {
    this.isReady = false;
    this.memoryCache = new Map(); // Fallback in-memory store
    this.redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

    // Ultra-fast connection config: short timeout, no retry delay on failure
    this.redis = new Redis(this.redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 0,
      connectTimeout: 400,
      enableOfflineQueue: false,
      retryStrategy: () => null, // Never hang or retry if Redis is unavailable locally
    });

    this.redis.on("connect", () => {
      this.isReady = true;
      console.log("Redis connected on", this.redisUrl);
    });

    this.redis.on("ready", () => {
      this.isReady = true;
    });

    this.redis.on("error", () => {
      // Quietly fall back to high-speed in-memory cache
      this.isReady = false;
    });

    this.redis.on("close", () => {
      this.isReady = false;
    });

    // Attempt initial non-blocking probe (0ms hang)
    this.redis.connect().catch(() => {
      this.isReady = false;
    });

    // Periodic sweep for expired keys in memory fallback (unref'd so Node exits cleanly)
    const sweepTimer = setInterval(() => this.sweepMemoryCache(), 60000);
    if (sweepTimer.unref) sweepTimer.unref();
  }

  sweepMemoryCache() {
    const now = Date.now();
    for (const [key, record] of this.memoryCache.entries()) {
      if (record.expiresAt && record.expiresAt <= now) {
        this.memoryCache.delete(key);
      }
    }
  }

  async get(key) {
    if (this.isReady) {
      try {
        const data = await this.redis.get(key);
        if (data !== null) {
          try {
            return JSON.parse(data);
          } catch {
            return data;
          }
        }
      } catch (err) {
        console.warn("Redis get error, reading fallback:", err.message);
      }
    }

    // Fallback: Read from in-memory cache
    const record = this.memoryCache.get(key);
    if (!record) return null;

    if (record.expiresAt && record.expiresAt <= Date.now()) {
      this.memoryCache.delete(key);
      return null;
    }

    return record.value;
  }

  async set(key, value, ttlSeconds = 300) {
    const serialized = typeof value === "object" ? JSON.stringify(value) : String(value);

    // Save to memory cache as guaranteed fallback
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.memoryCache.set(key, { value, expiresAt });

    if (this.isReady) {
      try {
        if (ttlSeconds) {
          await this.redis.set(key, serialized, "EX", ttlSeconds);
        } else {
          await this.redis.set(key, serialized);
        }
      } catch (err) {
        console.warn("Redis set error, relying on memory cache:", err.message);
      }
    }

    return true;
  }

  async del(key) {
    this.memoryCache.delete(key);

    if (this.isReady) {
      try {
        await this.redis.del(key);
      } catch (err) {
        console.warn("Redis del error:", err.message);
      }
    }

    return true;
  }

  async delPattern(pattern) {
    // Purge matching from in-memory cache
    const regex = new RegExp(`^${pattern.replace(/\*/g, ".*")}$`);
    for (const key of this.memoryCache.keys()) {
      if (regex.test(key)) {
        this.memoryCache.delete(key);
      }
    }

    if (this.isReady) {
      try {
        const keys = await this.redis.keys(pattern);
        if (keys && keys.length > 0) {
          await this.redis.del(...keys);
        }
      } catch (err) {
        console.warn("Redis delPattern error:", err.message);
      }
    }

    return true;
  }

  async ttl(key) {
    if (this.isReady) {
      try {
        const seconds = await this.redis.ttl(key);
        if (seconds >= 0) return seconds;
      } catch {
        // Fall back to memory
      }
    }

    const record = this.memoryCache.get(key);
    if (!record || !record.expiresAt) return -1;
    const remainingMs = record.expiresAt - Date.now();
    return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : -2;
  }

  isConnected() {
    return this.isReady;
  }
}

export const redisClient = new RedisService();
