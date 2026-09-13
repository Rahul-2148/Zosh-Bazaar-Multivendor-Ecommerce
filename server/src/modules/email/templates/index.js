import { customerAuthTemplates } from "./customer/auth.templates.js";
import { customerOrderTemplates } from "./customer/order.templates.js";
import { customerPaymentTemplates } from "./customer/payment.templates.js";
import { customerReturnTemplates } from "./customer/return.templates.js";
import { customerEngagementTemplates } from "./customer/engagement.templates.js";

import { sellerOnboardingTemplates } from "./seller/onboarding.templates.js";
import { sellerOrderTemplates } from "./seller/order.templates.js";
import { sellerInventoryTemplates } from "./seller/inventory.templates.js";
import { sellerFinanceTemplates } from "./seller/finance.templates.js";
import { sellerPerformanceTemplates } from "./seller/performance.templates.js";

import { adminSecurityTemplates } from "./admin/security.templates.js";
import { adminSellerOpsTemplates } from "./admin/sellerOps.templates.js";
import { adminPlatformOpsTemplates } from "./admin/platformOps.templates.js";

import { logisticsShipmentTemplates } from "./logistics/shipment.templates.js";
import { logisticsOperationsTemplates } from "./logistics/operations.templates.js";

import { deliveryPartnerOnboardingTemplates } from "./deliveryPartner/onboarding.templates.js";
import { deliveryPartnerOperationsTemplates } from "./deliveryPartner/operations.templates.js";
import { deliveryPartnerFinanceTemplates } from "./deliveryPartner/finance.templates.js";

import { systemAlertTemplates } from "./system/alerts.templates.js";
import { systemDigestsTemplates } from "./system/digests.templates.js";

export const allTemplates = {
  ...customerAuthTemplates,
  ...customerOrderTemplates,
  ...customerPaymentTemplates,
  ...customerReturnTemplates,
  ...customerEngagementTemplates,

  ...sellerOnboardingTemplates,
  ...sellerOrderTemplates,
  ...sellerInventoryTemplates,
  ...sellerFinanceTemplates,
  ...sellerPerformanceTemplates,

  ...adminSecurityTemplates,
  ...adminSellerOpsTemplates,
  ...adminPlatformOpsTemplates,

  ...logisticsShipmentTemplates,
  ...logisticsOperationsTemplates,

  ...deliveryPartnerOnboardingTemplates,
  ...deliveryPartnerOperationsTemplates,
  ...deliveryPartnerFinanceTemplates,

  ...systemAlertTemplates,
  ...systemDigestsTemplates,
};

