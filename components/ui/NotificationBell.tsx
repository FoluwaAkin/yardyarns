import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Bell } from 'lucide-react'

export async function NotificationBell({ userId }: { userId: string }) {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false)

  const unread = error ? 0 : (count ?? 0)

  return (
    <Link
      href="/notifications"
      title="Notifications"
      className="relative flex items-center justify-center rounded-lg px-3 py-2 text-gray-600 dark:text-gray-400 transition hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 min-h-[40px]"
    >
      <Bell size={16} />
      {unread > 0 && (
        <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-gray-900 dark:bg-gray-100 text-[10px] font-bold text-white dark:text-gray-900">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </Link>
  )
}
