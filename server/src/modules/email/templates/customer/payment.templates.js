import {
  EmailLayout,
  EmailHeader,
  EmailFooter,
  Button,
  Card,
  PriceRow,
  emailConfig,
} from "../shared/index.js";
import { EmailCategory, EmailPriority, EmailRecipientRole } from "../../core/email.types.js";
import { formatOrderViewModel } from "../../schemas/order.schema.js";
import { enIN } from "../../localization/en-IN/messages.js";

export const customerPaymentTemplates = {
  // 1. Payment Success
  "customer.payment.success": {
    templateKey: "customer.payment.success",
    category: EmailCategory.TRANSACTIONAL,
    recipientRole: EmailRecipientRole.CUSTOMER,
    priority: EmailPriority.HIGH,
    subject: (data) => `Payment Confirmed: ${enIN.formatCurrency(data.totals?.total || 0)} for order #${data.orderId || "ZB"}`,
    preheader: "Your payment was processed successfully. Thank you!",
    render: (rawData) => {
      const data = formatOrderViewModel(rawData);
      return EmailLayout({
        title: `Payment Receipt #${data.orderId}`,
        preheader: "Your payment was processed successfully. Thank you!",
        children: `
          ${EmailHeader({ roleBadge: { label: "Paid", variant: "success" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #16a34a;">
            Payment Successful
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.user.fullName}, we have successfully received your payment of <strong>${enIN.formatCurrency(data.totals.total)}</strong> for order #${data.orderId}.
          </p>
          ${Card({
            title: "Payment Summary",
            children: `
              <div style="font-size: 13px; color: #475569;">
                ${PriceRow({ label: "Amount Paid", value: data.totals.total, isTotal: true })}
                ${PriceRow({ label: "Payment Mode", value: data.paymentMethod || "Online Gateway" })}
              </div>
            `,
          })}
          ${Button({ href: data.invoiceUrl || data.orderUrl, label: "View Invoice", variant: "secondary" })}
          ${EmailFooter({ category: EmailCategory.TRANSACTIONAL, recipientEmail: data.user.email })}
        `,
      });
    },
  },

  // 2. Payment Failed
  "customer.payment.failed": {
    templateKey: "customer.payment.failed",
    category: EmailCategory.TRANSACTIONAL,
    recipientRole: EmailRecipientRole.CUSTOMER,
    priority: EmailPriority.HIGH,
    subject: (data) => `Payment failed for order #${data.orderId || "ZB"}`,
    preheader: "Your payment attempt did not complete. Click here to try again.",
    render: (rawData) => {
      const data = formatOrderViewModel(rawData);
      return EmailLayout({
        title: `Payment Failed #${data.orderId}`,
        preheader: "Your payment attempt did not complete.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Payment Failed", variant: "danger" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #dc2626;">
            Payment Did Not Go Through
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.user.fullName}, your bank or card issuer declined the payment attempt of ${enIN.formatCurrency(data.totals.total)} for order #${data.orderId}.
          </p>
          ${Button({ href: data.orderUrl, label: "Retry Payment", variant: "danger", fullWidth: true })}
          ${EmailFooter({ category: EmailCategory.TRANSACTIONAL, recipientEmail: data.user.email })}
        `,
      });
    },
  },

  // 3. Payment Pending
  "customer.payment.pending": {
    templateKey: "customer.payment.pending",
    category: EmailCategory.TRANSACTIONAL,
    recipientRole: EmailRecipientRole.CUSTOMER,
    priority: EmailPriority.HIGH,
    subject: (data) => `Payment confirmation pending for order #${data.orderId || "ZB"}`,
    preheader: "We are awaiting final confirmation from your bank.",
    render: (rawData) => {
      const data = formatOrderViewModel(rawData);
      return EmailLayout({
        title: `Payment Pending #${data.orderId}`,
        preheader: "We are awaiting final confirmation from your bank.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Pending", variant: "warning" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #d97706;">
            Payment Under Verification
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.user.fullName}, we are waiting for your bank to settle the transaction. Your items remain on hold. If funds were debited, your order will automatically confirm within 15 minutes.
          </p>
          ${Button({ href: data.orderUrl, label: "Check Order Status" })}
          ${EmailFooter({ category: EmailCategory.TRANSACTIONAL, recipientEmail: data.user.email })}
        `,
      });
    },
  },

  // 4. Payment Retry
  "customer.payment.retry": {
    templateKey: "customer.payment.retry",
    category: EmailCategory.TRANSACTIONAL,
    recipientRole: EmailRecipientRole.CUSTOMER,
    priority: EmailPriority.HIGH,
    subject: (data) => `Retry link for your Zosh Bazaar order #${data.orderId || "ZB"}`,
    preheader: "Click here to retry your payment with UPI, cards, or netbanking.",
    render: (rawData) => {
      const data = formatOrderViewModel(rawData);
      return EmailLayout({
        title: `Retry Payment #${data.orderId}`,
        preheader: "Click here to retry your payment with UPI, cards, or netbanking.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Retry", variant: "primary" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a;" class="dark-text-main">
            Complete Your Purchase
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.user.fullName}, your cart is saved. Choose any payment method (UPI, Card, NetBanking, EMI) to complete order #${data.orderId}:
          </p>
          ${Button({ href: data.orderUrl, label: "Pay Now & Confirm Order", fullWidth: true })}
          ${EmailFooter({ category: EmailCategory.TRANSACTIONAL, recipientEmail: data.user.email })}
        `,
      });
    },
  },

  // 5. COD Reminder
  "customer.payment.cod_reminder": {
    templateKey: "customer.payment.cod_reminder",
    category: EmailCategory.TRANSACTIONAL,
    recipientRole: EmailRecipientRole.CUSTOMER,
    priority: EmailPriority.NORMAL,
    subject: (data) => `Cash on Delivery Reminder: ${enIN.formatCurrency(data.totals?.total || 0)} for order #${data.orderId || "ZB"}`,
    preheader: "Please keep exact cash or UPI ready for the delivery partner.",
    render: (rawData) => {
      const data = formatOrderViewModel(rawData);
      return EmailLayout({
        title: `COD Reminder #${data.orderId}`,
        preheader: "Please keep exact cash or UPI ready for the delivery partner.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Cash on Delivery", variant: "accent" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a;" class="dark-text-main">
            Cash on Delivery Reminder
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.user.fullName}, your COD order #${data.orderId} will arrive soon. Please keep <strong>${enIN.formatCurrency(data.totals.total)}</strong> ready. Most delivery agents also accept UPI QR payments at your doorstep.
          </p>
          ${Button({ href: data.orderUrl, label: "View Order Details" })}
          ${EmailFooter({ category: EmailCategory.TRANSACTIONAL, recipientEmail: data.user.email })}
        `,
      });
    },
  },

  // 6. Tax Invoice Available
  "customer.payment.invoice": {
    templateKey: "customer.payment.invoice",
    category: EmailCategory.TRANSACTIONAL,
    recipientRole: EmailRecipientRole.CUSTOMER,
    priority: EmailPriority.NORMAL,
    subject: (data) => `Tax Invoice for Zosh Bazaar order #${data.orderId || "ZB"}`,
    preheader: "Your official GST tax invoice is ready for download.",
    render: (rawData) => {
      const data = formatOrderViewModel(rawData);
      return EmailLayout({
        title: `Invoice #${data.orderId}`,
        preheader: "Your official GST tax invoice is ready for download.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Tax Invoice", variant: "info" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a;" class="dark-text-main">
            GST Tax Invoice
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.user.fullName}, the digital tax invoice for order #${data.orderId} (Amount: ${enIN.formatCurrency(data.totals.total)}) is available.
          </p>
          ${Button({ href: data.invoiceUrl || data.orderUrl, label: "Download PDF Invoice" })}
          ${EmailFooter({ category: EmailCategory.TRANSACTIONAL, recipientEmail: data.user.email })}
        `,
      });
    },
  },

  // 7. Refund Initiated
  "customer.refund.initiated": {
    templateKey: "customer.refund.initiated",
    category: EmailCategory.TRANSACTIONAL,
    recipientRole: EmailRecipientRole.CUSTOMER,
    priority: EmailPriority.HIGH,
    subject: (data) => `Refund Initiated: ${enIN.formatCurrency(data.refundAmount || data.totals?.total || 0)} for order #${data.orderId || "ZB"}`,
    preheader: "We have initiated your refund. It will reflect in your account shortly.",
    render: (rawData) => {
      const data = formatOrderViewModel(rawData);
      const amt = data.refundAmount || data.totals.total;
      return EmailLayout({
        title: `Refund Initiated #${data.orderId}`,
        preheader: "We have initiated your refund.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Refund Initiated", variant: "warning" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a;" class="dark-text-main">
            Refund In Process
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.user.fullName}, a refund of <strong>${enIN.formatCurrency(amt)}</strong> has been initiated for order #${data.orderId}.
          </p>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin: 16px 0; font-size: 13px; color: #475569;">
            Standard processing takes 5-7 business days depending on your bank's clearance cycles.
          </div>
          ${Button({ href: data.orderUrl, label: "Track Refund Status" })}
          ${EmailFooter({ category: EmailCategory.TRANSACTIONAL, recipientEmail: data.user.email })}
        `,
      });
    },
  },

  // 8. Refund Processing
  "customer.refund.processing": {
    templateKey: "customer.refund.processing",
    category: EmailCategory.TRANSACTIONAL,
    recipientRole: EmailRecipientRole.CUSTOMER,
    priority: EmailPriority.NORMAL,
    subject: (data) => `Update: Refund processing with bank for order #${data.orderId || "ZB"}`,
    preheader: "Your bank has acknowledged the refund request and is processing the credit.",
    render: (rawData) => {
      const data = formatOrderViewModel(rawData);
      return EmailLayout({
        title: `Refund Processing #${data.orderId}`,
        preheader: "Your bank is processing the credit.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Bank Processing", variant: "info" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a;" class="dark-text-main">
            Refund Transferred to Bank
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.user.fullName}, our payment gateway has sent the refund instructions for order #${data.orderId} to your financial institution.
          </p>
          ${Button({ href: data.orderUrl, label: "View Refund Details" })}
          ${EmailFooter({ category: EmailCategory.TRANSACTIONAL, recipientEmail: data.user.email })}
        `,
      });
    },
  },

  // 9. Refund Completed
  "customer.refund.completed": {
    templateKey: "customer.refund.completed",
    category: EmailCategory.TRANSACTIONAL,
    recipientRole: EmailRecipientRole.CUSTOMER,
    priority: EmailPriority.HIGH,
    subject: (data) => `Refund Completed: ${enIN.formatCurrency(data.refundAmount || data.totals?.total || 0)} credited for order #${data.orderId || "ZB"}`,
    preheader: "Your refund has been successfully credited to your account.",
    render: (rawData) => {
      const data = formatOrderViewModel(rawData);
      const amt = data.refundAmount || data.totals.total;
      return EmailLayout({
        title: `Refund Completed #${data.orderId}`,
        preheader: "Your refund has been successfully credited.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Refunded", variant: "success" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #16a34a;">
            Refund Successfully Completed!
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.user.fullName}, your refund of <strong>${enIN.formatCurrency(amt)}</strong> for order #${data.orderId} has been credited back to your original payment method.
          </p>
          ${Button({ href: emailConfig.clientUrl, label: "Shop Zosh Bazaar" })}
          ${EmailFooter({ category: EmailCategory.TRANSACTIONAL, recipientEmail: data.user.email })}
        `,
      });
    },
  },

  // 10. Refund Failed
  "customer.refund.failed": {
    templateKey: "customer.refund.failed",
    category: EmailCategory.TRANSACTIONAL,
    recipientRole: EmailRecipientRole.CUSTOMER,
    priority: EmailPriority.HIGH,
    subject: (data) => `Action Needed: Refund failed for order #${data.orderId || "ZB"}`,
    preheader: "We were unable to credit your original payment source. Update your bank details.",
    render: (rawData) => {
      const data = formatOrderViewModel(rawData);
      return EmailLayout({
        title: `Refund Failed #${data.orderId}`,
        preheader: "Please update your bank details.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Action Required", variant: "danger" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #dc2626;">
            Refund Credit Failed
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.user.fullName}, our attempt to credit your original payment account failed due to an expired card or closed bank account.
          </p>
          <p style="font-size: 13px; color: #475569; line-height: 1.5;">
            Please provide an active Bank Account or UPI ID so our finance team can re-issue your funds directly via NEFT/IMPS.
          </p>
          ${Button({ href: `${data.orderUrl}/refund-details`, label: "Provide Bank Details", variant: "danger", fullWidth: true })}
          ${EmailFooter({ category: EmailCategory.TRANSACTIONAL, recipientEmail: data.user.email })}
        `,
      });
    },
  },
};
