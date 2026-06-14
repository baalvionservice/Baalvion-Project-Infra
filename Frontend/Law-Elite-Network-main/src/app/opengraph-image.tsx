import { ImageResponse } from 'next/og';

// Programmatic OG card — no public/ asset required (drawn with code at the edge).
// System fonts only; do NOT fetch external fonts (breaks edge builds).
export const runtime = 'edge';
export const alt = 'Law Elite Network — Global Legal Intelligence';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const NAVY = '#0f2440';
const NAVY_DEEP = '#081628';
const GOLD = '#c8a24a';
const PARCHMENT = '#f3eee2';
const MUTED = '#9fb0c4';

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
          background: `linear-gradient(135deg, ${NAVY} 0%, ${NAVY_DEEP} 100%)`,
          padding: '72px 80px',
          fontFamily: 'Georgia, "Times New Roman", serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div style={{ width: 38, height: 5, background: GOLD }} />
            <div style={{ width: 26, height: 5, background: PARCHMENT }} />
            <div style={{ width: 38, height: 5, background: PARCHMENT }} />
          </div>
          <div
            style={{
              color: PARCHMENT,
              fontSize: 30,
              fontWeight: 700,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
            }}
          >
            Law Elite Network
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div
            style={{
              display: 'flex',
              color: PARCHMENT,
              fontSize: 72,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              lineHeight: 1.05,
            }}
          >
            Global Legal Intelligence
          </div>
          <div style={{ display: 'flex', color: MUTED, fontSize: 28, letterSpacing: '0.01em' }}>
            Distinguished practitioner discovery · Case management · Legal knowledge
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            borderTop: `1px solid ${GOLD}`,
            paddingTop: 28,
            color: MUTED,
            fontSize: 22,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          <div style={{ display: 'flex' }}>lawelitenetwork.com</div>
          <div style={{ display: 'flex', color: GOLD }}>The Standard for Legal Excellence</div>
        </div>
      </div>
    ),
    size,
  );
}
