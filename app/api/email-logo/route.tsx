import { ImageResponse } from 'next/og'

// Full YardYarns logo for email headers.
// The compact YY square (app/icon.tsx) is for favicons and constrained spaces.
// This route serves the horizontal lockup: YY square + wordmark.
//
// Background matches the email wrapper (#f3f4f6) so it blends seamlessly
// above the white card without any visible image border.

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          width: 220,
          height: 44,
          background: '#f3f4f6',
        }}
      >
        {/* YY square — mirrors the favicon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 34,
            height: 34,
            background: '#111827',
            borderRadius: 7,
            flexShrink: 0,
          }}
        >
          <span
            style={{
              color: 'white',
              fontSize: 17,
              fontWeight: 900,
              letterSpacing: '-0.5px',
              lineHeight: 1,
            }}
          >
            YY
          </span>
        </div>

        {/* Wordmark */}
        <span
          style={{
            color: '#111827',
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: '-0.4px',
            lineHeight: 1,
          }}
        >
          YardYarns
        </span>
      </div>
    ),
    { width: 220, height: 44 },
  )
}
