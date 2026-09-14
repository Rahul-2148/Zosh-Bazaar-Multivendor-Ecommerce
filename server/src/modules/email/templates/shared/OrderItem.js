import { brandConfig } from "../../config/brand.config.js";
import { enIN } from "../../localization/en-IN/messages.js";

export function OrderItem({ item }) {
  const { colors } = brandConfig;
  const imageFallback = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=120&q=80";

  return `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 14px; border-bottom: 1px solid ${colors.border};" class="dark-border">
      <tr>
        <td width="64" valign="top" style="padding-right: 14px; padding-bottom: 14px;">
          <img src="${item.image || imageFallback}" alt="${item.title}" width="64" height="64" style="width: 64px; height: 64px; object-fit: cover; border-radius: 6px; border: 1px solid ${colors.border}; display: block;" />
        </td>
        <td valign="top" align="left" style="padding-bottom: 14px;">
          <div style="font-size: 14px; font-weight: 700; color: ${colors.textMain}; line-height: 1.3;" class="dark-text-main">
            ${item.title}
          </div>
          ${
            item.variant
              ? `<div style="font-size: 12px; color: ${colors.textMuted}; margin-top: 2px;" class="dark-text-muted">Variant: ${item.variant}</div>`
              : ""
          }
          <div style="font-size: 12px; color: ${colors.textMuted}; margin-top: 4px;" class="dark-text-muted">
            Qty: <strong>${item.quantity}</strong> × ${enIN.formatCurrency(item.unitPrice)}
            ${item.sellerName ? ` &bull; <span style="font-size: 11px;">Sold by ${item.sellerName}</span>` : ""}
          </div>
        </td>
        <td valign="top" align="right" style="white-space: nowrap; padding-left: 10px; padding-bottom: 14px;">
          <span style="font-size: 14px; font-weight: 700; color: ${colors.textMain};" class="dark-text-main">
            ${enIN.formatCurrency(item.totalPrice)}
          </span>
        </td>
      </tr>
    </table>
  `;
}
