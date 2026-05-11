'use client'

import { useEffect } from 'react'
import { markAllRead } from './actions'

export function MarkAllRead({ hasUnread }: { hasUnread: boolean }) {
  useEffect(() => {
    if (hasUnread) markAllRead()
  }, [hasUnread])

  return null
}
