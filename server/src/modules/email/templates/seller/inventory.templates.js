import {
  EmailLayout,
  EmailHeader,
  EmailFooter,
  Button,
  emailConfig,
} from "../shared/index.js";
import { EmailCategory, EmailPriority, EmailRecipientRole } from "../../core/email.types.js";
import { formatSellerViewModel } from "../../schemas/seller.schema.js";

export const sellerInventoryTemplates = {
  // 1. Low Stock Alert
  "seller.inventory.low_stock": {
    templateKey: "seller.inventory.low_stock",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.SELLER,
    priority: EmailPriority.HIGH,
    subject: (data) => `Low Stock Alert: "${data.productTitle || "Product"}" has only ${data.stockRemaining || 0} unit(s) left ⚠️`,
    preheader: "Replenish inventory to avoid missing sales opportunities.",
    render: (rawData) => {
      const data = formatSellerViewModel(rawData);
      return EmailLayout({
        title: "Low Stock Alert",
        preheader: "Replenish inventory to avoid missing sales opportunities.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Low Inventory", variant: "warning" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #d97706;">
            Low Stock Warning
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.seller.sellerName}, inventory for <strong>"${data.productTitle}"</strong> has fallen below your threshold. Remaining: <strong>${data.stockRemaining} units</strong>.
          </p>
          ${Button({ href: emailConfig.sellerUrl + "/inventory", label: "Restock Product Now", fullWidth: true })}
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: data.seller.email })}
        `,
      });
    },
  },

  // 2. Out of Stock Alert
  "seller.inventory.out_of_stock": {
    templateKey: "seller.inventory.out_of_stock",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.SELLER,
    priority: EmailPriority.HIGH,
    subject: (data) => `Out of Stock: "${data.productTitle || "Product"}" is no longer purchasable ❌`,
    preheader: "Product has been temporarily delisted from search until inventory is updated.",
    render: (rawData) => {
      const data = formatSellerViewModel(rawData);
      return EmailLayout({
        title: "Out of Stock",
        preheader: "Product has been temporarily delisted from search until inventory is updated.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Out of Stock", variant: "danger" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #dc2626;">
            Product Stock Exhausted
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.seller.sellerName}, <strong>"${data.productTitle}"</strong> has 0 inventory available. The product listing is paused for customers until you restock.
          </p>
          ${Button({ href: emailConfig.sellerUrl + "/inventory", label: "Update Stock Levels", variant: "danger", fullWidth: true })}
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: data.seller.email })}
        `,
      });
    },
  },

  // 3. Stock Replenishment Reminder
  "seller.inventory.replenishment_reminder": {
    templateKey: "seller.inventory.replenishment_reminder",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.SELLER,
    priority: EmailPriority.NORMAL,
    subject: (data) => `Weekly Restock Recommendation for ${data.seller?.storeName || "Your Store"}`,
    preheader: "Based on current sales velocity, review suggested inventory replenishment.",
    render: (rawData) => {
      const data = formatSellerViewModel(rawData);
      return EmailLayout({
        title: "Restock Recommendation",
        preheader: "Review suggested inventory replenishment.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Inventory Insights", variant: "info" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a;" class="dark-text-main">
            Weekly Inventory Insights
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.seller.sellerName}, several high-demand products in your store are projected to stock out within 7 days based on recent sales trends.
          </p>
          ${Button({ href: emailConfig.sellerUrl + "/inventory/forecast", label: "View Replenishment Report" })}
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: data.seller.email })}
        `,
      });
    },
  },

  // 4. Variant Stock Alert
  "seller.inventory.variant_stock_alert": {
    templateKey: "seller.inventory.variant_stock_alert",
    category: EmailCategory.OPERATIONAL,
    recipientRole: EmailRecipientRole.SELLER,
    priority: EmailPriority.NORMAL,
    subject: (data) => `Variant Stock Alert: Specific SKU running low for "${data.productTitle || "Product"}"`,
    preheader: "A specific color/size variant is running out of stock.",
    render: (rawData) => {
      const data = formatSellerViewModel(rawData);
      return EmailLayout({
        title: "Variant Low Stock",
        preheader: "A specific color/size variant is running out of stock.",
        children: `
          ${EmailHeader({ roleBadge: { label: "SKU Alert", variant: "warning" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #d97706;">
            Variant Stock Notice
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.seller.sellerName}, one of the variants of <strong>"${data.productTitle}"</strong> has reached low stock thresholds (${data.stockRemaining} units left).
          </p>
          ${Button({ href: emailConfig.sellerUrl + "/inventory", label: "Manage Variants" })}
          ${EmailFooter({ category: EmailCategory.OPERATIONAL, recipientEmail: data.seller.email })}
        `,
      });
    },
  },

  // 5. Product Approved
  "seller.catalog.product_approved": {
    templateKey: "seller.catalog.product_approved",
    category: EmailCategory.TRANSACTIONAL,
    recipientRole: EmailRecipientRole.SELLER,
    priority: EmailPriority.NORMAL,
    subject: (data) => `Product Approved: "${data.productTitle || "New Listing"}" is ready to sell! 🎉`,
    preheader: "Your product listing passed catalog quality moderation.",
    render: (rawData) => {
      const data = formatSellerViewModel(rawData);
      return EmailLayout({
        title: "Product Approved",
        preheader: "Your product listing passed catalog quality moderation.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Catalog Approved", variant: "success" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #16a34a;">
            Product Approved & Ready
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.seller.sellerName}, <strong>"${data.productTitle}"</strong> has been approved by catalog moderators and is discoverable by shoppers.
          </p>
          ${Button({ href: emailConfig.sellerUrl + "/products", label: "View Active Products" })}
          ${EmailFooter({ category: EmailCategory.TRANSACTIONAL, recipientEmail: data.seller.email })}
        `,
      });
    },
  },

  // 6. Product Rejected
  "seller.catalog.product_rejected": {
    templateKey: "seller.catalog.product_rejected",
    category: EmailCategory.TRANSACTIONAL,
    recipientRole: EmailRecipientRole.SELLER,
    priority: EmailPriority.HIGH,
    subject: (data) => `Listing Rejected: "${data.productTitle || "Product Listing"}"`,
    preheader: "Your product listing did not meet marketplace quality guidelines.",
    render: (rawData) => {
      const data = formatSellerViewModel(rawData);
      return EmailLayout({
        title: "Product Rejected",
        preheader: "Your product listing did not meet marketplace quality guidelines.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Review Failed", variant: "danger" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #dc2626;">
            Listing Needs Revision
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.seller.sellerName}, <strong>"${data.productTitle}"</strong> was rejected during catalog moderation.
            ${data.reason ? `<br /><br /><strong>Moderation Notes:</strong> ${data.reason}` : ""}
          </p>
          ${Button({ href: emailConfig.sellerUrl + "/products", label: "Edit & Resubmit Listing", variant: "danger" })}
          ${EmailFooter({ category: EmailCategory.TRANSACTIONAL, recipientEmail: data.seller.email })}
        `,
      });
    },
  },

  // 7. Product Published
  "seller.catalog.product_published": {
    templateKey: "seller.catalog.product_published",
    category: EmailCategory.TRANSACTIONAL,
    recipientRole: EmailRecipientRole.SELLER,
    priority: EmailPriority.NORMAL,
    subject: (data) => `Product Live: "${data.productTitle || "Product"}" is now live on Zosh Bazaar`,
    preheader: "Your product is now actively featured and searchable.",
    render: (rawData) => {
      const data = formatSellerViewModel(rawData);
      return EmailLayout({
        title: "Product Published",
        preheader: "Your product is now actively featured and searchable.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Live", variant: "success" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #16a34a;">
            Product Published
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.seller.sellerName}, <strong>"${data.productTitle}"</strong> is live and indexed in marketplace search.
          </p>
          ${Button({ href: emailConfig.sellerUrl + "/products", label: "View Listing" })}
          ${EmailFooter({ category: EmailCategory.TRANSACTIONAL, recipientEmail: data.seller.email })}
        `,
      });
    },
  },

  // 8. Product Unpublished
  "seller.catalog.product_unpublished": {
    templateKey: "seller.catalog.product_unpublished",
    category: EmailCategory.TRANSACTIONAL,
    recipientRole: EmailRecipientRole.SELLER,
    priority: EmailPriority.NORMAL,
    subject: (data) => `Listing Hidden: "${data.productTitle || "Product"}" has been unpublished`,
    preheader: "Product has been deactivated from active marketplace display.",
    render: (rawData) => {
      const data = formatSellerViewModel(rawData);
      return EmailLayout({
        title: "Product Unpublished",
        preheader: "Product has been deactivated from active marketplace display.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Deactivated", variant: "neutral" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a;" class="dark-text-main">
            Listing Deactivated
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.seller.sellerName}, <strong>"${data.productTitle}"</strong> has been removed from public display as requested or due to merchant settings.
          </p>
          ${Button({ href: emailConfig.sellerUrl + "/products", label: "Manage Catalog" })}
          ${EmailFooter({ category: EmailCategory.TRANSACTIONAL, recipientEmail: data.seller.email })}
        `,
      });
    },
  },
};
