'use client'

import { useState, useTransition } from 'react'
import { EagleAvatar, EAGLE_LABELS, EAGLE_PERSONALITIES, type EaglePersonality } from '@/components/ui/EagleAvatar'
import { updateAvatar } from '@/app/(main)/u/[username]/actions'
import { Loader2 } from 'lucide-react'

interface Props {
  current: EaglePersonality
}

export function AvatarPicker({ current }: Props) {
  const [selected, setSelected] = useState<EaglePersonality>(current)
  const [isPending, startTransition] = useTransition()

  function pick(p: EaglePersonality) {
    if (p === selected) return
    setSelected(p)
    startTransition(async () => {
      await updateAvatar(p)
    })
  }

  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
        Your eagle
      </p>
      <div className="flex gap-3">
        {EAGLE_PERSONALITIES.map((p) => (
          <button
            key={p}
            onClick={() => pick(p)}
            disabled={isPending}
            title={EAGLE_LABELS[p]}
            className={`group flex flex-col items-center gap-1 rounded-xl p-1.5 transition disabled:opacity-60 ${
              selected === p
                ? 'bg-gray-100 dark:bg-gray-700 ring-2 ring-gray-900 dark:ring-gray-100 ring-offset-2 dark:ring-offset-gray-900'
                : 'hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <EagleAvatar personality={p} size={44} />
            <span className="text-[10px] text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300">
              {EAGLE_LABELS[p]}
            </span>
          </button>
        ))}
        {isPending && (
          <div className="flex items-center self-center">
            <Loader2 size={14} className="animate-spin text-gray-400" />
          </div>
        )}
      </div>
    </div>
  )
}
