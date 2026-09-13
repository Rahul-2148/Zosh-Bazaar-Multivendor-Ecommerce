import {
  EmailLayout,
  EmailHeader,
  EmailFooter,
  Button,
  Card,
  emailConfig,
} from "../shared/index.js";
import { EmailCategory, EmailPriority, EmailRecipientRole } from "../../core/email.types.js";
import { formatSellerViewModel } from "../../schemas/seller.schema.js";
import { enIN } from "../../localization/en-IN/messages.js";

export const sellerOrderTemplates = {
  // 1. New Order Received
  "seller.order.new_order": {
    templateKey: "seller.order.new_order",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.SELLER,
    priority: EmailPriority.HIGH,
    subject: (data) => `New Order Received: #${data.orderId || "ZB"} (Action Required) 🛒`,
    preheader: "A customer has purchased items from your store. Pack and confirm dispatch.",
    render: (rawData) => {
      const data = formatSellerViewModel(rawData);
      return EmailLayout({
        title: `New Order #${data.orderId}`,
        preheader: "A customer has purchased items from your store.",
        children: `
          ${EmailHeader({ roleBadge: { label: "New Order", variant: "primary" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a;" class="dark-text-main">
            New Order Received!
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.seller.sellerName}, order <strong>#${data.orderId}</strong> containing ${data.itemsCount} item(s) has been placed with your store. Value: <strong>${enIN.formatCurrency(data.amount)}</strong>.
          </p>
          ${Card({
            title: "Fulfillment SLA",
            children: `
              <div style="font-size: 13px; color: #475569;">
                Please pack the order and download shipping labels within <strong>24 hours</strong> to protect your dispatch SLA rating.
              </div>
            `,
          })}
          ${Button({ href: `${emailConfig.sellerUrl}/orders/${data.orderId}`, label: "View & Process Order", fullWidth: true })}
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: data.seller.email })}
        `,
      });
    },
  },

  // 2. Action Required
  "seller.order.requires_action": {
    templateKey: "seller.order.requires_action",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.SELLER,
    priority: EmailPriority.HIGH,
    subject: (data) => `Action Required: Confirm order #${data.orderId || "ZB"}`,
    preheader: "Order pending merchant confirmation.",
    render: (rawData) => {
      const data = formatSellerViewModel(rawData);
      return EmailLayout({
        title: `Action Required #${data.orderId}`,
        preheader: "Order pending merchant confirmation.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Action Required", variant: "warning" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #d97706;">
            Pending Merchant Confirmation
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.seller.sellerName}, order #${data.orderId} has been awaiting confirmation for over 12 hours. Please confirm availability to prevent automatic cancellation.
          </p>
          ${Button({ href: `${emailConfig.sellerUrl}/orders/${data.orderId}`, label: "Confirm Order Now", variant: "primary" })}
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: data.seller.email })}
        `,
      });
    },
  },

  // 3. Preparation Reminder
  "seller.order.preparation_reminder": {
    templateKey: "seller.order.preparation_reminder",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.SELLER,
    priority: EmailPriority.NORMAL,
    subject: (data) => `Preparation Reminder: Order #${data.orderId || "ZB"}`,
    preheader: "Courier pickup will be assigned once packaging is marked complete.",
    render: (rawData) => {
      const data = formatSellerViewModel(rawData);
      return EmailLayout({
        title: `Preparation Reminder #${data.orderId}`,
        preheader: "Courier pickup will be assigned once packaging is marked complete.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Packing Reminder", variant: "info" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a;" class="dark-text-main">
            Pack Order #${data.orderId}
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.seller.sellerName}, please ensure order #${data.orderId} is packed with barcode shipping labels affixed.
          </p>
          ${Button({ href: `${emailConfig.sellerUrl}/orders/${data.orderId}`, label: "Print Shipping Label" })}
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: data.seller.email })}
        `,
      });
    },
  },

  // 4. Shipment Deadline Approaching
  "seller.order.deadline_reminder": {
    templateKey: "seller.order.deadline_reminder",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.SELLER,
    priority: EmailPriority.HIGH,
    subject: (data) => `URGENT: Dispatch deadline approaching for order #${data.orderId || "ZB"} ⚠️`,
    preheader: "Dispatch deadline is in less than 4 hours. Prevent SLA breach penalties.",
    render: (rawData) => {
      const data = formatSellerViewModel(rawData);
      return EmailLayout({
        title: `SLA Deadline #${data.orderId}`,
        preheader: "Dispatch deadline is in less than 4 hours.",
        children: `
          ${EmailHeader({ roleBadge: { label: "SLA Urgent", variant: "danger" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #dc2626;">
            Dispatch SLA Deadline Approaching!
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.seller.sellerName}, order #${data.orderId} is nearing its mandatory dispatch SLA window. Hand over the parcel to avoid merchant cancellation strikes and rating deductions.
          </p>
          ${Button({ href: `${emailConfig.sellerUrl}/orders/${data.orderId}`, label: "Mark Ready for Pickup Now", variant: "danger", fullWidth: true })}
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: data.seller.email })}
        `,
      });
    },
  },

  // 5. Ready for Pickup
  "seller.order.ready_for_pickup": {
    templateKey: "seller.order.ready_for_pickup",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.SELLER,
    priority: EmailPriority.NORMAL,
    subject: (data) => `Manifest Generated: Order #${data.orderId || "ZB"} ready for pickup`,
    preheader: "Logistics carrier notified for warehouse pickup.",
    render: (rawData) => {
      const data = formatSellerViewModel(rawData);
      return EmailLayout({
        title: `Manifest Ready #${data.orderId}`,
        preheader: "Logistics carrier notified for warehouse pickup.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Manifested", variant: "info" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a;" class="dark-text-main">
            Pickup Manifest Generated
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.seller.sellerName}, your manifest for order #${data.orderId} is registered. A courier will arrive during today's pickup window.
          </p>
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: data.seller.email })}
        `,
      });
    },
  },

  // 6. Pickup Scheduled
  "seller.order.pickup_scheduled": {
    templateKey: "seller.order.pickup_scheduled",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.SELLER,
    priority: EmailPriority.NORMAL,
    subject: (data) => `Logistics Pickup Scheduled: Order #${data.orderId || "ZB"}`,
    preheader: "Logistics partner assigned for pickup from your registered warehouse.",
    render: (rawData) => {
      const data = formatSellerViewModel(rawData);
      return EmailLayout({
        title: `Pickup Scheduled #${data.orderId}`,
        preheader: "Logistics partner assigned for pickup from your registered warehouse.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Pickup Assigned", variant: "info" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a;" class="dark-text-main">
            Courier Pickup Scheduled
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.seller.sellerName}, courier pickup for order #${data.orderId} has been scheduled. Keep the manifested parcels at your dispatch desk.
          </p>
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: data.seller.email })}
        `,
      });
    },
  },

  // 7. Order Picked Up
  "seller.order.picked_up": {
    templateKey: "seller.order.picked_up",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.SELLER,
    priority: EmailPriority.NORMAL,
    subject: (data) => `Order #${data.orderId || "ZB"} successfully picked up by courier`,
    preheader: "Carrier has scanned your manifest and received the parcel.",
    render: (rawData) => {
      const data = formatSellerViewModel(rawData);
      return EmailLayout({
        title: `Picked Up #${data.orderId}`,
        preheader: "Carrier has scanned your manifest and received the parcel.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Dispatched", variant: "success" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #16a34a;">
            Handover Completed
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.seller.sellerName}, the courier has collected order #${data.orderId}. Your on-time dispatch SLA has been recorded.
          </p>
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: data.seller.email })}
        `,
      });
    },
  },

  // 8. Order Cancelled
  "seller.order.cancelled": {
    templateKey: "seller.order.cancelled",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.SELLER,
    priority: EmailPriority.HIGH,
    subject: (data) => `Order #${data.orderId || "ZB"} has been cancelled`,
    preheader: "The customer or system cancelled this order prior to dispatch.",
    render: (rawData) => {
      const data = formatSellerViewModel(rawData);
      return EmailLayout({
        title: `Order Cancelled #${data.orderId}`,
        preheader: "The order was cancelled prior to dispatch.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Cancelled", variant: "danger" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #dc2626;">
            Order Cancelled
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.seller.sellerName}, order #${data.orderId} has been cancelled. Do not ship this package. Reserved inventory has been restored to your catalog.
          </p>
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: data.seller.email })}
        `,
      });
    },
  },

  // 9. Customer Requested Cancellation
  "seller.order.customer_cancellation_request": {
    templateKey: "seller.order.customer_cancellation_request",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.SELLER,
    priority: EmailPriority.HIGH,
    subject: (data) => `Cancellation Request: Customer wants to cancel order #${data.orderId || "ZB"}`,
    preheader: "Customer requested cancellation before dispatch.",
    render: (rawData) => {
      const data = formatSellerViewModel(rawData);
      return EmailLayout({
        title: `Cancellation Request #${data.orderId}`,
        preheader: "Customer requested cancellation before dispatch.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Cancel Request", variant: "warning" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #d97706;">
            Customer Cancellation Request
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.seller.sellerName}, the customer requested to cancel order #${data.orderId}. If the package has not left your facility, please approve the cancellation in your console.
          </p>
          ${Button({ href: `${emailConfig.sellerUrl}/orders/${data.orderId}`, label: "Respond to Request" })}
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: data.seller.email })}
        `,
      });
    },
  },

  // 10. Return Requested
  "seller.return.requested": {
    templateKey: "seller.return.requested",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.SELLER,
    priority: EmailPriority.HIGH,
    subject: (data) => `Customer Return Requested: Order #${data.orderId || "ZB"}`,
    preheader: "A buyer has submitted a return request for products sold by your store.",
    render: (rawData) => {
      const data = formatSellerViewModel(rawData);
      return EmailLayout({
        title: `Return Requested #${data.orderId}`,
        preheader: "A buyer has submitted a return request.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Return Request", variant: "warning" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #d97706;">
            Return Requested by Customer
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.seller.sellerName}, a customer requested a return for order #${data.orderId}.
            ${data.reason ? `<br /><strong>Stated Reason:</strong> ${data.reason}` : ""}
          </p>
          ${Button({ href: emailConfig.sellerUrl + "/returns", label: "Review Return Case" })}
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: data.seller.email })}
        `,
      });
    },
  },

  // 11. Return Approved
  "seller.return.approved": {
    templateKey: "seller.return.approved",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.SELLER,
    priority: EmailPriority.NORMAL,
    subject: (data) => `Return Authorized: Order #${data.orderId || "ZB"}`,
    preheader: "Return has been approved and reverse pickup will be scheduled.",
    render: (rawData) => {
      const data = formatSellerViewModel(rawData);
      return EmailLayout({
        title: `Return Approved #${data.orderId}`,
        preheader: "Reverse pickup scheduled.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Return Approved", variant: "info" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a;" class="dark-text-main">
            Return Authorized
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.seller.sellerName}, reverse logistics has been booked for order #${data.orderId}. The item will be delivered back to your warehouse for restocking or inspection.
          </p>
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: data.seller.email })}
        `,
      });
    },
  },

  // 12. Return Received
  "seller.return.received": {
    templateKey: "seller.return.received",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.SELLER,
    priority: EmailPriority.NORMAL,
    subject: (data) => `Return Delivered: Order #${data.orderId || "ZB"} arrived at warehouse`,
    preheader: "Reverse shipment delivered. Please verify item within 48 hours.",
    render: (rawData) => {
      const data = formatSellerViewModel(rawData);
      return EmailLayout({
        title: `Return Delivered #${data.orderId}`,
        preheader: "Reverse shipment delivered to your warehouse.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Return Delivered", variant: "success" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #16a34a;">
            Return Parcel Delivered
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.seller.sellerName}, returned goods for order #${data.orderId} have been delivered back to your pickup address. Please complete quality inspection within 48 hours.
          </p>
          ${Button({ href: emailConfig.sellerUrl + "/returns", label: "Complete Merchant Inspection" })}
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: data.seller.email })}
        `,
      });
    },
  },

  // 13. Refund Impact Notification
  "seller.return.refund_impact": {
    templateKey: "seller.return.refund_impact",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.SELLER,
    priority: EmailPriority.HIGH,
    subject: (data) => `Settlement Adjustment: Refund processed for order #${data.orderId || "ZB"}`,
    preheader: "A refund was completed and will be adjusted in your next settlement.",
    render: (rawData) => {
      const data = formatSellerViewModel(rawData);
      return EmailLayout({
        title: `Settlement Impact #${data.orderId}`,
        preheader: "A refund was completed and will be adjusted in your next settlement.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Settlement Adjustment", variant: "warning" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #d97706;">
            Settlement Deduction Notice
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.seller.sellerName}, a customer refund of <strong>${enIN.formatCurrency(data.amount)}</strong> was processed for order #${data.orderId}. This sum will be reconciled in your upcoming settlement cycle.
          </p>
          ${Button({ href: emailConfig.sellerUrl + "/finances", label: "View Financial Ledger" })}
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: data.seller.email })}
        `,
      });
    },
  },
};
