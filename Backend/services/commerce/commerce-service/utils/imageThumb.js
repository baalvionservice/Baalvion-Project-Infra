'use strict';
/**
 * Thumbnail generation for product images.
 *
 * Uses `sharp` when it is installed (real resize → 400x400 cover JPEG). `sharp`
 * is an OPTIONAL dependency: when it is absent (or fails on a non-raster input
 * such as SVG), generateThumbnail returns null and the caller reuses the
 * original image as its own thumbnail. This keeps the service runnable with zero
 * native build steps while still producing real thumbnails wherever sharp is
 * available. To enable: `pnpm --filter commerce-service add sharp`.
 */

const THUMB_SIZE = Number(process.env.MEDIA_THUMB_SIZE || 400);

let sharp = null;
let sharpResolved = false;
function loadSharp() {
    if (sharpResolved) return sharp;
    sharpResolved = true;
    try { sharp = require('sharp'); }
    catch { sharp = null; } // optional dependency not installed
    return sharp;
}

/** True when a real thumbnail engine is available. */
function isAvailable() { return !!loadSharp(); }

/**
 * Produce a square (cover-cropped) JPEG thumbnail Buffer, or null when no engine
 * is available or the input cannot be rasterized.
 * @param {Buffer} buffer  source image bytes
 * @param {string} mime    source content type (only image/* is processed)
 * @returns {Promise<Buffer|null>}
 */
async function generateThumbnail(buffer, mime) {
    const s = loadSharp();
    if (!s || !mime || !mime.startsWith('image/') || mime === 'image/gif' || mime === 'image/svg+xml') {
        return null; // animated/vector formats and the no-engine case fall back to the original
    }
    try {
        return await s(buffer)
            .rotate() // honour EXIF orientation
            .resize(THUMB_SIZE, THUMB_SIZE, { fit: 'cover', position: 'attention' })
            .jpeg({ quality: 78, mozjpeg: true })
            .toBuffer();
    } catch {
        return null; // corrupt or unsupported payload → caller reuses original
    }
}

/**
 * Best-effort intrinsic dimensions of an image, or {} when unavailable.
 * @returns {Promise<{width?: number, height?: number}>}
 */
async function dimensions(buffer, mime) {
    const s = loadSharp();
    if (!s || !mime || !mime.startsWith('image/')) return {};
    try {
        const meta = await s(buffer).metadata();
        return { width: meta.width, height: meta.height };
    } catch {
        return {};
    }
}

module.exports = { generateThumbnail, dimensions, isAvailable, THUMB_SIZE };
