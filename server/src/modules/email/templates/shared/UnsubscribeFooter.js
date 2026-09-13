import { brandConfig } from "../../config/brand.config.js";

export function UnsubscribeFooter({ recipientEmail = "" }) {
  const { colors, urls } = brandConfig;
  const encodedEmail = encodeURIComponent(recipientEmail || "");
  const prefsUrl = `${urls.unsubscribe}?email=${encodedEmail}`;

  return `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 16px; border-top: 1px dashed ${colors.border}; padding-top: 12px;">
      <tr>
        <td align="center" style="font-size: 11px; color: ${colors.textMuted}; line-height: 1.4;">
          You received this message because you subscribed to updates from Zosh Bazaar.<br />
          <a href="${prefsUrl}" target="_blank" style="color: ${colors.primary}; text-decoration: underline;">Manage Preferences</a>
          &nbsp;&bull;&nbsp;
          <a href="${prefsUrl}&optout=all" target="_blank" style="color: ${colors.textMuted}; text-decoration: underline;">Unsubscribe from marketing emails</a>
        </td>
      </tr>
    </table>
  `;
}
