'use server'

import { createActionClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { sendTenancyVerified, sendTenancyRejected } from '@/lib/email'

async function getRecipientEmail(db: Awaited<ReturnType<typeof createActionClient>>, userId: string): Promise<string> {
  const { data } = await db.rpc('get_notification_email', { p_user_id: userId })
  return data ?? ''
}

async function getAdminDb() {
  const authClient = await createActionClient()
  const { data: { session } } = await authClient.auth.getSession()
  if (!session) redirect('/auth/signin')

  // Verify admin server-side before any write
  const { data: profile } = await authClient
    .from('profiles')
    .select('is_admin')
    .eq('id', session.user.id)
    .single()

  if (!profile?.is_admin) redirect('/')

  // DB client with explicit JWT so admin RLS policies fire correctly
  const db = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${session.access_token}` } } }
  )

  return db
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getTenancyWithUser(db: any, tenancyId: string) {
  const { data } = await db
    .from('tenancies')
    .select(`
      user_id,
      unit_id,
      profiles!tenancies_user_id_fkey(username),
      units(unit_identifier, properties(address, city, state))
    `)
    .eq('id', tenancyId)
    .single()
  return data
}

export async function verifyTenancy(tenancyId: string) {
  const db = await getAdminDb()

  const tenancy = await getTenancyWithUser(db, tenancyId)

  const { error } = await db
    .from('tenancies')
    .update({ verification_status: 'verified' })
    .eq('id', tenancyId)

  if (error) throw new Error(error.message)

  // Retroactively link any reviews this user wrote for the same unit before verifying
  if (tenancy?.unit_id) {
    await db.rpc('link_reviews_to_tenancy', {
      p_tenancy_id: tenancyId,
      p_user_id:    tenancy.user_id,
      p_unit_id:    tenancy.unit_id,
    }).then(undefined, () => {})
  }

  // In-app + email notifications — best-effort
  if (tenancy) {
    const profile = tenancy.profiles as unknown as { username: string } | null
    const unit = tenancy.units as unknown as { unit_identifier: string; properties: { address: string; city: string } | null } | null
    const unitLabel = unit?.unit_identifier ?? ''
    const address = unit?.properties ? `${unit.properties.address}, ${unit.properties.city}` : ''

    const recipientEmail = await getRecipientEmail(db, tenancy.user_id).catch(() => '')
    await Promise.all([
      db.rpc('create_notification', {
        p_user_id: tenancy.user_id,
        p_type:    'tenancy_verified',
        p_title:   'Tenancy verified',
        p_body:    `Your tenancy at ${unitLabel}${address ? ', ' + address : ''} has been verified. Your ratings now count.`,
        p_link:    '/dashboard',
      }).then(undefined, () => {}),
      sendTenancyVerified({
        email: recipientEmail,
        username: profile?.username ?? '',
        unitIdentifier: unitLabel,
        propertyAddress: address,
      }).then(undefined, () => {}),
    ])
  }

  revalidatePath('/admin/verifications')
}

export async function rejectTenancy(tenancyId: string) {
  const db = await getAdminDb()

  const tenancy = await getTenancyWithUser(db, tenancyId)

  const { error } = await db
    .from('tenancies')
    .update({ verification_status: 'rejected' })
    .eq('id', tenancyId)

  if (error) throw new Error(error.message)

  // In-app + email notifications — best-effort
  if (tenancy) {
    const profile = tenancy.profiles as unknown as { username: string } | null
    const unit = tenancy.units as unknown as { unit_identifier: string; properties: { address: string; city: string } | null } | null
    const unitLabel = unit?.unit_identifier ?? ''
    const address = unit?.properties ? `${unit.properties.address}, ${unit.properties.city}` : ''

    const recipientEmail = await getRecipientEmail(db, tenancy.user_id).catch(() => '')
    await Promise.all([
      db.rpc('create_notification', {
        p_user_id: tenancy.user_id,
        p_type:    'tenancy_rejected',
        p_title:   'Tenancy not verified',
        p_body:    `We couldn't verify your tenancy at ${unitLabel}${address ? ', ' + address : ''}. You can resubmit with a clearer document.`,
        p_link:    '/dashboard/verify',
      }).then(undefined, () => {}),
      sendTenancyRejected({
        email: recipientEmail,
        username: profile?.username ?? '',
        unitIdentifier: unitLabel,
        propertyAddress: address,
      }).then(undefined, () => {}),
    ])
  }

  revalidatePath('/admin/verifications')
}
