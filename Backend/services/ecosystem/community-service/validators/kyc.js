'use strict';
const { z } = require('zod');

const MAX_FILE_BYTES = 1_500_000;
const MIME_RE = /^data:(image\/jpeg|image\/png|image\/webp|application\/pdf);base64,([A-Za-z0-9+/=]+)$/;

// Magic bytes, so a renamed .exe is not stored as "image/png".
const SIGNATURES = {
    'image/jpeg': (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
    'image/png': (b) => b.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    'image/webp': (b) => b.slice(0, 4).toString() === 'RIFF' && b.slice(8, 12).toString() === 'WEBP',
    'application/pdf': (b) => b.slice(0, 5).toString() === '%PDF-',
};

function parseDataUrl(value) {
    const m = MIME_RE.exec(value);
    if (!m) return null;
    const bytes = Buffer.from(m[2], 'base64');
    if (bytes.length === 0 || bytes.length > MAX_FILE_BYTES) return null;
    return SIGNATURES[m[1]](bytes) ? { mime: m[1], bytes } : null;
}

const fileField = (label) => z.string().max(2_100_000).refine((v) => parseDataUrl(v) !== null, `${label} must be a JPEG, PNG, WebP or PDF under 1.5 MB`);

const submitSchema = z.object({
    fullName: z.string().trim().min(2).max(160),
    dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').refine((d) => {
        const dob = new Date(`${d}T00:00:00Z`);
        const cutoff = new Date(); cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 18);
        return !Number.isNaN(dob.getTime()) && dob <= cutoff && dob.getUTCFullYear() > 1900;
    }, 'You must be at least 18'),
    nationality: z.string().trim().min(2).max(80),
    idType: z.enum(['passport', 'government_id', 'driving_license']),
    idNumberLast4: z.string().regex(/^[A-Za-z0-9]{4}$/, 'Enter the last 4 characters of the ID number'),
    idDocument: fileField('ID document'),
    selfie: fileField('Selfie'),
});

const decisionSchema = z.object({
    status: z.enum(['approved', 'rejected']),
    reason: z.string().trim().max(500).optional(),
}).refine((d) => d.status !== 'rejected' || !!d.reason, { message: 'A reason is required when rejecting', path: ['reason'] });

module.exports = { submitSchema, decisionSchema, parseDataUrl, MAX_FILE_BYTES };
