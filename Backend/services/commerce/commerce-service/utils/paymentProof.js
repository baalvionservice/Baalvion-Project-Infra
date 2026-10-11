'use strict';
const { AppError } = require('./errors');

const MAX_PROOFS = 3;
const MAX_BYTES = 2.5 * 1024 * 1024;

// Real image signatures, so a renamed file or script can't be stored as a "screenshot".
const SIGNATURES = {
    'image/jpeg': (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
    'image/png': (b) => b.length > 8 && b.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    'image/webp': (b) => b.length > 12 && b.slice(0, 4).toString('latin1') === 'RIFF' && b.slice(8, 12).toString('latin1') === 'WEBP',
};

function decodeProofs(proofs) {
    if (!proofs || proofs.length === 0) return [];
    if (proofs.length > MAX_PROOFS) throw new AppError('VALIDATION_ERROR', `Attach at most ${MAX_PROOFS} screenshots`, 400);
    return proofs.map((p, i) => {
        const check = SIGNATURES[p.mime];
        if (!check) throw new AppError('VALIDATION_ERROR', `Screenshot ${i + 1}: only JPEG, PNG or WebP images are accepted`, 400);
        const data = Buffer.from(String(p.data || ''), 'base64');
        if (data.length === 0) throw new AppError('VALIDATION_ERROR', `Screenshot ${i + 1} is empty`, 400);
        if (data.length > MAX_BYTES) throw new AppError('VALIDATION_ERROR', `Screenshot ${i + 1} is larger than 2.5 MB`, 400);
        if (!check(data)) throw new AppError('VALIDATION_ERROR', `Screenshot ${i + 1} is not a valid ${p.mime} image`, 400);
        return { mime: p.mime, data, size: data.length };
    });
}

module.exports = { decodeProofs, MAX_PROOFS, MAX_BYTES };
