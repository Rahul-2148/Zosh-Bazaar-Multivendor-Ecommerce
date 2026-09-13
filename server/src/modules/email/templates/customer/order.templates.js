import {
  EmailLayout,
  EmailHeader,
  EmailFooter,
  Button,
  Card,
  Divider,
  PriceRow,
  OrderItem,
  AddressBlock,
  TrackingTimeline,
  emailConfig,
} from "../shared/index.js";
import { EmailCategory, EmailPriority, EmailRecipientRole } from "../../core/email.types.js";
import { formatOrderViewModel } from "../../schemas/order.schema.js";
import { enIN } from "../../localization/en-IN/messages.js";

function renderOrderItemsList(items) {
  return items.map((item) => OrderItem({ item })).join("");
}

function renderPricingSummary(totals) {
  return `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 14px;">
      <tr>
        <td style="padding-top: 8px;">
          ${PriceRow({ label: "Items Subtotal", value: totals.subtotal })}
          ${totals.discount > 0 ? PriceRow({ label: "Special Savings", value: totals.discount, isDiscount: true }) : ""}
          ${PriceRow({ label: "Standard Delivery", value: totals.shipping === 0 ? "FREE" : totals.shipping })}
          ${totals.tax > 0 ? PriceRow({ label: "Applicable Taxes", value: totals.tax }) : ""}
          ${Divider({ space: 10 })}
          ${PriceRow({ label: "Total Paid", value: totals.total, isTotal: true })}
        </td>
      </tr>
    </table>
  `;
}

