import { ImageResponse } from 'next/og';
import { SITE } from '@/lib/content';

// No `runtime = 'edge'`: a static export prerenders this OG card to a PNG at
// build time (the edge runtime would force a dynamic function a static host
// can't serve). `force-static` is required by `output: export`.
export const dynamic = 'force-static';
export const alt = `${SITE.name} — ${SITE.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

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
          background: '#090c11',
          padding: '72px 80px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div style={{ width: 34, height: 6, background: '#ff9900' }} />
            <div style={{ width: 25, height: 6, background: '#f6f5f3' }} />
            <div style={{ width: 34, height: 6, background: '#f6f5f3' }} />
          </div>
          <div
            style={{
              color: '#f6f5f3',
              fontSize: 30,
              fontWeight: 700,
              letterSpacing: '0.22em',
              textTransform: 'uppercase' as const,
            }}
          >
            Baalvion
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              color: '#ece8e1',
              fontSize: 76,
              fontWeight: 700,
              letterSpacing: '-0.03em',
              lineHeight: 1.05,
            }}
          >
            Global infrastructure intelligence
            <div
              style={{
                width: 26,
                height: 26,
                marginLeft: 12,
                marginBottom: 10,
                background: '#ff9900',
                borderRadius: 2,
              }}
            />
          </div>
          <div
            style={{
              color: '#99a1ad',
              fontSize: 28,
              letterSpacing: '0.01em',
            }}
          >
            Trade · Markets · Ecosystems · Intelligence
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            borderTop: '1px solid rgba(255,255,255,0.14)',
            paddingTop: 28,
            color: '#99a1ad',
            fontSize: 22,
            letterSpacing: '0.12em',
            textTransform: 'uppercase' as const,
          }}
        >
          <div>baalvion.com</div>
          <div style={{ color: '#ff9900' }}>The Corporate Foundation</div>
        </div>
      </div>
    ),
    size
  );
}
