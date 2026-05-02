import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

function getResend() {
  if (!process.env.RESEND_API_KEY) return null
  return new Resend(process.env.RESEND_API_KEY)
}

/** Look up a user's email from auth.users — requires service role key */
async function getUserEmail(userId: string): Promise<string | null> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  )
  const { data } = await admin.auth.admin.getUserById(userId)
  return data.user?.email ?? null
}

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
    from: 'YardYarns <notifications@yardyarns.com>',
    to: adminEmail,
    subject: `New tenancy verification request from @${username}`,
    html: `
      <h2>New tenancy verification request</h2>
      <table style="border-collapse:collapse;width:100%;max-width:480px">
        <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">User</td><td style="padding:8px 0;font-size:13px">@${username} (${userEmail})</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Property</td><td style="padding:8px 0;font-size:13px">${propertyAddress}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Unit</td><td style="padding:8px 0;font-size:13px">${unitIdentifier}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Tenancy period</td><td style="padding:8px 0;font-size:13px">${startDate} → ${endDate ?? 'present'}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Agreement</td><td style="padding:8px 0;font-size:13px"><a href="${agreementUrl}">View file</a></td></tr>
      </table>
      <p style="margin-top:24px;font-size:13px;color:#6b7280">
        To verify or reject this request, update <code>verification_status</code> on the
        <code>tenancies</code> table in your
        <a href="https://supabase.com/dashboard">Supabase dashboard</a>.
      </p>
    `,
  })
}

export async function sendTenancyVerified({
  userId,
  username,
  unitIdentifier,
  propertyAddress,
}: {
  userId: string
  username: string
  unitIdentifier: string
  propertyAddress: string
}) {
  const resend = getResend()
  if (!resend) return
  const email = await getUserEmail(userId)
  if (!email) return

  await resend.emails.send({
    from: 'YardYarns <notifications@yardyarns.com>',
    to: email,
    subject: 'Your tenancy has been verified ✓',
    html: `
      <h2>Tenancy verified</h2>
      <p>Hi @${username},</p>
      <p>Your tenancy at <strong>${unitIdentifier}, ${propertyAddress}</strong> has been verified.</p>
      <p>Your ratings will now count towards the unit's overall score.</p>
      <p style="margin-top:24px;font-size:13px;color:#6b7280">— YardYarns</p>
    `,
  })
}

export async function sendTenancyRejected({
  userId,
  username,
  unitIdentifier,
  propertyAddress,
}: {
  userId: string
  username: string
  unitIdentifier: string
  propertyAddress: string
}) {
  const resend = getResend()
  if (!resend) return
  const email = await getUserEmail(userId)
  if (!email) return

  await resend.emails.send({
    from: 'YardYarns <notifications@yardyarns.com>',
    to: email,
    subject: 'Your tenancy verification was not approved',
    html: `
      <h2>Tenancy not verified</h2>
      <p>Hi @${username},</p>
      <p>We were unable to verify your tenancy at <strong>${unitIdentifier}, ${propertyAddress}</strong>.</p>
      <p>This is usually because the uploaded document was unclear, expired, or didn't match the address.
         You're welcome to resubmit with a clearer copy.</p>
      <p style="margin-top:24px;font-size:13px;color:#6b7280">— YardYarns</p>
    `,
  })
}
