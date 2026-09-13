import {
  EmailLayout,
  EmailHeader,
  EmailFooter,
  Button,
} from "../shared/index.js";
import { EmailCategory, EmailPriority, EmailRecipientRole } from "../../core/email.types.js";
import { formatSellerViewModel } from "../../schemas/seller.schema.js";
import { enIN } from "../../localization/en-IN/messages.js";

export const sellerFinanceTemplates = {
  // 1. Payment Captured
  "seller.finance.payment_captured": {
    templateKey: "seller.finance.payment_captured",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.SELLER,
    priority: EmailPriority.NORMAL,
    subject: (data) => `Payment Captured: ${enIN.formatCurrency(data.amount || 0)} for order #${data.orderId || "ZB"}`,
    preheader: "Customer payment secured in marketplace escrow.",
    render: (rawData) => {
      const data = formatSellerViewModel(rawData);
      return EmailLayout({
        title: "Payment Captured",
        preheader: "Customer payment secured in marketplace escrow.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Escrow Captured", variant: "success" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #16a34a;">
            Customer Funds Secured
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.seller.sellerName}, payment of <strong>${enIN.formatCurrency(data.amount)}</strong> for order #${data.orderId} is confirmed and held in escrow pending delivery handover.
          </p>
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: data.seller.email })}
        `,
      });
    },
  },

  // 2. Settlement Generated
  "seller.finance.settlement_generated": {
    templateKey: "seller.finance.settlement_generated",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.SELLER,
    priority: EmailPriority.NORMAL,
    subject: (data) => `Settlement Statement Generated: #${data.payoutId || "SETTLE-01"}`,
    preheader: "Your periodic merchant payout summary is available for review.",
    render: (rawData) => {
      const data = formatSellerViewModel(rawData);
      return EmailLayout({
        title: `Settlement #${data.payoutId}`,
        preheader: "Your periodic merchant payout summary is available.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Settlement", variant: "info" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a;" class="dark-text-main">
            Settlement Statement Ready
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.seller.sellerName}, your settlement report for cycle #${data.payoutId} has been generated. Net payable: <strong>${enIN.formatCurrency(data.amount)}</strong>.
          </p>
          ${Button({ href: "http://localhost:5175/finances", label: "Download Settlement PDF" })}
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: data.seller.email })}
        `,
      });
    },
  },

  // 3. Payout Initiated
  "seller.finance.payout_initiated": {
    templateKey: "seller.finance.payout_initiated",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.SELLER,
    priority: EmailPriority.HIGH,
    subject: (data) => `Payout Initiated: ${enIN.formatCurrency(data.amount || 0)} transferred to your bank 🏦`,
    preheader: "Bank transfer initiated for your merchant earnings.",
    render: (rawData) => {
      const data = formatSellerViewModel(rawData);
      return EmailLayout({
        title: "Payout Initiated",
        preheader: "Bank transfer initiated for your merchant earnings.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Payout In Progress", variant: "info" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a;" class="dark-text-main">
            Bank Transfer Initiated
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.seller.sellerName}, a payout of <strong>${enIN.formatCurrency(data.amount)}</strong> has been initiated to your bank account ending in ${data.bankAccountMasked}.
          </p>
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: data.seller.email })}
        `,
      });
    },
  },

  // 4. Payout Completed
  "seller.finance.payout_completed": {
    templateKey: "seller.finance.payout_completed",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.SELLER,
    priority: EmailPriority.HIGH,
    subject: (data) => `Payout Successful: ${enIN.formatCurrency(data.amount || 0)} credited to bank account 🎉`,
    preheader: "Your merchant earnings have been successfully credited.",
    render: (rawData) => {
      const data = formatSellerViewModel(rawData);
      return EmailLayout({
        title: "Payout Complete",
        preheader: "Your merchant earnings have been successfully credited.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Payout Credited", variant: "success" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #16a34a;">
            Payout Deposited Successfully
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.seller.sellerName}, <strong>${enIN.formatCurrency(data.amount)}</strong> has been credited to your bank account.
            ${data.payoutId ? `<br /><strong>UTR / Reference ID:</strong> ${data.payoutId}` : ""}
          </p>
          ${Button({ href: "http://localhost:5175/finances", label: "View Payout History" })}
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: data.seller.email })}
        `,
      });
    },
  },

  // 5. Payout Failed
  "seller.finance.payout_failed": {
    templateKey: "seller.finance.payout_failed",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.SELLER,
    priority: EmailPriority.HIGH,
    subject: (data) => `Action Required: Payout of ${enIN.formatCurrency(data.amount || 0)} failed ⚠️`,
    preheader: "Bank transfer returned. Please update your IFSC or account details.",
    render: (rawData) => {
      const data = formatSellerViewModel(rawData);
      return EmailLayout({
        title: "Payout Failed",
        preheader: "Bank transfer returned. Please update your bank details.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Payout Failed", variant: "danger" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #dc2626;">
            Bank Transfer Unsuccessful
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.seller.sellerName}, the payout transfer of ${enIN.formatCurrency(data.amount)} was returned by the clearing house due to invalid account or IFSC details.
          </p>
          ${Button({ href: "http://localhost:5175/finances/bank-account", label: "Update Bank Account", variant: "danger", fullWidth: true })}
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: data.seller.email })}
        `,
      });
    },
  },

  // 6. Settlement Adjusted
  "seller.finance.settlement_adjusted": {
    templateKey: "seller.finance.settlement_adjusted",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.SELLER,
    priority: EmailPriority.NORMAL,
    subject: () => "Settlement Adjustment Notice: Zosh Bazaar Merchant Account",
    preheader: "An adjustment was made to your seller ledger.",
    render: (rawData) => {
      const data = formatSellerViewModel(rawData);
      return EmailLayout({
        title: "Settlement Adjusted",
        preheader: "An adjustment was made to your seller ledger.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Ledger Adjustment", variant: "warning" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #d97706;">
            Settlement Reconciliation Notice
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.seller.sellerName}, an adjustment of ${enIN.formatCurrency(data.amount)} was applied to your merchant account balance.
            ${data.reason ? `<br /><strong>Reason:</strong> ${data.reason}` : ""}
          </p>
          ${Button({ href: "http://localhost:5175/finances", label: "View Ledger Entries" })}
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: data.seller.email })}
        `,
      });
    },
  },

  // 7. Commission Deducted
  "seller.finance.commission_deducted": {
    templateKey: "seller.finance.commission_deducted",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.SELLER,
    priority: EmailPriority.NORMAL,
    subject: () => "Monthly Commission & Fee Invoice Available",
    preheader: "Your monthly marketplace commission summary is ready for accounting.",
    render: (rawData) => {
      const data = formatSellerViewModel(rawData);
      return EmailLayout({
        title: "Commission Invoice",
        preheader: "Your monthly marketplace commission summary is ready.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Commission Fee", variant: "info" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a;" class="dark-text-main">
            Marketplace Fee Statement
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.seller.sellerName}, the marketplace commission and logistics handling statement for the current billing cycle is ready.
          </p>
          ${Button({ href: "http://localhost:5175/finances/invoices", label: "Download GST Tax Invoice" })}
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: data.seller.email })}
        `,
      });
    },
  },

  // 8. Payment Hold
  "seller.finance.payment_hold": {
    templateKey: "seller.finance.payment_hold",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.SELLER,
    priority: EmailPriority.HIGH,
    subject: () => "URGENT: Temporary Hold Placed on Seller Payouts",
    preheader: "Payouts have been paused pending compliance or high-return review.",
    render: (rawData) => {
      const data = formatSellerViewModel(rawData);
      return EmailLayout({
        title: "Payout Hold",
        preheader: "Payouts have been paused pending compliance review.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Payout Paused", variant: "danger" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #dc2626;">
            Temporary Payment Hold
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.seller.sellerName}, merchant disbursements for your store are temporarily paused.
            ${data.reason ? `<br /><strong>Reason:</strong> ${data.reason}` : ""}
          </p>
          ${Button({ href: "http://localhost:5175/support", label: "Contact Merchant Helpdesk", variant: "danger" })}
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: data.seller.email })}
        `,
      });
    },
  },
};
