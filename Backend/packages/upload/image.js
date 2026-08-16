'use strict';
// ─── @baalvion/upload/image — CommonJS twin of image.ts ───────────────────────
//
// The package `main` (src/index.ts) is TypeScript, so plain-JS backend services
// (cms, commerce, law, …) cannot `require('@baalvion/upload')`. This is the
// CommonJS port of image.ts so those services can adopt resize/re-encode via
// `require('@baalvion/upload/image.js')`. Keep in sync with image.ts.

const sharp = require('sharp');

/**
 * Process an image buffer: resize, convert format, and adjust quality.
 * @param {Buffer} buffer
 * @param {{ width?: number, height?: number, format?: 'jpeg'|'png'|'webp'|'avif'|'gif', quality?: number, fit?: 'cover'|'contain'|'fill'|'inside'|'outside' }} [opts]
 * @returns {Promise<Buffer>}
 */
async function processImage(buffer, opts = {}) {
  let pipeline = sharp(buffer, { animated: true }).rotate(); // auto-orient from EXIF before any resize

  if (opts.width || opts.height) {
    pipeline = pipeline.resize(opts.width, opts.height, {
      fit: opts.fit || 'cover',
      withoutEnlargement: true,
    });
  }

  const format = opts.format || 'jpeg';
  const quality = opts.quality || 80;

  switch (format) {
    case 'jpeg':
      pipeline = pipeline.jpeg({ quality, mozjpeg: true });
      break;
    case 'png':
      pipeline = pipeline.png({ quality, compressionLevel: 8 });
      break;
    case 'webp':
      pipeline = pipeline.webp({ quality });
      break;
    case 'avif':
      pipeline = pipeline.avif({ quality });
      break;
    case 'gif':
      pipeline = pipeline.gif();
      break;
    default:
      pipeline = pipeline.jpeg({ quality });
  }

  return pipeline.toBuffer();
}

/**
 * Generate a 400x400 JPEG thumbnail from an image buffer (cover-cropped, no upscale).
 * @param {Buffer} buffer
 * @returns {Promise<Buffer>}
 */
async function generateThumbnail(buffer) {
  return sharp(buffer)
    .rotate()
    .resize(400, 400, { fit: 'cover', withoutEnlargement: true })
    .jpeg({ quality: 75, mozjpeg: true })
    .toBuffer();
}

/**
 * Extract image metadata (dimensions, format, file size, alpha channel, animated frame count).
 * @param {Buffer} buffer
 * @returns {Promise<{ width: number, height: number, format: string, size: number, hasAlpha: boolean, pages: number }>}
 */
async function extractMetadata(buffer) {
  const meta = await sharp(buffer).metadata();
  return {
    width: meta.width || 0,
    height: meta.height || 0,
    format: meta.format || 'unknown',
    size: meta.size || buffer.byteLength,
    hasAlpha: meta.hasAlpha || false,
    pages: meta.pages || 1,
  };
}

module.exports = { processImage, generateThumbnail, extractMetadata };
