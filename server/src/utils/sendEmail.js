import { emailService } from "../modules/email/core/email.service.js";

/**
 * Enterprise Legacy Adapter
 * Preserves full backwards-compatibility for existing call signatures
 * while delegating dispatches to the new EmailPlatform architecture.
 *
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} body - HTML or plain text body
 */
export async function sendVerificationEmail(to, subject, body) {
  try {
    return await emailService.sendDirect({
      to,
      subject,
      html: body,
      text: body.replace(/<[^>]*>?/gm, ""),
    });
  } catch (error) {
    console.error("[sendEmail:LegacyAdapter] Error delegating to emailService:", error.message);
    throw error;
  }
}

export default sendVerificationEmail;