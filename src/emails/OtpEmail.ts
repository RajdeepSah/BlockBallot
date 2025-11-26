interface OtpEmailOptions {
  code: string;
  expiresInMinutes: number;
}

export function buildOtpEmail({ code, expiresInMinutes }: OtpEmailOptions) {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charSet="UTF-8" />
    <title>Your BlockBallot Verification Code</title>
  </head>
  <body style="font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #f8fafc; padding: 32px;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e0e7ff; border-radius: 16px;">
      <tr>
        <td style="padding: 32px;">
          <p style="font-size: 14px; color: #6366f1; letter-spacing: 0.2em; text-transform: uppercase; margin: 0 0 12px;">BlockBallot Security</p>
          <h1 style="font-size: 24px; color: #0f172a; margin: 0 0 16px;">Your BlockBallot Verification Code</h1>
          <p style="font-size: 16px; color: #475569; line-height: 1.6; margin: 0 0 24px;">
            Use the code below to finish signing in. This code is valid for ${expiresInMinutes} minutes.
          </p>
          <div style="margin: 0 0 24px; padding: 24px; text-align: center; background-color: #eef2ff; border-radius: 12px; border: 1px dashed #c7d2fe;">
            <span style="font-size: 36px; font-weight: 600; letter-spacing: 0.5em; color: #312e81;">${code}</span>
          </div>
          <p style="font-size: 14px; color: #64748b; line-height: 1.6; margin: 0 0 24px;">
            If you did not request this code, please secure your account immediately by changing your password.
          </p>
          <p style="font-size: 12px; color: #94a3b8; margin: 32px 0 0;">
            This automated message was sent from BlockBallot. Replies are not monitored.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function getOtpPlainText(code: string, expiresInMinutes: number) {
  return `Your BlockBallot verification code is ${code}. It expires in ${expiresInMinutes} minutes. If you did not request it, please reset your password.`;
}
