// Avatar component — renders a macaw photo with per-personality CSS filters.
// Add the source image at: public/avatars/macaw.png

export type EaglePersonality = 'happy' | 'sad' | 'curious' | 'excited' | 'angry'

// CSS filter applied to the base macaw image for each personality
const FILTER: Record<EaglePersonality, string> = {
  happy:   'saturate(1.1)',
  sad:     'hue-rotate(60deg) saturate(0.72) brightness(0.83)',
  curious: 'hue-rotate(320deg) saturate(1.15)',
  excited: 'hue-rotate(155deg) saturate(1.35) brightness(1.04)',
  angry:   'hue-rotate(200deg) saturate(1.2) contrast(1.08)',
}

// Accent / ring colour per personality — derived from how the bg teal shifts
export const EAGLE_ACCENT: Record<EaglePersonality, string> = {
  happy:   '#0D9488',
  sad:     '#4F7FBF',
  curious: '#C2770A',
  excited: '#C41C3C',
  angry:   '#6D28D9',
}

export const EAGLE_LABELS: Record<EaglePersonality, string> = {
  happy:   'Happy',
  sad:     'Sad',
  curious: 'Curious',
  excited: 'Excited',
  angry:   'Angry',
}

export const EAGLE_PERSONALITIES: EaglePersonality[] = [
  'happy', 'sad', 'curious', 'excited', 'angry',
]

interface Props {
  personality?: EaglePersonality | null
  size?: number
  showRing?: boolean
}

export function EagleAvatar({ personality, size = 40, showRing = false }: Props) {
  const p: EaglePersonality = personality ?? 'happy'
  const accent = EAGLE_ACCENT[p]

  return (
    <span
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        flexShrink: 0,
        position: 'relative',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/avatars/macaw.png"
        alt={EAGLE_LABELS[p]}
        width={size}
        height={size}
        style={{
          filter: FILTER[p],
          objectFit: 'cover',
          objectPosition: 'center 18%',
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />
      {showRing && (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            boxShadow: `inset 0 0 0 2.5px ${accent}`,
            pointerEvents: 'none',
          }}
        />
      )}
    </span>
  )
}
