'use server'

import { after } from 'next/server'
import { createActionClient } from '@/lib/supabase/server'
import { sendCommentNotification, sendReplyNotification } from '@/lib/email'

export async function addComment({
  body,
  postId,
  reviewId,
  parentId,
}: {
  body: string
  postId?: string
  reviewId?: string
  parentId?: string | null
}): Promise<{
  data: { id: string; body: string; created_at: string; user_id: string; parent_id: string | null } | null
  error: string | null
}> {
  const client = await createActionClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return { data: null, error: 'Not authenticated' }

  const userId = user.id

  const { data, error } = await client
    .from('comments')
    .insert({
      review_id: reviewId ?? null,
      post_id: postId ?? null,
      user_id: userId,
      parent_id: parentId ?? null,
      body,
    })
    .select('id, body, created_at, user_id, parent_id')
    .single()

  if (error || !data) return { data: null, error: error?.message ?? 'Failed to post comment' }

  // Resolve notification data in request context, defer Resend calls
  try {
    const contentType = postId ? 'post' : 'review'
    const contentTable = postId ? 'posts' : 'reviews'
    const contentId = postId ?? reviewId!

    const [contentResult, profileResult] = await Promise.all([
      client.from(contentTable).select('user_id').eq('id', contentId).single(),
      client.from('profiles').select('username').eq('id', userId).single(),
    ])

    const actorUsername = profileResult.data?.username
    const ownerId = contentResult.data?.user_id
    if (!actorUsername) return { data, error: null }

    const emailTasks: Array<() => Promise<void>> = []

    if (ownerId && ownerId !== userId) {
      const { data: ownerEmail } = await client.rpc('get_notification_email', { p_user_id: ownerId })
      if (ownerEmail) {
        emailTasks.push(() => sendCommentNotification({ recipientEmail: ownerEmail, actorUsername, contentType }))
      }
    }

    if (parentId) {
      const { data: parent } = await client.from('comments').select('user_id').eq('id', parentId).single()
      if (parent && parent.user_id !== userId && parent.user_id !== ownerId) {
        const { data: parentEmail } = await client.rpc('get_notification_email', { p_user_id: parent.user_id })
        if (parentEmail) {
          emailTasks.push(() => sendReplyNotification({ recipientEmail: parentEmail, actorUsername }))
        }
      }
    }

    if (emailTasks.length > 0) {
      after(() => Promise.all(emailTasks.map((t) => t().catch(() => {}))))
    }
  } catch { /* notification errors never fail the comment */ }

  return { data, error: null }
}
