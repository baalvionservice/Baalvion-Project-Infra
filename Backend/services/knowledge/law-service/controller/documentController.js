'use strict';
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const storage = require('../service/storage');

const listDocuments = async (req, res, next) => {
    try {
        const { page = 1, case_id, category } = req.query;
        // Cap pagination limit to prevent large data dumps.
        const limit = Math.min(Number(req.query.limit) || 20, 100);
        const where = { owner_id: String(req.user.id) };
        if (case_id) where.case_id = Number(case_id);
        if (category) where.category = category;
        const offset = (Number(page) - 1) * limit;
        const { count, rows } = await db.Document.findAndCountAll({
            where,
            order: [['created_at', 'DESC']],
            limit,
            offset,
        });
        return sendPaginated(req, res, {
            items: rows,
            pagination: { total: count, page: Number(page), limit, totalPages: Math.ceil(count / limit) },
        });
    } catch (err) { return next(err); }
};

const getDocument = async (req, res, next) => {
    try {
        const doc = await db.Document.findByPk(req.params.id);
        if (!doc) return next(new AppError('NOT_FOUND', 'Document not found', 404));
        if (doc.owner_id !== String(req.user.id) && !req.user.isAdmin) {
            return next(new AppError('FORBIDDEN', 'Not authorised', 403));
        }
        return sendSuccess(req, res, doc);
    } catch (err) { return next(err); }
};

// Reject URLs with dangerous or internal-only schemes.
// Only https:// and http:// external URLs (and relative storage keys with no scheme) are accepted.
const BLOCKED_URL_SCHEMES = /^(javascript|data|vbscript|file|ftp|blob):/i;
const INTERNAL_HOSTS = /^https?:\/\/(localhost|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|192\.168\.\d+\.\d+)(:\d+)?/i;

const validateDocumentUrl = (url) => {
    if (!url) return true; // presence validated separately
    if (BLOCKED_URL_SCHEMES.test(url)) return false;
    if (INTERNAL_HOSTS.test(url)) return false;
    return true;
};

const uploadDocument = async (req, res, next) => {
    try {
        const { name, type, url, size, category, case_id } = req.body;
        if (!name || !url) return next(new AppError('BAD_REQUEST', 'name and url are required', 400));
        // Validate URL scheme — reject javascript:, data:, internal network addresses, etc.
        if (!validateDocumentUrl(url)) {
            return next(new AppError('BAD_REQUEST', 'Invalid document URL scheme', 400));
        }
        const doc = await db.Document.create({
            owner_id: String(req.user.id),
            case_id: case_id ? Number(case_id) : null,
            name,
            type: type || 'application/octet-stream',
            url,
            size: size ? Number(size) : 0,
            category: category || 'other',
        });
        return sendSuccess(req, res, doc, 201);
    } catch (err) { return next(err); }
};

// Real binary upload: multipart file -> MinIO object -> document record holding the key.
const uploadFile = async (req, res, next) => {
    try {
        if (!req.file) return next(new AppError('BAD_REQUEST', 'file is required (multipart field "file")', 400));
        const { case_id, category } = req.body;
        const safeName = (req.file.originalname || 'file').replace(/[^\w.\-]+/g, '_');
        const key = `${req.user.id}/${Date.now()}-${safeName}`;
        await storage.putObject(key, req.file.buffer, req.file.mimetype);
        const doc = await db.Document.create({
            owner_id: String(req.user.id),
            case_id: case_id ? Number(case_id) : null,
            name: req.file.originalname,
            type: req.file.mimetype || 'application/octet-stream',
            url: key, // object key; resolved to a presigned URL on download
            size: req.file.size || 0,
            category: category || 'other',
        });
        return sendSuccess(req, res, doc, 201);
    } catch (err) { return next(err); }
};

// Returns a short-lived presigned download URL (browser-reachable) for the object.
const downloadDocument = async (req, res, next) => {
    try {
        const doc = await db.Document.findByPk(req.params.id);
        if (!doc) return next(new AppError('NOT_FOUND', 'Document not found', 404));
        if (doc.owner_id !== String(req.user.id) && !req.user.isAdmin) {
            return next(new AppError('FORBIDDEN', 'Not authorised', 403));
        }
        if (!storage.isStorageKey(doc.url)) {
            return next(new AppError('NOT_FOUND', 'No stored file for this document', 404));
        }
        const url = await storage.presignedGetUrl(doc.url, 3600);
        return sendSuccess(req, res, { url, name: doc.name, type: doc.type });
    } catch (err) { return next(err); }
};

const deleteDocument = async (req, res, next) => {
    try {
        const doc = await db.Document.findByPk(req.params.id);
        if (!doc) return next(new AppError('NOT_FOUND', 'Document not found', 404));
        if (doc.owner_id !== String(req.user.id) && !req.user.isAdmin) {
            return next(new AppError('FORBIDDEN', 'Not authorised', 403));
        }
        if (storage.isStorageKey(doc.url)) await storage.deleteObject(doc.url);
        await doc.destroy();
        return sendSuccess(req, res, { deleted: true });
    } catch (err) { return next(err); }
};

module.exports = { listDocuments, getDocument, uploadDocument, uploadFile, downloadDocument, deleteDocument };
