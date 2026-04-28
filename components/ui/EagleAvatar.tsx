import type { JSX } from 'react'

export type EaglePersonality = 'happy' | 'sad' | 'curious' | 'excited' | 'angry'

const BG: Record<EaglePersonality, string> = {
  happy:   '#dcfce7',   // green-100
  sad:     '#dbeafe',   // blue-100
  curious: '#f3e8ff',   // purple-100
  excited: '#ffedd5',   // orange-100
  angry:   '#fee2e2',   // red-100
}

const RING: Record<EaglePersonality, string> = {
  happy:   '#16a34a',
  sad:     '#2563eb',
  curious: '#9333ea',
  excited: '#ea580c',
  angry:   '#dc2626',
}

// ── Eagle face drawings ──────────────────────────────────────────────────────
// Each returns the inner SVG elements. viewBox is "0 0 40 40".

function HappyFace() {
  return (
    <>
      {/* Crown feathers */}
      <ellipse cx="14" cy="9" rx="3" ry="5" fill="#92400e" transform="rotate(-15 14 9)" />
      <ellipse cx="20" cy="7" rx="3" ry="5.5" fill="#78350f" />
      <ellipse cx="26" cy="9" rx="3" ry="5" fill="#92400e" transform="rotate(15 26 9)" />
      {/* Head */}
      <circle cx="20" cy="23" r="13" fill="#fef3c7" />
      {/* Eyes — happy crescents */}
      <path d="M13 21 Q15 18 17 21" stroke="#1c1917" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M23 21 Q25 18 27 21" stroke="#1c1917" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Beak */}
      <polygon points="20,26 24,24 20,29" fill="#f59e0b" />
      {/* Cheek blush */}
      <ellipse cx="13" cy="26" rx="3" ry="2" fill="#fca5a5" opacity="0.5" />
      <ellipse cx="27" cy="26" rx="3" ry="2" fill="#fca5a5" opacity="0.5" />
    </>
  )
}

function SadFace() {
  return (
    <>
      {/* Crown feathers — droopy */}
      <ellipse cx="14" cy="10" rx="2.5" ry="4.5" fill="#92400e" transform="rotate(-25 14 10)" />
      <ellipse cx="20" cy="9" rx="2.5" ry="4" fill="#78350f" transform="rotate(-5 20 9)" />
      <ellipse cx="26" cy="10" rx="2.5" ry="4.5" fill="#92400e" transform="rotate(15 26 10)" />
      {/* Head */}
      <circle cx="20" cy="23" r="13" fill="#fef3c7" />
      {/* Eyebrows — sad angle */}
      <path d="M13 18 Q15 17 17 19" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M23 19 Q25 17 27 18" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* Eyes */}
      <ellipse cx="15" cy="22" rx="2.5" ry="2.5" fill="white" />
      <ellipse cx="25" cy="22" rx="2.5" ry="2.5" fill="white" />
      <circle cx="15" cy="22.5" r="1.5" fill="#1c1917" />
      <circle cx="25" cy="22.5" r="1.5" fill="#1c1917" />
      {/* Tear */}
      <ellipse cx="13" cy="27" rx="1" ry="1.5" fill="#93c5fd" opacity="0.8" />
      {/* Beak — turned down */}
      <path d="M18 27 Q20 25 22 27 Q21 30 20 30 Q19 30 18 27Z" fill="#f59e0b" />
    </>
  )
}

function CuriousFace() {
  return (
    <>
      {/* Crown feathers — one perked up */}
      <ellipse cx="14" cy="10" rx="2.5" ry="4" fill="#92400e" transform="rotate(-10 14 10)" />
      <ellipse cx="20" cy="6" rx="2.5" ry="6" fill="#78350f" />
      <ellipse cx="26" cy="8" rx="3" ry="5" fill="#92400e" transform="rotate(20 26 8)" />
      {/* Head — slightly tilted */}
      <circle cx="20" cy="23" r="13" fill="#fef3c7" />
      {/* Eyebrow — one raised */}
      <path d="M13 17 Q15 15 17 17" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* Eyes — one bigger (curious) */}
      <ellipse cx="15" cy="21" rx="3" ry="3" fill="white" />
      <ellipse cx="25" cy="22" rx="2" ry="2" fill="white" />
      <circle cx="15.5" cy="21.5" r="1.8" fill="#1c1917" />
      <circle cx="25.2" cy="22.2" r="1.2" fill="#1c1917" />
      {/* Shine */}
      <circle cx="16" cy="21" r="0.6" fill="white" />
      {/* Beak — slightly open/sideways */}
      <path d="M19 26 L24 24 L23 27 Z" fill="#f59e0b" />
      <path d="M19 27 L23 27 L22 29 Z" fill="#d97706" />
    </>
  )
}

