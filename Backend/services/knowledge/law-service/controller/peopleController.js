'use strict';
const db = require('../models');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { savePersonPhoto } = require('../service/peoplePhotos');
const { notifySite } = require('../service/siteRevalidate');

const PHOTO_ATTRS = ['id', 'alt_text', 'credit', 'license', 'license_url', 'source_url', 'is_primary', 'width', 'height'];
const publicWhere = { published: true, archived: false };

const photoUrl = (id) => `/v1/people/photos/${id}`;

const shape = (person) => {
    const p = person.toJSON();
    const photos = (p.photos || []).filter((x) => x.is_active !== false).map((x) => ({ ...x, url: photoUrl(x.id) }));
    return { ...p, photos, photo: photos.find((x) => x.is_primary) || null };
};

const include = [
    { model: db.PersonPhoto, as: 'photos', attributes: [...PHOTO_ATTRS, 'is_active'], where: { is_active: true }, required: false },
    { model: db.PersonLink, as: 'links', attributes: ['kind', 'target_slug', 'relationship'], required: false },
];

/** Every published profile with photo metadata and tags (no image bytes): the site merges this over its bundled roster. */
const listPublished = async (req, res, next) => {
    try {
        const rows = await db.Person.findAll({ where: publicWhere, include, order: [['full_name', 'ASC']], limit: 5000 });
        res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
        return sendSuccess(req, res, rows.map(shape));
    } catch (err) { return next(err); }
};

const getPublished = async (req, res, next) => {
    try {
        const row = await db.Person.findOne({ where: { ...publicWhere, slug: req.params.slug }, include });
        if (!row) return next(new AppError('NOT_FOUND', 'Person not found', 404));
        res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
        return sendSuccess(req, res, shape(row));
    } catch (err) { return next(err); }
};

/** Slugs an editor has archived; the site hides its bundled copy of these. */
const hiddenSlugs = async (req, res, next) => {
    try {
        const rows = await db.Person.findAll({ where: { archived: true }, attributes: ['slug'] });
        res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
        return sendSuccess(req, res, rows.map((r) => r.slug));
    } catch (err) { return next(err); }
};

/** Image bytes. Immutable: a replacement photo is a new row with a new id. */
const getPhoto = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)) return next(new AppError('NOT_FOUND', 'Photo not found', 404));
        const photo = await db.PersonPhoto.scope('withData').findOne({
            where: { id, is_active: true },
            include: [{ model: db.Person, attributes: [], as: 'person', where: publicWhere, required: true }],
        });
        if (!photo) return next(new AppError('NOT_FOUND', 'Photo not found', 404));
        res.set({
            'Content-Type': photo.content_type,
            'Cache-Control': 'public, max-age=31536000, immutable',
            'X-Content-Type-Options': 'nosniff',
            'Cross-Origin-Resource-Policy': 'cross-origin',
        });
        return res.send(photo.data);
    } catch (err) { return next(err); }
};

/** Admin preview of any photo, including those of unpublished profiles (the public route only serves published ones). */
const getPhotoAdmin = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)) return next(new AppError('NOT_FOUND', 'Photo not found', 404));
        const photo = await db.PersonPhoto.scope('withData').findByPk(id);
        if (!photo) return next(new AppError('NOT_FOUND', 'Photo not found', 404));
        res.set({ 'Content-Type': photo.content_type, 'Cache-Control': 'private, max-age=300', 'X-Content-Type-Options': 'nosniff' });
        return res.send(photo.data);
    } catch (err) { return next(err); }
};

/** Admin: multipart upload of one photo with its credit and licence. */
const uploadPhoto = async (req, res, next) => {
    try {
        if (!req.file) return next(new AppError('VALIDATION_ERROR', 'Attach an image file (JPEG, PNG or WebP)', 400));
        const { photo, created } = await savePersonPhoto(Number(req.params.id), req.file.buffer, req.file.mimetype, {
            filename: req.file.originalname,
            credit: req.body.credit,
            license: req.body.license,
            license_url: req.body.license_url,
            source_url: req.body.source_url,
            alt_text: req.body.alt_text,
        });
        await db.AuditLog.create({
            actor_id: req.auth ? String(req.auth.userId) : null,
            actor_email: req.auth ? req.auth.email : null,
            action: 'upload', resource: 'person_photos', resource_id: String(photo.id),
            changes: { person_id: Number(req.params.id), license: req.body.license, credit: req.body.credit },
        }).catch(() => {});
        notifySite(['/people']);
        const { data, ...safe } = photo.toJSON();
        return sendSuccess(req, res, { ...safe, url: photoUrl(photo.id) }, created ? 201 : 200);
    } catch (err) { return next(err); }
};

module.exports = { hiddenSlugs, listPublished, getPublished, getPhoto, getPhotoAdmin, uploadPhoto };
