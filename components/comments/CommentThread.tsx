'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { Loader2, CornerDownRight } from 'lucide-react'

interface Comment {
  id: string
  body: string
  created_at: string
  user_id: string
  parent_id: string | null
  username: string
}

interface Props {
  reviewId?: string
  postId?: string
  initialComments: Comment[]
  currentUserId: string | null
  currentUsername: string | null
}

function CommentInput({
  onSubmit,
  placeholder = 'Add a comment…',
}: {
  onSubmit: (body: string) => Promise<void>
  placeholder?: string
}) {
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) return
    setLoading(true)
    await onSubmit(body.trim())
    setBody('')
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={placeholder}
        maxLength={500}
        className="flex-1 rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2.5 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 dark:focus:border-gray-400 dark:focus:ring-gray-400 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 min-h-[44px]"
      />
      <button
        type="submit"
        disabled={loading || !body.trim()}
        className="flex items-center gap-1 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50 min-h-[44px]"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : 'Post'}
      </button>
    </form>
  )
}

export function CommentThread({
  reviewId,
  postId,
  initialComments,
  currentUserId,
  currentUsername,
}: Props) {
  const supabase = createClient()
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)

  async function submitComment(body: string, parentId: string | null = null) {
    if (!currentUserId) return
    const { data, error } = await supabase
      .from('comments')
      .insert({
        review_id: reviewId ?? null,
        post_id: postId ?? null,
        user_id: currentUserId,
        parent_id: parentId,
        body,
      })
      .select('id, body, created_at, user_id, parent_id')
      .single()

    if (!error && data) {
      setComments((prev) => [
        ...prev,
        { ...data, username: currentUsername ?? 'you' },
      ])
      setReplyingTo(null)
    }
  }

  const roots = comments.filter((c) => !c.parent_id)
  const replies = comments.filter((c) => c.parent_id)

  function getReplies(parentId: string) {
    return replies.filter((r) => r.parent_id === parentId)
  }

  function renderComment(comment: Comment, depth = 0) {
    const children = getReplies(comment.id)
    return (
      <div key={comment.id} className={depth > 0 ? 'ml-4 mt-2' : ''}>
        <div className={`rounded-lg px-3 py-2.5 ${depth === 0 ? 'bg-gray-50 dark:bg-gray-800' : 'bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700/50'}`}>
          <div className="flex items-baseline justify-between gap-2 mb-1">
            <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">@{comment.username}</span>
            <span className="shrink-0 text-[10px] text-gray-400 dark:text-gray-500">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </span>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300">{comment.body}</p>
          {currentUserId && depth === 0 && (
            <button
              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
              className="mt-2 flex items-center gap-1 py-1 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
            >
              <CornerDownRight size={11} />
              Reply
            </button>
          )}
        </div>

        {replyingTo === comment.id && (
          <div className="ml-4 mt-2">
            <CommentInput
              placeholder={`Reply to @${comment.username}…`}
              onSubmit={(body) => submitComment(body, comment.id)}
            />
          </div>
        )}

        {children.map((child) => renderComment(child, depth + 1))}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {currentUserId && (
        <CommentInput onSubmit={(body) => submitComment(body)} />
      )}

      {roots.length > 0 && (
        <div className="space-y-2">
          {roots.map((c) => renderComment(c))}
        </div>
      )}

      {comments.length === 0 && !currentUserId && (
        <p className="text-xs text-gray-400 dark:text-gray-500">
          <a href="/auth/signin" className="underline">Sign in</a> to comment.
        </p>
      )}
    </div>
  )
}
