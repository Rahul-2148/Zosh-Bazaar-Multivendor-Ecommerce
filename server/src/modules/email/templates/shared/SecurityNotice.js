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
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${bg}; border: 1px solid ${border}; border-radius: 8px; margin: 18px 0; padding: 14px 16px;">
      <tr>
        <td>
          <div style="font-size: 13px; font-weight: 800; color: ${fg}; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
            &#9888; Security Advisory (${severity})
          </div>
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 12px; color: ${fg};">
            ${timestamp ? `<tr><td style="padding: 2px 0; width: 80px; font-weight: bold;">Time:</td><td>${timestamp}</td></tr>` : ""}
            ${ipAddress ? `<tr><td style="padding: 2px 0; font-weight: bold;">IP Address:</td><td>${ipAddress}</td></tr>` : ""}
            ${device ? `<tr><td style="padding: 2px 0; font-weight: bold;">Device:</td><td>${device}</td></tr>` : ""}
            ${location ? `<tr><td style="padding: 2px 0; font-weight: bold;">Location:</td><td>${location}</td></tr>` : ""}
          </table>
          <div style="margin-top: 10px; font-size: 12px; color: ${fg}; line-height: 1.4;">
            If this wasn't you, your account may be compromised. <a href="${supportUrl}" style="color: ${fg}; font-weight: bold; text-decoration: underline;">Secure your account immediately &rarr;</a>
          </div>
        </td>
      </tr>
    </table>
  `;
}
