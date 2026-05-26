'use strict';
const db = require('../models');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { recordAudit } = require('../utils/audit');

// Reserved query keys that control paging/sorting rather than filtering.
const CONTROL_KEYS = new Set(['page', 'limit', 'sortBy', 'order', 'sort', 'offset']);
// Free-text search keys: substring (contains) match across the document.
const SEARCH_KEYS = ['search', 'q', 'query'];

// Caller's tenant (from the token when present; demo tenant otherwise).
const tenantOf = (req) => (req.auth && req.auth.tenantId) || 'T-DEMO';

// Flatten a stored row into the document shape the frontend expects:
// the JSONB payload at top level + id/timestamps injected.
const flatten = (row) => ({
    ...(row.data || {}),
    id: row.id,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
});

const listDocs = async (req, res, next) => {
    try {
        const collection = req.params.collection;
        const rows = await db.Collection.findAll({
            where: { collection, tenantId: tenantOf(req) }, // tenant isolation
            order: [['createdAt', 'DESC']],
            limit: Number(req.query.limit) || 500,
        });
        let docs = rows.map(flatten);

        for (const [k, v] of Object.entries(req.query)) {
            if (CONTROL_KEYS.has(k) || SEARCH_KEYS.includes(k) || v === undefined || v === '') continue;
            docs = docs.filter((d) => String(d[k]) === String(v));
        }

        const term = (SEARCH_KEYS.map((k) => req.query[k]).find(Boolean) || '').toString().trim().toLowerCase();
        if (term) {
            docs = docs.filter((d) =>
                Object.values(d).some(
                    (val) => (typeof val === 'string' || typeof val === 'number')
                        && String(val).toLowerCase().includes(term),
                ),
            );
        }

        return sendSuccess(req, res, docs);
    } catch (err) {
        return next(err);
    }
};

const getDoc = async (req, res, next) => {
    try {
        const row = await db.Collection.findByPk(req.params.id);
        if (!row || row.collection !== req.params.collection || row.tenantId !== tenantOf(req)) {
            return next(new AppError('NOT_FOUND', 'Document not found', 404));
        }
        return sendSuccess(req, res, flatten(row));
    } catch (err) {
        return next(err);
    }
};

const createDoc = async (req, res, next) => {
    try {
        const { id, createdAt, updatedAt, tenantId, ...data } = req.body || {};
        const tenant = tenantOf(req);
        const row = await db.Collection.create({ collection: req.params.collection, tenantId: tenant, data });
        await recordAudit({ actorId: req.auth?.userId, action: 'collection.create', resourceType: req.params.collection, resourceId: row.id, tenantId: tenant });
        return sendSuccess(req, res, flatten(row), 201);
    } catch (err) {
        return next(err);
    }
};

const updateDoc = async (req, res, next) => {
    try {
        const row = await db.Collection.findByPk(req.params.id);
        if (!row || row.collection !== req.params.collection || row.tenantId !== tenantOf(req)) {
            return next(new AppError('NOT_FOUND', 'Document not found', 404));
        }
        const { id, createdAt, updatedAt, tenantId, ...patch } = req.body || {};
        await row.update({ data: { ...(row.data || {}), ...patch } });
        await recordAudit({ actorId: req.auth?.userId, action: 'collection.update', resourceType: req.params.collection, resourceId: row.id, tenantId: tenantOf(req) });
        return sendSuccess(req, res, flatten(row));
    } catch (err) {
        return next(err);
    }
};

const deleteDoc = async (req, res, next) => {
    try {
        const row = await db.Collection.findByPk(req.params.id);
        if (!row || row.collection !== req.params.collection || row.tenantId !== tenantOf(req)) {
            return next(new AppError('NOT_FOUND', 'Document not found', 404));
        }
        await row.destroy();
        await recordAudit({ actorId: req.auth?.userId, action: 'collection.delete', resourceType: req.params.collection, resourceId: req.params.id, tenantId: tenantOf(req) });
        return sendSuccess(req, res, { deleted: true });
    } catch (err) {
        return next(err);
    }
};

module.exports = { listDocs, getDoc, createDoc, updateDoc, deleteDoc };
