import { brandConfig } from "../../config/brand.config.js";

export function Button({
  href = "#",
  label = "Click Here",
  variant = "primary",
  fullWidth = false,
}) {
  const { colors } = brandConfig;

  let bg = colors.primary;
  let fg = "#ffffff";

  if (variant === "secondary") {
    bg = colors.secondary;
    fg = "#ffffff";
  } else if (variant === "danger") {
    bg = colors.danger;
    fg = "#ffffff";
  } else if (variant === "outline") {
    bg = "transparent";
    fg = colors.primary;
  }

  const border = variant === "outline" ? `2px solid ${colors.primary}` : "none";

  return `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" ${fullWidth ? 'width="100%"' : ""} style="margin: 16px 0;">
      <tr>
        <td align="center" style="border-radius: 8px; background-color: ${bg}; border: ${border};">
          <!--[if mso]>
          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${href}" style="height:44px;v-text-anchor:middle;width:${fullWidth ? "500px" : "220px"};" arcsize="18%" stroke="f" fillcolor="${bg}">
            <w:anchorlock/>
            <center style="color:${fg};font-family:sans-serif;font-size:14px;font-weight:bold;">${label}</center>
          </v:roundrect>
          <![endif]-->
          <!--[if !mso]><!-->
          <a href="${href}" target="_blank" class="responsive-button" style="display: inline-block; padding: 12px 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; font-weight: 700; color: ${fg}; text-decoration: none; border-radius: 8px; text-align: center; mso-padding-alt: 0;">
            ${label}
          </a>
          <!--<![endif]-->
        </td>
      </tr>
    </table>
  `;
}
