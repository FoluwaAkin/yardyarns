'use client'

import { useState } from 'react'
import { MessageSquare, Star, X } from 'lucide-react'
import { PostComposer } from '@/components/posts/PostComposer'
import { ReviewComposer } from '@/components/review/ReviewComposer'

interface Props {
  unitId: string
  userId: string
  tenancyId: string | null
}

export function ComposerSection({ unitId, userId, tenancyId }: Props) {
  const [open, setOpen] = useState<'post' | 'review' | null>(null)

  function toggle(type: 'post' | 'review') {
    setOpen((prev) => (prev === type ? null : type))
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
        Share your experience
      </p>

      <div className="flex gap-2">
        <button
          onClick={() => toggle('post')}
          className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition min-h-[44px] ${
            open === 'post'
              ? 'border-gray-900 dark:border-gray-100 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
          }`}
        >
          <MessageSquare size={14} />
          Post a story
          {open === 'post' && <X size={13} className="ml-1 opacity-60" />}
        </button>

        <button
          onClick={() => toggle('review')}
          className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition min-h-[44px] ${
            open === 'review'
              ? 'border-gray-900 dark:border-gray-100 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
          }`}
        >
          <Star size={14} />
          Write a review
          {open === 'review' && <X size={13} className="ml-1 opacity-60" />}
        </button>
      </div>

      {open === 'post' && <PostComposer unitId={unitId} userId={userId} />}
      {open === 'review' && <ReviewComposer unitId={unitId} userId={userId} tenancyId={tenancyId} />}
    </div>
  )
}
