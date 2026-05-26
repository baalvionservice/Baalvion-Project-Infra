'use strict';
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');

const listDocuments = async (req, res, next) => {
    try {
        const { org_id, category, page = 1, limit = 20 } = req.query;
        const where = {};
        if (org_id) where.org_id = org_id;
        if (category) where.category = category;

        // Public access: only is_public=true
        if (!req.user) {
            where.is_public = true;
        }

        const offset = (Number(page) - 1) * Number(limit);
        const { count, rows } = await db.IrDocument.findAndCountAll({
            where,
            order: [['created_at', 'DESC']],
            limit: Number(limit),
            offset,
        });

        return sendPaginated(req, res, {
            items: rows,
            pagination: {
                total: count,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(count / Number(limit)),
            },
        });
    } catch (err) { return next(err); }
};

const createDocument = async (req, res, next) => {
    try {
        const doc = await db.IrDocument.create({ ...req.body, created_by: req.user.id });
        return sendSuccess(req, res, doc, 201);
    } catch (err) { return next(err); }
};

const getDocument = async (req, res, next) => {
    try {
        const doc = await db.IrDocument.findByPk(req.params.id);
        if (!doc) return next(new AppError('NOT_FOUND', 'Document not found', 404));

        // Public: only is_public
        if (!req.user && !doc.is_public) {
            return next(new AppError('NOT_FOUND', 'Document not found', 404));
        }

        await doc.increment('downloads_count');
        await doc.reload();

        return sendSuccess(req, res, doc);
    } catch (err) { return next(err); }
};

const updateDocument = async (req, res, next) => {
    try {
        const doc = await db.IrDocument.findByPk(req.params.id);
        if (!doc) return next(new AppError('NOT_FOUND', 'Document not found', 404));
        await doc.update(req.body);
        return sendSuccess(req, res, doc);
    } catch (err) { return next(err); }
};

const deleteDocument = async (req, res, next) => {
    try {
        const doc = await db.IrDocument.findByPk(req.params.id);
        if (!doc) return next(new AppError('NOT_FOUND', 'Document not found', 404));
        await doc.destroy();
        return sendSuccess(req, res, { deleted: true });
    } catch (err) { return next(err); }
};

module.exports = { listDocuments, createDocument, getDocument, updateDocument, deleteDocument };
