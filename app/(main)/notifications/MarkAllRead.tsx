'use client'

import { useEffect, useTransition } from 'react'
import { markAllRead } from './actions'

export function MarkAllRead({ hasUnread }: { hasUnread: boolean }) {
  const [, startTransition] = useTransition()

  useEffect(() => {
    if (!hasUnread) return
    startTransition(async () => {
      await markAllRead()
    })
  }, [hasUnread])

  return null
}
