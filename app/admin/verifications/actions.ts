'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

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

export async function verifyTenancy(tenancyId: string) {
  const db = await getAdminDb()

  const { error } = await db
    .from('tenancies')
    .update({ verification_status: 'verified' })
    .eq('id', tenancyId)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/verifications')
}

export async function rejectTenancy(tenancyId: string) {
  const db = await getAdminDb()

  const { error } = await db
    .from('tenancies')
    .update({ verification_status: 'rejected' })
    .eq('id', tenancyId)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/verifications')
}
