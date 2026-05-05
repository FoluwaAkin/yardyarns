'use client'

import { useState } from 'react'
import { Heart } from 'lucide-react'
import { toggleLike } from '@/app/actions/likes'

interface Props {
  reviewId?: string
  postId?: string
  initialCount: number
  initialLiked: boolean
  userId: string | null
}

export function LikeButton({ reviewId, postId, initialCount, initialLiked, userId }: Props) {
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    if (!userId) return
    setLoading(true)

    const wasLiked = liked
    setLiked(!wasLiked)
    setCount((c) => (wasLiked ? c - 1 : c + 1))

    const result = await toggleLike({ reviewId, postId, currentlyLiked: wasLiked })

    if (result.error) {
      setLiked(wasLiked)
      setCount((c) => (wasLiked ? c + 1 : c - 1))
    }

    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading || !userId}
      className={`flex items-center gap-1.5 py-2 text-xs transition min-h-[40px] ${
        liked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'
      } disabled:opacity-50`}
    >
      <Heart size={14} fill={liked ? 'currentColor' : 'none'} />
      {count > 0 && <span>{count}</span>}
    </button>
  )
}
