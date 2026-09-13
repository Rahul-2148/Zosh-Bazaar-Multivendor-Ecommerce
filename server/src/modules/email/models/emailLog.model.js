import mongoose from "mongoose";
import { EmailDeliveryStatus, EmailCategory, EmailRecipientRole, EmailPriority } from "../core/email.types.js";

const emailLogSchema = new mongoose.Schema(
  {
    messageId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    idempotencyKey: {
      type: String,
      index: true,
      default: null,
    },
    templateKey: {
      type: String,
      required: true,
      index: true,
    },
    templateVersion: {
      type: String,
      default: "v1",
    },
    recipient: {
      type: String,
      required: true,
      index: true,
      trim: true,
      lowercase: true,
    },
    recipientType: {
      type: String,
      enum: Object.values(EmailRecipientRole),
      default: EmailRecipientRole.CUSTOMER,
      index: true,
    },
    category: {
      type: String,
      enum: Object.values(EmailCategory),
      default: EmailCategory.TRANSACTIONAL,
      index: true,
    },
    priority: {
      type: String,
      enum: Object.values(EmailPriority),
      default: EmailPriority.NORMAL,
    },
    subject: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(EmailDeliveryStatus),
      default: EmailDeliveryStatus.PENDING,
      index: true,
    },
    attemptCount: {
      type: Number,
      default: 0,
    },
    provider: {
      type: String,
      default: "nodemailer",
    },
    providerMessageId: {
      type: String,
      default: null,
    },
    failureReason: {
      type: String,
      default: null,
    },
    relatedEntityType: {
      type: String,
      default: null,
      index: true,
    },
    relatedEntityId: {
      type: String,
      default: null,
      index: true,
    },
    sentAt: {
      type: Date,
      default: null,
    },
    failedAt: {
      type: Date,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

emailLogSchema.index({ recipient: 1, createdAt: -1 });
emailLogSchema.index({ templateKey: 1, createdAt: -1 });
emailLogSchema.index({ status: 1, createdAt: -1 });

export const EmailLog = mongoose.model("EmailLog", emailLogSchema);
export default EmailLog;
