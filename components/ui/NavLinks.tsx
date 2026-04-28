'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, User, LogIn, LogOut } from 'lucide-react'

interface Props {
  username: string | null
}

export function NavLinks({ username }: Props) {
  const pathname = usePathname()

  function linkClass(href: string) {
    const isActive = pathname === href
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
        <>
          <Link href={`/u/${username}`} className={linkClass(`/u/${username}`)}>
            <User size={16} />
            <span className="hidden sm:inline">@{username}</span>
          </Link>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              title="Sign out"
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-gray-600 dark:text-gray-400 transition hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 min-h-[40px]"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </form>
        </>
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
