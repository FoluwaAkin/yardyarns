'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, LogIn } from 'lucide-react'
import { EagleAvatar, type EaglePersonality } from '@/components/ui/EagleAvatar'

interface Props {
  username: string | null
  avatar?: string | null
}

export function NavLinks({ username, avatar = null }: Props) {
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
        <Home size={16} />
        <span className="hidden sm:inline">Home</span>
      </Link>
      <Link href="/search" className={linkClass('/search')}>
        <Search size={16} />
        <span className="hidden sm:inline">Search</span>
      </Link>

      {username ? (
        <Link href={`/u/${username}`} className={linkClass(`/u/${username}`)}>
          <EagleAvatar personality={(avatar as EaglePersonality) ?? 'happy'} size={20} />
          <span className="hidden sm:inline">@{username}</span>
        </Link>
      ) : (
        <Link
          href="/auth/signin"
          className="flex items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700 min-h-[40px]"
        >
          <LogIn size={16} />
          <span>Sign in</span>
        </Link>
      )}
    </>
  )
}
