import { Resend } from 'resend'

function getResend() {
  if (!process.env.RESEND_API_KEY) return null
  return new Resend(process.env.RESEND_API_KEY)
}

const FROM = 'YardYarns <notifications@yardyarns.com>'
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://yardyarns.com').replace(/\/$/, '')

// ─── HTML template ────────────────────────────────────────────────────────────
// Full document structure with YY logo. Proper DOCTYPE and charset prevent
// spam filters from flagging bare HTML fragments.

function emailHtml(bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:20px;">
              <a href="${SITE_URL}" style="text-decoration:none;display:inline-block;">
                <img
                  src="${SITE_URL}/icon"
                  alt="YY"
                  width="40"
                  height="40"
                  style="display:block;border-radius:9px;border:0;"
                />
              </a>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#ffffff;border-radius:12px;padding:36px 32px;border:1px solid #e5e7eb;">
              ${bodyContent}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 0 0;text-align:center;font-size:12px;color:#9ca3af;line-height:1.6;">
              <a href="${SITE_URL}" style="color:#9ca3af;text-decoration:underline;">YardYarns</a>
              &nbsp;&mdash;&nbsp;Real talk about your apartment.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// Shared heading style
const H2 = 'margin:0 0 16px;font-size:20px;font-weight:700;color:#111827;line-height:1.3;'
const P  = 'margin:0 0 12px;font-size:15px;color:#374151;line-height:1.6;'
const SMALL = 'margin:20px 0 0;font-size:13px;color:#9ca3af;line-height:1.5;'
const LINK = 'color:#111827;font-weight:600;text-decoration:underline;'

// ─── Exports ──────────────────────────────────────────────────────────────────

export async function sendTenancyNotification({
  username,
  userEmail,
  propertyAddress,
  unitIdentifier,
  startDate,
  endDate,
  agreementPath,
}: {
  username: string
  userEmail: string
  propertyAddress: string
  unitIdentifier: string
  startDate: string
  endDate: string | null
  agreementPath: string
}) {
  const adminEmail = process.env.ADMIN_EMAIL
  const resend = getResend()
  if (!adminEmail || !resend) return

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const agreementUrl = `${supabaseUrl}/storage/v1/object/tenancy-agreements/${agreementPath}`

  await resend.emails.send({
    from: FROM,
    to: adminEmail,
    subject: `New tenancy verification request from @${username}`,
    html: emailHtml(`
      <h2 style="${H2}">New verification request</h2>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        <tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#6b7280;width:120px;">User</td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#111827;">@${username} (${userEmail})</td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#6b7280;">Property</td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#111827;">${propertyAddress}</td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#6b7280;">Unit</td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#111827;">${unitIdentifier}</td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#6b7280;">Period</td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#111827;">${startDate} &rarr; ${endDate ?? 'present'}</td></tr>
        <tr><td style="padding:8px 0;font-size:13px;color:#6b7280;">Agreement</td><td style="padding:8px 0;font-size:13px;"><a href="${agreementUrl}" style="${LINK}">View file</a></td></tr>
      </table>
      <p style="${SMALL}">
        Verify or reject in your
        <a href="https://supabase.com/dashboard" style="color:#9ca3af;">Supabase dashboard</a>
        by updating <code style="background:#f3f4f6;padding:1px 4px;border-radius:3px;">verification_status</code>
        on the <code style="background:#f3f4f6;padding:1px 4px;border-radius:3px;">tenancies</code> table.
      </p>
    `),
    text: `New tenancy verification request from @${username} (${userEmail})\n\nProperty: ${propertyAddress}\nUnit: ${unitIdentifier}\nPeriod: ${startDate} to ${endDate ?? 'present'}\nAgreement: ${agreementUrl}\n\nReview in your Supabase dashboard.`,
  })
}

export async function sendTenancyVerified({
  email,
  username,
  unitIdentifier,
  propertyAddress,
}: {
  email: string
  username: string
  unitIdentifier: string
  propertyAddress: string
}) {
  const resend = getResend()
  if (!resend || !email) return

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Your tenancy has been verified',
    html: emailHtml(`
      <h2 style="${H2}">Tenancy verified ✓</h2>
      <p style="${P}">Hi @${username},</p>
      <p style="${P}">Your tenancy at <strong>${unitIdentifier}, ${propertyAddress}</strong> has been verified. Your ratings will now count towards the unit's overall score.</p>
      <p style="${SMALL}">You received this because you submitted a tenancy verification on <a href="${SITE_URL}" style="color:#9ca3af;">YardYarns</a>.</p>
    `),
    text: `Hi @${username},\n\nYour tenancy at ${unitIdentifier}, ${propertyAddress} has been verified. Your ratings will now count towards the unit's overall score.\n\n— YardYarns`,
  })
}

