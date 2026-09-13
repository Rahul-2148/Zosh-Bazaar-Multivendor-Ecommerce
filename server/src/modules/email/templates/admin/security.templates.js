import {
  EmailLayout,
  EmailHeader,
  EmailFooter,
  Button,
} from "../shared/index.js";
import { EmailCategory, EmailPriority, EmailRecipientRole } from "../../core/email.types.js";
import { formatAdminViewModel } from "../../schemas/admin.schema.js";

function AdminAlertBox(data) {
  return `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background: #0f172a; border-radius: 8px; padding: 16px; margin: 16px 0; color: #f8fafc; font-family: monospace; font-size: 12px;">
      <tr><td style="color: #94a3b8; width: 120px; padding: 3px 0;">SEVERITY:</td><td style="color: ${data.severity === "CRITICAL" ? "#ef4444" : "#f59e0b"}; font-weight: bold;">${data.severity}</td></tr>
      <tr><td style="color: #94a3b8; padding: 3px 0;">TIMESTAMP:</td><td>${data.timestamp}</td></tr>
      <tr><td style="color: #94a3b8; padding: 3px 0;">MODULE:</td><td>${data.moduleName}</td></tr>
      ${data.affectedIds?.length ? `<tr><td style="color: #94a3b8; padding: 3px 0;">AFFECTED IDS:</td><td>${data.affectedIds.join(", ")}</td></tr>` : ""}
      <tr><td style="color: #94a3b8; padding: 3px 0;">IMPACT:</td><td style="color: #cbd5e1;">${data.impact}</td></tr>
      <tr><td style="color: #94a3b8; padding: 3px 0;">ACTION:</td><td style="color: #38bdf8;">${data.recommendedAction}</td></tr>
    </table>
  `;
}

