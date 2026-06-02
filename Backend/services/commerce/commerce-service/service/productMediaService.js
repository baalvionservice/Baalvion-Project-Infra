'use strict';
/**
 * Product media library — upload, ordering, featured selection, replace and
 * delete of images/video/documents attached to a product.
 *
 * Storage backends (MEDIA_DRIVER):
 *   - 'local' (default): filesystem under commerce-service/uploads, served
 *     statically at /uploads. Zero-config dev fallback.
 *   - 'minio' | 's3':   S3-compatible object storage via utils/s3Client.
 *
 * EVERY operation is scoped to (storeId, productId): the product must belong to
 * the caller's store (enforced before any media row is read or written), so a
 * store operator can never attach to or mutate another store's product media.
 * Route-level RBAC (loadStoreRole + requireStoreRole('content_editor')) gates
 * who may mutate; this layer enforces the data boundary.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { CommerceProduct, CommerceProductMedia, sequelize, Op } = require('../models');
const { AppError } = require('../utils/errors');
const s3 = require('../utils/s3Client');
const thumb = require('../utils/imageThumb');

const DRIVER      = (process.env.MEDIA_DRIVER || 'local').toLowerCase();
const BUCKET      = process.env.S3_BUCKET || 'commerce-media';
const UPLOAD_DIR  = path.resolve(__dirname, '..', 'uploads');
const PUBLIC_BASE = (process.env.COMMERCE_PUBLIC_URL || `http://localhost:${process.env.PORT || 3012}`).replace(/\/$/, '');
const MAX_BYTES   = Number(process.env.MEDIA_MAX_BYTES || 25 * 1024 * 1024);

const EXT_BY_MIME = {
    'image/jpeg': '.jpg', 'image/png': '.png', 'image/gif': '.gif', 'image/webp': '.webp',
    'image/svg+xml': '.svg', 'image/avif': '.avif', 'video/mp4': '.mp4', 'video/webm': '.webm',
    'application/pdf': '.pdf',
};
const IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/avif']);

// ── store/product boundary ─────────────────────────────────────────────────────
async function assertProductInStore(storeId, productId) {
    const product = await CommerceProduct.findOne({ where: { id: productId, storeId }, attributes: ['id'] });
    if (!product) throw new AppError('NOT_FOUND', 'Product not found in this store', 404);
}

// ── storage driver ─────────────────────────────────────────────────────────────
function ensureLocalDir(dir) { fs.mkdirSync(dir, { recursive: true }); }

/** Persist a buffer under `key`; returns the public URL. */
async function putObject(key, buffer, contentType) {
    if (DRIVER === 'minio' || DRIVER === 's3') {
        await s3.ensureBucket(BUCKET);
        await s3.putObject(BUCKET, key, buffer, contentType);
        return s3.publicUrl(BUCKET, key);
    }
    const full = path.join(UPLOAD_DIR, key);
    ensureLocalDir(path.dirname(full));
    fs.writeFileSync(full, buffer);
    return `${PUBLIC_BASE}/uploads/${key}`;
}

/** Recover the storage key from a URL this service previously produced. */
function keyFromUrl(url) {
    if (!url) return null;
    const marker = (DRIVER === 'minio' || DRIVER === 's3') ? `/${BUCKET}/` : '/uploads/';
    const idx = url.indexOf(marker);
    if (idx === -1) return null;
    try { return decodeURIComponent(url.slice(idx + marker.length)); }
    catch { return url.slice(idx + marker.length); }
}

async function removeObjectByUrl(url) {
    const key = keyFromUrl(url);
    if (!key) return;
    try {
        if (DRIVER === 'minio' || DRIVER === 's3') await s3.deleteObject(BUCKET, key);
        else fs.unlinkSync(path.join(UPLOAD_DIR, key));
    } catch { /* already gone — best effort */ }
}

