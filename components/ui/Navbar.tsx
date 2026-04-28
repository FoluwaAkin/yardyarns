import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { NavLinks } from './NavLinks'
import { NotificationBell } from './NotificationBell'

export async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let username: string | null = null
  let avatar: string | null = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('username, avatar')
      .eq('id', user.id)
      .single()
    username = data?.username ?? null
    avatar = data?.avatar ?? null
  }

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold tracking-tight text-gray-900 dark:text-gray-100">
          YardYarns
        </Link>
        <nav className="flex items-center gap-1">
          {user && <NotificationBell userId={user.id} />}
          <NavLinks username={username} avatar={avatar} />
        </nav>
      </div>
    </header>
  )
}
