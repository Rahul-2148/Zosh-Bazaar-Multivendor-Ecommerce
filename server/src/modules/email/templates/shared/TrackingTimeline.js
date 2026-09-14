import { brandConfig } from "../../config/brand.config.js";

const DEFAULT_TIMELINE_STEPS = [
  { key: "PLACED", label: "Placed", message: "Order placed & verified" },
  { key: "CONFIRMED", label: "Confirmed", message: "Accepted & being fulfilled by merchant" },
  { key: "PACKED", label: "Packed", message: "Items checked & packed securely" },
  { key: "SHIPPED", label: "Shipped", message: "Handed over to delivery carrier" },
  { key: "IN_TRANSIT", label: "In Transit", message: "Moving towards destination hub" },
  { key: "OUT_FOR_DELIVERY", label: "Out for Delivery", message: "With courier for doorstep delivery" },
  { key: "DELIVERED", label: "Delivered", message: "Package delivered successfully" },
];

function formatStepLabelForDesktop(label) {
  if (label.toLowerCase() === "out for delivery") {
    return "Out for<br>Delivery";
  }
  if (label.toLowerCase() === "in transit") {
    return "In<br>Transit";
  }
  return label;
}

export function TrackingTimeline({
  currentStatus = "CONFIRMED",
  steps = DEFAULT_TIMELINE_STEPS,
  isException = false,
}) {
  const { colors } = brandConfig;
  const normalizedCurrent = (currentStatus || "").toUpperCase();

  // Find index of current status
  let currentIndex = steps.findIndex(
    (s) => s.key === normalizedCurrent || normalizedCurrent.includes(s.key)
  );
  if (currentIndex === -1) {
    if (normalizedCurrent === "DELIVERED") currentIndex = steps.length - 1;
    else if (normalizedCurrent === "PENDING") currentIndex = 0;
    else currentIndex = 1; // Default to Confirmed
  }

  const currentStep = steps[currentIndex] || steps[0];
  const progressPercent = Math.max(12, Math.round(((currentIndex + 1) / steps.length) * 100));

  // --- DESKTOP HORIZONTAL STEPPER ---
  const desktopColumnsHtml = steps
    .map((step, idx) => {
      const isCompleted = idx < currentIndex;
      const isCurrent = idx === currentIndex;
      const isFuture = idx > currentIndex;

      let circleBg = colors.primary;
      let circleBorder = colors.primary;
      let textColor = colors.secondary;
      let fontWeight = "600";

      if (isCurrent && isException) {
        circleBg = colors.danger;
        circleBorder = colors.danger;
        fontWeight = "800";
      } else if (isCurrent) {
        circleBg = colors.primary;
        circleBorder = colors.primary;
        fontWeight = "800";
      } else if (isCompleted) {
        circleBg = colors.success;
        circleBorder = colors.success;
      } else if (isFuture) {
        circleBg = "#f1f5f9";
        circleBorder = "#cbd5e1";
        textColor = "#94a3b8";
        fontWeight = "500";
      }

      const checkmark = isCompleted ? "&#10003;" : idx + 1;
      const formattedLabel = formatStepLabelForDesktop(step.label);

      const trackColorLeft = idx === 0 ? "transparent" : (idx <= currentIndex ? colors.success : "#cbd5e1");
      const trackColorRight = idx === steps.length - 1 ? "transparent" : (idx < currentIndex ? colors.success : "#cbd5e1");

      return `
        <td align="center" valign="top" style="width: ${Math.floor(100 / steps.length)}%; padding: 0;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td width="50%" style="height: 2px; line-height: 2px; font-size: 0; background-color: ${trackColorLeft};"></td>
              <td width="24" align="center" style="width: 24px; padding: 0;">
                <div style="width: 24px; height: 24px; border-radius: 50%; background-color: ${circleBg}; border: 2px solid ${circleBorder}; color: #ffffff; font-size: 11px; line-height: 20px; font-weight: bold; text-align: center; box-sizing: border-box; ${isFuture ? 'color: #94a3b8;' : ''}">
                  ${checkmark}
                </div>
              </td>
              <td width="50%" style="height: 2px; line-height: 2px; font-size: 0; background-color: ${trackColorRight};"></td>
            </tr>
          </table>
          <div style="font-size: 10px; font-weight: ${fontWeight}; color: ${textColor}; text-align: center; margin-top: 6px; line-height: 13px; word-break: break-word; padding: 0 2px;" class="${isCurrent ? 'dark-text-main' : (isCompleted ? 'dark-text-main' : 'timeline-future-text')}">
            ${formattedLabel}
          </div>
        </td>
      `;
    })
    .join("");

  const desktopTable = `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="timeline-desktop timeline-card" style="margin: 20px 0; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; border-collapse: separate !important;">
      <tr>
        <td style="padding: 16px 8px 14px 8px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed !important; width: 100% !important;">
            <tr>
              ${desktopColumnsHtml}
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;

  // --- MOBILE VERTICAL STEPPER ---
  const mobileRowsHtml = steps
    .map((step, idx) => {
      const isCompleted = idx < currentIndex;
      const isCurrent = idx === currentIndex;
      const isFuture = idx > currentIndex;
      const isLast = idx === steps.length - 1;

      let circleBg = colors.primary;
      let circleBorder = colors.primary;
      let titleColor = colors.secondary;
      let fontWeight = "600";

      if (isCurrent && isException) {
        circleBg = colors.danger;
        circleBorder = colors.danger;
        fontWeight = "800";
      } else if (isCurrent) {
        circleBg = colors.primary;
        circleBorder = colors.primary;
        fontWeight = "800";
      } else if (isCompleted) {
        circleBg = colors.success;
        circleBorder = colors.success;
      } else if (isFuture) {
        circleBg = "#f1f5f9";
        circleBorder = "#cbd5e1";
        titleColor = "#94a3b8";
        fontWeight = "500";
      }

      const checkmark = isCompleted ? "&#10003;" : idx + 1;
      const trackLineColor = idx < currentIndex ? colors.success : "#cbd5e1";

      return `
        <tr>
          <td width="28" align="center" valign="top" style="width: 28px; padding-right: 12px;">
            <div style="width: 22px; height: 22px; border-radius: 50%; background-color: ${circleBg}; border: 1.5px solid ${circleBorder}; color: ${isFuture ? '#94a3b8' : '#ffffff'}; font-size: 11px; line-height: 19px; font-weight: bold; text-align: center; box-sizing: border-box;">
              ${checkmark}
            </div>
            ${!isLast ? `<div style="width: 2px; height: 24px; background-color: ${trackLineColor}; margin: 2px auto;" class="timeline-track-bg"></div>` : ""}
          </td>
          <td valign="top" style="padding-bottom: ${!isLast ? '8px' : '0'};">
            <div style="font-size: 13px; font-weight: ${fontWeight}; color: ${titleColor}; line-height: 20px;" class="${isCurrent ? 'dark-text-main' : (isCompleted ? 'dark-text-main' : 'timeline-future-text')}">
              ${step.label}
              ${isCurrent ? `<span style="font-size: 10px; font-weight: 700; color: #2563eb; background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 4px; padding: 1px 6px; margin-left: 6px; vertical-align: middle;">CURRENT</span>` : ""}
            </div>
            ${isCurrent && step.message ? `
              <div style="font-size: 11px; color: #64748b; line-height: 15px; margin-top: 2px;" class="dark-text-muted">
                ${step.message}
              </div>
            ` : ""}
          </td>
        </tr>
      `;
    })
    .join("");

  const mobileTable = `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="timeline-mobile timeline-card" style="margin: 16px 0; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; border-collapse: separate !important; display: none; mso-hide: all;">
      <tr>
        <td style="padding: 16px 14px;">
          <!-- Mobile Status Header -->
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 10px;">
            <tr>
              <td align="left" style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">
                Step ${currentIndex + 1} of ${steps.length}
              </td>
              <td align="right">
                <span style="display: inline-block; padding: 2px 8px; font-size: 11px; font-weight: 700; border-radius: 9999px; background-color: #dbeafe; color: #1d4ed8;">
                  ${currentStep.label}
                </span>
              </td>
            </tr>
          </table>

          <!-- Progress Bar -->
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 16px;">
            <tr>
              <td style="height: 6px; background-color: #e2e8f0; border-radius: 3px; font-size: 0; line-height: 0;" class="timeline-track-bg">
                <div style="height: 6px; width: ${progressPercent}%; background-color: ${currentIndex === steps.length - 1 ? colors.success : colors.primary}; border-radius: 3px;"></div>
              </td>
            </tr>
          </table>

          <!-- Vertical Timeline Steps -->
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            ${mobileRowsHtml}
          </table>
        </td>
      </tr>
    </table>
  `;

  return `${desktopTable}\n${mobileTable}`;
}
