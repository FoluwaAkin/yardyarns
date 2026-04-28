import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ReviewCard } from '@/components/review/ReviewCard'
import { PostCard } from '@/components/posts/PostCard'
import { EagleAvatar, type EaglePersonality } from '@/components/ui/EagleAvatar'
import { AvatarPicker } from '@/components/profile/AvatarPicker'
import { BadgeCheck, Clock, XCircle, FileText, Plus, Pencil } from 'lucide-react'

const STATUS_META = {
  pending: { label: 'Under review', icon: Clock, className: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' },
  verified: { label: 'Verified', icon: BadgeCheck, className: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
  rejected: { label: 'Rejected', icon: XCircle, className: 'text-red-500 bg-red-50 dark:bg-red-900/20' },
}

interface Props {
  params: Promise<{ username: string }>
}

export default async function UserProfilePage({ params }: Props) {
  const { username } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, avatar, created_at')
    .eq('username', username)
    .single()

  if (!profile) notFound()

  const { data: { user } } = await supabase.auth.getUser()
  const isOwnProfile = user?.id === profile.id

  // Fetch tenancies if own profile
  const tenanciesQuery = isOwnProfile
    ? supabase
        .from('tenancies')
        .select('id, unit_id, start_date, end_date, verification_status, units(unit_identifier, property_id, properties(address, city))')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
    : null

  const [{ data: reviews }, { data: posts }, tenancyResult] = await Promise.all([
    supabase
      .from('reviews')
      .select(`
        id, body, period_start, period_end, created_at, unit_id, tenancy_id, user_id,
        ratings(aspect, score),
        tenancies(verification_status),
        profiles!reviews_user_id_fkey(username),
        units(unit_identifier, property_id, properties(id, address, city))
      `)
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('posts')
      .select(`
        id, body, created_at, unit_id, user_id, media_urls,
        profiles!posts_user_id_fkey(username),
        units(unit_identifier, property_id, properties(id, address, city))
      `)
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false }),
    tenanciesQuery ?? Promise.resolve({ data: null }),
  ])

  const tenancies = tenancyResult.data

  // Like counts
  const reviewIds = (reviews ?? []).map((r) => r.id)
  const postIds = (posts ?? []).map((p) => p.id)
  const [rlc, plc, rcc, pcc] = await Promise.all([
    reviewIds.length ? supabase.from('likes').select('review_id').in('review_id', reviewIds) : { data: [] },
    postIds.length ? supabase.from('likes').select('post_id').in('post_id', postIds) : { data: [] },
    reviewIds.length ? supabase.from('comments').select('review_id').in('review_id', reviewIds) : { data: [] },
    postIds.length ? supabase.from('comments').select('post_id').in('post_id', postIds) : { data: [] },
  ])

  let userReviewLikes = new Set<string>()
  let userPostLikes = new Set<string>()
  if (user) {
    const [rl, pl] = await Promise.all([
      supabase.from('likes').select('review_id').eq('user_id', user.id).not('review_id', 'is', null),
      supabase.from('likes').select('post_id').eq('user_id', user.id).not('post_id', 'is', null),
    ])
    userReviewLikes = new Set((rl.data ?? []).map((l) => l.review_id!))
    userPostLikes = new Set((pl.data ?? []).map((l) => l.post_id!))
  }

  function countFor(items: { review_id?: string | null; post_id?: string | null }[], id: string, field: 'review_id' | 'post_id') {
    return (items ?? []).filter((i) => i[field] === id).length
  }

  type FeedItem =
    | { type: 'review'; item: NonNullable<typeof reviews>[0] }
    | { type: 'post'; item: NonNullable<typeof posts>[0] }

  const feed: FeedItem[] = [
    ...(reviews ?? []).map((r) => ({ type: 'review' as const, item: r })),
    ...(posts ?? []).map((p) => ({ type: 'post' as const, item: p })),
  ].sort((a, b) => new Date(b.item.created_at).getTime() - new Date(a.item.created_at).getTime())

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <EagleAvatar
              personality={(profile.avatar as EaglePersonality) ?? 'happy'}
              size={56}
              showRing={isOwnProfile}
            />
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">@{profile.username}</h1>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                {(reviews ?? []).length} review{(reviews ?? []).length !== 1 ? 's' : ''} ·{' '}
                {(posts ?? []).length} post{(posts ?? []).length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          {isOwnProfile && (
            <div className="flex items-center gap-2">
              <Link
                href="/onboarding?next=/dashboard"
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 transition hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <Pencil size={12} />
                Username
              </Link>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 transition hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-red-500 dark:hover:text-red-400"
                >
                  Sign out
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Avatar picker — own profile only */}
        {isOwnProfile && (
          <AvatarPicker current={(profile.avatar as EaglePersonality) ?? 'happy'} />
        )}
      </div>

      {/* Tenancies — own profile only */}
      {isOwnProfile && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Tenancies
            </h2>
            <Link
              href="/dashboard/verify"
              className="flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 transition hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <Plus size={12} />
              Add tenancy
            </Link>
          </div>

          {(tenancies ?? []).length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 py-6 text-center">
              <FileText size={24} className="mx-auto mb-2 text-gray-300 dark:text-gray-600" />
              <p className="text-sm text-gray-400 dark:text-gray-500">No tenancies yet.</p>
              <Link
                href="/dashboard/verify"
                className="mt-2 inline-block text-xs text-gray-500 dark:text-gray-400 underline underline-offset-2 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Upload your agreement to get verified
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
              {(tenancies ?? []).map((t) => {
                const status = t.verification_status as keyof typeof STATUS_META
                const meta = STATUS_META[status] ?? STATUS_META.pending
                const unit = t.units as unknown as {
                  unit_identifier: string
                  property_id: string
                  properties: { address: string; city: string } | null
                } | null

                return (
                  <div key={t.id} className="flex items-start gap-3 justify-between px-4 py-4 min-h-[56px]">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {unit?.unit_identifier ?? 'Unknown unit'}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {unit?.properties ? `${unit.properties.address}, ${unit.properties.city}` : ''}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {t.start_date} {t.end_date ? `→ ${t.end_date}` : '(current)'}
                      </p>
                    </div>
                    <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${meta.className}`}>
                      <meta.icon size={12} />
                      {meta.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}

      {/* Feed */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {isOwnProfile ? 'Your activity' : 'Activity'} ({feed.length})
        </h2>

        {feed.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">No posts yet.</p>
        ) : (
          <div className="space-y-4">
            {feed.map((entry) => {
              if (entry.type === 'review') {
                const r = entry.item
                const isVerified = (r.tenancies as unknown as { verification_status: string } | null)?.verification_status === 'verified'
                const profileData = r.profiles as unknown as { username: string } | null
                const unitData = r.units as unknown as { unit_identifier: string; property_id: string; properties: { id: string; address: string; city: string } | null } | null
                return (
                  <ReviewCard
                    key={r.id}
                    review={r}
                    username={profileData?.username ?? username}
                    isVerified={isVerified}
                    unitLabel={unitData?.unit_identifier ?? ''}
                    propertyAddress={unitData?.properties ? `${unitData.properties.address}, ${unitData.properties.city}` : ''}
                    propertyId={unitData?.properties?.id ?? unitData?.property_id ?? ''}
                    ratings={(r.ratings as { aspect: string; score: number }[]) ?? []}
                    likeCount={countFor(rlc.data ?? [], r.id, 'review_id')}
                    commentCount={countFor(rcc.data ?? [], r.id, 'review_id')}
                    hasLiked={userReviewLikes.has(r.id)}
                    currentUserId={user?.id ?? null}
                    currentUsername={isOwnProfile ? profile.username : null}
                  />
                )
              } else {
                const p = entry.item
                const profileData = p.profiles as unknown as { username: string } | null
                const unitData = p.units as unknown as { unit_identifier: string; property_id: string; properties: { id: string; address: string; city: string } | null } | null
                return (
                  <PostCard
                    key={p.id}
                    post={p}
                    username={profileData?.username ?? username}
                    isVerified={false}
                    unitLabel={unitData?.unit_identifier ?? ''}
                    propertyAddress={unitData?.properties ? `${unitData.properties.address}, ${unitData.properties.city}` : ''}
                    propertyId={unitData?.properties?.id ?? unitData?.property_id ?? ''}
                    mediaUrls={(p.media_urls as string[]) ?? []}
                    likeCount={countFor(plc.data ?? [], p.id, 'post_id')}
                    commentCount={countFor(pcc.data ?? [], p.id, 'post_id')}
                    hasLiked={userPostLikes.has(p.id)}
                    currentUserId={user?.id ?? null}
                    currentUsername={isOwnProfile ? profile.username : null}
                  />
                )
              }
            })}
          </div>
        )}
      </section>
    </div>
  )
}
