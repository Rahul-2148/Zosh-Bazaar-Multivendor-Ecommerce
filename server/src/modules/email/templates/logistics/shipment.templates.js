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
            ${data.shipmentId ? `<tr><td style="color: #94a3b8; width: 120px; padding: 3px 0;">SHIPMENT ID:</td><td style="color: #38bdf8; font-weight: bold; padding: 3px 0;">${data.shipmentId}</td></tr>` : ""}
            <tr><td style="color: #94a3b8; padding: 3px 0;">HUB LOCATION:</td><td style="padding: 3px 0;">${data.hubName}</td></tr>
            ${data.routeId ? `<tr><td style="color: #94a3b8; padding: 3px 0;">ROUTE ID:</td><td style="padding: 3px 0;">${data.routeId}</td></tr>` : ""}
            ${data.batchId ? `<tr><td style="color: #94a3b8; padding: 3px 0;">BATCH ID:</td><td style="padding: 3px 0;">${data.batchId}</td></tr>` : ""}
          </table>
        </td>
      </tr>
    </table>
  `;
}

export const logisticsShipmentTemplates = {
  // 1. Shipment Created
  "logistics.shipment.created": {
    templateKey: "logistics.shipment.created",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.LOGISTICS,
    priority: EmailPriority.NORMAL,
    subject: (data) => `[DISPATCH] Shipment Created: #${data.shipmentId || "SHP-001"}`,
    preheader: "New consignment ready for line-haul dispatch.",
    render: (rawData) => {
      const data = formatDeliveryViewModel(rawData);
      return EmailLayout({
        title: "Shipment Created",
        preheader: "New consignment ready for line-haul dispatch.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Consignment", variant: "info" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a;" class="dark-text-main">
            Consignment Created
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Shipment #${data.shipmentId} has been registered and bagged for outbound trunk routing from ${data.hubName}.
          </p>
          ${LogisticsBox(data)}
          ${Button({ href: data.actionUrl, label: "View Line-Haul Manifest" })}
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: "dispatch@zoshlogistics.com" })}
        `,
      });
    },
  },

  // 2. Shipment Assigned
  "logistics.shipment.assigned": {
    templateKey: "logistics.shipment.assigned",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.LOGISTICS,
    priority: EmailPriority.NORMAL,
    subject: (data) => `[ASSIGNMENT] Shipment #${data.shipmentId || "SHP-001"} assigned to line-haul carrier`,
    preheader: "Transport vehicle assigned to shipment.",
    render: (rawData) => {
      const data = formatDeliveryViewModel(rawData);
      return EmailLayout({
        title: "Shipment Assigned",
        preheader: "Transport vehicle assigned to shipment.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Assigned", variant: "info" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a;" class="dark-text-main">
            Line-Haul Carrier Assigned
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Shipment #${data.shipmentId} was assigned to freight partner for transit between regional distribution centers.
          </p>
          ${LogisticsBox(data)}
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: "dispatch@zoshlogistics.com" })}
        `,
      });
    },
  },

  // 3. Hub Transfer
  "logistics.shipment.hub_transfer": {
    templateKey: "logistics.shipment.hub_transfer",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.LOGISTICS,
    priority: EmailPriority.NORMAL,
    subject: (data) => `[HUB INBOUND] Transfer Manifest for Hub: ${data.hubName || "Hub"}`,
    preheader: "Inter-hub transfer manifest generated.",
    render: (rawData) => {
      const data = formatDeliveryViewModel(rawData);
      return EmailLayout({
        title: "Hub Transfer",
        preheader: "Inter-hub transfer manifest generated.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Hub Inbound", variant: "info" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a;" class="dark-text-main">
            Inter-Hub Transfer Notice
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Inbound trunk line transfer is en route to ${data.hubName}. Prepare sorting conveyor for batch check-in.
          </p>
          ${LogisticsBox(data)}
          ${Button({ href: data.actionUrl, label: "Confirm Hub Inbound" })}
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: "hubs@zoshlogistics.com" })}
        `,
      });
    },
  },

  // 4. Shipment Delayed
  "logistics.shipment.delayed": {
    templateKey: "logistics.shipment.delayed",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.LOGISTICS,
    priority: EmailPriority.HIGH,
    subject: (data) => `[DELAY] Transit Delay on Trunk Route: #${data.routeId || "ROUTE"}`,
    preheader: "Line haul truck delayed by weather or highway congestion.",
    render: (rawData) => {
      const data = formatDeliveryViewModel(rawData);
      return EmailLayout({
        title: "Transit Delay",
        preheader: "Line haul truck delayed.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Route Delay", variant: "warning" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #d97706;">
            Line-Haul Delay Logged
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Transit delay registered on line-haul sector #${data.routeId}. Downstream hub arrival revised.
          </p>
          ${LogisticsBox(data)}
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: "dispatch@zoshlogistics.com" })}
        `,
      });
    },
  },

  // 5. Route Exception
  "logistics.route.exception": {
    templateKey: "logistics.route.exception",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.LOGISTICS,
    priority: EmailPriority.HIGH,
    subject: (data) => `[ROUTE EXCEPTION] Blockage on Delivery Sector: ${data.routeId || "Zone"}`,
    preheader: "Road blockage or extreme weather affecting deliveries.",
    render: (rawData) => {
      const data = formatDeliveryViewModel(rawData);
      return EmailLayout({
        title: "Route Exception",
        preheader: "Road blockage or extreme weather affecting deliveries.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Route Alert", variant: "danger" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #dc2626;">
            Delivery Route Blocked
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Local authority road closure or flood warning affecting route #${data.routeId}. All last-mile dispatches for this sector are paused.
          </p>
          ${LogisticsBox(data)}
          ${Button({ href: data.actionUrl, label: "Re-route Batches", variant: "danger" })}
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: "dispatch@zoshlogistics.com" })}
        `,
      });
    },
  },

  // 6. Undeliverable Shipment
  "logistics.shipment.undeliverable": {
    templateKey: "logistics.shipment.undeliverable",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.LOGISTICS,
    priority: EmailPriority.NORMAL,
    subject: (data) => `[RTO TRIGGERED] Shipment #${data.shipmentId || "SHP"} marked Return to Origin`,
    preheader: "Consignment failed max delivery attempts and is routed back to seller.",
    render: (rawData) => {
      const data = formatDeliveryViewModel(rawData);
      return EmailLayout({
        title: "RTO Triggered",
        preheader: "Consignment routed back to seller.",
        children: `
          ${EmailHeader({ roleBadge: { label: "RTO Initiated", variant: "danger" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #dc2626;">
            Return to Origin (RTO) Initiated
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Shipment #${data.shipmentId} exhausted 3 delivery attempts without buyer response. Parcel is sealed into reverse logistics bag for vendor return.
          </p>
          ${LogisticsBox(data)}
          ${Button({ href: data.actionUrl, label: "Track RTO Manifest" })}
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: "hubs@zoshlogistics.com" })}
        `,
      });
    },
  },
};
