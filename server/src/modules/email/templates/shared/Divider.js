import { brandConfig } from "../../config/brand.config.js";

export function Divider({ space = 20 }) {
  const { colors } = brandConfig;
  return `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: ${space}px 0;">
      <tr>
        <td style="border-bottom: 1px solid ${colors.border}; line-height: 1px; font-size: 1px;" class="dark-border">&nbsp;</td>
      </tr>
    </table>
  `;
}
