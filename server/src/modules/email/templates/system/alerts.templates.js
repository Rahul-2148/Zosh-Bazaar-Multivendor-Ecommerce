import {
  EmailLayout,
  EmailHeader,
  EmailFooter,
  Button,
} from "../shared/index.js";
import { EmailCategory, EmailPriority, EmailRecipientRole } from "../../core/email.types.js";
import { formatAdminViewModel } from "../../schemas/admin.schema.js";

function SystemAlertBox(data) {
  return `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background: #0f172a; border-radius: 8px; padding: 16px; margin: 16px 0; color: #f8fafc; font-family: monospace; font-size: 12px;">
      <tr><td style="color: #94a3b8; width: 120px; padding: 3px 0;">SEVERITY:</td><td style="color: #ef4444; font-weight: bold;">CRITICAL</td></tr>
      <tr><td style="color: #94a3b8; padding: 3px 0;">TIMESTAMP:</td><td>${data.timestamp}</td></tr>
      <tr><td style="color: #94a3b8; padding: 3px 0;">SUBSYSTEM:</td><td style="color: #38bdf8;">${data.moduleName}</td></tr>
      <tr><td style="color: #94a3b8; padding: 3px 0;">DIAGNOSTIC:</td><td style="color: #cbd5e1;">${data.summary}</td></tr>
      <tr><td style="color: #94a3b8; padding: 3px 0;">RUNBOOK:</td><td style="color: #4ade80;">${data.recommendedAction}</td></tr>
    </table>
  `;
}

