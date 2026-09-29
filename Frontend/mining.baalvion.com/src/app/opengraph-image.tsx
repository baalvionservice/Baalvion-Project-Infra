import { ImageResponse } from 'next/og';

// Real raster (PNG) Open Graph image — rendered by @vercel/og (satori + resvg),
// so social scrapers and legacy clients that do not render SVG get a proper image.
export const runtime = 'nodejs';
export const alt = 'Baalvion Mining Inc. — Global Mineral Trade & Commodity Supply Network';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#0B2540',
          backgroundImage:
            'radial-gradient(circle at 80% 20%, rgba(33,206,221,0.18), rgba(11,37,64,0) 55%)',
          padding: '72px',
          color: '#FFFFFF',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              backgroundColor: '#0E2B49',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 24,
            }}
          >
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: '16px solid transparent',
                borderRight: '16px solid transparent',
                borderBottom: '28px solid #21CEDD',
              }}
            />
          </div>
          <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: -0.5 }}>
            Baalvion Mining Inc.
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 66, fontWeight: 800, lineHeight: 1.05 }}>
            Global Mineral Trade &
          </div>
          <div style={{ fontSize: 66, fontWeight: 800, lineHeight: 1.05, color: '#21CEDD' }}>
            Commodity Supply Network
          </div>
          <div style={{ marginTop: 28, fontSize: 28, color: '#9FC6D6' }}>
            Secure · Compliant · Transparent B2B trade
          </div>
        </div>

        <div style={{ display: 'flex', fontSize: 20, color: '#6F93A6' }}>
          Operated by Baalvion Industries Private Limited · CIN U43121OD2025PTC048479
        </div>
      </div>
    ),
    { ...size },
  );
}