export async function sendTenancyRejected({
  email,
  username,
  unitIdentifier,
  propertyAddress,
}: {
  email: string
  username: string
  unitIdentifier: string
  propertyAddress: string
}) {
  const resend = getResend()
  if (!resend || !email) return

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Your tenancy verification was not approved',
    html: emailHtml(`
      <h2 style="${H2}">Tenancy not verified</h2>
      <p style="${P}">Hi @${username},</p>
      <p style="${P}">We were unable to verify your tenancy at <strong>${unitIdentifier}, ${propertyAddress}</strong>. This is usually because the uploaded document was unclear, expired, or didn't match the address.</p>
      <p style="${P}">You're welcome to <a href="${SITE_URL}/dashboard/verify" style="${LINK}">resubmit with a clearer copy</a>.</p>
      <p style="${SMALL}">You received this because you submitted a tenancy verification on <a href="${SITE_URL}" style="color:#9ca3af;">YardYarns</a>.</p>
    `),
    text: `Hi @${username},\n\nWe were unable to verify your tenancy at ${unitIdentifier}, ${propertyAddress}. This is usually because the uploaded document was unclear, expired, or didn't match the address.\n\nYou're welcome to resubmit with a clearer copy at ${SITE_URL}/dashboard/verify.\n\n— YardYarns`,
  })
}

export async function sendLikeNotification({
  recipientEmail,
  actorUsername,
  contentType,
}: {
  recipientEmail: string
  actorUsername: string
  contentType: 'post' | 'review'
}) {
  const resend = getResend()
  if (!resend) return

  await resend.emails.send({
    from: FROM,
    to: recipientEmail,
    subject: `@${actorUsername} liked your ${contentType}`,
    html: emailHtml(`
      <h2 style="${H2}">New like</h2>
      <p style="${P}"><strong>@${actorUsername}</strong> liked your ${contentType} on YardYarns.</p>
      <p style="${P}"><a href="${SITE_URL}/notifications" style="${LINK}">View your notifications &rarr;</a></p>
      <p style="${SMALL}">You received this because someone interacted with your content on <a href="${SITE_URL}" style="color:#9ca3af;">YardYarns</a>.</p>
    `),
    text: `@${actorUsername} liked your ${contentType} on YardYarns.\n\nView your notifications: ${SITE_URL}/notifications`,
  })
}

export async function sendCommentNotification({
  recipientEmail,
  actorUsername,
  contentType,
}: {
  recipientEmail: string
  actorUsername: string
  contentType: 'post' | 'review'
}) {
  const resend = getResend()
  if (!resend) return

  await resend.emails.send({
    from: FROM,
    to: recipientEmail,
    subject: `@${actorUsername} commented on your ${contentType}`,
    html: emailHtml(`
      <h2 style="${H2}">New comment</h2>
      <p style="${P}"><strong>@${actorUsername}</strong> commented on your ${contentType} on YardYarns.</p>
      <p style="${P}"><a href="${SITE_URL}/notifications" style="${LINK}">View your notifications &rarr;</a></p>
      <p style="${SMALL}">You received this because someone interacted with your content on <a href="${SITE_URL}" style="color:#9ca3af;">YardYarns</a>.</p>
    `),
    text: `@${actorUsername} commented on your ${contentType} on YardYarns.\n\nView your notifications: ${SITE_URL}/notifications`,
  })
}

export async function sendReplyNotification({
  recipientEmail,
  actorUsername,
}: {
  recipientEmail: string
  actorUsername: string
}) {
  const resend = getResend()
  if (!resend) return

  await resend.emails.send({
    from: FROM,
    to: recipientEmail,
    subject: `@${actorUsername} replied to your comment`,
    html: emailHtml(`
      <h2 style="${H2}">New reply</h2>
      <p style="${P}"><strong>@${actorUsername}</strong> replied to your comment on YardYarns.</p>
      <p style="${P}"><a href="${SITE_URL}/notifications" style="${LINK}">View your notifications &rarr;</a></p>
      <p style="${SMALL}">You received this because someone interacted with your content on <a href="${SITE_URL}" style="color:#9ca3af;">YardYarns</a>.</p>
    `),
    text: `@${actorUsername} replied to your comment on YardYarns.\n\nView your notifications: ${SITE_URL}/notifications`,
  })
}
