'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Home, X, Droplet, Zap, ShieldCheck } from 'lucide-react'
import { PostComposer } from '@/components/posts/PostComposer'

export interface ActiveTenancyOption {
  unitId: string
  unitLabel: string
  propertyLabel: string
  propertyCity: string
}

interface Props {
  userId: string
  tenancies: ActiveTenancyOption[]
}

export function ActiveTenancyPrompt({ userId, tenancies }: Props) {
  const router = useRouter()
  const [openUnitId, setOpenUnitId] = useState<string | null>(null)

  if (tenancies.length === 0) return null

  function onSuccess() {
    setOpenUnitId(null)
    router.refresh()
  }

  return (
    <div className="space-y-2">
      {tenancies.map((t) => {
        const open = openUnitId === t.unitId
        return (
          <div
            key={t.unitId}
            className="overflow-hidden rounded-2xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-900/10"
          >
            {!open ? (
              <button
                onClick={() => setOpenUnitId(t.unitId)}
                className="flex w-full items-start gap-3 p-4 text-left transition hover:bg-emerald-100 dark:hover:bg-emerald-900/20 active:scale-[0.99]"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-200 dark:bg-emerald-800/50 text-emerald-700 dark:text-emerald-300">
                  <Home size={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    How&apos;s{' '}
                    <span className="text-emerald-700 dark:text-emerald-300">{t.propertyLabel}</span>
                    {' '}treating you right now?
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    Drop a quick update for the {t.unitLabel} community.
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
                    <span className="inline-flex items-center gap-1"><Droplet size={10} /> Water</span>
                    <span className="inline-flex items-center gap-1"><Zap size={10} /> Power</span>
                    <span className="inline-flex items-center gap-1"><ShieldCheck size={10} /> Security</span>
                  </div>
                </div>
              </button>
            ) : (
              <div>
                <div className="flex items-center justify-between px-4 pt-3 pb-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <Home size={13} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span className="truncate text-xs font-medium text-gray-700 dark:text-gray-300">
                      Update on <span className="font-semibold">{t.unitLabel}</span>
                      <span className="text-gray-400 dark:text-gray-500"> · {t.propertyLabel}</span>
                    </span>
                  </div>
                  <button
                    onClick={() => setOpenUnitId(null)}
                    className="flex items-center justify-center rounded-lg p-1.5 text-gray-400 transition hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
                    aria-label="Close"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="border-t border-emerald-100 dark:border-emerald-900/40 bg-white dark:bg-gray-900 p-3">
                  <PostComposer unitId={t.unitId} userId={userId} onSuccess={onSuccess} />
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
