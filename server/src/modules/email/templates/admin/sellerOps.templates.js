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
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background: #0f172a; border-radius: 8px; padding: 14px; margin: 16px 0; color: #f8fafc; font-family: monospace; font-size: 12px;">
      <tr><td style="color: #94a3b8; width: 120px; padding: 3px 0;">SEVERITY:</td><td style="color: #38bdf8; font-weight: bold;">${data.severity}</td></tr>
      <tr><td style="color: #94a3b8; padding: 3px 0;">TIMESTAMP:</td><td>${data.timestamp}</td></tr>
      <tr><td style="color: #94a3b8; padding: 3px 0;">MODULE:</td><td>${data.moduleName}</td></tr>
      <tr><td style="color: #94a3b8; padding: 3px 0;">SUMMARY:</td><td style="color: #cbd5e1;">${data.summary}</td></tr>
    </table>
  `;
}

export const adminSellerOpsTemplates = {
  // 1. New Seller Registration
  "admin.seller.new_registration": {
    templateKey: "admin.seller.new_registration",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.ADMIN,
    priority: EmailPriority.NORMAL,
    subject: (data) => `[SELLER OPS] New Merchant Registration: ${data.incidentTitle || "New Store"}`,
    preheader: "A new merchant has completed initial signup.",
    render: (rawData) => {
      const data = formatAdminViewModel(rawData);
      return EmailLayout({
        title: "New Merchant Registration",
        preheader: "A new merchant has completed initial signup.",
        children: `
          ${EmailHeader({ roleBadge: { label: "New Merchant", variant: "info" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a;" class="dark-text-main">
            New Merchant Registration Received
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            A new vendor registered on Zosh Bazaar and is awaiting onboarding document submission.
          </p>
          ${AdminAlertBox(data)}
          ${Button({ href: "http://localhost:5176/sellers", label: "Open Seller Manager" })}
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: "operations@zoshbazaar.com" })}
        `,
      });
    },
  },

  // 2. Seller Requires Review
  "admin.seller.requires_review": {
    templateKey: "admin.seller.requires_review",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.ADMIN,
    priority: EmailPriority.HIGH,
    subject: () => "[COMPLIANCE] High-Risk Merchant Flagged for Manual Review",
    preheader: "Automated risk filters flagged a merchant application.",
    render: (rawData) => {
      const data = formatAdminViewModel(rawData);
      return EmailLayout({
        title: "Merchant Review Required",
        preheader: "Automated risk filters flagged a merchant application.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Risk Flag", variant: "warning" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #d97706;">
            Manual Merchant Review Required
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            A seller application triggered automated KYC or anti-fraud flags and requires manual underwriter approval.
          </p>
          ${AdminAlertBox(data)}
          ${Button({ href: "http://localhost:5176/sellers/pending", label: "Perform Compliance Audit", variant: "primary" })}
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: "compliance@zoshbazaar.com" })}
        `,
      });
    },
  },

  // 3. Document Submitted
  "admin.seller.document_submitted": {
    templateKey: "admin.seller.document_submitted",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.ADMIN,
    priority: EmailPriority.NORMAL,
    subject: () => "[SELLER OPS] Merchant Documents Ready for Review",
    preheader: "Merchant has uploaded GSTIN and bank certificates.",
    render: (rawData) => {
      const data = formatAdminViewModel(rawData);
      return EmailLayout({
        title: "Documents Ready",
        preheader: "Merchant has uploaded GSTIN and bank certificates.",
        children: `
          ${EmailHeader({ roleBadge: { label: "KYC Upload", variant: "info" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a;" class="dark-text-main">
            Seller KYC Documents Uploaded
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            A merchant has submitted statutory tax documents. Please review and verify.
          </p>
          ${AdminAlertBox(data)}
          ${Button({ href: "http://localhost:5176/sellers/verification", label: "Review Documents" })}
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: "operations@zoshbazaar.com" })}
        `,
      });
    },
  },

  // 4. Document Rejected
  "admin.seller.document_rejected": {
    templateKey: "admin.seller.document_rejected",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.ADMIN,
    priority: EmailPriority.NORMAL,
    subject: () => "[AUDIT] Merchant Documents Rejected by Operations",
    preheader: "Documentation rejection logged in compliance audit log.",
    render: (rawData) => {
      const data = formatAdminViewModel(rawData);
      return EmailLayout({
        title: "Documents Rejected",
        preheader: "Documentation rejection logged in compliance audit log.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Docs Rejected", variant: "neutral" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a;" class="dark-text-main">
            Merchant Document Rejection Logged
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            An operations specialist marked seller verification files as rejected.
          </p>
          ${AdminAlertBox(data)}
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: "operations@zoshbazaar.com" })}
        `,
      });
    },
  },

  // 5. Suspension Request
  "admin.seller.suspension_request": {
    templateKey: "admin.seller.suspension_request",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.ADMIN,
    priority: EmailPriority.HIGH,
    subject: () => "[GOVERNANCE] Merchant Suspension Escalation",
    preheader: "A seller account has been recommended for immediate suspension.",
    render: (rawData) => {
      const data = formatAdminViewModel(rawData);
      return EmailLayout({
        title: "Suspension Escalation",
        preheader: "A seller account has been recommended for immediate suspension.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Suspension Escalation", variant: "danger" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #dc2626;">
            Seller Suspension Recommended
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Customer service or logistics teams escalated this merchant for chronic non-fulfillment or fraudulent listings.
          </p>
          ${AdminAlertBox(data)}
          ${Button({ href: data.dashboardUrl, label: "Authorize Suspension", variant: "danger" })}
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: "governance@zoshbazaar.com" })}
        `,
      });
    },
  },

  // 6. Reinstatement Request
  "admin.seller.reinstatement_request": {
    templateKey: "admin.seller.reinstatement_request",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.ADMIN,
    priority: EmailPriority.NORMAL,
    subject: () => "[GOVERNANCE] Seller Appeal / Reinstatement Review",
    preheader: "A suspended merchant has filed an official appeal.",
    render: (rawData) => {
      const data = formatAdminViewModel(rawData);
      return EmailLayout({
        title: "Reinstatement Appeal",
        preheader: "A suspended merchant has filed an official appeal.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Appeal Review", variant: "warning" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #d97706;">
            Merchant Reinstatement Appeal
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            A suspended vendor submitted a corrective action plan to request store reinstatement.
          </p>
          ${AdminAlertBox(data)}
          ${Button({ href: data.dashboardUrl, label: "Review Appeal Details" })}
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: "governance@zoshbazaar.com" })}
        `,
      });
    },
  },
};
