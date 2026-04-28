'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { sendTenancyVerified, sendTenancyRejected } from '@/lib/email'

async function getAdminDb() {
  const authClient = await createClient()
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

async function getTenancyWithUser(db: ReturnType<typeof createSupabaseClient>, tenancyId: string) {
  const { data } = await db
    .from('tenancies')
    .select(`
      user_id,
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

  // Notify user — best-effort
  if (tenancy) {
    const profile = tenancy.profiles as unknown as { username: string } | null
    const unit = tenancy.units as unknown as { unit_identifier: string; properties: { address: string; city: string } | null } | null
    await sendTenancyVerified({
      userId: tenancy.user_id,
      username: profile?.username ?? '',
      unitIdentifier: unit?.unit_identifier ?? '',
      propertyAddress: unit?.properties ? `${unit.properties.address}, ${unit.properties.city}` : '',
    }).catch(() => {})
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

  // Notify user — best-effort
  if (tenancy) {
    const profile = tenancy.profiles as unknown as { username: string } | null
    const unit = tenancy.units as unknown as { unit_identifier: string; properties: { address: string; city: string } | null } | null
    await sendTenancyRejected({
      userId: tenancy.user_id,
      username: profile?.username ?? '',
      unitIdentifier: unit?.unit_identifier ?? '',
      propertyAddress: unit?.properties ? `${unit.properties.address}, ${unit.properties.city}` : '',
    }).catch(() => {})
  }

  revalidatePath('/admin/verifications')
}