// ── validation + key building ───────────────────────────────────────────────────
function validateFile(filePart, mediaType) {
    if (!filePart || !filePart.filename) throw new AppError('VALIDATION_ERROR', 'No file uploaded (expected field "file")', 400);
    if (!filePart.data || !filePart.data.length) throw new AppError('VALIDATION_ERROR', 'Uploaded file is empty', 400);
    if (filePart.data.length > MAX_BYTES) throw new AppError('PAYLOAD_TOO_LARGE', `File exceeds size limit (${Math.floor(MAX_BYTES / 1024 / 1024)}MB)`, 413);
    const mime = filePart.contentType || 'application/octet-stream';
    if (mediaType === 'image' && !IMAGE_MIMES.has(mime)) {
        throw new AppError('UNSUPPORTED_MEDIA_TYPE', `Unsupported image type: ${mime}`, 415);
    }
    return mime;
}

function buildKey(productId, ext) {
    return `commerce/products/${productId}/${crypto.randomUUID()}${ext}`;
}

// ── queries ─────────────────────────────────────────────────────────────────────
async function listMedia(storeId, productId) {
    await assertProductInStore(storeId, productId);
    const rows = await CommerceProductMedia.findAll({
        where: { productId },
        order: [['sortOrder', 'ASC'], ['createdAt', 'ASC']],
    });
    return rows.map((r) => r.toJSON());
}

async function loadMedia(storeId, productId, mediaId) {
    await assertProductInStore(storeId, productId);
    const media = await CommerceProductMedia.findOne({ where: { id: mediaId, productId } });
    if (!media) throw new AppError('NOT_FOUND', 'Media not found for this product', 404);
    return media;
}

// ── mutations ─────────────────────────────────────────────────────────────────--
/**
 * Store an uploaded file and create its media row (appended after existing media).
 * Generates a thumbnail for raster images; falls back to the original otherwise.
 * The first image uploaded for a product becomes featured automatically.
 */
async function uploadMedia(storeId, productId, { filePart, mediaType = 'image', variantId = null, altText = null, isFeatured = false }) {
    await assertProductInStore(storeId, productId);
    const mime = validateFile(filePart, mediaType);
    const ext = path.extname(filePart.filename) || EXT_BY_MIME[mime] || '';

    const key = buildKey(productId, ext);
    const url = await putObject(key, filePart.data, mime);

    // Thumbnail: real resize when an engine is available, else reuse the original.
    let thumbnailUrl = url;
    if (mediaType === 'image') {
        const thumbBuf = await thumb.generateThumbnail(filePart.data, mime);
        if (thumbBuf) {
            const thumbKey = key.replace(/(\.[^.]+)?$/, '_thumb.jpg');
            thumbnailUrl = await putObject(thumbKey, thumbBuf, 'image/jpeg');
        }
    }

    return sequelize.transaction(async (t) => {
        const maxRow = await CommerceProductMedia.findOne({
            where: { productId }, order: [['sortOrder', 'DESC']], transaction: t, lock: t.LOCK.UPDATE,
        });
        const nextSort = maxRow ? Number(maxRow.sortOrder) + 1 : 0;
        const count = await CommerceProductMedia.count({ where: { productId }, transaction: t });
        const makeFeatured = isFeatured || count === 0; // first image is featured by default

        if (makeFeatured) {
            await CommerceProductMedia.update({ isFeatured: false }, { where: { productId }, transaction: t });
        }
        const row = await CommerceProductMedia.create({
            productId, variantId: variantId || null, mediaType,
            url, thumbnailUrl, altText: altText || null, sortOrder: nextSort, isFeatured: makeFeatured,
        }, { transaction: t });
        return row.toJSON();
    });
}

/** Patch alt text / variant binding and (optionally) feature this item. */
async function updateMedia(storeId, productId, mediaId, { altText, variantId, isFeatured }) {
    const media = await loadMedia(storeId, productId, mediaId);
    return sequelize.transaction(async (t) => {
        if (isFeatured === true) {
            await CommerceProductMedia.update({ isFeatured: false }, { where: { productId }, transaction: t });
        }
        const patch = {};
        if (altText !== undefined) patch.altText = altText;
        if (variantId !== undefined) patch.variantId = variantId || null;
        if (isFeatured !== undefined) patch.isFeatured = !!isFeatured;
        await media.update(patch, { transaction: t });
        return media.toJSON();
    });
}

