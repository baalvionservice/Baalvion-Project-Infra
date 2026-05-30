'use strict';
/**
 * CMS media library service.
 *
 * Dev storage backend = local filesystem (cms-service/uploads), served statically
 * by index.js at /uploads. Swapping to MinIO/S3 later only touches persist()/remove()
 * and the URL builder. Everything is org-scoped via the caller's token.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { QueryTypes } = require('sequelize');
const { sequelize } = require('../models');
const { AppError } = require('../utils/errors');
const s3 = require('../utils/s3Client');

// Storage driver: 'minio' (S3 object storage) or 'local' (filesystem, dev fallback).
const DRIVER      = (process.env.MEDIA_DRIVER || 'local').toLowerCase();
const BUCKET      = process.env.S3_BUCKET || 'cms-media';
const UPLOAD_DIR  = path.resolve(__dirname, '..', 'uploads');
const PUBLIC_BASE = (process.env.CMS_PUBLIC_URL || 'http://localhost:3018').replace(/\/$/, '');
const MAX_BYTES   = Number(process.env.MEDIA_MAX_BYTES || 50 * 1024 * 1024);
const EXT_BY_MIME = {
    'image/jpeg': '.jpg', 'image/png': '.png', 'image/gif': '.gif', 'image/webp': '.webp',
    'image/svg+xml': '.svg', 'application/pdf': '.pdf', 'video/mp4': '.mp4',
};

function ensureDir() { fs.mkdirSync(UPLOAD_DIR, { recursive: true }); }
function sel(sql, replacements) { return sequelize.query(sql, { replacements, type: QueryTypes.SELECT }); }

function shape(r) {
    return {
        id: r.id, filename: r.filename, originalName: r.original_name,
        mimeType: r.mime_type, size: Number(r.size), url: r.url,
        thumbnailUrl: r.thumbnail_url || null, folderId: r.folder_id || null,
        altText: r.alt_text || null, width: r.width || null, height: r.height || null,
        optimizedAt: r.optimized_at || null, uploadedBy: r.uploaded_by ? Number(r.uploaded_by) : null,
        createdAt: r.created_at,
    };
}

// ── Files ────────────────────────────────────────────────────────────────────
async function saveUpload({ filePart, folderId = null, orgId, uploadedBy }) {
    if (!filePart || !filePart.filename) throw new AppError('VALIDATION_ERROR', 'No file uploaded (expected field "file")', 400);
    if (!filePart.data || !filePart.data.length) throw new AppError('VALIDATION_ERROR', 'Uploaded file is empty', 400);
    if (filePart.data.length > MAX_BYTES) throw new AppError('PAYLOAD_TOO_LARGE', 'File exceeds size limit', 413);

    const mime = filePart.contentType || 'application/octet-stream';
    const ext  = path.extname(filePart.filename) || EXT_BY_MIME[mime] || '';
    const key  = `${crypto.randomUUID()}${ext}`;

    let url;
    if (DRIVER === 'minio') {
        await s3.ensureBucket(BUCKET);
        await s3.putObject(BUCKET, key, filePart.data, mime);
        url = s3.publicUrl(BUCKET, key);
    } else {
        ensureDir();
        fs.writeFileSync(path.join(UPLOAD_DIR, key), filePart.data);
        url = `${PUBLIC_BASE}/uploads/${key}`;
    }
    const [row] = await sel(`
        INSERT INTO cms.cms_media_assets
            (org_id, folder_id, storage_key, filename, original_name, mime_type, size, url, uploaded_by)
        VALUES (:orgId, :folderId, :key, :filename, :originalName, :mime, :size, :url, :uploadedBy)
        RETURNING *`,
        { orgId: orgId || null, folderId, key, filename: key, originalName: filePart.filename,
          mime, size: filePart.data.length, url, uploadedBy: uploadedBy || null });
    return shape(row);
}

async function listFiles({ orgId, page = 1, limit = 20, offset = 0, folderId, mimeType }) {
    const where = `WHERE (:orgId::uuid IS NULL OR org_id = :orgId)
        AND (:folderId::uuid IS NULL OR folder_id = :folderId)
        AND (:mimeType::text IS NULL OR mime_type ILIKE :mimeLike)`;
    const repl = { orgId: orgId || null, folderId: folderId || null,
        mimeType: mimeType || null, mimeLike: mimeType ? `${mimeType}%` : null, limit, offset };
    const rows = await sel(`SELECT * FROM cms.cms_media_assets ${where} ORDER BY created_at DESC LIMIT :limit OFFSET :offset`, repl);
    const [{ count }] = await sel(`SELECT COUNT(*)::int AS count FROM cms.cms_media_assets ${where}`, repl);
    return { rows: rows.map(shape), count };
}

async function getFile(orgId, id) {
    const [row] = await sel(`SELECT * FROM cms.cms_media_assets WHERE id = :id AND (:orgId::uuid IS NULL OR org_id = :orgId)`, { id, orgId: orgId || null });
    if (!row) throw new AppError('NOT_FOUND', 'Media file not found', 404);
    return shape(row);
}

async function updateFile(orgId, id, { altText, filename }) {
    await getFile(orgId, id);
    const [row] = await sel(`
        UPDATE cms.cms_media_assets
           SET alt_text = COALESCE(:altText, alt_text),
               original_name = COALESCE(:filename, original_name),
               updated_at = now()
         WHERE id = :id RETURNING *`,
        { id, altText: altText ?? null, filename: filename ?? null });
    return shape(row);
}

async function deleteFile(orgId, id) {
    const [row] = await sel(`SELECT storage_key FROM cms.cms_media_assets WHERE id = :id AND (:orgId::uuid IS NULL OR org_id = :orgId)`, { id, orgId: orgId || null });
    if (!row) throw new AppError('NOT_FOUND', 'Media file not found', 404);
    await sel(`DELETE FROM cms.cms_media_assets WHERE id = :id`, { id });
    if (DRIVER === 'minio') { try { await s3.deleteObject(BUCKET, row.storage_key); } catch { /* already gone */ } }
    else { try { fs.unlinkSync(path.join(UPLOAD_DIR, row.storage_key)); } catch { /* already gone */ } }
    return { id };
}

