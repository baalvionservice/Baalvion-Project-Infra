'use strict';
const { parseImageDataUrl, stripJpegMetadata, MAX_IMAGE_BYTES } = require('../utils/imageSafety');

const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGD4DwABBAEAX+XDSwAAAABJRU5ErkJggg==';
const seg = (marker, payload) => { const len = Buffer.alloc(2); len.writeUInt16BE(payload.length + 2); return Buffer.concat([Buffer.from([0xff, marker]), len, payload]); };
const jpegWith = (...segments) => Buffer.concat([Buffer.from([0xff, 0xd8]), ...segments, seg(0xda, Buffer.from([1, 2, 3])), Buffer.from([0xff, 0xd9])]);
const asUrl = (b, mime = 'image/jpeg') => `data:${mime};base64,${b.toString('base64')}`;

describe('image validation', () => {
    it('accepts real images and rejects anything else', () => {
        expect(parseImageDataUrl(PNG).mime).toBe('image/png');
        expect(parseImageDataUrl(`data:image/png;base64,${Buffer.from('MZ evil').toString('base64')}`)).toBeNull();
        expect(parseImageDataUrl('data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=')).toBeNull();
        expect(parseImageDataUrl('data:application/pdf;base64,JVBERi0=')).toBeNull();
        expect(parseImageDataUrl('')).toBeNull();
        expect(parseImageDataUrl(undefined)).toBeNull();
    });

    it('enforces the size cap', () => {
        const big = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(MAX_IMAGE_BYTES)]);
        expect(parseImageDataUrl(asUrl(big))).toBeNull();
    });

    it('requires the bytes to match the declared type', () => {
        expect(parseImageDataUrl(asUrl(Buffer.from(PNG.split(',')[1], 'base64'), 'image/jpeg'))).toBeNull();
    });
});

describe('JPEG metadata stripping', () => {
    const exif = seg(0xe1, Buffer.from('Exif\0\0GPS-LAT-12.9,LON-77.5'));
    const jfif = seg(0xe0, Buffer.from('JFIF\0\x01\x01\0\0\x01\0\x01\0\0'));
    const comment = seg(0xfe, Buffer.from('shot at home address'));
    const quant = seg(0xdb, Buffer.alloc(65, 1));

    it('removes EXIF, comments and other APPn segments but keeps image structure', () => {
        const stripped = stripJpegMetadata(jpegWith(jfif, exif, comment, quant));
        const text = stripped.toString('latin1');
        expect(text.includes('GPS-LAT')).toBe(false);
        expect(text.includes('home address')).toBe(false);
        expect(text.includes('JFIF')).toBe(true);
        expect(stripped.includes(quant)).toBe(true);
        expect(stripped[0]).toBe(0xff);
        expect(stripped[1]).toBe(0xd8);
        expect(stripped[stripped.length - 1]).toBe(0xd9);
    });

    it('is applied by the upload parser and rejects malformed JPEGs', () => {
        const out = parseImageDataUrl(asUrl(jpegWith(jfif, exif, quant)));
        expect(out.bytes.toString('latin1').includes('GPS-LAT')).toBe(false);
        const broken = Buffer.concat([Buffer.from([0xff, 0xd8]), Buffer.from([0xff, 0xe1, 0xff, 0xff, 1, 2])]);
        expect(parseImageDataUrl(asUrl(broken))).toBeNull();
    });
});
