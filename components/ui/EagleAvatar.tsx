import type { JSX } from 'react'

export type EaglePersonality = 'happy' | 'sad' | 'curious' | 'excited' | 'angry'

// Dark background tints per personality
const BG: Record<EaglePersonality, string> = {
  happy:   '#182820',
  sad:     '#181E2A',
  curious: '#20182A',
  excited: '#28200E',
  angry:   '#28100E',
}

// Accent ring colour per personality (also exported for use in picker)
const RING: Record<EaglePersonality, string> = {
  happy:   '#3DAA6E',
  sad:     '#3D6EAA',
  curious: '#8B4AC8',
  excited: '#D47800',
  angry:   '#C83030',
}

export const EAGLE_ACCENT: Record<EaglePersonality, string> = RING

// ── Shared palette ────────────────────────────────────────────────────────
const C = {
  white:      '#EEE9E0',   // head / crown feathers
  whiteSoft:  '#D8D0C0',   // shadow on white feathers
  teal:       '#2B6060',   // face / orbital area
  tealDark:   '#1A3E3E',   // deep shadow on face
  tealLight:  '#3D8080',   // highlight on face
  bodyDark:   '#3A1220',   // main body feathers
  bodyMid:    '#5A1A2A',   // body feather highlight
  bodyLight:  '#7A2838',   // body feather edge
  beakTop:    '#E89010',   // upper beak
  beakBot:    '#C07008',   // lower beak / shadow
  beakEdge:   '#F0A820',   // beak highlight
  eyeIris:    '#C87808',   // iris
  eyeRing:    '#8A5000',   // ring around iris
  eyeDark:    '#0A0A0A',   // pupil
  eyeShine:   '#FFFDF0',   // shine dot
  nares:      '#8A5000',   // nostril opening
}

// ── Eye components (reused with small variations) ─────────────────────────

function EagleEye({
  cx, cy, r = 3.2,
  squint = 0,        // 0 = open, 1 = squinted
  wide = false,
  lookDown = false,
}: {
  cx: number; cy: number; r?: number
  squint?: number; wide?: boolean; lookDown?: boolean
}) {
  const pr = wide ? r * 1.15 : r
  const pupilOffset = lookDown ? 0.5 : 0
  return (
    <g>
      {/* Orbital shadow */}
      <ellipse cx={cx} cy={cy - 0.5} rx={pr + 2.5} ry={pr + 1.8} fill={C.tealDark} />
      {/* Iris */}
      <circle cx={cx} cy={cy} r={pr} fill={C.eyeRing} />
      <circle cx={cx} cy={cy} r={pr * 0.82} fill={C.eyeIris} />
      {/* Pupil */}
      <circle cx={cx} cy={cy + pupilOffset} r={pr * 0.44} fill={C.eyeDark} />
      {/* Shine */}
      <circle cx={cx - pr * 0.32} cy={cy - pr * 0.28} r={pr * 0.22} fill={C.eyeShine} opacity="0.9" />
      {/* Squint / brow lid */}
      {squint > 0 && (
        <path
          d={`M${cx - pr - 1.5},${cy - pr * 0.3} Q${cx},${cy - pr - 1 - squint * 2} ${cx + pr + 1.5},${cy - pr * 0.3}`}
          fill={C.tealDark}
        />
      )}
    </g>
  )
}

// ── Beak components ───────────────────────────────────────────────────────

function ClosedBeak({ x, y }: { x: number; y: number }) {
  // Upper mandible (curves down into hook)
  return (
    <g>
      <path
        d={`M${x},${y} Q${x + 8},${y - 1} ${x + 10},${y + 1.5} Q${x + 9},${y + 4} ${x + 5},${y + 5} L${x + 1},${y + 3} Z`}
        fill={C.beakTop}
      />
      {/* Hook tip */}
      <path
        d={`M${x + 9},${y + 4} Q${x + 11},${y + 5} ${x + 9},${y + 7} Q${x + 7},${y + 7} ${x + 6},${y + 6} L${x + 5},${y + 5} Z`}
        fill={C.beakBot}
      />
      {/* Lower mandible */}
      <path
        d={`M${x},${y + 3} L${x + 5},${y + 5} Q${x + 7},${y + 7} ${x + 6},${y + 8} Q${x + 3},${y + 8} ${x},${y + 5} Z`}
        fill={C.beakBot}
      />
      {/* Ridge highlight */}
      <path
        d={`M${x + 1},${y + 0.5} Q${x + 7},${y - 0.5} ${x + 9.5},${y + 2}`}
        stroke={C.beakEdge} strokeWidth="0.8" fill="none" strokeLinecap="round"
      />
      {/* Nares */}
      <ellipse cx={x + 4} cy={y + 1.8} rx={1.2} ry={0.8} fill={C.nares} opacity="0.6" />
    </g>
  )
}