async function bulkDelete(orgId, ids = []) {
    let deleted = 0;
    for (const id of ids) {
        try { await deleteFile(orgId, id); deleted += 1; } catch { /* skip missing */ }
    }
    return { deleted };
}

async function signedUrl(orgId, id) {
    const file = await getFile(orgId, id); // 404s if not in org
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    if (DRIVER === 'minio') {
        const [row] = await sel(`SELECT storage_key FROM cms.cms_media_assets WHERE id = :id`, { id });
        return { url: s3.presignedGetUrl(BUCKET, row.storage_key, 3600), expiresAt };
    }
    // Local filesystem serving is already public; return the stable URL.
    return { url: file.url, expiresAt };
}

// ── Folders ──────────────────────────────────────────────────────────────────
async function listFolders(orgId) {
    return sel(`
        SELECT f.id, f.name, f.parent_id AS "parentId",
               (SELECT COUNT(*)::int FROM cms.cms_media_assets a WHERE a.folder_id = f.id) AS "fileCount",
               f.created_at AS "createdAt"
          FROM cms.cms_media_folders f
         WHERE (:orgId::uuid IS NULL OR f.org_id = :orgId)
         ORDER BY f.name ASC`, { orgId: orgId || null });
}

async function createFolder(orgId, { name, parentId = null }, createdBy) {
    if (!name || !String(name).trim()) throw new AppError('VALIDATION_ERROR', 'name is required', 400);
    const [row] = await sel(`
        INSERT INTO cms.cms_media_folders (org_id, name, parent_id, created_by)
        VALUES (:orgId, :name, :parentId, :createdBy) RETURNING id`,
        { orgId: orgId || null, name: String(name).trim(), parentId, createdBy: createdBy || null });
    return (await listFolders(orgId)).find((f) => f.id === row.id);
}

async function deleteFolder(orgId, id) {
    const rows = await sel(`DELETE FROM cms.cms_media_folders WHERE id = :id AND (:orgId::uuid IS NULL OR org_id = :orgId) RETURNING id`, { id, orgId: orgId || null });
    if (!rows.length) throw new AppError('NOT_FOUND', 'Folder not found', 404);
    return { id };
}

module.exports = {
    saveUpload, listFiles, getFile, updateFile, deleteFile, bulkDelete, signedUrl,
    listFolders, createFolder, deleteFolder,
    UPLOAD_DIR,
};
