import { brandConfig } from "../../config/brand.config.js";

const DEFAULT_TIMELINE_STEPS = [
  { key: "PLACED", label: "Placed" },
  { key: "CONFIRMED", label: "Confirmed" },
  { key: "PACKED", label: "Packed" },
  { key: "SHIPPED", label: "Shipped" },
  { key: "IN_TRANSIT", label: "In Transit" },
  { key: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
  { key: "DELIVERED", label: "Delivered" },
];

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

  return `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0;">
      <tr>
        <td style="padding: 0 4px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              ${steps
                .map((step, idx) => {
                  const isCompleted = idx < currentIndex;
                  const isCurrent = idx === currentIndex;
                  const isFuture = idx > currentIndex;

                  let circleColor = colors.primary;
                  let circleBg = colors.primary;
                  let textColor = colors.secondary;
                  let fontWeight = "bold";

                  if (isCurrent && isException) {
                    circleBg = colors.danger;
                    circleColor = colors.danger;
                  } else if (isCurrent) {
                    circleBg = colors.accent;
                    circleColor = colors.accent;
                    fontWeight = "800";
                  } else if (isCompleted) {
                    circleBg = colors.success;
                    circleColor = colors.success;
                  } else if (isFuture) {
                    circleBg = "#e2e8f0";
                    circleColor = "#94a3b8";
                    textColor = colors.textMuted;
                    fontWeight = "normal";
                  }

                  const checkmark = isCompleted ? "&#10003;" : idx + 1;

                  return `
                    <td align="center" valign="top" style="width: ${Math.floor(100 / steps.length)}%;">
                      <div style="width: 22px; height: 22px; border-radius: 50%; background-color: ${circleBg}; border: 1px solid ${circleColor}; color: #ffffff; font-size: 11px; line-height: 20px; font-weight: bold; text-align: center; margin: 0 auto 6px auto; box-sizing: border-box;">
                        ${checkmark}
                      </div>
                      <div style="font-size: 10px; font-weight: ${fontWeight}; color: ${textColor}; text-transform: uppercase; letter-spacing: 0.2px; line-height: 1.1;" class="dark-text-main">
                        ${step.label}
                      </div>
                    </td>
                  `;
                })
                .join("")}
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}
