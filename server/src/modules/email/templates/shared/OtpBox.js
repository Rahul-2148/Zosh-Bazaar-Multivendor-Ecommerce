/**
 * Enterprise Transactional OTP Box Component
 * Ultra-high contrast, mobile-friendly, safe in both Light and Dark modes.
 *
 * @param {string|number} otp - The numeric or alphanumeric verification code
 * @param {number} [validityMinutes=5] - Expiration duration in minutes
 * @param {string} [label="One-Time Verification Code"] - Security header text
 */
export function OtpBox(otp, validityMinutes = 5, label = "One-Time Verification Code") {
  const cleanOtp = String(otp || "123456").trim();

  return `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="otp-box-wrapper" style="margin: 24px 0; width: 100%;">
      <tr>
        <td align="center" style="padding: 0;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="otp-card" style="background-color: #eff6ff; border: 2px solid #93c5fd; border-radius: 14px; padding: 22px 16px; text-align: center; max-width: 480px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.08);">
            <!-- Security Badge -->
            <tr>
              <td align="center" style="padding-bottom: 12px;">
                <span class="otp-badge" style="display: inline-block; background-color: #dbeafe; color: #1e40af; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; padding: 5px 14px; border-radius: 9999px; border: 1px solid #bfdbfe;">
                  &#128274; ${label}
                </span>
              </td>
            </tr>

            <!-- High-Contrast Digits Token Box -->
            <tr>
              <td align="center" style="padding: 4px 0 12px 0;">
                <div class="otp-token-box" style="background-color: #ffffff; border: 2px solid #2563eb; border-radius: 12px; padding: 12px 28px; display: inline-block; box-shadow: 0 4px 10px rgba(37, 99, 235, 0.12);">
                  <span class="otp-digits" style="font-family: 'JetBrains Mono', Consolas, Monaco, monospace; font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #1d4ed8; line-height: 1.1; display: inline-block; padding-left: 10px; -webkit-user-select: all; user-select: all;">
                    ${cleanOtp}
                  </span>
                </div>
              </td>
            </tr>

            <!-- Expiry & Security Subtext -->
            <tr>
              <td align="center" style="padding-top: 4px;">
                <p class="otp-footer-text" style="margin: 0; font-size: 13px; font-weight: 600; color: #1e3a8a; line-height: 1.4;">
                  &#9201; Valid for <strong>${validityMinutes} minutes</strong> &bull; Do not share this code with anyone
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}
