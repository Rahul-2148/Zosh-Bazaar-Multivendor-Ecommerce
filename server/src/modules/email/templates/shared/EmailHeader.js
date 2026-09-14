import { Logo } from "./Logo.js";
import { Badge } from "./Badge.js";
import { brandConfig } from "../../config/brand.config.js";

export function EmailHeader({ roleBadge = null, subtitle = "" }) {
  const { colors, urls } = brandConfig;

  return `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px; border-bottom: 1px solid ${colors.border};" class="dark-border">
      <tr>
        <td align="left" valign="middle" style="padding-bottom: 18px;">
          <a href="${urls.website}" target="_blank" style="text-decoration: none; display: inline-block;">
            ${Logo({ size: 32 })}
          </a>
          ${
            subtitle
              ? `<div style="font-size: 12px; color: ${colors.textMuted}; margin-top: 4px;" class="dark-text-muted">${subtitle}</div>`
              : ""
          }
        </td>
        ${
          roleBadge
            ? `<td align="right" valign="middle" style="padding-bottom: 18px;">
                ${Badge({ label: roleBadge.label || roleBadge, variant: roleBadge.variant || "neutral" })}
              </td>`
            : ""
        }
      </tr>
    </table>
  `;
}
