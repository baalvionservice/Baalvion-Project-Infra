import sharp from 'sharp';
import { processImage, generateThumbnail, extractMetadata } from '../image';

async function makeFixture(width: number, height: number, format: 'png' | 'jpeg' = 'png') {
  const img = sharp({
    create: { width, height, channels: 3, background: { r: 120, g: 140, b: 200 } },
  });
  return format === 'png' ? img.png().toBuffer() : img.jpeg({ quality: 90 }).toBuffer();
}

describe('processImage', () => {
  it('resizes down to the requested width without upscaling', async () => {
    const src = await makeFixture(2000, 1000);
    const out = await processImage(src, { width: 800, format: 'webp', quality: 80, fit: 'inside' });
    const meta = await extractMetadata(out);
    expect(meta.width).toBe(800);
    expect(meta.height).toBe(400);
    expect(meta.format).toBe('webp');
  });

  it('never upscales a source smaller than the target width', async () => {
    const src = await makeFixture(300, 200);
    const out = await processImage(src, { width: 800, format: 'webp', quality: 80, fit: 'inside' });
    const meta = await extractMetadata(out);
    expect(meta.width).toBe(300);
    expect(meta.height).toBe(200);
  });

  it('produces a materially smaller file for a large uncompressed source', async () => {
    const src = await makeFixture(3000, 2000);
    const out = await processImage(src, { width: 1600, format: 'webp', quality: 80, fit: 'inside' });
    expect(out.length).toBeLessThan(src.length);
  });
});

describe('generateThumbnail', () => {
  it('produces a 400x400 cover-cropped JPEG', async () => {
    const src = await makeFixture(1200, 600);
    const thumb = await generateThumbnail(src);
    const meta = await extractMetadata(thumb);
    expect(meta.width).toBe(400);
    expect(meta.height).toBe(400);
    expect(meta.format).toBe('jpeg');
  });

  it('does not upscale a source smaller than 400x400', async () => {
    const src = await makeFixture(150, 150);
    const thumb = await generateThumbnail(src);
    const meta = await extractMetadata(thumb);
    expect(meta.width).toBe(150);
    expect(meta.height).toBe(150);
  });
});

describe('extractMetadata', () => {
  it('reports dimensions, format, and alpha channel', async () => {
    const src = await makeFixture(640, 480, 'jpeg');
    const meta = await extractMetadata(src);
    expect(meta.width).toBe(640);
    expect(meta.height).toBe(480);
    expect(meta.format).toBe('jpeg');
    expect(meta.hasAlpha).toBe(false);
    expect(meta.pages).toBe(1);
  });
});
