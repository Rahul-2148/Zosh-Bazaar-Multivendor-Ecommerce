import {
  EmailLayout,
  EmailHeader,
  EmailFooter,
  Button,
} from "../shared/index.js";
import { EmailCategory, EmailPriority, EmailRecipientRole } from "../../core/email.types.js";
import { formatDeliveryViewModel } from "../../schemas/delivery.schema.js";
import { enIN } from "../../localization/en-IN/messages.js";

export const deliveryPartnerFinanceTemplates = {
  // 1. Weekly Earnings Statement
  "delivery_partner.finance.earnings_statement": {
    templateKey: "delivery_partner.finance.earnings_statement",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.DELIVERY_PARTNER,
    priority: EmailPriority.NORMAL,
    subject: (data) => `Weekly Delivery Earnings: ${enIN.formatCurrency(data.earningsAmount || 0)} 💰`,
    preheader: "Here is your detailed payout and incentive statement for the past week.",
    render: (rawData) => {
      const data = formatDeliveryViewModel(rawData);
      return EmailLayout({
        title: "Earnings Statement",
        preheader: "Here is your detailed payout and incentive statement.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Weekly Earnings", variant: "success" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a;" class="dark-text-main">
            Weekly Delivery Statement
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.partner.name}, your total delivery payout for the cycle is <strong>${enIN.formatCurrency(data.earningsAmount)}</strong> across ${data.stopsCount || 82} completed doorstep deliveries.
          </p>
          ${Button({ href: data.actionUrl, label: "View Statement in Partner App" })}
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: "finance@zoshlogistics.com" })}
        `,
      });
    },
  },

  // 2. Incentive Earned
  "delivery_partner.finance.incentive_earned": {
    templateKey: "delivery_partner.finance.incentive_earned",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.DELIVERY_PARTNER,
    priority: EmailPriority.NORMAL,
    subject: (data) => `Bonus Unlocked: You earned ${enIN.formatCurrency(data.earningsAmount || 500)} in delivery incentives! 🎯`,
    preheader: "Peak hour delivery target achieved. Bonus added to your weekly pay.",
    render: (rawData) => {
      const data = formatDeliveryViewModel(rawData);
      return EmailLayout({
        title: "Incentive Earned",
        preheader: "Peak hour delivery target achieved.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Bonus Unlocked", variant: "accent" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #16a34a;">
            Performance Bonus Achieved!
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Great work, ${data.partner.name}! You hit your weekend delivery targets and unlocked an additional <strong>${enIN.formatCurrency(data.earningsAmount || 500)}</strong> in incentives.
          </p>
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: "finance@zoshlogistics.com" })}
        `,
      });
    },
  },

  // 3. Payout Initiated
  "delivery_partner.finance.payout_initiated": {
    templateKey: "delivery_partner.finance.payout_initiated",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.DELIVERY_PARTNER,
    priority: EmailPriority.HIGH,
    subject: (data) => `Payout Transfer Initiated: ${enIN.formatCurrency(data.earningsAmount || 0)} 🏦`,
    preheader: "Weekly earnings sent to your UPI / Bank account.",
    render: (rawData) => {
      const data = formatDeliveryViewModel(rawData);
      return EmailLayout({
        title: "Payout Transfer",
        preheader: "Weekly earnings sent to your UPI / Bank account.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Transfer Initiated", variant: "info" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a;" class="dark-text-main">
            Weekly Payout Initiated
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.partner.name}, your earnings of <strong>${enIN.formatCurrency(data.earningsAmount)}</strong> were transferred via IMPS/UPI. Funds should appear in your balance within 2 hours.
          </p>
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: "finance@zoshlogistics.com" })}
        `,
      });
    },
  },

  // 4. Payout Completed
  "delivery_partner.finance.payout_completed": {
    templateKey: "delivery_partner.finance.payout_completed",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.DELIVERY_PARTNER,
    priority: EmailPriority.HIGH,
    subject: (data) => `Earnings Credited: ${enIN.formatCurrency(data.earningsAmount || 0)} transferred 🎉`,
    preheader: "Bank confirmation: Weekly delivery earnings credited successfully.",
    render: (rawData) => {
      const data = formatDeliveryViewModel(rawData);
      return EmailLayout({
        title: "Payout Completed",
        preheader: "Weekly delivery earnings credited successfully.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Credited", variant: "success" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #16a34a;">
            Earnings Successfully Deposited
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.partner.name}, your payout of <strong>${enIN.formatCurrency(data.earningsAmount)}</strong> has been settled by the clearing bank.
          </p>
          ${Button({ href: data.actionUrl, label: "Check Wallet Balance" })}
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: "finance@zoshlogistics.com" })}
        `,
      });
    },
  },

  // 5. Payout Failed
  "delivery_partner.finance.payout_failed": {
    templateKey: "delivery_partner.finance.payout_failed",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.DELIVERY_PARTNER,
    priority: EmailPriority.HIGH,
    subject: (data) => `Action Needed: Payout of ${enIN.formatCurrency(data.earningsAmount || 0)} failed ⚠️`,
    preheader: "UPI ID or Bank Account rejected by clearing gateway.",
    render: (rawData) => {
      const data = formatDeliveryViewModel(rawData);
      return EmailLayout({
        title: "Payout Failed",
        preheader: "UPI ID or Bank Account rejected by clearing gateway.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Payout Error", variant: "danger" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #dc2626;">
            Payment Transfer Returned
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.partner.name}, our bank could not credit your weekly earnings of ${enIN.formatCurrency(data.earningsAmount)}. Please update your registered UPI VPA or Bank Account in the partner app.
          </p>
          ${Button({ href: data.actionUrl, label: "Update Bank / UPI Details", variant: "danger", fullWidth: true })}
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: "finance@zoshlogistics.com" })}
        `,
      });
    },
  },

  // 6. License Expiring Notice
  "delivery_partner.compliance.document_expiry": {
    templateKey: "delivery_partner.compliance.document_expiry",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.DELIVERY_PARTNER,
    priority: EmailPriority.HIGH,
    subject: () => "Action Required: Driving License / Vehicle Insurance Expiring Soon ⚠️",
    preheader: "Upload your renewed document to keep receiving delivery orders.",
    render: (rawData) => {
      const data = formatDeliveryViewModel(rawData);
      return EmailLayout({
        title: "Document Expiry",
        preheader: "Upload your renewed document to keep receiving delivery orders.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Doc Renewal", variant: "warning" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #d97706;">
            Driving Document Expiring Soon
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.partner.name}, our records show your Driving License or Commercial Vehicle Insurance will expire within 15 days. Please upload renewed documents to avoid automatic shift deactivation.
          </p>
          ${Button({ href: data.actionUrl, label: "Upload Renewed Documents", fullWidth: true })}
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: "compliance@zoshlogistics.com" })}
        `,
      });
    },
  },
};
