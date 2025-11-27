/**
 * Options for building an election invitation email.
 */
export interface ElectionInviteEmailOptions {
  electionName: string;
  electionCode: string;
  directLink: string;
  startTime: string;
  endTime: string;
}

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'full',
  timeStyle: 'short',
});

/**
 * Formats a date string for display in invitation emails.
 * 
 * @param value - ISO date string to format
 * @returns Formatted date string or original value if invalid
 */
export function formatInviteDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return dateFormatter.format(date);
}

/**
 * Builds an HTML email template for election invitations.
 * 
 * @param options - Election invite email options
 * @returns HTML string for the email
 */
export function buildElectionInviteEmail(options: ElectionInviteEmailOptions) {
  const startLabel = formatInviteDate(options.startTime);
  const endLabel = formatInviteDate(options.endTime);

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charSet="UTF-8" />
    <title>You're invited to vote in &quot;${options.electionName}&quot;</title>
  </head>
  <body style="font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #f5f7fb; padding: 32px;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e0e7ff; border-radius: 16px;">
      <tr>
        <td style="padding: 32px;">
          <p style="font-size: 14px; color: #6366f1; letter-spacing: 0.2em; text-transform: uppercase; margin: 0 0 12px;">BlockBallot</p>
          <h1 style="font-size: 24px; color: #0f172a; margin: 0 0 24px;">You're invited to vote in &quot;${options.electionName}&quot;</h1>
          <p style="font-size: 16px; color: #475569; line-height: 1.6; margin: 0 0 24px;">
            Hi,<br />
            You've been invited to participate in the election: <strong>${options.electionName}</strong>.
          </p>
          <div style="border-radius: 12px; border: 1px dashed #c7d2fe; padding: 20px; margin-bottom: 24px;">
            <p style="font-size: 14px; color: #475569; margin: 0 0 8px;">Election Code</p>
            <p style="font-size: 28px; font-weight: 700; letter-spacing: 0.3em; margin: 0; color: #312e81; text-align: center;">${options.electionCode}</p>
          </div>
          <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 16px;">
            You can vote directly using this secure link:<br />
            <a href="${options.directLink}" style="color: #4f46e5; word-break: break-all;">${options.directLink}</a>
          </p>
          <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
            <p style="font-size: 14px; color: #475569; margin: 0 0 8px;">Voting Period</p>
            <p style="font-size: 16px; color: #0f172a; margin: 0;">${startLabel} – ${endLabel}</p>
          </div>
          <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 24px;">
            Thank you for participating!<br />
            — BlockBallot Team
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/**
 * Builds a plain text version of the election invitation email.
 * 
 * @param options - Election invite email options
 * @returns Plain text string for the email
 */
export function getElectionInvitePlainText(options: ElectionInviteEmailOptions) {
  const startLabel = formatInviteDate(options.startTime);
  const endLabel = formatInviteDate(options.endTime);

  return `Subject: You're invited to vote in "${options.electionName}"

Hi,
You've been invited to participate in the election: ${options.electionName}

Election Code: ${options.electionCode}
Direct Link: ${options.directLink}

Voting Period:
${startLabel} – ${endLabel}

Thank you for participating!
— BlockBallot Team`;
}

/**
 * Gets a preview of the election invitation email (plain text format).
 * 
 * @param options - Election invite email options
 * @returns Plain text preview string
 */
export function getElectionInvitePreview(options: ElectionInviteEmailOptions) {
  return getElectionInvitePlainText(options);
}
