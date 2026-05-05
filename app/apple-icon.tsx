import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#111827',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 38,
        }}
      >
        <span
          style={{
            color: 'white',
            fontSize: 90,
            fontWeight: 900,
            letterSpacing: '-3px',
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
