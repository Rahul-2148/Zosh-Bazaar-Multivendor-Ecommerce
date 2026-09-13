import {
  EmailLayout,
  EmailHeader,
  EmailFooter,
  Button,
  Card,
  AddressBlock,
} from "../shared/index.js";
import { EmailCategory, EmailPriority, EmailRecipientRole } from "../../core/email.types.js";
import { formatOrderViewModel } from "../../schemas/order.schema.js";

export const customerReturnTemplates = {
  // 1. Return Requested
  "customer.return.requested": {
    templateKey: "customer.return.requested",
    category: EmailCategory.TRANSACTIONAL,
    recipientRole: EmailRecipientRole.CUSTOMER,
    priority: EmailPriority.HIGH,
    subject: (data) => `Return Request Received: Order #${data.orderId || "ZB"}`,
    preheader: "We have received your return request and are reviewing it.",
    render: (rawData) => {
      const data = formatOrderViewModel(rawData);
      return EmailLayout({
        title: `Return Requested #${data.orderId}`,
        preheader: "We have received your return request.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Return Initiated", variant: "warning" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a;" class="dark-text-main">
            Return Request Acknowledged
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.user.fullName}, we received your return request for order #${data.orderId}. Our merchant verification team is reviewing the claim against return policy guidelines.
          </p>
          ${Button({ href: data.orderUrl, label: "View Return Status" })}
          ${EmailFooter({ category: EmailCategory.TRANSACTIONAL, recipientEmail: data.user.email })}
        `,
      });
    },
  },

  // 2. Return Approved
  "customer.return.approved": {
    templateKey: "customer.return.approved",
    category: EmailCategory.TRANSACTIONAL,
    recipientRole: EmailRecipientRole.CUSTOMER,
    priority: EmailPriority.HIGH,
    subject: (data) => `Return Approved: Order #${data.orderId || "ZB"}`,
    preheader: "Your return request has been approved. Courier pickup will be scheduled.",
    render: (rawData) => {
      const data = formatOrderViewModel(rawData);
      return EmailLayout({
        title: `Return Approved #${data.orderId}`,
        preheader: "Your return request has been approved.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Return Approved", variant: "success" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #16a34a;">
            Return Authorized
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.user.fullName}, your return request for order #${data.orderId} has been authorized. A courier agent will arrive to inspect and pick up the package.
          </p>
          ${Card({
            title: "Pickup Instructions",
            children: `
              <ul style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.6; color: #475569;" class="dark-text-muted">
                <li>Keep the item in its original box with all brand tags and accessories intact.</li>
                <li>Do not seal the parcel before the agent verifies the serial number/product.</li>
              </ul>
            `,
          })}
          ${Button({ href: data.orderUrl, label: "Manage Pickup Slot" })}
          ${EmailFooter({ category: EmailCategory.TRANSACTIONAL, recipientEmail: data.user.email })}
        `,
      });
    },
  },

  // 3. Return Rejected
  "customer.return.rejected": {
    templateKey: "customer.return.rejected",
    category: EmailCategory.TRANSACTIONAL,
    recipientRole: EmailRecipientRole.CUSTOMER,
    priority: EmailPriority.HIGH,
    subject: (data) => `Update on return request: Order #${data.orderId || "ZB"}`,
    preheader: "Your return request could not be approved based on return policy criteria.",
    render: (rawData) => {
      const data = formatOrderViewModel(rawData);
      return EmailLayout({
        title: `Return Rejected #${data.orderId}`,
        preheader: "Your return request could not be approved.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Not Approved", variant: "danger" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #dc2626;">
            Return Request Not Approved
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.user.fullName}, after reviewing your return claim for order #${data.orderId}, the merchant determined that this item falls outside the returnable policy window or category exclusions.
          </p>
          ${Button({ href: `${data.orderUrl}/support`, label: "Appeal or Contact Support" })}
          ${EmailFooter({ category: EmailCategory.TRANSACTIONAL, recipientEmail: data.user.email })}
        `,
      });
    },
  },

  // 4. Return Pickup Scheduled
  "customer.return.pickup_scheduled": {
    templateKey: "customer.return.pickup_scheduled",
    category: EmailCategory.TRANSACTIONAL,
    recipientRole: EmailRecipientRole.CUSTOMER,
    priority: EmailPriority.NORMAL,
    subject: (data) => `Pickup Scheduled: Return for order #${data.orderId || "ZB"}`,
    preheader: "Our logistics partner will visit your address for item pickup.",
    render: (rawData) => {
      const data = formatOrderViewModel(rawData);
      return EmailLayout({
        title: `Pickup Scheduled #${data.orderId}`,
        preheader: "Our logistics partner will visit your address for item pickup.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Pickup Scheduled", variant: "info" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a;" class="dark-text-main">
            Return Pickup Scheduled
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.user.fullName}, a delivery partner from ${data.carrier} will visit your address between 10:00 AM and 05:00 PM on the scheduled pickup date.
          </p>
          ${AddressBlock({ address: data.shippingAddress, title: "Pickup Location" })}
          ${Button({ href: data.orderUrl, label: "View Pickup Details" })}
          ${EmailFooter({ category: EmailCategory.TRANSACTIONAL, recipientEmail: data.user.email })}
        `,
      });
    },
  },

  // 5. Return Pickup Reminder
  "customer.return.pickup_reminder": {
    templateKey: "customer.return.pickup_reminder",
    category: EmailCategory.TRANSACTIONAL,
    recipientRole: EmailRecipientRole.CUSTOMER,
    priority: EmailPriority.HIGH,
    subject: (data) => `Reminder: Return pickup today for order #${data.orderId || "ZB"}`,
    preheader: "Our agent will visit today to collect your return parcel.",
    render: (rawData) => {
      const data = formatOrderViewModel(rawData);
      return EmailLayout({
        title: `Pickup Today #${data.orderId}`,
        preheader: "Our agent will visit today to collect your return parcel.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Pickup Today", variant: "accent" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a;" class="dark-text-main">
            Return Pickup Arrives Today
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.user.fullName}, please have the return package ready with all accessories and manuals. An agent will contact you before arriving.
          </p>
          ${Button({ href: data.orderUrl, label: "Track Agent Location" })}
          ${EmailFooter({ category: EmailCategory.TRANSACTIONAL, recipientEmail: data.user.email })}
        `,
      });
    },
  },

  // 6. Return Picked Up
  "customer.return.picked_up": {
    templateKey: "customer.return.picked_up",
    category: EmailCategory.TRANSACTIONAL,
    recipientRole: EmailRecipientRole.CUSTOMER,
    priority: EmailPriority.HIGH,
    subject: (data) => `Item Picked Up: Return for order #${data.orderId || "ZB"}`,
    preheader: "The courier has collected your return package.",
    render: (rawData) => {
      const data = formatOrderViewModel(rawData);
      return EmailLayout({
        title: `Picked Up #${data.orderId}`,
        preheader: "The courier has collected your return package.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Picked Up", variant: "success" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #16a34a;">
            Return Package Collected
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.user.fullName}, our delivery agent has successfully received your package for order #${data.orderId}. It is currently en route to our return processing hub.
          </p>
          ${Button({ href: data.orderUrl, label: "Track Return Transit" })}
          ${EmailFooter({ category: EmailCategory.TRANSACTIONAL, recipientEmail: data.user.email })}
        `,
      });
    },
  },

  // 7. Return Received at Hub
  "customer.return.received": {
    templateKey: "customer.return.received",
    category: EmailCategory.TRANSACTIONAL,
    recipientRole: EmailRecipientRole.CUSTOMER,
    priority: EmailPriority.NORMAL,
    subject: (data) => `Return Package Received at Hub: Order #${data.orderId || "ZB"}`,
    preheader: "Your return parcel has arrived at our warehouse.",
    render: (rawData) => {
      const data = formatOrderViewModel(rawData);
      return EmailLayout({
        title: `Received at Hub #${data.orderId}`,
        preheader: "Your return parcel has arrived at our warehouse.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Hub Inbound", variant: "info" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a;" class="dark-text-main">
            Return Arrived at Inspection Facility
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.user.fullName}, the return package for order #${data.orderId} was checked in at our regional returns facility.
          </p>
          ${Button({ href: data.orderUrl, label: "View Status" })}
          ${EmailFooter({ category: EmailCategory.TRANSACTIONAL, recipientEmail: data.user.email })}
        `,
      });
    },
  },

  // 8. Return Under Inspection
  "customer.return.under_inspection": {
    templateKey: "customer.return.under_inspection",
    category: EmailCategory.TRANSACTIONAL,
    recipientRole: EmailRecipientRole.CUSTOMER,
    priority: EmailPriority.NORMAL,
    subject: (data) => `Quality Check in Progress: Return for order #${data.orderId || "ZB"}`,
    preheader: "Our quality assurance team is verifying the returned items.",
    render: (rawData) => {
      const data = formatOrderViewModel(rawData);
      return EmailLayout({
        title: `Under Inspection #${data.orderId}`,
        preheader: "Our quality assurance team is verifying the returned items.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Inspection", variant: "info" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a;" class="dark-text-main">
            Quality Inspection Underway
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.user.fullName}, our team is conducting a routine quality inspection on the returned item for order #${data.orderId}. This process typically takes under 24 hours.
          </p>
          ${EmailFooter({ category: EmailCategory.TRANSACTIONAL, recipientEmail: data.user.email })}
        `,
      });
    },
  },

  // 9. Return Approved for Refund
  "customer.return.approved_for_refund": {
    templateKey: "customer.return.approved_for_refund",
    category: EmailCategory.TRANSACTIONAL,
    recipientRole: EmailRecipientRole.CUSTOMER,
    priority: EmailPriority.HIGH,
    subject: (data) => `Inspection Passed: Refund approved for order #${data.orderId || "ZB"}`,
    preheader: "Your returned product passed quality verification. Refund initiated.",
    render: (rawData) => {
      const data = formatOrderViewModel(rawData);
      return EmailLayout({
        title: `Refund Approved #${data.orderId}`,
        preheader: "Your returned product passed quality verification. Refund initiated.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Inspection Passed", variant: "success" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #16a34a;">
            Return Verified & Approved
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.user.fullName}, the returned item for order #${data.orderId} passed inspection. Your refund has been authorized and queued for bank settlement.
          </p>
          ${Button({ href: data.orderUrl, label: "View Refund Details" })}
          ${EmailFooter({ category: EmailCategory.TRANSACTIONAL, recipientEmail: data.user.email })}
        `,
      });
    },
  },

  // 10. Return Rejected After Inspection
  "customer.return.rejected_inspection": {
    templateKey: "customer.return.rejected_inspection",
    category: EmailCategory.TRANSACTIONAL,
    recipientRole: EmailRecipientRole.CUSTOMER,
    priority: EmailPriority.HIGH,
    subject: (data) => `Inspection Notice: Return rejected for order #${data.orderId || "ZB"}`,
    preheader: "Returned item did not meet policy inspection requirements.",
    render: (rawData) => {
      const data = formatOrderViewModel(rawData);
      return EmailLayout({
        title: `Return Rejected #${data.orderId}`,
        preheader: "Returned item did not meet policy inspection requirements.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Inspection Failed", variant: "danger" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #dc2626;">
            Quality Verification Failed
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.user.fullName}, the returned merchandise for order #${data.orderId} showed signs of excessive wear, missing serial numbers, or altered packaging. The item will be re-dispatched to your delivery address.
          </p>
          ${Button({ href: `${data.orderUrl}/dispute`, label: "Contact Customer Care", variant: "danger" })}
          ${EmailFooter({ category: EmailCategory.TRANSACTIONAL, recipientEmail: data.user.email })}
        `,
      });
    },
  },
};
