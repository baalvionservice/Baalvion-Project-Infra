import { ImageResponse } from 'next/og';

// Programmatic OG card — no public/ asset required (drawn with code at the edge).
// System fonts only; do NOT fetch external fonts (breaks edge builds).
export const runtime = 'edge';
export const alt = 'Baalvion — Institutional Investor Relations';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const BG = '#09090b';
const BG_2 = '#131316';
const ACCENT = '#3b82f6';
const TEXT = '#fafafa';
const MUTED = '#71717a';
const BORDER = 'rgba(255,255,255,0.10)';

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
          background: `linear-gradient(140deg, ${BG} 0%, ${BG_2} 100%)`,
          padding: '72px 80px',
          fontFamily: 'Arial, Helvetica, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', width: 12, height: 36, background: ACCENT }} />
          <div
            style={{
              display: 'flex',
              color: TEXT,
              fontSize: 30,
              fontWeight: 700,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
            }}
          >
            Baalvion
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div
            style={{
              display: 'flex',
              color: TEXT,
              fontSize: 70,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              lineHeight: 1.06,
            }}
          >
            Institutional Investor Relations
          </div>
          <div style={{ display: 'flex', color: MUTED, fontSize: 27, letterSpacing: '0.01em' }}>
            Engineering the backbone of global trade.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            borderTop: `1px solid ${BORDER}`,
            paddingTop: 28,
            color: MUTED,
            fontSize: 22,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          <div style={{ display: 'flex' }}>ir.baalvion.com</div>
          <div style={{ display: 'flex', color: ACCENT }}>Performance · Governance · Strategy</div>
        </div>
      </div>
    ),
    size,
  );
}
