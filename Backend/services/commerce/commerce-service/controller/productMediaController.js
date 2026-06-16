'use strict';
const mediaService = require('../service/productMediaService');
const { sendSuccess } = require('../utils/response');
const { readRawBody, parseMultipart } = require('../utils/multipart');
const { AppError } = require('../utils/errors');
const { guardUpload } = require('@baalvion/upload/validate.js');

const MEDIA_TYPES = new Set(['image', 'video', 'document']);

// Parse a multipart upload into { filePart, fields }. Shared by upload + replace.
async function readUpload(req) {
    const raw = await readRawBody(req);
    const parts = parseMultipart(raw, req.headers['content-type']);
    const filePart = parts.find((p) => p.name === 'file' && p.filename) || parts.find((p) => p.filename);
    // Upload security enforcement (shared by upload + replace): magic-byte (polyglot) validation +
    // malware scan, fail-closed in production. @baalvion/upload — declared MIME is not trusted.
    if (filePart && filePart.data) {
        const guard = await guardUpload(filePart.data, { declaredMime: filePart.contentType, filename: filePart.filename });
        if (!guard.ok) throw new AppError(guard.code, guard.message, guard.status);
    }
    const fields = {};
    for (const p of parts) {
        if (!p.filename && p.name) fields[p.name] = p.data.toString('utf8').trim();
    }
    return { filePart, fields };
}

function resolveMediaType(value) {
    const t = (value || 'image').toLowerCase();
    if (!MEDIA_TYPES.has(t)) throw new AppError('VALIDATION_ERROR', `Invalid mediaType: ${value}`, 400);
    return t;
}

exports.listMedia = async (req, res, next) => {
    try {
        const rows = await mediaService.listMedia(req.params.storeId, req.params.productId);
        return sendSuccess(req, res, rows);
    } catch (err) { return next(err); }
};

exports.uploadMedia = async (req, res, next) => {
    try {
        const { filePart, fields } = await readUpload(req);
        const media = await mediaService.uploadMedia(req.params.storeId, req.params.productId, {
            filePart,
            mediaType: resolveMediaType(fields.mediaType),
            variantId: fields.variantId || null,
            altText: fields.altText || null,
            isFeatured: fields.isFeatured === 'true',
        });
        return sendSuccess(req, res, media, 201);
    } catch (err) { return next(err); }
};

exports.replaceMedia = async (req, res, next) => {
    try {
        const { filePart, fields } = await readUpload(req);
        const media = await mediaService.replaceMedia(req.params.storeId, req.params.productId, req.params.mediaId, {
            filePart,
            mediaType: fields.mediaType ? resolveMediaType(fields.mediaType) : undefined,
        });
        return sendSuccess(req, res, media);
    } catch (err) { return next(err); }
};

exports.updateMedia = async (req, res, next) => {
    try {
        const media = await mediaService.updateMedia(req.params.storeId, req.params.productId, req.params.mediaId, req.validated);
        return sendSuccess(req, res, media);
    } catch (err) { return next(err); }
};

exports.setFeatured = async (req, res, next) => {
    try {
        const rows = await mediaService.setFeatured(req.params.storeId, req.params.productId, req.params.mediaId);
        return sendSuccess(req, res, rows);
    } catch (err) { return next(err); }
};

exports.reorderMedia = async (req, res, next) => {
    try {
        const rows = await mediaService.reorderMedia(req.params.storeId, req.params.productId, req.validated.orderedIds);
        return sendSuccess(req, res, rows);
    } catch (err) { return next(err); }
};

exports.deleteMedia = async (req, res, next) => {
    try {
        const out = await mediaService.deleteMedia(req.params.storeId, req.params.productId, req.params.mediaId);
        return sendSuccess(req, res, out);
    } catch (err) { return next(err); }
};
