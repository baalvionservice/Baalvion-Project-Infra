/**
 * Generates static raster brand assets from the branded mark using @vercel/og
 * (next/og), which bundles satori + resvg — no external rasterizer needed.
 *
 * Outputs (in /public):
 *   - logo.png              512x512  (schema/Organization logo, raster)
 *   - apple-touch-icon.png  180x180
 *   - favicon-32.png         32x32
 *   - favicon.ico           ICO wrapping the 32x32 PNG (legacy browsers)
 *
 * The mark is text-free (a gradient tile + teal triangle), so no font is needed.
 * Run:  node scripts/generate-raster-assets.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { ImageResponse } = require('next/dist/compiled/@vercel/og/index.node.js');
import { join } from 'node:path';
import React from 'react';

const PUBLIC = join(process.cwd(), 'public');
mkdirSync(PUBLIC, { recursive: true });

function mark(size) {
  const t = Math.round(size * 0.26); // triangle half-width
  const h = Math.round(size * 0.44); // triangle height
  return React.createElement(
    'div',
    {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0B2540 0%, #0A1A2B 100%)',
      },
    },
    React.createElement('div', {
      style: {
        width: 0,
        height: 0,
        borderLeft: `${t}px solid transparent`,
        borderRight: `${t}px solid transparent`,
        borderBottom: `${h}px solid #21CEDD`,
      },
    }),
  );
}

async function png(size) {
  const res = new ImageResponse(mark(size), { width: size, height: size });
  return Buffer.from(await res.arrayBuffer());
}

/** Wrap a PNG buffer in a minimal .ico container (PNG-in-ICO, Vista+). */
function pngToIco(pngBuf, size) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // count
  const entry = Buffer.alloc(16);
  entry.writeUInt8(size >= 256 ? 0 : size, 0); // width
  entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
  entry.writeUInt8(0, 2); // palette
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // color planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(pngBuf.length, 8); // size of image data
  entry.writeUInt32LE(22, 12); // offset (6 + 16)
  return Buffer.concat([header, entry, pngBuf]);
}

const logo = await png(512);
writeFileSync(join(PUBLIC, 'logo.png'), logo);

const apple = await png(180);
writeFileSync(join(PUBLIC, 'apple-touch-icon.png'), apple);

const fav32 = await png(32);
writeFileSync(join(PUBLIC, 'favicon-32.png'), fav32);
writeFileSync(join(PUBLIC, 'favicon.ico'), pngToIco(fav32, 32));

console.log('Generated: logo.png (512), apple-touch-icon.png (180), favicon-32.png (32), favicon.ico');
