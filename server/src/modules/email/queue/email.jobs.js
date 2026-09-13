import crypto from "crypto";
import { EmailPriority } from "../core/email.types.js";

export function createEmailJob(payload) {
  const jobId = `job_${crypto.randomUUID()}`;
  return {
    id: jobId,
    createdAt: new Date().toISOString(),
    priority: payload.priority || EmailPriority.NORMAL,
    attempts: 0,
    maxAttempts: payload.maxAttempts || 3,
    lastAttemptAt: null,
    nextAttemptAt: new Date().toISOString(),
    error: null,
    payload: {
      template: payload.template,
      recipient: payload.recipient,
      data: payload.data || {},
      idempotencyKey: payload.idempotencyKey || null,
      locale: payload.locale || "en-IN",
      priority: payload.priority || EmailPriority.NORMAL,
      metadata: payload.metadata || {},
    },
  };
}
