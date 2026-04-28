'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

const MAX_CHARS = 500

interface Props {
  unitId: string
  userId: string
}

export function PostComposer({ unitId, userId }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (body.trim().length === 0) return
    setError(null)
    setLoading(true)

    const { error: insertError } = await supabase.from('posts').insert({
      unit_id: unitId,
      user_id: userId,
      body: body.trim(),
    })

    setLoading(false)

    if (insertError) {
      setError(insertError.message)
    } else {
      setBody('')
      router.refresh()
    }
  }

  const remaining = MAX_CHARS - body.length

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
      <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
        Share your experience — horror stories or great moments
      </p>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={MAX_CHARS}
        rows={3}
        placeholder="What's it like living here?"
        className="w-full resize-none rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2.5 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 dark:focus:border-gray-400 dark:focus:ring-gray-400 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
      />
      <div className="mt-2 flex items-center justify-between">
        <span className={`text-xs ${remaining < 50 ? 'text-amber-500' : 'text-gray-400'}`}>
          {remaining} characters remaining
        </span>
        <div className="flex items-center gap-2">
          {error && <span className="text-xs text-red-500">{error}</span>}
          <button
            type="submit"
            disabled={loading || body.trim().length === 0}
            className="flex items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700 disabled:opacity-50 min-h-[44px]"
          >
            {loading && <Loader2 size={12} className="animate-spin" />}
            Post
          </button>
        </div>
      </div>
    </form>
  )
}
