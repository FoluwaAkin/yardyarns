import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Bell, Heart, MessageCircle, BadgeCheck, XCircle, CornerDownRight } from 'lucide-react'
import { markAllRead } from './actions'

const TYPE_META: Record<string, { icon: React.ElementType; colour: string }> = {
  like_post:         { icon: Heart,           colour: 'text-red-400' },
  like_review:       { icon: Heart,           colour: 'text-red-400' },
  comment_post:      { icon: MessageCircle,   colour: 'text-blue-400' },
  comment_review:    { icon: MessageCircle,   colour: 'text-blue-400' },
  reply:             { icon: CornerDownRight, colour: 'text-purple-400' },
  tenancy_verified:  { icon: BadgeCheck,      colour: 'text-green-500' },
  tenancy_rejected:  { icon: XCircle,         colour: 'text-red-500' },
}

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin?redirectTo=/notifications')

  const { data: notifications, error: notifError } = await supabase
    .from('notifications')
    .select('id, type, title, body, link, read, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (notifError) console.error('[notifications] fetch error:', notifError)

  const unreadCount = (notifications ?? []).filter((n) => !n.read).length

  // Mark all as read on visit
  if (unreadCount > 0) {
    await markAllRead()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Notifications</h1>
        {unreadCount > 0 && (
          <span className="rounded-full bg-gray-900 dark:bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-white dark:text-gray-900">
            {unreadCount} new
          </span>
        )}
      </div>

      {(notifications ?? []).length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 py-12 text-center">
          <Bell size={28} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <p className="text-sm text-gray-400 dark:text-gray-500">No notifications yet.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          {(notifications ?? []).map((n) => {
            const meta = TYPE_META[n.type] ?? { icon: Bell, colour: 'text-gray-400' }
            const Icon = meta.icon
            const inner = (
              <div className={`flex items-start gap-3 px-4 py-3.5 transition ${
                !n.read ? 'bg-gray-50 dark:bg-gray-800/60' : ''
              } hover:bg-gray-50 dark:hover:bg-gray-800`}>
                <span className={`mt-0.5 shrink-0 ${meta.colour}`}>
                  <Icon size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm ${!n.read ? 'font-medium text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}`}>
                    {n.body}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </p>
                </div>
                {!n.read && (
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gray-900 dark:bg-gray-100" />
                )}
              </div>
            )

            return n.link ? (
              <Link key={n.id} href={n.link} className="block">
                {inner}
              </Link>
            ) : (
              <div key={n.id}>{inner}</div>
            )
          })}
        </div>
      )}
    </div>
  )
}
