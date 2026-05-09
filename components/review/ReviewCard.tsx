'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { MapPin, MessageCircle, Trash2, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AspectRatingBar } from './AspectRatingBar'
import { LikeButton } from '@/components/feed/LikeButton'
import { VerifiedBadge } from '@/components/feed/VerifiedBadge'
import { CommentThread } from '@/components/comments/CommentThread'
import { REVIEW_ASPECTS } from '@/types'
import { deleteReview } from '@/app/(main)/u/[username]/actions'

interface RatingRow {
  aspect: string
  score: number
}

interface CommentRow {
  id: string
  body: string
  created_at: string
  user_id: string
  parent_id: string | null
  username: string
}

interface Props {
  review: {
    id: string
    body: string
    period_start: string
    period_end: string
    created_at: string
    unit_id: string
    tenancy_id: string | null
    user_id: string
  }
  username: string
  isVerified: boolean
  unitLabel: string
  propertyAddress: string
  propertyId: string
  ratings: RatingRow[]
  likeCount: number
  commentCount: number
  hasLiked: boolean
  currentUserId: string | null
  currentUsername?: string | null
  showDelete?: boolean
}

function formatPeriod(start: string, end: string) {
  const s = new Date(start)
  const e = new Date(end)
  const opts: Intl.DateTimeFormatOptions = { month: 'short', year: 'numeric' }
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    return s.toLocaleDateString('en-GB', opts)
  }
  return `${s.toLocaleDateString('en-GB', opts)} – ${e.toLocaleDateString('en-GB', opts)}`
}

export function ReviewCard({
  review,
  username,
  isVerified,
  unitLabel,
  propertyAddress,
  propertyId,
  ratings,
  likeCount,
  commentCount,
  hasLiked,
  currentUserId,
  currentUsername = null,
  showDelete = false,
}: Props) {
  const ratingMap = Object.fromEntries(ratings.map((r) => [r.aspect, r.score]))
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<CommentRow[] | null>(null)
  const [liveCount, setLiveCount] = useState(commentCount)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleted, setDeleted] = useState(false)

  useEffect(() => {
    if (!showComments || comments !== null) return
    const supabase = createClient()
    supabase
      .from('comments')
      .select('id, body, created_at, user_id, parent_id, profiles!comments_user_id_fkey(username)')
      .eq('review_id', review.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        const rows = (data ?? []).map((c) => ({
          id: c.id,
          body: c.body,
          created_at: c.created_at,
          user_id: c.user_id,
          parent_id: c.parent_id,
          username: (c.profiles as unknown as { username: string } | null)?.username ?? 'unknown',
        }))
        setComments(rows)
        setLiveCount(rows.filter((r) => !r.parent_id).length)
      })
  }, [showComments, review.id, comments])

  if (deleted) return null

  return (
    <article className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm dark:shadow-gray-900">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Link href={`/u/${username}`} className="text-sm font-semibold text-gray-900 dark:text-gray-100 hover:underline">
            @{username}
          </Link>
          {isVerified && <VerifiedBadge />}
          <span className="rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Review
          </span>
        </div>
        <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500">
          {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
        </span>
      </div>

      {/* Location */}
      <div className="mb-2 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
        <MapPin size={12} />
        <Link href={`/units/${review.unit_id}`} className="hover:underline">
          {unitLabel}
        </Link>
        <span>·</span>
        <Link href={`/properties/${propertyId}`} className="hover:underline">
          {propertyAddress}
        </Link>
      </div>

      {/* Period */}
      <p className="mb-3 text-xs text-gray-400 dark:text-gray-500">
        Period: {formatPeriod(review.period_start, review.period_end)}
      </p>

      {/* Body */}
      <p className="mb-4 text-sm leading-relaxed text-gray-800 dark:text-gray-200">{review.body}</p>

      {/* Ratings */}
      {ratings.length > 0 && (
        <div className="mb-4 space-y-1.5 rounded-lg bg-gray-50 dark:bg-gray-800 p-3">
          {REVIEW_ASPECTS.map(({ key, label }) => {
            const score = ratingMap[key]
            if (score === undefined) return null
            return <AspectRatingBar key={key} label={label} score={score} />
          })}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 border-t border-gray-100 dark:border-gray-700/50 pt-3">
        <LikeButton
          reviewId={review.id}
          initialCount={likeCount}
          initialLiked={hasLiked}
          userId={currentUserId}
        />
        <button
          onClick={() => setShowComments((v) => !v)}
          className="flex items-center gap-1.5 py-2 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition min-h-[40px]"
        >
          <MessageCircle size={14} />
          {liveCount > 0 && <span>{liveCount}</span>}
          <span>{showComments ? 'Hide' : 'Comment'}</span>
        </button>

        {showDelete && (
          <div className="ml-auto flex items-center gap-2">
            {confirmDelete ? (
              <>
                <span className="text-xs text-gray-400 dark:text-gray-500">Delete review?</span>
                <button
                  disabled={deleting}
                  onClick={async () => {
                    setDeleting(true)
                    const { error } = await deleteReview(review.id)
                    if (!error) setDeleted(true)
                    else setDeleting(false)
                  }}
                  className="text-xs font-medium text-red-500 hover:text-red-600 disabled:opacity-50 min-h-[40px] px-1"
                >
                  {deleting ? '…' : 'Yes'}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 min-h-[40px] px-1"
                >
                  No
                </button>
              </>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="p-2 text-gray-300 dark:text-gray-600 hover:text-red-400 dark:hover:text-red-500 transition min-h-[40px]"
                aria-label="Delete review"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Inline comments */}
      {showComments && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/50">
          {comments === null ? (
            <div className="flex justify-center py-4">
              <Loader2 size={16} className="animate-spin text-gray-300 dark:text-gray-600" />
            </div>
          ) : (
            <CommentThread
              reviewId={review.id}
              initialComments={comments}
              currentUserId={currentUserId}
              currentUsername={currentUsername}
            />
          )}
        </div>
      )}
    </article>
  )
}