export const adminSecurityTemplates = {
  // 1. Admin Login Alert
  "admin.security.login_alert": {
    templateKey: "admin.security.login_alert",
    category: EmailCategory.SECURITY,
    recipientRole: EmailRecipientRole.ADMIN,
    priority: EmailPriority.HIGH,
    subject: (data) => `[SECURITY] Admin Console Login: ${data.incidentTitle || "New Session"}`,
    preheader: "An administrative user session was established.",
    render: (rawData) => {
      const data = formatAdminViewModel(rawData);
      return EmailLayout({
        title: "Admin Security Alert",
        preheader: "An administrative user session was established.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Admin Security", variant: "warning" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a;" class="dark-text-main">
            Admin Console Access Logged
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            An administrator authenticated to the Zosh Bazaar Control Tower.
          </p>
          ${AdminAlertBox(data)}
          ${Button({ href: data.dashboardUrl, label: "View Active Admin Sessions" })}
          ${EmailFooter({ category: EmailCategory.SECURITY, recipientEmail: "security@zoshbazaar.com" })}
        `,
      });
    },
  },

  // 2. New Admin Session
  "admin.security.new_session": {
    templateKey: "admin.security.new_session",
    category: EmailCategory.SECURITY,
    recipientRole: EmailRecipientRole.ADMIN,
    priority: EmailPriority.HIGH,
    subject: () => "[SECURITY] New Admin Session Created from Unrecognized IP",
    preheader: "Access detected from outside company VPN or new subnet.",
    render: (rawData) => {
      const data = formatAdminViewModel(rawData);
      return EmailLayout({
        title: "New Admin Session",
        preheader: "Access detected from outside company VPN.",
        children: `
          ${EmailHeader({ roleBadge: { label: "New Session", variant: "danger" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #dc2626;">
            Unrecognized Subnet Login
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            An admin session was initiated from an IP address not present in our authorized IP allowlist.
          </p>
          ${AdminAlertBox(data)}
          ${Button({ href: data.dashboardUrl, label: "Revoke Session Immediately", variant: "danger" })}
          ${EmailFooter({ category: EmailCategory.SECURITY, recipientEmail: "security@zoshbazaar.com" })}
        `,
      });
    },
  },

  // 3. Suspicious Login
  "admin.security.suspicious_login": {
    templateKey: "admin.security.suspicious_login",
    category: EmailCategory.SECURITY,
    recipientRole: EmailRecipientRole.ADMIN,
    priority: EmailPriority.IMMEDIATE,
    subject: () => "[CRITICAL] Brute force attack detected on Admin Gateway",
    preheader: "Multiple automated login attempts blocked by rate limiting.",
    render: (rawData) => {
      const data = formatAdminViewModel(rawData);
      return EmailLayout({
        title: "Critical Security Alert",
        preheader: "Multiple automated login attempts blocked by rate limiting.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Brute Force", variant: "danger" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #dc2626;">
            Automated Attack Blocked
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            The perimeter security layer detected high-frequency login failures targeting administrative endpoints.
          </p>
          ${AdminAlertBox(data)}
          ${Button({ href: data.dashboardUrl, label: "Open Firewall & Security Center", variant: "danger" })}
          ${EmailFooter({ category: EmailCategory.SECURITY, recipientEmail: "security@zoshbazaar.com" })}
        `,
      });
    },
  },

  // 4. Password Changed
  "admin.security.password_changed": {
    templateKey: "admin.security.password_changed",
    category: EmailCategory.SECURITY,
    recipientRole: EmailRecipientRole.ADMIN,
    priority: EmailPriority.HIGH,
    subject: () => "[SECURITY] Admin Credential Rotation Complete",
    preheader: "An administrative user password was updated.",
    render: (rawData) => {
      const data = formatAdminViewModel(rawData);
      return EmailLayout({
        title: "Admin Password Changed",
        preheader: "An administrative user password was updated.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Credential Update", variant: "info" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a;" class="dark-text-main">
            Admin Password Changed
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            An administrator account password has been rotated.
          </p>
          ${AdminAlertBox(data)}
          ${EmailFooter({ category: EmailCategory.SECURITY, recipientEmail: "security@zoshbazaar.com" })}
        `,
      });
    },
  },

  // 5. Role Changed
  "admin.security.role_changed": {
    templateKey: "admin.security.role_changed",
    category: EmailCategory.SECURITY,
    recipientRole: EmailRecipientRole.ADMIN,
    priority: EmailPriority.HIGH,
    subject: () => "[AUDIT] Admin RBAC Role Modified",
    preheader: "User permissions were altered in role assignment matrix.",
    render: (rawData) => {
      const data = formatAdminViewModel(rawData);
      return EmailLayout({
        title: "Role Modified",
        preheader: "User permissions were altered in role assignment matrix.",
        children: `
          ${EmailHeader({ roleBadge: { label: "RBAC Change", variant: "warning" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a;" class="dark-text-main">
            RBAC Role Modified
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Role definitions or access groups were modified for an administrative member.
          </p>
          ${AdminAlertBox(data)}
          ${Button({ href: data.dashboardUrl, label: "Review Access Logs" })}
          ${EmailFooter({ category: EmailCategory.SECURITY, recipientEmail: "security@zoshbazaar.com" })}
        `,
      });
    },
  },

  // 6. Access Revoked
  "admin.security.access_revoked": {
    templateKey: "admin.security.access_revoked",
    category: EmailCategory.SECURITY,
    recipientRole: EmailRecipientRole.ADMIN,
    priority: EmailPriority.HIGH,
    subject: () => "[AUDIT] Admin Access Revoked / Account De-provisioned",
    preheader: "An administrative user account was disabled.",
    render: (rawData) => {
      const data = formatAdminViewModel(rawData);
      return EmailLayout({
        title: "Access Revoked",
        preheader: "An administrative user account was disabled.",
        children: `
          ${EmailHeader({ roleBadge: { label: "De-provisioned", variant: "danger" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #dc2626;">
            Admin Access Revoked
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Access keys and tokens for this admin account have been invalidated across all control systems.
          </p>
          ${AdminAlertBox(data)}
          ${EmailFooter({ category: EmailCategory.SECURITY, recipientEmail: "security@zoshbazaar.com" })}
        `,
      });
    },
  },

  // 7. Privilege Escalation
  "admin.security.privilege_escalation": {
    templateKey: "admin.security.privilege_escalation",
    category: EmailCategory.SECURITY,
    recipientRole: EmailRecipientRole.ADMIN,
    priority: EmailPriority.IMMEDIATE,
    subject: () => "[CRITICAL] Privilege Escalation Detected: SUPER_ADMIN Assigned 🚨",
    preheader: "SUPER_ADMIN privileges were granted to an internal user.",
    render: (rawData) => {
      const data = formatAdminViewModel(rawData);
      return EmailLayout({
        title: "Privilege Escalation",
        preheader: "SUPER_ADMIN privileges were granted to an internal user.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Super Admin Assigned", variant: "danger" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #dc2626;">
            Privilege Escalation Event
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            An administrator account was elevated to SUPER_ADMIN. Verify that this change was authorized by executive leadership.
          </p>
          ${AdminAlertBox(data)}
          ${Button({ href: data.dashboardUrl, label: "Verify Authorization", variant: "danger" })}
          ${EmailFooter({ category: EmailCategory.SECURITY, recipientEmail: "security@zoshbazaar.com" })}
        `,
      });
    },
  },
};
