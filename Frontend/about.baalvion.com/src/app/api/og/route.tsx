import { ImageResponse } from 'next/og';

// Branded, on-brand Open Graph image generated at the edge of the request.
// Replaces the former picsum.photos placeholder URLs across the site's metadata.
// Usage: /api/og?title=Some%20Title&eyebrow=Baalvion%20News
export const runtime = 'nodejs';
export const revalidate = 86400;

const ORANGE = '#FF9900';
const INK = '#0A0A0A';

export async function GET(request: Request): Promise<ImageResponse> {
  const { searchParams } = new URL(request.url);
  const title = (searchParams.get('title') || 'Baalvion Operating System (BOS)').slice(0, 140);
  const eyebrow = (searchParams.get('eyebrow') || 'Baalvion Industries').slice(0, 60);

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '80px',
          background: `linear-gradient(135deg, ${INK} 0%, #1b1b22 100%)`,
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: ORANGE,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: INK,
              fontSize: '40px',
              fontWeight: 800,
            }}
          >
            B
          </div>
          <div
            style={{
              color: '#ffffff',
              fontSize: '26px',
              fontWeight: 700,
              letterSpacing: '6px',
            }}
          >
            BAALVION
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div
            style={{
              color: ORANGE,
              fontSize: '24px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '6px',
            }}
          >
            {eyebrow}
          </div>
          <div
            style={{
              color: '#ffffff',
              fontSize: title.length > 70 ? '56px' : '72px',
              fontWeight: 800,
              lineHeight: 1.08,
              display: 'flex',
            }}
          >
            {title}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '60px', height: '6px', background: ORANGE, borderRadius: '3px' }} />
          <div style={{ color: '#9ca3af', fontSize: '22px', fontWeight: 500 }}>
            about.baalvion.com
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
