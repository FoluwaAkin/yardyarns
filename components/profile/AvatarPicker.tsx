'use client'

import { useState, useTransition } from 'react'
import {
  EagleAvatar,
  EAGLE_LABELS,
  EAGLE_PERSONALITIES,
  EAGLE_ACCENT,
  type EaglePersonality,
} from '@/components/ui/EagleAvatar'
import { updateAvatar } from '@/app/(main)/u/[username]/actions'

const TAGLINES: Record<EaglePersonality, string> = {
  happy:   'Warm, genuine, easy to talk to',
  sad:     'Reflective, thoughtful, deep',
  curious: 'Always questioning, always learning',
  excited: 'High energy, full of enthusiasm',
  angry:   'Fierce, focused, takes no nonsense',
}

interface Props {
  current: EaglePersonality
}

export function AvatarPicker({ current }: Props) {
  const [selected, setSelected] = useState<EaglePersonality>(current)
  const [isPending, startTransition] = useTransition()

  function pick(p: EaglePersonality) {
    if (p === selected || isPending) return
    setSelected(p)
    startTransition(async () => {
      await updateAvatar(p)
    })
  }

  const accent = EAGLE_ACCENT[selected]

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">

      {/* ── Preview panel ── */}
      <div
        className="relative flex flex-col items-center gap-3 px-6 py-8 transition-all duration-500"
        style={{ background: `linear-gradient(160deg, ${accent}18 0%, transparent 60%)` }}
      >
        {/* Saving indicator */}
        {isPending && (
          <span className="absolute right-4 top-4 text-[10px] font-medium tracking-wide text-gray-400 dark:text-gray-500">
            Saving…
          </span>
        )}

        {/* Large eagle */}
        <div
          className="transition-all duration-300"
          style={{
            filter: `drop-shadow(0 0 16px ${accent}60)`,
            transform: isPending ? 'scale(0.95)' : 'scale(1)',
          }}
        >
          <EagleAvatar personality={selected} size={80} showRing />
        </div>

        {/* Name + tagline */}
        <div className="text-center">
          <p
            className="text-base font-bold tracking-tight transition-all duration-300"
            style={{ color: accent }}
          >
            {EAGLE_LABELS[selected]}
          </p>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            {TAGLINES[selected]}
          </p>
        </div>
      </div>

      {/* ── Selector strip ── */}
      <div className="flex items-center justify-center gap-1.5 border-t border-gray-100 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-800/40 px-4 py-3">
        {EAGLE_PERSONALITIES.map((p) => {
          const isSelected = p === selected
          return (
            <button
              key={p}
              onClick={() => pick(p)}
              disabled={isPending}
              aria-label={EAGLE_LABELS[p]}
              className="group relative flex flex-col items-center gap-1.5 rounded-xl p-2 transition-all duration-200 disabled:pointer-events-none"
              style={isSelected ? { background: `${EAGLE_ACCENT[p]}15` } : undefined}
            >
              {/* Eagle option */}
              <div
                className="transition-all duration-200"
                style={{
                  transform: isSelected ? 'scale(1.12)' : 'scale(1)',
                  opacity: isSelected ? 1 : 0.55,
                  filter: isSelected
                    ? `drop-shadow(0 0 6px ${EAGLE_ACCENT[p]}80)`
                    : 'none',
                }}
              >
                <EagleAvatar
                  personality={p}
                  size={42}
                  showRing={isSelected}
                />
              </div>

              {/* Label */}
              <span
                className="text-[10px] font-medium tracking-wide transition-all duration-200"
                style={{
                  color: isSelected ? EAGLE_ACCENT[p] : undefined,
                  opacity: isSelected ? 1 : 0.5,
                }}
              >
                {EAGLE_LABELS[p]}
              </span>

              {/* Active dot */}
              {isSelected && (
                <span
                  className="absolute -top-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full"
                  style={{ background: EAGLE_ACCENT[p] }}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
