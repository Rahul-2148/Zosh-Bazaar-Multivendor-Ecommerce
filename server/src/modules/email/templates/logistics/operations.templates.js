import {
  EmailLayout,
  EmailHeader,
  EmailFooter,
  Button,
} from "../shared/index.js";
import { EmailCategory, EmailPriority, EmailRecipientRole } from "../../core/email.types.js";
import { formatDeliveryViewModel } from "../../schemas/delivery.schema.js";

function LogisticsBox(data) {
  return `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background: #0f172a; border-radius: 8px; margin: 16px 0; border-collapse: separate !important;">
      <tr>
        <td style="padding: 16px 18px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="color: #f8fafc; font-family: monospace; font-size: 12px; border-collapse: collapse;">
            <tr><td style="color: #94a3b8; width: 120px; padding: 3px 0;">FACILITY:</td><td style="color: #38bdf8; font-weight: bold; padding: 3px 0;">${data.hubName}</td></tr>
            ${data.shipmentId ? `<tr><td style="color: #94a3b8; padding: 3px 0;">PARCEL ID:</td><td style="padding: 3px 0;">${data.shipmentId}</td></tr>` : ""}
            ${data.exceptionReason ? `<tr><td style="color: #94a3b8; padding: 3px 0;">EXCEPTION:</td><td style="color: #f87171; padding: 3px 0;">${data.exceptionReason}</td></tr>` : ""}
          </table>
        </td>
      </tr>
    </table>
  `;
}

export const logisticsOperationsTemplates = {
  // 1. SLA Risk Alert
  "logistics.sla.risk_alert": {
    templateKey: "logistics.sla.risk_alert",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.LOGISTICS,
    priority: EmailPriority.HIGH,
    subject: (data) => `[SLA WARNING] Hub Inbound Backlog at Risk: ${data.hubName || "Hub"} ⚠️`,
    preheader: "Hub sorter queue backlog approaching SLA breach limit.",
    render: (rawData) => {
      const data = formatDeliveryViewModel(rawData);
      return EmailLayout({
        title: "SLA Warning",
        preheader: "Hub sorter queue backlog approaching SLA breach limit.",
        children: `
          ${EmailHeader({ roleBadge: { label: "SLA Risk", variant: "warning" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #d97706;">
            Hub Processing SLA At Risk
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Inbound parcel accumulation at ${data.hubName} threatens outbound cutoff targets for the morning sorting shift.
          </p>
          ${LogisticsBox(data)}
          ${Button({ href: data.actionUrl, label: "View Hub Telemetry" })}
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: "operations@zoshlogistics.com" })}
        `,
      });
    },
  },

  // 2. Shipment Exception
  "logistics.shipment.exception": {
    templateKey: "logistics.shipment.exception",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.LOGISTICS,
    priority: EmailPriority.HIGH,
    subject: (data) => `[EXCEPTION] Damaged / Unreadable Barcode: Shipment #${data.shipmentId || "SHP"}`,
    preheader: "Package damaged or unreadable barcode flagged during sorting.",
    render: (rawData) => {
      const data = formatDeliveryViewModel(rawData);
      return EmailLayout({
        title: "Shipment Exception",
        preheader: "Package flagged during sorting.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Exception", variant: "danger" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #dc2626;">
            Shipment Exception Flagged
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Sorter station marked shipment #${data.shipmentId} as damaged or possessing an unreadable label. Physical QA inspection required.
          </p>
          ${LogisticsBox(data)}
          ${Button({ href: data.actionUrl, label: "Resolve Exception in App" })}
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: "exceptions@zoshlogistics.com" })}
        `,
      });
    },
  },

  // 3. Delivery Attempt Failed
  "logistics.shipment.attempt_failed": {
    templateKey: "logistics.shipment.attempt_failed",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.LOGISTICS,
    priority: EmailPriority.NORMAL,
    subject: (data) => `[DELIVERY FAILED] Attempt #${data.stopsCount || 1} on Shipment #${data.shipmentId || "SHP"}`,
    preheader: "Last-mile agent logged delivery attempt failure code.",
    render: (rawData) => {
      const data = formatDeliveryViewModel(rawData);
      return EmailLayout({
        title: "Delivery Failed",
        preheader: "Last-mile agent logged delivery failure.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Attempt Failed", variant: "warning" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #d97706;">
            Doorstep Delivery Unsuccessful
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Delivery agent ${data.partner.name || "Partner"} logged reason: <strong>${data.exceptionReason || "Customer Unavailable"}</strong> for parcel #${data.shipmentId}.
          </p>
          ${LogisticsBox(data)}
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: "operations@zoshlogistics.com" })}
        `,
      });
    },
  },

  // 4. Warehouse Exception
  "logistics.warehouse.exception": {
    templateKey: "logistics.warehouse.exception",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.LOGISTICS,
    priority: EmailPriority.NORMAL,
    subject: (data) => `[WAREHOUSE] Bin Location Discrepancy at ${data.hubName || "Hub"}`,
    preheader: "Inventory bin scanning mismatch detected during picking.",
    render: (rawData) => {
      const data = formatDeliveryViewModel(rawData);
      return EmailLayout({
        title: "Warehouse Discrepancy",
        preheader: "Inventory bin mismatch detected.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Inventory Mismatch", variant: "warning" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #d97706;">
            Warehouse Bin Discrepancy
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Automated pick scanners registered a bin location discrepancy during order fulfillment at ${data.hubName}.
          </p>
          ${LogisticsBox(data)}
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: "warehouse@zoshlogistics.com" })}
        `,
      });
    },
  },

  // 5. Warehouse Capacity Alert
  "logistics.warehouse.capacity_alert": {
    templateKey: "logistics.warehouse.capacity_alert",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.LOGISTICS,
    priority: EmailPriority.HIGH,
    subject: (data) => `[CAPACITY CRITICAL] ${data.hubName || "Hub"} Storage Exceeded 85% 🏭`,
    preheader: "Hub storage utilization reached critical capacity threshold.",
    render: (rawData) => {
      const data = formatDeliveryViewModel(rawData);
      return EmailLayout({
        title: "Capacity Warning",
        preheader: "Hub storage utilization reached critical capacity threshold.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Storage Critical", variant: "danger" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #dc2626;">
            Hub Storage Capacity Critical
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Floor and staging storage at ${data.hubName} has reached 88% capacity. Dispatch additional line-haul trailers to clear sorted volume.
          </p>
          ${LogisticsBox(data)}
          ${Button({ href: data.actionUrl, label: "Manage Floor Clearances", variant: "danger" })}
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: "capacity@zoshlogistics.com" })}
        `,
      });
    },
  },

  // 6. Logistics Operations Escalation
  "logistics.operations.escalation": {
    templateKey: "logistics.operations.escalation",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.LOGISTICS,
    priority: EmailPriority.IMMEDIATE,
    subject: () => "[CRITICAL] Operational Breakdown Escalated to Network Director 🚨",
    preheader: "Major freight or facility outage escalated for intervention.",
    render: (rawData) => {
      const data = formatDeliveryViewModel(rawData);
      return EmailLayout({
        title: "Operations Escalation",
        preheader: "Major freight or facility outage escalated.",
        children: `
          ${EmailHeader({ roleBadge: { label: "High Escalation", variant: "danger" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #dc2626;">
            Logistics Network Escalation
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Critical supply chain bottleneck requires immediate intervention from the logistics control tower director.
          </p>
          ${LogisticsBox(data)}
          ${Button({ href: data.actionUrl, label: "Access Incident Room", variant: "danger" })}
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: "controltower@zoshlogistics.com" })}
        `,
      });
    },
  },
};
