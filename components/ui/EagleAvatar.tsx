import type { JSX } from 'react'

export type EaglePersonality = 'happy' | 'sad' | 'curious' | 'excited' | 'angry'

// Gradient stops per personality
const GRAD_FROM: Record<EaglePersonality, string> = {
  happy:   '#FBBF24',
  sad:     '#93C5FD',
  curious: '#6EE7B7',
  excited: '#F9A8D4',
  angry:   '#FCA5A5',
}

const GRAD_TO: Record<EaglePersonality, string> = {
  happy:   '#F97316',
  sad:     '#6366F1',
  curious: '#0891B2',
  excited: '#E11D48',
  angry:   '#B91C1C',
}

// Exported accent colour (used by AvatarPicker for glow / ring tints)
export const EAGLE_ACCENT: Record<EaglePersonality, string> = {
  happy:   '#F97316',
  sad:     '#6366F1',
  curious: '#0891B2',
  excited: '#E11D48',
  angry:   '#B91C1C',
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

// ── Shared colour tokens ──────────────────────────────────────────────────────
const D = '#1C1C2E'   // dark — eyes, brows, mouth

// ── Eye helper ────────────────────────────────────────────────────────────────
// cx/cy = centre, rx/ry = radii (circle when equal), shine = show highlight dot
function Eye({
  cx, cy, rx = 3.0, ry = 3.0, shine = true,
}: { cx: number; cy: number; rx?: number; ry?: number; shine?: boolean }) {
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={D} />
      {shine && (
        <circle
          cx={cx - rx * 0.35}
          cy={cy - ry * 0.38}
          r={rx * 0.34}
          fill="white"
          opacity="0.9"
        />
      )}
    </g>
  )
}

// ── 5 personality faces ───────────────────────────────────────────────────────

function HappyFace(): JSX.Element {
  return (
    <g>
      {/* Subtle blush */}
      <ellipse cx="12"   cy="24" rx="4.5" ry="2.8" fill="white" opacity="0.2" />
      <ellipse cx="28"   cy="24" rx="4.5" ry="2.8" fill="white" opacity="0.2" />
      {/* Relaxed brows */}
      <path
        d="M11.5,13 Q14.5,11.5 17.5,13"
        stroke={D} strokeWidth="1.5" fill="none" strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M22.5,13 Q25.5,11.5 28.5,13"
        stroke={D} strokeWidth="1.5" fill="none" strokeLinecap="round"
        opacity="0.7"
      />
      {/* Eyes */}
      <Eye cx={14.5} cy={17.5} />
      <Eye cx={25.5} cy={17.5} />
      {/* Wide smile */}
      <path
        d="M12,22.5 Q20,30.5 28,22.5"
        stroke={D} strokeWidth="2.2" fill="none" strokeLinecap="round"
      />
    </g>
  )
}

function SadFace(): JSX.Element {
  return (
    <g>
      {/* Sad brows — inner corners raised */}
      <path
        d="M11.5,14 Q14,11.5 16.5,13.5"
        stroke={D} strokeWidth="1.6" fill="none" strokeLinecap="round"
      />
      <path
        d="M23.5,13.5 Q26,11.5 28.5,14"
        stroke={D} strokeWidth="1.6" fill="none" strokeLinecap="round"
      />
      {/* Eyes — slightly downcast */}
      <Eye cx={14.5} cy={18} rx={2.9} ry={2.9} />
      <Eye cx={25.5} cy={18} rx={2.9} ry={2.9} />
      {/* Teardrop */}
      <ellipse cx="15.2" cy="22.5" rx="1.1" ry="1.7" fill="white" opacity="0.55" />
      {/* Frown */}
      <path
        d="M13.5,26.5 Q20,22 26.5,26.5"
        stroke={D} strokeWidth="2.2" fill="none" strokeLinecap="round"
      />
    </g>
  )
}

