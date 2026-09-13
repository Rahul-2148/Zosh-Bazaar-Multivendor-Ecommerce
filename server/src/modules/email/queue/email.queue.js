import { redisClient } from "../../../config/redis.service.js";
import { QUEUE_NAMES } from "../core/email.constants.js";
import { createEmailJob } from "./email.jobs.js";

class EmailQueue {
  constructor() {
    this.memoryQueue = [];
    this.deadLetterQueue = [];
  }

  /**
   * Push an email job to the queue.
   */
  async enqueue(payload) {
    const job = createEmailJob(payload);
    const serialized = JSON.stringify(job);

    // If Redis client is active and connected
    if (redisClient.isReady) {
      try {
        await redisClient.redis.lpush(QUEUE_NAMES.EMAIL_QUEUE, serialized);
        return job;
      } catch (err) {
        console.warn("[EmailQueue] Redis push failed, using in-memory queue fallback:", err.message);
      }
    }

    // High-speed in-memory fallback
    this.memoryQueue.push(job);
    return job;
  }

  /**
   * Dequeue the next available job.
   */
  async dequeue() {
    if (redisClient.isReady) {
      try {
        const item = await redisClient.redis.rpop(QUEUE_NAMES.EMAIL_QUEUE);
        if (item) {
          return JSON.parse(item);
        }
      } catch (err) {
        console.warn("[EmailQueue] Redis pop error, falling back to memory queue:", err.message);
      }
    }

    return this.memoryQueue.shift() || null;
  }

  /**
   * Send a permanently failed job to the dead letter queue.
   */
  async moveToDeadLetter(job, reason) {
    const deadJob = {
      ...job,
      deadLetteredAt: new Date().toISOString(),
      fatalReason: reason,
    };

    if (redisClient.isReady) {
      try {
        await redisClient.redis.lpush(QUEUE_NAMES.EMAIL_DEAD_LETTER, JSON.stringify(deadJob));
        return deadJob;
      } catch {
        /* fallback */
      }
    }

    this.deadLetterQueue.push(deadJob);
    // Keep max 500 in memory
    if (this.deadLetterQueue.length > 500) {
      this.deadLetterQueue.shift();
    }
    return deadJob;
  }

  /**
   * Returns current queue lengths for monitoring and admin alerts.
   */
  async getMetrics() {
    let pendingCount = this.memoryQueue.length;
    let deadLetterCount = this.deadLetterQueue.length;

    if (redisClient.isReady) {
      try {
        const [redisPending, redisDead] = await Promise.all([
          redisClient.redis.llen(QUEUE_NAMES.EMAIL_QUEUE),
          redisClient.redis.llen(QUEUE_NAMES.EMAIL_DEAD_LETTER),
        ]);
        pendingCount += redisPending;
        deadLetterCount += redisDead;
      } catch {
        /* ignore */
      }
    }

    return {
      pending: pendingCount,
      deadLetter: deadLetterCount,
    };
  }

  /**
   * Clears memory queues (useful for unit tests).
   */
  clear() {
    this.memoryQueue = [];
    this.deadLetterQueue = [];
  }
}

export const emailQueue = new EmailQueue();
export default emailQueue;
