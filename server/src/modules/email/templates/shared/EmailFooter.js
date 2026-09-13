import { brandConfig } from "../../config/brand.config.js";
import { SocialLinks } from "./SocialLinks.js";
import { UnsubscribeFooter } from "./UnsubscribeFooter.js";
import { EmailCategory } from "../../core/email.types.js";

export function EmailFooter({
  category = EmailCategory.TRANSACTIONAL,
  recipientEmail = "",
}) {
  const { colors, urls, support, legalEntityName } = brandConfig;
  const isMarketing = category === EmailCategory.MARKETING;

  return `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 32px; border-top: 1px solid ${colors.border}; padding-top: 24px;" class="dark-border">
      <tr>
        <td align="center">
          ${SocialLinks()}
          <div style="font-size: 11px; color: ${colors.textMuted}; line-height: 1.5; margin: 10px 0;" class="dark-text-muted">
            &copy; ${new Date().getFullYear()} ${legalEntityName}. All rights reserved.<br />
            ${support.address.line1}, ${support.address.line2}, ${support.address.city}, ${support.address.state} - ${support.address.pincode}, ${support.address.country}
          </div>
          <div style="font-size: 11px; color: ${colors.textMuted}; margin: 8px 0;" class="dark-text-muted">
            <a href="${urls.helpCenter}" target="_blank" style="color: ${colors.textMuted}; text-decoration: underline;">Help Center</a>
            &nbsp;&bull;&nbsp;
            <a href="${urls.privacyPolicy}" target="_blank" style="color: ${colors.textMuted}; text-decoration: underline;">Privacy Policy</a>
            &nbsp;&bull;&nbsp;
            <a href="${urls.termsOfService}" target="_blank" style="color: ${colors.textMuted}; text-decoration: underline;">Terms of Service</a>
          </div>
          ${
            isMarketing
              ? UnsubscribeFooter({ recipientEmail })
              : `<div style="font-size: 10px; color: ${colors.textMuted}; margin-top: 10px;" class="dark-text-muted">
                  This is an essential service notification related to your Zosh Bazaar account or order.
                </div>`
          }
        </td>
      </tr>
    </table>
  `;
}