export const EMAIL_TEMPLATES = Object.freeze({
  CUSTOMER: {
    AUTH_WELCOME: "customer.auth.welcome",
    AUTH_EMAIL_VERIFICATION: "customer.auth.email_verification",
    AUTH_LOGIN_OTP: "customer.auth.login_otp",
    AUTH_PASSWORD_RESET_REQUEST: "customer.auth.password_reset_request",
    AUTH_PASSWORD_RESET_SUCCESS: "customer.auth.password_reset_success",
    AUTH_PASSWORD_CHANGED: "customer.auth.password_changed",
    AUTH_NEW_LOGIN: "customer.auth.new_login",
    AUTH_SUSPICIOUS_LOGIN: "customer.auth.suspicious_login",
    AUTH_EMAIL_CHANGED: "customer.auth.email_changed",
    AUTH_PHONE_CHANGED: "customer.auth.phone_changed",
    AUTH_SECURITY_ALERT: "customer.auth.security_alert",
    ACCOUNT_DEACTIVATED: "customer.account.deactivated",
    ACCOUNT_DELETION_OTP: "customer.account.deletion_otp",
    ACCOUNT_DELETION_SCHEDULED: "customer.account.deletion_scheduled",
    ACCOUNT_DELETION_CANCELLED: "customer.account.deletion_cancelled",
    ACCOUNT_PERMANENTLY_DELETED: "customer.account.permanently_deleted",

    ORDER_PLACED: "customer.order.placed",
    ORDER_CONFIRMED: "customer.order.confirmed",
    ORDER_PAYMENT_RECEIVED: "customer.order.payment_received",
    ORDER_PAYMENT_PENDING: "customer.order.payment_pending",
    ORDER_PAYMENT_FAILED: "customer.order.payment_failed",
    ORDER_PROCESSING: "customer.order.processing",
    ORDER_PACKED: "customer.order.packed",
    ORDER_READY_TO_SHIP: "customer.order.ready_to_ship",
    ORDER_SHIPPED: "customer.order.shipped",
    ORDER_IN_TRANSIT: "customer.order.in_transit",
    ORDER_DELAYED: "customer.order.delayed",
    ORDER_EXCEPTION: "customer.order.exception",
    ORDER_OUT_FOR_DELIVERY: "customer.order.out_for_delivery",
    ORDER_DELIVERED: "customer.order.delivered",
    ORDER_DELIVERY_FAILED: "customer.order.delivery_failed",
    ORDER_CANCELLED: "customer.order.cancelled",
    ORDER_PARTIAL_CANCELLATION: "customer.order.partial_cancellation",

    PAYMENT_SUCCESS: "customer.payment.success",
    PAYMENT_FAILED: "customer.payment.failed",
    PAYMENT_PENDING: "customer.payment.pending",
    PAYMENT_RETRY: "customer.payment.retry",
    PAYMENT_COD_REMINDER: "customer.payment.cod_reminder",
    PAYMENT_INVOICE: "customer.payment.invoice",
    REFUND_INITIATED: "customer.refund.initiated",
    REFUND_PROCESSING: "customer.refund.processing",
    REFUND_COMPLETED: "customer.refund.completed",
    REFUND_FAILED: "customer.refund.failed",

    RETURN_REQUESTED: "customer.return.requested",
    RETURN_APPROVED: "customer.return.approved",
    RETURN_REJECTED: "customer.return.rejected",
    RETURN_PICKUP_SCHEDULED: "customer.return.pickup_scheduled",
    RETURN_PICKUP_REMINDER: "customer.return.pickup_reminder",
    RETURN_PICKED_UP: "customer.return.picked_up",
    RETURN_RECEIVED: "customer.return.received",
    RETURN_UNDER_INSPECTION: "customer.return.under_inspection",
    RETURN_APPROVED_FOR_REFUND: "customer.return.approved_for_refund",
    RETURN_REJECTED_INSPECTION: "customer.return.rejected_inspection",

    ENGAGEMENT_REVIEW_REQUEST: "customer.engagement.review_request",
    ENGAGEMENT_REVIEW_REMINDER: "customer.engagement.review_reminder",
    ENGAGEMENT_REVIEW_PUBLISHED: "customer.engagement.review_published",
    ENGAGEMENT_SELLER_REPLY: "customer.engagement.seller_reply",
    ENGAGEMENT_PRICE_DROP: "customer.engagement.price_drop",
    ENGAGEMENT_BACK_IN_STOCK: "customer.engagement.back_in_stock",
    ENGAGEMENT_LOW_STOCK: "customer.engagement.low_stock",
    ENGAGEMENT_ABANDONED_CART: "customer.engagement.abandoned_cart",
  },

  SELLER: {
    ONBOARDING_REGISTERED: "seller.onboarding.registered",
    AUTH_OTP: "seller.onboarding.email_verification",
    ONBOARDING_APPLICATION_SUBMITTED: "seller.onboarding.application_submitted",
    ONBOARDING_UNDER_REVIEW: "seller.onboarding.under_review",
    ONBOARDING_APPROVED: "seller.onboarding.approved",
    ONBOARDING_REJECTED: "seller.onboarding.rejected",
    ONBOARDING_INCOMPLETE: "seller.onboarding.incomplete",
    DOCUMENTS_REQUIRED: "seller.onboarding.documents_required",
    DOCUMENTS_RECEIVED: "seller.onboarding.documents_received",
    DOCUMENTS_APPROVED: "seller.onboarding.documents_approved",
    DOCUMENTS_REJECTED: "seller.onboarding.documents_rejected",
    ACCOUNT_SUSPENDED: "seller.onboarding.suspended",
    ACCOUNT_REACTIVATED: "seller.onboarding.reactivated",

    NEW_ORDER: "seller.order.new_order",
    ORDER_REQUIRES_ACTION: "seller.order.requires_action",
    ORDER_PREPARATION_REMINDER: "seller.order.preparation_reminder",
    ORDER_DEADLINE_REMINDER: "seller.order.deadline_reminder",
    ORDER_READY_FOR_PICKUP: "seller.order.ready_for_pickup",
    ORDER_PICKUP_SCHEDULED: "seller.order.pickup_scheduled",
    ORDER_PICKED_UP: "seller.order.picked_up",
    ORDER_CANCELLED: "seller.order.cancelled",
    CUSTOMER_CANCELLATION_REQUEST: "seller.order.customer_cancellation_request",
    RETURN_REQUESTED: "seller.return.requested",
    RETURN_APPROVED: "seller.return.approved",
    RETURN_RECEIVED: "seller.return.received",
    RETURN_REFUND_IMPACT: "seller.return.refund_impact",

    INVENTORY_LOW_STOCK: "seller.inventory.low_stock",
    INVENTORY_OUT_OF_STOCK: "seller.inventory.out_of_stock",
    INVENTORY_REPLENISHMENT_REMINDER: "seller.inventory.replenishment_reminder",
    INVENTORY_VARIANT_STOCK_ALERT: "seller.inventory.variant_stock_alert",
    CATALOG_PRODUCT_APPROVED: "seller.catalog.product_approved",
    CATALOG_PRODUCT_REJECTED: "seller.catalog.product_rejected",
    CATALOG_PRODUCT_PUBLISHED: "seller.catalog.product_published",
    CATALOG_PRODUCT_UNPUBLISHED: "seller.catalog.product_unpublished",

    PAYMENT_CAPTURED: "seller.finance.payment_captured",
    SETTLEMENT_GENERATED: "seller.finance.settlement_generated",
    PAYOUT_INITIATED: "seller.finance.payout_initiated",
    PAYOUT_COMPLETED: "seller.finance.payout_completed",
    PAYOUT_FAILED: "seller.finance.payout_failed",
    SETTLEMENT_ADJUSTED: "seller.finance.settlement_adjusted",
    COMMISSION_DEDUCTED: "seller.finance.commission_deducted",
    PAYMENT_HOLD: "seller.finance.payment_hold",

    DAILY_SUMMARY: "seller.performance.daily_summary",
    SLA_WARNING: "seller.performance.sla_warning",
    CANCELLATION_RATE_ALERT: "seller.performance.cancellation_rate_alert",
    RETURN_RATE_ALERT: "seller.performance.return_rate_alert",
    RATING_UPDATE: "seller.performance.rating_update",
    CUSTOMER_COMPLAINT: "seller.performance.customer_complaint",
    POLICY_VIOLATION: "seller.compliance.policy_violation",
    COMPLIANCE_REVIEW_SCHEDULED: "seller.compliance.review_scheduled",
  },

  ADMIN: {
    SECURITY_LOGIN_ALERT: "admin.security.login_alert",
    SECURITY_NEW_SESSION: "admin.security.new_session",
    SECURITY_SUSPICIOUS_LOGIN: "admin.security.suspicious_login",
    SECURITY_PASSWORD_CHANGED: "admin.security.password_changed",
    SECURITY_ROLE_CHANGED: "admin.security.role_changed",
    SECURITY_ACCESS_REVOKED: "admin.security.access_revoked",
    SECURITY_PRIVILEGE_ESCALATION: "admin.security.privilege_escalation",

    SELLER_NEW_REGISTRATION: "admin.seller.new_registration",
    SELLER_REQUIRES_REVIEW: "admin.seller.requires_review",
    SELLER_DOCUMENT_SUBMITTED: "admin.seller.document_submitted",
    SELLER_DOCUMENT_REJECTED: "admin.seller.document_rejected",
    SELLER_SUSPENSION_REQUEST: "admin.seller.suspension_request",
    SELLER_REINSTATEMENT_REQUEST: "admin.seller.reinstatement_request",

    OPERATIONS_HIGH_VALUE_ORDER: "admin.operations.high_value_order",
    OPERATIONS_PAYMENT_FAILURE_SPIKE: "admin.operations.payment_failure_spike",
    OPERATIONS_ORDER_FAILURE_ALERT: "admin.operations.order_failure_alert",
    OPERATIONS_FULFILLMENT_EXCEPTION: "admin.operations.fulfillment_exception",
    OPERATIONS_DELIVERY_SLA_BREACH: "admin.operations.delivery_sla_breach",
    OPERATIONS_CANCELLATION_SPIKE: "admin.operations.cancellation_spike",
    OPERATIONS_REFUND_FAILURE: "admin.operations.refund_failure",
    OPERATIONS_SHIPMENT_EXCEPTION_SPIKE: "admin.operations.shipment_exception_spike",
  },

  LOGISTICS: {
    SHIPMENT_CREATED: "logistics.shipment.created",
    SHIPMENT_ASSIGNED: "logistics.shipment.assigned",
    HUB_TRANSFER: "logistics.shipment.hub_transfer",
    SHIPMENT_DELAYED: "logistics.shipment.delayed",
    ROUTE_EXCEPTION: "logistics.route.exception",
    SHIPMENT_UNDELIVERABLE: "logistics.shipment.undeliverable",

    SLA_RISK_ALERT: "logistics.sla.risk_alert",
    SHIPMENT_EXCEPTION: "logistics.shipment.exception",
    DELIVERY_ATTEMPT_FAILED: "logistics.shipment.attempt_failed",
    WAREHOUSE_EXCEPTION: "logistics.warehouse.exception",
    CAPACITY_ALERT: "logistics.warehouse.capacity_alert",
    OPERATIONS_ESCALATION: "logistics.operations.escalation",
  },

  DELIVERY_PARTNER: {
    ONBOARDING_WELCOME: "delivery_partner.onboarding.welcome",
    ONBOARDING_VERIFICATION: "delivery_partner.onboarding.verification",
    ONBOARDING_APPROVED: "delivery_partner.onboarding.approved",
    ONBOARDING_REJECTED: "delivery_partner.onboarding.rejected",
    COMPLIANCE_WARNING: "delivery_partner.compliance.warning",

    ASSIGNMENT_NEW_BATCH: "delivery_partner.assignment.new_batch",
    ASSIGNMENT_ROUTE_ASSIGNED: "delivery_partner.assignment.route_assigned",
    SCHEDULE_SHIFT_REMINDER: "delivery_partner.schedule.shift_reminder",
    DELIVERY_STOP_REMINDER: "delivery_partner.delivery.stop_reminder",
    DELIVERY_ATTEMPT_FAILED: "delivery_partner.delivery.attempt_failed",
    ASSIGNMENT_REASSIGNED: "delivery_partner.assignment.reassigned",
    SECURITY_ALERT: "delivery_partner.security.alert",

    EARNINGS_STATEMENT: "delivery_partner.finance.earnings_statement",
    INCENTIVE_EARNED: "delivery_partner.finance.incentive_earned",
    PAYOUT_INITIATED: "delivery_partner.finance.payout_initiated",
    PAYOUT_COMPLETED: "delivery_partner.finance.payout_completed",
    PAYOUT_FAILED: "delivery_partner.finance.payout_failed",
    DOCUMENT_EXPIRY: "delivery_partner.compliance.document_expiry",
  },

  SYSTEM: {
    SERVICE_FAILURE: "system.alert.service_failure",
    EMAIL_BACKLOG: "system.alert.email_backlog",
    PAYMENT_GATEWAY_INCIDENT: "system.alert.payment_gateway_incident",
    INVENTORY_SYNC_FAILURE: "system.alert.inventory_sync_failure",
    SOCKET_FAILURE: "system.alert.realtime_socket_failure",
    DATABASE_ALERT: "system.alert.database_alert",
    SCHEDULED_JOB_FAILURE: "system.alert.scheduled_job_failure",

    INCIDENT_REPORT: "system.incident.report",
    DAILY_EXECUTIVE_DIGEST: "system.digest.daily_executive",
    MAINTENANCE_SCHEDULED: "system.maintenance.scheduled",
  },
});
