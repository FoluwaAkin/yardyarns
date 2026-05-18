'use client'

import Link, { useLinkStatus } from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, LogIn, Bell } from 'lucide-react'
import { EagleAvatar, type EaglePersonality } from '@/components/ui/EagleAvatar'

interface Props {
  username: string | null
  avatar?: string | null
  unreadCount?: number
}

function PendingPulse({ children }: { children: React.ReactNode }) {
  const { pending } = useLinkStatus()
  return <span className={pending ? 'nav-pending' : undefined}>{children}</span>
}

export function NavLinks({ username, avatar = null, unreadCount = 0 }: Props) {
  const pathname = usePathname()

  function linkClass(href: string) {
    const isActive = pathname === href || pathname.startsWith(href + '/')
    return `flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition hover:bg-gray-100 dark:hover:bg-gray-700 min-h-[40px] ${
      isActive
        ? 'font-medium text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700'
        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
    }`
  }

  return (
    <>
      <Link href="/" className={linkClass('/')}>
        <PendingPulse>
          <span className="flex items-center gap-1.5">
            <Home size={16} />
            <span className="hidden sm:inline">Home</span>
          </span>
        </PendingPulse>
      </Link>
      <Link href="/search" className={linkClass('/search')}>
        <PendingPulse>
          <span className="flex items-center gap-1.5">
            <Search size={16} />
            <span className="hidden sm:inline">Search</span>
          </span>
        </PendingPulse>
      </Link>

      {username && (
        <Link href="/notifications" className={`relative ${linkClass('/notifications')}`}>
          <PendingPulse>
            <Bell size={16} />
          </PendingPulse>
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-gray-900 dark:bg-gray-100 text-[10px] font-bold text-white dark:text-gray-900">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
      )}

      {username ? (
        <Link href={`/u/${username}`} className={`rounded-lg p-2 transition hover:bg-gray-100 dark:hover:bg-gray-700 min-h-[40px] flex items-center ${
          pathname.startsWith(`/u/${username}`) ? 'bg-gray-100 dark:bg-gray-700' : ''
        }`}>
          <PendingPulse>
            <EagleAvatar personality={(avatar as EaglePersonality) ?? 'happy'} size={26} showRing={pathname.startsWith(`/u/${username}`)} />
          </PendingPulse>
        </Link>
      ) : (
        <Link
          href="/auth/signin"
          className="flex items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700 min-h-[40px]"
        >
          <PendingPulse>
            <span className="flex items-center gap-1.5">
              <LogIn size={16} />
              <span>Sign in</span>
            </span>
          </PendingPulse>
        </Link>
      )}
    </>
  )
}