function OpenBeak({ x, y, gap = 3 }: { x: number; y: number; gap?: number }) {
  return (
    <g>
      {/* Upper mandible */}
      <path
        d={`M${x},${y} Q${x + 8},${y - 1} ${x + 10},${y + 1.5} Q${x + 9},${y + 3} ${x + 5},${y + 4} L${x + 1},${y + 2} Z`}
        fill={C.beakTop}
      />
      {/* Hook */}
      <path
        d={`M${x + 9},${y + 3} Q${x + 11},${y + 4} ${x + 9},${y + 6} Q${x + 7},${y + 7} ${x + 6},${y + 6} L${x + 5},${y + 4} Z`}
        fill={C.beakBot}
      />
      {/* Lower mandible (dropped by gap) */}
      <path
        d={`M${x},${y + 2 + gap} L${x + 7},${y + 3 + gap} Q${x + 6},${y + 6 + gap} ${x + 3},${y + 6 + gap} Q${x},${y + 6 + gap} ${x},${y + 4 + gap} Z`}
        fill={C.beakBot}
      />
      {/* Mouth interior */}
      <path
        d={`M${x + 1},${y + 2.5} L${x + 7},${y + 3.5} L${x + 7},${y + 3 + gap} L${x + 1},${y + 2 + gap} Z`}
        fill="#2A0808" opacity="0.8"
      />
      {/* Ridge */}
      <path
        d={`M${x + 1},${y + 0.5} Q${x + 7},${y - 0.5} ${x + 9.5},${y + 2}`}
        stroke={C.beakEdge} strokeWidth="0.8" fill="none" strokeLinecap="round"
      />
      <ellipse cx={x + 4} cy={y + 1.6} rx={1.2} ry={0.8} fill={C.nares} opacity="0.6" />
    </g>
  )
}

// ── Base eagle body (used by all personalities) ───────────────────────────
// The eagle faces RIGHT. Eye is left-of-center, beak extends right.

function EagleBase({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* ── Body / chest feathers (bottom arc) ── */}
      <ellipse cx="20" cy="35" rx="15" ry="10" fill={C.bodyDark} />
      {/* Feather layer highlights */}
      <path d="M10,30 Q13,27 17,29 Q14,32 10,32 Z" fill={C.bodyMid} opacity="0.8" />
      <path d="M17,29 Q20,26 24,28 Q21,31 17,31 Z" fill={C.bodyMid} opacity="0.8" />
      <path d="M24,28 Q27,26 30,28 Q28,31 24,31 Z" fill={C.bodyMid} opacity="0.7" />
      <path d="M11,33 Q14,30 18,32 Q15,35 11,35 Z" fill={C.bodyLight} opacity="0.5" />
      <path d="M18,32 Q21,29 25,31 Q22,34 18,34 Z" fill={C.bodyLight} opacity="0.5" />

      {/* ── Teal neck connecting body to head ── */}
      <path
        d="M10,24 Q12,20 16,19 Q20,18 22,20 Q24,22 22,26 Q18,28 14,28 Q10,27 10,24 Z"
        fill={C.teal}
      />
      {/* Neck shadow */}
      <path
        d="M10,24 Q11,21 14,20 Q12,23 11,26 Z"
        fill={C.tealDark} opacity="0.6"
      />

      {/* ── White head ── */}
      {/* Main white head shape */}
      <ellipse cx="18" cy="15" rx="13" ry="12" fill={C.white} />
      {/* Shadow on white head (depth) */}
      <path
        d="M8,14 Q9,10 13,8 Q12,12 10,16 Z"
        fill={C.whiteSoft} opacity="0.6"
      />
      <path
        d="M23,9 Q26,10 28,14 Q26,12 24,11 Z"
        fill={C.whiteSoft} opacity="0.4"
      />

      {/* ── Teal face mask (characteristic bald eagle coloring) ── */}
      <path
        d="M8,15 Q10,12 14,13 Q18,14 22,13 Q26,12 28,15
           Q28,19 24,20 Q20,21 16,20 Q10,19 8,17 Z"
        fill={C.teal}
      />
      {/* Face shadow depth */}
      <path
        d="M8,15 Q10,13 12,14 Q10,16 8,17 Z"
        fill={C.tealDark} opacity="0.5"
      />
      {/* Face highlight */}
      <path
        d="M14,13 Q18,14 22,13 Q20,15 16,15 Q14,15 14,13 Z"
        fill={C.tealLight} opacity="0.3"
      />

      {/* ── Feather crown at top ── */}
      <path d="M12,6 Q13,3 15,5 Q14,7 12,7 Z" fill={C.white} />
      <path d="M16,4 Q17,1 19,3 Q18,6 16,6 Z" fill={C.white} />
      <path d="M20,5 Q22,2 24,4 Q23,7 20,6 Z" fill={C.white} />

      {/* Personality-specific features (eye + beak) */}
      {children}
    </>
  )
}

