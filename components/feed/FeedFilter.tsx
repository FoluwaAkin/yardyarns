'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import type { FeedFilter } from '@/types'

const OPTIONS: { value: FeedFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'verified', label: 'Verified' },
  { value: 'unverified', label: 'Unverified' },
]

export function FeedFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const current = (searchParams.get('filter') as FeedFilter) ?? 'all'

  const [isPending, startTransition] = useTransition()
  const [pendingValue, setPendingValue] = useState<FeedFilter | null>(null)

  function handleChange(value: FeedFilter) {
    if (value === current) return
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all') {
      params.delete('filter')
    } else {
      params.set('filter', value)
    }
    setPendingValue(value)
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  return (
    <div className="flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-1">
      {OPTIONS.map((opt) => {
        const isCurrent = current === opt.value
        const isLoading = isPending && pendingValue === opt.value
        return (
          <button
            key={opt.value}
            onClick={() => handleChange(opt.value)}
            disabled={isPending}
            aria-busy={isLoading}
            className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition min-h-[36px] disabled:cursor-not-allowed ${
              isCurrent
                ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
            } ${isPending && !isLoading ? 'opacity-50' : ''}`}
          >
            {isLoading && <Loader2 size={12} className="animate-spin" />}
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
