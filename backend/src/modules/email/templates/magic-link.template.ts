interface MagicLinkEmailParams {
  link: string;
  appName?: string;
}

export function renderMagicLinkEmail({
  link,
  appName = "GameNight Hub",
}: MagicLinkEmailParams): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Sign in to ${appName}</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:'Outfit',Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;max-width:560px;width:100%;border:1px solid #e2e8f0;">
          <tr>
            <td style="padding:40px 32px;text-align:center;">
              <h1 style="font-size:28px;margin:0 0 8px;font-weight:500;">
                <span style="color:#334155;">GameNight</span><span style="color:#0d9668;">Hub</span>
              </h1>
              <p style="color:#64748b;font-size:14px;margin:0 0 32px;">Click the button below to sign in. This link expires in 1 hour.</p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
                <tr>
                  <td style="background-color:#0d9668;border-radius:8px;">
                    <a href="${link}" target="_blank" style="display:inline-block;padding:14px 40px;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;letter-spacing:0.025em;">Sign in to ${appName}</a>
                  </td>
                </tr>
              </table>
              <p style="color:#94a3b8;font-size:12px;margin:0 0 24px;word-break:break-all;">
                Or copy this link: <a href="${link}" style="color:#0d9668;text-decoration:underline;">${link}</a>
              </p>
              <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 24px;" />
              <p style="color:#94a3b8;font-size:11px;margin:0;">If you didn't request this, you can safely ignore this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
