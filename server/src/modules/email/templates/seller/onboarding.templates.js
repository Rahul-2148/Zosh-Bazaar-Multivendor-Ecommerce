import {
  EmailLayout,
  EmailHeader,
  EmailFooter,
  Button,
  OtpBox,
  emailConfig,
} from "../shared/index.js";
import { EmailCategory, EmailPriority, EmailRecipientRole } from "../../core/email.types.js";
import { formatSellerViewModel } from "../../schemas/seller.schema.js";

export const sellerOnboardingTemplates = {
  // 1. Seller Registered
  "seller.onboarding.registered": {
    templateKey: "seller.onboarding.registered",
    category: EmailCategory.TRANSACTIONAL,
    recipientRole: EmailRecipientRole.SELLER,
    priority: EmailPriority.HIGH,
    subject: () => "Welcome to Zosh Bazaar Merchant Network! 🏪",
    preheader: "Your seller account registration has been created. Next step: business verification.",
    render: (rawData) => {
      const data = formatSellerViewModel(rawData);
      return EmailLayout({
        title: "Seller Registration",
        preheader: "Your seller account registration has been created.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Merchant Onboarding", variant: "info" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a;" class="dark-text-main">
            Welcome, ${data.seller.sellerName}!
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Thank you for registering to sell on Zosh Bazaar. To start listing your products and receiving customer orders, complete your GST and bank verification.
          </p>
          ${Button({ href: data.actionUrl, label: "Complete Merchant Profile", fullWidth: true })}
          ${EmailFooter({ category: EmailCategory.TRANSACTIONAL, recipientEmail: data.seller.email })}
        `,
      });
    },
  },

  // 2. Seller Email Verification / OTP
  "seller.onboarding.email_verification": {
    templateKey: "seller.onboarding.email_verification",
    category: EmailCategory.SECURITY,
    recipientRole: EmailRecipientRole.SELLER,
    priority: EmailPriority.IMMEDIATE,
    subject: () => "Zosh Bazaar Seller Login/Signup OTP",
    preheader: "Your verification code to access the Zosh Bazaar Merchant Console.",
    render: (rawData) => {
      const data = formatSellerViewModel(rawData);
      const otp = rawData.otp || "123456";
      return EmailLayout({
        title: "Merchant Verification Code",
        preheader: "Your verification code to access the Zosh Bazaar Merchant Console.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Seller Auth", variant: "warning" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a;" class="dark-text-main">
            Merchant Authentication OTP
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hello ${data.seller.sellerName}, enter the 6-digit verification code below to log in or complete your seller signup:
          </p>
          ${OtpBox(otp, 5)}
          <p style="font-size: 12px; color: #64748b; line-height: 1.4;">
            This security code was requested for <strong>${data.seller.email}</strong>. Do not disclose this code to anyone.
          </p>
          ${EmailFooter({ category: EmailCategory.SECURITY, recipientEmail: data.seller.email })}
        `,
      });
    },
  },

  // 3. Application Submitted
  "seller.onboarding.application_submitted": {
    templateKey: "seller.onboarding.application_submitted",
    category: EmailCategory.TRANSACTIONAL,
    recipientRole: EmailRecipientRole.SELLER,
    priority: EmailPriority.NORMAL,
    subject: () => "Seller Application Received: Under Compliance Review",
    preheader: "We have received your business documentation and GST details.",
    render: (rawData) => {
      const data = formatSellerViewModel(rawData);
      return EmailLayout({
        title: "Application Received",
        preheader: "We have received your business documentation.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Under Review", variant: "info" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a;" class="dark-text-main">
            Application Received
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.seller.sellerName}, your seller application for <strong>${data.seller.storeName}</strong> has been submitted. Our compliance team verifies GSTIN, bank penny-drops, and address details within 24 to 48 business hours.
          </p>
          ${Button({ href: data.actionUrl, label: "Check Application Status" })}
          ${EmailFooter({ category: EmailCategory.TRANSACTIONAL, recipientEmail: data.seller.email })}
        `,
      });
    },
  },

  // 4. Under Review
  "seller.onboarding.under_review": {
    templateKey: "seller.onboarding.under_review",
    category: EmailCategory.TRANSACTIONAL,
    recipientRole: EmailRecipientRole.SELLER,
    priority: EmailPriority.NORMAL,
    subject: () => "Your Zosh Bazaar merchant application is being reviewed",
    preheader: "Compliance officers are verifying your business documents.",
    render: (rawData) => {
      const data = formatSellerViewModel(rawData);
      return EmailLayout({
        title: "Under Verification",
        preheader: "Compliance officers are verifying your business documents.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Verification in Progress", variant: "warning" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a;" class="dark-text-main">
            Verification in Progress
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.seller.sellerName}, our onboarding desk is currently cross-referencing your tax records and business identity documents.
          </p>
          ${EmailFooter({ category: EmailCategory.TRANSACTIONAL, recipientEmail: data.seller.email })}
        `,
      });
    },
  },

  // 5. Approved
  "seller.onboarding.approved": {
    templateKey: "seller.onboarding.approved",
    category: EmailCategory.TRANSACTIONAL,
    recipientRole: EmailRecipientRole.SELLER,
    priority: EmailPriority.HIGH,
    subject: () => "Congratulations! Your Zosh Bazaar Seller Account is Approved 🎉",
    preheader: "Your merchant account is now ACTIVE. You can start listing products.",
    render: (rawData) => {
      const data = formatSellerViewModel(rawData);
      return EmailLayout({
        title: "Seller Approved",
        preheader: "Your merchant account is now ACTIVE.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Approved", variant: "success" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #16a34a;">
            Account Approved & Active!
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Congratulations ${data.seller.sellerName}! Your merchant account for <strong>${data.seller.storeName}</strong> has been fully approved. You can now add products, configure inventory, and begin selling to customers across India.
          </p>
          ${Button({ href: emailConfig.sellerUrl + "/products/add", label: "Create Your First Product Listing", fullWidth: true })}
          ${EmailFooter({ category: EmailCategory.TRANSACTIONAL, recipientEmail: data.seller.email })}
        `,
      });
    },
  },

  // 6. Rejected
  "seller.onboarding.rejected": {
    templateKey: "seller.onboarding.rejected",
    category: EmailCategory.TRANSACTIONAL,
    recipientRole: EmailRecipientRole.SELLER,
    priority: EmailPriority.HIGH,
    subject: () => "Update on your Zosh Bazaar merchant application",
    preheader: "Your application could not be approved at this time.",
    render: (rawData) => {
      const data = formatSellerViewModel(rawData);
      return EmailLayout({
        title: "Application Rejected",
        preheader: "Your application could not be approved at this time.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Not Approved", variant: "danger" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #dc2626;">
            Application Unsuccessful
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.seller.sellerName}, unfortunately we are unable to approve your merchant application at this time.
            ${data.reason ? `<br /><br /><strong>Reason:</strong> ${data.reason}` : ""}
          </p>
          ${Button({ href: data.actionUrl, label: "Review & Re-apply", variant: "danger" })}
          ${EmailFooter({ category: EmailCategory.TRANSACTIONAL, recipientEmail: data.seller.email })}
        `,
      });
    },
  },

  // 7. Onboarding Incomplete
  "seller.onboarding.incomplete": {
    templateKey: "seller.onboarding.incomplete",
    category: EmailCategory.TRANSACTIONAL,
    recipientRole: EmailRecipientRole.SELLER,
    priority: EmailPriority.NORMAL,
    subject: () => "Complete your seller profile to start receiving orders",
    preheader: "You are just a few steps away from launching your store.",
    render: (rawData) => {
      const data = formatSellerViewModel(rawData);
      return EmailLayout({
        title: "Incomplete Onboarding",
        preheader: "You are just a few steps away from launching your store.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Action Required", variant: "warning" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #d97706;">
            Finish Setting Up Your Store
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.seller.sellerName}, your store setup is currently incomplete. Provide your warehouse pickup address and bank account details to unlock order dispatching.
          </p>
          ${Button({ href: data.actionUrl, label: "Resume Store Setup", fullWidth: true })}
          ${EmailFooter({ category: EmailCategory.TRANSACTIONAL, recipientEmail: data.seller.email })}
        `,
      });
    },
  },

  // 8. Documents Required
  "seller.onboarding.documents_required": {
    templateKey: "seller.onboarding.documents_required",
    category: EmailCategory.TRANSACTIONAL,
    recipientRole: EmailRecipientRole.SELLER,
    priority: EmailPriority.HIGH,
    subject: () => "Action Required: Additional documentation needed for seller verification",
    preheader: "Please upload the requested business documents to complete verification.",
    render: (rawData) => {
      const data = formatSellerViewModel(rawData);
      return EmailLayout({
        title: "Documents Required",
        preheader: "Please upload the requested business documents.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Documents Needed", variant: "warning" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #d97706;">
            Additional Documents Required
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.seller.sellerName}, our compliance team requires an updated GST certificate or bank statement copy for ${data.seller.storeName}.
          </p>
          ${Button({ href: data.actionUrl, label: "Upload Documents Now", fullWidth: true })}
          ${EmailFooter({ category: EmailCategory.TRANSACTIONAL, recipientEmail: data.seller.email })}
        `,
      });
    },
  },

  // 9. Documents Received
  "seller.onboarding.documents_received": {
    templateKey: "seller.onboarding.documents_received",
    category: EmailCategory.TRANSACTIONAL,
    recipientRole: EmailRecipientRole.SELLER,
    priority: EmailPriority.NORMAL,
    subject: () => "Documents Received: Verification queued",
    preheader: "Your uploaded business documents have been received.",
    render: (rawData) => {
      const data = formatSellerViewModel(rawData);
      return EmailLayout({
        title: "Documents Received",
        preheader: "Your uploaded business documents have been received.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Docs Received", variant: "info" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a;" class="dark-text-main">
            Documents Successfully Uploaded
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.seller.sellerName}, we received your updated business filings. Our team will verify them within 1 business day.
          </p>
          ${EmailFooter({ category: EmailCategory.TRANSACTIONAL, recipientEmail: data.seller.email })}
        `,
      });
    },
  },

  // 10. Documents Approved
  "seller.onboarding.documents_approved": {
    templateKey: "seller.onboarding.documents_approved",
    category: EmailCategory.TRANSACTIONAL,
    recipientRole: EmailRecipientRole.SELLER,
    priority: EmailPriority.NORMAL,
    subject: () => "Your business documents have been verified & approved",
    preheader: "Your GST and banking credentials passed compliance checks.",
    render: (rawData) => {
      const data = formatSellerViewModel(rawData);
      return EmailLayout({
        title: "Documents Approved",
        preheader: "Your GST and banking credentials passed compliance checks.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Verified", variant: "success" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #16a34a;">
            Business Verification Complete
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.seller.sellerName}, all submitted documents have passed verification successfully.
          </p>
          ${EmailFooter({ category: EmailCategory.TRANSACTIONAL, recipientEmail: data.seller.email })}
        `,
      });
    },
  },

  // 11. Documents Rejected
  "seller.onboarding.documents_rejected": {
    templateKey: "seller.onboarding.documents_rejected",
    category: EmailCategory.TRANSACTIONAL,
    recipientRole: EmailRecipientRole.SELLER,
    priority: EmailPriority.HIGH,
    subject: () => "Action Required: Submitted documents could not be verified",
    preheader: "Uploaded files were illegible or mismatched legal business records.",
    render: (rawData) => {
      const data = formatSellerViewModel(rawData);
      return EmailLayout({
        title: "Documents Rejected",
        preheader: "Uploaded files were illegible or mismatched legal business records.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Re-upload Needed", variant: "danger" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #dc2626;">
            Document Verification Failed
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.seller.sellerName}, your submitted files were rejected because the details did not match official government registries or the image was blurry.
          </p>
          ${Button({ href: data.actionUrl, label: "Re-upload Legible Copy", variant: "danger" })}
          ${EmailFooter({ category: EmailCategory.TRANSACTIONAL, recipientEmail: data.seller.email })}
        `,
      });
    },
  },

  // 12. Account Suspended
  "seller.onboarding.suspended": {
    templateKey: "seller.onboarding.suspended",
    category: EmailCategory.SECURITY,
    recipientRole: EmailRecipientRole.SELLER,
    priority: EmailPriority.IMMEDIATE,
    subject: () => "URGENT: Zosh Bazaar Merchant Account Suspended",
    preheader: "Your seller account has been temporarily suspended due to policy or SLA breach.",
    render: (rawData) => {
      const data = formatSellerViewModel(rawData);
      return EmailLayout({
        title: "Account Suspended",
        preheader: "Your seller account has been temporarily suspended.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Suspended", variant: "danger" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #dc2626;">
            Seller Account Suspended
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.seller.sellerName}, your merchant account for ${data.seller.storeName} has been suspended.
            ${data.reason ? `<br /><strong>Reason:</strong> ${data.reason}` : ""}
          </p>
          ${Button({ href: emailConfig.sellerUrl + "/support/appeal", label: "File Merchant Appeal", variant: "danger" })}
          ${EmailFooter({ category: EmailCategory.SECURITY, recipientEmail: data.seller.email })}
        `,
      });
    },
  },

  // 13. Account Reactivated
  "seller.onboarding.reactivated": {
    templateKey: "seller.onboarding.reactivated",
    category: EmailCategory.TRANSACTIONAL,
    recipientRole: EmailRecipientRole.SELLER,
    priority: EmailPriority.HIGH,
    subject: () => "Your Zosh Bazaar merchant account has been reactivated",
    preheader: "Your store is live again. You can resume processing orders.",
    render: (rawData) => {
      const data = formatSellerViewModel(rawData);
      return EmailLayout({
        title: "Account Reactivated",
        preheader: "Your store is live again. You can resume processing orders.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Reactivated", variant: "success" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #16a34a;">
            Account Restored to Active Status
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.seller.sellerName}, your seller account appeal has been approved and your store listings are live again.
          </p>
          ${Button({ href: emailConfig.sellerUrl + "/dashboard", label: "Open Seller Dashboard" })}
          ${EmailFooter({ category: EmailCategory.TRANSACTIONAL, recipientEmail: data.seller.email })}
        `,
      });
    },
  },
};
