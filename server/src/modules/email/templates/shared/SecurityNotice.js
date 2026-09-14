import { brandConfig } from "../../config/brand.config.js";

export function SecurityNotice({
  ipAddress = "",
  device = "",
  location = "",
  timestamp = "",
  severity = "MEDIUM",
  supportUrl = brandConfig.urls.helpCenter,
}) {
  const { colors } = brandConfig;
  const isHigh = severity === "HIGH" || severity === "CRITICAL";
  const bg = isHigh ? "#fef2f2" : "#fffbeb";
  const border = isHigh ? colors.danger : colors.warning;
  const fg = isHigh ? "#991b1b" : "#92400e";

  return `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="security-notice-table" style="background-color: ${bg}; border: 1px solid ${border}; border-radius: 8px; margin: 20px 0; border-collapse: separate !important;">
      <tr>
        <td class="security-notice-cell" style="padding: 16px 20px; vertical-align: top;">
          <div style="font-size: 13px; font-weight: 800; color: ${fg}; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
            &#9888; Security Advisory (${severity})
          </div>
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 13px; color: ${fg}; border-collapse: collapse;">
            ${timestamp ? `<tr><td style="padding: 3px 0; width: 90px; font-weight: bold; color: ${fg};">Time:</td><td style="padding: 3px 0; color: ${fg};">${timestamp}</td></tr>` : ""}
            ${ipAddress ? `<tr><td style="padding: 3px 0; font-weight: bold; color: ${fg};">IP Address:</td><td style="padding: 3px 0; color: ${fg};">${ipAddress}</td></tr>` : ""}
            ${device ? `<tr><td style="padding: 3px 0; font-weight: bold; color: ${fg};">Device:</td><td style="padding: 3px 0; color: ${fg};">${device}</td></tr>` : ""}
            ${location ? `<tr><td style="padding: 3px 0; font-weight: bold; color: ${fg};">Location:</td><td style="padding: 3px 0; color: ${fg};">${location}</td></tr>` : ""}
          </table>
          <div style="margin-top: 12px; font-size: 12px; color: ${fg}; line-height: 1.5;">
            If this wasn't you, your account may be compromised. <a href="${supportUrl}" style="color: ${fg}; font-weight: bold; text-decoration: underline;">Secure your account immediately &rarr;</a>
          </div>
        </td>
      </tr>
    </table>
  `;
}