function CuriousFace(): JSX.Element {
  return (
    <g>
      {/* Left brow raised high */}
      <path
        d="M11,12.5 Q14,9.5 17.5,11.5"
        stroke={D} strokeWidth="1.6" fill="none" strokeLinecap="round"
      />
      {/* Right brow normal */}
      <path
        d="M22.5,13 Q25.5,11.5 28.5,13"
        stroke={D} strokeWidth="1.5" fill="none" strokeLinecap="round"
        opacity="0.7"
      />
      {/* Left eye — wide-open */}
      <Eye cx={14.5} cy={17} rx={3.6} ry={3.6} />
      {/* Right eye — normal */}
      <Eye cx={25.5} cy={17.5} rx={2.8} ry={2.8} />
      {/* Small O mouth */}
      <ellipse cx="20" cy="25" rx="2.8" ry="2.2" fill={D} />
      <ellipse cx="20" cy="25.2" rx="1.5" ry="1.2" fill="white" opacity="0.1" />
    </g>
  )
}

function ExcitedFace(): JSX.Element {
  return (
    <g>
      {/* High arched brows */}
      <path
        d="M11,11.5 Q14.5,9 18,11"
        stroke={D} strokeWidth="1.6" fill="none" strokeLinecap="round"
      />
      <path
        d="M22,11 Q25.5,9 29,11.5"
        stroke={D} strokeWidth="1.6" fill="none" strokeLinecap="round"
      />
      {/* Large bright eyes */}
      <Eye cx={14.5} cy={17} rx={3.7} ry={3.7} />
      <Eye cx={25.5} cy={17} rx={3.7} ry={3.7} />
      {/* Extra shine spot */}
      <circle cx="16"  cy="18.5" r="0.9" fill="white" opacity="0.6" />
      <circle cx="27"  cy="18.5" r="0.9" fill="white" opacity="0.6" />
      {/* Huge smile */}
      <path
        d="M11,22.5 Q20,32 29,22.5"
        stroke={D} strokeWidth="2.2" fill="none" strokeLinecap="round"
      />
      {/* Blush */}
      <ellipse cx="11"  cy="23.5" rx="3.5" ry="2.2" fill="white" opacity="0.22" />
      <ellipse cx="29"  cy="23.5" rx="3.5" ry="2.2" fill="white" opacity="0.22" />
    </g>
  )
}

function AngryFace(): JSX.Element {
  return (
    <g>
      {/* Heavy inward-angled brows */}
      <path
        d="M10.5,15 L17.5,17.5"
        stroke={D} strokeWidth="2.6" fill="none" strokeLinecap="round"
      />
      <path
        d="M29.5,15 L22.5,17.5"
        stroke={D} strokeWidth="2.6" fill="none" strokeLinecap="round"
      />
      {/* Squinted eyes — short ellipses under the brows */}
      <Eye cx={14.5} cy={19} rx={3.1} ry={1.9} />
      <Eye cx={25.5} cy={19} rx={3.1} ry={1.9} />
      {/* Stern frown */}
      <path
        d="M14,25.5 Q20,21.5 26,25.5"
        stroke={D} strokeWidth="2.2" fill="none" strokeLinecap="round"
      />
    </g>
  )
}

// ── Face registry ─────────────────────────────────────────────────────────────

const FACES: Record<EaglePersonality, () => JSX.Element> = {
  happy:   HappyFace,
  sad:     SadFace,
  curious: CuriousFace,
  excited: ExcitedFace,
  angry:   AngryFace,
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  personality?: EaglePersonality | null
  size?: number
  showRing?: boolean
}

export function EagleAvatar({ personality, size = 40, showRing = false }: Props) {
  const p: EaglePersonality = personality ?? 'happy'
  const Face = FACES[p] ?? FACES.happy
  const gradId = `yy-grad-${p}`
  const accent  = EAGLE_ACCENT[p]

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ borderRadius: '50%', flexShrink: 0, display: 'block' }}
    >
      <defs>
        {/* Diagonal gradient — each personality has a distinct two-colour scheme */}
        <linearGradient
          id={gradId}
          x1="2" y1="2" x2="38" y2="38"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%"   stopColor={GRAD_FROM[p]} />
          <stop offset="100%" stopColor={GRAD_TO[p]}   />
        </linearGradient>
      </defs>

      {/* Background */}
      <circle cx="20" cy="20" r="20" fill={`url(#${gradId})`} />

      {/* Frosted highlight — top-left gloss */}
      <ellipse cx="15" cy="11" rx="10" ry="7" fill="white" opacity="0.14" />

      {/* Personality face */}
      <Face />

      {/* Optional selection ring */}
      {showRing && (
        <circle cx="20" cy="20" r="19" stroke={accent} strokeWidth="2" fill="none" />
      )}
    </svg>
  )
}
