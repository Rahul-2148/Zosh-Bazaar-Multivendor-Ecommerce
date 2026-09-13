import nodemailer from "nodemailer";
import { EmailProvider } from "./email.provider.js";
import { emailConfig } from "../config/email.config.js";
import { TransientEmailError, PermanentEmailError } from "../core/email.errors.js";

export class NodemailerProvider extends EmailProvider {
  constructor(customConfig = {}) {
    super("nodemailer");
    this.config = { ...emailConfig, ...customConfig };
    this.transporter = null;
    this.initTransporter();
  }

  initTransporter() {
    const isGmailService = this.config.host.includes("gmail.com");

    const transportOptions = isGmailService
      ? {
          service: "gmail",
          auth: {
            user: this.config.user,
            pass: this.config.password,
          },
        }
      : {
          host: this.config.host,
          port: this.config.port,
          secure: this.config.secure,
          auth: {
            user: this.config.user,
            pass: this.config.password,
          },
          pool: this.config.pool,
          maxConnections: this.config.maxConnections,
          maxMessages: this.config.maxMessages,
          connectionTimeout: this.config.connectionTimeoutMs,
          greetingTimeout: this.config.greetingTimeoutMs,
          socketTimeout: this.config.socketTimeoutMs,
        };

    this.transporter = nodemailer.createTransport(transportOptions);
  }

  async verify() {
    if (!this.config.user || !this.config.password) {
      console.warn("[NodemailerProvider] SMTP credentials missing. Verification skipped.");
      return false;
    }
    try {
      await this.transporter.verify();
      return true;
    } catch (err) {
      console.error("[NodemailerProvider] Connection verification failed:", err.message);
      return false;
    }
  }

  async send(options) {
    const { to, subject, html, text, from, replyTo, attachments, headers } = options;

    if (!to) {
      throw new PermanentEmailError("Recipient email address 'to' is required");
    }
    if (!subject) {
      throw new PermanentEmailError("Email 'subject' is required");
    }
    if (!html && !text) {
      throw new PermanentEmailError("Email body ('html' or 'text') is required");
    }

    const mailOptions = {
      from: from || `"${this.config.fromName}" <${this.config.fromAddress}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
      replyTo: replyTo || this.config.replyTo,
      attachments: attachments || [],
      headers: headers || {},
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      return {
        success: true,
        messageId: info.messageId,
        rawResponse: info,
      };
    } catch (error) {
      // Categorize error as transient (retryable) or permanent (reject)
      const errCode = error.code || "";
      const isTransient =
        errCode === "ETIMEDOUT" ||
        errCode === "ECONNRESET" ||
        errCode === "ECONNREFUSED" ||
        errCode === "ENOTFOUND" ||
        errCode === "ESOCKET" ||
        (error.responseCode && error.responseCode >= 400 && error.responseCode < 500);

      if (isTransient) {
        throw new TransientEmailError(`SMTP transient delivery failure: ${error.message}`, {
          code: errCode,
          response: error.response,
        });
      }

      throw new PermanentEmailError(`SMTP permanent delivery failure: ${error.message}`, {
        code: errCode,
        response: error.response,
      });
    }
  }
}
