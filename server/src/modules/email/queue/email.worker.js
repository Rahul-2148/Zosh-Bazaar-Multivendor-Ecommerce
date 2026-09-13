import { emailQueue } from "./email.queue.js";
import { isRetryableError, calculateBackoffDelay } from "./email.retry.js";
import { EMAIL_LIMITS } from "../core/email.constants.js";

let isRunning = false;
let workerTimer = null;
let activeProcessingCount = 0;
const MAX_CONCURRENT_JOBS = 5;

// Dispatcher handler reference injected lazily to prevent circular imports
let jobProcessor = null;

export function registerJobProcessor(processor) {
  jobProcessor = processor;
}

async function processNextJob() {
  if (!isRunning || activeProcessingCount >= MAX_CONCURRENT_JOBS) {
    return;
  }

  try {
    const job = await emailQueue.dequeue();
    if (!job) {
      return;
    }

    activeProcessingCount++;

    // Execute job asynchronously
    (async () => {
      try {
        if (jobProcessor) {
          await jobProcessor(job);
        } else {
          console.warn("[EmailWorker] No job processor registered, job discarded");
        }
      } catch (err) {
        job.attempts = (job.attempts || 0) + 1;
        job.lastAttemptAt = new Date().toISOString();
        job.error = err.message;

        if (isRetryableError(err, job.attempts, job.maxAttempts)) {
          const delayMs = calculateBackoffDelay(job.attempts);
          console.warn(
            `[EmailWorker] Job ${job.id} failed (attempt ${job.attempts}/${job.maxAttempts}). Retrying in ${delayMs}ms:`,
            err.message
          );
          setTimeout(() => {
            emailQueue.enqueue(job.payload).catch((e) => {
              console.error("[EmailWorker] Re-enqueue error:", e.message);
            });
          }, delayMs);
        } else {
          console.error(
            `[EmailWorker] Job ${job.id} failed permanently. Moving to dead-letter queue:`,
            err.message
          );
          await emailQueue.moveToDeadLetter(job, err.message);
        }
      } finally {
        activeProcessingCount--;
      }
    })();
  } catch (err) {
    console.error("[EmailWorker] Worker tick error:", err.message);
  }
}

export function startEmailWorker() {
  if (isRunning) return;
  isRunning = true;
  console.log("📨 [EmailWorker] Async email worker started");

  workerTimer = setInterval(() => {
    processNextJob().catch(() => {});
  }, EMAIL_LIMITS.workerPollIntervalMs);

  if (workerTimer.unref) workerTimer.unref();
}

export function stopEmailWorker() {
  isRunning = false;
  if (workerTimer) {
    clearInterval(workerTimer);
    workerTimer = null;
  }
  console.log("📨 [EmailWorker] Async email worker stopped");
}
