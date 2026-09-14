import { brandConfig } from "../../config/brand.config.js";

/**
 * Master Email Layout — Cross-Client & Dark/Light Mode Safe
 */
export function EmailLayout({
  title = "Zosh Bazaar",
  preheader = "",
  children = "",
  _theme = "light",
}) {
  const { colors, typography } = brandConfig;

  // Gmail / Apple Mail preheader spacing hack: prevents inbox preview from pulling lower content
  const preheaderHtml = preheader
    ? `<div style="display:none;font-size:1px;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;mso-hide:all;font-family:sans-serif;">
        ${preheader}
        ${"&zwnj;&nbsp;".repeat(80)}
      </div>`
    : "";

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>${title}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
    :root {
      color-scheme: light dark;
      supported-color-schemes: light dark;
    }
    body, table, td, a {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table, td {
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      -ms-interpolation-mode: bicubic;
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
    }
    table {
      border-collapse: collapse !important;
    }
    body {
      height: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      background-color: ${colors.background};
      font-family: ${typography.fontFamily};
    }
    @media only screen and (max-width: 620px) {
      .email-container {
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        border-radius: 0 !important;
      }
      .email-content {
        padding: 20px 16px !important;
      }
      .stack-column {
        display: block !important;
        width: 100% !important;
        direction: ltr !important;
      }
      .button-container {
        width: 100% !important;
        margin: 18px 0 !important;
      }
      .button-cell {
        width: 100% !important;
        display: block !important;
        box-sizing: border-box !important;
        -webkit-box-sizing: border-box !important;
        padding: 0 !important;
        background-color: transparent !important;
        border: none !important;
      }
      .responsive-button {
        display: block !important;
        width: 100% !important;
        box-sizing: border-box !important;
        -webkit-box-sizing: border-box !important;
        padding: 14px 20px !important;
        text-align: center !important;
        white-space: normal !important;
      }
    }
    @media (prefers-color-scheme: dark) {
      body, .email-canvas {
        background-color: ${colors.darkBackground} !important;
      }
      .email-card {
        background-color: ${colors.darkCardBackground} !important;
        border-color: ${colors.darkBorder} !important;
      }
      .dark-text-main {
        color: ${colors.darkTextMain} !important;
      }
      .dark-text-muted {
        color: ${colors.darkTextMuted} !important;
      }
      .dark-border {
        border-color: ${colors.darkBorder} !important;
      }
      .dark-bg-subtle {
        background-color: #0f172a !important;
      }
    }
  </style>
</head>
<body class="email-canvas" style="margin: 0; padding: 0; background-color: ${colors.background}; font-family: ${typography.fontFamily}; color: ${colors.textMain};">
  ${preheaderHtml}
  <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" class="email-canvas" style="background-color: ${colors.background}; width: 100%;">
    <tr>
      <td align="center" style="padding: 24px 12px;">
        <!--[if (gte mso 9)|(IE)]>
        <table role="presentation" align="center" border="0" cellspacing="0" cellpadding="0" width="600">
        <tr>
        <td align="center" valign="top" width="600">
        <![endif]-->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container email-card" style="max-width: 600px; background-color: ${colors.cardBackground}; border-radius: 12px; overflow: hidden; border: 1px solid ${colors.border}; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <tr>
            <td class="email-content" style="padding: 32px 28px;">
              ${children}
            </td>
          </tr>
        </table>
        <!--[if (gte mso 9)|(IE)]>
        </td>
        </tr>
        </table>
        <![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`;
}
