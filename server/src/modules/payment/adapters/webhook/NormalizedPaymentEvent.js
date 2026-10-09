/**
 * Normalized Payment Event (Phase 17)
 * Standardized domain event representation across all payment gateway webhook ingress points.
 * Core payment business logic interacts exclusively with NormalizedPaymentEvent and NEVER
 * parses provider-specific JSON shapes.
 */
export class NormalizedPaymentEvent {
  constructor({
    provider,
    eventId,
    eventType,
    paymentReference = null,
    orderReference = null,
    amount = 0,
    currency = "INR",
    status = "UNKNOWN",
    timestamp = new Date(),
    rawPayload = {},
    metadata = {},
  }) {
    if (!provider || !eventId) {
      throw new Error("NormalizedPaymentEvent requires provider and eventId");
    }
    this.provider = provider.toUpperCase();
    this.eventId = eventId;
    this.eventType = eventType; // 'PAYMENT_CAPTURED' | 'PAYMENT_FAILED' | 'REFUND_PROCESSED'
    this.paymentReference = paymentReference;
    this.orderReference = orderReference;
    this.amount = Number(amount || 0);
    this.currency = (currency || "INR").toUpperCase();
    this.status = status; // 'CAPTURED' | 'FAILED' | 'REFUNDED'
    this.timestamp = timestamp instanceof Date ? timestamp : new Date(timestamp);
    this.rawPayload = rawPayload;
    this.metadata = metadata;
  }
}

export default NormalizedPaymentEvent;
