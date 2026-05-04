import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MapPin } from 'lucide-react'
import { UnitScorePanel } from '@/components/unit/UnitScorePanel'
import { ReviewCard } from '@/components/review/ReviewCard'
import { PostCard } from '@/components/posts/PostCard'
import { CommentThread } from '@/components/comments/CommentThread'
import { FeedFilter } from '@/components/feed/FeedFilter'
import { ComposerSection } from '@/components/unit/ComposerSection'
import type { FeedFilter as FeedFilterType } from '@/types'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ filter?: string }>
}

export default async function UnitPage({ params, searchParams }: Props) {
  const { id } = await params
  const { filter } = await searchParams
  const feedFilter = (filter as FeedFilterType) ?? 'all'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Unit + property
  const { data: unit } = await supabase
    .from('units')
    .select('id, unit_identifier, property_id')
    .eq('id', id)
    .single()

  if (!unit) notFound()

  const { data: property } = await supabase
    .from('properties')
    .select('id, name, address, city, state')
    .eq('id', unit.property_id)
    .single()

  // Aggregate scores (verified only)
  const { data: scores } = await supabase
    .from('unit_aggregate_scores')
    .select('unit_id, aspect, avg_score, review_count')
    .eq('unit_id', id)

  // Verified tenancy for current user
  let userTenancyId: string | null = null
  let username: string | null = null
  if (user) {
    const [tenancyResult, profileResult] = await Promise.all([
      supabase
        .from('tenancies')
        .select('id')
        .eq('user_id', user.id)
        .eq('unit_id', id)
        .eq('verification_status', 'verified')
        .maybeSingle(),
      supabase.from('profiles').select('username').eq('id', user.id).single(),
    ])
    userTenancyId = tenancyResult.data?.id ?? null
    username = profileResult.data?.username ?? null
  }

  // Reviews with ratings + like/comment counts
  const { data: rawReviews } = await supabase
    .from('reviews')
    .select(`
      id, body, period_start, period_end, created_at, unit_id, tenancy_id, user_id,
      ratings(aspect, score),
      tenancies(verification_status),
      profiles!reviews_user_id_fkey(username)
    `)
    .eq('unit_id', id)
    .order('created_at', { ascending: false })

  // Posts
  const { data: rawPosts } = await supabase
    .from('posts')
    .select(`
      id, body, created_at, unit_id, user_id, media_urls,
      profiles!posts_user_id_fkey(username)
    `)
    .eq('unit_id', id)
    .order('created_at', { ascending: false })

  // Verified post authors: check which post authors have a verified tenancy for this unit
  const postUserIds = [...new Set((rawPosts ?? []).map((p) => p.user_id))]
  const { data: verifiedPostTenancies } = postUserIds.length
    ? await supabase
        .from('tenancies')
        .select('user_id, unit_id')
        .eq('verification_status', 'verified')
        .eq('unit_id', id)
        .in('user_id', postUserIds)
    : { data: [] }
  const verifiedPostKeys = new Set(
    (verifiedPostTenancies ?? []).map((t) => `${t.user_id}:${t.unit_id}`)
  )

  // Likes for current user (if logged in)
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

  // Like counts per review/post
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

  function countFor(items: { review_id?: string | null; post_id?: string | null }[], id: string, field: 'review_id' | 'post_id') {
    return (items ?? []).filter((i) => i[field] === id).length
  }

  // Comments for all reviews and posts on this unit (for thread display)
  const { data: allComments } = await supabase
    .from('comments')
    .select('id, body, created_at, user_id, parent_id, review_id, post_id, profiles!comments_user_id_fkey(username)')
    .or(
      reviewIds.length > 0 && postIds.length > 0
        ? `review_id.in.(${reviewIds.join(',')}),post_id.in.(${postIds.join(',')})`
        : reviewIds.length > 0
        ? `review_id.in.(${reviewIds.join(',')})`
        : postIds.length > 0
        ? `post_id.in.(${postIds.join(',')})`
        : 'id.is.null'
    )
    .order('created_at')

  function commentsFor(field: 'review_id' | 'post_id', id: string) {
    return (allComments ?? [])
      .filter((c) => (c as Record<string, unknown>)[field] === id)
      .map((c) => ({
        ...c,
        username: (c.profiles as unknown as { username: string } | null)?.username ?? 'unknown',
      }))
  }

  // Apply filter
  const reviews = (rawReviews ?? []).filter((r) => {
    const isVerified = (r.tenancies as unknown as { verification_status: string } | null)?.verification_status === 'verified'
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

  const propertyAddress = property
    ? `${property.address}, ${property.city}`
    : 'Unknown property'

  return (
    <div className="space-y-6">
      {/* Unit header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{unit.unit_identifier}</h1>
        {property && (
          <Link
            href={`/properties/${property.id}`}
            className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:underline"
          >
            <MapPin size={13} />
            {property.address}, {property.city}, {property.state}
          </Link>
        )}
      </div>

      {/* Score panel */}
      <UnitScorePanel scores={(scores ?? []).map(s => ({ ...s, avg_score: Number(s.avg_score) }))} />

      {/* Composers — below score, above feed */}
      {user && (
        <ComposerSection unitId={id} userId={user.id} tenancyId={userTenancyId} />
      )}

      {!user && (
        <p className="text-sm text-gray-400 dark:text-gray-500">
          <a href="/auth/signin" className="underline underline-offset-2 hover:text-gray-600 dark:hover:text-gray-300">Sign in</a> to post or write a review.
        </p>
      )}

      {/* Feed filter */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {feed.length} post{feed.length !== 1 ? 's' : ''}
        </h2>
        <FeedFilter />
      </div>

      {/* Feed */}
      {feed.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
          No posts yet. Be the first to share your experience.
        </p>
      ) : (
        <div className="space-y-4">
          {feed.map((entry) => {
            if (entry.type === 'review') {
              const r = entry.item
              const isVerified =
                (r.tenancies as unknown as { verification_status: string } | null)?.verification_status === 'verified'
              const profile = r.profiles as unknown as { username: string } | null
              return (
                <div key={r.id} id={`review-${r.id}`}>
                  <ReviewCard
                    review={r}
                    username={profile?.username ?? 'unknown'}
                    isVerified={isVerified}
                    unitLabel={unit.unit_identifier}
                    propertyAddress={propertyAddress}
                    propertyId={unit.property_id}
                    ratings={(r.ratings as { aspect: string; score: number }[]) ?? []}
                    likeCount={countFor(reviewLikeCounts.data ?? [], r.id, 'review_id')}
                    commentCount={countFor(reviewCommentCounts.data ?? [], r.id, 'review_id')}
                    hasLiked={userReviewLikes.has(r.id)}
                    currentUserId={user?.id ?? null}
                  />
                  <div className="mt-2 px-1">
                    <CommentThread
                      reviewId={r.id}
                      initialComments={commentsFor('review_id', r.id)}
                      currentUserId={user?.id ?? null}
                      currentUsername={username}
                    />
                  </div>
                </div>
              )
            } else {
              const p = entry.item
              const profile = p.profiles as unknown as { username: string } | null
              return (
                <div key={p.id} id={`post-${p.id}`}>
                  <PostCard
                    post={p}
                    username={profile?.username ?? 'unknown'}
                    isVerified={verifiedPostKeys.has(`${p.user_id}:${p.unit_id}`)}
                    unitLabel={unit.unit_identifier}
                    propertyAddress={propertyAddress}
                    propertyId={unit.property_id}
                    mediaUrls={(p.media_urls as string[]) ?? []}
                    likeCount={countFor(postLikeCounts.data ?? [], p.id, 'post_id')}
                    commentCount={countFor(postCommentCounts.data ?? [], p.id, 'post_id')}
                    hasLiked={userPostLikes.has(p.id)}
                    currentUserId={user?.id ?? null}
                  />
                  <div className="mt-2 px-1">
                    <CommentThread
                      postId={p.id}
                      initialComments={commentsFor('post_id', p.id)}
                      currentUserId={user?.id ?? null}
                      currentUsername={username}
                    />
                  </div>
                </div>
              )
            }
          })}
        </div>
      )}

    </div>
  )
}
