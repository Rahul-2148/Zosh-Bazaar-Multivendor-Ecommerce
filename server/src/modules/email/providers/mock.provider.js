import { EmailProvider } from "./email.provider.js";
import crypto from "crypto";

export class MockEmailProvider extends EmailProvider {
  constructor() {
    super("mock");
    this.sentEmails = [];
    this.shouldFailNext = false;
    this.failReason = "Simulated mock provider failure";
  }

  async send(options) {
    if (this.shouldFailNext) {
      this.shouldFailNext = false;
      throw new Error(this.failReason);
    }

    const messageId = `<mock-${crypto.randomUUID()}@zoshbazaar.dev>`;
    const record = {
      messageId,
      sentAt: new Date(),
      ...options,
    };

    this.sentEmails.push(record);

    if (process.env.NODE_ENV !== "test") {
      console.log(`📨 [MOCK EMAIL SENT] To: ${options.to} | Subject: "${options.subject}" | MessageId: ${messageId}`);
    }

    return {
      success: true,
      messageId,
      rawResponse: { accepted: [options.to], mock: true },
    };
  }

  async verify() {
    return true;
  }

  clear() {
    this.sentEmails = [];
  }

  getLastEmail() {
    return this.sentEmails[this.sentEmails.length - 1] || null;
  }

  getEmailsByRecipient(email) {
    return this.sentEmails.filter((e) => e.to.toLowerCase() === email.toLowerCase());
  }

  simulateFailure(reason = "Simulated transient failure") {
    this.shouldFailNext = true;
    this.failReason = reason;
  }
}
