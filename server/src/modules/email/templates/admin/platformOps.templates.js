import {
  EmailLayout,
  EmailHeader,
  EmailFooter,
  Button,
} from "../shared/index.js";
import { EmailCategory, EmailPriority, EmailRecipientRole } from "../../core/email.types.js";
import { formatAdminViewModel } from "../../schemas/admin.schema.js";

function AdminMetricsBox(data) {
  return `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background: #0f172a; border-radius: 8px; padding: 16px; margin: 16px 0; color: #f8fafc; font-family: monospace; font-size: 12px;">
      <tr><td style="color: #94a3b8; width: 130px; padding: 3px 0;">SEVERITY:</td><td style="color: ${data.severity === "HIGH" || data.severity === "CRITICAL" ? "#ef4444" : "#f59e0b"}; font-weight: bold;">${data.severity}</td></tr>
      <tr><td style="color: #94a3b8; padding: 3px 0;">TIMESTAMP:</td><td>${data.timestamp}</td></tr>
      <tr><td style="color: #94a3b8; padding: 3px 0;">INCIDENT:</td><td style="color: #38bdf8; font-weight: bold;">${data.incidentTitle}</td></tr>
      <tr><td style="color: #94a3b8; padding: 3px 0;">IMPACT:</td><td style="color: #cbd5e1;">${data.impact}</td></tr>
      <tr><td style="color: #94a3b8; padding: 3px 0;">ACTION:</td><td style="color: #4ade80;">${data.recommendedAction}</td></tr>
    </table>
  `;
}

