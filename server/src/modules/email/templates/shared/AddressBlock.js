import { brandConfig } from "../../config/brand.config.js";

export function AddressBlock({ address, title = "Shipping Address" }) {
  const { colors } = brandConfig;
  if (!address) return "";

  return `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="email-card dark-border" style="background-color: #f8fafc; border: 1px solid ${colors.border}; border-radius: 8px; padding: 14px 16px; margin: 12px 0;">
      <tr>
        <td>
          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: ${colors.textMuted}; letter-spacing: 0.5px; margin-bottom: 4px;" class="dark-text-muted">
            ${title}
          </div>
          <div style="font-size: 14px; font-weight: 700; color: ${colors.textMain};" class="dark-text-main">
            ${address.name || "Recipient"}
          </div>
          <div style="font-size: 13px; color: ${colors.textMain}; line-height: 1.4; margin-top: 2px;" class="dark-text-main">
            ${address.addressLine1 || ""}${address.addressLine2 ? `, ${address.addressLine2}` : ""}<br />
            ${address.city || ""}, ${address.state || ""} - ${address.pincode || ""}
          </div>
          ${
            address.mobile
              ? `<div style="font-size: 12px; color: ${colors.textMuted}; margin-top: 4px;" class="dark-text-muted">Phone: ${address.mobile}</div>`
              : ""
          }
        </td>
      </tr>
    </table>
  `;
}
