import {
  EmailLayout,
  EmailHeader,
  EmailFooter,
  Button,
  Card,
} from "../shared/index.js";
import { EmailCategory, EmailPriority, EmailRecipientRole } from "../../core/email.types.js";
import { formatSellerViewModel } from "../../schemas/seller.schema.js";

export const sellerPerformanceTemplates = {
  // 1. Daily Summary
  "seller.performance.daily_summary": {
    templateKey: "seller.performance.daily_summary",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.SELLER,
    priority: EmailPriority.LOW,
    subject: (data) => `Daily Merchant Digest: Performance summary for ${data.seller?.storeName || "Your Store"} 📊`,
    preheader: "Here is your daily snapshot of orders, dispatches, and revenue.",
    render: (rawData) => {
      const data = formatSellerViewModel(rawData);
      return EmailLayout({
        title: "Daily Summary",
        preheader: "Here is your daily snapshot of orders, dispatches, and revenue.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Daily Digest", variant: "info" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a;" class="dark-text-main">
            Daily Merchant Performance
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.seller.sellerName}, here is how your store performed over the past 24 hours on Zosh Bazaar:
          </p>
          ${Card({
            children: `
              <div style="font-size: 13px; color: #475569; line-height: 1.6;">
                <strong>New Orders:</strong> ${data.itemsCount || 12} orders<br />
                <strong>Dispatched On-Time:</strong> 98.4%<br />
                <strong>Returns Processed:</strong> 1 return
              </div>
            `,
          })}
          ${Button({ href: "http://localhost:5175/analytics", label: "Open Merchant Analytics" })}
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: data.seller.email })}
        `,
      });
    },
  },

  // 2. SLA Warning
  "seller.performance.sla_warning": {
    templateKey: "seller.performance.sla_warning",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.SELLER,
    priority: EmailPriority.HIGH,
    subject: () => "WARNING: Dispatch SLA breach threshold approaching ⚠️",
    preheader: "Your on-time dispatch rate dropped below platform standards.",
    render: (rawData) => {
      const data = formatSellerViewModel(rawData);
      return EmailLayout({
        title: "SLA Warning",
        preheader: "Your on-time dispatch rate dropped below platform standards.",
        children: `
          ${EmailHeader({ roleBadge: { label: "SLA Warning", variant: "warning" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #d97706;">
            Dispatch SLA Alert
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.seller.sellerName}, your on-time order fulfillment score dropped below 95%. Consistent dispatch delays can result in listing suppression or search ranking penalties.
          </p>
          ${Button({ href: "http://localhost:5175/performance", label: "Review Fulfillment Metrics" })}
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: data.seller.email })}
        `,
      });
    },
  },

  // 3. Cancellation Rate Alert
  "seller.performance.cancellation_rate_alert": {
    templateKey: "seller.performance.cancellation_rate_alert",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.SELLER,
    priority: EmailPriority.HIGH,
    subject: () => "URGENT: High seller cancellation rate detected",
    preheader: "Out-of-stock cancellations are impacting customer trust.",
    render: (rawData) => {
      const data = formatSellerViewModel(rawData);
      return EmailLayout({
        title: "Cancellation Warning",
        preheader: "Out-of-stock cancellations are impacting customer trust.",
        children: `
          ${EmailHeader({ roleBadge: { label: "High Cancellations", variant: "danger" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #dc2626;">
            Elevated Cancellation Rate
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.seller.sellerName}, merchant-initiated order cancellations for your store have exceeded the 2% threshold. Please update your inventory numbers to prevent orders on out-of-stock items.
          </p>
          ${Button({ href: "http://localhost:5175/inventory", label: "Sync Inventory Immediately", variant: "danger" })}
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: data.seller.email })}
        `,
      });
    },
  },

  // 4. Return Rate Alert
  "seller.performance.return_rate_alert": {
    templateKey: "seller.performance.return_rate_alert",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.SELLER,
    priority: EmailPriority.HIGH,
    subject: () => "Notice: Elevated customer return rate on key products",
    preheader: "Product returns are significantly above category averages.",
    render: (rawData) => {
      const data = formatSellerViewModel(rawData);
      return EmailLayout({
        title: "Return Rate Notice",
        preheader: "Product returns are significantly above category averages.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Return Alert", variant: "warning" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #d97706;">
            High Return Volume
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.seller.sellerName}, return requests for products in your store reached ${data.metricValue || "8.5%"}. Common reasons cited by buyers include incorrect sizing and material description mismatches.
          </p>
          ${Button({ href: "http://localhost:5175/returns/insights", label: "Inspect Return Causes" })}
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: data.seller.email })}
        `,
      });
    },
  },

  // 5. Rating Update
  "seller.performance.rating_update": {
    templateKey: "seller.performance.rating_update",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.SELLER,
    priority: EmailPriority.LOW,
    subject: () => "Weekly Merchant Rating & Feedback Snapshot",
    preheader: "See your latest store reviews and customer satisfaction score.",
    render: (rawData) => {
      const data = formatSellerViewModel(rawData);
      return EmailLayout({
        title: "Rating Update",
        preheader: "See your latest store reviews and customer satisfaction score.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Ratings", variant: "info" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a;" class="dark-text-main">
            Store Rating Update
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.seller.sellerName}, your current overall marketplace score is <strong>4.8 / 5.0 ⭐</strong> based on verified customer purchases.
          </p>
          ${Button({ href: "http://localhost:5175/reviews", label: "View Customer Feedback" })}
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: data.seller.email })}
        `,
      });
    },
  },

  // 6. Customer Complaint Alert
  "seller.performance.customer_complaint": {
    templateKey: "seller.performance.customer_complaint",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.SELLER,
    priority: EmailPriority.HIGH,
    subject: (data) => `Customer Escalation: Urgent complaint on order #${data.orderId || "ZB"}`,
    preheader: "A buyer has escalated a dispute to marketplace support.",
    render: (rawData) => {
      const data = formatSellerViewModel(rawData);
      return EmailLayout({
        title: "Escalated Complaint",
        preheader: "A buyer has escalated a dispute to marketplace support.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Escalation", variant: "danger" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #dc2626;">
            Customer Escalation Logged
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.seller.sellerName}, customer support received an escalated complaint regarding order #${data.orderId}. Please reply within 24 hours.
          </p>
          ${Button({ href: `http://localhost:5175/disputes`, label: "Respond to Dispute", variant: "danger" })}
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: data.seller.email })}
        `,
      });
    },
  },

  // 7. Policy Violation
  "seller.compliance.policy_violation": {
    templateKey: "seller.compliance.policy_violation",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.SELLER,
    priority: EmailPriority.HIGH,
    subject: () => "NOTICE: Marketplace Policy Violation Warning",
    preheader: "A product listing or fulfillment action violated Zosh Bazaar seller terms.",
    render: (rawData) => {
      const data = formatSellerViewModel(rawData);
      return EmailLayout({
        title: "Policy Violation",
        preheader: "A listing violated Zosh Bazaar seller terms.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Policy Notice", variant: "danger" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #dc2626;">
            Policy Compliance Notice
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.seller.sellerName}, a violation of our Fair Marketplace Policy was detected on your account.
            ${data.reason ? `<br /><br /><strong>Infraction Details:</strong> ${data.reason}` : ""}
          </p>
          ${Button({ href: "http://localhost:5175/compliance", label: "Review Policy Guidelines" })}
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: data.seller.email })}
        `,
      });
    },
  },

  // 8. Compliance Review Scheduled
  "seller.compliance.review_scheduled": {
    templateKey: "seller.compliance.review_scheduled",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.SELLER,
    priority: EmailPriority.NORMAL,
    subject: () => "Periodic Account Compliance Audit Scheduled",
    preheader: "Annual regulatory verification audit notice.",
    render: (rawData) => {
      const data = formatSellerViewModel(rawData);
      return EmailLayout({
        title: "Compliance Audit",
        preheader: "Annual regulatory verification audit notice.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Audit Notice", variant: "info" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a;" class="dark-text-main">
            Periodic Account Verification
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.seller.sellerName}, as part of statutory e-commerce compliance, your business tax and bank records will undergo periodic verification.
          </p>
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: data.seller.email })}
        `,
      });
    },
  },
};
