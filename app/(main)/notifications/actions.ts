'use server'

import { createActionClient } from '@/lib/supabase/server'
import { refresh } from 'next/cache'

export async function markAllRead() {
  const supabase = await createActionClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', user.id)
    .eq('read', false)

  refresh()
}
