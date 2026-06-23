'use strict';
const crypto = require('crypto');
const { z } = require('zod');
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { DocEvents, emitSafe } = require('../platform/events');
const { createSchema, listQuerySchema, signSchema } = require('../validation/documentSchemas');

const tenantOf = (req) => (req.auth && (req.auth.tenantId || req.auth.orgId)) || null;

// F2: every read/load runs inside a tenant transaction so the RLS GUC is set.
const listDocuments = async (req, res, next) => {
    try {
        const { orderId, docType, status, page, limit } = listQuerySchema.parse(req.query || {});
        const where = {};
        if (orderId) where.order_id = orderId;
        if (docType) where.doc_type = docType;
        if (status) where.status = status;
        const offset = (page - 1) * limit;
        const { count, rows } = await db.sequelize.transaction((t) =>
            db.Document.findAndCountAll({ where, limit, offset, order: [['created_at', 'DESC']], transaction: t }));
        return sendPaginated(req, res, { items: rows, total: count, page, limit });
    } catch (err) { return next(err instanceof z.ZodError ? new AppError('BAD_REQUEST', err.errors[0].message, 422) : err); }
};

const getDocument = async (req, res, next) => {
    try {
        const d = await db.sequelize.transaction((t) => db.Document.findByPk(req.params.id, {
            include: [{ model: db.Signature, as: 'signatures' }], transaction: t,
        }));
        if (!d) return next(new AppError('NOT_FOUND', 'Document not found', 404));
        return sendSuccess(req, res, d);
    } catch (err) { return next(err); }
};

const createDraft = async (req, res, next) => {
    try {
        const b = createSchema.parse(req.body || {});
        const org_id = tenantOf(req);
        if (!org_id) return next(new AppError('TENANT_REQUIRED', 'Tenant context required', 400));
        const doc = await db.sequelize.transaction((t) => db.Document.create({
            org_id, order_id: b.order_id, doc_type: b.doc_type, status: 'draft', metadata: b.payload,
        }, { transaction: t }));
        return sendSuccess(req, res, doc, 201);
    } catch (err) { return next(err instanceof z.ZodError ? new AppError('BAD_REQUEST', err.errors[0].message, 422) : err); }
};

// Render + freeze: compute checksum over the issued snapshot, set storage_key, lock.
const issueDocument = async (req, res, next) => {
    try {
        const doc = await db.sequelize.transaction(async (t) => {
            const row = await db.Document.findByPk(req.params.id, { transaction: t });
            if (!row) throw new AppError('NOT_FOUND', 'Document not found', 404);
            if (row.status !== 'draft') throw new AppError('CONFLICT', `cannot issue a ${row.status} document`, 409);
            const snapshot = JSON.stringify({ docType: row.doc_type, orderId: row.order_id, metadata: row.metadata, version: row.version });
            const checksum = crypto.createHash('sha256').update(snapshot).digest('hex');
            const storage_key = `${row.org_id}/${row.doc_type}/${row.id}-v${row.version}.json`;
            await row.update({ status: 'issued', checksum, storage_key, issued_at: new Date(), issued_by: req.auth.userId }, { transaction: t });
            // TODO: persist `snapshot` to S3 (config.storage) — WORM at V2.
            return row;
        });
        emitSafe(DocEvents.ISSUED, { documentId: doc.id, orgId: doc.org_id, orderId: doc.order_id, docType: doc.doc_type, version: doc.version, checksum: doc.checksum }, { tenantId: doc.org_id });
        return sendSuccess(req, res, doc);
    } catch (err) { return next(err); }
};

const signDocument = async (req, res, next) => {
    try {
        const { signature } = signSchema.parse(req.body || {});
        const doc = await db.sequelize.transaction(async (t) => {
            const row = await db.Document.findByPk(req.params.id, { transaction: t });
            if (!row) throw new AppError('NOT_FOUND', 'Document not found', 404);
            if (row.status !== 'issued') throw new AppError('CONFLICT', 'only issued documents can be signed', 409);
            await db.Signature.create({ org_id: row.org_id, document_id: row.id, signer_id: req.auth.userId, signature }, { transaction: t });
            await row.update({ status: 'signed' }, { transaction: t });
            return row;
        });
        return sendSuccess(req, res, doc);
    } catch (err) { return next(err instanceof z.ZodError ? new AppError('BAD_REQUEST', err.errors[0].message, 422) : err); }
};

const voidDocument = async (req, res, next) => {
    try {
        const doc = await db.sequelize.transaction(async (t) => {
            const row = await db.Document.findByPk(req.params.id, { transaction: t });
            if (!row) throw new AppError('NOT_FOUND', 'Document not found', 404);
            await row.update({ status: 'void' }, { transaction: t });
            return row;
        });
        return sendSuccess(req, res, doc);
    } catch (err) { return next(err); }
};

const orderDossier = async (req, res, next) => {
    try {
        const docs = await db.sequelize.transaction((t) =>
            db.Document.findAll({ where: { order_id: req.params.orderId }, order: [['doc_type', 'ASC']], transaction: t }));
        return sendSuccess(req, res, { orderId: req.params.orderId, documents: docs });
    } catch (err) { return next(err); }
};

module.exports = { listDocuments, getDocument, createDraft, issueDocument, signDocument, voidDocument, orderDossier };
