'use server'

import { after } from 'next/server'
import { createActionClient } from '@/lib/supabase/server'
import { sendLikeNotification } from '@/lib/email'

export async function toggleLike({
  reviewId,
  postId,
  currentlyLiked,
}: {
  reviewId?: string
  postId?: string
  currentlyLiked: boolean
}): Promise<{ liked: boolean; error?: string }> {
  const client = await createActionClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return { liked: currentlyLiked, error: 'Not authenticated' }

  const userId = user.id

  if (currentlyLiked) {
    const query = client.from('likes').delete().eq('user_id', userId)
    if (reviewId) await query.eq('review_id', reviewId).is('post_id', null)
    else await query.eq('post_id', postId!).is('review_id', null)
    return { liked: false }
  }

  const { error } = await client.from('likes').insert({
    review_id: reviewId ?? null,
    post_id: postId ?? null,
    user_id: userId,
  })
  if (error) return { liked: false, error: error.message }

  // Resolve notification data while still in request context, then defer
  // the Resend HTTP call to after() so it doesn't block the response.
  try {
    const contentTable = postId ? 'posts' : 'reviews'
    const contentId = postId ?? reviewId!
    const contentType = postId ? 'post' : 'review'

    const [contentResult, profileResult] = await Promise.all([
      client.from(contentTable).select('user_id').eq('id', contentId).single(),
      client.from('profiles').select('username').eq('id', userId).single(),
    ])

    const ownerId = contentResult.data?.user_id
    const actorUsername = profileResult.data?.username

    if (ownerId && ownerId !== userId && actorUsername) {
      const { data: recipientEmail } = await client.rpc('get_notification_email', { p_user_id: ownerId })
      if (recipientEmail) {
        after(() => sendLikeNotification({ recipientEmail, actorUsername, contentType }).catch(() => {}))
      }
    }
  } catch { /* notification errors never fail the like */ }

  return { liked: true }
}
