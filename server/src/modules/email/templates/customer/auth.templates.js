import {
  EmailLayout,
  EmailHeader,
  EmailFooter,
  Button,
  Card,
  SecurityNotice,
} from "../shared/index.js";
import { EmailCategory, EmailPriority, EmailRecipientRole } from "../../core/email.types.js";
import { formatAuthViewModel } from "../../schemas/auth.schema.js";

/**
 * OTP Card Component helper
 */
function OtpBox(otp, validityMinutes = 5) {
  return `
    <div style="background: #f8fafc; border: 2px dashed #2563eb; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
      <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 1px; margin-bottom: 8px;">
        Your Single-Use Verification Code
      </div>
      <div style="font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #1e293b; font-family: monospace;" class="dark-text-main">
        ${otp}
      </div>
      <div style="font-size: 12px; color: #64748b; margin-top: 8px;">
        &#9201; Valid for <strong>${validityMinutes} minutes</strong>. Do not share this code with anyone.
      </div>
    </div>
  `;
}

export const customerAuthTemplates = {
  // 1. Welcome / Registration Complete
  "customer.auth.welcome": {
    templateKey: "customer.auth.welcome",
    category: EmailCategory.TRANSACTIONAL,
    recipientRole: EmailRecipientRole.CUSTOMER,
    priority: EmailPriority.HIGH,
    subject: (data) => `Welcome to Zosh Bazaar, ${data.user?.fullName || "Shopper"}! 🛍️`,
    preheader: "Your account is active. Discover millions of products from verified sellers.",
    render: (rawData) => {
      const data = formatAuthViewModel(rawData);
      return EmailLayout({
        title: "Welcome to Zosh Bazaar",
        preheader: "Your account is active. Discover millions of products from verified sellers.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Welcome", variant: "success" } })}
          <h2 style="font-size: 22px; font-weight: 800; margin: 0 0 12px 0; color: #0f172a;" class="dark-text-main">
            Welcome to the Marketplace, ${data.user.fullName}!
          </h2>
          <p style="font-size: 14px; line-height: 1.6; color: #475569;" class="dark-text-muted">
            We are thrilled to welcome you to <strong>Zosh Bazaar</strong>, India's premier multi-vendor commerce platform. You can now browse verified merchants, track orders in real time, and enjoy secure doorstep deliveries.
          </p>
          ${Card({
            title: "What you can do now",
            children: `
              <ul style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.6; color: #475569;" class="dark-text-muted">
                <li>Save products to your personal wishlist and receive instant price-drop alerts.</li>
                <li>Track multi-package vendor deliveries with verified OTP handovers.</li>
                <li>Access easy return and replacement guarantees within 7 days.</li>
              </ul>
            `,
          })}
          ${Button({ href: data.actionUrl || "http://localhost:5173", label: "Start Shopping Now", fullWidth: true })}
          ${EmailFooter({ category: EmailCategory.TRANSACTIONAL, recipientEmail: data.user.email })}
        `,
      });
    },
  },

  // 2. Email Verification Link / Code
  "customer.auth.email_verification": {
    templateKey: "customer.auth.email_verification",
    category: EmailCategory.SECURITY,
    recipientRole: EmailRecipientRole.CUSTOMER,
    priority: EmailPriority.IMMEDIATE,
    subject: () => "Your Zosh Bazaar verification code",
    preheader: "Verify your email address to activate your Zosh Bazaar account.",
    render: (rawData) => {
      const data = formatAuthViewModel(rawData);
      return EmailLayout({
        title: "Verify Your Email Address",
        preheader: "Verify your email address to activate your Zosh Bazaar account.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Verification", variant: "info" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a;" class="dark-text-main">
            Verify Your Email Address
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.user.fullName}, please use the 6-digit code below to verify your email address on Zosh Bazaar:
          </p>
          ${OtpBox(data.otp, data.validityMinutes)}
          <p style="font-size: 13px; color: #64748b; line-height: 1.5;" class="dark-text-muted">
            If you did not sign up for a Zosh Bazaar account, please ignore this email.
          </p>
          ${EmailFooter({ category: EmailCategory.SECURITY, recipientEmail: data.user.email })}
        `,
      });
    },
  },

  // 3. Login Security OTP
  "customer.auth.login_otp": {
    templateKey: "customer.auth.login_otp",
    category: EmailCategory.SECURITY,
    recipientRole: EmailRecipientRole.CUSTOMER,
    priority: EmailPriority.IMMEDIATE,
    subject: () => "Your Zosh Bazaar login security code",
    preheader: "Enter this one-time code to complete your sign-in to Zosh Bazaar.",
    render: (rawData) => {
      const data = formatAuthViewModel(rawData);
      return EmailLayout({
        title: "Login Security Code",
        preheader: "Enter this one-time code to complete your sign-in to Zosh Bazaar.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Security OTP", variant: "warning" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a;" class="dark-text-main">
            Your Sign-In Verification Code
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hello, a request was received to sign in to your Zosh Bazaar account (<strong>${data.user.email}</strong>).
          </p>
          ${OtpBox(data.otp, data.validityMinutes)}
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px 14px; font-size: 12px; color: #991b1b; margin-top: 14px;">
            <strong>Security Alert:</strong> Zosh Bazaar staff will NEVER ask for this OTP via phone, email, or chat. If you did not attempt to sign in, someone else may be trying to access your account.
          </div>
          ${EmailFooter({ category: EmailCategory.SECURITY, recipientEmail: data.user.email })}
        `,
      });
    },
  },

  // 4. Password Reset Requested
  "customer.auth.password_reset_request": {
    templateKey: "customer.auth.password_reset_request",
    category: EmailCategory.SECURITY,
    recipientRole: EmailRecipientRole.CUSTOMER,
    priority: EmailPriority.IMMEDIATE,
    subject: () => "Reset your Zosh Bazaar password",
    preheader: "We received a request to reset your password. Click the link to proceed.",
    render: (rawData) => {
      const data = formatAuthViewModel(rawData);
      return EmailLayout({
        title: "Reset Your Password",
        preheader: "We received a request to reset your password. Click the link to proceed.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Account Security", variant: "danger" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a;" class="dark-text-main">
            Password Reset Request
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.user.fullName}, we received a request to reset the password for your Zosh Bazaar account. Click the button below to set a new password:
          </p>
          ${Button({ href: data.actionUrl, label: "Reset My Password", variant: "primary", fullWidth: true })}
          <p style="font-size: 12px; color: #64748b; margin-top: 16px;">
            This password reset link is valid for <strong>${data.validityMinutes} minutes</strong>. If you didn't make this request, you can safely ignore this message.
          </p>
          ${EmailFooter({ category: EmailCategory.SECURITY, recipientEmail: data.user.email })}
        `,
      });
    },
  },

  // 5. Password Reset Completed
  "customer.auth.password_reset_success": {
    templateKey: "customer.auth.password_reset_success",
    category: EmailCategory.SECURITY,
    recipientRole: EmailRecipientRole.CUSTOMER,
    priority: EmailPriority.HIGH,
    subject: () => "Your Zosh Bazaar password has been successfully reset",
    preheader: "Your account password was recently reset.",
    render: (rawData) => {
      const data = formatAuthViewModel(rawData);
      return EmailLayout({
        title: "Password Reset Successful",
        preheader: "Your account password was recently reset.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Security Update", variant: "success" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a;" class="dark-text-main">
            Password Reset Complete
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.user.fullName}, the password for your Zosh Bazaar account was changed successfully.
          </p>
          ${SecurityNotice({
            ipAddress: data.ipAddress,
            device: data.device,
            location: data.location,
            timestamp: data.timestamp,
            severity: "MEDIUM",
            supportUrl: data.supportUrl,
          })}
          ${Button({ href: data.actionUrl || "http://localhost:5173/login", label: "Sign In With New Password" })}
          ${EmailFooter({ category: EmailCategory.SECURITY, recipientEmail: data.user.email })}
        `,
      });
    },
  },

  // 6. Password Changed
  "customer.auth.password_changed": {
    templateKey: "customer.auth.password_changed",
    category: EmailCategory.SECURITY,
    recipientRole: EmailRecipientRole.CUSTOMER,
    priority: EmailPriority.HIGH,
    subject: () => "Security alert: Your Zosh Bazaar password was changed",
    preheader: "We noticed your account password was changed.",
    render: (rawData) => {
      const data = formatAuthViewModel(rawData);
      return EmailLayout({
        title: "Password Changed Alert",
        preheader: "We noticed your account password was changed.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Security Alert", variant: "warning" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a;" class="dark-text-main">
            Your Password Was Changed
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.user.fullName}, the password for your Zosh Bazaar account has been modified.
          </p>
          ${SecurityNotice({
            ipAddress: data.ipAddress,
            device: data.device,
            location: data.location,
            timestamp: data.timestamp,
            severity: "HIGH",
            supportUrl: data.supportUrl,
          })}
          ${EmailFooter({ category: EmailCategory.SECURITY, recipientEmail: data.user.email })}
        `,
      });
    },
  },

  // 7. New Login Detected
  "customer.auth.new_login": {
    templateKey: "customer.auth.new_login",
    category: EmailCategory.SECURITY,
    recipientRole: EmailRecipientRole.CUSTOMER,
    priority: EmailPriority.HIGH,
    subject: () => "New login detected to your Zosh Bazaar account",
    preheader: "We detected a sign-in to your account from a new browser or device.",
    render: (rawData) => {
      const data = formatAuthViewModel(rawData);
      return EmailLayout({
        title: "New Login Detected",
        preheader: "We detected a sign-in to your account from a new browser or device.",
        children: `
          ${EmailHeader({ roleBadge: { label: "New Session", variant: "info" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a;" class="dark-text-main">
            New Sign-In Detected
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.user.fullName}, your Zosh Bazaar account was just accessed from a new device or session.
          </p>
          ${SecurityNotice({
            ipAddress: data.ipAddress,
            device: data.device,
            location: data.location,
            timestamp: data.timestamp,
            severity: "LOW",
            supportUrl: data.supportUrl,
          })}
          ${EmailFooter({ category: EmailCategory.SECURITY, recipientEmail: data.user.email })}
        `,
      });
    },
  },

  // 8. Suspicious Login Alert
  "customer.auth.suspicious_login": {
    templateKey: "customer.auth.suspicious_login",
    category: EmailCategory.SECURITY,
    recipientRole: EmailRecipientRole.CUSTOMER,
    priority: EmailPriority.IMMEDIATE,
    subject: () => "URGENT: Suspicious login attempt blocked on Zosh Bazaar",
    preheader: "We flagged and blocked an unusual attempt to access your account.",
    render: (rawData) => {
      const data = formatAuthViewModel(rawData);
      return EmailLayout({
        title: "Suspicious Login Alert",
        preheader: "We flagged and blocked an unusual attempt to access your account.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Critical Alert", variant: "danger" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #dc2626;">
            Suspicious Access Blocked
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.user.fullName}, our automated security system detected multiple failed login attempts or an unusual connection pattern targeting your account.
          </p>
          ${SecurityNotice({
            ipAddress: data.ipAddress,
            device: data.device,
            location: data.location,
            timestamp: data.timestamp,
            severity: "CRITICAL",
            supportUrl: data.supportUrl,
          })}
          ${Button({ href: data.actionUrl || "http://localhost:5173/account/security", label: "Secure Account Now", variant: "danger", fullWidth: true })}
          ${EmailFooter({ category: EmailCategory.SECURITY, recipientEmail: data.user.email })}
        `,
      });
    },
  },

  // 9. Email Address Changed
  "customer.auth.email_changed": {
    templateKey: "customer.auth.email_changed",
    category: EmailCategory.SECURITY,
    recipientRole: EmailRecipientRole.CUSTOMER,
    priority: EmailPriority.HIGH,
    subject: () => "Your Zosh Bazaar primary email address was updated",
    preheader: "Your account's primary email address has been updated.",
    render: (rawData) => {
      const data = formatAuthViewModel(rawData);
      return EmailLayout({
        title: "Email Address Updated",
        preheader: "Your account's primary email address has been updated.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Profile Update", variant: "info" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a;" class="dark-text-main">
            Primary Email Address Updated
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.user.fullName}, your Zosh Bazaar account contact email has been updated to <strong>${data.user.email}</strong>.
          </p>
          ${SecurityNotice({
            ipAddress: data.ipAddress,
            device: data.device,
            location: data.location,
            timestamp: data.timestamp,
            severity: "HIGH",
            supportUrl: data.supportUrl,
          })}
          ${EmailFooter({ category: EmailCategory.SECURITY, recipientEmail: data.user.email })}
        `,
      });
    },
  },

  // 10. Phone Number Changed
  "customer.auth.phone_changed": {
    templateKey: "customer.auth.phone_changed",
    category: EmailCategory.SECURITY,
    recipientRole: EmailRecipientRole.CUSTOMER,
    priority: EmailPriority.HIGH,
    subject: () => "Your Zosh Bazaar mobile number was updated",
    preheader: "Your registered mobile phone number has been modified.",
    render: (rawData) => {
      const data = formatAuthViewModel(rawData);
      return EmailLayout({
        title: "Mobile Number Updated",
        preheader: "Your registered mobile phone number has been modified.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Profile Update", variant: "info" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a;" class="dark-text-main">
            Registered Phone Number Modified
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.user.fullName}, the mobile number linked to your account was recently updated. Order delivery OTPs and SMS alerts will now be routed to your new number.
          </p>
          ${SecurityNotice({
            ipAddress: data.ipAddress,
            device: data.device,
            location: data.location,
            timestamp: data.timestamp,
            severity: "MEDIUM",
            supportUrl: data.supportUrl,
          })}
          ${EmailFooter({ category: EmailCategory.SECURITY, recipientEmail: data.user.email })}
        `,
      });
    },
  },

  // 11. Security Alert Generic
  "customer.auth.security_alert": {
    templateKey: "customer.auth.security_alert",
    category: EmailCategory.SECURITY,
    recipientRole: EmailRecipientRole.CUSTOMER,
    priority: EmailPriority.HIGH,
    subject: () => "Security advisory for your Zosh Bazaar account",
    preheader: "Important security notice regarding your account activity.",
    render: (rawData) => {
      const data = formatAuthViewModel(rawData);
      return EmailLayout({
        title: "Security Advisory",
        preheader: "Important security notice regarding your account activity.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Security Notice", variant: "warning" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a;" class="dark-text-main">
            Security Advisory
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.user.fullName}, we observed an account configuration change or access pattern that requires your attention.
          </p>
          ${SecurityNotice({
            ipAddress: data.ipAddress,
            device: data.device,
            location: data.location,
            timestamp: data.timestamp,
            severity: "MEDIUM",
            supportUrl: data.supportUrl,
          })}
          ${Button({ href: data.supportUrl, label: "Review Security Settings" })}
          ${EmailFooter({ category: EmailCategory.SECURITY, recipientEmail: data.user.email })}
        `,
      });
    },
  },

  // 12. Account Deactivated
  "customer.account.deactivated": {
    templateKey: "customer.account.deactivated",
    category: EmailCategory.TRANSACTIONAL,
    recipientRole: EmailRecipientRole.CUSTOMER,
    priority: EmailPriority.HIGH,
    subject: () => "Zosh Bazaar — Account Deactivated",
    preheader: "Your Zosh Bazaar account has been temporarily deactivated.",
    render: (rawData) => {
      const data = formatAuthViewModel(rawData);
      return EmailLayout({
        title: "Account Deactivated",
        preheader: "Your Zosh Bazaar account has been temporarily deactivated.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Deactivated", variant: "neutral" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a;" class="dark-text-main">
            Account Deactivated
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.user.fullName}, your Zosh Bazaar account has been temporarily deactivated as requested.
          </p>
          ${Card({
            title: "What this means for you",
            children: `
              <ul style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.6; color: #475569;" class="dark-text-muted">
                <li>Your profile is hidden from active marketplace interactions.</li>
                <li>Your order history, saved addresses, and preferences remain safe.</li>
                <li>You can reactivate your account at any time simply by signing in.</li>
              </ul>
            `,
          })}
          <p style="font-size: 12px; color: #64748b; margin-top: 14px;">
            If you did not request this deactivation, please contact our support team immediately.
          </p>
          ${EmailFooter({ category: EmailCategory.TRANSACTIONAL, recipientEmail: data.user.email })}
        `,
      });
    },
  },

  // 13. Account Deletion OTP
  "customer.account.deletion_otp": {
    templateKey: "customer.account.deletion_otp",
    category: EmailCategory.SECURITY,
    recipientRole: EmailRecipientRole.CUSTOMER,
    priority: EmailPriority.IMMEDIATE,
    subject: () => "Zosh Bazaar — Account Deletion Verification Code",
    preheader: "Enter this verification code to confirm permanent account deletion.",
    render: (rawData) => {
      const data = formatAuthViewModel(rawData);
      return EmailLayout({
        title: "Account Deletion Verification",
        preheader: "Enter this verification code to confirm permanent account deletion.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Deletion OTP", variant: "danger" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #dc2626;">
            Account Deletion Verification
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.user.fullName}, you have requested to permanently delete your Zosh Bazaar account. Enter this code to verify your identity:
          </p>
          ${OtpBox(data.otp, data.validityMinutes)}
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; font-size: 12px; color: #991b1b; margin-top: 12px;">
            <strong>Warning:</strong> Deleting your account will permanently remove your profile, saved addresses, and active wishlists.
          </div>
          ${EmailFooter({ category: EmailCategory.SECURITY, recipientEmail: data.user.email })}
        `,
      });
    },
  },

  // 14. Account Deletion Scheduled (Grace Period Started)
  "customer.account.deletion_scheduled": {
    templateKey: "customer.account.deletion_scheduled",
    category: EmailCategory.TRANSACTIONAL,
    recipientRole: EmailRecipientRole.CUSTOMER,
    priority: EmailPriority.HIGH,
    subject: () => "Zosh Bazaar — Account Deletion Confirmed",
    preheader: "Your account deletion request has been confirmed and scheduled.",
    render: (rawData) => {
      const data = formatAuthViewModel(rawData);
      const deletionDate = rawData.deletionDate ? new Date(rawData.deletionDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "in 30 days";
      const graceDays = rawData.gracePeriodDays || 30;

      return EmailLayout({
        title: "Account Deletion Scheduled",
        preheader: "Your account deletion request has been confirmed and scheduled.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Scheduled", variant: "warning" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #dc2626;">
            Account Deletion Confirmed
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.user.fullName}, your account deletion request has been registered.
          </p>
          <div style="background: #fef2f2; border-radius: 8px; border: 1px solid #fecaca; padding: 16px; margin: 16px 0;">
            <div style="font-size: 14px; font-weight: 800; color: #dc2626;">
              Permanent Deletion Date: ${deletionDate}
            </div>
            <div style="font-size: 13px; color: #64748b; margin-top: 4px;">
              You have a <strong>${graceDays}-day grace period</strong> to change your mind.
            </div>
          </div>
          <p style="font-size: 13px; color: #475569; line-height: 1.5;" class="dark-text-muted">
            <strong>To cancel this deletion:</strong> Simply sign in to your Zosh Bazaar account before the deadline and select "Cancel Deletion" in Account Settings.
          </p>
          ${Button({ href: data.actionUrl || "http://localhost:5173/account/delete-account", label: "Review Deletion Status" })}
          ${EmailFooter({ category: EmailCategory.TRANSACTIONAL, recipientEmail: data.user.email })}
        `,
      });
    },
  },

  // 15. Account Deletion Cancelled
  "customer.account.deletion_cancelled": {
    templateKey: "customer.account.deletion_cancelled",
    category: EmailCategory.TRANSACTIONAL,
    recipientRole: EmailRecipientRole.CUSTOMER,
    priority: EmailPriority.HIGH,
    subject: () => "Zosh Bazaar — Account Deletion Cancelled",
    preheader: "Your account deletion request was cancelled. Your account is active.",
    render: (rawData) => {
      const data = formatAuthViewModel(rawData);
      return EmailLayout({
        title: "Account Deletion Cancelled",
        preheader: "Your account deletion request was cancelled. Your account is active.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Restored", variant: "success" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #16a34a;">
            Account Deletion Cancelled
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.user.fullName}, your account deletion request has been successfully cancelled. Your account remains fully active and all your data is intact.
          </p>
          ${Card({
            children: `
              <div style="font-size: 13px; color: #475569; line-height: 1.5;" class="dark-text-muted">
                Happy shopping! Your cart, orders, and saved addresses are ready whenever you are. 🛍️
              </div>
            `,
          })}
          ${Button({ href: "http://localhost:5173", label: "Return to Marketplace" })}
          ${EmailFooter({ category: EmailCategory.TRANSACTIONAL, recipientEmail: data.user.email })}
        `,
      });
    },
  },

  // 16. Account Permanently Deleted
  "customer.account.permanently_deleted": {
    templateKey: "customer.account.permanently_deleted",
    category: EmailCategory.TRANSACTIONAL,
    recipientRole: EmailRecipientRole.CUSTOMER,
    priority: EmailPriority.HIGH,
    subject: () => "Zosh Bazaar — Account Permanently Deleted",
    preheader: "Your Zosh Bazaar account and personal data have been removed.",
    render: (rawData) => {
      const data = formatAuthViewModel(rawData);
      return EmailLayout({
        title: "Account Permanently Deleted",
        preheader: "Your Zosh Bazaar account and personal data have been removed.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Closed", variant: "neutral" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a;" class="dark-text-main">
            Account Permanently Deleted
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.user.fullName}, your Zosh Bazaar account has been permanently deleted as scheduled.
          </p>
          ${Card({
            title: "Actions Taken",
            children: `
              <ul style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.6; color: #475569;" class="dark-text-muted">
                <li>Personal profile, login credentials, and saved addresses have been deleted.</li>
                <li>Saved items, cart products, and wishlists have been purged.</li>
                <li>Commercial order history is retained in an anonymized format for statutory tax compliance.</li>
              </ul>
            `,
          })}
          <p style="font-size: 13px; color: #64748b; margin-top: 14px;">
            If you ever wish to shop with Zosh Bazaar again, you are always welcome to register a new account.
          </p>
          ${EmailFooter({ category: EmailCategory.TRANSACTIONAL, recipientEmail: data.user.email })}
        `,
      });
    },
  },
};
