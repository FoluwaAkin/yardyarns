import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Monthly prompt Edge Function
 *
 * Invoked via pg_cron on the 1st of each month.
 * Finds all verified tenants who haven't reviewed their unit for the previous month
 * and sends them an email reminder via Supabase Auth Admin API.
 *
 * Schedule:
 *   SELECT cron.schedule(
 *     'monthly-review-prompt',
 *     '0 9 1 * *',
 *     $$SELECT net.http_post(
 *       url:='https://<project-ref>.supabase.co/functions/v1/monthly-prompt',
 *       headers:='{"Authorization": "Bearer <service-role-key>"}'::jsonb
 *     ) AS request_id;$$
 *   );
 */
Deno.serve(async (_req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } }
  )

  const now = new Date()
  // Previous month range
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
  const periodStart = prevMonthStart.toISOString().slice(0, 10)

  // Get all verified tenancies where tenancy is still active (end_date is null or in the future)
  const { data: tenancies, error: tErr } = await supabase
    .from('tenancies')
    .select('id, user_id, unit_id, units(unit_identifier, properties(address, city))')
    .eq('verification_status', 'verified')
    .or(`end_date.is.null,end_date.gte.${periodStart}`)

  if (tErr) {
    return new Response(JSON.stringify({ error: tErr.message }), { status: 500 })
  }

  if (!tenancies || tenancies.length === 0) {
    return new Response(JSON.stringify({ message: 'No verified tenancies found.' }), { status: 200 })
  }

  // For each tenancy, check if a review already exists for the previous month
  const prompted: string[] = []
  const skipped: string[] = []

  for (const tenancy of tenancies) {
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('user_id', tenancy.user_id)
      .eq('unit_id', tenancy.unit_id)
      .eq('period_start', periodStart)
      .maybeSingle()

    if (existingReview) {
      skipped.push(tenancy.user_id)
      continue
    }

    // Get the user's email via admin API
    const { data: { user }, error: userErr } = await supabase.auth.admin.getUserById(tenancy.user_id)

    if (userErr || !user?.email) {
      skipped.push(tenancy.user_id)
      continue
    }

    const unit = tenancy.units as {
      unit_identifier: string
      properties: { address: string; city: string } | null
    } | null

    const unitLabel = unit?.unit_identifier ?? 'your unit'
    const propertyLabel = unit?.properties
      ? `${unit.properties.address}, ${unit.properties.city}`
      : ''

    // Send email via Supabase Auth (magic-link style, or use your email provider)
    // In production: integrate Resend, SendGrid, etc.
    // For now: log the intended email
    console.log(`[monthly-prompt] Would email ${user.email}: Review ${unitLabel} at ${propertyLabel} for ${prevMonthStart.toLocaleString('en-GB', { month: 'long', year: 'numeric' })}`)
    prompted.push(tenancy.user_id)
  }

  return new Response(
    JSON.stringify({
      period: periodStart,
      prompted: prompted.length,
      skipped: skipped.length,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
})
