'use strict';

/**
 * Attaches a licensed photo to a draft, with its provenance.
 *
 * The file is copied to our own storage (never hotlinked) and the row records where it came from, its licence,
 * and the credit that licence requires. `depictsNamedSubject` is true only when the editor has said the photo
 * really shows the subject: it is the integrity flag, so it is never inferred.
 */

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { CmsArticleDraft, CmsArticleArt } = require('../../models');
const { UPLOAD_DIR, PUBLIC_BASE } = require('../mediaService');
const { AppError } = require('../../utils/errors');
const { commonsFile } = require('./photoCommons');
const defaultHttp = require('./trends/http');

const MAX_BYTES = 8 * 1024 * 1024;
const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const PREFIX = 'licensed-art';

// The server said "image/jpeg"; the bytes must say so too before anything is written to disk.
const MAGIC = {
    'image/jpeg': (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
    'image/png': (b) => b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    'image/webp': (b) => b.length > 12 && b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP',
};

async function downloadImage(url) {
    const res = await fetch(url, { headers: { 'user-agent': defaultHttp.UA }, signal: AbortSignal.timeout(20000) });
    if (!res.ok) throw new Error(`HTTP ${res.status} fetching the image`);
    const mime = String(res.headers.get('content-type') || '').split(';')[0].trim();
    const bytes = Buffer.from(await res.arrayBuffer());
    return { mime, bytes };
}

async function attachCommonsPhoto(websiteId, draftId, input, { getJson = defaultHttp.getJson, download = downloadImage } = {}) {
    const draft = await CmsArticleDraft.findOne({ where: { id: draftId, websiteId } });
    if (!draft) throw new AppError('NOT_FOUND', 'Draft not found', 404);
    const subject = String(input.subject || '').trim();
    if (!subject) throw new AppError('VALIDATION_ERROR', 'Say what the photo shows (subject) so its record is accurate.', 400);

    const file = await commonsFile(input.title, { getJson });
    if (!file) throw new AppError('LICENSE_NOT_ALLOWED', 'That file is not available, or its licence does not allow commercial use with credit.', 422);

    const { mime, bytes } = await download(file.thumbUrl);
    if (!EXT[mime]) throw new AppError('BAD_IMAGE', `Unsupported image type "${mime}".`, 422);
    if (bytes.length > MAX_BYTES || bytes.length < 1024) throw new AppError('BAD_IMAGE', 'The image is empty or too large.', 422);
    if (!MAGIC[mime](bytes)) throw new AppError('BAD_IMAGE', 'The downloaded file is not a real image.', 422);

    const name = `${draft.id}-${crypto.createHash('sha1').update(bytes).digest('hex').slice(0, 8)}.${EXT[mime]}`;
    fs.mkdirSync(path.join(UPLOAD_DIR, PREFIX), { recursive: true });
    fs.writeFileSync(path.join(UPLOAD_DIR, PREFIX, name), bytes);

    // One primary per draft: a new photo replaces the old primary rather than piling up.
    await CmsArticleArt.update({ isPrimary: false }, { where: { draftId: draft.id, isPrimary: true } });
    return CmsArticleArt.create({
        draftId: draft.id,
        kind: 'photo',
        provider: 'wikimedia-commons',
        sourcePageUrl: file.pageUrl,
        sourceFileUrl: file.thumbUrl,
        licenseName: file.license.name,
        licenseUrl: file.license.url,
        attribution: file.credit,
        subject,
        depictsNamedSubject: input.confirmedDepictsSubject === true,
        altText: String(input.altText || '').trim() || `Photograph: ${subject}`,
        caption: `Photo: ${file.credit}`,
        url: `${PUBLIC_BASE}/uploads/${PREFIX}/${name}`,
        status: 'approved',
        failureReason: null,
        isPrimary: true,
    });
}

async function listArt(websiteId, draftId) {
    const draft = await CmsArticleDraft.findOne({ where: { id: draftId, websiteId }, attributes: ['id'] });
    if (!draft) throw new AppError('NOT_FOUND', 'Draft not found', 404);
    return CmsArticleArt.findAll({ where: { draftId }, order: [['createdAt', 'DESC']] });
}

module.exports = { attachCommonsPhoto, listArt };
