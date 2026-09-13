import { brandConfig } from "../../config/brand.config.js";

export function Logo({ size = 28, showText = true }) {
  const { colors } = brandConfig;
  return `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0">
      <tr>
        <td valign="middle" style="padding-right: 8px;">
          <div style="background: linear-gradient(135deg, ${colors.primary} 0%, #4f46e5 100%); width: ${size}px; height: ${size}px; border-radius: 8px; text-align: center; line-height: ${size}px; font-weight: 900; color: #ffffff; font-size: ${Math.round(size * 0.55)}px; letter-spacing: -0.5px;">
            Z
          </div>
        </td>
        ${
          showText
            ? `<td valign="middle" style="font-size: 20px; font-weight: 800; letter-spacing: -0.5px; color: ${colors.secondary};">
                <span style="color: ${colors.secondary};" class="dark-text-main">Zosh</span><span style="color: ${colors.primary};">Bazaar</span>
              </td>`
            : ""
        }
      </tr>
    </table>
  `;
}
