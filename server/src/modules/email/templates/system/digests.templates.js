import {
  EmailLayout,
  EmailHeader,
  EmailFooter,
  Button,
  Card,
} from "../shared/index.js";
import { EmailCategory, EmailPriority, EmailRecipientRole } from "../../core/email.types.js";
import { formatAdminViewModel } from "../../schemas/admin.schema.js";

export const systemDigestsTemplates = {
  // 1. Incident Post-Mortem Report
  "system.incident.report": {
    templateKey: "system.incident.report",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.SYSTEM,
    priority: EmailPriority.HIGH,
    subject: (data) => `[POST-MORTEM] Incident Report: ${data.incidentTitle || "System Incident"}`,
    preheader: "Root cause analysis, impact assessment, and corrective action items.",
    render: (rawData) => {
      const data = formatAdminViewModel(rawData);
      return EmailLayout({
        title: "Incident Report",
        preheader: "Root cause analysis and corrective action items.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Post-Mortem", variant: "info" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a;" class="dark-text-main">
            Incident Retrospective & Action Plan
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            The engineering retrospective for incident <strong>"${data.incidentTitle}"</strong> has been published.
          </p>
          ${Card({
            children: `
              <div style="font-size: 13px; color: #475569; line-height: 1.6;">
                <strong>Incident Summary:</strong> ${data.summary}<br />
                <strong>Customer Impact:</strong> ${data.impact}<br />
                <strong>Remediation:</strong> ${data.recommendedAction}
              </div>
            `,
          })}
          ${Button({ href: data.dashboardUrl, label: "Read Full Post-Mortem Doc" })}
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: "engineering@zoshbazaar.com" })}
        `,
      });
    },
  },

  // 2. Platform Executive Daily Digest
  "system.digest.daily_executive": {
    templateKey: "system.digest.daily_executive",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.ADMIN,
    priority: EmailPriority.LOW,
    subject: () => "Zosh Bazaar Platform Daily Executive Digest 📈",
    preheader: "Executive summary of marketplace GMV, orders, active sellers, and fulfillment.",
    render: (rawData) => {
      const _data = formatAdminViewModel(rawData);
      return EmailLayout({
        title: "Executive Digest",
        preheader: "Executive summary of marketplace GMV, orders, active sellers, and fulfillment.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Daily Executive", variant: "primary" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a;" class="dark-text-main">
            Platform 24-Hour Executive Digest
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Executive overview of key marketplace transactions and platform operations over the past 24 hours:
          </p>
          ${Card({
            children: `
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 13px; line-height: 1.8;">
                <tr><td style="color: #64748b;">Gross Merchandise Value (GMV):</td><td style="text-align: right; font-weight: 800; color: #16a34a;">₹4,28,950</td></tr>
                <tr><td style="color: #64748b;">Total Orders Captured:</td><td style="text-align: right; font-weight: bold;">382 orders</td></tr>
                <tr><td style="color: #64748b;">Active Sellers Dispatched:</td><td style="text-align: right; font-weight: bold;">64 merchants</td></tr>
                <tr><td style="color: #64748b;">Doorstep Delivery Success:</td><td style="text-align: right; font-weight: bold; color: #2563eb;">98.2%</td></tr>
              </table>
            `,
          })}
          ${Button({ href: "http://localhost:5176/dashboard", label: "Open Executive BI Dashboard" })}
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: "leadership@zoshbazaar.com" })}
        `,
      });
    },
  },

  // 3. Scheduled Maintenance Notice
  "system.maintenance.scheduled": {
    templateKey: "system.maintenance.scheduled",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.SYSTEM,
    priority: EmailPriority.NORMAL,
    subject: () => "NOTICE: Scheduled Platform Maintenance Window",
    preheader: "Planned database cluster upgrade scheduled for tonight 02:00 AM - 03:30 AM IST.",
    render: (rawData) => {
      const _data = formatAdminViewModel(rawData);
      return EmailLayout({
        title: "Maintenance Notice",
        preheader: "Planned database cluster upgrade scheduled.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Maintenance", variant: "warning" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #d97706;">
            Planned Infrastructure Maintenance
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            The platform engineering team will perform rolling maintenance on primary database clusters tonight between <strong>02:00 AM and 03:30 AM IST</strong>.
          </p>
          <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 14px; margin: 16px 0; font-size: 13px; color: #92400e;">
            Brief checkout and seller console latency (under 60 seconds) may occur during primary master failover.
          </div>
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: "ops@zoshbazaar.com" })}
        `,
      });
    },
  },
};