export const adminPlatformOpsTemplates = {
  // 1. High Value Order Alert
  "admin.operations.high_value_order": {
    templateKey: "admin.operations.high_value_order",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.ADMIN,
    priority: EmailPriority.HIGH,
    subject: () => `[HIGH VALUE ORDER] Order exceeding ₹50,000 detected 💎`,
    preheader: "High value order placed. Risk and inventory alert.",
    render: (rawData) => {
      const data = formatAdminViewModel(rawData);
      return EmailLayout({
        title: "High Value Order",
        preheader: "High value order placed. Risk and inventory alert.",
        children: `
          ${EmailHeader({ roleBadge: { label: "High Value", variant: "primary" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a;" class="dark-text-main">
            High Value Commercial Order
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            An order with gross commercial value exceeding ₹50,000 was captured on the marketplace.
          </p>
          ${AdminMetricsBox(data)}
          ${Button({ href: data.dashboardUrl, label: "View Order in Admin Console" })}
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: "finance-ops@zoshbazaar.com" })}
        `,
      });
    },
  },

  // 2. Payment Failure Spike
  "admin.operations.payment_failure_spike": {
    templateKey: "admin.operations.payment_failure_spike",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.ADMIN,
    priority: EmailPriority.HIGH,
    subject: () => "[ALERT] Payment Gateway Failure Spike (>15% in 15m) ⚠️",
    preheader: "Elevated transaction decline rate observed across gateway connections.",
    render: (rawData) => {
      const data = formatAdminViewModel(rawData);
      return EmailLayout({
        title: "Payment Spike Alert",
        preheader: "Elevated transaction decline rate observed across gateway connections.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Gateway Alert", variant: "danger" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #dc2626;">
            Payment Gateway Failure Spike
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Real-time telemetry detected an abnormal surge in failed payments on Razorpay / Bank clearing networks.
          </p>
          ${AdminMetricsBox(data)}
          ${Button({ href: data.dashboardUrl, label: "Inspect Gateway Telemetry", variant: "danger" })}
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: "engineering@zoshbazaar.com" })}
        `,
      });
    },
  },

  // 3. Order Failure Alert
  "admin.operations.order_failure_alert": {
    templateKey: "admin.operations.order_failure_alert",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.ADMIN,
    priority: EmailPriority.HIGH,
    subject: () => "[CRITICAL] Order Creation Pipeline Failure / Stock Contention",
    preheader: "Atomic stock deduction or order creation transaction failed.",
    render: (rawData) => {
      const data = formatAdminViewModel(rawData);
      return EmailLayout({
        title: "Order Pipeline Failure",
        preheader: "Atomic stock deduction or order creation transaction failed.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Pipeline Error", variant: "danger" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #dc2626;">
            Order Processing Pipeline Failure
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            An order transaction crashed during inventory deduction or MongoDB document creation.
          </p>
          ${AdminMetricsBox(data)}
          ${Button({ href: data.dashboardUrl, label: "Inspect Error Logs", variant: "danger" })}
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: "engineering@zoshbazaar.com" })}
        `,
      });
    },
  },

  // 4. Fulfillment Exception
  "admin.operations.fulfillment_exception": {
    templateKey: "admin.operations.fulfillment_exception",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.ADMIN,
    priority: EmailPriority.NORMAL,
    subject: () => "[OPERATIONS] Fulfillment Blocked: Unassigned Order Exception",
    preheader: "An order has remained without warehouse assignment for over 24 hours.",
    render: (rawData) => {
      const data = formatAdminViewModel(rawData);
      return EmailLayout({
        title: "Fulfillment Blocked",
        preheader: "An order has remained without warehouse assignment.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Fulfillment Blocked", variant: "warning" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #d97706;">
            Unassigned Fulfillment Exception
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Confirmed customer order has not been assigned to a logistics carrier or warehouse.
          </p>
          ${AdminMetricsBox(data)}
          ${Button({ href: data.dashboardUrl, label: "Assign Logistics Partner" })}
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: "logistics-ops@zoshbazaar.com" })}
        `,
      });
    },
  },

  // 5. Delivery SLA Breach
  "admin.operations.delivery_sla_breach": {
    templateKey: "admin.operations.delivery_sla_breach",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.ADMIN,
    priority: EmailPriority.HIGH,
    subject: () => "[SLA BREACH] Regional Delivery Breach Threshold Exceeded",
    preheader: "Delivery timeline SLAs have been breached across a major zone.",
    render: (rawData) => {
      const data = formatAdminViewModel(rawData);
      return EmailLayout({
        title: "SLA Breach Alert",
        preheader: "Delivery timeline SLAs have been breached across a major zone.",
        children: `
          ${EmailHeader({ roleBadge: { label: "SLA Breach", variant: "danger" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #dc2626;">
            Delivery SLA Breach Notice
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            More than 50 parcels missed promised delivery dates in a single logistics cluster.
          </p>
          ${AdminMetricsBox(data)}
          ${Button({ href: data.dashboardUrl, label: "Open Logistics Tower", variant: "danger" })}
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: "logistics-ops@zoshbazaar.com" })}
        `,
      });
    },
  },

  // 6. Large Cancellation Spike
  "admin.operations.cancellation_spike": {
    templateKey: "admin.operations.cancellation_spike",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.ADMIN,
    priority: EmailPriority.HIGH,
    subject: () => "[ALERT] Abnormal Order Cancellation Velocity Detected",
    preheader: "Spike in buyer-initiated or merchant-initiated cancellations.",
    render: (rawData) => {
      const data = formatAdminViewModel(rawData);
      return EmailLayout({
        title: "Cancellation Spike",
        preheader: "Spike in buyer-initiated or merchant-initiated cancellations.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Anomaly", variant: "warning" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #d97706;">
            Order Cancellation Velocity Spike
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            The platform cancellation index spiked significantly in the last hour.
          </p>
          ${AdminMetricsBox(data)}
          ${Button({ href: data.dashboardUrl, label: "View Cancellation Analytics" })}
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: "operations@zoshbazaar.com" })}
        `,
      });
    },
  },

  // 7. Refund Failure
  "admin.operations.refund_failure": {
    templateKey: "admin.operations.refund_failure",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.ADMIN,
    priority: EmailPriority.HIGH,
    subject: () => "[FINANCE] Automated Gateway Refund Execution Failed",
    preheader: "A programmatic customer refund returned an error code from gateway.",
    render: (rawData) => {
      const data = formatAdminViewModel(rawData);
      return EmailLayout({
        title: "Refund Failure",
        preheader: "A programmatic customer refund returned an error code.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Refund Error", variant: "danger" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #dc2626;">
            Automated Refund Execution Failure
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            A refund payout failed during programmatic gateway settlement. Manual accounting review required.
          </p>
          ${AdminMetricsBox(data)}
          ${Button({ href: data.dashboardUrl, label: "Open Finance Ledger", variant: "danger" })}
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: "finance@zoshbazaar.com" })}
        `,
      });
    },
  },

  // 8. Shipment Exception Spike
  "admin.operations.shipment_exception_spike": {
    templateKey: "admin.operations.shipment_exception_spike",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.ADMIN,
    priority: EmailPriority.HIGH,
    subject: () => "[LOGISTICS ALERT] High Exception Rate on Regional Trunk Line",
    preheader: "Surge in damaged or misrouted parcels reported by transit hubs.",
    render: (rawData) => {
      const data = formatAdminViewModel(rawData);
      return EmailLayout({
        title: "Exception Spike",
        preheader: "Surge in damaged or misrouted parcels reported by transit hubs.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Carrier Exception", variant: "danger" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #dc2626;">
            Shipment Exception Spike
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hub telemetry reported an uncharacteristic rise in damaged labels, lost parcels, or route exceptions.
          </p>
          ${AdminMetricsBox(data)}
          ${Button({ href: data.dashboardUrl, label: "Review Exception Queue", variant: "danger" })}
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: "logistics-ops@zoshbazaar.com" })}
        `,
      });
    },
  },
};
