'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deletePost(postId: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: post } = await supabase
    .from('posts')
    .select('media_urls')
    .eq('id', postId)
    .eq('user_id', user.id)
    .single()

  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId)
    .eq('user_id', user.id)

  if (!error && post?.media_urls?.length) {
    const paths = post.media_urls
      .map((url: string) => url.split('/post-media/')[1])
      .filter(Boolean)
    if (paths.length) await supabase.storage.from('post-media').remove(paths)
  }

  return { error: error?.message ?? null }
}

export async function deleteReview(reviewId: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', reviewId)
    .eq('user_id', user.id)

  return { error: error?.message ?? null }
}

export async function updateAvatar(avatar: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const valid = ['happy', 'sad', 'curious', 'excited', 'angry']
  if (!valid.includes(avatar)) return

  await supabase.from('profiles').update({ avatar }).eq('id', user.id)

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single()

  if (profile?.username) {
    revalidatePath(`/u/${profile.username}`)
  }
}
