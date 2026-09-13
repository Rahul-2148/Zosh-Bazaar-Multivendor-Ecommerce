import {
  EmailLayout,
  EmailHeader,
  EmailFooter,
  Button,
  Card,
  emailConfig,
} from "../shared/index.js";
import { EmailCategory, EmailPriority, EmailRecipientRole } from "../../core/email.types.js";
import { formatOrderViewModel } from "../../schemas/order.schema.js";
import { enIN } from "../../localization/en-IN/messages.js";

export const customerEngagementTemplates = {
  // 1. Review Request
  "customer.engagement.review_request": {
    templateKey: "customer.engagement.review_request",
    category: EmailCategory.MARKETING,
    recipientRole: EmailRecipientRole.CUSTOMER,
    priority: EmailPriority.LOW,
    subject: (data) => `How was your recent purchase, ${data.user?.fullName || "there"}? ⭐`,
    preheader: "Share your product feedback and help fellow shoppers.",
    render: (rawData) => {
      const data = formatOrderViewModel(rawData);
      const firstItem = data.items[0] || { title: "Your purchased product" };
      return EmailLayout({
        title: "Rate & Review",
        preheader: "Share your product feedback and help fellow shoppers.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Review", variant: "info" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a;" class="dark-text-main">
            How was your "${firstItem.title}"?
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.user.fullName}, you recently received order #${data.orderId}. Your honest review helps thousands of shoppers choose the best products on Zosh Bazaar.
          </p>
          ${Button({ href: `${data.orderUrl}/review`, label: "Write a 1-Minute Review", fullWidth: true })}
          ${EmailFooter({ category: EmailCategory.MARKETING, recipientEmail: data.user.email })}
        `,
      });
    },
  },

  // 2. Review Reminder
  "customer.engagement.review_reminder": {
    templateKey: "customer.engagement.review_reminder",
    category: EmailCategory.MARKETING,
    recipientRole: EmailRecipientRole.CUSTOMER,
    priority: EmailPriority.LOW,
    subject: () => "Reminder: Leave a review on your recent Zosh Bazaar purchase",
    preheader: "We'd love to hear your thoughts on your recent delivery.",
    render: (rawData) => {
      const data = formatOrderViewModel(rawData);
      return EmailLayout({
        title: "Review Reminder",
        preheader: "We'd love to hear your thoughts on your recent delivery.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Feedback", variant: "neutral" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a;" class="dark-text-main">
            Still loving your item?
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.user.fullName}, take 30 seconds to rate your purchase for order #${data.orderId}.
          </p>
          ${Button({ href: `${data.orderUrl}/review`, label: "Rate Product Now" })}
          ${EmailFooter({ category: EmailCategory.MARKETING, recipientEmail: data.user.email })}
        `,
      });
    },
  },

  // 3. Review Published
  "customer.engagement.review_published": {
    templateKey: "customer.engagement.review_published",
    category: EmailCategory.TRANSACTIONAL,
    recipientRole: EmailRecipientRole.CUSTOMER,
    priority: EmailPriority.NORMAL,
    subject: () => "Your product review is live on Zosh Bazaar!",
    preheader: "Thank you for contributing to the Zosh Bazaar community.",
    render: (rawData) => {
      const data = formatOrderViewModel(rawData);
      return EmailLayout({
        title: "Review Published",
        preheader: "Thank you for contributing to the Zosh Bazaar community.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Review Live", variant: "success" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #16a34a;">
            Your Review is Live!
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.user.fullName}, thank you for your helpful feedback. Your review has been approved and is now visible to millions of customers.
          </p>
          ${Button({ href: data.orderUrl, label: "View Published Review" })}
          ${EmailFooter({ category: EmailCategory.TRANSACTIONAL, recipientEmail: data.user.email })}
        `,
      });
    },
  },

  // 4. Seller Reply
  "customer.engagement.seller_reply": {
    templateKey: "customer.engagement.seller_reply",
    category: EmailCategory.TRANSACTIONAL,
    recipientRole: EmailRecipientRole.CUSTOMER,
    priority: EmailPriority.NORMAL,
    subject: () => "A merchant replied to your product review on Zosh Bazaar",
    preheader: "The verified vendor has answered your feedback.",
    render: (rawData) => {
      const data = formatOrderViewModel(rawData);
      return EmailLayout({
        title: "Seller Reply",
        preheader: "The verified vendor has answered your feedback.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Seller Response", variant: "info" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a;" class="dark-text-main">
            Merchant Response Received
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.user.fullName}, the vendor for your product has posted a response to your review.
          </p>
          ${Button({ href: data.orderUrl, label: "Read Merchant Response" })}
          ${EmailFooter({ category: EmailCategory.TRANSACTIONAL, recipientEmail: data.user.email })}
        `,
      });
    },
  },

  // 5. Price Drop Alert
  "customer.engagement.price_drop": {
    templateKey: "customer.engagement.price_drop",
    category: EmailCategory.MARKETING,
    recipientRole: EmailRecipientRole.CUSTOMER,
    priority: EmailPriority.NORMAL,
    subject: (data) => `Price Drop Alert: "${data.productTitle || "An item on your wishlist"}" just dropped in price! 📉`,
    preheader: "An item you saved is now available at a discounted price.",
    render: (rawData) => {
      const data = formatOrderViewModel(rawData);
      const title = rawData.productTitle || "Wireless Noise-Cancelling Headphones";
      const oldPrice = Number(rawData.oldPrice) || 2999;
      const newPrice = Number(rawData.newPrice) || 2199;
      const savings = oldPrice - newPrice;

      return EmailLayout({
        title: "Price Drop Alert",
        preheader: "An item you saved is now available at a discounted price.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Price Drop", variant: "success" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #16a34a;">
            Price Drop on Saved Item!
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.user.fullName}, an item from your wishlist just dropped by <strong>${enIN.formatCurrency(savings)}</strong>!
          </p>
          ${Card({
            children: `
              <div style="font-size: 15px; font-weight: 700; color: #0f172a;">${title}</div>
              <div style="margin-top: 8px;">
                <span style="font-size: 20px; font-weight: 800; color: #16a34a;">${enIN.formatCurrency(newPrice)}</span>
                <span style="font-size: 14px; color: #94a3b8; text-decoration: line-through; margin-left: 8px;">${enIN.formatCurrency(oldPrice)}</span>
              </div>
            `,
          })}
          ${Button({ href: rawData.productUrl || emailConfig.clientUrl, label: "Buy at Discounted Price", fullWidth: true })}
          ${EmailFooter({ category: EmailCategory.MARKETING, recipientEmail: data.user.email })}
        `,
      });
    },
  },

  // 6. Back in Stock
  "customer.engagement.back_in_stock": {
    templateKey: "customer.engagement.back_in_stock",
    category: EmailCategory.MARKETING,
    recipientRole: EmailRecipientRole.CUSTOMER,
    priority: EmailPriority.NORMAL,
    subject: (data) => `Back in Stock: "${data.productTitle || "Your saved product"}" is available again! 🎉`,
    preheader: "A popular item on your wishlist has just been restocked.",
    render: (rawData) => {
      const data = formatOrderViewModel(rawData);
      const title = rawData.productTitle || "Designer Linen Shirt";
      return EmailLayout({
        title: "Back in Stock",
        preheader: "A popular item on your wishlist has just been restocked.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Restocked", variant: "info" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a;" class="dark-text-main">
            It's Back in Stock!
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.user.fullName}, the wait is over! <strong>"${title}"</strong> has just been restocked by the seller. Grab yours before stock runs out again.
          </p>
          ${Button({ href: rawData.productUrl || emailConfig.clientUrl, label: "View Product", fullWidth: true })}
          ${EmailFooter({ category: EmailCategory.MARKETING, recipientEmail: data.user.email })}
        `,
      });
    },
  },

  // 7. Low Stock
  "customer.engagement.low_stock": {
    templateKey: "customer.engagement.low_stock",
    category: EmailCategory.MARKETING,
    recipientRole: EmailRecipientRole.CUSTOMER,
    priority: EmailPriority.LOW,
    subject: (data) => `Low Stock: Only a few units left of "${data.productTitle || "your saved item"}"`,
    preheader: "Hurry! An item in your wishlist has limited inventory remaining.",
    render: (rawData) => {
      const data = formatOrderViewModel(rawData);
      const title = rawData.productTitle || "Smart Fitness Tracker";
      return EmailLayout({
        title: "Low Stock Alert",
        preheader: "Limited inventory remaining on your saved item.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Selling Fast", variant: "warning" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #d97706;">
            Limited Stock Remaining
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.user.fullName}, <strong>"${title}"</strong> is selling fast and only a few units remain with our merchants.
          </p>
          ${Button({ href: rawData.productUrl || emailConfig.clientUrl, label: "Check Availability" })}
          ${EmailFooter({ category: EmailCategory.MARKETING, recipientEmail: data.user.email })}
        `,
      });
    },
  },

  // 8. Abandoned Cart
  "customer.engagement.abandoned_cart": {
    templateKey: "customer.engagement.abandoned_cart",
    category: EmailCategory.MARKETING,
    recipientRole: EmailRecipientRole.CUSTOMER,
    priority: EmailPriority.LOW,
    subject: () => "Did you leave something behind in your Zosh Bazaar cart?",
    preheader: "Your cart items are saved and waiting for you. Complete your order today.",
    render: (rawData) => {
      const data = formatOrderViewModel(rawData);
      return EmailLayout({
        title: "Cart Reminder",
        preheader: "Your cart items are saved and waiting for you.",
        children: `
          ${EmailHeader({ roleBadge: { label: "Saved Cart", variant: "info" } })}
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a;" class="dark-text-main">
            Your Cart is Waiting!
          </h2>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;" class="dark-text-muted">
            Hi ${data.user.fullName}, you left items in your shopping bag. Return now to secure current promotional pricing and express delivery options.
          </p>
          ${Button({ href: emailConfig.clientUrl + "/cart", label: "Review & Checkout Cart", fullWidth: true })}
          ${EmailFooter({ category: EmailCategory.MARKETING, recipientEmail: data.user.email })}
        `,
      });
    },
  },
};