// ── 5 Personality faces ───────────────────────────────────────────────────

function HappyFace() {
  return (
    <EagleBase>
      {/* Soft, open eye with slight upward focus */}
      <EagleEye cx={14} cy={15.5} r={3.0} />
      {/* Gentle brow highlight — confident not harsh */}
      <path d="M9,12 Q12,11 16,12.5" stroke={C.tealLight} strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.7" />
      {/* Closed beak */}
      <ClosedBeak x={21} y={14} />
    </EagleBase>
  )
}

function SadFace() {
  return (
    <EagleBase>
      {/* Eye looking slightly downward */}
      <EagleEye cx={14} cy={16} r={2.8} lookDown />
      {/* Downward inner-brow crease */}
      <path d="M10,12.5 Q12,13.5 15,13" stroke={C.tealDark} strokeWidth="1.2" fill="none" strokeLinecap="round" />
      {/* Closed beak, slightly angled down */}
      <g transform="rotate(4 21 15)">
        <ClosedBeak x={21} y={15} />
      </g>
    </EagleBase>
  )
}

function CuriousFace() {
  return (
    <EagleBase>
      {/* One eye wider — quizzical look */}
      <EagleEye cx={14} cy={15} r={3.4} wide />
      {/* One-sided raised brow */}
      <path d="M10,11 Q12,9.5 16,11" stroke={C.white} strokeWidth="1.3" fill="none" strokeLinecap="round" opacity="0.7" />
      {/* Slightly open beak — questioning */}
      <OpenBeak x={21} y={14} gap={1.5} />
    </EagleBase>
  )
}

function ExcitedFace() {
  return (
    <EagleBase>
      {/* Wide, fully open eye */}
      <EagleEye cx={14} cy={15} r={3.5} wide />
      {/* Raised energetic brow */}
      <path d="M9,11 Q12,9 16,10.5" stroke={C.white} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.8" />
      {/* Open beak */}
      <OpenBeak x={21} y={13.5} gap={3} />
    </EagleBase>
  )
}

function AngryFace() {
  return (
    <EagleBase>
      {/* Heavy-browed squinted eye */}
      <EagleEye cx={14} cy={16} r={2.9} squint={2.5} />
      {/* Thick angled brow (inner corner down) */}
      <path d="M9,12 Q12,10 16,12.5" stroke={C.tealDark} strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M9,12 Q12,10 16,12.5" stroke="#1A1A1A" strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.5" />
      {/* Firm closed beak, slightly forward */}
      <ClosedBeak x={22} y={14} />
    </EagleBase>
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
  personality?: EaglePersonality | null
  size?: number
  showRing?: boolean
}

export function EagleAvatar({ personality, size = 40, showRing = false }: Props) {
  const p: EaglePersonality = personality ?? 'happy'
  const Face = FACES[p] ?? FACES.happy

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ borderRadius: '50%', flexShrink: 0, display: 'block' }}
    >
      {/* Dark background */}
      <circle cx="20" cy="20" r="20" fill={BG[p]} />
      {/* Subtle radial glow behind eagle */}
      <radialGradient id={`glow-${p}`} cx="50%" cy="45%" r="50%">
        <stop offset="0%" stopColor={RING[p]} stopOpacity="0.15" />
        <stop offset="100%" stopColor={BG[p]} stopOpacity="0" />
      </radialGradient>
      <circle cx="20" cy="18" r="20" fill={`url(#glow-${p})`} />
      {/* Eagle */}
      <Face />
      {/* Ring */}
      {showRing && (
        <circle cx="20" cy="20" r="19" stroke={RING[p]} strokeWidth="2" fill="none" />
      )}
    </svg>
  )
}
