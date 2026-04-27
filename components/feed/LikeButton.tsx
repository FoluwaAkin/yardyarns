'use client'

import { useState } from 'react'
import { Heart } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  reviewId?: string
  postId?: string
  initialCount: number
  initialLiked: boolean
  userId: string | null
}

export function LikeButton({ reviewId, postId, initialCount, initialLiked, userId }: Props) {
  const supabase = createClient()
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    if (!userId) return
    setLoading(true)

    if (liked) {
      const query = supabase.from('likes').delete().eq('user_id', userId)
      if (reviewId) await query.eq('review_id', reviewId).is('post_id', null)
      else await query.eq('post_id', postId!).is('review_id', null)

      setLiked(false)
      setCount((c) => c - 1)
    } else {
      await supabase.from('likes').insert({
        review_id: reviewId ?? null,
        post_id: postId ?? null,
        user_id: userId,
      })
      setLiked(true)
      setCount((c) => c + 1)
    }

    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading || !userId}
      className={`flex items-center gap-1.5 text-xs transition ${
        liked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'
      } disabled:opacity-50`}
    >
      <Heart size={14} fill={liked ? 'currentColor' : 'none'} />
      {count > 0 && <span>{count}</span>}
    </button>
  )
}
