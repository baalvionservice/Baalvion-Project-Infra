'use strict';
// Validates uploaded images by content (never by the declared type) and removes embedded
// metadata (EXIF/GPS, comments) from JPEGs before they are stored.
const MAX_IMAGE_BYTES = 1_000_000;
const DATA_URL = /^data:(image\/jpeg|image\/png|image\/webp);base64,([A-Za-z0-9+/=]+)$/;

const SIGNATURES = {
    'image/jpeg': (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
    'image/png': (b) => b.length > 8 && b.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    'image/webp': (b) => b.length > 12 && b.slice(0, 4).toString() === 'RIFF' && b.slice(8, 12).toString() === 'WEBP',
};

// Drops every APPn (E1 = EXIF/XMP, E2.., ED = Photoshop) and COM segment, keeping the image data.
// APP0 (JFIF) and the colour-profile-free structure stay, so the picture is unchanged.
function stripJpegMetadata(buf) {
    const out = [buf.slice(0, 2)];
    let i = 2;
    while (i + 4 <= buf.length) {
        if (buf[i] !== 0xff) break;
        const marker = buf[i + 1];
        if (marker === 0xda) { out.push(buf.slice(i)); i = buf.length; break; } // start of scan: rest is image data
        const len = buf.readUInt16BE(i + 2);
        if (len < 2 || i + 2 + len > buf.length) return null; // malformed
        const isMetadata = (marker >= 0xe1 && marker <= 0xef) || marker === 0xfe;
        if (!isMetadata) out.push(buf.slice(i, i + 2 + len));
        i += 2 + len;
    }
    return Buffer.concat(out);
}

// Returns { mime, bytes } or null.
function parseImageDataUrl(value) {
    const m = DATA_URL.exec(String(value || ''));
    if (!m) return null;
    let bytes = Buffer.from(m[2], 'base64');
    if (bytes.length === 0 || bytes.length > MAX_IMAGE_BYTES || !SIGNATURES[m[1]](bytes)) return null;
    if (m[1] === 'image/jpeg') {
        bytes = stripJpegMetadata(bytes);
        if (!bytes) return null;
    }
    return { mime: m[1], bytes };
}

module.exports = { parseImageDataUrl, stripJpegMetadata, MAX_IMAGE_BYTES };
