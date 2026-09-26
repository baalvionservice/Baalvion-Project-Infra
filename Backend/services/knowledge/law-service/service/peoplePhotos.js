'use strict';
const crypto = require('crypto');
const db = require('../models');
const { AppError } = require('../utils/errors');
const { guardUpload } = require('@baalvion/upload/validate.js');
const { isAllowedLicense } = require('../utils/peopleValidation');

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 6 * 1024 * 1024;

/**
 * Stores one photo for a person. Used by the admin upload route and by the
 * import script, so both enforce the same rules: real image bytes (magic-byte
 * checked), a size cap, a licence that permits display, and a credit line.
 * The first photo a person gets becomes their primary one.
 */
async function savePersonPhoto(personId, buffer, mime, meta = {}) {
    if (!IMAGE_TYPES.includes(mime)) throw new AppError('VALIDATION_ERROR', 'Photos must be JPEG, PNG or WebP', 400);
    if (!buffer || buffer.length === 0 || buffer.length > MAX_BYTES) throw new AppError('VALIDATION_ERROR', 'Photo must be under 6 MB', 400);
    if (!String(meta.credit || '').trim()) throw new AppError('VALIDATION_ERROR', 'A credit line is required', 400);
    if (!isAllowedLicense(meta.license)) throw new AppError('VALIDATION_ERROR', 'License must be public domain, CC0, CC BY, CC BY-SA, LEN-owned or Licensed', 400);

    const guard = await guardUpload(buffer, { declaredMime: mime, filename: meta.filename || 'photo' });
    if (!guard.ok) throw new AppError(guard.code || 'UNSUPPORTED_MEDIA_TYPE', guard.message || 'Rejected upload', guard.status || 415);

    const person = await db.Person.findByPk(personId);
    if (!person) throw new AppError('NOT_FOUND', 'Person not found', 404);

    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
    const existing = await db.PersonPhoto.findOne({ where: { person_id: personId, sha256 } });
    if (existing) return { photo: existing, created: false };

    const hasPrimary = await db.PersonPhoto.count({ where: { person_id: personId, is_primary: true, is_active: true } });
    const photo = await db.PersonPhoto.create({
        person_id: personId,
        content_type: mime,
        data: buffer,
        width: meta.width || null,
        height: meta.height || null,
        sha256,
        alt_text: meta.alt_text || `Photo of ${person.display_name || person.full_name}`,
        credit: String(meta.credit).trim().slice(0, 500),
        license: String(meta.license).trim().slice(0, 60),
        license_url: meta.license_url || null,
        source_url: meta.source_url || null,
        is_primary: hasPrimary === 0,
    });
    return { photo, created: true };
}

module.exports = { savePersonPhoto, IMAGE_TYPES, MAX_BYTES };
