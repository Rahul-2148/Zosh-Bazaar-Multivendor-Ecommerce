import crypto from "crypto";
import PaymentWebhookEvent from "../../../models/paymentWebhookEvent.model.js";
import paymentOrchestratorService from "./PaymentOrchestratorService.js";
import { PaymentAttempt } from "../models/paymentAttempt.model.js";
import { webhookAdapters } from "../adapters/webhook/ProviderWebhookAdapter.js";
import Money from "../utils/Money.js";

/**
 * Payment Webhook Ingestion Service
 * Authenticates, deduplicates, and idempotently reconciles incoming asynchronous gateway notifications
 * via normalized webhook adapters.
 */
class PaymentWebhookService {
  async processWebhook({ provider = "RAZORPAY", payload, signature, rawBody, headers = {} }) {
    const normProvider = (provider || "RAZORPAY").toUpperCase();
    const webhookAdapter = webhookAdapters[normProvider];

    // Fail-closed against synthetic webhooks in production environments
    const isProduction =
      process.env.NODE_ENV === "production" ||
      process.env.PAYMENT_ENV === "production";
    if (isProduction && (normProvider === "MOCK" || normProvider === "SANDBOX")) {
      const err = new Error(
        `Synthetic provider "${normProvider}" webhooks are strictly prohibited in production environment`
      );
      err.code = "SYNTHETIC_WEBHOOK_PROHIBITED_IN_PROD";
      err.statusCode = 403;
      throw err;
    }

    let verification;
    if (webhookAdapter) {
      const res = await webhookAdapter.processWebhook({ payload, signature, rawBody, headers });
      if (!res.isValid) {
        const err = new Error(`Invalid ${provider} webhook signature`);
        err.statusCode = 400;
        throw err;
      }
      verification = {
        isValid: true,
        eventId: res.normalizedEvent.eventId,
        eventType: res.normalizedEvent.eventType,
        normalizedStatus: res.normalizedEvent.status,
        paymentReference: res.normalizedEvent.paymentReference,
        orderReference: res.normalizedEvent.orderReference,
        amount: res.normalizedEvent.amount,
        normalizedEvent: res.normalizedEvent,
      };
    } else {
      const adapter = paymentOrchestratorService.resolveAdapter(provider);
      verification = await adapter.verifyWebhook({ payload, signature, rawBody });
      if (!verification.isValid) {
        const err = new Error(`Invalid ${provider} webhook signature`);
        err.statusCode = 400;
        throw err;
      }
    }

    const eventId = verification.eventId;
    const eventType = verification.eventType;
    const payloadHash = crypto
      .createHash("sha256")
      .update(rawBody ? rawBody.toString() : JSON.stringify(payload || {}))
      .digest("hex");

    // 2. Idempotency Check in PaymentWebhookEvent
    let eventRecord = await PaymentWebhookEvent.findOne({ provider, eventId });

    if (eventRecord) {
      if (eventRecord.status === "PROCESSED") {
        return {
          duplicate: true,
          processed: true,
          message: "Event already processed idempotently",
          eventId,
        };
      }
      eventRecord.retryCount += 1;
    } else {
      eventRecord = new PaymentWebhookEvent({
        provider,
        eventId,
        eventType,
        signature: signature || "",
        payloadHash,
        status: "PROCESSING",
        receivedAt: new Date(),
        metadata: {
          containsPayment: Boolean(verification.paymentReference),
        },
      });
      await eventRecord.save();
    }

    let lockToken = null;
    try {
      const lockRes = await (await import("../utils/distributedLock.js")).distributedLock.acquire(
        `webhook:${provider}:${eventId}`,
        15
      );
      lockToken = lockRes.lockToken;

      const paymentReference = verification.paymentReference;
      if (paymentReference) {
        eventRecord.paymentId = paymentReference;

        // Find associated PaymentAttempt
        const attempt = await PaymentAttempt.findOne({
          $or: [{ providerReference: paymentReference }, { attemptId: paymentReference }],
        });

        if (attempt) {
          eventRecord.orderId = attempt.intentId;

          // 1. Authoritative Provider Invariant: Webhook provider must match the bound attempt provider
          const attemptProvider = (attempt.provider || attempt.adapter || "").toUpperCase();
          if (attemptProvider && !attemptProvider.includes(normProvider) && !normProvider.includes(attemptProvider)) {
            const err = new Error(
              `Webhook provider mismatch: Received "${normProvider}" for attempt bound to "${attemptProvider}"`
            );
            err.code = "WEBHOOK_PROVIDER_MISMATCH";
            err.statusCode = 422;
            throw err;
          }

          // 2. Authoritative Minor-Unit Amount Invariant: Exact integer paise/cents comparison via canonical Money
          if (verification.amount !== undefined && verification.amount !== null && attempt.amount !== undefined) {
            const webhookMinorUnits = Money.toMinorUnits(verification.amount, "webhook.amount");
            const attemptMinorUnits = Money.toMinorUnits(attempt.amount, "attempt.amount");
            if (webhookMinorUnits !== attemptMinorUnits) {
              const err = new Error(
                `Webhook amount mismatch: Gateway reported ₹${verification.amount} (${webhookMinorUnits} minor units), expected attempt amount ₹${attempt.amount} (${attemptMinorUnits} minor units)`
              );
              err.code = "WEBHOOK_AMOUNT_MISMATCH";
              err.statusCode = 422;
              throw err;
            }
          }

          // 3. Currency Invariant
          const webhookCurrency = verification.normalizedEvent?.currency;
          if (webhookCurrency && attempt.currency && webhookCurrency.toUpperCase() !== attempt.currency.toUpperCase()) {
            const err = new Error(
              `Webhook currency mismatch: Gateway reported "${webhookCurrency}", expected "${attempt.currency}"`
            );
            err.code = "WEBHOOK_CURRENCY_MISMATCH";
            err.statusCode = 422;
            throw err;
          }

          if (verification.normalizedStatus === "CAPTURED") {
            if (attempt.status !== "CAPTURED" && attempt.status !== "SETTLED") {
              await paymentOrchestratorService.handleAttemptCapture({
                attemptId: attempt.attemptId,
                providerReference: paymentReference,
                source: `WEBHOOK_${provider}`,
              });
            }
          } else if (verification.normalizedStatus === "FAILED") {
            // Out-of-order safety: Never regress an already CAPTURED payment
            if (attempt.status === "CAPTURED" || attempt.status === "SETTLED") {
              console.warn(
                `[PaymentWebhook] Ignored out-of-order FAILED webhook for already CAPTURED attempt ${attempt.attemptId}`
              );
              eventRecord.metadata = { ...eventRecord.metadata, outOfOrderIgnored: true };
            } else {
              await paymentOrchestratorService.handleAttemptFailure({
                attemptId: attempt.attemptId,
                failureCode: "WEBHOOK_FAILED",
                failureReason: "Payment failed according to gateway webhook event",
                source: `WEBHOOK_${provider}`,
              });
            }
          }
        } else {
          const err = new Error(
            `Webhook references unknown payment attempt "${paymentReference}"`
          );
          err.code = "WEBHOOK_ATTEMPT_NOT_FOUND";
          err.statusCode = 404;
          throw err;
        }
      }

      eventRecord.status = "PROCESSED";
      eventRecord.processedAt = new Date();
      await eventRecord.save();

      return {
        duplicate: false,
        processed: true,
        eventId,
      };
    } catch (err) {
      eventRecord.status = "FAILED";
      eventRecord.error = err.message;
      await eventRecord.save();
      throw err;
    } finally {
      if (lockToken) {
        await (await import("../utils/distributedLock.js")).distributedLock
          .release(`webhook:${provider}:${eventId}`, lockToken)
          .catch(() => {});
      }
    }
  }
}

export const paymentWebhookService = new PaymentWebhookService();
export default paymentWebhookService;
