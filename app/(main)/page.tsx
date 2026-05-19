import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ReviewCard } from '@/components/review/ReviewCard'
import { PostCard } from '@/components/posts/PostCard'
import { FeedFilter } from '@/components/feed/FeedFilter'
import { ContributeFlow } from '@/components/home/ContributeFlow'
import { ActiveTenancyPrompt, type ActiveTenancyOption } from '@/components/home/ActiveTenancyPrompt'
import type { EaglePersonality } from '@/components/ui/EagleAvatar'
import type { FeedFilter as FeedFilterType } from '@/types'

interface Props {
  searchParams: Promise<{ filter?: string }>
}

export default async function HomePage({ searchParams }: Props) {
  const { filter } = await searchParams
  const feedFilter = (filter as FeedFilterType) ?? 'all'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let username: string | null = null
  let activeTenancies: ActiveTenancyOption[] = []
  if (user) {
    const { data } = await supabase.from('profiles').select('username').eq('id', user.id).single()
    username = data?.username ?? null

    const today = new Date().toISOString().split('T')[0]
    const { data: tenancyRows } = await supabase
      .from('tenancies')
      .select(`unit_id, units(unit_identifier, properties(name, address, city))`)
      .eq('user_id', user.id)
      .eq('verification_status', 'verified')
      .lte('start_date', today)
      .or(`end_date.is.null,end_date.gte.${today}`)
    activeTenancies = (tenancyRows ?? []).map((t) => {
      const u = t.units as unknown as {
        unit_identifier: string
        properties: { name: string | null; address: string; city: string } | null
      } | null
      return {
        unitId: t.unit_id,
        unitLabel: u?.unit_identifier ?? '',
        propertyLabel: u?.properties?.name ?? u?.properties?.address ?? '',
        propertyCity: u?.properties?.city ?? '',
      }
    })
  }

  // Fetch latest reviews with joins
  const { data: rawReviews } = await supabase
    .from('reviews')
    .select(`
      id, body, period_start, period_end, created_at, unit_id, tenancy_id, user_id,
      rent_amount, rent_frequency, service_charge, agency_fee, legal_fee, caution_deposit, currency,
      ratings(aspect, score),
      tenancies(verification_status),
      profiles!reviews_user_id_fkey(username, avatar),
      units(unit_identifier, property_id, properties(id, address, city))
    `)
    .order('created_at', { ascending: false })
    .limit(30)

  // Fetch latest posts with joins
  const { data: rawPosts } = await supabase
    .from('posts')
    .select(`
      id, body, created_at, unit_id, user_id, media_urls,
      profiles!posts_user_id_fkey(username, avatar),
      units(unit_identifier, property_id, properties(id, address, city))
    `)
    .order('created_at', { ascending: false })
    .limit(30)

  // Verified post authors: which (user_id, unit_id) pairs have verified tenancies
  const postUserIds = [...new Set((rawPosts ?? []).map((p) => p.user_id))]
  const { data: verifiedPostTenancies } = postUserIds.length
    ? await supabase
        .from('tenancies')
        .select('user_id, unit_id')
        .eq('verification_status', 'verified')
        .in('user_id', postUserIds)
    : { data: [] }
  const verifiedPostKeys = new Set(
    (verifiedPostTenancies ?? []).map((t) => `${t.user_id}:${t.unit_id}`)
  )

  // User likes
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

  // Like counts
  const reviewIds = (rawReviews ?? []).map((r) => r.id)
  const postIds = (rawPosts ?? []).map((p) => p.id)

  const [reviewLikeCounts, postLikeCounts, reviewCommentCounts, postCommentCounts] =
    await Promise.all([
      reviewIds.length
        ? supabase.from('likes').select('review_id').in('review_id', reviewIds)
        : { data: [] },
      postIds.length
        ? supabase.from('likes').select('post_id').in('post_id', postIds)
        : { data: [] },
      reviewIds.length
        ? supabase.from('comments').select('review_id').in('review_id', reviewIds)
        : { data: [] },
      postIds.length
        ? supabase.from('comments').select('post_id').in('post_id', postIds)
        : { data: [] },
    ])

  function countFor(
    items: { review_id?: string | null; post_id?: string | null }[],
    id: string,
    field: 'review_id' | 'post_id'
  ) {
    return (items ?? []).filter((i) => i[field] === id).length
  }

  // Apply filter
  const reviews = (rawReviews ?? []).filter((r) => {
    const isVerified =
      (r.tenancies as unknown as { verification_status: string } | null)?.verification_status === 'verified'
    if (feedFilter === 'verified') return isVerified
    if (feedFilter === 'unverified') return !isVerified
    return true
  })

  const posts = (rawPosts ?? []).filter((p) => {
    const isVerified = verifiedPostKeys.has(`${p.user_id}:${p.unit_id}`)
    if (feedFilter === 'verified') return isVerified
    if (feedFilter === 'unverified') return !isVerified
    return true
  })

  // Interleave by created_at
  type FeedItem =
    | { type: 'review'; item: (typeof reviews)[0] }
    | { type: 'post'; item: (typeof posts)[0] }

  const feed: FeedItem[] = [
    ...reviews.map((r) => ({ type: 'review' as const, item: r })),
    ...posts.map((p) => ({ type: 'post' as const, item: p })),
  ].sort((a, b) => new Date(b.item.created_at).getTime() - new Date(a.item.created_at).getTime())

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">What&apos;s it really like?</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Honest reviews from real tenants. No agents, no spin.
        </p>
      </div>

      {/* Personalised prompt for verified active tenants */}
      {user && <ActiveTenancyPrompt userId={user.id} tenancies={activeTenancies} />}

      {/* Contribute CTAs */}
      <ContributeFlow currentUserId={user?.id ?? null} currentUsername={username} />

      {/* Feed filter */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Recent activity</h2>
        <FeedFilter />
      </div>

      {/* Feed */}
      {feed.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 py-10 text-center text-sm text-gray-400 dark:text-gray-500">
          No posts yet.{' '}
          <Link href="/search" className="underline">
            Find a property
          </Link>{' '}
          and be the first to review.
        </p>
      ) : (
        <div className="space-y-4">
          {feed.map((entry) => {
            if (entry.type === 'review') {
              const r = entry.item
              const isVerified =
                (r.tenancies as unknown as { verification_status: string } | null)?.verification_status ===
                'verified'
              const profile = r.profiles as unknown as { username: string; avatar: string | null } | null
              const unitData = r.units as unknown as {
                unit_identifier: string
                property_id: string
                properties: { id: string; address: string; city: string } | null
              } | null

              return (
                <ReviewCard
                  key={r.id}
                  review={r}
                  username={profile?.username ?? 'unknown'}
                  avatar={(profile?.avatar ?? null) as EaglePersonality | null}
                  isVerified={isVerified}
                  unitLabel={unitData?.unit_identifier ?? ''}
                  propertyAddress={
                    unitData?.properties
                      ? `${unitData.properties.address}, ${unitData.properties.city}`
                      : ''
                  }
                  propertyId={unitData?.properties?.id ?? unitData?.property_id ?? ''}
                  ratings={(r.ratings as { aspect: string; score: number }[]) ?? []}
                  likeCount={countFor(reviewLikeCounts.data ?? [], r.id, 'review_id')}
                  commentCount={countFor(reviewCommentCounts.data ?? [], r.id, 'review_id')}
                  hasLiked={userReviewLikes.has(r.id)}
                  currentUserId={user?.id ?? null}
                />
              )
            } else {
              const p = entry.item
              const profile = p.profiles as unknown as { username: string; avatar: string | null } | null
              const unitData = p.units as unknown as {
                unit_identifier: string
                property_id: string
                properties: { id: string; address: string; city: string } | null
              } | null

              return (
                <PostCard
                  key={p.id}
                  post={p}
                  username={profile?.username ?? 'unknown'}
                  avatar={(profile?.avatar ?? null) as EaglePersonality | null}
                  isVerified={verifiedPostKeys.has(`${p.user_id}:${p.unit_id}`)}
                  unitLabel={unitData?.unit_identifier ?? ''}
                  propertyAddress={
                    unitData?.properties
                      ? `${unitData.properties.address}, ${unitData.properties.city}`
                      : ''
                  }
                  propertyId={unitData?.properties?.id ?? unitData?.property_id ?? ''}
                  mediaUrls={(p.media_urls as string[]) ?? []}
                  likeCount={countFor(postLikeCounts.data ?? [], p.id, 'post_id')}
                  commentCount={countFor(postCommentCounts.data ?? [], p.id, 'post_id')}
                  hasLiked={userPostLikes.has(p.id)}
                  currentUserId={user?.id ?? null}
                />
              )
            }
          })}
        </div>
      )}
    </div>
  )
}
