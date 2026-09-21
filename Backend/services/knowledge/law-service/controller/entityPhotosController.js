'use strict';
const db = require('../models');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { saveEntityPhoto } = require('../service/entityPhotos');
const { notifySite } = require('../service/siteRevalidate');

const META = ['id', 'entity_type', 'entity_slug', 'alt_text', 'credit', 'license', 'license_url', 'source_url'];

/** The active primary photo of every entity that has one (metadata only): the site overlays this onto any entity, bundled or admin-managed. */
const listPrimary = async (req, res, next) => {
    try {
        const rows = await db.EntityPhoto.findAll({ where: { is_primary: true, is_active: true }, attributes: META, limit: 20000 });
        res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
        return sendSuccess(req, res, rows);
    } catch (err) { return next(err); }
};

/** Every active photo of one entity (metadata only), main image first: for a page's gallery. */
const listForEntity = async (req, res, next) => {
    try {
        const rows = await db.EntityPhoto.findAll({
            where: { entity_type: req.params.type, entity_slug: req.params.slug, is_active: true },
            attributes: META, order: [['is_primary', 'DESC'], ['id', 'ASC']], limit: 60,
        });
        res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
        return sendSuccess(req, res, rows);
    } catch (err) { return next(err); }
};

const send = (res, photo, cache) => {
    res.set({
        'Content-Type': photo.content_type,
        'Cache-Control': cache,
        'X-Content-Type-Options': 'nosniff',
        'Cross-Origin-Resource-Policy': 'cross-origin',
    });
    return res.send(photo.data);
};

/** Image bytes. Immutable: a replacement photo is a new row with a new id. */
const getPhoto = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)) return next(new AppError('NOT_FOUND', 'Photo not found', 404));
        const photo = await db.EntityPhoto.scope('withData').findOne({ where: { id, is_active: true } });
        if (!photo) return next(new AppError('NOT_FOUND', 'Photo not found', 404));
        return send(res, photo, 'public, max-age=31536000, immutable');
    } catch (err) { return next(err); }
};

/** Admin preview of any photo, active or not. */
const getPhotoAdmin = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)) return next(new AppError('NOT_FOUND', 'Photo not found', 404));
        const photo = await db.EntityPhoto.scope('withData').findByPk(id);
        if (!photo) return next(new AppError('NOT_FOUND', 'Photo not found', 404));
        return send(res, photo, 'private, max-age=300');
    } catch (err) { return next(err); }
};

/** Admin: multipart upload of one photo for (entity_type, entity_slug). */
const uploadPhoto = async (req, res, next) => {
    try {
        if (!req.file) return next(new AppError('VALIDATION_ERROR', 'Attach an image file (JPEG, PNG or WebP)', 400));
        const { photo, created } = await saveEntityPhoto(req.body.entity_type, req.body.entity_slug, req.file.buffer, req.file.mimetype, {
            filename: req.file.originalname, credit: req.body.credit, license: req.body.license,
            license_url: req.body.license_url, source_url: req.body.source_url, alt_text: req.body.alt_text,
        });
        await db.AuditLog.create({
            actor_id: req.auth ? String(req.auth.userId) : null, actor_email: req.auth ? req.auth.email : null,
            action: 'upload', resource: 'entity_photos', resource_id: String(photo.id),
            changes: { entity_type: req.body.entity_type, entity_slug: req.body.entity_slug, license: req.body.license, credit: req.body.credit },
        }).catch(() => {});
        notifySite(['/people', '/entertainment']);
        const { data, ...safe } = photo.toJSON();
        return sendSuccess(req, res, safe, created ? 201 : 200);
    } catch (err) { return next(err); }
};

const commonsSvc = require('../service/commonsSearch');

/** Admin: search Wikimedia Commons for freely licensed photos. */
const commonsSearch = async (req, res, next) => {
    try { return sendSuccess(req, res, await commonsSvc.search(req.query.q)); } catch (err) { return next(err); }
};

/** Admin: import one Commons photo for an entity, with the credit and licence Commons records. */
const commonsImport = async (req, res, next) => {
    try {
        const { entity_type: type, entity_slug: slug, title, alt_text: alt } = req.body || {};
        const { photo, created } = await commonsSvc.importFile(type, slug, title, alt);
        await db.AuditLog.create({
            actor_id: req.auth ? String(req.auth.userId) : null, actor_email: req.auth ? req.auth.email : null,
            action: 'import', resource: 'entity_photos', resource_id: String(photo.id),
            changes: { entity_type: type, entity_slug: slug, source: photo.source_url, license: photo.license },
        }).catch(() => {});
        notifySite(['/people', '/entertainment', '/podcasts']);
        const { data, ...safe } = photo.toJSON();
        return sendSuccess(req, res, safe, created ? 201 : 200);
    } catch (err) { return next(err); }
};

module.exports = { commonsSearch, commonsImport, listPrimary, listForEntity, getPhoto, getPhotoAdmin, uploadPhoto };
