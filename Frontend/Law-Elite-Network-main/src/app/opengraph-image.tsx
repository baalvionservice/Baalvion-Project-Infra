import { ImageResponse } from 'next/og';

// Programmatic OG card — drawn with code at the edge, no public/ asset needed.
// System fonts only; do NOT fetch external fonts (breaks edge builds).
export const runtime = 'edge';
export const alt = 'Law Elite Network — History, Culture, Technology & Education';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const NAVY   = '#0F2440';
const RED    = '#E13131';
const GOLD   = '#C8A24A';
const WHITE  = '#F6F4EF';
const MUTED  = '#8fa3bb';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#fff',
          padding: '0',
          fontFamily: 'Arial Narrow, Arial, sans-serif',
        }}
      >
        {/* Top navy accent bar */}
        <div style={{ width: '100%', height: 8, background: NAVY, display: 'flex' }} />

        {/* Main content area */}
        <div style={{ display: 'flex', flex: 1, padding: '48px 72px', gap: 48, alignItems: 'center' }}>
          {/* Left: Scales icon */}
          <div
            style={{
              width: 160,
              height: 160,
              background: NAVY,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {/* SVG scales — rendered as inline element in ImageResponse */}
            <svg viewBox="0 0 64 64" width="110" height="110">
              {/* Beam */}
              <rect x="10" y="20" width="44" height="4" fill={WHITE} />
              {/* Post */}
              <rect x="30" y="24" width="4" height="20" fill={WHITE} />
              {/* Base */}
              <rect x="24" y="46" width="16" height="4" fill={WHITE} />
              {/* Left chain */}
              <rect x="13.5" y="24" width="2" height="9" fill={WHITE} />
              {/* Right chain */}
              <rect x="48.5" y="24" width="2" height="9" fill={WHITE} />
              {/* Left pan */}
              <circle cx="15.5" cy="33" r="7.5" fill="none" stroke={WHITE} strokeWidth="2" />
              {/* Right pan */}
              <circle cx="50.5" cy="33" r="7.5" fill="none" stroke={WHITE} strokeWidth="2" />
            </svg>
          </div>

          {/* Right: Wordmark + tagline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <span
                style={{
                  fontSize: 64,
                  fontWeight: 900,
                  color: NAVY,
                  letterSpacing: '-0.02em',
                  lineHeight: 1,
                  textTransform: 'uppercase',
                }}
              >
                LAW ELITE
              </span>
              <span
                style={{
                  background: RED,
                  color: '#fff',
                  fontSize: 22,
                  fontWeight: 900,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  padding: '6px 14px',
                  lineHeight: 1,
                }}
              >
                NETWORK
              </span>
            </div>

            <div
              style={{
                fontSize: 28,
                color: '#333',
                letterSpacing: '0.01em',
                lineHeight: 1.4,
                maxWidth: 780,
              }}
            >
              History, Culture, Language & Technology of Law
            </div>
          </div>
        </div>

        {/* Bottom footer bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: NAVY,
            padding: '18px 72px',
          }}
        >
          <span style={{ color: WHITE, fontSize: 20, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            lawelitenetwork.com
          </span>
          <span style={{ color: GOLD, fontSize: 18, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
Exploring the World Around Law
          </span>
        </div>
      </div>
    ),
    size,
  );
}
