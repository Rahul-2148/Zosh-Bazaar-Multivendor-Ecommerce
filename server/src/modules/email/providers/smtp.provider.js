import { NodemailerProvider } from "./nodemailer.provider.js";

/**
 * Standard RFC-compliant SMTP Provider
 */
export class SmtpProvider extends NodemailerProvider {
  constructor(customConfig = {}) {
    super({
      host: process.env.SMTP_HOST || customConfig.host || "smtp.mailtrap.io",
      port: Number(process.env.SMTP_PORT) || customConfig.port || 587,
      secure: process.env.SMTP_SECURE === "true",
      user: process.env.SMTP_USER || customConfig.user || "",
      password: process.env.SMTP_PASSWORD || customConfig.password || "",
      ...customConfig,
    });
    this.name = "smtp";
  }
}
