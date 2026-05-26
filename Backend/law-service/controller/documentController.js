'use strict';
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');

const listDocuments = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, case_id, category } = req.query;
        const where = { owner_id: String(req.user.id) };
        if (case_id) where.case_id = Number(case_id);
        if (category) where.category = category;
        const offset = (Number(page) - 1) * Number(limit);
        const { count, rows } = await db.Document.findAndCountAll({
            where,
            order: [['created_at', 'DESC']],
            limit: Number(limit),
            offset,
        });
        return sendPaginated(req, res, {
            items: rows,
            pagination: { total: count, page: Number(page), limit: Number(limit), totalPages: Math.ceil(count / Number(limit)) },
        });
    } catch (err) { return next(err); }
};

const getDocument = async (req, res, next) => {
    try {
        const doc = await db.Document.findByPk(req.params.id);
        if (!doc) return next(new AppError('NOT_FOUND', 'Document not found', 404));
        if (doc.owner_id !== String(req.user.id) && req.user.role !== 'admin') {
            return next(new AppError('FORBIDDEN', 'Not authorised', 403));
        }
        return sendSuccess(req, res, doc);
    } catch (err) { return next(err); }
};

const uploadDocument = async (req, res, next) => {
    try {
        const { name, type, url, size, category, case_id } = req.body;
        if (!name || !url) return next(new AppError('BAD_REQUEST', 'name and url are required', 400));
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

const deleteDocument = async (req, res, next) => {
    try {
        const doc = await db.Document.findByPk(req.params.id);
        if (!doc) return next(new AppError('NOT_FOUND', 'Document not found', 404));
        if (doc.owner_id !== String(req.user.id) && req.user.role !== 'admin') {
            return next(new AppError('FORBIDDEN', 'Not authorised', 403));
        }
        await doc.destroy();
        return sendSuccess(req, res, { deleted: true });
    } catch (err) { return next(err); }
};

module.exports = { listDocuments, getDocument, uploadDocument, deleteDocument };
