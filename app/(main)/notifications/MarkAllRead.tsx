'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { markAllRead } from './actions'

export function MarkAllRead({ hasUnread }: { hasUnread: boolean }) {
  const router = useRouter()

  useEffect(() => {
    if (!hasUnread) return
    markAllRead().then(() => router.refresh())
  }, [hasUnread, router])

  return null
}
