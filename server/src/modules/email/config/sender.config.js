/**
 * Zosh Bazaar Email Platform — Role & Purpose Specific Sender Config
 */

import { emailConfig } from "./email.config.js";
import { EmailCategory, EmailRecipientRole } from "../core/email.types.js";

export const senderProfiles = Object.freeze({
  DEFAULT: {
    fromName: "Zosh Bazaar",
    fromAddress: emailConfig.fromAddress,
    replyTo: emailConfig.replyTo,
  },
  ORDERS: {
    fromName: "Zosh Bazaar Orders",
    fromAddress: process.env.EMAIL_ORDERS_ADDRESS || emailConfig.fromAddress,
    replyTo: "orders@zoshbazaar.com",
  },
  SECURITY: {
    fromName: "Zosh Bazaar Security",
    fromAddress: process.env.EMAIL_SECURITY_ADDRESS || emailConfig.fromAddress,
    replyTo: "security@zoshbazaar.com",
  },
  SELLER_SERVICES: {
    fromName: "Zosh Bazaar Merchant Services",
    fromAddress: process.env.EMAIL_SELLER_ADDRESS || emailConfig.fromAddress,
    replyTo: "merchants@zoshbazaar.com",
  },
  LOGISTICS: {
    fromName: "Zosh Logistics Operations",
    fromAddress: process.env.EMAIL_LOGISTICS_ADDRESS || emailConfig.fromAddress,
    replyTo: "logistics@zoshbazaar.com",
  },
  ADMIN_ALERTS: {
    fromName: "Zosh Bazaar Platform Ops",
    fromAddress: process.env.EMAIL_SYSTEM_ADDRESS || emailConfig.fromAddress,
    replyTo: "platform-ops@zoshbazaar.com",
  },
  MARKETING: {
    fromName: "Zosh Bazaar Discovery",
    fromAddress: process.env.EMAIL_MARKETING_ADDRESS || emailConfig.fromAddress,
    replyTo: "newsletter@zoshbazaar.com",
  },
});

/**
 * Resolves the appropriate sender profile given role and category.
 */
export function getSenderProfile(role, category) {
  if (category === EmailCategory.SECURITY) {
    return senderProfiles.SECURITY;
  }
  if (category === EmailCategory.MARKETING) {
    return senderProfiles.MARKETING;
  }
  if (role === EmailRecipientRole.SELLER) {
    return senderProfiles.SELLER_SERVICES;
  }
  if (role === EmailRecipientRole.LOGISTICS || role === EmailRecipientRole.DELIVERY_PARTNER) {
    return senderProfiles.LOGISTICS;
  }
  if (role === EmailRecipientRole.ADMIN || role === EmailRecipientRole.SYSTEM) {
    return senderProfiles.ADMIN_ALERTS;
  }
  return senderProfiles.ORDERS;
}
