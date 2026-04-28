import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { NavLinks } from './NavLinks'

export async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let username: string | null = null
  let avatar: string | null = null
  let unreadCount = 0

  if (user) {
    const [profileRes, bellRes] = await Promise.all([
      supabase.from('profiles').select('username, avatar').eq('id', user.id).single(),
      supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false),
    ])
    username = profileRes.data?.username ?? null
    avatar = profileRes.data?.avatar ?? null
    unreadCount = bellRes.error ? 0 : (bellRes.count ?? 0)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold tracking-tight text-gray-900 dark:text-gray-100">
          YardYarns
        </Link>
        <nav className="flex items-center gap-1">
          <NavLinks username={username} avatar={avatar} unreadCount={unreadCount} />
        </nav>
      </div>
    </header>
  )
}
