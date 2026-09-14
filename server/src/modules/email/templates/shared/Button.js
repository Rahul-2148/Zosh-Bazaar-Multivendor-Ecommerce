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
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="button-container" ${fullWidth ? 'width="100%"' : ""} style="margin: 20px 0; border-collapse: separate !important; ${fullWidth ? "width: 100%;" : ""}">
      <tr>
        <td align="center" class="button-cell" style="border-radius: 8px; background-color: ${bg}; vertical-align: middle;">
          <!--[if mso]>
          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${href}" style="height:48px;v-text-anchor:middle;width:${fullWidth ? "500px" : "240px"};" arcsize="18%" stroke="${variant === "outline" ? "t" : "f"}" strokecolor="${colors.primary}" fillcolor="${bg}">
            <w:anchorlock/>
            <center style="color:${fg};font-family:sans-serif;font-size:15px;font-weight:bold;">${label}</center>
          </v:roundrect>
          <![endif]-->
          <!--[if !mso]><!-->
          <a href="${href}" target="_blank" class="responsive-button" style="display: ${fullWidth ? "block" : "inline-block"}; box-sizing: border-box; -webkit-box-sizing: border-box; background-color: ${bg}; color: ${fg}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 700; line-height: 1.2; text-decoration: none; padding: 14px 28px; border-radius: 8px; border: ${border}; text-align: center; mso-padding-alt: 0; white-space: nowrap; ${fullWidth ? "width: 100%;" : ""}">
            ${label}
          </a>
          <!--<![endif]-->
        </td>
      </tr>
    </table>
  `;
}
