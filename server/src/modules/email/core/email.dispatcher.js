import crypto from "crypto";
import mongoose from "mongoose";
import { redisClient } from "../../../config/redis.service.js";
import { EmailLog } from "../models/emailLog.model.js";
import { emailRenderer } from "./email.renderer.js";
import { providerFactory } from "../providers/provider.factory.js";
import { getSenderProfile } from "../config/sender.config.js";
import { emailConfig } from "../config/email.config.js";
import { registerJobProcessor } from "../queue/email.worker.js";
import {
  EmailDeliveryStatus,
  EmailPriority,
} from "./email.types.js";
import { IDEMPOTENCY_DEFAULT_TTL_SECONDS } from "./email.constants.js";

class EmailDispatcher {
  constructor() {
    this.memoryIdempotencyCache = new Set();
    // Register self as the job processor for background queue worker
    registerJobProcessor(this.processJob.bind(this));
  }

  /**
   * Check if an idempotency key was already completed.
   */
  async checkIdempotency(key) {
    if (!key) return false;
    const redisKey = `email:idempotency:${key}`;

    if (redisClient.isReady) {
      try {
        const exists = await redisClient.get(redisKey);
        return Boolean(exists);
      } catch {
        /* fallback */
      }
    }

    return this.memoryIdempotencyCache.has(key);
  }

  /**
   * Mark an idempotency key as completed.
   */
  async markIdempotent(key, messageId) {
    if (!key) return;
    const redisKey = `email:idempotency:${key}`;

    if (redisClient.isReady) {
      try {
        await redisClient.set(redisKey, messageId, IDEMPOTENCY_DEFAULT_TTL_SECONDS);
        return;
      } catch {
        /* fallback */
      }
    }

    this.memoryIdempotencyCache.add(key);
    // Limit memory cache size
    if (this.memoryIdempotencyCache.size > 2000) {
      const firstItem = this.memoryIdempotencyCache.values().next().value;
      this.memoryIdempotencyCache.delete(firstItem);
    }
  }

  /**
   * Processes a queued job payload.
   */
  async processJob(job) {
    const { payload } = job;
    return await this.dispatchDirect(payload);
  }

  /**
   * Dispatches an email immediately through the selected provider and logs the audit trail.
   */
  async dispatchDirect({
    template,
    recipient,
    data = {},
    idempotencyKey = null,
    locale = "en-IN",
    priority = EmailPriority.NORMAL,
    metadata = {},
    relatedEntityType = null,
    relatedEntityId = null,
  }) {
    if (!recipient) {
      throw new Error("Cannot dispatch email: recipient is required");
    }

    // 1. Check Idempotency
    if (idempotencyKey) {
      const isDuplicate = await this.checkIdempotency(idempotencyKey);
      if (isDuplicate) {
        console.log(`⚡ [EmailDispatcher] Idempotency duplicate suppressed: ${idempotencyKey}`);
        return {
          success: true,
          status: EmailDeliveryStatus.DUPLICATE_IGNORED,
          idempotencyKey,
        };
      }
    }

    const messageId = `msg_${crypto.randomUUID()}`;
    const templateKey = typeof template === "string" ? template : template.templateKey;

    // 2. Render Template
    const rendered = await emailRenderer.render({
      template,
      data,
      locale,
    });

    const sender = getSenderProfile(rendered.recipientRole, rendered.category);
    const provider = providerFactory.getProvider();

    // 3. Create initial EmailLog record if audit logging enabled and database is connected
    let logRecord = null;
    if (emailConfig.auditLoggingEnabled && mongoose.connection.readyState === 1) {
      try {
        logRecord = new EmailLog({
          messageId,
          idempotencyKey,
          templateKey,
          templateVersion: "v1",
          recipient,
          recipientType: rendered.recipientRole,
          category: rendered.category,
          priority: rendered.priority || priority,
          subject: rendered.subject,
          status: EmailDeliveryStatus.SENDING,
          attemptCount: 1,
          provider: provider.name,
          relatedEntityType,
          relatedEntityId,
          metadata,
        });
        await logRecord.save();
      } catch (logErr) {
        console.warn("[EmailDispatcher] Failed to write initial audit log:", logErr.message);
      }
    }

    // 4. Send via Provider
    try {
      const sendResult = await provider.send({
        to: recipient,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
        from: `"${sender.fromName}" <${sender.fromAddress}>`,
        replyTo: sender.replyTo,
      });

      // 5. Update Audit Log on Success
      if (logRecord) {
        logRecord.status = EmailDeliveryStatus.SENT;
        logRecord.sentAt = new Date();
        logRecord.providerMessageId = sendResult.messageId;
        await logRecord.save();
      }

      // 6. Mark Idempotent
      if (idempotencyKey) {
        await this.markIdempotent(idempotencyKey, sendResult.messageId || messageId);
      }

      return {
        success: true,
        messageId: sendResult.messageId || messageId,
        status: EmailDeliveryStatus.SENT,
        provider: provider.name,
      };
    } catch (sendError) {
      // Update Audit Log on Failure
      if (logRecord) {
        logRecord.status = EmailDeliveryStatus.FAILED;
        logRecord.failedAt = new Date();
        logRecord.failureReason = sendError.message;
        await logRecord.save();
      }
      throw sendError;
    }
  }
}

export const emailDispatcher = new EmailDispatcher();
export default emailDispatcher;
