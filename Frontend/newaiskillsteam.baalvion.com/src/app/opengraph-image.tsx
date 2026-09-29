import { ImageResponse } from 'next/og';

/**
 * File-convention Open Graph image for the whole site.
 *
 * Next.js automatically wires this up as the default `og:image` /
 * `twitter:image` for every route (resolved against `metadataBase`), so no
 * static binary asset and no hardcoded `/og-image.png` URL is required.
 *
 * Rendered with `next/og` (built into Next 15 — no extra dependency).
 */
export const runtime = 'edge';

export const alt = 'ControlTheMarket — Proof-of-Skill Hiring Platform';

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

// Brand colors sourced from globals.css design tokens.
const DEEP_BLUE = 'hsl(220, 60%, 40%)';
const GREEN = 'hsl(142, 76%, 36%)';
const DARK = 'hsl(220, 10%, 12%)';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: `linear-gradient(135deg, ${DARK} 0%, ${DEEP_BLUE} 100%)`,
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: GREEN,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '34px',
              fontWeight: 800,
            }}
          >
            ✓
          </div>
          <div style={{ fontSize: '34px', fontWeight: 700, letterSpacing: '-1px' }}>
            ControlTheMarket
          </div>
        </div>

        <div
          style={{
            fontSize: '76px',
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: '-3px',
            maxWidth: '900px',
          }}
        >
          Hire by Skill, Not by Resume
        </div>

        <div
          style={{
            marginTop: '28px',
            fontSize: '30px',
            lineHeight: 1.4,
            color: 'rgba(255, 255, 255, 0.72)',
            maxWidth: '880px',
          }}
        >
          The proof-of-skill hiring platform where top companies discover verified
          talent based on real-world performance.
        </div>

        <div
          style={{
            marginTop: '48px',
            height: '8px',
            width: '180px',
            borderRadius: '4px',
            background: GREEN,
          }}
        />
      </div>
    ),
    {
      ...size,
    },
  );
}