export const systemAlertTemplates = {
  // 1. Critical Service Outage
  "system.alert.service_failure": {
    templateKey: "system.alert.service_failure",
    category: EmailCategory.SECURITY,
    recipientRole: EmailRecipientRole.SYSTEM,
    priority: EmailPriority.IMMEDIATE,
    subject: (data) => `[CRITICAL OUTAGE] ${data.moduleName || "API Gateway"} Healthcheck Failed 🚨`,
    preheader: "Production core service health check returned non-200 response.",
    render: (rawData) => {
      const data = formatAdminViewModel(rawData);
      return EmailLayout({
        title: "Service Outage",
        preheader: "Production core service health check returned non-200 response.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Critical Outage", variant: "danger" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #dc2626;">
            Service Healthcheck Failure
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Automated cluster heartbeat probes failed on production infrastructure. PagerDuty and on-call SRE paged.
          </p>
          ${SystemAlertBox(data)}
          ${Button({ href: data.dashboardUrl, label: "Open Observability Dashboard", variant: "danger" })}
          ${EmailFooter({ category: EmailCategory.SECURITY, recipientEmail: "sre@zoshbazaar.com" })}
        `,
      });
    },
  },

  // 2. Email Queue Backlog Alert
  "system.alert.email_backlog": {
    templateKey: "system.alert.email_backlog",
    category: EmailCategory.SECURITY,
    recipientRole: EmailRecipientRole.SYSTEM,
    priority: EmailPriority.HIGH,
    subject: () => "[ALERT] Transactional Email Queue Backlog Stalled (>500 items) ⚠️",
    preheader: "Email worker throughput degraded or SMTP rate limit hit.",
    render: (rawData) => {
      const data = formatAdminViewModel(rawData);
      return EmailLayout({
        title: "Email Queue Backlog",
        preheader: "Email worker throughput degraded.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Queue Stalled", variant: "warning" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #d97706;">
            Email Queue Backlog Alert
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            The asynchronous email job queue has accumulated more than 500 unprocessed notification events. Check SMTP provider connectivity and worker thread health.
          </p>
          ${SystemAlertBox(data)}
          ${Button({ href: data.dashboardUrl, label: "View Email Queue Metrics" })}
          ${EmailFooter({ category: EmailCategory.SECURITY, recipientEmail: "sre@zoshbazaar.com" })}
        `,
      });
    },
  },

  // 3. Razorpay Gateway Incident
  "system.alert.payment_gateway_incident": {
    templateKey: "system.alert.payment_gateway_incident",
    category: EmailCategory.SECURITY,
    recipientRole: EmailRecipientRole.SYSTEM,
    priority: EmailPriority.IMMEDIATE,
    subject: () => "[PAYMENT GATEWAY] Razorpay API Latency / Connectivity Degraded",
    preheader: "Payment gateway responses exceeding 8000ms latency threshold.",
    render: (rawData) => {
      const data = formatAdminViewModel(rawData);
      return EmailLayout({
        title: "Gateway Degraded",
        preheader: "Payment gateway responses exceeding latency threshold.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Payment Degraded", variant: "danger" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #dc2626;">
            Payment Gateway Latency Spike
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Gateway API calls are timing out or returning HTTP 504 errors. Checkout conversion may be impaired.
          </p>
          ${SystemAlertBox(data)}
          ${Button({ href: data.dashboardUrl, label: "Check Payment Routes", variant: "danger" })}
          ${EmailFooter({ category: EmailCategory.SECURITY, recipientEmail: "sre@zoshbazaar.com" })}
        `,
      });
    },
  },

  // 4. Inventory Sync Failure
  "system.alert.inventory_sync_failure": {
    templateKey: "system.alert.inventory_sync_failure",
    category: EmailCategory.SECURITY,
    recipientRole: EmailRecipientRole.SYSTEM,
    priority: EmailPriority.HIGH,
    subject: () => "[INVENTORY ANOMALY] Multi-warehouse Inventory Sync Mismatch",
    preheader: "Discrepancy detected between MongoDB countInStock and variant totals.",
    render: (rawData) => {
      const data = formatAdminViewModel(rawData);
      return EmailLayout({
        title: "Inventory Desync",
        preheader: "Discrepancy detected in stock accounting.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Data Mismatch", variant: "warning" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #d97706;">
            Inventory Reconciliation Discrepancy
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Automated database integrity verification detected inconsistent stock counts between product parent documents and variant arrays.
          </p>
          ${SystemAlertBox(data)}
          ${Button({ href: data.dashboardUrl, label: "Run Catalog Sync Script" })}
          ${EmailFooter({ category: EmailCategory.SECURITY, recipientEmail: "engineering@zoshbazaar.com" })}
        `,
      });
    },
  },

  // 5. Realtime Socket Failure
  "system.alert.realtime_socket_failure": {
    templateKey: "system.alert.realtime_socket_failure",
    category: EmailCategory.SECURITY,
    recipientRole: EmailRecipientRole.SYSTEM,
    priority: EmailPriority.HIGH,
    subject: () => "[REALTIME ALERT] Socket.io Cluster Connection Drop Detected",
    preheader: "Real-time client order notifications experiencing connection drops.",
    render: (rawData) => {
      const data = formatAdminViewModel(rawData);
      return EmailLayout({
        title: "Socket Alert",
        preheader: "Socket.io cluster connection drop detected.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Websocket Drop", variant: "danger" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #dc2626;">
            Socket Cluster Health Warning
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Realtime WebSocket heartbeat dropped on port 5000 cluster instances. Realtime vendor alerts may be failing over to polling.
          </p>
          ${SystemAlertBox(data)}
          ${Button({ href: data.dashboardUrl, label: "Inspect Socket Cluster" })}
          ${EmailFooter({ category: EmailCategory.SECURITY, recipientEmail: "sre@zoshbazaar.com" })}
        `,
      });
    },
  },

  // 6. Database Alert
  "system.alert.database_alert": {
    templateKey: "system.alert.database_alert",
    category: EmailCategory.SECURITY,
    recipientRole: EmailRecipientRole.SYSTEM,
    priority: EmailPriority.IMMEDIATE,
    subject: () => "[CRITICAL] MongoDB Connection Pool Saturation (>85%) 🚨",
    preheader: "Database connection pool exhausted on backend nodes.",
    render: (rawData) => {
      const data = formatAdminViewModel(rawData);
      return EmailLayout({
        title: "Database Alert",
        preheader: "Database connection pool exhausted.",
        children: `
          ${EmailHeader({ roleBadge: { label: "DB Saturated", variant: "danger" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #dc2626;">
            Database Connection Pool Critical
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Mongoose connection pool has reached critical saturation. Unindexed aggregation queries or connection leaks may be starving worker threads.
          </p>
          ${SystemAlertBox(data)}
          ${Button({ href: data.dashboardUrl, label: "Inspect Database Metrics", variant: "danger" })}
          ${EmailFooter({ category: EmailCategory.SECURITY, recipientEmail: "dba@zoshbazaar.com" })}
        `,
      });
    },
  },

  // 7. Scheduled Job Failure
  "system.alert.scheduled_job_failure": {
    templateKey: "system.alert.scheduled_job_failure",
    category: EmailCategory.SECURITY,
    recipientRole: EmailRecipientRole.SYSTEM,
    priority: EmailPriority.HIGH,
    subject: (data) => `[CRON FAILURE] Scheduled Job Failed: ${data.moduleName || "Nightly Worker"}`,
    preheader: "Background worker cron crashed or timed out.",
    render: (rawData) => {
      const data = formatAdminViewModel(rawData);
      return EmailLayout({
        title: "Cron Failure",
        preheader: "Background worker cron crashed.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Cron Failed", variant: "warning" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #d97706;">
            Scheduled Task Error
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            The scheduled batch job for ${data.moduleName} exited with a non-zero status or unhandled promise rejection.
          </p>
          ${SystemAlertBox(data)}
          ${Button({ href: data.dashboardUrl, label: "View Task Logs" })}
          ${EmailFooter({ category: EmailCategory.SECURITY, recipientEmail: "engineering@zoshbazaar.com" })}
        `,
      });
    },
  },
};
