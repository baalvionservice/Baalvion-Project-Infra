import { ImageResponse } from 'next/og';

// Programmatic OG card — no public/ asset required (drawn with code at the edge).
// System fonts only; do NOT fetch external fonts (breaks edge builds).
export const runtime = 'edge';
export const alt = 'Amarisé Maison Avenue — The Pinnacle of Global Luxury';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const BLACK = '#0a0a0a';
const INK = '#000000';
const GOLD = '#c9a35b';
const IVORY = '#f5f1e8';
const MUTED = '#8a8278';

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
          alignItems: 'center',
          background: `linear-gradient(160deg, ${BLACK} 0%, ${INK} 100%)`,
          padding: '80px',
          fontFamily: 'Georgia, "Times New Roman", serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            color: GOLD,
            fontSize: 22,
            letterSpacing: '0.42em',
            textTransform: 'uppercase',
          }}
        >
          Established 1924
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26 }}>
          <div
            style={{
              display: 'flex',
              color: IVORY,
              fontSize: 88,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              textAlign: 'center',
            }}
          >
            Amarisé
          </div>
          <div style={{ display: 'flex', width: 120, height: 2, background: GOLD }} />
          <div
            style={{
              display: 'flex',
              color: MUTED,
              fontSize: 30,
              letterSpacing: '0.34em',
              textTransform: 'uppercase',
            }}
          >
            Maison Avenue
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <div style={{ display: 'flex', color: IVORY, fontSize: 24, letterSpacing: '0.12em' }}>
            The Pinnacle of Global Luxury
          </div>
          <div
            style={{
              display: 'flex',
              color: GOLD,
              fontSize: 20,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
            }}
          >
            amarisemaisonavenue.com
          </div>
        </div>
      </div>
    ),
    size,
  );
}
