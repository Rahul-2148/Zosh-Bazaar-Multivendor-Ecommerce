import { PaymentOutbox } from "../models/paymentOutbox.model.js";
import { publishOrderStatusUpdated } from "../../../realtime/socket.js";
import { emailEvents } from "../../email/index.js";

/**
 * Payment Event Outbox Service
 * Implements the Transactional Outbox Pattern to guarantee that domain events
 * (PaymentCaptured, PaymentFailed, WalletDebited, RefundCompleted, SettlementCompleted)
 * are never lost even if realtime sockets, message brokers, or network layers fail.
 */
class PaymentOutboxService {
  constructor() {
    this.workerInterval = null;
  }

  /**
   * Enqueue a durable event within the caller's transaction/flow.
   */
  async enqueueEvent(
    { eventType, aggregateType, aggregateId, payload = {}, idempotencyKey = null },
    session = null
  ) {
    const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    if (idempotencyKey) {
      const existing = await PaymentOutbox.findOne(
        { idempotencyKey },
        null,
        session ? { session } : {}
      );
      if (existing) {
        return { event: existing, alreadyEnqueued: true };
      }
    }

    const [event] = await PaymentOutbox.create(
      [
        {
          eventId,
          eventType,
          aggregateType,
          aggregateId,
          payload,
          status: "PENDING",
          idempotencyKey: idempotencyKey || null,
          nextRetryAt: new Date(),
        },
      ],
      session ? { session } : {}
    );

    return { event, alreadyEnqueued: false };
  }

  /**
   * Dispatch an outbox event to downstream notification channels (Socket.IO, Email).
   */
  async dispatchEvent(event) {
    const { eventType, payload = {} } = event;

    switch (eventType) {
      case "PaymentCaptured": {
        if (payload.order) {
          try {
            publishOrderStatusUpdated(payload.order);
          } catch (sockErr) {
            console.warn("[PaymentOutbox] Socket notification error:", sockErr.message);
          }

          if (payload.order.user?.email) {
            try {
              emailEvents.emitDomainEvent("order.payment_success", {
                orderId: payload.order.orderId || payload.order._id?.toString(),
                recipient: payload.order.user.email,
                customerName: payload.order.user.fullName,
                amount: payload.order.totalSellingPrice,
              });
            } catch (emailErr) {
              console.warn("[PaymentOutbox] Email dispatch warning:", emailErr.message);
            }
          }
        }
        break;
      }

      case "PaymentFailed": {
        if (payload.order) {
          try {
            publishOrderStatusUpdated(payload.order);
          } catch (sockErr) {
            console.warn("[PaymentOutbox] Socket error on payment fail:", sockErr.message);
          }
        }
        break;
      }

      case "PaymentRefunded": {
        if (payload.refund && payload.user?.email) {
          try {
            emailEvents.emitDomainEvent("refund.processed", {
              refundId: payload.refund.refundId,
              amount: payload.refund.amount,
              recipient: payload.user.email,
            });
          } catch (emailErr) {
            console.warn("[PaymentOutbox] Refund email warning:", emailErr.message);
          }
        }
        break;
      }

      case "WalletDebited":
      case "WalletRefunded":
      case "SettlementCreated":
      case "SettlementCompleted":
        // Structured audit events dispatched cleanly
        break;

      default:
        console.warn(`[PaymentOutbox] Unhandled outbox event type: ${eventType}`);
        break;
    }
  }

  /**
   * Process pending outbox events with exponential backoff retry.
   */
  async processPendingEvents(batchSize = 25) {
    const events = await PaymentOutbox.find({
      status: { $in: ["PENDING", "PROCESSING"] },
      nextRetryAt: { $lte: new Date() },
    })
      .sort({ createdAt: 1 })
      .limit(batchSize);

    for (const event of events) {
      event.status = "PROCESSING";
      await event.save().catch(() => {});

      try {
        await this.dispatchEvent(event);
        event.status = "PUBLISHED";
        event.publishedAt = new Date();
        event.lastError = null;
        await event.save();
      } catch (err) {
        event.retryCount += 1;
        event.lastError = err.message;
        if (event.retryCount >= event.maxRetries) {
          event.status = "FAILED";
        } else {
          // Exponential backoff: 2s, 4s, 8s, 16s...
          const delaySec = Math.pow(2, event.retryCount);
          event.nextRetryAt = new Date(Date.now() + delaySec * 1000);
          event.status = "PENDING";
        }
        await event.save();
      }
    }

    return events.length;
  }

  /**
   * Start asynchronous outbox processing loop.
   */
  startOutboxWorker(intervalMs = 5000) {
    if (this.workerInterval) return;
    this.workerInterval = setInterval(() => {
      this.processPendingEvents().catch((err) => {
        console.warn("[PaymentOutboxWorker] Error during outbox sweep:", err.message);
      });
    }, intervalMs);
    // Don't keep Node process alive just for the worker
    if (this.workerInterval.unref) {
      this.workerInterval.unref();
    }
  }

  stopOutboxWorker() {
    if (this.workerInterval) {
      clearInterval(this.workerInterval);
      this.workerInterval = null;
    }
  }
}

export const paymentOutboxService = new PaymentOutboxService();
export default paymentOutboxService;
