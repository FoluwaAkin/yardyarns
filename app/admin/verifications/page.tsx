import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { formatDistanceToNow } from 'date-fns'
import { FileText, ExternalLink } from 'lucide-react'
import { VerificationActions } from './VerificationActions'

export default async function VerificationsPage() {
  const authClient = await createClient()
  const { data: { session } } = await authClient.auth.getSession()

  if (!session) return null  // layout already redirects, this is a safety guard

  // Use JWT client so admin RLS policies fire
  const db = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${session.access_token}` } } }
  )

  const { data: pending } = await db
    .from('tenancies')
    .select(`
      id, start_date, end_date, agreement_url, created_at, verification_status,
      profiles!tenancies_user_id_fkey(username),
      units(unit_identifier, properties(address, city, state))
    `)
    .eq('verification_status', 'pending')
    .order('created_at', { ascending: true })

  // Generate signed URLs for each agreement (1 hour expiry)
  const signedUrls: Record<string, string> = {}
  for (const t of pending ?? []) {
    if (t.agreement_url) {
      const { data } = await db.storage
        .from('tenancy-agreements')
        .createSignedUrl(t.agreement_url, 3600)
      if (data?.signedUrl) signedUrls[t.id] = data.signedUrl
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Tenancy verifications</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {(pending ?? []).length} pending request{(pending ?? []).length !== 1 ? 's' : ''}
        </p>
      </div>

      {(pending ?? []).length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 py-12 text-center">
          <FileText size={32} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <p className="text-sm text-gray-400 dark:text-gray-500">No pending requests.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(pending ?? []).map((t) => {
            const profile = t.profiles as unknown as { username: string } | null
            const unit = t.units as unknown as {
              unit_identifier: string
              properties: { address: string; city: string; state: string } | null
            } | null
            const prop = unit?.properties

            return (
              <div
                key={t.id}
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm"
              >
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      @{profile?.username ?? 'unknown'}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      submitted {formatDistanceToNow(new Date(t.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <VerificationActions tenancyId={t.id} />
                </div>

                <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                  <p>
                    <span className="text-gray-400 dark:text-gray-500">Unit </span>
                    {unit?.unit_identifier ?? '—'}
                  </p>
                  {prop && (
                    <p>
                      <span className="text-gray-400 dark:text-gray-500">Property </span>
                      {prop.address}, {prop.city}, {prop.state}
                    </p>
                  )}
                  <p>
                    <span className="text-gray-400 dark:text-gray-500">Period </span>
                    {t.start_date} → {t.end_date ?? 'present'}
                  </p>
                </div>

                {signedUrls[t.id] && (
                  <a
                    href={signedUrls[t.id]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 underline underline-offset-2 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    <ExternalLink size={12} />
                    View agreement
                  </a>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
