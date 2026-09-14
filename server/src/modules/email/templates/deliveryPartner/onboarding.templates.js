import {
  EmailLayout,
  EmailHeader,
  EmailFooter,
  Button,
} from "../shared/index.js";
import { EmailCategory, EmailPriority, EmailRecipientRole } from "../../core/email.types.js";
import { formatDeliveryViewModel } from "../../schemas/delivery.schema.js";

function PartnerBox(data) {
  return `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="email-card dark-border" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin: 14px 0; border-collapse: separate !important;">
      <tr>
        <td style="padding: 14px 18px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 13px; border-collapse: collapse;">
            <tr><td style="color: #64748b; width: 120px; padding: 3px 0;" class="dark-text-muted">Agent ID:</td><td style="font-weight: bold; font-family: monospace; padding: 3px 0;" class="dark-text-main">${data.partner.agentId || "ZDP-9988"}</td></tr>
            <tr><td style="color: #64748b; padding: 3px 0;" class="dark-text-muted">Base Hub:</td><td style="font-weight: bold; padding: 3px 0;" class="dark-text-main">${data.hubName}</td></tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

export const deliveryPartnerOnboardingTemplates = {
  // 1. Welcome to Network
  "delivery_partner.onboarding.welcome": {
    templateKey: "delivery_partner.onboarding.welcome",
    category: EmailCategory.TRANSACTIONAL,
    recipientRole: EmailRecipientRole.DELIVERY_PARTNER,
    priority: EmailPriority.HIGH,
    subject: () => "Welcome to Zosh Logistics Delivery Network! 🛵",
    preheader: "Your partner registration is received. Next: upload driving credentials.",
    render: (rawData) => {
      const data = formatDeliveryViewModel(rawData);
      return EmailLayout({
        title: "Partner Registration",
        preheader: "Your partner registration is received.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Delivery Partner", variant: "info" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a;" class="dark-text-main">
            Welcome to the Fleet, ${data.partner.name}!
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Thank you for registering as an independent delivery associate with Zosh Logistics. Complete your vehicle and driving license upload to begin receiving delivery shifts.
          </p>
          ${Button({ href: data.actionUrl, label: "Upload Driving License", fullWidth: true })}
          ${EmailFooter({ category: EmailCategory.TRANSACTIONAL, recipientEmail: "partners@zoshlogistics.com" })}
        `,
      });
    },
  },

  // 2. Document Verification
  "delivery_partner.onboarding.verification": {
    templateKey: "delivery_partner.onboarding.verification",
    category: EmailCategory.TRANSACTIONAL,
    recipientRole: EmailRecipientRole.DELIVERY_PARTNER,
    priority: EmailPriority.NORMAL,
    subject: () => "Partner Credentials Under Verification",
    preheader: "Our background screening team is checking your driving documents.",
    render: (rawData) => {
      const data = formatDeliveryViewModel(rawData);
      return EmailLayout({
        title: "Credentials Verification",
        preheader: "Our background screening team is checking your driving documents.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Screening", variant: "warning" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a;" class="dark-text-main">
            Screening In Progress
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.partner.name}, our team is verifying your Driving License, RC Book, and Identity records.
          </p>
          ${PartnerBox(data)}
          ${EmailFooter({ category: EmailCategory.TRANSACTIONAL, recipientEmail: "partners@zoshlogistics.com" })}
        `,
      });
    },
  },

  // 3. Account Approved
  "delivery_partner.onboarding.approved": {
    templateKey: "delivery_partner.onboarding.approved",
    category: EmailCategory.TRANSACTIONAL,
    recipientRole: EmailRecipientRole.DELIVERY_PARTNER,
    priority: EmailPriority.HIGH,
    subject: () => "Approved! You can now accept deliveries with Zosh Logistics 🎉",
    preheader: "Your partner profile is verified. Log in to reserve your delivery slots.",
    render: (rawData) => {
      const data = formatDeliveryViewModel(rawData);
      return EmailLayout({
        title: "Partner Approved",
        preheader: "Your partner profile is verified.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Approved", variant: "success" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #16a34a;">
            Partner Account Activated!
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.partner.name}, your partner account has been fully approved. You are authorized to accept last-mile delivery runs from ${data.hubName}.
          </p>
          ${PartnerBox(data)}
          ${Button({ href: data.actionUrl, label: "Open Partner App & Go Online", fullWidth: true })}
          ${EmailFooter({ category: EmailCategory.TRANSACTIONAL, recipientEmail: "partners@zoshlogistics.com" })}
        `,
      });
    },
  },

  // 4. Account Rejected
  "delivery_partner.onboarding.rejected": {
    templateKey: "delivery_partner.onboarding.rejected",
    category: EmailCategory.TRANSACTIONAL,
    recipientRole: EmailRecipientRole.DELIVERY_PARTNER,
    priority: EmailPriority.HIGH,
    subject: () => "Update on your Zosh Logistics partner application",
    preheader: "Your application could not be approved at this time.",
    render: (rawData) => {
      const data = formatDeliveryViewModel(rawData);
      return EmailLayout({
        title: "Partner Application",
        preheader: "Your application could not be approved at this time.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Not Approved", variant: "danger" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #dc2626;">
            Application Unsuccessful
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.partner.name}, your application could not be approved due to document validation criteria or hub quota constraints.
          </p>
          ${EmailFooter({ category: EmailCategory.TRANSACTIONAL, recipientEmail: "partners@zoshlogistics.com" })}
        `,
      });
    },
  },

  // 5. Compliance Warning
  "delivery_partner.compliance.warning": {
    templateKey: "delivery_partner.compliance.warning",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.DELIVERY_PARTNER,
    priority: EmailPriority.HIGH,
    subject: () => "NOTICE: Delivery SLA & Customer Handover Compliance Warning",
    preheader: "Repeated customer complaints or OTP bypass flagged.",
    render: (rawData) => {
      const data = formatDeliveryViewModel(rawData);
      return EmailLayout({
        title: "Compliance Notice",
        preheader: "Repeated customer complaints or OTP bypass flagged.",
        children: `
          ${EmailHeader({ roleBadge: { label: "SLA Warning", variant: "warning" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #d97706;">
            Service Quality Notice
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.partner.name}, our dispatch supervisors noted missed delivery appointments or irregular handover scans associated with Agent ID: <strong>${data.partner.agentId}</strong>.
          </p>
          ${Button({ href: data.actionUrl, label: "Review Service Guidelines" })}
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: "partners@zoshlogistics.com" })}
        `,
      });
    },
  },
};
