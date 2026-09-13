import { brandConfig } from "../../config/brand.config.js";

export function SocialLinks() {
  const { socialLinks, colors } = brandConfig;
  return `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 14px auto;">
      <tr>
        ${socialLinks
          .map(
            (link) => `
          <td style="padding: 0 10px;">
            <a href="${link.url}" target="_blank" style="color: ${colors.textMuted}; text-decoration: none; font-size: 12px; font-weight: bold;">
              ${link.name}
            </a>
          </td>
        `
          )
          .join("")}
      </tr>
    </table>
  `;
}
