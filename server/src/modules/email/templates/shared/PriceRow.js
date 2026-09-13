import { brandConfig } from "../../config/brand.config.js";
import { enIN } from "../../localization/en-IN/messages.js";

export function PriceRow({
  label,
  value,
  isBold = false,
  isTotal = false,
  isDiscount = false,
}) {
  const { colors } = brandConfig;
  const formattedVal = typeof value === "number" ? enIN.formatCurrency(value) : value;

  const fontStyle = isTotal
    ? `font-size: 16px; font-weight: 800; color: ${colors.secondary};`
    : isBold
    ? `font-size: 13px; font-weight: 700; color: ${colors.textMain};`
    : `font-size: 13px; font-weight: 400; color: ${colors.textMuted};`;

  const valColor = isDiscount ? `color: ${colors.success};` : isTotal ? `color: ${colors.primary};` : "";

  return `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 6px;">
      <tr>
        <td align="left" style="${fontStyle}" class="dark-text-main">
          ${label}
        </td>
        <td align="right" style="${fontStyle} ${valColor}" class="dark-text-main">
          ${isDiscount ? "-" : ""}${formattedVal}
        </td>
      </tr>
    </table>
  `;
}
