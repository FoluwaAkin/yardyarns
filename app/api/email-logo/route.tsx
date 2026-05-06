import { ImageResponse } from 'next/og'

// Stacked "YARD YARNS" wordmark for email headers, matching the brand moodboard.
// Background matches the email wrapper (#f3f4f6) so it blends seamlessly.
// Brand colours: Charcoal #0B0B0B, Yard Green #00C853.

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          width: 280,
          height: 96,
          background: '#f3f4f6',
          paddingLeft: 4,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            lineHeight: 1,
          }}
        >
          <span
            style={{
              color: '#0B0B0B',
              fontSize: 40,
              fontWeight: 900,
              letterSpacing: '-1px',
              lineHeight: 1,
            }}
          >
            YARD
          </span>
          <span
            style={{
              color: '#0B0B0B',
              fontSize: 40,
              fontWeight: 900,
              letterSpacing: '-1px',
              lineHeight: 1,
            }}
          >
            YARNS
          </span>
        </div>
        <span
          style={{
            color: '#00C853',
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '2.5px',
            lineHeight: 1,
            marginTop: 7,
          }}
        >
          TENANTS HAVE A VOICE.
        </span>
      </div>
    ),
    { width: 280, height: 96 },
  )
}
