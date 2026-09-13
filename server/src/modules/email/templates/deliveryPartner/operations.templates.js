import {
  EmailLayout,
  EmailHeader,
  EmailFooter,
  Button,
  SecurityNotice,
  emailConfig,
} from "../shared/index.js";
import { EmailCategory, EmailPriority, EmailRecipientRole } from "../../core/email.types.js";
import { formatDeliveryViewModel } from "../../schemas/delivery.schema.js";

export const deliveryPartnerOperationsTemplates = {
  // 1. New Batch Assigned
  "delivery_partner.assignment.new_batch": {
    templateKey: "delivery_partner.assignment.new_batch",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.DELIVERY_PARTNER,
    priority: EmailPriority.HIGH,
    subject: (data) => `New Delivery Batch Assigned: ${data.stopsCount || 15} stops ready 📦`,
    preheader: "Your morning delivery bag is sorted and ready for vehicle loading.",
    render: (rawData) => {
      const data = formatDeliveryViewModel(rawData);
      return EmailLayout({
        title: "Batch Assigned",
        preheader: "Your delivery bag is sorted and ready for vehicle loading.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Batch Ready", variant: "primary" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a;" class="dark-text-main">
            New Delivery Run Assigned
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.partner.name}, batch #${data.batchId || "BAT-102"} containing <strong>${data.stopsCount || 15} parcels</strong> has been assigned to you at ${data.hubName}.
          </p>
          ${Button({ href: data.actionUrl, label: "View Batch & Accept Route", fullWidth: true })}
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: "partners@zoshlogistics.com" })}
        `,
      });
    },
  },

  // 2. Route Assigned
  "delivery_partner.assignment.route_assigned": {
    templateKey: "delivery_partner.assignment.route_assigned",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.DELIVERY_PARTNER,
    priority: EmailPriority.NORMAL,
    subject: (data) => `Optimized Route Ready: Route #${data.routeId || "RTE-01"}`,
    preheader: "AI route optimization has sequenced your delivery stops for minimal transit time.",
    render: (rawData) => {
      const data = formatDeliveryViewModel(rawData);
      return EmailLayout({
        title: "Route Optimized",
        preheader: "AI route optimization has sequenced your delivery stops.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Route Sequenced", variant: "info" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a;" class="dark-text-main">
            Optimized Delivery Route Ready
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.partner.name}, your delivery itinerary #${data.routeId} has been calculated to minimize fuel and travel time.
          </p>
          ${Button({ href: data.actionUrl, label: "Open Turn-by-Turn Route" })}
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: "partners@zoshlogistics.com" })}
        `,
      });
    },
  },

  // 3. Shift Reminder
  "delivery_partner.schedule.shift_reminder": {
    templateKey: "delivery_partner.schedule.shift_reminder",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.DELIVERY_PARTNER,
    priority: EmailPriority.NORMAL,
    subject: (data) => `Shift Reminder: Reporting at ${data.shiftTime || "09:00 AM"} tomorrow`,
    preheader: "Please report to your base hub 15 minutes before your shift start.",
    render: (rawData) => {
      const data = formatDeliveryViewModel(rawData);
      return EmailLayout({
        title: "Shift Reminder",
        preheader: "Please report to your base hub 15 minutes before your shift start.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Shift Reminder", variant: "neutral" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a;" class="dark-text-main">
            Upcoming Delivery Shift
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.partner.name}, you are scheduled for the <strong>${data.shiftTime}</strong> window at ${data.hubName}. Bring your smartphone and ID badge.
          </p>
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: "partners@zoshlogistics.com" })}
        `,
      });
    },
  },

  // 4. Express Stop Reminder
  "delivery_partner.delivery.stop_reminder": {
    templateKey: "delivery_partner.delivery.stop_reminder",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.DELIVERY_PARTNER,
    priority: EmailPriority.HIGH,
    subject: () => "Priority Delivery: Guaranteed Express Stop Approaching ⚡",
    preheader: "Express SLA package must be delivered within the next 45 minutes.",
    render: (rawData) => {
      const data = formatDeliveryViewModel(rawData);
      return EmailLayout({
        title: "Express Delivery",
        preheader: "Express SLA package must be delivered within the next 45 minutes.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Express SLA", variant: "warning" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #d97706;">
            Priority Package Next in Sequence
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.partner.name}, order #${data.shipmentId || "SHP"} is an Express Guaranteed parcel. Ensure you complete doorstep handover within the scheduled slot.
          </p>
          ${Button({ href: data.actionUrl, label: "Navigate to Stop" })}
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: "partners@zoshlogistics.com" })}
        `,
      });
    },
  },

  // 5. Delivery Attempt Failed Logged
  "delivery_partner.delivery.attempt_failed": {
    templateKey: "delivery_partner.delivery.attempt_failed",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.DELIVERY_PARTNER,
    priority: EmailPriority.NORMAL,
    subject: (data) => `Failure Logged: Parcel #${data.shipmentId || "SHP"} marked undelivered`,
    preheader: "Reason code recorded. Return parcel to hub at end of shift.",
    render: (rawData) => {
      const data = formatDeliveryViewModel(rawData);
      return EmailLayout({
        title: "Failure Logged",
        preheader: "Return parcel to hub at end of shift.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Attempt Logged", variant: "neutral" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a;" class="dark-text-main">
            Delivery Exception Recorded
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.partner.name}, your failure scan for parcel #${data.shipmentId} was accepted. Please return the package during evening debrief.
          </p>
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: "partners@zoshlogistics.com" })}
        `,
      });
    },
  },

  // 6. Assignment Reassigned
  "delivery_partner.assignment.reassigned": {
    templateKey: "delivery_partner.assignment.reassigned",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.DELIVERY_PARTNER,
    priority: EmailPriority.NORMAL,
    subject: () => "Route Update: Shift / Batch Reassigned by Dispatch",
    preheader: "A dispatcher has updated your active route assignments.",
    render: (rawData) => {
      const data = formatDeliveryViewModel(rawData);
      return EmailLayout({
        title: "Batch Reassigned",
        preheader: "A dispatcher has updated your active route assignments.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Route Updated", variant: "warning" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #d97706;">
            Assignment Modified
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.partner.name}, your active deliveries were modified due to vehicle reallocation or shift balancing.
          </p>
          ${Button({ href: data.actionUrl, label: "View Updated Schedule" })}
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: "partners@zoshlogistics.com" })}
        `,
      });
    },
  },

  // 7. Security Alert
  "delivery_partner.security.alert": {
    templateKey: "delivery_partner.security.alert",
    category: EmailCategory.SECURITY,
    recipientRole: EmailRecipientRole.DELIVERY_PARTNER,
    priority: EmailPriority.HIGH,
    subject: () => "Security Alert: Partner app login from new device",
    preheader: "Sign-in detected to your delivery partner account.",
    render: (rawData) => {
      const data = formatDeliveryViewModel(rawData);
      return EmailLayout({
        title: "Partner Security",
        preheader: "Sign-in detected to your delivery partner account.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Security Notice", variant: "warning" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a;" class="dark-text-main">
            Partner Account Login Alert
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.partner.name}, your partner portal credentials were used to sign in to the Zosh Logistics mobile application.
          </p>
          ${SecurityNotice({
            severity: "MEDIUM",
            supportUrl: emailConfig.deliveryPartnerUrl + "/help",
          })}
          ${EmailFooter({ category: EmailCategory.SECURITY, recipientEmail: "security@zoshlogistics.com" })}
        `,
      });
    },
  },
};
