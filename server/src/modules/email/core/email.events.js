import { EventEmitter } from "events";
import { EMAIL_TEMPLATES } from "../templates/index.js";

class EmailDomainEventEmitter extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50);
  }

  /**
   * Emit a domain event that triggers domain_event listeners as well as specific event listeners.
   * @param {string} event
   * @param {Object} payload
   */
  emitDomainEvent(event, payload) {
    this.emit("domain_event", { event, payload });
    return this.emit(event, payload);
  }
}

export const emailEvents = new EmailDomainEventEmitter();

/**
 * Standalone helper to emit domain events across the application.
 * @param {string} event
 * @param {Object} payload
 */
export const emitDomainEvent = (event, payload) => emailEvents.emitDomainEvent(event, payload);


/**
 * Master mapping between domain events and corresponding email templates.
 */
export const DOMAIN_EVENT_TO_TEMPLATES = Object.freeze({
  "user.welcome": [EMAIL_TEMPLATES.CUSTOMER.AUTH_WELCOME],
  "user.email_verification.requested": [EMAIL_TEMPLATES.CUSTOMER.AUTH_EMAIL_VERIFICATION],
  "user.login_otp.requested": [EMAIL_TEMPLATES.CUSTOMER.AUTH_LOGIN_OTP],
  "user.password_reset.requested": [EMAIL_TEMPLATES.CUSTOMER.AUTH_PASSWORD_RESET_REQUEST],
  "user.password_reset.completed": [EMAIL_TEMPLATES.CUSTOMER.AUTH_PASSWORD_RESET_SUCCESS],
  "user.password_changed": [EMAIL_TEMPLATES.CUSTOMER.AUTH_PASSWORD_CHANGED],
  "user.new_login": [EMAIL_TEMPLATES.CUSTOMER.AUTH_NEW_LOGIN],
  "user.suspicious_login": [EMAIL_TEMPLATES.CUSTOMER.AUTH_SUSPICIOUS_LOGIN],
  "user.account_deactivated": [EMAIL_TEMPLATES.CUSTOMER.ACCOUNT_DEACTIVATED],
  "user.account_deletion.requested": [EMAIL_TEMPLATES.CUSTOMER.ACCOUNT_DELETION_OTP],
  "user.account_deletion.scheduled": [EMAIL_TEMPLATES.CUSTOMER.ACCOUNT_DELETION_SCHEDULED],
  "user.account_deletion.cancelled": [EMAIL_TEMPLATES.CUSTOMER.ACCOUNT_DELETION_CANCELLED],
  "user.account_deleted": [EMAIL_TEMPLATES.CUSTOMER.ACCOUNT_PERMANENTLY_DELETED],

  "seller.registered": [EMAIL_TEMPLATES.SELLER.ONBOARDING_REGISTERED],
  "seller.otp.requested": [EMAIL_TEMPLATES.SELLER.AUTH_OTP],
  "seller.approved": [EMAIL_TEMPLATES.SELLER.ONBOARDING_APPROVED],
  "seller.suspended": [EMAIL_TEMPLATES.SELLER.ACCOUNT_SUSPENDED],
  "seller.reactivated": [EMAIL_TEMPLATES.SELLER.ACCOUNT_REACTIVATED],

  // Orders & Shipments: support both 'order.created' / 'order.placed', 'shipment.*', and 'seller.*'
  "order.created": [EMAIL_TEMPLATES.CUSTOMER.ORDER_PLACED, EMAIL_TEMPLATES.SELLER.NEW_ORDER],
  "order.placed": [EMAIL_TEMPLATES.CUSTOMER.ORDER_PLACED, EMAIL_TEMPLATES.SELLER.NEW_ORDER],
  "seller.order_received": [EMAIL_TEMPLATES.SELLER.NEW_ORDER],
  "order.confirmed": [EMAIL_TEMPLATES.CUSTOMER.ORDER_CONFIRMED],
  "order.packed": [EMAIL_TEMPLATES.CUSTOMER.ORDER_PACKED],
  "order.shipped": [EMAIL_TEMPLATES.CUSTOMER.ORDER_SHIPPED],
  "shipment.shipped": [EMAIL_TEMPLATES.CUSTOMER.ORDER_SHIPPED],
  "order.in_transit": [EMAIL_TEMPLATES.CUSTOMER.ORDER_IN_TRANSIT],
  "order.out_for_delivery": [EMAIL_TEMPLATES.CUSTOMER.ORDER_OUT_FOR_DELIVERY],
  "shipment.out_for_delivery": [EMAIL_TEMPLATES.CUSTOMER.ORDER_OUT_FOR_DELIVERY],
  "order.delivered": [EMAIL_TEMPLATES.CUSTOMER.ORDER_DELIVERED],
  "shipment.delivered": [EMAIL_TEMPLATES.CUSTOMER.ORDER_DELIVERED],
  "order.cancelled": [EMAIL_TEMPLATES.CUSTOMER.ORDER_CANCELLED, EMAIL_TEMPLATES.SELLER.ORDER_CANCELLED],

  "payment.captured": [EMAIL_TEMPLATES.CUSTOMER.PAYMENT_SUCCESS, EMAIL_TEMPLATES.SELLER.PAYMENT_CAPTURED],
  "payment.failed": [EMAIL_TEMPLATES.CUSTOMER.PAYMENT_FAILED],

  "refund.completed": [EMAIL_TEMPLATES.CUSTOMER.REFUND_COMPLETED, EMAIL_TEMPLATES.SELLER.RETURN_REFUND_IMPACT],
  "return.requested": [EMAIL_TEMPLATES.CUSTOMER.RETURN_REQUESTED, EMAIL_TEMPLATES.SELLER.RETURN_REQUESTED],

  "seller.payout.completed": [EMAIL_TEMPLATES.SELLER.PAYOUT_COMPLETED],
  "delivery_partner.assigned": [EMAIL_TEMPLATES.DELIVERY_PARTNER.ASSIGNMENT_NEW_BATCH],
});
