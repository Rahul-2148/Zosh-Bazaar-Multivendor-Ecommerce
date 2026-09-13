export function Badge({ label, variant = "neutral" }) {

  let bg = "#f1f5f9";
  let fg = "#475569";
  let border = "#cbd5e1";

  switch (variant.toLowerCase()) {
    case "success":
      bg = "#dcfce7";
      fg = "#15803d";
      border = "#bbf7d0";
      break;
    case "warning":
      bg = "#fef3c7";
      fg = "#b45309";
      border = "#fde68a";
      break;
    case "danger":
    case "error":
      bg = "#fee2e2";
      fg = "#b91c1c";
      border = "#fecaca";
      break;
    case "info":
    case "primary":
      bg = "#dbeafe";
      fg = "#1d4ed8";
      border = "#bfdbfe";
      break;
    case "accent":
      bg = "#fef9c3";
      fg = "#854d0e";
      border = "#fef08a";
      break;
    default:
      bg = "#f1f5f9";
      fg = "#475569";
      border = "#e2e8f0";
      break;
  }

  return `
    <span style="display: inline-block; padding: 4px 10px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-radius: 9999px; background-color: ${bg}; color: ${fg}; border: 1px solid ${border}; line-height: 1;">
      ${label}
    </span>
  `;
}