function ExcitedFace() {
  return (
    <>
      {/* Crown feathers — all up! */}
      <ellipse cx="13" cy="8" rx="2.5" ry="5.5" fill="#92400e" transform="rotate(-20 13 8)" />
      <ellipse cx="20" cy="6" rx="3" ry="6" fill="#78350f" />
      <ellipse cx="27" cy="8" rx="2.5" ry="5.5" fill="#92400e" transform="rotate(20 27 8)" />
      {/* Sparkle lines */}
      <line x1="8" y1="10" x2="10" y2="12" stroke="#fcd34d" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="32" y1="10" x2="30" y2="12" stroke="#fcd34d" strokeWidth="1.5" strokeLinecap="round" />
      {/* Head */}
      <circle cx="20" cy="23" r="13" fill="#fef3c7" />
      {/* Big wide eyes */}
      <ellipse cx="15" cy="21" rx="3.5" ry="3.5" fill="white" />
      <ellipse cx="25" cy="21" rx="3.5" ry="3.5" fill="white" />
      <circle cx="15.5" cy="21.5" r="2" fill="#1c1917" />
      <circle cx="25.5" cy="21.5" r="2" fill="#1c1917" />
      {/* Eye shine */}
      <circle cx="16" cy="20.5" r="0.7" fill="white" />
      <circle cx="26" cy="20.5" r="0.7" fill="white" />
      {/* Open beak */}
      <path d="M17 26 Q20 24 23 26 Q22 30 20 30 Q18 30 17 26Z" fill="#f59e0b" />
      <path d="M17 27 Q20 28 23 27" stroke="#d97706" strokeWidth="0.8" fill="none" />
    </>
  )
}

function AngryFace() {
  return (
    <>
      {/* Crown feathers — sharp/spiky */}
      <polygon points="13,13 11,4 15,10" fill="#92400e" />
      <polygon points="20,11 18,3 22,3" fill="#78350f" />
      <polygon points="27,13 25,10 29,4" fill="#92400e" />
      {/* Head */}
      <circle cx="20" cy="23" r="13" fill="#fef3c7" />
      {/* Angry V brows */}
      <path d="M12 18 L16 20" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M28 18 L24 20" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round" />
      {/* Squinted eyes */}
      <ellipse cx="15" cy="22" rx="3" ry="2" fill="white" />
      <ellipse cx="25" cy="22" rx="3" ry="2" fill="white" />
      {/* Squint lines */}
      <path d="M12 21 L18 21" stroke="#78350f" strokeWidth="1.2" fill="none" />
      <path d="M22 21 L28 21" stroke="#78350f" strokeWidth="1.2" fill="none" />
      <circle cx="15" cy="22.5" r="1.8" fill="#1c1917" />
      <circle cx="25" cy="22.5" r="1.8" fill="#1c1917" />
      {/* Sharp beak — forward */}
      <polygon points="20,25 26,22 20,28" fill="#f59e0b" />
    </>
  )
}

const FACES: Record<EaglePersonality, () => JSX.Element> = {
  happy:   HappyFace,
  sad:     SadFace,
  curious: CuriousFace,
  excited: ExcitedFace,
  angry:   AngryFace,
}

export const EAGLE_LABELS: Record<EaglePersonality, string> = {
  happy:   'Happy',
  sad:     'Sad',
  curious: 'Curious',
  excited: 'Excited',
  angry:   'Angry',
}

export const EAGLE_PERSONALITIES: EaglePersonality[] = ['happy', 'sad', 'curious', 'excited', 'angry']

interface Props {
  personality: EaglePersonality | null | undefined
  size?: number
  showRing?: boolean
}

export function EagleAvatar({ personality = 'happy', size = 40, showRing = false }: Props) {
  const p: EaglePersonality = (personality as EaglePersonality) ?? 'happy'
  const Face = FACES[p] ?? FACES.happy

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ borderRadius: '50%', flexShrink: 0 }}
    >
      {/* Background */}
      <circle cx="20" cy="20" r="20" fill={BG[p]} />
      {/* Ring */}
      {showRing && <circle cx="20" cy="20" r="19" stroke={RING[p]} strokeWidth="2" fill="none" />}
      {/* Eagle */}
      <Face />
    </svg>
  )
}
