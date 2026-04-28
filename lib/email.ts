import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

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
  if (!adminEmail || !process.env.RESEND_API_KEY) return

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
