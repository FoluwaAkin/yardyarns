'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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
