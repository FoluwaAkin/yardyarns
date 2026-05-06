import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#FFD600',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 7,
        }}
      >
        <span
          style={{
            color: '#0B0B0B',
            fontSize: 16,
            fontWeight: 900,
            letterSpacing: '-0.5px',
            lineHeight: 1,
          }}
        >
          YY
        </span>
      </div>
    ),
    { ...size },
  )
}
