import { emailDispatcher } from "./email.dispatcher.js";
import { emailQueue } from "../queue/email.queue.js";
import { emailRegistry } from "./email.registry.js";
import { DOMAIN_EVENT_TO_TEMPLATES, emailEvents } from "./email.events.js";
import { EmailPriority, EmailDeliveryStatus } from "./email.types.js";
import { EmailLog } from "../models/emailLog.model.js";
import { providerFactory } from "../providers/provider.factory.js";
import { emailConfig } from "../config/email.config.js";
import { getSenderProfile } from "../config/sender.config.js";

class EmailService {
  constructor() {
    this.setupDomainEventForwarding();
  }

  /**
   * Listen to domain events emitted on emailEvents bus and auto-dispatch corresponding email templates.
   */
  setupDomainEventForwarding() {
    emailEvents.on("domain_event", async ({ event, payload }) => {
      try {
        await this.handleDomainEvent(event, payload);
      } catch (err) {
        console.error(`[EmailService] Failed handling domain event '${event}':`, err.message);
      }
    });
  }

  /**
   * Primary method for sending templated emails.
   *
   * @param {Object} options
   * @param {string} options.template - Template key (e.g., EMAIL_TEMPLATES.CUSTOMER.AUTH_LOGIN_OTP)
   * @param {string} options.recipient - Target email address
   * @param {Object} [options.data={}] - Template view model data
   * @param {string} [options.idempotencyKey=null] - Unique key to prevent duplicates
   * @param {string} [options.priority=EmailPriority.NORMAL] - Job priority
   * @param {boolean} [options.sync=false] - If true, dispatches immediately; if false, pushes to async queue
   * @param {string} [options.locale='en-IN'] - Locale identifier
   * @param {string} [options.relatedEntityType=null] - e.g., 'Order', 'User', 'Seller'
   * @param {string} [options.relatedEntityId=null] - Corresponding ID
   * @param {Object} [options.metadata={}] - Additional tracing metadata
   */
  async sendTemplate({
    template,
    recipient,
    data = {},
    idempotencyKey = null,
    priority = EmailPriority.NORMAL,
    sync = false,
    locale = "en-IN",
    relatedEntityType = null,
    relatedEntityId = null,
    metadata = {},
  }) {
    if (!recipient) {
      throw new Error("Recipient email address is required to send an email");
    }

    if (!template) {
      throw new Error("Template identifier is required to send an email");
    }

    // Validate that template exists in the registry
    if (!emailRegistry.has(template)) {
      throw new Error(`Email template not found in registry: '${template}'`);
    }

    const payload = {
      template,
      recipient,
      data,
      idempotencyKey,
      priority,
      locale,
      relatedEntityType,
      relatedEntityId,
      metadata,
    };

    // Synchronous immediate dispatch (useful for time-critical OTPs, CLI scripts, tests)
    if (sync) {
      return await emailDispatcher.dispatchDirect(payload);
    }

    // Asynchronous queue dispatch (standard for production web traffic)
    const job = await emailQueue.enqueue(payload);
    return {
      success: true,
      queued: true,
      jobId: job.id,
      status: EmailDeliveryStatus.QUEUED,
    };
  }

  /**
   * Direct raw email sending for utility functions, migrations, or custom system alerts.
   */
  async sendDirect({
    to,
    recipient,
    subject,
    html,
    text = "",
    from = null,
    replyTo = null,
  }) {
    const targetEmail = recipient || to;
    if (!targetEmail) {
      throw new Error("Recipient email is required for direct sending");
    }

    const provider = providerFactory.getProvider();
    const defaultSender = getSenderProfile();

    const result = await provider.send({
      to: targetEmail,
      subject,
      html,
      text: text || html.replace(/<[^>]*>?/gm, ""),
      from: from || `"${defaultSender.fromName}" <${defaultSender.fromAddress}>`,
      replyTo: replyTo || defaultSender.replyTo,
    });

    return {
      success: true,
      messageId: result.messageId,
      provider: provider.name,
      status: EmailDeliveryStatus.SENT,
    };
  }

  /**
   * Handle an event triggered by the domain.
   */
  async handleDomainEvent(event, payload) {
    const mapping = DOMAIN_EVENT_TO_TEMPLATES[event];
    if (!mapping) {
      return null;
    }

    const templateList = Array.isArray(mapping)
      ? mapping
      : mapping.templateKey
      ? [mapping.templateKey]
      : [];

    if (templateList.length === 0) {
      return null;
    }

    const results = [];
    for (const templateKey of templateList) {
      const isSeller = templateKey.startsWith("seller.");
      const isDelivery = templateKey.startsWith("delivery.") || templateKey.startsWith("delivery_partner.");

      let recipient = payload.recipient || payload.email;
      if (isSeller) {
        recipient =
          payload.sellerEmail ||
          payload.seller?.email ||
          payload.order?.seller?.email ||
          payload.recipient ||
          payload.email;
      } else if (isDelivery) {
        recipient =
          payload.partnerEmail ||
          payload.deliveryPartner?.email ||
          payload.recipient ||
          payload.email;
      }

      if (!recipient) {
        console.warn(`[EmailService] No recipient resolved for template '${templateKey}' on event '${event}'`);
        continue;
      }

      const entityId = payload.orderId || payload.order?._id || payload.id || payload.userId || Date.now();
      const idempotencyKey = `${event}:${templateKey}:${entityId}`;

      try {
        const res = await this.sendTemplate({
          template: templateKey,
          recipient,
          data: payload,
          idempotencyKey,
          priority: isSeller ? EmailPriority.NORMAL : EmailPriority.HIGH,
          relatedEntityType: payload.entityType || (payload.order ? "Order" : "User"),
          relatedEntityId: entityId,
        });
        results.push(res);
      } catch (err) {
        console.error(`[EmailService] Error dispatching '${templateKey}' for event '${event}':`, err.message);
      }
    }

    return results;
  }

  /**
   * Query email delivery audit logs with filtering and pagination.
   */
  async getAuditHistory({
    recipient = null,
    templateKey = null,
    status = null,
    limit = 50,
    page = 1,
  } = {}) {
    const filter = {};
    if (recipient) filter.recipient = recipient;
    if (templateKey) filter.templateKey = templateKey;
    if (status) filter.status = status;

    const skip = (page - 1) * limit;
    const [records, total] = await Promise.all([
      EmailLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      EmailLog.countDocuments(filter),
    ]);

    return {
      records,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Get operational health metrics for monitoring dashboards and health checks.
   */
  async getMetrics() {
    const queueMetrics = await emailQueue.getMetrics();
    const provider = providerFactory.getProvider();

    let sentToday = 0;
    let failedToday = 0;

    if (emailConfig.auditLoggingEnabled) {
      try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        [sentToday, failedToday] = await Promise.all([
          EmailLog.countDocuments({
            status: EmailDeliveryStatus.SENT,
            createdAt: { $gte: startOfDay },
          }),
          EmailLog.countDocuments({
            status: EmailDeliveryStatus.FAILED,
            createdAt: { $gte: startOfDay },
          }),
        ]);
      } catch {
        /* ignore DB disconnect */
      }
    }

    return {
      status: "healthy",
      provider: provider.name,
      queue: queueMetrics,
      statsToday: {
        sent: sentToday,
        failed: failedToday,
      },
      registeredTemplatesCount: emailRegistry.getCount(),
    };
  }
}

export const emailService = new EmailService();
export default emailService;