export const customerOrderTemplates = {
  // 1. Order Placed
  "customer.order.placed": {
    templateKey: "customer.order.placed",
    category: EmailCategory.TRANSACTIONAL,
    recipientRole: EmailRecipientRole.CUSTOMER,
    priority: EmailPriority.HIGH,
    subject: (data) => `Order Placed: #${data.orderId || "ZB"}`,
    preheader: (data) => `We have received your order #${data.orderId} and are processing it.`,
    render: (rawData) => {
      const data = formatOrderViewModel(rawData);
      return EmailLayout({
        title: `Order Placed #${data.orderId}`,
        preheader: `We have received your order #${data.orderId} and are processing it.`,
        children: `
          ${EmailHeader({ roleBadge: { label: "Order Placed", variant: "info" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 4px 0; color: #0f172a;" class="dark-text-main">
            Thank you for your order!
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569; margin: 0 0 16px 0;" class="dark-text-muted">
            Hi ${data.user.fullName}, we've received your order <strong>#${data.orderId}</strong> placed on ${enIN.formatDate(data.orderDate)}.
          </p>
          ${TrackingTimeline({ currentStatus: "PLACED" })}
          ${Card({
            title: "Order Items",
            children: renderOrderItemsList(data.items) + renderPricingSummary(data.totals),
          })}
          ${AddressBlock({ address: data.shippingAddress })}
          ${Button({ href: data.orderUrl, label: "View Order Details", fullWidth: true })}
          ${EmailFooter({ category: EmailCategory.TRANSACTIONAL, recipientEmail: data.user.email })}
        `,
      });
    },
  },

  // 2. Order Confirmed
  "customer.order.confirmed": {
    templateKey: "customer.order.confirmed",
    category: EmailCategory.TRANSACTIONAL,
    recipientRole: EmailRecipientRole.CUSTOMER,
    priority: EmailPriority.HIGH,
    subject: (data) => `Your Zosh Bazaar order #${data.orderId || "ZB"} is confirmed`,
    preheader: (data) => `Your order #${data.orderId} has been confirmed by our merchant partners.`,
    render: (rawData) => {
      const data = formatOrderViewModel(rawData);
      return EmailLayout({
        title: `Order Confirmed #${data.orderId}`,
        preheader: `Your order #${data.orderId} has been confirmed by our merchant partners.`,
        children: `
          ${EmailHeader({ roleBadge: { label: "Confirmed", variant: "success" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 4px 0; color: #0f172a;" class="dark-text-main">
            Order Confirmed!
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569; margin: 0 0 16px 0;" class="dark-text-muted">
            Hi ${data.user.fullName}, great news! Your order <strong>#${data.orderId}</strong> has been confirmed and the seller is preparing your items.
          </p>
          ${TrackingTimeline({ currentStatus: "CONFIRMED" })}
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px 16px; margin: 16px 0; font-size: 13px; color: #166534;">
            &#128666; Estimated Delivery: <strong>${data.estimatedDelivery}</strong>
          </div>
          ${Card({
            title: "Order Summary",
            children: renderOrderItemsList(data.items) + renderPricingSummary(data.totals),
          })}
          ${AddressBlock({ address: data.shippingAddress })}
          ${Button({ href: data.orderUrl, label: "Track Your Order", fullWidth: true })}
          ${EmailFooter({ category: EmailCategory.TRANSACTIONAL, recipientEmail: data.user.email })}
        `,
      });
    },
  },

  // 3. Payment Received
  "customer.order.payment_received": {
    templateKey: "customer.order.payment_received",
    category: EmailCategory.TRANSACTIONAL,
    recipientRole: EmailRecipientRole.CUSTOMER,
    priority: EmailPriority.HIGH,
    subject: (data) => `Payment Confirmed: Order #${data.orderId || "ZB"}`,
    preheader: (data) => `We received your payment of ${enIN.formatCurrency(data.totals?.total || 0)} for order #${data.orderId}.`,
    render: (rawData) => {
      const data = formatOrderViewModel(rawData);
      return EmailLayout({
        title: `Payment Received #${data.orderId}`,
        preheader: `We received your payment for order #${data.orderId}.`,
        children: `
          ${EmailHeader({ roleBadge: { label: "Payment Success", variant: "success" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #16a34a;">
            Payment Successfully Captured
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.user.fullName}, we received your payment of <strong>${enIN.formatCurrency(data.totals.total)}</strong> for order #${data.orderId} via ${data.paymentMethod}.
          </p>
          ${Card({
            title: "Transaction Receipt",
            children: renderPricingSummary(data.totals),
          })}
          ${Button({ href: data.invoiceUrl || data.orderUrl, label: "Download Tax Invoice", variant: "secondary" })}
          ${EmailFooter({ category: EmailCategory.TRANSACTIONAL, recipientEmail: data.user.email })}
        `,
      });
    },
  },

  // 4. Payment Pending
  "customer.order.payment_pending": {
    templateKey: "customer.order.payment_pending",
    category: EmailCategory.TRANSACTIONAL,
    recipientRole: EmailRecipientRole.CUSTOMER,
    priority: EmailPriority.HIGH,
    subject: (data) => `Action Required: Complete payment for order #${data.orderId || "ZB"}`,
    preheader: "Your order is reserved. Please complete payment to avoid cancellation.",
    render: (rawData) => {
      const data = formatOrderViewModel(rawData);
      return EmailLayout({
        title: `Payment Pending #${data.orderId}`,
        preheader: "Please complete payment to avoid cancellation.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Payment Pending", variant: "warning" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #d97706;">
            Payment Pending for Order #${data.orderId}
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.user.fullName}, your items are currently reserved. Please complete your transaction to confirm dispatch.
          </p>
          ${Card({
            title: "Amount Due",
            children: PriceRow({ label: "Total Payable", value: data.totals.total, isTotal: true }),
          })}
          ${Button({ href: data.orderUrl, label: "Complete Payment Now", variant: "primary", fullWidth: true })}
          ${EmailFooter({ category: EmailCategory.TRANSACTIONAL, recipientEmail: data.user.email })}
        `,
      });
    },
  },

  // 5. Payment Failed
  "customer.order.payment_failed": {
    templateKey: "customer.order.payment_failed",
    category: EmailCategory.TRANSACTIONAL,
    recipientRole: EmailRecipientRole.CUSTOMER,
    priority: EmailPriority.HIGH,
    subject: (data) => `Payment Failed: Order #${data.orderId || "ZB"}`,
    preheader: "Your payment could not be processed. Click to retry without losing your cart.",
    render: (rawData) => {
      const data = formatOrderViewModel(rawData);
      return EmailLayout({
        title: `Payment Failed #${data.orderId}`,
        preheader: "Your payment could not be processed.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Payment Failed", variant: "danger" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #dc2626;">
            Payment Unsuccessful
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.user.fullName}, your bank or payment gateway was unable to complete the payment for order #${data.orderId}. No funds have been deducted from your account.
          </p>
          ${Button({ href: data.orderUrl, label: "Retry Payment", variant: "danger", fullWidth: true })}
          ${EmailFooter({ category: EmailCategory.TRANSACTIONAL, recipientEmail: data.user.email })}
        `,
      });
    },
  },

  // 6. Order Processing
  "customer.order.processing": {
    templateKey: "customer.order.processing",
    category: EmailCategory.TRANSACTIONAL,
    recipientRole: EmailRecipientRole.CUSTOMER,
    priority: EmailPriority.NORMAL,
    subject: (data) => `Order #${data.orderId || "ZB"} is being processed`,
    preheader: "Our seller has accepted your order and begun fulfillment.",
    render: (rawData) => {
      const data = formatOrderViewModel(rawData);
      return EmailLayout({
        title: `Processing #${data.orderId}`,
        preheader: "Our seller has accepted your order and begun fulfillment.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Processing", variant: "info" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a;" class="dark-text-main">
            Order in Processing
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.user.fullName}, merchant partners are fulfilling order #${data.orderId}. We will notify you once items are packed.
          </p>
          ${TrackingTimeline({ currentStatus: "CONFIRMED" })}
          ${EmailFooter({ category: EmailCategory.TRANSACTIONAL, recipientEmail: data.user.email })}
        `,
      });
    },
  },

  // 7. Order Packed
  "customer.order.packed": {
    templateKey: "customer.order.packed",
    category: EmailCategory.TRANSACTIONAL,
    recipientRole: EmailRecipientRole.CUSTOMER,
    priority: EmailPriority.NORMAL,
    subject: (data) => `Order #${data.orderId || "ZB"} has been packed`,
    preheader: "Your items have passed quality checks and are packed for shipping.",
    render: (rawData) => {
      const data = formatOrderViewModel(rawData);
      return EmailLayout({
        title: `Packed #${data.orderId}`,
        preheader: "Your items have passed quality checks and are packed for shipping.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Packed", variant: "info" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a;" class="dark-text-main">
            Items Packed & Ready
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.user.fullName}, your package for order #${data.orderId} is sealed and awaiting carrier pickup.
          </p>
          ${TrackingTimeline({ currentStatus: "PACKED" })}
          ${EmailFooter({ category: EmailCategory.TRANSACTIONAL, recipientEmail: data.user.email })}
        `,
      });
    },
  },

  // 8. Ready to Ship
  "customer.order.ready_to_ship": {
    templateKey: "customer.order.ready_to_ship",
    category: EmailCategory.TRANSACTIONAL,
    recipientRole: EmailRecipientRole.CUSTOMER,
    priority: EmailPriority.NORMAL,
    subject: (data) => `Order #${data.orderId || "ZB"} is ready for shipment`,
    preheader: "Courier partner has been assigned for pickup.",
    render: (rawData) => {
      const data = formatOrderViewModel(rawData);
      return EmailLayout({
        title: `Ready for Shipment #${data.orderId}`,
        preheader: "Courier partner has been assigned for pickup.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Ready to Ship", variant: "info" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a;" class="dark-text-main">
            Ready for Courier Handover
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.user.fullName}, ${data.carrier} has generated the airway bill for your order #${data.orderId}.
          </p>
          ${TrackingTimeline({ currentStatus: "PACKED" })}
          ${EmailFooter({ category: EmailCategory.TRANSACTIONAL, recipientEmail: data.user.email })}
        `,
      });
    },
  },

  // 9. Order Shipped
  "customer.order.shipped": {
    templateKey: "customer.order.shipped",
    category: EmailCategory.TRANSACTIONAL,
    recipientRole: EmailRecipientRole.CUSTOMER,
    priority: EmailPriority.HIGH,
    subject: (data) => `Your order #${data.orderId || "ZB"} is on the way! 🚚`,
    preheader: (data) => `Shipped with ${data.carrier || "Zosh Express"}. Tracking ID: ${data.trackingNumber || "Available online"}.`,
    render: (rawData) => {
      const data = formatOrderViewModel(rawData);
      return EmailLayout({
        title: `Order Shipped #${data.orderId}`,
        preheader: `Shipped with ${data.carrier}. Tracking ID: ${data.trackingNumber}.`,
        children: `
          ${EmailHeader({ roleBadge: { label: "Shipped", variant: "primary" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 4px 0; color: #0f172a;" class="dark-text-main">
            Your Order Has Shipped!
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569; margin: 0 0 16px 0;" class="dark-text-muted">
            Hi ${data.user.fullName}, your package is on its way. Track your delivery below:
          </p>
          ${TrackingTimeline({ currentStatus: "SHIPPED" })}
          ${Card({
            title: "Shipment Details",
            children: `
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 13px;">
                <tr><td style="padding: 4px 0; color: #64748b;">Carrier:</td><td style="font-weight: bold; text-align: right;">${data.carrier}</td></tr>
                ${data.trackingNumber ? `<tr><td style="padding: 4px 0; color: #64748b;">Tracking ID:</td><td style="font-weight: bold; text-align: right; font-family: monospace;">${data.trackingNumber}</td></tr>` : ""}
                <tr><td style="padding: 4px 0; color: #64748b;">Expected Arrival:</td><td style="font-weight: bold; text-align: right; color: #16a34a;">${data.estimatedDelivery}</td></tr>
              </table>
            `,
          })}
          ${Button({ href: data.trackingUrl, label: "Live Track Shipment", fullWidth: true })}
          ${AddressBlock({ address: data.shippingAddress })}
          ${EmailFooter({ category: EmailCategory.TRANSACTIONAL, recipientEmail: data.user.email })}
        `,
      });
    },
  },

  // 10. Order In Transit
  "customer.order.in_transit": {
    templateKey: "customer.order.in_transit",
    category: EmailCategory.TRANSACTIONAL,
    recipientRole: EmailRecipientRole.CUSTOMER,
    priority: EmailPriority.NORMAL,
    subject: (data) => `In Transit: Order #${data.orderId || "ZB"} reached local hub`,
    preheader: "Your order is progressing smoothly through our logistics network.",
    render: (rawData) => {
      const data = formatOrderViewModel(rawData);
      return EmailLayout({
        title: `In Transit #${data.orderId}`,
        preheader: "Your order is progressing smoothly through our logistics network.",
        children: `
          ${EmailHeader({ roleBadge: { label: "In Transit", variant: "primary" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a;" class="dark-text-main">
            Package In Transit
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.user.fullName}, your shipment for order #${data.orderId} has reached the regional transit hub and is on schedule.
          </p>
          ${TrackingTimeline({ currentStatus: "IN_TRANSIT" })}
          ${Button({ href: data.trackingUrl, label: "View Live Route" })}
          ${EmailFooter({ category: EmailCategory.TRANSACTIONAL, recipientEmail: data.user.email })}
        `,
      });
    },
  },

  // 11. Order Delayed
  "customer.order.delayed": {
    templateKey: "customer.order.delayed",
    category: EmailCategory.TRANSACTIONAL,
    recipientRole: EmailRecipientRole.CUSTOMER,
    priority: EmailPriority.HIGH,
    subject: (data) => `Delivery Update: Order #${data.orderId || "ZB"} is delayed`,
    preheader: "We apologize for the delay. Here is your revised estimated delivery date.",
    render: (rawData) => {
      const data = formatOrderViewModel(rawData);
      return EmailLayout({
        title: `Delivery Update #${data.orderId}`,
        preheader: "Here is your revised estimated delivery date.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Delivery Delayed", variant: "warning" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #d97706;">
            Shipment Delay Notice
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.user.fullName}, unexpected transit conditions have caused a short delay in delivering order #${data.orderId}.
          </p>
          <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 14px 16px; margin: 16px 0;">
            <div style="font-size: 13px; font-weight: bold; color: #b45309;">
              Revised Delivery: ${data.revisedEta || data.estimatedDelivery}
            </div>
            ${data.delayReason ? `<div style="font-size: 12px; color: #64748b; margin-top: 4px;">Reason: ${data.delayReason}</div>` : ""}
          </div>
          ${Button({ href: data.trackingUrl, label: "Check Updated Status" })}
          ${EmailFooter({ category: EmailCategory.TRANSACTIONAL, recipientEmail: data.user.email })}
        `,
      });
    },
  },

  // 12. Order Exception
  "customer.order.exception": {
    templateKey: "customer.order.exception",
    category: EmailCategory.TRANSACTIONAL,
    recipientRole: EmailRecipientRole.CUSTOMER,
    priority: EmailPriority.HIGH,
    subject: (data) => `Action Needed: Address issue for order #${data.orderId || "ZB"}`,
    preheader: "Courier could not locate your address. Please verify your details.",
    render: (rawData) => {
      const data = formatOrderViewModel(rawData);
      return EmailLayout({
        title: `Delivery Exception #${data.orderId}`,
        preheader: "Please verify your delivery details.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Action Needed", variant: "danger" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #dc2626;">
            Delivery Address Exception
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.user.fullName}, our delivery partner was unable to locate your doorstep or contact you by phone.
          </p>
          ${AddressBlock({ address: data.shippingAddress, title: "Current Address on File" })}
          ${Button({ href: `${data.orderUrl}/update-address`, label: "Update Delivery Details", variant: "danger", fullWidth: true })}
          ${EmailFooter({ category: EmailCategory.TRANSACTIONAL, recipientEmail: data.user.email })}
        `,
      });
    },
  },

  // 13. Out for Delivery
  "customer.order.out_for_delivery": {
    templateKey: "customer.order.out_for_delivery",
    category: EmailCategory.TRANSACTIONAL,
    recipientRole: EmailRecipientRole.CUSTOMER,
    priority: EmailPriority.HIGH,
    subject: (data) => `Your Zosh Bazaar order #${data.orderId || "ZB"} arrives today! 📦`,
    preheader: "Our delivery partner is in your area and will deliver your package today.",
    render: (rawData) => {
      const data = formatOrderViewModel(rawData);
      return EmailLayout({
        title: `Out for Delivery #${data.orderId}`,
        preheader: "Our delivery partner is in your area and will deliver your package today.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Arriving Today", variant: "accent" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 4px 0; color: #0f172a;" class="dark-text-main">
            Your Package Arrives Today!
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569; margin: 0 0 16px 0;" class="dark-text-muted">
            Hi ${data.user.fullName}, our delivery partner has loaded order #${data.orderId} and is on their way to your address.
          </p>
          ${TrackingTimeline({ currentStatus: "OUT_FOR_DELIVERY" })}
          <div style="background: #fefce8; border: 1px solid #fef08a; border-radius: 8px; padding: 14px; margin: 16px 0; font-size: 13px; color: #854d0e;">
            &#128274; <strong>Delivery Security:</strong> A 4-digit delivery PIN will be sent to your phone via SMS. Please share it with the agent upon arrival.
          </div>
          ${Button({ href: data.trackingUrl, label: "Live Delivery Tracker", fullWidth: true })}
          ${EmailFooter({ category: EmailCategory.TRANSACTIONAL, recipientEmail: data.user.email })}
        `,
      });
    },
  },

  // 14. Delivered
  "customer.order.delivered": {
    templateKey: "customer.order.delivered",
    category: EmailCategory.TRANSACTIONAL,
    recipientRole: EmailRecipientRole.CUSTOMER,
    priority: EmailPriority.HIGH,
    subject: (data) => `Delivered: Zosh Bazaar order #${data.orderId || "ZB"} 🎉`,
    preheader: "Your package has been safely delivered. Let us know how everything went.",
    render: (rawData) => {
      const data = formatOrderViewModel(rawData);
      return EmailLayout({
        title: `Delivered #${data.orderId}`,
        preheader: "Your package has been safely delivered.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Delivered", variant: "success" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 4px 0; color: #16a34a;">
            Package Delivered Successfully!
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569; margin: 0 0 16px 0;" class="dark-text-muted">
            Hi ${data.user.fullName}, order #${data.orderId} has been handed over at your delivery address.
          </p>
          ${TrackingTimeline({ currentStatus: "DELIVERED" })}
          ${Card({
            title: "Delivered Items",
            children: renderOrderItemsList(data.items),
          })}
          ${Button({ href: `${data.orderUrl}/reviews`, label: "Rate & Review Products", fullWidth: true })}
          <p style="font-size: 12px; color: #64748b; margin-top: 14px; text-align: center;">
            Not received by you? <a href="${data.orderUrl}/dispute" style="color: #2563eb; text-decoration: underline;">Report an issue</a> within 24 hours.
          </p>
          ${EmailFooter({ category: EmailCategory.TRANSACTIONAL, recipientEmail: data.user.email })}
        `,
      });
    },
  },

  // 15. Delivery Attempt Failed
  "customer.order.delivery_failed": {
    templateKey: "customer.order.delivery_failed",
    category: EmailCategory.TRANSACTIONAL,
    recipientRole: EmailRecipientRole.CUSTOMER,
    priority: EmailPriority.HIGH,
    subject: (data) => `Delivery Attempt Failed: Order #${data.orderId || "ZB"}`,
    preheader: "We attempted delivery today but were unable to reach you.",
    render: (rawData) => {
      const data = formatOrderViewModel(rawData);
      return EmailLayout({
        title: `Delivery Attempt Failed #${data.orderId}`,
        preheader: "We attempted delivery today but were unable to reach you.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Attempt Failed", variant: "warning" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #d97706;">
            We Missed You Today
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.user.fullName}, our delivery agent attempted to deliver order #${data.orderId} today, but was unable to reach you or complete the handover.
          </p>
          <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 14px; margin: 16px 0; font-size: 13px; color: #92400e;">
            A second delivery attempt will be scheduled for the next business day.
          </div>
          ${Button({ href: data.trackingUrl, label: "Reschedule Delivery Slot" })}
          ${EmailFooter({ category: EmailCategory.TRANSACTIONAL, recipientEmail: data.user.email })}
        `,
      });
    },
  },

  // 16. Order Cancelled
  "customer.order.cancelled": {
    templateKey: "customer.order.cancelled",
    category: EmailCategory.TRANSACTIONAL,
    recipientRole: EmailRecipientRole.CUSTOMER,
    priority: EmailPriority.HIGH,
    subject: (data) => `Cancelled: Order #${data.orderId || "ZB"}`,
    preheader: "Your order cancellation is confirmed. Any payments will be refunded.",
    render: (rawData) => {
      const data = formatOrderViewModel(rawData);
      return EmailLayout({
        title: `Order Cancelled #${data.orderId}`,
        preheader: "Your order cancellation is confirmed.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Cancelled", variant: "danger" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #dc2626;">
            Order Cancellation Confirmed
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.user.fullName}, as requested, your order #${data.orderId} has been cancelled.
            ${data.cancellationReason ? `<br /><strong>Reason:</strong> ${data.cancellationReason}` : ""}
          </p>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin: 16px 0; font-size: 13px; color: #475569;">
            If any online payment was captured, an automatic refund of <strong>${enIN.formatCurrency(data.totals.total)}</strong> will be credited to your original payment source within 5-7 banking days.
          </div>
          ${Button({ href: emailConfig.clientUrl, label: "Continue Shopping" })}
          ${EmailFooter({ category: EmailCategory.TRANSACTIONAL, recipientEmail: data.user.email })}
        `,
      });
    },
  },

  // 17. Partial Cancellation
  "customer.order.partial_cancellation": {
    templateKey: "customer.order.partial_cancellation",
    category: EmailCategory.TRANSACTIONAL,
    recipientRole: EmailRecipientRole.CUSTOMER,
    priority: EmailPriority.HIGH,
    subject: (data) => `Update: Partial cancellation on order #${data.orderId || "ZB"}`,
    preheader: "One or more items in your order were cancelled.",
    render: (rawData) => {
      const data = formatOrderViewModel(rawData);
      return EmailLayout({
        title: `Partial Cancellation #${data.orderId}`,
        preheader: "One or more items in your order were cancelled.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Partial Cancel", variant: "warning" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #d97706;">
            Partial Order Update
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.user.fullName}, some items in order #${data.orderId} could not be fulfilled and have been cancelled. The remaining items will proceed as scheduled.
          </p>
          ${Button({ href: data.orderUrl, label: "View Updated Order" })}
          ${EmailFooter({ category: EmailCategory.TRANSACTIONAL, recipientEmail: data.user.email })}
        `,
      });
    },
  },
};
