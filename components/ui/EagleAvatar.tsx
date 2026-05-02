export type EaglePersonality = 'happy' | 'sad' | 'curious' | 'excited' | 'angry'

export const EAGLE_ACCENT: Record<EaglePersonality, string> = {
  happy:   '#22A06B',
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
        background: '#f3f4f6',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/avatars/${p}.png`}
        alt={EAGLE_LABELS[p]}
        width={size}
        height={size}
        style={{
          objectFit: 'cover',
          objectPosition: 'center 30%',
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