/** Make exactly one media item the featured one for the product. */
async function setFeatured(storeId, productId, mediaId) {
    await loadMedia(storeId, productId, mediaId);
    return sequelize.transaction(async (t) => {
        await CommerceProductMedia.update({ isFeatured: false }, { where: { productId }, transaction: t });
        await CommerceProductMedia.update({ isFeatured: true }, { where: { id: mediaId, productId }, transaction: t });
        const rows = await CommerceProductMedia.findAll({ where: { productId }, order: [['sortOrder', 'ASC']], transaction: t });
        return rows.map((r) => r.toJSON());
    });
}

/**
 * Reorder a product's media. `orderedIds` is the full list of this product's
 * media ids in the desired order; any id not belonging to the product is
 * rejected (no cross-product reordering).
 */
async function reorderMedia(storeId, productId, orderedIds) {
    await assertProductInStore(storeId, productId);
    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
        throw new AppError('VALIDATION_ERROR', 'orderedIds must be a non-empty array', 400);
    }
    const existing = await CommerceProductMedia.findAll({ where: { productId }, attributes: ['id'] });
    const existingIds = new Set(existing.map((r) => r.id));
    for (const id of orderedIds) {
        if (!existingIds.has(id)) throw new AppError('VALIDATION_ERROR', `Media ${id} does not belong to this product`, 400);
    }
    return sequelize.transaction(async (t) => {
        for (let i = 0; i < orderedIds.length; i += 1) {
            await CommerceProductMedia.update({ sortOrder: i }, { where: { id: orderedIds[i], productId }, transaction: t });
        }
        const rows = await CommerceProductMedia.findAll({ where: { productId }, order: [['sortOrder', 'ASC']], transaction: t });
        return rows.map((r) => r.toJSON());
    });
}

/** Replace a media item's binary in place (keeps id/sortOrder/featured). */
async function replaceMedia(storeId, productId, mediaId, { filePart, mediaType }) {
    const media = await loadMedia(storeId, productId, mediaId);
    const type = mediaType || media.mediaType;
    const mime = validateFile(filePart, type);
    const ext = path.extname(filePart.filename) || EXT_BY_MIME[mime] || '';

    const key = buildKey(productId, ext);
    const url = await putObject(key, filePart.data, mime);
    let thumbnailUrl = url;
    if (type === 'image') {
        const thumbBuf = await thumb.generateThumbnail(filePart.data, mime);
        if (thumbBuf) {
            const thumbKey = key.replace(/(\.[^.]+)?$/, '_thumb.jpg');
            thumbnailUrl = await putObject(thumbKey, thumbBuf, 'image/jpeg');
        }
    }
    const oldUrl = media.url;
    const oldThumb = media.thumbnailUrl;
    await media.update({ url, thumbnailUrl, mediaType: type });
    // Best-effort cleanup of the superseded objects after the row points elsewhere.
    await removeObjectByUrl(oldUrl);
    if (oldThumb && oldThumb !== oldUrl) await removeObjectByUrl(oldThumb);
    return media.toJSON();
}

/**
 * Delete a media item and its stored objects. If the featured item is removed,
 * the next item (by sortOrder) is promoted to featured so a product always has
 * a hero image when any media remains.
 */
async function deleteMedia(storeId, productId, mediaId) {
    const media = await loadMedia(storeId, productId, mediaId);
    const { url, thumbnailUrl, isFeatured } = media;

    await sequelize.transaction(async (t) => {
        await media.destroy({ transaction: t });
        if (isFeatured) {
            const next = await CommerceProductMedia.findOne({ where: { productId }, order: [['sortOrder', 'ASC']], transaction: t });
            if (next) await next.update({ isFeatured: true }, { transaction: t });
        }
    });

    await removeObjectByUrl(url);
    if (thumbnailUrl && thumbnailUrl !== url) await removeObjectByUrl(thumbnailUrl);
    return { id: mediaId, deleted: true };
}

module.exports = {
    listMedia, uploadMedia, updateMedia, setFeatured, reorderMedia, replaceMedia, deleteMedia,
    UPLOAD_DIR, DRIVER,
};
