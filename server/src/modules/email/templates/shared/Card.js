import { brandConfig } from "../../config/brand.config.js";

export function Card({
  children = "",
  title = "",
  accentBorderColor = null,
  style = "",
}) {
  const { colors } = brandConfig;
  const borderLeft = accentBorderColor ? `border-left: 4px solid ${accentBorderColor};` : "";

  return `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="email-card dark-border" style="background-color: #ffffff; border: 1px solid ${colors.border}; border-radius: 8px; margin: 16px 0; overflow: hidden; ${borderLeft} ${style}">
      ${
        title
          ? `<tr>
              <td style="padding: 14px 18px 0 18px; font-size: 14px; font-weight: 700; color: ${colors.textMain}; text-transform: uppercase; letter-spacing: 0.5px;" class="dark-text-main">
                ${title}
              </td>
            </tr>`
          : ""
      }
      <tr>
        <td style="padding: 16px 18px;">
          ${children}
        </td>
      </tr>
    </table>
  `;
}
